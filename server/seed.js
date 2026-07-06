require('dotenv').config();
const supabase = require('./supabase');

const products = [
  // ── MEN ── (all returnable, 7 days)
  {
    name: 'Classic Slim Fit Shirt',
    description: 'A timeless slim-fit cotton shirt perfect for both casual and formal occasions. Breathable fabric with a modern cut.',
    price: 34.99, original_price: 54.99, category: 'men', sub_category: 'Shirts',
    images: [
      'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=600&q=80',
      'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=600&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['White', 'Blue', 'Black'],
    stock: 80, featured: true, rating: 4.5, num_reviews: 120,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Item must be unworn with original tags attached.',
  },
  {
    name: 'Slim Chino Pants',
    description: 'Versatile slim-fit chino pants made from stretch cotton blend. Great for office or weekend wear.',
    price: 49.99, original_price: 74.99, category: 'men', sub_category: 'Pants',
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80',
    ],
    sizes: ['30', '32', '34', '36', '38'], colors: ['Khaki', 'Navy', 'Olive'],
    stock: 60, featured: false, rating: 4.3, num_reviews: 85,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Must be unworn and in original packaging.',
  },
  {
    name: "Men's Casual Hoodie",
    description: 'Soft fleece hoodie with kangaroo pocket and adjustable drawstring. Perfect for layering in cooler weather.',
    price: 44.99, original_price: 64.99, category: 'men', sub_category: 'Hoodies',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80',
      'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=600&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL'], colors: ['Gray', 'Black', 'Navy'],
    stock: 55, featured: true, rating: 4.6, num_reviews: 200,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Unworn with tags. Washed items cannot be returned.',
  },

  // ── WOMEN ── (all returnable, 7 days)
  {
    name: 'Floral Wrap Dress',
    description: 'Elegant wrap dress with a beautiful floral print. Flattering silhouette suitable for any occasion.',
    price: 59.99, original_price: 89.99, category: 'women', sub_category: 'Dresses',
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['Floral Pink', 'Floral Blue'],
    stock: 45, featured: true, rating: 4.7, num_reviews: 310,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Must be unworn with all original tags intact.',
  },
  {
    name: 'High-Waist Skinny Jeans',
    description: 'Stretchy high-waist skinny jeans that hug your curves perfectly. Durable denim with a comfortable fit.',
    price: 54.99, original_price: 79.99, category: 'women', sub_category: 'Jeans',
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80',
      'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=600&q=80',
    ],
    sizes: ['24', '26', '28', '30', '32'], colors: ['Blue', 'Black', 'White'],
    stock: 70, featured: false, rating: 4.4, num_reviews: 175,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Unworn and unaltered items only.',
  },
  {
    name: "Women's Blazer Jacket",
    description: 'Tailored blazer jacket with a modern fit. Perfect for professional settings or smart-casual outfits.',
    price: 89.99, original_price: 129.99, category: 'women', sub_category: 'Jackets',
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4b4d7a?w=600&q=80',
      'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=600&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L'], colors: ['Black', 'Beige', 'Navy'],
    stock: 35, featured: true, rating: 4.8, num_reviews: 95,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Must be in original condition with tags and packaging.',
  },

  // ── KIDS ── (all returnable, 7 days)
  {
    name: 'Kids Dinosaur T-Shirt',
    description: 'Fun and colorful dinosaur print t-shirt for kids. Made from 100% soft cotton, machine washable.',
    price: 19.99, original_price: 29.99, category: 'kids', sub_category: 'T-Shirts',
    images: [
      'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80',
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80',
    ],
    sizes: ['2T', '3T', '4T', '5T', '6'], colors: ['Green', 'Blue', 'Red'],
    stock: 100, featured: false, rating: 4.6, num_reviews: 220,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Unworn with original tags. No returns on washed items.',
  },
  {
    name: 'Kids Denim Overalls',
    description: 'Adorable denim overalls with adjustable straps and multiple pockets. Durable and easy to wear.',
    price: 29.99, original_price: 44.99, category: 'kids', sub_category: 'Bottoms',
    images: [
      'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&q=80',
      'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600&q=80',
    ],
    sizes: ['2T', '3T', '4T', '5T'], colors: ['Blue', 'Light Blue'],
    stock: 65, featured: false, rating: 4.5, num_reviews: 140,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Must be unworn and in original packaging.',
  },
  {
    name: 'Kids Puffer Jacket',
    description: 'Warm and lightweight puffer jacket for kids. Water-resistant outer shell with cozy inner lining.',
    price: 39.99, original_price: 59.99, category: 'kids', sub_category: 'Jackets',
    images: [
      'https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=600&q=80',
      'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=600&q=80',
    ],
    sizes: ['4', '6', '8', '10', '12'], colors: ['Red', 'Blue', 'Pink'],
    stock: 50, featured: true, rating: 4.7, num_reviews: 88,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Unworn with tags. Must include original packaging.',
  },

  // ── FOOTWEAR ── (returnable, 7 days, unworn only)
  {
    name: 'Classic White Sneakers',
    description: 'Clean and minimalist white leather sneakers. Versatile design that pairs with any outfit.',
    price: 79.99, original_price: 109.99, category: 'footwear', sub_category: 'Sneakers',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80',
    ],
    sizes: ['6', '7', '8', '9', '10', '11', '12'], colors: ['White', 'White/Black'],
    stock: 90, featured: true, rating: 4.8, num_reviews: 450,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Unworn with original box. Sole must be clean.',
  },
  {
    name: 'Leather Chelsea Boots',
    description: 'Premium leather Chelsea boots with elastic side panels. Sleek design for a polished look.',
    price: 129.99, original_price: 179.99, category: 'footwear', sub_category: 'Boots',
    images: [
      'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&q=80',
      'https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=600&q=80',
    ],
    sizes: ['7', '8', '9', '10', '11'], colors: ['Black', 'Brown', 'Tan'],
    stock: 40, featured: false, rating: 4.6, num_reviews: 190,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Must be unworn with original box and dust bag.',
  },
  {
    name: 'Running Shoes Pro',
    description: 'High-performance running shoes with cushioned sole and breathable mesh upper. Built for speed and comfort.',
    price: 99.99, original_price: 139.99, category: 'footwear', sub_category: 'Running',
    images: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80',
    ],
    sizes: ['6', '7', '8', '9', '10', '11', '12'], colors: ['Black/Red', 'Blue/White', 'Gray'],
    stock: 75, featured: true, rating: 4.7, num_reviews: 320,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Unworn only. Shoes used outdoors cannot be returned.',
  },

  // ── JEWELRY ── (non-returnable — hygiene & fine item policy)
  {
    name: 'Gold Hoop Earrings',
    description: 'Classic 18k gold-plated hoop earrings. Lightweight and hypoallergenic, perfect for everyday wear.',
    price: 24.99, original_price: 39.99, category: 'jewelry', sub_category: 'Earrings',
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80',
    ],
    sizes: ['One Size'], colors: ['Gold', 'Silver', 'Rose Gold'],
    stock: 120, featured: false, rating: 4.5, num_reviews: 280,
    is_returnable: false, return_window_days: null, return_policy_note: 'Non-returnable for hygiene reasons.',
  },
  {
    name: 'Pearl Pendant Necklace',
    description: 'Elegant freshwater pearl pendant on a sterling silver chain. A timeless piece for any occasion.',
    price: 49.99, original_price: 74.99, category: 'jewelry', sub_category: 'Necklaces',
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
    ],
    sizes: ['One Size'], colors: ['White Pearl', 'Pink Pearl'],
    stock: 60, featured: true, rating: 4.9, num_reviews: 165,
    is_returnable: false, return_window_days: null, return_policy_note: 'Non-returnable. Fine jewelry cannot be resold once opened.',
  },
  {
    name: 'Minimalist Bracelet Set',
    description: 'Set of 3 delicate minimalist bracelets in gold, silver, and rose gold. Stack them or wear individually.',
    price: 34.99, original_price: 54.99, category: 'jewelry', sub_category: 'Bracelets',
    images: [
      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80',
      'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&q=80',
    ],
    sizes: ['One Size'], colors: ['Gold', 'Silver', 'Rose Gold'],
    stock: 85, featured: false, rating: 4.4, num_reviews: 210,
    is_returnable: false, return_window_days: null, return_policy_note: 'Non-returnable for hygiene and safety reasons.',
  },

  // ── ACCESSORIES ── (wallet & bag returnable, sunglasses not)
  {
    name: 'Leather Bifold Wallet',
    description: 'Slim genuine leather bifold wallet with RFID blocking. Fits cards and cash without the bulk.',
    price: 39.99, original_price: 59.99, category: 'accessories', sub_category: 'Wallets',
    images: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80',
      'https://images.unsplash.com/photo-1612902456551-b8d77c3e8b0e?w=600&q=80',
    ],
    sizes: ['One Size'], colors: ['Black', 'Brown', 'Tan'],
    stock: 95, featured: false, rating: 4.6, num_reviews: 340,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Unused and in original packaging only.',
  },
  {
    name: 'Canvas Tote Bag',
    description: 'Durable canvas tote bag with inner pockets and reinforced handles. Perfect for shopping or daily use.',
    price: 29.99, original_price: null, category: 'accessories', sub_category: 'Bags',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80',
    ],
    sizes: ['One Size'], colors: ['Natural', 'Black', 'Navy'],
    stock: 110, featured: false, rating: 4.3, num_reviews: 195,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Unused and in original condition with tags.',
  },
  {
    name: 'Classic Aviator Sunglasses',
    description: 'Iconic aviator sunglasses with UV400 protection and metal frame. Timeless style for any face shape.',
    price: 44.99, original_price: 64.99, category: 'accessories', sub_category: 'Sunglasses',
    images: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80',
    ],
    sizes: ['One Size'], colors: ['Gold/Brown', 'Silver/Gray', 'Black'],
    stock: 70, featured: true, rating: 4.5, num_reviews: 260,
    is_returnable: false, return_window_days: null, return_policy_note: 'Non-returnable once the protective film is removed.',
  },

  // ── SPORTSWEAR ── (all returnable, 7 days)
  {
    name: 'Performance Dry-Fit T-Shirt',
    description: 'Moisture-wicking dry-fit t-shirt for intense workouts. Lightweight, breathable, and quick-drying.',
    price: 29.99, original_price: 44.99, category: 'sportswear', sub_category: 'T-Shirts',
    images: [
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Black', 'White', 'Blue', 'Red'],
    stock: 130, featured: false, rating: 4.5, num_reviews: 380,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Unworn and unwashed with original tags.',
  },
  {
    name: 'Compression Leggings',
    description: 'High-waist compression leggings with 4-way stretch. Ideal for yoga, running, or gym sessions.',
    price: 49.99, original_price: 69.99, category: 'sportswear', sub_category: 'Leggings',
    images: [
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80',
      'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['Black', 'Gray', 'Navy', 'Purple'],
    stock: 85, featured: true, rating: 4.7, num_reviews: 420,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Unworn with tags. Used activewear cannot be returned.',
  },
  {
    name: 'Zip-Up Track Jacket',
    description: 'Lightweight zip-up track jacket with side pockets. Great for warm-ups or casual streetwear.',
    price: 59.99, original_price: 84.99, category: 'sportswear', sub_category: 'Jackets',
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Navy', 'Red'],
    stock: 60, featured: false, rating: 4.4, num_reviews: 155,
    is_returnable: true, return_window_days: 7, return_policy_note: 'Must be unworn with original tags and packaging.',
  },

  // ── BEAUTY ── (all non-returnable — opened/used products)
  {
    name: 'Vitamin C Brightening Serum',
    description: 'Potent 20% Vitamin C serum that brightens skin, reduces dark spots, and boosts collagen production.',
    price: 34.99, original_price: 54.99, category: 'beauty', sub_category: 'Skincare',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80',
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
    ],
    sizes: ['30ml', '50ml'], colors: ['One Color'],
    stock: 100, featured: true, rating: 4.8, num_reviews: 510,
    is_returnable: false, return_window_days: null, return_policy_note: 'Non-returnable. Skincare products cannot be returned once opened.',
  },
  {
    name: 'Matte Lipstick Collection',
    description: 'Long-lasting matte lipstick with rich pigmentation. Comfortable formula that stays on all day.',
    price: 19.99, original_price: 29.99, category: 'beauty', sub_category: 'Makeup',
    images: [
      'https://images.unsplash.com/photo-1586495777744-4e6232bf2176?w=600&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80',
    ],
    sizes: ['One Size'], colors: ['Red', 'Nude', 'Pink', 'Berry', 'Coral'],
    stock: 150, featured: false, rating: 4.6, num_reviews: 390,
    is_returnable: false, return_window_days: null, return_policy_note: 'Non-returnable for hygiene reasons. Makeup cannot be resold.',
  },
  {
    name: 'Hydrating Face Moisturizer',
    description: 'Lightweight daily moisturizer with hyaluronic acid and SPF 30. Keeps skin hydrated and protected all day.',
    price: 27.99, original_price: 42.99, category: 'beauty', sub_category: 'Skincare',
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80',
    ],
    sizes: ['50ml', '100ml'], colors: ['One Color'],
    stock: 90, featured: true, rating: 4.7, num_reviews: 275,
    is_returnable: false, return_window_days: null, return_policy_note: 'Non-returnable. Opened skincare items are not eligible for return.',
  },
];

async function seed() {
  console.log('Removing old seeded products...');
  const { error: delErr } = await supabase
    .from('products')
    .delete()
    .is('seller_id', null);
  if (delErr) console.warn('Cleanup warning:', delErr.message);

  console.log(`Inserting ${products.length} products...`);
  const { error } = await supabase.from('products').insert(products);
  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
  console.log(`✅ Seeded ${products.length} products across 8 categories.`);
  process.exit(0);
}

seed();
