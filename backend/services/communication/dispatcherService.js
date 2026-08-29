const db = require("../../config/db");
const occasionService = require("../occasionService");
const communicationService = require("./communicationService");

/**
 * Dispatch automated daily occasion greetings for celebrations today
 */
async function dispatchDailyOccasionGreetings() {
  const istNow = occasionService.getIstNow();
  const occasionsToday = await occasionService.getCustomerOccasions({ range: "today", occasion: "all" });

  const results = {
    totalEvaluated: occasionsToday.length,
    dispatched: 0,
    skipped: 0,
    errors: 0
  };

  for (const occ of occasionsToday) {
    try {
      const channel = occ.preferences.preferredChannel === "WHATSAPP" ? "WHATSAPP" : "SMS";
      let res;
      if (occ.occasionType === "BIRTHDAY") {
        res = await communicationService.sendBirthdayGreeting(occ.customerId, occ.occurrenceYear, {
          channel,
          performedBy: "Automated Occasion Scheduler"
        });
      } else {
        res = await communicationService.sendAnniversaryGreeting(occ.customerId, occ.occurrenceYear, {
          channel,
          performedBy: "Automated Occasion Scheduler"
        });
      }

      if (res.success && res.status === "SENT") {
        results.dispatched++;
      } else {
        results.skipped++;
      }
    } catch (err) {
      console.warn(`Error dispatching greeting for customer ${occ.customerId}:`, err.message);
      results.errors++;
    }
  }

  return results;
}

/**
 * Dispatch automated reminders for EMI installments due in next 1-2 days
 */
async function dispatchDailyEmiReminders() {
  const [installments] = await db.query(
    `SELECT ei.id, ei.plan_id, ei.installment_no, ei.due_date, ei.amount,
            ep.customer_id, c.full_name, c.phone, c.opt_in_sms
     FROM emi_installments ei
     JOIN emi_plans ep ON ei.plan_id = ep.id
     JOIN customers c ON ep.customer_id = c.id
     WHERE ei.status = 'PENDING'
       AND ei.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 2 DAY)
       AND c.status = 'ACTIVE'`
  );

  const results = {
    totalEvaluated: installments.length,
    dispatched: 0,
    skipped: 0,
    errors: 0
  };

  for (const inst of installments) {
    try {
      const res = await communicationService.sendEmiReminder(inst.customer_id, inst.id, {
        channel: "SMS",
        dueAmount: Number(inst.amount),
        dueDate: new Date(inst.due_date).toLocaleDateString("en-IN"),
        performedBy: "Automated EMI Scheduler"
      });

      if (res.success && res.status === "SENT") results.dispatched++;
      else results.skipped++;
    } catch (err) {
      console.warn(`Error dispatching EMI reminder for inst ${inst.id}:`, err.message);
      results.errors++;
    }
  }

  return results;
}

module.exports = {
  dispatchDailyOccasionGreetings,
  dispatchDailyEmiReminders
};
