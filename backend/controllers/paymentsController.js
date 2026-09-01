const db = require("../config/db");

// ── GET /api/payments/kpis ──────────────────────────────────────────────────
async function getKpis(req, res) {
  try {
    // 1. Sales Invoices by payment mode
    const [invRows] = await db.query(`
      SELECT
        payment_mode,
        COALESCE(SUM(paid_amount), 0) AS total_paid,
        COUNT(*) AS count,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN paid_amount ELSE 0 END), 0) AS today_paid
      FROM invoices
      WHERE status != 'Cancelled'
      GROUP BY payment_mode
    `);

    // 2. Customer Ledger payments (settlements)
    const [ledgerRows] = await db.query(`
      SELECT
        COALESCE(SUM(credit), 0) AS total_paid,
        COUNT(*) AS count,
        COALESCE(SUM(CASE WHEN DATE(date) = CURRENT_DATE THEN credit ELSE 0 END), 0) AS today_paid
      FROM customer_ledger
      WHERE credit > 0
    `);

    // 3. Supplier Payments (outflows)
    const [supRows] = await db.query(`
      SELECT
        payment_mode,
        COALESCE(SUM(amount), 0) AS total_paid,
        COUNT(*) AS count,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN amount ELSE 0 END), 0) AS today_paid
      FROM supplier_payments
      GROUP BY payment_mode
    `);

    // 4. EMI Payments
    const [emiRows] = await db.query(`
      SELECT
        payment_mode,
        COALESCE(SUM(amount), 0) AS total_paid,
        COUNT(*) AS count,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN amount ELSE 0 END), 0) AS today_paid
      FROM emi_payments
      GROUP BY payment_mode
    `);

    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let bankTotal = 0;
    let chequeTotal = 0;
    let emiTotal = 0;
    let todayCash = 0;
    let todayUpi = 0;
    let todayCard = 0;
    let todayBank = 0;

    invRows.forEach(r => {
      const mode = (r.payment_mode || "CASH").toUpperCase();
      const amt = Number(r.total_paid || 0);
      const tAmt = Number(r.today_paid || 0);
      if (mode.includes("CASH")) { cashTotal += amt; todayCash += tAmt; }
      else if (mode.includes("UPI") || mode.includes("GPAY") || mode.includes("PHONEPE")) { upiTotal += amt; todayUpi += tAmt; }
      else if (mode.includes("CARD") || mode.includes("POS")) { cardTotal += amt; todayCard += tAmt; }
      else if (mode.includes("NEFT") || mode.includes("RTGS") || mode.includes("NETBANKING") || mode.includes("BANK")) { bankTotal += amt; todayBank += tAmt; }
      else if (mode.includes("CHEQUE")) { chequeTotal += amt; }
      else if (mode.includes("EMI")) { emiTotal += amt; }
      else { upiTotal += amt; todayUpi += tAmt; }
    });

    emiRows.forEach(r => {
      const mode = (r.payment_mode || "CASH").toUpperCase();
      const amt = Number(r.total_paid || 0);
      const tAmt = Number(r.today_paid || 0);
      if (mode.includes("CASH")) { cashTotal += amt; todayCash += tAmt; }
      else if (mode.includes("UPI")) { upiTotal += amt; todayUpi += tAmt; }
      else if (mode.includes("CARD")) { cardTotal += amt; todayCard += tAmt; }
      else { emiTotal += amt; }
    });

    const totalCollection = cashTotal + upiTotal + cardTotal + bankTotal + chequeTotal + emiTotal;
    const todayTotal = todayCash + todayUpi + todayCard + todayBank;

    res.json({
      success: true,
      data: {
        total_collection: totalCollection,
        today_collection: todayTotal,
        cash_total: cashTotal,
        upi_total: upiTotal,
        card_total: cardTotal,
        bank_total: bankTotal,
        cheque_total: chequeTotal,
        emi_total: emiTotal,
        today_cash: todayCash,
        today_upi: todayUpi,
        today_card: todayCard,
        today_bank: todayBank,
        breakdown: [
          { mode: "Cash", total: cashTotal, pct: totalCollection > 0 ? Math.round((cashTotal / totalCollection) * 100) : 0, color: "#2ecc71" },
          { mode: "UPI (GPay / PhonePe / Paytm)", total: upiTotal, pct: totalCollection > 0 ? Math.round((upiTotal / totalCollection) * 100) : 0, color: "#3498db" },
          { mode: "Card (POS Swipe)", total: cardTotal, pct: totalCollection > 0 ? Math.round((cardTotal / totalCollection) * 100) : 0, color: "#9b59b6" },
          { mode: "Bank Transfer / NEFT / RTGS", total: bankTotal, pct: totalCollection > 0 ? Math.round((bankTotal / totalCollection) * 100) : 0, color: "#f39c12" },
          { mode: "Cheque / DD", total: chequeTotal, pct: totalCollection > 0 ? Math.round((chequeTotal / totalCollection) * 100) : 0, color: "#e67e22" },
          { mode: "Savings Scheme & EMI", total: emiTotal, pct: totalCollection > 0 ? Math.round((emiTotal / totalCollection) * 100) : 0, color: "#1abc9c" }
        ]
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/payments/modes ──────────────────────────────────────────────────
async function getModes(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM payment_modes ORDER BY id ASC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── PUT /api/payments/modes/:id ──────────────────────────────────────────────
async function updateMode(req, res) {
  try {
    const { id } = req.params;
    const { is_active, mdr_pct, vpa_id, account_no, terminal_id, description } = req.body;

    const updates = [];
    const params = [];

    if (is_active !== undefined) { updates.push("is_active = ?"); params.push(is_active ? 1 : 0); }
    if (mdr_pct !== undefined) { updates.push("mdr_pct = ?"); params.push(Number(mdr_pct || 0)); }
    if (vpa_id !== undefined) { updates.push("vpa_id = ?"); params.push(vpa_id || null); }
    if (account_no !== undefined) { updates.push("account_no = ?"); params.push(account_no || null); }
    if (terminal_id !== undefined) { updates.push("terminal_id = ?"); params.push(terminal_id || null); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description || null); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    params.push(id);
    await db.query(`UPDATE payment_modes SET ${updates.join(", ")} WHERE id = ?`, params);

    res.json({ success: true, message: "Payment mode configuration updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/payments/transactions ──────────────────────────────────────────
async function getTransactions(req, res) {
  try {
    const { mode, type, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const txns = [];

    // 1. Invoices
    try {
      const [invRows] = await db.query(`
        SELECT i.id, i.invoice_no AS ref_no, i.customer_id, c.full_name AS party_name,
               i.payment_mode, i.paid_amount AS amount, i.grand_total, i.status, i.created_at
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.paid_amount > 0
        ORDER BY i.created_at DESC
        LIMIT 100
      `);
      invRows.forEach(i => {
        txns.push({
          id: `INV-${i.id}`,
          type: "SALE_RECEIPT",
          ref_no: i.ref_no,
          party_name: i.party_name || "Walk-in Customer",
          party_type: "Customer",
          payment_mode: i.payment_mode || "Cash",
          amount: Number(i.amount),
          status: "Completed",
          date: i.created_at,
          source: "invoices"
        });
      });
    } catch (e) {
      console.warn("Notice: invoices txns query:", e.message);
    }

    // 2. Customer Ledger Payments
    try {
      const [ledRows] = await db.query(`
        SELECT l.id, l.reference AS ref_no, l.customer_id, c.full_name AS party_name,
               l.credit AS amount, l.particulars, l.created_at, l.date
        FROM customer_ledger l
        LEFT JOIN customers c ON l.customer_id = c.id
        WHERE l.credit > 0
        ORDER BY l.created_at DESC
        LIMIT 100
      `);
      ledRows.forEach(l => {
        txns.push({
          id: `LED-${l.id}`,
          type: "DUES_COLLECTION",
          ref_no: l.ref_no || `REC-${l.id}`,
          party_name: l.party_name || "Customer",
          party_type: "Customer",
          payment_mode: "Cash / Bank",
          amount: Number(l.amount),
          status: "Completed",
          date: l.created_at || l.date,
          source: "customer_ledger"
        });
      });
    } catch (e) {
      console.warn("Notice: ledger txns query:", e.message);
    }

    // 3. Supplier Payments
    try {
      const [supRows] = await db.query(`
        SELECT sp.id, sp.pay_id AS ref_no, sp.supplier_id, s.company_name AS party_name,
               sp.payment_mode, sp.amount, sp.reference, sp.created_at
        FROM supplier_payments sp
        LEFT JOIN suppliers s ON sp.supplier_id = s.id
        ORDER BY sp.created_at DESC
        LIMIT 100
      `);
      supRows.forEach(sp => {
        txns.push({
          id: `SP-${sp.id}`,
          type: "SUPPLIER_PAYOUT",
          ref_no: sp.ref_no || sp.reference || `PAY-${sp.id}`,
          party_name: sp.party_name || "Supplier",
          party_type: "Supplier",
          payment_mode: sp.payment_mode || "Bank Transfer",
          amount: Number(sp.amount),
          status: "Settled",
          date: sp.created_at,
          source: "supplier_payments"
        });
      });
    } catch (e) {
      console.warn("Notice: supplier txns query:", e.message);
    }

    // 4. EMI Payments
    try {
      const [emiRows] = await db.query(`
        SELECT ep.id, ep.payment_no AS ref_no, ep.customer_id, c.full_name AS party_name,
               ep.payment_mode, ep.amount, ep.created_at
        FROM emi_payments ep
        LEFT JOIN customers c ON ep.customer_id = c.id
        ORDER BY ep.created_at DESC
        LIMIT 100
      `);
      emiRows.forEach(ep => {
        txns.push({
          id: `EMI-${ep.id}`,
          type: "EMI_INSTALLMENT",
          ref_no: ep.ref_no || `EMI-${ep.id}`,
          party_name: ep.party_name || "Customer",
          party_type: "Customer",
          payment_mode: ep.payment_mode || "UPI",
          amount: Number(ep.amount),
          status: "Received",
          date: ep.created_at,
          source: "emi_payments"
        });
      });
    } catch (e) {
      console.warn("Notice: emi txns query:", e.message);
    }

    // Filter by mode
    let filtered = txns;
    if (mode && mode !== "ALL") {
      const m = mode.toLowerCase();
      filtered = filtered.filter(t => t.payment_mode.toLowerCase().includes(m));
    }

    // Filter by search
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.ref_no.toLowerCase().includes(s) ||
        t.party_name.toLowerCase().includes(s) ||
        t.payment_mode.toLowerCase().includes(s)
      );
    }

    // Sort by date DESC
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: paginated,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/payments/record (Transactional Payment Settlement) ────────────
async function recordPayment(req, res) {
  const {
    type = "CUSTOMER_DUES", // "CUSTOMER_DUES" or "SUPPLIER_PAYMENT"
    customer_id,
    supplier_id,
    amount,
    payment_mode = "Cash",
    reference_no,
    remark,
  } = req.body;

  const numAmount = parseFloat(amount);
  if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, message: "Please enter a valid, positive payment amount." });
  }

  const performedBy = req.user?.full_name || req.user?.username || "Admin";
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    let transactionResult = null;

    if (type === "CUSTOMER_DUES") {
      if (!customer_id) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: "Customer is required for customer dues payment." });
      }

      const [custRows] = await conn.query("SELECT id, full_name, balance_due FROM customers WHERE id = ? FOR UPDATE", [customer_id]);
      if (custRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: "Customer not found" });
      }
      const customer = custRows[0];
      const currentDue = Number(customer.balance_due || 0);
      const newDue = Math.max(0, currentDue - numAmount);

      // 1. Update customer balance due
      await conn.query("UPDATE customers SET balance_due = ? WHERE id = ?", [newDue, customer_id]);

      // 2. Insert into customer_ledger
      const ref = reference_no || `REC-${Date.now().toString().slice(-6)}`;
      const [ledResult] = await conn.query(
        `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference)
         VALUES (?, CURRENT_DATE, ?, 0, ?, ?, ?)`,
        [customer_id, `Payment received via ${payment_mode}${remark ? ' - ' + remark : ''}`, numAmount, newDue, ref]
      );

      // 3. Audit log
      try {
        await conn.query(
          `INSERT INTO customer_audit_logs (customer_id, action_type, action, performed_by, description, details)
           VALUES (?, 'PAYMENT_RECEIVED', 'PAYMENT_RECEIVED', ?, ?, ?)`,
          [
            customer_id, performedBy,
            `Collected payment of ₹${numAmount.toLocaleString('en-IN')} via ${payment_mode} (Ref: ${ref}). Balance due: ₹${newDue.toLocaleString('en-IN')}`,
            `Collected payment of ₹${numAmount.toLocaleString('en-IN')} via ${payment_mode} (Ref: ${ref}). Balance due: ₹${newDue.toLocaleString('en-IN')}`
          ]
        );
      } catch (e) {
        console.warn("Audit notice:", e.message);
      }

      transactionResult = {
        receipt_id: ref,
        customer_id,
        customer_name: customer.full_name,
        amount_paid: numAmount,
        previous_balance: currentDue,
        new_balance: newDue,
        payment_mode
      };

    } else if (type === "SUPPLIER_PAYMENT") {
      if (!supplier_id) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: "Supplier is required for supplier settlement." });
      }

      const [supRows] = await conn.query("SELECT id, company_name, outstanding FROM suppliers WHERE id = ? FOR UPDATE", [supplier_id]);
      if (supRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: "Supplier not found" });
      }
      const supplier = supRows[0];
      const currentOut = Number(supplier.outstanding || 0);
      const newOut = Math.max(0, currentOut - numAmount);

      // 1. Update supplier outstanding
      await conn.query("UPDATE suppliers SET outstanding = ? WHERE id = ?", [newOut, supplier_id]);

      // 2. Generate pay ID & insert supplier_payments
      const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM supplier_payments");
      const pay_id = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
      const ref = reference_no || `UTR-${Date.now().toString().slice(-6)}`;

      await conn.query(
        `INSERT INTO supplier_payments (pay_id, supplier_id, amount, payment_mode, reference, remark)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pay_id, supplier_id, numAmount, payment_mode, ref, remark || null]
      );

      // 3. Insert supplier_ledger entry
      await conn.query(
        `INSERT INTO supplier_ledger (supplier_id, date, po_no, item, total, paid, balance)
         VALUES (?, CURRENT_DATE, ?, ?, 0, ?, ?)`,
        [supplier_id, ref, `Payment disbursed via ${payment_mode}`, numAmount, newOut]
      );

      transactionResult = {
        pay_id,
        supplier_id,
        supplier_name: supplier.company_name,
        amount_paid: numAmount,
        previous_outstanding: currentOut,
        new_outstanding: newOut,
        payment_mode
      };
    } else {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Invalid payment transaction type." });
    }

    await conn.commit();
    res.status(201).json({
      success: true,
      message: `Payment of ₹${numAmount.toLocaleString('en-IN')} recorded successfully via ${payment_mode}.`,
      data: transactionResult
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

module.exports = {
  getKpis,
  getModes,
  updateMode,
  getTransactions,
  recordPayment,
};
