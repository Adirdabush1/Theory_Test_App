const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// === פונקציה ליצירת JWT ===
// generateToken יוצר טוקן עם מזהה המשתמש   
// expiresIn מגדיר תוקף של 30 יום
// process.env.JWT_SECRET משתמש במשתנה סביבה לסודיות הטוקן  
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// === הרשמה ===
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, fullName, department } = req.body;

    // בדיקת קיום משתמש
    // findOne מחפש משתמש קיים לפי האימייל   
    // return 400 אם המשתמש כבר קיים
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // יצירת משתמש חדש
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      department,
      isVerified: true,
    });

    // בדיקת יצירת המשתמש
    console.log('User object returned from DB:', user);

    // בדיקה אילו שדות חסרים
    // field בודק אם הוא קיים במשתמש במסד הנתונים
    ['id', 'username', 'email', 'role'].forEach(field => {
      if (user[field] === undefined) {
        console.warn(`⚠️ Missing field: ${field}`);
      }
    });

    res.status(201).json({
      _id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      message: 'User created successfully',
    });

  } catch (err) {
    console.error('Signup unexpected error:', err);
    res.status(500).json({ message: `Server error ${err.message}`, error: err.message });
  }
});

// === התחברות ===
// login בודק את האימייל והסיסמה
// בודק את האימייל והסיסמה מול מסד הנתונים על ידי matchPassword
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      userPoints: user.userPoints,
      token: generateToken(user.id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// === שחזור סיסמה ===
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  // resetToken יצירת טוקן לאיפוס סיסמה
  const resetToken = user.getResetPasswordToken();

  // save שמירת המשתמש עם הטוקן החדש
  await user.save({ validateBeforeSave: false });

  // יצירת קישור לאיפוס סיסמה
  // resetUrl מכיל את הקישור לאיפוס סיסמה
  // req.protocol ו-req.get('host') משמשים לבניית ה-URL המלא
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

  // כאן אין שליחת מייל, רק מחזירים את הקישור
  res.json({ message: 'Password reset link', resetUrl });
});

// === איפוס סיסמה ===
router.put('/reset-password/:token', async (req, res) => {
  const resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // חיפוש משתמש לפי טוקן ותוקף
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  // return 400 אם הטוקן לא תקין או שפג תוקפו
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  // עדכון סיסמה חדשה
  // resetPasswordToken ו-resetPasswordExpire איפוס הטוקן ותוקפו כדי למנוע שימוש חוזר
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ message: 'Password reset successful' });
});

// === פרופיל משתמש ===
// get פרטי משתמש
// protect middleware מגן על הראוט
router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// === עדכון פרופיל משתמש ===
// put עדכון פרטי משתמש
router.put('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) return res.status(404).json({ message: 'User not found' });

  // עדכון שדות משתמש
  user.username = req.body.username || user.username;
  user.fullName = req.body.fullName || user.fullName;
  user.department = req.body.department || user.department;
  user.profilePicture = req.body.profilePicture || user.profilePicture;

  // עדכון סיסמה אם נשלחה
  if (req.body.password) {
    user.password = req.body.password;
  }

  // שמירת המשתמש המעודכן
  // json מחזיר את פרטי המשתמש המעודכנים ללא הסיסמה
  const updatedUser = await user.save();
  res.json({
    _id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email,
    fullName: updatedUser.fullName,
    department: updatedUser.department,
    profilePicture: updatedUser.profilePicture,
    role: updatedUser.role,
  });
});

// === רשימת כל המשתמשים (Admin בלבד) ===
// יוצר ראוט שמחזיר את כל המשתמשים
router.get('/all', protect, adminOnly, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// === עדכון role (Admin בלבד) ===
// יוצר ראוט לעדכון role של משתמש(Admin בלבד)
// user.role בודק אם המשתמש הוא אדמין
router.put('/role/:id', protect, adminOnly, async (req, res) => {
  const { role } = req.body;

  // בדיקה שה-role תקין
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role value' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.role = role || user.role;
  await user.save();

  // מחזיר הודעה על הצלחה
  res.json({ message: `User role updated to ${user.role}` });
});

module.exports = router;
