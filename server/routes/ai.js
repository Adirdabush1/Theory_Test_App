const express = require("express");
const router = express.Router();
const { askAI } = require("../utils/ai");

router.post("/ask", async (req, res) => {
  try {
    const { prompt } = req.body;
    const answer = await askAI(prompt);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: "Failed to get AI response" });
  }
});


// router.post("/submit", async (req, res) => {
//   try {
//     const { answers, score, totalQuestions, timeTaken } = req.body;

//     // בניית prompt עבור ה-AI
//     const prompt = `
// משתמש סיים מבחן. הנה הנתונים:

// זמן כולל: ${timeTaken / 1000} שניות
// ציון: ${score} מתוך ${totalQuestions}

// תוצאות מפורטות:
// ${answers.map(a => `
// שאלה: ${a.questionText}
// תשובה משתמש: ${a.userAnswer}
// תשובה נכונה: ${a.correctAnswer}
// נכון?: ${a.isCorrect}
// זמן לשאלה: ${a.timeSpent / 1000} שניות
// `).join("\n")}

// אנליזה:
// 1. במה המשתמש התקשה?
// 2. אילו נושאים כדאי לחזור עליהם?
// 3. טעויות חוזרות.
// 4. המלצות פרקטיות לשיפור.
// 5. הצעות לתרגול נוסף או מבחן מותאם אישית.
// `;

//     const aiInsights = await askAI(prompt);

//     // מחזיר את ניתוח ה-AI למשתמש
//     res.json({ success: true, aiInsights });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to process test results" });
//   }
// });

module.exports = router;
