require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

//Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173", // Frontend Vite default port
  credentials: true
}));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server healthy hai",
    timestamp: new Date().toISOString()
  });
});

//Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chalu hogya hai ispe - http://localhost:${PORT}`);
});