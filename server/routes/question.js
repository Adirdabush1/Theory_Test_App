const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

const RESOURCE_ID = "bf7cb748-f220-474b-a4d5-2d59f93db28d";

let cache = null;

/* ---------------------------------------------------
   פונקציה שמביאה את ה־cache (2000 שאלות מהממשלה)
--------------------------------------------------- */
const loadCache = async () => {
  if (cache) return cache;

  try {
    const response = await fetch(
      `https://data.gov.il/api/3/action/datastore_search?resource_id=${RESOURCE_ID}&limit=2000`
    );
    const json = await response.json();
    cache = json?.result?.records || [];
    console.log(`Loaded ${cache.length} questions into cache`);
    return cache;
  } catch (err) {
    console.error("Failed to load cache:", err);
    throw err;
  }
};

/* ---------------------------------------------------
   פונקציה לחילוץ סוגי רישיון מתוך HTML
   מחזיר ["A","B","C1"] וכו’
--------------------------------------------------- */
const extractCategories = (html = "") => {
  const matches = html.match(/«(.*?)»/g) || [];
  return matches.map((m) => m.replace(/«|»/g, ""));
};

/* ---------------------------------------------------
    🔵 /api/questions — ברירת דרך: החזרת דוגמא של שאלות (עד 50)
    🔵 /api/questions/all — כל השאלות מעורבבות
--------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const data = await loadCache();
    const sample = [...data].sort(() => Math.random() - 0.5).slice(0, 50);
    res.json(sample);
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const data = await loadCache();
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    res.json(shuffled);
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});

/* ---------------------------------------------------
    🟢 /api/questions/random — שאלה אקראית אחת
--------------------------------------------------- */
router.get("/random", async (req, res) => {
  try {
    const data = await loadCache();

    const randomIndex = Math.floor(Math.random() * data.length);
    const record = data[randomIndex];

    const html = record.description4 || "";
    const liMatches = html.match(/<li><span.*?>(.*?)<\/span><\/li>/g) || [];
    const options = liMatches.map((li) => {
      const textMatch = li.match(/<span.*?>(.*?)<\/span>/);
      return textMatch ? textMatch[1] : "";
    });

    const correctMatch = html.match(/<span id="correctAnswer.*?">(.*?)<\/span>/);
    const correctAnswer = correctMatch ? correctMatch[1] : options[0];

    res.json({
      question: record.title2 || "שאלה ללא כותרת",
      options,
      correctAnswer,
      questionId: record._id || randomIndex,
    });
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ message: "בעיה בטעינת שאלה אקראית" });
  }
});

/* ---------------------------------------------------
    🟣 /api/questions/by-license/:type
    מסנן שאלות לפי סוג רישיון («A» «B» «C1» «D» «1»)
--------------------------------------------------- */
router.get("/by-license/:type", async (req, res) => {
  const licenseType = req.params.type;

  try {
    const data = await loadCache();

    const filtered = data.filter((rec) => {
      const categories = extractCategories(rec.description4);
      return categories.includes(licenseType);
    });

    console.log(`Found ${filtered.length} questions for ${licenseType}`);

    if (filtered.length === 0) {
      return res
        .status(404)
        .json({ error: `לא נמצאו שאלות לסוג רישיון ${licenseType}` });
    }

    // מחזיר עד 30 שאלות — כמו מבחן אמיתי
    res.json(filtered.slice(0, 30));
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ message: "שגיאה בשליפת שאלות לפי רישיון" });
  }
});

module.exports = router;
