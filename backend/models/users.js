const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    avatar: {
      type: String,
      default: "https://api.dicebear.com/7.x/bottts/svg?seed=Darshan",
    },
    streak: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String],
      default: ["Novice"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);