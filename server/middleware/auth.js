const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, wishlist')
      .eq('id', decoded.id)
      .single();
    if (error || !user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const admin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Admin access required' });
};

const seller = (req, res, next) => {
  if (req.user?.role === 'seller' || req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Seller access required' });
};

module.exports = { protect, admin, seller };
