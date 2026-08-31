const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");
require("dotenv").config();

const db = require("./config/db");

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: "*",
  credentials: false,
}));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(express.json());

// Disable 304 caching for API routes
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// ── Health check ───────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Ceritage ERP Backend is running", version: "2.0" });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DATABASE() AS db");
    res.json({ success: true, database: rows[0].db, message: "MySQL connected" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── API Routes ─────────────────────────────────────────────
app.use("/api/auth",          require("./routes/auth"));
app.use("/api/dashboard",     require("./routes/dashboard"));
app.use("/api/analytics",     require("./routes/analytics"));
app.use("/api/users",         require("./routes/users"));
app.use("/api/customers",     require("./routes/customers"));
app.use("/api/products",      require("./routes/products"));
app.use("/api/billing",       require("./routes/billing"));
app.use("/api/sales",         require("./routes/sales"));
app.use("/api/purchase",      require("./routes/purchase"));
app.use("/api/gold-exchange",  require("./routes/goldExchange"));
app.use("/api/repair",        require("./routes/repair"));
app.use("/api/orders",        require("./routes/orders"));
app.use("/api/karigar",       require("./routes/karigar"));
app.use("/api/rates",         require("./routes/rates"));
app.use("/api/metal-rates",   require("./routes/metalRates"));
app.use("/api/employees",     require("./routes/employees"));
app.use("/api/suppliers",     require("./routes/suppliers"));
app.use("/api/branch",        require("./routes/branch"));
app.use("/api/emi",           require("./routes/emi"));
app.use("/api/membership",    require("./routes/membership"));
app.use("/api/communications",require("./routes/communication"));
app.use("/api/inventory",     require("./routes/inventory"));
app.use("/api/hallmark",      require("./routes/hallmark"));
app.use("/api/advance",       require("./routes/advance"));

// ── 404 handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error", error: err.message });
});

// ── Start server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Ceritage ERP Backend running on port ${PORT}`);
  console.log(`DB: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
});

// ── Metals.Dev Automated Twice-Daily Scheduler (Day & Evening Slots) ──
const metalRateService = require("./services/metalRateService");

setInterval(async () => {
  try {
    if (!process.env.METALS_DEV_API_KEY) return;

    const now = new Date();
    // Convert to Indian Standard Time (IST)
    const istString = now.toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour12: false });
    const [hours, minutes] = istString.split(":").map(Number);

    const dayTime = process.env.METALS_DEV_DAY_TIME || "10:30";
    const [dayHour, dayMin] = dayTime.split(":").map(Number);

    const eveningTime = process.env.METALS_DEV_EVENING_TIME || "18:30";
    const [eveHour, eveMin] = eveningTime.split(":").map(Number);

    // 1. Check Morning / Day Slot (e.g. 10:30 AM IST)
    if (hours === dayHour && minutes >= dayMin && minutes <= dayMin + 4) {
      const quota = await metalRateService.getDailySyncStatus();
      if (!quota.daySlotCompleted && quota.canRequest) {
        console.log(`[Auto Scheduler] ☀️ Triggering Day Slot Market Rate Sync (${dayTime} IST)...`);
        await metalRateService.refreshRates({ slot: "DAY", updatedBy: "Automated Day Scheduler" });
      }
    }

    // 2. Check Evening Slot (e.g. 06:30 PM IST)
    if (hours === eveHour && minutes >= eveMin && minutes <= eveMin + 4) {
      const quota = await metalRateService.getDailySyncStatus();
      if (!quota.eveningSlotCompleted && quota.canRequest) {
        console.log(`[Auto Scheduler] 🌙 Triggering Evening Slot Market Rate Sync (${eveningTime} IST)...`);
        await metalRateService.refreshRates({ slot: "EVENING", updatedBy: "Automated Evening Scheduler" });
      }
    }
  } catch (err) {
    console.warn("[Auto Scheduler] Background sync notice:", err.message);
  }
}, 60 * 1000); // Check every 60 seconds



