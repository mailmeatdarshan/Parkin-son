const mongoose = require("mongoose");

const daySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true, // Normalized date e.g. YYYY-MM-DD 00:00:00
    },
    totalFocusMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Har user ka ek din me sirf EK record hona chahiye
daySessionSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DaySession", daySessionSchema);