const express = require("express");
const router = express.Router();
const User = require("../models/users");
const DaySession = require("../models/daysession");

//GET
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}).select("name avatar badges createdAt streak").lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aaj ke saare sessions nikalo
    const todaySessions = await DaySession.find({ date: today }).lean();

    const xpMap = {};
    todaySessions.forEach((s) => {
      xpMap[s.userId.toString()] = s.totalDaytime || 0;
    });

    // Har user ka XP map karo
    const leaderboard = users.map((u) => {
      const xp = xpMap[u._id.toString()] || 0;
      return {
        id: u._id,
        name: u.name,
        avatar: u.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + u.name,
        xp: xp,
        streak: u.streak || 0,
        badges: u.badges || ["Novice"],
      };
    });

    // Highest focus XP wale ko #1 rank do
    leaderboard.sort((a, b) => b.xp - a.xp);

    res.status(200).json(leaderboard);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;