const mongoose = require("mongoose");

const daySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Day Focus",
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    deadline: {
      type: Date,
    },
    totalDaytime: {
      type: Number,
      default: 0,
    },
    stopwatchTime: {
      type: Number,
      default: 0,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "pending"],
      default: "active",
    },
  },
  { timestamps: true }
);

daySessionSchema.pre("save", function (next) {
  if (this.date) {
    this.date.setHours(0, 0, 0, 0);
  }
  next();
});

daySessionSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DaySession", daySessionSchema);