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
    if (err.code === 11000) {
      const targetDate = req.body.date ? new Date(req.body.date) : new Date();
      targetDate.setHours(0, 0, 0, 0);
      const existing = await DaySession.findOne({ userId: req.user._id, date: targetDate });
      if (existing) return res.status(200).json(existing);
    }
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

// 4. STOPWATCH START SESSION
router.post("/stopwatch/start", async (req, res) => {
  try {
    const { taskName } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daySession = await DaySession.findOne({ userId: req.user._id, date: today });
    if (!daySession) {
      daySession = await DaySession.create({
        userId: req.user._id,
        title: "Today's Focus",
        date: today,
      });
    }

    // Clean up any stale running sessions
    const runningSessions = await StudySession.find({ userId: req.user._id, status: "running" });
    for (let r of runningSessions) {
      const elapsed = Math.floor((new Date() - r.startTime) / 1000);
      if (elapsed > 0) {
        await DaySession.updateOne(
          { _id: r.daySessionId },
          { $inc: { totalDaytime: elapsed, stopwatchTime: elapsed } }
        );
      }
      await StudySession.deleteOne({ _id: r._id });
    }

    const session = await StudySession.create({
      daySessionId: daySession._id,
      userId: req.user._id,
      taskName: taskName || "Focus Session",
      startTime: new Date(),
      status: "running",
      source: "stopwatch",
    });

    res.status(201).json({ success: true, sessionId: session._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. STOPWATCH STOP / PAUSE / RESET / SAVE
router.post("/stopwatch/stop", async (req, res) => {
  try {
    const { sessionId, isFinalSave, isReset } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daySession = await DaySession.findOne({ userId: req.user._id, date: today });
    if (!daySession) {
      daySession = await DaySession.create({
        userId: req.user._id,
        title: "Today's Focus",
        date: today,
      });
    }

    if (isReset) {
      if (sessionId) await StudySession.deleteOne({ _id: sessionId, userId: req.user._id });
      await StudySession.deleteMany({ userId: req.user._id, status: "paused", source: "stopwatch" });
      return res.status(200).json({ success: true, message: "Timer reset successfully" });
    }

    let currentDuration = 0;
    if (sessionId) {
      const session = await StudySession.findOne({ _id: sessionId, userId: req.user._id, status: "running" });
      if (session) {
        currentDuration = Math.max(0, Math.floor((new Date() - session.startTime) / 1000));
        if (!isFinalSave) {
          // Pause logic: accumulate duration and mark paused
          session.duration = (session.duration || 0) + currentDuration;
          session.status = "paused";
          await session.save();
          return res.status(200).json({ success: true, duration: currentDuration });
        } else {
          await StudySession.deleteOne({ _id: session._id });
        }
      }
    }

    let totalDurationToSave = currentDuration;
    if (isFinalSave) {
      const pausedSessions = await StudySession.find({ userId: req.user._id, status: "paused", source: "stopwatch" });
      for (let p of pausedSessions) {
        totalDurationToSave += (p.duration || 0);
      }

      if (pausedSessions.length > 0) {
        await StudySession.deleteMany({ userId: req.user._id, status: "paused", source: "stopwatch" });
      }

      if (totalDurationToSave > 0) {
        await DaySession.updateOne(
          { _id: daySession._id },
          {
            $inc: {
              totalDaytime: totalDurationToSave,
              stopwatchTime: totalDurationToSave,
              totalSessions: 1,
            },
          }
        );
      }
    }

    res.status(200).json({ success: true, duration: totalDurationToSave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. STOPWATCH GET TODAY STATS
router.get("/stopwatch/today-stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = await DaySession.findOne({ userId: req.user._id, date: today });
    res.status(200).json({
      success: true,
      totalDaytime: day ? day.stopwatchTime || day.totalDaytime || 0 : 0,
      totalSessions: day ? day.totalSessions || 0 : 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;