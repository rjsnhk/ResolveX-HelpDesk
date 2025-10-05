// ===============================
// HelpDesk Mini API - Server
// ===============================

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
require("dotenv").config();
const Ticket = require('./models/ticketModel');

const connectDatabase = require("./config/db");

// Routes
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const agentRoutes = require("./routes/agentRoutes");
const authRoutes = require("./routes/authRoutes");

// Environment setup
const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// Database Connection
// ===============================
connectDatabase();

// ===============================
// Middleware Setup
// ===============================
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===============================
// Rate Limiting (60 req/min/user)
// ===============================
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 60,
  keyGenerator: ipKeyGenerator, // ✅ safe IPv4 + IPv6 handling
  message: {
    error: {
      code: "RATE_LIMIT",
      message: "Too many requests, please try again later."
    },
  },
});
app.use(limiter);

// ===============================
// Idempotency Middleware
// ===============================
// (Prevents duplicate POST operations)
const idempotencyKeys = new Map(); // store keys in memory for simplicity

app.use((req, res, next) => {
  if (req.method === "POST" && req.headers["idempotency-key"]) {
    const key = req.headers["idempotency-key"];
    if (idempotencyKeys.has(key)) {
      const response = idempotencyKeys.get(key);
      return res.status(200).json(response);
    }

    // Hook into res.json to store result
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      idempotencyKeys.set(key, body);
      return originalJson(body);
    };
  }
  next();
});

// ===============================
// Routes
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/agents", agentRoutes);

// ===============================
// Health Check
// ===============================
app.get("/", (req, res) => {
  res.send("<h1>🎫 HelpDesk Mini API is Running...</h1>");
});

// ===============================
// Error Handling (Uniform Format)
// ===============================
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      field: err.field || null,
      message: err.message || "Internal server error",
    },
  });
});

// ===============================
// Background Job: Auto-close resolved tickets past SLA
// ===============================
const startAutoCloseJob = () => {
  const JOB_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

  setInterval(async () => {
    try {
      const now = new Date();
      const result = await Ticket.updateMany(
        { status: 'resolved', slaDeadline: { $lt: now } },
        {
          $set: { status: 'closed' },
          $inc: { version: 1 },
          $push: {
            timeline: {
              action: 'status_change',
              user: null,
              details: 'Auto-closed after SLA expiry'
            }
          }
        }
      );
      if (result.modifiedCount) {
        console.log(`Auto-closed ${result.modifiedCount} tickets past SLA.`);
      }
    } catch (jobErr) {
      console.error('Auto-close job failed:', jobErr.message);
    }
  }, JOB_INTERVAL_MS);
};

// ===============================
// Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  startAutoCloseJob();
});
