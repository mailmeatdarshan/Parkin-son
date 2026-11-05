// here we are getting tasks of user of per day...

const express = require("express");
const taskmodel = require("../models/tasks");
const dailysessionmodel = require("../models/daysession");
const router = express.Router();

//  for adding user task in db ------------------------------------------------------------------------

router.post("/addtask", async function (req, res) {
  try {
    const userId = req.user.id;
    const { encryptedDescription, encryptedAESKey, daySessionId, title } = req.body;

    let startDate = null;
    let dueDate = null;

    if (daySessionId) {
      const daySession = await dailysessionmodel.findOne({ _id: daySessionId, userId });
      if (daySession && daySession.date) {
        const start = new Date(daySession.date);
        start.setHours(9, 0, 0, 0);
        startDate = start;
        dueDate = new Date(start.getTime() + 60 * 60000);
      }
    }

    const task = await taskmodel.create({
      encryptedDescription,
      encryptedAESKey: encryptedAESKey || "e2e_v2",
      title: title || "Encrypted Task",
      daySessionId,
      userId,
      startDate,
      dueDate,
      status: false,
    });

    res.status(201).json({
      message: "Task Created",
      task,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating task",
      error: err.message,
    });
  }
});

//  to get user task on the basis of user id and daysession ------------------------------------------------------------------------

router.get("/gettask/:daySessionId", async function (req, res) {
  try {
    const userId = req.user.id;
    const { daySessionId } = req.params;

    const daySession = await dailysessionmodel.findOne({ _id: daySessionId, userId });
    let query = { userId };

    if (daySession && daySession.date) {
      const dayStart = new Date(daySession.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(daySession.date);
      dayEnd.setHours(23, 59, 59, 999);

      query.$or = [
        { daySessionId: daySessionId },
        { startDate: { $gte: dayStart, $lte: dayEnd } },
      ];
    } else {
      query.daySessionId = daySessionId;
    }

    const task = await taskmodel.find(query).sort({ startDate: 1, createdAt: -1 });

    res.json(task);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching task",
      error: err.message,
    });
  }
});

//  to patch the existing task on the basis of taskid (every task has unique id) ------------------------------------------------------------------------

router.patch("/patchtask/:taskId", async function (req, res) {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const {status} = req.body;
    const tasks = await taskmodel.findOneAndUpdate(
      { _id: taskId, userId},
      { $set: { status } },
      { new: true },
    );

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({
      message: "Somethng went wrong",
    });
  }
});

//  to delete the exiting task on the basis of taskid
// ------------------------------------------------------------------------

router.delete("/deletetask/:taskId", async function (req, res) {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;

    const task = await taskmodel.findOneAndDelete({
      _id: taskId,
      userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.status(200).json({
      message: "Task Deleted Successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

//  to get tasks within a date range for the calendar ---------------------------------------
router.get("/calendar", async function (req, res) {
  try {
    const userId = req.user.id;
    const { start, end } = req.query;

    let filter = { userId };

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      filter.$and = [
        {
          $or: [
            { startDate: { $gte: startDate, $lte: endDate } },
            { dueDate: { $gte: startDate, $lte: endDate } },
            {
              startDate: { $lte: startDate },
              dueDate: { $gte: endDate },
            },
          ],
        },
        { startDate: { $ne: null } },
      ];
    } else {
      filter.startDate = { $ne: null };
    }

    const tasks = await taskmodel.find(filter).sort({ startDate: 1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching calendar tasks",
      error: err.message,
    });
  }
});

//  to get unscheduled backlog tasks + past pending (overdue) tasks -------------------------
router.get("/unscheduled", async function (req, res) {
  try {
    const userId = req.user.id;
    const now = new Date();
    // Start of today (00:00:00) in current server time
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const tasks = await taskmodel
      .find({
        userId,
        status: false,
        $or: [
          { startDate: null },
          { startDate: { $exists: false } },
          { startDate: { $lt: todayStart } },
        ],
      })
      .sort({ startDate: 1, createdAt: -1 });

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching unscheduled tasks",
      error: err.message,
    });
  }
});

//  to update timeblock / schedule of a task ------------------------------------------------
router.patch("/:id/timeblock", async function (req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { startDate, dueDate, isAllDay, priority, color, title } = req.body;

    const existing = await taskmodel.findOne({ _id: id, userId });
    if (!existing) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (existing.status) {
      return res.status(400).json({ message: "Completed tasks cannot be moved or rescheduled" });
    }

    const updateFields = {};
    if (startDate !== undefined) {
      updateFields.startDate = startDate ? new Date(startDate) : null;
      if (startDate) {
        const dateObj = new Date(startDate);
        dateObj.setHours(0, 0, 0, 0);
        const ds = await dailysessionmodel.findOne({ userId, date: dateObj });
        updateFields.daySessionId = ds ? ds._id : null;
      } else {
        updateFields.daySessionId = null;
      }
    }
    if (dueDate !== undefined) updateFields.dueDate = dueDate ? new Date(dueDate) : null;
    if (isAllDay !== undefined) updateFields.isAllDay = Boolean(isAllDay);
    if (priority !== undefined) updateFields.priority = Number(priority);
    if (color !== undefined) updateFields.color = color;
    if (title !== undefined) updateFields.title = title;

    const task = await taskmodel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateFields },
      { new: true }
    );

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({
      message: "Error updating time block",
      error: err.message,
    });
  }
});

//  to create a new task directly (backlog or scheduled) ------------------------------------
router.post("/create", async function (req, res) {
  try {
    const userId = req.user.id;
    const {
      title,
      startDate,
      dueDate,
      isAllDay,
      priority,
      color,
      timeZone,
      encryptedDescription,
      encryptedAESKey,
    } = req.body;

    if (!title && !encryptedDescription) {
      return res.status(400).json({ message: "Task description or title is required" });
    }

    let daySessionId = null;
    if (startDate) {
      const dateObj = new Date(startDate);
      dateObj.setHours(0, 0, 0, 0);
      const existingDaySession = await dailysessionmodel.findOne({
        userId,
        date: dateObj,
      });
      if (existingDaySession) {
        daySessionId = existingDaySession._id;
      }
    }

    const task = await taskmodel.create({
      userId,
      title: title ? title.trim() : "Encrypted Task",
      encryptedDescription: encryptedDescription || null,
      encryptedAESKey: encryptedAESKey || (encryptedDescription ? "e2e_v2" : null),
      daySessionId,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      isAllDay: Boolean(isAllDay),
      priority: priority !== undefined ? Number(priority) : 0,
      color: color || "#4772FA",
      timeZone: timeZone || "UTC",
      status: false,
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({
      message: "Error creating task",
      error: err.message,
    });
  }
});

module.exports = router;
