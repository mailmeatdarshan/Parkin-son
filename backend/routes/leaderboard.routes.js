const express = require("express");
const router = express.Router();
const User = require("../models/users");
const DaySession = require("../models/daysession");

// GET LEADERBOARD (AGGREGATED STATS)
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}).select("name avatar badges createdAt streak").lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Today's sessions
    const todaySessions = await DaySession.find({ date: today }).lean();
    const todayXpMap = {};
    todaySessions.forEach((s) => {
      todayXpMap[s.userId.toString()] = (todayXpMap[s.userId.toString()] || 0) + (s.totalDaytime || s.stopwatchTime || 0);
    });

    // 2. All-time MongoDB Aggregation
    const allTimeStats = await DaySession.aggregate([
      {
        $group: {
          _id: "$userId",
          totalFocusSeconds: { $sum: "$totalDaytime" },
          totalSessions: { $sum: "$totalSessions" },
        },
      },
    ]);

    const allTimeMap = {};
    const sessionsMap = {};
    allTimeStats.forEach((stat) => {
      allTimeMap[stat._id.toString()] = stat.totalFocusSeconds || 0;
      sessionsMap[stat._id.toString()] = stat.totalSessions || 0;
    });

    // 3. Map user profiles with stats
    const leaderboard = users.map((u) => {
      const uId = u._id.toString();
      const todaySec = todayXpMap[uId] || 0;
      const allTimeSec = Math.max(allTimeMap[uId] || 0, todaySec);

      return {
        id: u._id,
        name: u.name,
        avatar: u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.name)}`,
        xp: allTimeSec, // Default XP (seconds)
        todayXp: todaySec,
        allTimeXp: allTimeSec,
        totalSessions: sessionsMap[uId] || 0,
        streak: u.streak || (allTimeSec > 0 ? 1 : 0),
        badges: u.badges && u.badges.length > 0 ? u.badges : ["Novice"],
      };
    });

    // Sort descending by allTimeXp
    leaderboard.sort((a, b) => b.allTimeXp - a.allTimeXp);

    res.status(200).json(leaderboard);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;