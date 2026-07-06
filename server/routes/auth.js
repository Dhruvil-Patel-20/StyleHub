const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
const { protect } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'client' } = req.body;

    if (!['client', 'seller', 'admin'].includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashed, role })
      .select('id, name, email, role')
      .single();

    if (error) throw error;
    res.status(201).json({ ...user, token: generateToken(user.id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid credentials' });

    const { password: _, ...safeUser } = user;
    res.json({ ...safeUser, token: generateToken(user.id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

router.put('/profile', protect, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.password) updates.password = await bcrypt.hash(req.body.password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, name, email, role')
      .single();

    if (error) throw error;
    res.json({ ...user, token: generateToken(user.id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/wishlist/:productId', protect, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('wishlist').eq('id', req.user.id).single();
    let wishlist = user.wishlist || [];
    const idx = wishlist.indexOf(req.params.productId);
    if (idx > -1) wishlist.splice(idx, 1);
    else wishlist.push(req.params.productId);

    await supabase.from('users').update({ wishlist }).eq('id', req.user.id);
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
