const db = require("../config/db");

/**
 * Generate personalized greeting with optional coupon code and bonus loyalty points
 */
async function generateGreeting(customer, occasionType, options = {}) {
  const { include_coupon = false, include_bonus_points = false, bonus_points = 100, performed_by = "Staff" } = options;
  const normType = occasionType.toUpperCase();
  const customerName = customer.full_name || customer.name || "Valued Customer";
  const firstName = customerName.split(" ")[0];
  const year = new Date().getFullYear();

  let greetingText = "";
  if (normType === "BIRTHDAY") {
    greetingText = `Dear ${firstName},\n\nWishing you a very Happy Birthday from all of us at Ceritage Jewellery! ✨\n\nMay your year ahead be as radiant, joyous, and precious as fine diamonds and pure gold. We are truly honored to celebrate life's treasured milestones with you.\n\nWarmest wishes,\nTeam Ceritage`;
  } else {
    greetingText = `Dear ${firstName},\n\nWarmest congratulations to you and your family on your Anniversary! 💍✨\n\nMay your shared journey continue to sparkle with timeless love, good health, and abundant joy. Wishing you many more golden years together.\n\nBest regards,\nTeam Ceritage`;
  }

  let couponCode = null;
  if (include_coupon) {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    couponCode = `${normType === 'BIRTHDAY' ? 'BDAY' : 'ANNIV'}-${year}-${randomSuffix}`;
    greetingText += `\n\n🎁 Special Gift: Use exclusive code [${couponCode}] to enjoy 5% special savings on your next visit!`;
  }

  let pointsGranted = 0;
  if (include_bonus_points && Number(bonus_points) > 0) {
    const pts = parseInt(bonus_points);
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Check if points already granted for this occasion/year
      const [existingRem] = await conn.query(
        `SELECT id, bonus_loyalty_points FROM customer_occasion_reminders
         WHERE customer_id = ? AND occasion_type = ? AND occasion_year = ? AND bonus_loyalty_points > 0`,
        [customer.id, normType, year]
      );

      if (existingRem.length === 0) {
        const [custRows] = await conn.query(
          "SELECT id, loyalty_points FROM customers WHERE id = ? FOR UPDATE",
          [customer.id]
        );
        if (custRows.length > 0) {
          const currentPts = Number(custRows[0].loyalty_points || 0);
          const newPts = currentPts + pts;
          const refId = `OCC-${normType}-${year}`;

          await conn.query(
            `INSERT INTO customer_loyalty_transactions
             (customer_id, transaction_type, points, balance_after, reference_type, reference_id, description, performed_by)
             VALUES (?, 'EARN', ?, ?, 'OCCASION', ?, ?, ?)`,
            [
              customer.id, pts, newPts, refId,
              `Celebration bonus points for ${normType} ${year}`, performed_by
            ]
          );

          await conn.query("UPDATE customers SET loyalty_points = ? WHERE id = ?", [newPts, customer.id]);
          pointsGranted = pts;

          try {
            await conn.query(
              `INSERT INTO customer_audit_logs (customer_id, action_type, performed_by, description)
               VALUES (?, 'OCCASION_BONUS_POINTS_GRANTED', ?, ?)`,
              [customer.id, performed_by, `Granted ${pts} bonus loyalty points for ${normType} ${year}`]
            );
          } catch (e) {
            console.warn("Audit notice:", e.message);
          }
        }
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      console.warn("Failed to grant occasion bonus points:", err.message);
    } finally {
      conn.release();
    }

    if (pointsGranted > 0) {
      greetingText += `\n\n🏆 Loyalty Perk: We have credited ${pointsGranted} bonus reward points to your account!`;
    }
  }

  // Update or insert reminder record with greeting_sent and voucher_code
  try {
    const [remRows] = await db.query(
      "SELECT id FROM customer_occasion_reminders WHERE customer_id = ? AND occasion_type = ? AND occasion_year = ?",
      [customer.id, normType, year]
    );

    if (remRows.length > 0) {
      await db.query(
        `UPDATE customer_occasion_reminders SET
           reminder_status = 'GREETED',
           greeting_sent = 1,
           greeting_timestamp = CURRENT_TIMESTAMP,
           voucher_code = COALESCE(?, voucher_code),
           bonus_loyalty_points = GREATEST(bonus_loyalty_points, ?)
         WHERE id = ?`,
        [couponCode, pointsGranted, remRows[0].id]
      );
    } else {
      const occDate = normType === "BIRTHDAY" ? customer.date_of_birth : customer.anniversary;
      const occDateStr = occDate ? new Date(occDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      await db.query(
        `INSERT INTO customer_occasion_reminders
         (customer_id, occasion_type, occasion_date, occasion_year, days_in_advance, reminder_status, greeting_sent, greeting_timestamp, voucher_code, bonus_loyalty_points)
         VALUES (?, ?, ?, ?, 0, 'GREETED', 1, CURRENT_TIMESTAMP, ?, ?)`,
        [customer.id, normType, occDateStr, year, couponCode, pointsGranted]
      );
    }

    try {
      await db.query(
        `INSERT INTO customer_audit_logs (customer_id, action_type, performed_by, description)
         VALUES (?, 'OCCASION_GREETING_GENERATED', ?, ?)`,
        [customer.id, performed_by, `Generated ${normType} greeting card${couponCode ? ` (Coupon: ${couponCode})` : ''}`]
      );
    } catch (e) {
      console.warn("Audit notice:", e.message);
    }
  } catch (err) {
    console.warn("Notice updating occasion reminder on greeting generation:", err.message);
  }

  return {
    success: true,
    occasion_type: normType,
    customer_id: customer.id,
    customer_name: customerName,
    phone: customer.phone,
    greeting_text: greetingText,
    coupon_code: couponCode,
    bonus_points_granted: pointsGranted,
    generated_at: new Date().toISOString()
  };
}

module.exports = { generateGreeting };
