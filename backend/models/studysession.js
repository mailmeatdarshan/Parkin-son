const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    daySessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DaySession",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    taskName: {
      type: String,
      default: "Focus Session",
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    status: {
      type: String,
      enum: ["running", "paused", "completed"],
      default: "running",
    },
    source: {
      type: String,
      default: "stopwatch", // "stopwatch" or "workspace"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudySession", sessionSchema);