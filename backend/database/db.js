const mongoose = require("mongoose");

async function connectDb() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 50,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("Mongoose connection disconnected!");
});

module.exports = { connectDb };