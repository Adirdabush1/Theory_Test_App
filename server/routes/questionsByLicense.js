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
   פונקציה לערבוב מערך (Fisher-Yates)
--------------------------------------------------- */
const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ---------------------------------------------------
    🟣 /api/questions/by-license/:type
    מסנן שאלות לפי סוג רישיון («A» «B» «C1» «D» «1»)
--------------------------------------------------- */
router.get("/:type", async (req, res) => {
  const licenseType = req.params.type;

  try {
    const data = await loadCache();

    // מסנן לפי סוג רישיון
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

    // מערבב את השאלות לפני החזרה
    const shuffled = shuffleArray(filtered);

    // מחזיר עד 30 שאלות — כמו מבחן אמיתי
    res.json(shuffled.slice(0, 30));
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ message: "שגיאה בשליפת שאלות לפי רישיון" });
  }
});

module.exports = router;
