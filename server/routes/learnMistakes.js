const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getQuestionFeedback } = require('../utils/ai');

// === קבלת משוב AI על שאלה שגויה ספציפית ===
// POST /api/learn/feedback
router.post('/feedback', protect, async (req, res) => {
  try {
    const { question, userAnswer, correctAnswer } = req.body;

    if (!question || !userAnswer || !correctAnswer) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // קריאה ל-AI לקבלת משוב למידה
    const feedback = await getQuestionFeedback(question, userAnswer, correctAnswer);

    res.json({ 
      success: true,
      feedback 
    });

  } catch (err) {
    console.error('Error getting AI feedback:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
});

module.exports = router;
