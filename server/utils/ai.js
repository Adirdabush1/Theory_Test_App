const openai = require("../config/openai");

async function askAI(prompt) {
  try {
    // Use a broadly available chat model. Change to a different model if you have access.
    const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
    });

    // Safely extract text from various possible response shapes
    if (response && response.choices && response.choices.length > 0) {
      const choice = response.choices[0];
      if (choice.message && choice.message.content) return choice.message.content;
      if (choice.text) return choice.text;
    }

    // Fallback: return a stringified response for easier debugging
    return JSON.stringify(response);
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
}

// פונקציה לקבלת משוב למידה על שאלה שגויה ספציפית
async function getQuestionFeedback(question, userAnswer, correctAnswer) {
  try {
    const prompt = `
אתה מורה ותיק ומקצועי ללימודי תאוריה בישראל. 
המטרה שלך: לתת לתלמיד משוב קצר, ברור ואישי – כאילו הוא יושב מולך בשיעור.

הנה הנתונים:
שאלה: ${question}
תשובת התלמיד: ${userAnswer}
התשובה הנכונה: ${correctAnswer}

כתוב משוב ב-3 חלקים קצרים:

1. **הסבר ממוקד** (משפט אחד): הסבר מדויק למה התשובה הנכונה נכונה, תוך שימוש בעובדות מהחוק/מצב הנהיגה. אל תכתוב "התשובה הנכונה היא..." אלא פשוט נסח את ההיגיון.
2. **תיקון אישי** (משפט אחד): ציין בפני התלמד מה הוא פספס בתשובה שלו ו-איך להבין את זה נכון להבא.
3. **כלל זהב** (משפט אחד): דגש מעשי שיש לזכור, כלל אצבע שמתאים לתרגול הנהיגה/חוקי התנועה.

תן תשובה קצרה, איכותית, ללא מלל מיותר, רק עברית טבעית של מורה אמיתי.
`;

    return await askAI(prompt);
  } catch (error) {
    console.error("Error getting question feedback:", error);
    return "לא ניתן לקבל משוב למידה כרגע.";
  }
}


module.exports = { askAI, getQuestionFeedback };
