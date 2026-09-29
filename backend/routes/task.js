const express = require("express");
const router = express.Router();
const Task = require("../models/tasks");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

//ADD TASK
router.post("/addtask", async (req, res) => {
  try {
    const { title, encryptedDescription, encryptedAESKey, daySessionId, priority, deadline } = req.body;

    const task = await Task.create({
      userId: req.user._id,
      daySessionId,
      title: title || "New Task",
      encryptedDescription,
      encryptedAESKey,
      priority,
      deadline,
    });

    res.status(201).json({ success: true, message: "Task created", task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

//GET TASKS OF A DAY
router.get("/gettask/:daySessionId", async (req, res) => {
  try {
    const { daySessionId } = req.params;
    const tasks = await Task.find({
      userId: req.user._id,
      daySessionId,
    }).sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

//TOGGLE STATUS
router.patch("/patchtask/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, title } = req.body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (title) updateData.title = title;

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId: req.user._id },
      updateData,
      { new: true }
    );

    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    res.status(200).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

//DELETE TASK
router.delete("/deletetask/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findOneAndDelete({ _id: taskId, userId: req.user._id });

    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;