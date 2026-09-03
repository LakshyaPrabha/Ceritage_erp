const db = require("../config/db");

/**
 * Get current date parts in Asia/Kolkata (IST) timezone
 */
function getIstNow() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === "year").value);
  const month = parseInt(parts.find(p => p.type === "month").value); // 1-12
  const day = parseInt(parts.find(p => p.type === "day").value);

  // Normalized midnight Date in local execution context for distance calculations
  const todayMidnight = new Date(year, month - 1, day, 0, 0, 0, 0);
  const todayStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return { year, month, day, todayMidnight, todayStr };
}

/**
 * Check if a year is a leap year
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Calculate the next occurrence of an annual recurring date (e.g. Birthday or Anniversary)
 * Deterministic Leap Year Rule: Feb 29 resolves to Feb 28 in non-leap years.
 */
function calculateNextOccurrence(rawDateStr, istNow) {
  if (!rawDateStr) return null;
  const d = new Date(rawDateStr);
  if (isNaN(d.getTime())) return null;

  const origMonth = d.getMonth() + 1; // 1-12
  const origDay = d.getDate();        // 1-31

  let targetYear = istNow.year;
  let targetMonth = origMonth;
  let targetDay = origDay;

  // Leap Year Handling: If Feb 29 in a non-leap year, resolve deterministically to Feb 28
  if (origMonth === 2 && origDay === 29 && !isLeapYear(targetYear)) {
    targetDay = 28;
  }

  let nextDate = new Date(targetYear, targetMonth - 1, targetDay, 0, 0, 0, 0);

  // If already passed this year, advance to next year
  if (nextDate < istNow.todayMidnight) {
    targetYear = istNow.year + 1;
    targetDay = origDay;
    if (origMonth === 2 && origDay === 29 && !isLeapYear(targetYear)) {
      targetDay = 28;
    }
    nextDate = new Date(targetYear, targetMonth - 1, targetDay, 0, 0, 0, 0);
  }

  const diffMs = nextDate.getTime() - istNow.todayMidnight.getTime();
  const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const nextDateStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;

  return {
    nextDateStr,
    occurrenceYear: targetYear,
    daysUntil: Math.max(0, daysUntil),
    isThisMonth: targetMonth === istNow.month && targetYear === istNow.year
  };
}

/**
 * Evaluate all customer occasions with filters, active tier resolution, and reminder statuses
 */
async function getCustomerOccasions(options = {}) {
  const { range = "month", occasion = "all", search, tier } = options;
  const istNow = getIstNow();

  // 1. Fetch active customers with active membership details
  let branchClause = "";
  let branchParams = [];
  if (options.allowedBranchIds && options.allowedBranchIds.length > 0) {
    if (options.allowedBranchIds.includes(1)) {
      branchClause = "AND (c.branch_id IN (?) OR c.branch_id IS NULL)";
    } else {
      branchClause = "AND c.branch_id IN (?)";
    }
    branchParams = [options.allowedBranchIds];
  }

  const [customers] = await db.query(
    `SELECT c.id, c.customer_id AS cust_code, c.full_name, c.phone, c.email, c.city,
            c.date_of_birth, c.anniversary, c.tier AS default_tier,
            c.opt_in_whatsapp, c.opt_in_sms, c.opt_in_marketing, c.preferred_channel
     FROM customers c
     WHERE c.status IN ('ACTIVE', 'Active') ${branchClause}
     ORDER BY c.full_name ASC`,
    branchParams
  );

  // 2. Fetch existing reminder records for current & next year safely
  let reminderRows = [];
  try {
    const [rows] = await db.query(
      `SELECT id, customer_id, occasion_type, occasion_year,
              reminder_status, greeting_sent, voucher_code, bonus_loyalty_points, notes
       FROM customer_occasion_reminders
       WHERE occasion_year IN (?, ?)`,
      [istNow.year, istNow.year + 1]
    );
    reminderRows = rows;
  } catch (err) {
    console.warn("Notice: customer_occasion_reminders query fallback:", err.message);
  }

  const reminderMap = new Map();
  reminderRows.forEach(r => {
    const key = `${r.customer_id}_${r.occasion_type}_${r.occasion_year}`;
    reminderMap.set(key, r);
  });

  const occasionsList = [];

  for (const cust of customers) {
    const effectiveTier = cust.default_tier || "Regular";
    const badgeColor = effectiveTier === "Platinum" ? "#9b59b6" : effectiveTier === "Gold" ? "#f1c40f" : "#3498db";

    // Check Birthday
    if (cust.date_of_birth && (occasion === "all" || occasion === "birthday" || occasion === "BIRTHDAY")) {
      const bdayInfo = calculateNextOccurrence(cust.date_of_birth, istNow);
      if (bdayInfo) {
        const rem = reminderMap.get(`${cust.id}_BIRTHDAY_${bdayInfo.occurrenceYear}`);
        const status = rem ? rem.reminder_status : (bdayInfo.daysUntil === 0 ? "DUE_TODAY" : "UPCOMING");

        occasionsList.push({
          customerId: cust.id,
          custCode: cust.cust_code || `CUST-${cust.id}`,
          customerName: cust.full_name,
          phone: cust.phone,
          email: cust.email,
          city: cust.city || "-",
          tier: effectiveTier,
          badgeColor,
          occasionType: "BIRTHDAY",
          originalDate: cust.date_of_birth ? new Date(cust.date_of_birth).toISOString().slice(0, 10) : null,
          occasionDate: bdayInfo.nextDateStr,
          occurrenceYear: bdayInfo.occurrenceYear,
          daysUntil: bdayInfo.daysUntil,
          isThisMonth: bdayInfo.isThisMonth,
          status,
          reminderId: rem?.id || null,
          greetingGenerated: Boolean(rem?.greeting_sent),
          couponCode: rem?.voucher_code || null,
          bonusPoints: rem?.bonus_loyalty_points || 0,
          notes: rem?.notes || null,
          preferences: {
            optInWhatsapp: Boolean(cust.opt_in_whatsapp),
            optInSms: Boolean(cust.opt_in_sms),
            optInMarketing: Boolean(cust.opt_in_marketing),
            preferredChannel: cust.preferred_channel || "WHATSAPP"
          }
        });
      }
    }

    // Check Anniversary
    if (cust.anniversary && (occasion === "all" || occasion === "anniversary" || occasion === "ANNIVERSARY")) {
      const annivInfo = calculateNextOccurrence(cust.anniversary, istNow);
      if (annivInfo) {
        const rem = reminderMap.get(`${cust.id}_ANNIVERSARY_${annivInfo.occurrenceYear}`);
        const status = rem ? rem.reminder_status : (annivInfo.daysUntil === 0 ? "DUE_TODAY" : "UPCOMING");

        occasionsList.push({
          customerId: cust.id,
          custCode: cust.cust_code || `CUST-${cust.id}`,
          customerName: cust.full_name,
          phone: cust.phone,
          email: cust.email,
          city: cust.city || "-",
          tier: effectiveTier,
          badgeColor,
          occasionType: "ANNIVERSARY",
          originalDate: cust.anniversary ? new Date(cust.anniversary).toISOString().slice(0, 10) : null,
          occasionDate: annivInfo.nextDateStr,
          occurrenceYear: annivInfo.occurrenceYear,
          daysUntil: annivInfo.daysUntil,
          isThisMonth: annivInfo.isThisMonth,
          status,
          reminderId: rem?.id || null,
          greetingGenerated: Boolean(rem?.greeting_sent),
          couponCode: rem?.voucher_code || null,
          bonusPoints: rem?.bonus_loyalty_points || 0,
          notes: rem?.notes || null,
          preferences: {
            optInWhatsapp: Boolean(cust.opt_in_whatsapp),
            optInSms: Boolean(cust.opt_in_sms),
            optInMarketing: Boolean(cust.opt_in_marketing),
            preferredChannel: cust.preferred_channel || "WHATSAPP"
          }
        });
      }
    }
  }

  // Filter by range
  let filtered = occasionsList;
  if (range === "today") {
    filtered = filtered.filter(o => o.daysUntil === 0);
  } else if (range === "7d") {
    filtered = filtered.filter(o => o.daysUntil >= 0 && o.daysUntil <= 7);
  } else if (range === "30d") {
    filtered = filtered.filter(o => o.daysUntil >= 0 && o.daysUntil <= 30);
  } else if (range === "month") {
    filtered = filtered.filter(o => o.isThisMonth);
  }

  // Filter by search
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(o =>
      o.customerName.toLowerCase().includes(s) ||
      o.phone.includes(s) ||
      o.custCode.toLowerCase().includes(s)
    );
  }

  // Filter by tier
  if (tier) {
    filtered = filtered.filter(o => o.tier.toLowerCase() === tier.toLowerCase());
  }

  // Sort by daysUntil ASC, then customerName
  filtered.sort((a, b) => a.daysUntil - b.daysUntil || a.customerName.localeCompare(b.customerName));

  return filtered;
}

/**
 * Get comprehensive occasion KPIs
 */
async function getOccasionKpis(allowedBranchIds) {
  const istNow = getIstNow();
  const allOccasions = await getCustomerOccasions({ range: "all", occasion: "all", allowedBranchIds });

  const birthdaysToday = allOccasions.filter(o => o.occasionType === "BIRTHDAY" && o.daysUntil === 0).length;
  const anniversariesToday = allOccasions.filter(o => o.occasionType === "ANNIVERSARY" && o.daysUntil === 0).length;
  const upcoming7Days = allOccasions.filter(o => o.daysUntil >= 0 && o.daysUntil <= 7).length;
  const upcoming30Days = allOccasions.filter(o => o.daysUntil >= 0 && o.daysUntil <= 30).length;

  const vipOccasionsThisMonth = allOccasions.filter(o =>
    o.isThisMonth && ["Gold", "Platinum", "Diamond VIP"].includes(o.tier)
  ).length;

  const goldOccasionsThisMonth = allOccasions.filter(o => o.isThisMonth && o.tier === "Gold").length;
  const platinumOccasionsThisMonth = allOccasions.filter(o => o.isThisMonth && o.tier === "Platinum").length;
  const diamondOccasionsThisMonth = allOccasions.filter(o => o.isThisMonth && o.tier === "Diamond VIP").length;

  return {
    birthdaysToday,
    anniversariesToday,
    upcoming7Days,
    upcoming30Days,
    vipOccasionsThisMonth,
    goldOccasionsThisMonth,
    platinumOccasionsThisMonth,
    diamondOccasionsThisMonth,
    currentMonth: istNow.month,
    currentYear: istNow.year
  };
}

/**
 * Acknowledge an occasion reminder (sets status = ACKNOWLEDGED, audit logs)
 */
async function acknowledgeOccasion(customerId, occasionType, occasionDate, acknowledgedBy, notes = "") {
  const normType = occasionType.toUpperCase();
  const dateObj = new Date(occasionDate);
  const year = dateObj.getFullYear();
  const dateStr = dateObj.toISOString().slice(0, 10);

  const [existing] = await db.query(
    `SELECT * FROM customer_occasion_reminders
     WHERE customer_id = ? AND occasion_type = ? AND occasion_year = ?`,
    [customerId, normType, year]
  );

  let reminderId = null;
  if (existing.length > 0) {
    reminderId = existing[0].id;
    await db.query(
      `UPDATE customer_occasion_reminders SET
         reminder_status = 'ACKNOWLEDGED',
         notes = COALESCE(?, notes),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [notes || null, reminderId]
    );
  } else {
    const istNow = getIstNow();
    const targetDate = new Date(dateStr);
    const diffDays = Math.max(0, Math.round((targetDate - istNow.todayMidnight) / 86400000));

    const [res] = await db.query(
      `INSERT INTO customer_occasion_reminders
       (customer_id, occasion_type, occasion_date, occasion_year, days_in_advance, reminder_status, notes)
       VALUES (?, ?, ?, ?, ?, 'ACKNOWLEDGED', ?)`,
      [customerId, normType, dateStr, year, diffDays, notes || null]
    );
    reminderId = res.insertId;
  }

  // Audit log with schema-safe column names
  try {
    await db.query(
      `INSERT INTO customer_audit_logs (customer_id, action_type, performed_by, description)
       VALUES (?, 'OCCASION_REMINDER_ACKNOWLEDGED', ?, ?)`,
      [customerId, acknowledgedBy, `Acknowledged ${normType} for ${dateStr} (${notes || 'Staff contact'})`]
    );
  } catch (err) {
    console.warn("Audit log notice:", err.message);
  }

  return { success: true, reminderId, status: "ACKNOWLEDGED" };
}

module.exports = {
  getIstNow,
  calculateNextOccurrence,
  getCustomerOccasions,
  getOccasionKpis,
  acknowledgeOccasion,
};
