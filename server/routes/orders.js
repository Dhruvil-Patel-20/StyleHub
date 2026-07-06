const router = require('express').Router();
const supabase = require('../supabase');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: req.user.id,
        items: req.body.items,
        shipping_address: req.body.shippingAddress,
        payment_method: req.body.paymentMethod || 'stripe',
        delivery_method: req.body.deliveryMethod || 'standard',
        total_price: req.body.totalPrice,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/myorders', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: get orders containing seller's products — MUST be before /:id
router.get('/sellerorders', protect, async (req, res) => {
  try {
    const { data: sellerProducts, error: pErr } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', req.user.id);
    if (pErr) throw pErr;

    const sellerProductIds = (sellerProducts || []).map(p => p.id);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const filtered = sellerProductIds.length
      ? orders.filter(o => o.items?.some(item => sellerProductIds.includes(item.productId)))
      : [];
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get all orders — MUST be before /:id
router.get('/all', protect, admin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, users(name, email)')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ message: 'Order not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/pay', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ is_paid: true, paid_at: new Date().toISOString(), payment_result: req.body, status: 'processing' })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: update order status
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const updates = { status: req.body.status };
    if (req.body.status === 'delivered') {
      updates.is_delivered = true;
      updates.delivered_at = new Date().toISOString();
    }
    const { data, error } = await supabase.from('orders').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
