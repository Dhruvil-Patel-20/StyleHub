const router = require('express').Router();
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
const { protect, admin } = require('../middleware/auth');

const getTokenUserId = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
};

const canUseCoupon = async (coupon, userId, amount, deliveryCost) => {
  if (coupon.one_per_user && !userId) {
    return { valid: false, message: 'Authentication required for this coupon' };
  }
  if (coupon.one_per_user && userId) {
    const { data: usages, error } = await supabase
      .from('coupon_usages')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('user_id', userId)
      .limit(1);
    if (error) return { valid: false, message: 'Coupon check failed' };
    if (usages?.length) return { valid: false, message: 'Coupon may only be used once per user' };
  }

  if (coupon.first_order_only && !userId) {
    return { valid: false, message: 'Authentication required for this coupon' };
  }
  if (coupon.first_order_only && userId) {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    if (error) return { valid: false, message: 'Coupon check failed' };
    if (orders?.length) return { valid: false, message: 'Coupon valid only on first order' };
  }

  if (coupon.max_per_user && userId) {
    const { data: usages, error } = await supabase
      .from('coupon_usages')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('user_id', userId);
    if (error) return { valid: false, message: 'Coupon check failed' };
    if (usages.length >= coupon.max_per_user) return { valid: false, message: `Coupon may only be used ${coupon.max_per_user} times per user` };
  }

  return { valid: true };
};

const computeCouponDiscount = (coupon, amount, deliveryCost) => {
  const subtotal = Number(amount || 0);
  const shipping = Number(deliveryCost || 0);
  let discount = 0;

  if (coupon.type === 'percent') {
    discount = Math.round((subtotal * Number(coupon.value || 0)) / 100 * 100) / 100;
  } else if (coupon.type === 'fixed') {
    discount = Math.min(Number(coupon.value || 0), subtotal);
  } else if (coupon.type === 'free_shipping') {
    return shipping;
  }

  if (coupon.free_shipping && shipping > 0) {
    discount += shipping;
  }

  return Math.round(discount * 100) / 100;
};

const validateCoupon = async (req, res) => {
  try {
    const code = (req.query.code || '').toString().trim().toUpperCase();
    const amount = Number(req.query.amount || 0);
    const deliveryCost = Number(req.query.deliveryCost || 0);
    if (!code) return res.status(400).json({ message: 'code is required' });

    const now = new Date().toISOString();
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .single();
    if (error || !coupon) return res.status(404).json({ message: 'Coupon not found' });

    if (!coupon.is_active) return res.status(400).json({ message: 'Coupon is inactive' });
    if (coupon.start_date && now < coupon.start_date) return res.status(400).json({ message: 'Coupon not started yet' });
    if (coupon.end_date && now > coupon.end_date) return res.status(400).json({ message: 'Coupon expired' });
    if (coupon.min_order_value && amount < Number(coupon.min_order_value)) return res.status(400).json({ message: `Minimum order value $${coupon.min_order_value} required` });
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return res.status(400).json({ message: 'Coupon usage limit reached' });

    const userId = getTokenUserId(req);
    const userCheck = await canUseCoupon(coupon, userId, amount, deliveryCost);
    if (!userCheck.valid) return res.status(400).json({ message: userCheck.message });

    const discount = computeCouponDiscount(coupon, amount, deliveryCost);
    res.json({ coupon: { ...coupon, code: coupon.code }, discount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

router.get('/validate', validateCoupon);

router.get('/all', protect, admin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const { code, description, type, value, min_order_value, start_date, end_date, max_uses, max_per_user, one_per_user, first_order_only, free_shipping, is_active } = req.body;
    if (!code || !type || !['percent', 'fixed', 'free_shipping'].includes(type)) return res.status(400).json({ message: 'code and valid type are required' });
    const normalized = code.toString().trim().toUpperCase();
    const { data, error } = await supabase.from('coupons').insert([{
      code: normalized,
      description,
      type,
      value: value || 0,
      min_order_value: min_order_value || null,
      start_date,
      end_date,
      max_uses: max_uses || null,
      max_per_user: max_per_user || null,
      one_per_user: one_per_user ?? false,
      first_order_only: first_order_only ?? false,
      free_shipping: free_shipping ?? false,
      is_active: is_active ?? true,
    }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('coupons').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/toggle', protect, admin, async (req, res) => {
  try {
    const { data: coupon, error: fetchErr } = await supabase.from('coupons').select('is_active').eq('id', req.params.id).single();
    if (fetchErr || !coupon) return res.status(404).json({ message: 'Coupon not found' });
    const { data, error } = await supabase.from('coupons').update({ is_active: !coupon.is_active, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const { error } = await supabase.from('coupons').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
