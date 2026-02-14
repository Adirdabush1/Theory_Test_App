const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const userPointsRoute = require("./routes/points");

// --- Load environment variables ---
dotenv.config();

// --- Connect to MongoDB ---
connectDB();

const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// Root health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "theory-test-app-server",
  });
});

// === Routes ===

// Auth routes
app.use("/api/auth", require("./routes/auth"));

// AI routes
app.use("/api/ai", require("./routes/ai"));

// שאלות רגילות
app.use("/api/questions", require("./routes/question"));

// שאלות לפי סוג רישיון
app.use("/api/questions/by-license", require("./routes/questionsByLicense"));

// שאלה רנדומלית
app.use("/api/questions/random", require("./routes/randomQuestion"));

// מבחן מלא (submit מבחן + היסטוריית מבחנים)
app.use("/api/test", require("./routes/FullTest"));

// היסטוריית מבחנים לכל משתמש
app.use("/api/test/history", require("./routes/history"));

// נקודות משתמש
app.use("/api/user-points", userPointsRoute);

// למידה מתשובות שגויות - משוב AI
app.use("/api/learn", require("./routes/learnMistakes"));

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
