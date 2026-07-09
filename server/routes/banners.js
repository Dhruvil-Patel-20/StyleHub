const router = require('express').Router();
const supabase = require('../supabase');
const { protect, admin } = require('../middleware/auth');

const extractPercent = (text = '') => {
  const match = String(text).match(/(\d+)\s*%/);
  return match ? Number(match[1]) : 0;
};

const syncBannerCoupon = async (banner) => {
  if (!banner.coupon_code) return;
  const code = banner.coupon_code.trim().toUpperCase();
  try {
    const { data: existing } = await supabase.from('coupons').select('id').eq('code', code).single();
    if (existing) {
      await supabase.from('coupons').update({
        is_active: banner.is_active ?? true,
        start_date: banner.start_date,
        end_date: banner.end_date,
        description: banner.discount_text || banner.title || null,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('coupons').insert({
        code,
        description: banner.discount_text || banner.title || null,
        type: extractPercent(banner.discount_text) > 0 ? 'percent' : 'fixed',
        value: extractPercent(banner.discount_text),
        is_active: banner.is_active ?? true,
        start_date: banner.start_date,
        end_date: banner.end_date,
      });
    }
  } catch (e) {
    console.warn('Failed to sync banner coupon:', e.message);
  }
};

// Public: get all active banners
router.get('/', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get all banners
router.get('/all', protect, admin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: create banner
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, subtitle, image_url, discount_text, coupon_code, redirect_url, start_date, end_date, is_active, bg_color, text_color } = req.body;
    if (!title || !start_date || !end_date) return res.status(400).json({ message: 'title, start_date and end_date are required' });
    const { data, error } = await supabase
      .from('banners')
      .insert({ title, subtitle, image_url, discount_text, coupon_code, redirect_url, start_date, end_date, is_active: is_active ?? true, bg_color, text_color })
      .select().single();
    if (error) throw error;
    await syncBannerCoupon(data);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: update banner
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { title, subtitle, image_url, discount_text, coupon_code, redirect_url, start_date, end_date, is_active, bg_color, text_color } = req.body;
    const { data, error } = await supabase
      .from('banners')
      .update({ title, subtitle, image_url, discount_text, coupon_code, redirect_url, start_date, end_date, is_active, bg_color, text_color, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    await syncBannerCoupon(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: toggle active
router.patch('/:id/toggle', protect, admin, async (req, res) => {
  try {
    const { data: banner, error: fetchErr } = await supabase.from('banners').select('*').eq('id', req.params.id).single();
    if (fetchErr || !banner) return res.status(404).json({ message: 'Banner not found' });
    const { data, error } = await supabase.from('banners').update({ is_active: !banner.is_active, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    await syncBannerCoupon(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: delete banner
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const { error } = await supabase.from('banners').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
