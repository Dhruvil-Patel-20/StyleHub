const router = require('express').Router();
const supabase = require('../supabase');
const { protect, admin, seller } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, size, color, search, sort, page = 1, limit = 12, subCategory, minRating, inStock } = req.query;

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (category) query = query.eq('category', category);
    if (subCategory) query = query.ilike('sub_category', subCategory);
    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));
    if (size) query = query.contains('sizes', [size]);
    if (color) query = query.contains('colors', [color]);
    if (search) query = query.ilike('name', `%${search}%`);
    if (minRating) query = query.gte('rating', Number(minRating));
    if (inStock === 'true') query = query.gt('stock', 0);

    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else if (sort === 'rating') query = query.order('rating', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const from = (page - 1) * limit;
    query = query.range(from, from + Number(limit) - 1);

    const { data: products, count, error } = await query;
    if (error) throw error;

    res.json({ products, total: count, pages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('featured', true).limit(8);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: get only their own products
router.get('/myproducts', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, reviews(*)')
      .eq('seller_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, reviews(*)')
      .eq('id', req.params.id)
      .single();
    if (error || !product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, seller, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, subCategory, stock, featured, original_price, is_returnable, return_window_days, return_policy_note } = req.body;
    const fileImages = req.files?.map(f => `/uploads/${f.filename}`) || [];
    const urlImages = req.body.imageUrls ? JSON.parse(req.body.imageUrls) : [];
    const images = [...fileImages, ...urlImages];
    const sizes = req.body.sizes ? req.body.sizes.split(',').map(s => s.trim()) : [];
    const colors = req.body.colors ? req.body.colors.split(',').map(c => c.trim()) : [];

    const { data, error } = await supabase
      .from('products')
      .insert({
        name, description, category,
        sub_category: subCategory,
        price: Number(price),
        stock: Number(stock),
        original_price: original_price ? Number(original_price) : null,
        featured: featured === 'true' || featured === true,
        images, sizes, colors,
        seller_id: req.user.id,
        is_returnable: is_returnable === 'false' || is_returnable === false ? false : true,
        return_window_days: return_window_days ? Number(return_window_days) : 7,
        return_policy_note: return_policy_note || null,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, seller, upload.array('images', 5), async (req, res) => {
  try {
    const { data: product } = await supabase.from('products').select('seller_id').eq('id', req.params.id).single();
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorized to update this product' });

    const { name, description, price, category, subCategory, stock, featured, original_price, is_returnable, return_window_days, return_policy_note } = req.body;
    const fileImages = req.files?.map(f => `/uploads/${f.filename}`) || [];
    const urlImages = req.body.imageUrls ? JSON.parse(req.body.imageUrls) : [];
    const updates = {
      name, description, category,
      sub_category: subCategory,
      price: Number(price),
      stock: Number(stock),
      original_price: original_price ? Number(original_price) : null,
      featured: featured === 'true' || featured === true,
      sizes: req.body.sizes ? req.body.sizes.split(',').map(s => s.trim()) : [],
      colors: req.body.colors ? req.body.colors.split(',').map(c => c.trim()) : [],
      is_returnable: is_returnable === 'false' || is_returnable === false ? false : true,
      return_window_days: return_window_days ? Number(return_window_days) : 7,
      return_policy_note: return_policy_note || null,
    };
    if (fileImages.length || urlImages.length) updates.images = [...fileImages, ...urlImages];

    const { data, error } = await supabase.from('products').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, seller, async (req, res) => {
  try {
    const { data: product } = await supabase.from('products').select('seller_id').eq('id', req.params.id).single();
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorized to delete this product' });

    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Check if already reviewed
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    if (existing) return res.status(400).json({ message: 'Already reviewed' });

    await supabase.from('reviews').insert({
      product_id: req.params.id,
      user_id: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    });

    // Recalculate rating
    const { data: reviews } = await supabase.from('reviews').select('rating').eq('product_id', req.params.id);
    const avgRating = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;

    await supabase.from('products').update({ rating: avgRating, num_reviews: reviews.length }).eq('id', req.params.id);

    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
