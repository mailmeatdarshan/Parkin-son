const { mongoose } = require("../database/db");
const { Schema } = mongoose;

// Inside daysession we have task like for monday we have task1,task2,task3...etc

const taskSchema = new Schema(
  {
    daySessionId: {
      type: Schema.Types.ObjectId,
      ref: "daysessioncreditanils",
      required: false,
    },

    title: {
      type: String,
      default: "Untitled Task",
      trim: true,
    },

    encryptedDescription: {
      type: String,
      required: false,
    },

    encryptedAESKey: {
      type: String,
      required: false,
    },

    startDate: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    isAllDay: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: Number,
      enum: [0, 1, 3, 5],
      default: 0, // 0: None, 1: Low, 3: Medium, 5: High
    },

    color: {
      type: String,
      default: "#4772FA",
    },

    timeZone: {
      type: String,
      default: "UTC",
    },

    status: {
      type: Boolean,
      default: false, // false = pending, true = completed
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "userCredential",
      required: true,
    },
  },
  { timestamps: true }
);

taskSchema.index({ userId: 1, startDate: 1 });
taskSchema.index({ userId: 1, status: 1, startDate: 1 });

// ================= INDEXES =================

// Find all tasks of a day
taskSchema.index({ daySessionId: 1 });

// Find all tasks of a user
taskSchema.index({ userId: 1 });

// Find completed/pending tasks of a user
taskSchema.index({ userId: 1, status: 1 });

// Find tasks of a particular day
taskSchema.index({ daySessionId: 1, status: 1 });

// Most common query: tasks of a user for a particular day
taskSchema.index({ userId: 1, daySessionId: 1 });

// Most optimized for filtering tasks by user + day + status
taskSchema.index({ userId: 1, daySessionId: 1, status: 1 });

const taskmodel = mongoose.model("taskcredential", taskSchema);

module.exports = taskmodel;