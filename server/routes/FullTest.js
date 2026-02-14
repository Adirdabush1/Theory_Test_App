const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { askAI } = require('../utils/ai'); // חובה

// POST /api/test/submit
router.post('/submit', protect, async (req, res) => {
  try {
    const { answers, score, totalQuestions, timeTaken, improvements } = req.body;

    const wrongAnswers = totalQuestions - score;
    const passed = wrongAnswers <= 4;

    // --- 1) שליפת המשתמש ---
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });

    // --- 2) יצירת prompt ל-AI ---
    const aiPrompt = `
משתמש בשם ${user.fullname} סיים מבחן תרגול.

נתונים:
- שאלות: ${totalQuestions}
- תשובות נכונות: ${score}
- טעויות: ${wrongAnswers}
- זמן: ${timeTaken}ms

פירוט טעויות:
${answers
      .map(
        (a, i) =>
          `שאלה ${i + 1}: אתה ענית "${a.userAnswer}", והנכון הוא "${a.correctAnswer}".`
      )
      .join('\n')}

שפר את הניתוח ותן למשתמש:
1. פירוט על במה הוא טוב
2. איפה הוא חלש
3. מה ללמוד מחדש
4. טיפים לשיפור
5. משפט מוטיבציה אישי
`;

    // --- 3) קבלת ניתוח AI ---
    const aiInsights = await askAI(aiPrompt);

    // --- 4) שמירת המבחן ב-User ---
    user.test.push({
      score,
      totalQuestions,
      wrongAnswers,
      timeTaken,
      passed,
      answered: answers,
      improvements,
      aiInsights, // ← שומר את הפלט של AI
    });

    // --- 5) עדכון נקודות המשתמש ---
    if (user.userPoints === undefined) user.userPoints = 0;
    user.userPoints += score;

    await user.save();

    // --- 6) החזרת נתונים ל-Frontend ---
    res.json({
      message: 'Test saved',
      test: user.test,
      aiInsights,
    });

  } catch (err) {
    console.error('Error saving test:', err);
    res.status(500).json({ message: 'שגיאה בשמירת המבחן' });
  }
});

module.exports = router;
