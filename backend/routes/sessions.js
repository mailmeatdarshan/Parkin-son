const express = require("express");
const router = express.Router();
const DaySession = require("../models/daysession");
const StudySession = require("../models/studysession");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

//GET ALL DAYS
router.get("/day/all", async (req, res) => {
  try {
    const days = await DaySession.find({ userId: req.user._id }).sort({ date: -1 });
    res.status(200).json(days);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

//CREATE A DAY BOX
router.post("/day/add", async (req, res) => {
  try {
    const { title, deadline, date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    let day = await DaySession.findOne({ userId: req.user._id, date: targetDate });

    if (!day) {
      day = await DaySession.create({
        userId: req.user._id,
        title: title || "Today",
        date: targetDate,
        deadline: deadline || null,
      });
    }

    res.status(201).json(day);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

//UPDATE DAY STATUS
router.patch("/day/:id", async (req, res) => {
  try {
    const { title, deadline, status, totalDaytime } = req.body;
    const updateData = {};
    if (title) updateData.title = title;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (status) updateData.status = status;
    if (totalDaytime !== undefined) updateData.totalDaytime = totalDaytime;

    const day = await DaySession.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true }
    );

    if (!day) return res.status(404).json({ success: false, message: "Day not found" });

    res.status(200).json(day);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

//STOPWATCH SAVE TIME
router.post("/stopwatch/stop", async (req, res) => {
  try {
    const { durationSeconds } = req.body;
    const addedTime = durationSeconds || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = await DaySession.findOneAndUpdate(
      { userId: req.user._id, date: today },
      { $inc: { totalDaytime: addedTime, stopwatchTime: addedTime } },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, totalDaytime: day.totalDaytime });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

//STOPWATCH GET TODAY STATS
router.get("/stopwatch/today-stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = await DaySession.findOne({ userId: req.user._id, date: today });
    res.status(200).json({
      todayTime: day ? day.totalDaytime || day.stopwatchTime || 0 : 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;