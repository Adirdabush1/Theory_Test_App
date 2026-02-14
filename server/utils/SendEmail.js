const fetch = require('node-fetch');

// fetch לשימוש ב-Formspree לשליחת מיילים
// sendEmail פונקציה לשליחת מייל
// פרמטרים: email, subject, message
// מחזירה אמת אם נשלח בהצלחה, אחרת זורקת שגיאה
const sendEmail = async ({ email, subject, message }) => {
  try {
    const response = await fetch(`https://formspree.io/f/${process.env.FORMSPREE_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        _replyto: email,
        subject,
        message
      })
    });

    if (!response.ok) {
      throw new Error(`Formspree error: ${response.statusText}`);
    }

    return true;

  } catch (err) {
    console.error(" Error sending email via Formspree:", err);
    throw new Error("Could not send email");
  }
};

module.exports = sendEmail;
