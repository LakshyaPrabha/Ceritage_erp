const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");
require("dotenv").config();

const db = require("./config/db");

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

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
app.use("/api/employees",     require("./routes/employees"));
app.use("/api/suppliers",     require("./routes/suppliers"));
app.use("/api/branch",        require("./routes/branch"));

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
app.listen(PORT, () => {
  console.log(`Ceritage ERP Backend running on port ${PORT}`);
  console.log(`DB: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});
