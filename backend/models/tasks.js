const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    daySessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DaySession",
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    encryptedDescription: {
      type: String,
    },
    encryptedAESKey: {
      type: String,
      default: "e2e_v2",
    },
    status: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    deadline: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);