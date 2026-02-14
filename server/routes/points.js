const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");


router.get("/leaderboard", async (req, res) => {
  try {
    const users = await User.find()
      .sort({ userPoints: -1 }) // גבוה → נמוך
      .select("username fullName userPoints profilePicture email");

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});




router.post("/:userId", protect, async (req, res) => {
  try {
    const { points } = req.body;

    if (typeof points !== "number") {
      return res
        .status(400)
        .json({ message: "חייבים לשלוח מספר בשדה points" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.userPoints = points;

    await user.save();

    res.json({
      message: "נקודות עודכנו בהצלחה",
      userPoints: user.userPoints,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ userPoints: user.userPoints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
