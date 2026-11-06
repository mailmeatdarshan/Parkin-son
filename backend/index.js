require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDb } = require("./database/db");


const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const performanceMiddleware = require("./middleware/performance");
const logger = require("./utils/logger");
const authMiddleware = require("./middleware/authMiddleware");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/task");               
const sessionRoutes = require("./routes/sessions");        
const calendarRoutes = require("./routes/calendar.route");
const dashboardRoutes = require("./routes/dashboards");
const leaderboardRoutes = require("./routes/leaderboard.routes");

const app = express();
app.use(performanceMiddleware);

// Security Headers (Helmet)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// General Rate Limiter (500 requests per 15 mins)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict Rate Limiter for Auth (50 attempts per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: "Too many authentication attempts, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production" ||
        (process.env.CLIENT_URL && origin.startsWith(process.env.CLIENT_URL.replace(/\/$/, "")))
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Apply Rate Limiters
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server healthy hai",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/task", authMiddleware, taskRoutes);
app.use("/api/tasks", authMiddleware, taskRoutes);               
app.use("/api/session", authMiddleware, sessionRoutes);         
app.use("/api/calendar", authMiddleware, calendarRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/leaderboard", authMiddleware, leaderboardRoutes);

// Centralized error handling
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
}); 

// Serve static frontend in production if built
const path = require("path");
const fs = require("fs");
const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}



//Start Server
const PORT = process.env.PORT || 5000;

connectDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server chalu hogya hai ispe http://localhost:${PORT}`);
  });
});

