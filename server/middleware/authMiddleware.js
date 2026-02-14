const jwt = require('jsonwebtoken');
const User = require('../models/User');

// בדיקת JWT
// protect הוא middleware שמגן על ראוטים
const protect = async (req, res, next) => {
  let token;

  // בדיקה האם יש טוקן בכותרות    
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

// רק אדמין
// Middleware to allow only admin users
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};

module.exports = { protect, adminOnly };
