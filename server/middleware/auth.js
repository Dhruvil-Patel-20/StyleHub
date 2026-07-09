const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.error(`🔴 [AUTH PROTECT] No token provided for ${req.method} ${req.path}`);
    return res.status(401).json({ message: 'Not authorized' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, wishlist')
      .eq('id', decoded.id)
      .single();
    if (error || !user) {
      console.error(`🔴 [AUTH PROTECT] User not found: ${decoded.id}`);
      return res.status(401).json({ message: 'User not found' });
    }
    console.log(`✅ [AUTH PROTECT] Authenticated user: ${user.id} (${user.role})`);
    req.user = user;
    next();
  } catch (err) {
    console.error(`🔴 [AUTH PROTECT] Token verification failed:`, err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

const admin = (req, res, next) => {
  if (req.user?.role === 'admin') {
    console.log(`✅ [AUTH ADMIN] Admin access granted to ${req.user.id}`);
    return next();
  }
  console.error(`🔴 [AUTH ADMIN] Unauthorized access attempted by user ${req.user?.id} with role ${req.user?.role}`);
  res.status(403).json({ message: 'Admin access required' });
};

const seller = (req, res, next) => {
  if (req.user?.role === 'seller' || req.user?.role === 'admin') {
    console.log(`✅ [AUTH SELLER] Seller/Admin access granted to ${req.user.id}`);
    return next();
  }
  console.error(`🔴 [AUTH SELLER] Unauthorized access attempted by user ${req.user?.id} with role ${req.user?.role}`);
  res.status(403).json({ message: 'Seller access required' });
};

module.exports = { protect, admin, seller };
