// Import core modules and packages
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const os = require("os");
const cluster = require("cluster");
const cookieParser = require("cookie-parser");

// Import database connection
const connectDatabase = require("./config/db");

// Import route files

// Create Express app instance
const app = express();

// Define port from .env or fallback
const PORT = process.env.PORT || 5000;

// Get available CPU cores
const numCPUs = os.cpus().length;

// Master process setup
if (cluster.isPrimary) {
  console.log(`🧠 Master process ${process.pid} is running`);

  // Fork worker processes
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Restart crashed workers (limited retries)
  let restartCount = 0;
  const MAX_RESTARTS = 5;

  cluster.on("exit", (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} exited`);
    if (restartCount < MAX_RESTARTS) {
      console.log(`🔁 Restarting worker...`);
      cluster.fork();
      restartCount++;
    } else {
      console.log(`⛔ Max restart limit reached. Not forking more workers.`);
    }
  });
} else {
  // Worker process logic
  connectDatabase(); // Connect MongoDB

  // Middleware setup
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Mount route handlers

  // Health check route
  app.get("/", (req, res) => {
    res.send("<h1>🎫 HelpDesk Mini API is Running...</h1>");
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Worker ${process.pid} running on http://localhost:${PORT}`);
  });
}
