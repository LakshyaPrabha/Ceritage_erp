const occasionService = require("../services/occasionService");
const greetingService = require("../services/greetingService");
const db = require("../config/db");

// GET /api/customers/occasions
async function getOccasions(req, res) {
  try {
    const list = await occasionService.getCustomerOccasions({ ...req.query, allowedBranchIds: req.allowedBranchIds });
    res.json({ success: true, data: list, count: list.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/occasions/kpis
async function getOccasionKpis(req, res) {
  try {
    const kpis = await occasionService.getOccasionKpis(req.allowedBranchIds);
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/reminders/upcoming
async function getUpcomingReminders(req, res) {
  try {
    const list = await occasionService.getCustomerOccasions({ range: "30d", occasion: "all", allowedBranchIds: req.allowedBranchIds });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/customers/:id/occasions/:occasionType/acknowledge
async function acknowledgeOccasion(req, res) {
  const { id: customerId, occasionType } = req.params;
  const { occasion_date, notes } = req.body;

  if (!occasion_date) {
    return res.status(400).json({ success: false, message: "Occasion date is required for acknowledgement" });
  }

  const performedBy = req.user?.full_name || req.user?.username || "Staff";

  try {
    const [custRows] = await db.query("SELECT id, full_name FROM customers WHERE id = ?", [customerId]);
    if (custRows.length === 0) return res.status(404).json({ success: false, message: "Customer not found" });

    const result = await occasionService.acknowledgeOccasion(
      customerId, occasionType, occasion_date, performedBy, notes
    );

    res.json({
      success: true,
      message: `${occasionType.toUpperCase()} reminder acknowledged for ${custRows[0].full_name}`,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/customers/:id/occasions/greeting
async function generateGreetingCard(req, res) {
  const customerId = req.params.id;
  const { occasion_type = "BIRTHDAY", include_coupon = false, include_bonus_points = false, bonus_points = 100 } = req.body;

  const performedBy = req.user?.full_name || req.user?.username || "Staff";

  try {
    const [custRows] = await db.query("SELECT * FROM customers WHERE id = ?", [customerId]);
    if (custRows.length === 0) return res.status(404).json({ success: false, message: "Customer not found" });
    const customer = custRows[0];

    const result = await greetingService.generateGreeting(customer, occasion_type, {
      include_coupon: Boolean(include_coupon),
      include_bonus_points: Boolean(include_bonus_points),
      bonus_points: Number(bonus_points || 100),
      performed_by: performedBy
    });

    res.json({
      success: true,
      message: "Personalized greeting generated successfully",
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getOccasions,
  getOccasionKpis,
  getUpcomingReminders,
  acknowledgeOccasion,
  generateGreetingCard,
};
