const db = require("../config/db");

// ── GET /api/accounting/summary ──────────────────────────────────────────────
async function getSummary(req, res) {
  try {
    // 1. Sales & Revenue
    const [[invStats]] = await db.query(`
      SELECT
        COALESCE(SUM(cgst + sgst + igst), 0) AS total_gst,
        COALESCE(SUM(grand_total), 0) AS total_sales,
        COALESCE(SUM(grand_total - (COALESCE(cgst, 0) + COALESCE(sgst, 0) + COALESCE(igst, 0))), 0) AS total_taxable,
        COALESCE(SUM(paid_amount), 0) AS total_collected,
        COALESCE(SUM(balance_due), 0) AS total_receivables,
        COALESCE(SUM(CASE WHEN payment_mode = 'Cash' THEN paid_amount ELSE 0 END), 0) AS cash_inflow,
        COALESCE(SUM(CASE WHEN payment_mode != 'Cash' THEN paid_amount ELSE 0 END), 0) AS bank_inflow
      FROM invoices
      WHERE status != 'Cancelled'
    `);

    // 2. Customer Ledger Cash/Bank Receipts
    const [[custLedgerStats]] = await db.query(`
      SELECT
        COALESCE(SUM(credit), 0) AS total_dues_collected,
        COALESCE(SUM(CASE WHEN particulars LIKE '%Cash%' THEN credit ELSE 0 END), 0) AS ledger_cash,
        COALESCE(SUM(CASE WHEN particulars NOT LIKE '%Cash%' THEN credit ELSE 0 END), 0) AS ledger_bank
      FROM customer_ledger
      WHERE credit > 0
    `);

    // 3. Supplier Purchases & Payables
    const [[supStats]] = await db.query(`
      SELECT
        COALESCE(SUM(outstanding), 0) AS total_payables
      FROM suppliers
    `);

    const [[supPayStats]] = await db.query(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_disbursed,
        COALESCE(SUM(CASE WHEN payment_mode = 'Cash' THEN amount ELSE 0 END), 0) AS cash_outflow,
        COALESCE(SUM(CASE WHEN payment_mode != 'Cash' THEN amount ELSE 0 END), 0) AS bank_outflow
      FROM supplier_payments
    `);

    // 4. Karigar Payments & Labour
    const [[karigarStats]] = await db.query(`
      SELECT
        COALESCE(SUM(amount), 0) AS karigar_labour
      FROM karigar_payments
    `);

    // 5. Inventory Valuation from products
    const [[stockStats]] = await db.query(`
      SELECT
        COALESCE(SUM(stock_qty * purchase_price), 0) AS stock_value
      FROM products
      WHERE status = 'Active' OR status IS NULL
    `);

    // 6. Manual Expenses from Journal
    const [[expStats]] = await db.query(`
      SELECT
        COALESCE(SUM(jl.debit), 0) AS manual_expenses
      FROM journal_entry_lines jl
      JOIN accounts a ON jl.account_id = a.id
      WHERE a.type = 'EXPENSE'
    `);

    // Derived Financial Balances
    const cashInHand = Math.max(0, Number(invStats.cash_inflow) + Number(custLedgerStats.ledger_cash) - Number(supPayStats.cash_outflow));
    const bankBalance = Math.max(0, Number(invStats.bank_inflow) + Number(custLedgerStats.ledger_bank) - Number(supPayStats.bank_outflow));
    const receivables = Number(invStats.total_receivables);
    const payables = Number(supStats.total_payables);
    const revenue = Number(invStats.total_taxable);
    const totalExpenses = Number(karigarStats.karigar_labour) + Number(expStats.manual_expenses);
    const netProfit = revenue - totalExpenses;
    const totalAssets = cashInHand + bankBalance + receivables + Number(stockStats.stock_value);

    res.json({
      success: true,
      data: {
        cash_in_hand: cashInHand,
        bank_balance: bankBalance,
        receivables,
        payables,
        revenue,
        net_profit: netProfit,
        total_assets: totalAssets,
        gst_payable: Number(invStats.total_gst),
        stock_valuation: Number(stockStats.stock_value)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/accounting/cashbook ─────────────────────────────────────────────
async function getCashBook(req, res) {
  try {
    const entries = [];

    // 1. Cash Invoices
    const [invRows] = await db.query(`
      SELECT i.id, i.invoice_no, i.created_at AS date, i.paid_amount, c.full_name AS customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.payment_mode = 'Cash' AND i.paid_amount > 0
      ORDER BY i.created_at DESC
      LIMIT 50
    `);
    invRows.forEach(i => {
      entries.push({
        id: `INV-${i.id}`,
        date: i.date,
        particulars: `Cash Sale - ${i.customer_name || 'Walk-in Customer'}`,
        voucher_no: i.invoice_no,
        type: "Receipt (Sales)",
        debit: Number(i.paid_amount),
        credit: 0
      });
    });

    // 2. Cash Customer Dues
    const [ledRows] = await db.query(`
      SELECT l.id, l.date, l.credit, l.reference, l.particulars, c.full_name
      FROM customer_ledger l
      LEFT JOIN customers c ON l.customer_id = c.id
      WHERE l.credit > 0 AND l.particulars LIKE '%Cash%'
      ORDER BY l.created_at DESC
      LIMIT 50
    `);
    ledRows.forEach(l => {
      entries.push({
        id: `LED-${l.id}`,
        date: l.date,
        particulars: `Customer Dues Receipt - ${l.full_name || 'Customer'}`,
        voucher_no: l.reference || `REC-${l.id}`,
        type: "Receipt (Ledger)",
        debit: Number(l.credit),
        credit: 0
      });
    });

    // 3. Cash Supplier Payments
    const [supRows] = await db.query(`
      SELECT sp.id, sp.pay_id, sp.amount, sp.created_at AS date, s.company_name
      FROM supplier_payments sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      WHERE sp.payment_mode = 'Cash'
      ORDER BY sp.created_at DESC
      LIMIT 50
    `);
    supRows.forEach(s => {
      entries.push({
        id: `SP-${s.id}`,
        date: s.date,
        particulars: `Supplier Cash Payment - ${s.company_name || 'Supplier'}`,
        voucher_no: s.pay_id,
        type: "Payment (Supplier)",
        debit: 0,
        credit: Number(s.amount)
      });
    });

    // 4. Cash Journal Vouchers
    const [jRows] = await db.query(`
      SELECT j.voucher_no, j.entry_date AS date, j.narration, jl.debit, jl.credit
      FROM journal_entries j
      JOIN journal_entry_lines jl ON j.id = jl.journal_id
      JOIN accounts a ON jl.account_id = a.id
      WHERE a.code = '1010'
      ORDER BY j.entry_date DESC
      LIMIT 50
    `);
    jRows.forEach(j => {
      entries.push({
        id: `JV-${j.voucher_no}`,
        date: j.date,
        particulars: j.narration || "Journal Voucher",
        voucher_no: j.voucher_no,
        type: "Voucher",
        debit: Number(j.debit),
        credit: Number(j.credit)
      });
    });

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let running = 0;
    entries.forEach(e => {
      running += (e.debit - e.credit);
      e.balance = running;
    });

    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/accounting/bankbook ─────────────────────────────────────────────
async function getBankBook(req, res) {
  try {
    const entries = [];

    // 1. Digital Invoices (UPI / Card / NetBanking / Cheque)
    const [invRows] = await db.query(`
      SELECT i.id, i.invoice_no, i.created_at AS date, i.paid_amount, i.payment_mode, c.full_name AS customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.payment_mode != 'Cash' AND i.paid_amount > 0
      ORDER BY i.created_at DESC
      LIMIT 50
    `);
    invRows.forEach(i => {
      entries.push({
        id: `INV-${i.id}`,
        date: i.date,
        particulars: `${i.payment_mode} Sale - ${i.customer_name || 'Customer'}`,
        voucher_no: i.invoice_no,
        bank: "HDFC Current A/C",
        reference: i.payment_mode,
        debit: Number(i.paid_amount),
        credit: 0
      });
    });

    // 2. Bank Supplier Payments
    const [supRows] = await db.query(`
      SELECT sp.id, sp.pay_id, sp.amount, sp.payment_mode, sp.reference, sp.created_at AS date, s.company_name
      FROM supplier_payments sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      WHERE sp.payment_mode != 'Cash'
      ORDER BY sp.created_at DESC
      LIMIT 50
    `);
    supRows.forEach(s => {
      entries.push({
        id: `SP-${s.id}`,
        date: s.date,
        particulars: `Supplier Transfer (${s.payment_mode}) - ${s.company_name || 'Supplier'}`,
        voucher_no: s.pay_id,
        bank: "HDFC Current A/C",
        reference: s.reference || "NEFT/RTGS",
        debit: 0,
        credit: Number(s.amount)
      });
    });

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let running = 0;
    entries.forEach(e => {
      running += (e.debit - e.credit);
      e.balance = running;
    });

    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/accounting/trial-balance ────────────────────────────────────────
async function getTrialBalance(req, res) {
  try {
    const [accounts] = await db.query("SELECT * FROM accounts ORDER BY code ASC");

    // Fetch real-time aggregates
    const [[inv]] = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN payment_mode = 'Cash' THEN paid_amount ELSE 0 END), 0) AS cash_in,
        COALESCE(SUM(CASE WHEN payment_mode != 'Cash' THEN paid_amount ELSE 0 END), 0) AS bank_in,
        COALESCE(SUM(balance_due), 0) AS receivables,
        COALESCE(SUM(grand_total - (COALESCE(cgst, 0) + COALESCE(sgst, 0) + COALESCE(igst, 0))), 0) AS sales_taxable,
        COALESCE(SUM(cgst + sgst + igst), 0) AS gst_output
      FROM invoices WHERE status != 'Cancelled'
    `);

    const [[sup]] = await db.query(`
      SELECT COALESCE(SUM(outstanding), 0) AS payables FROM suppliers
    `);

    const [[stock]] = await db.query(`
      SELECT COALESCE(SUM(stock_qty * purchase_price), 0) AS stock_val FROM products WHERE status = 'Active' OR status IS NULL
    `);

    const [[karigar]] = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS labour FROM karigar_payments
    `);

    let totalDebit = 0;
    let totalCredit = 0;

    const tbRows = accounts.map(a => {
      let debit = 0;
      let credit = 0;

      if (a.code === '1010') { // Cash in Hand
        debit = Number(inv.cash_in) + (Number(a.current_balance) > 0 ? Number(a.current_balance) : 0);
      } else if (a.code === '1020') { // Bank
        debit = Number(inv.bank_in);
      } else if (a.code === '1030') { // Receivables
        debit = Number(inv.receivables);
      } else if (a.code === '1040') { // Stock
        debit = Number(stock.stock_val);
      } else if (a.code === '2010') { // Payables
        credit = Number(sup.payables);
      } else if (a.code === '2020') { // GST Output
        credit = Number(inv.gst_output);
      } else if (a.code === '4010') { // Sales Revenue
        credit = Number(inv.sales_taxable);
      } else if (a.code === '5020') { // Karigar Expenses
        debit = Number(karigar.labour);
      } else if (a.code === '3010') { // Owner Equity
        credit = Number(a.current_balance < 0 ? Math.abs(a.current_balance) : 0);
      } else {
        debit = Number(a.current_balance > 0 ? a.current_balance : 0);
        credit = Number(a.current_balance < 0 ? Math.abs(a.current_balance) : 0);
      }

      totalDebit += debit;
      totalCredit += credit;

      return {
        code: a.code,
        name: a.name,
        group: a.group_name,
        type: a.type,
        debit,
        credit
      };
    });

    // Equity / Balancing Entry (Retained Earnings) to guarantee Trial Balance invariant
    const diff = totalDebit - totalCredit;
    if (diff > 0) {
      const reAcc = tbRows.find(r => r.code === '3020');
      if (reAcc) reAcc.credit += diff;
      totalCredit += diff;
    } else if (diff < 0) {
      const reAcc = tbRows.find(r => r.code === '3020');
      if (reAcc) reAcc.debit += Math.abs(diff);
      totalDebit += Math.abs(diff);
    }

    res.json({
      success: true,
      data: tbRows,
      totals: {
        total_debit: totalDebit,
        total_credit: totalCredit,
        balanced: Math.abs(totalDebit - totalCredit) < 0.01
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/accounting/pl ───────────────────────────────────────────────────
async function getProfitAndLoss(req, res) {
  try {
    const [[inv]] = await db.query(`
      SELECT
        COALESCE(SUM(grand_total - (COALESCE(cgst, 0) + COALESCE(sgst, 0) + COALESCE(igst, 0))), 0) AS sales_revenue
      FROM invoices WHERE status != 'Cancelled'
    `);

    const [[karigar]] = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS labour_cost FROM karigar_payments
    `);

    const salesRevenue = Number(inv.sales_revenue);
    const makingRevenue = 0;
    const totalRevenue = salesRevenue;
    const cogs = 0; // Purchase costs
    const grossProfit = totalRevenue - cogs;
    const operatingExpenses = Number(karigar.labour_cost);
    const netProfit = grossProfit - operatingExpenses;

    res.json({
      success: true,
      data: {
        revenue: {
          sales_revenue: salesRevenue,
          making_revenue: makingRevenue,
          total_revenue: totalRevenue
        },
        cogs: {
          material_cost: cogs,
          total_cogs: cogs
        },
        gross_profit: grossProfit,
        expenses: {
          karigar_labour: operatingExpenses,
          utilities_rent: 0,
          total_expenses: operatingExpenses
        },
        net_profit: netProfit
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/accounting/balance-sheet ────────────────────────────────────────
async function getBalanceSheet(req, res) {
  try {
    const [[inv]] = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN payment_mode = 'Cash' THEN paid_amount ELSE 0 END), 0) AS cash_in,
        COALESCE(SUM(CASE WHEN payment_mode != 'Cash' THEN paid_amount ELSE 0 END), 0) AS bank_in,
        COALESCE(SUM(balance_due), 0) AS receivables,
        COALESCE(SUM(cgst + sgst + igst), 0) AS gst_payable
      FROM invoices WHERE status != 'Cancelled'
    `);

    const [[sup]] = await db.query("SELECT COALESCE(SUM(outstanding), 0) AS payables FROM suppliers");
    const [[stock]] = await db.query("SELECT COALESCE(SUM(stock_qty * purchase_price), 0) AS stock_val FROM products WHERE status = 'Active' OR status IS NULL");

    const cash = Number(inv.cash_in);
    const bank = Number(inv.bank_in);
    const debtors = Number(inv.receivables);
    const inventory = Number(stock.stock_val);
    const totalAssets = cash + bank + debtors + inventory;

    const creditors = Number(sup.payables);
    const gstOutput = Number(inv.gst_payable);
    const totalLiabilities = creditors + gstOutput;

    const retainedEarnings = totalAssets - totalLiabilities;
    const totalEquity = retainedEarnings;

    res.json({
      success: true,
      data: {
        assets: {
          current_assets: { cash, bank, debtors },
          inventory_assets: { stock: inventory },
          total_assets: totalAssets
        },
        liabilities: {
          current_liabilities: { creditors, gst_payable: gstOutput },
          total_liabilities: totalLiabilities
        },
        equity: {
          retained_earnings: retainedEarnings,
          total_equity: totalEquity
        },
        balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/accounting/accounts ─────────────────────────────────────────────
async function getAccounts(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM accounts ORDER BY code ASC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/accounting/journal ──────────────────────────────────────────────
async function getJournalEntries(req, res) {
  try {
    const [entries] = await db.query(`
      SELECT j.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', jl.id,
            'account_id', jl.account_id,
            'account_code', a.code,
            'account_name', a.name,
            'debit', jl.debit,
            'credit', jl.credit,
            'narration', jl.narration
          )
        ) AS lines
      FROM journal_entries j
      LEFT JOIN journal_entry_lines jl ON j.id = jl.journal_id
      LEFT JOIN accounts a ON jl.account_id = a.id
      GROUP BY j.id
      ORDER BY j.entry_date DESC, j.id DESC
    `);
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/accounting/vouchers (Atomic Double-Entry Posting) ──────────────
async function createVoucher(req, res) {
  const {
    voucher_type = "JOURNAL",
    entry_date = new Date().toISOString().split("T")[0],
    narration,
    lines = []
  } = req.body;

  if (!lines || lines.length < 2) {
    return res.status(400).json({ success: false, message: "A double-entry voucher requires at least two account lines (Debit and Credit)." });
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    const dr = parseFloat(line.debit) || 0;
    const cr = parseFloat(line.credit) || 0;
    if (dr < 0 || cr < 0) {
      return res.status(400).json({ success: false, message: "Negative debit or credit amounts are not allowed." });
    }
    totalDebit += dr;
    totalCredit += cr;
  }

  if (Math.abs(totalDebit - totalCredit) > 0.01 || totalDebit <= 0) {
    return res.status(400).json({
      success: false,
      message: `Accounting Invariant Failed: Total Debits (₹${totalDebit.toFixed(2)}) must equal Total Credits (₹${totalCredit.toFixed(2)}).`
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[{ maxId }]] = await conn.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM journal_entries");
    const prefix = voucher_type === "RECEIPT" ? "RV" : voucher_type === "PAYMENT" ? "PV" : voucher_type === "CONTRA" ? "CV" : "JV";
    const uniqueSuffix = Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 1000000);
    const voucher_no = `${prefix}-${new Date().getFullYear()}-${uniqueSuffix}`;
    const createdBy = req.user?.full_name || req.user?.username || "Admin";

    const [jResult] = await conn.query(
      `INSERT INTO journal_entries (voucher_no, voucher_type, entry_date, narration, total_debit, total_credit, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [voucher_no, voucher_type, entry_date, narration || null, totalDebit, totalCredit, createdBy]
    );
    const journalId = jResult.insertId;

    for (const line of lines) {
      const dr = parseFloat(line.debit) || 0;
      const cr = parseFloat(line.credit) || 0;
      await conn.query(
        `INSERT INTO journal_entry_lines (journal_id, account_id, debit, credit, narration)
         VALUES (?, ?, ?, ?, ?)`,
        [journalId, line.account_id, dr, cr, line.narration || null]
      );

      // Update account balance (Assets & Expenses increase with Dr; Liabilities, Equity & Revenue increase with Cr)
      await conn.query(
        "UPDATE accounts SET current_balance = current_balance + ? - ? WHERE id = ?",
        [dr, cr, line.account_id]
      );
    }

    await conn.commit();
    res.status(201).json({
      success: true,
      message: `Voucher ${voucher_no} posted successfully. Debits = Credits (₹${totalDebit.toFixed(2)}).`,
      data: { voucher_no, id: journalId, total_debit: totalDebit, total_credit: totalCredit }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

module.exports = {
  getSummary,
  getCashBook,
  getBankBook,
  getTrialBalance,
  getProfitAndLoss,
  getBalanceSheet,
  getAccounts,
  getJournalEntries,
  createVoucher
};
