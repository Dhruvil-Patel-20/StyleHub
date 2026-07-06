const router = require('express').Router();
const supabase = require('../supabase');
const { protect, admin } = require('../middleware/auth');

// Self delete account
router.delete('/me', protect, async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users
router.get('/', protect, admin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user role
router.put('/:id/role', protect, admin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['client', 'seller', 'admin'].includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', req.params.id)
      .select('id, name, email, role')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
