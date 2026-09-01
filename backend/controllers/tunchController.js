const db = require("../config/db");

// Helper function to resolve purity fraction
function getPurityFraction(purity, metalType = "Gold") {
  if (!purity) return metalType === "Silver" ? 0.999 : 0.9167;
  const pStr = String(purity).toUpperCase();
  if (pStr.includes("24K") || pStr.includes("999")) return 0.999;
  if (pStr.includes("22K") || pStr.includes("916")) return 0.9167;
  if (pStr.includes("18K") || pStr.includes("750")) return 0.750;
  if (pStr.includes("14K") || pStr.includes("585")) return 0.585;
  if (pStr.includes("925") || pStr.includes("STERLING")) return 0.925;
  const num = parseFloat(purity);
  if (!isNaN(num)) {
    return num > 1 ? num / 1000 : num;
  }
  return 0.9167;
}

// ── GET /api/tunch/summary ──────────────────────────────────────────────────
async function getSummary(req, res) {
  try {
    // 1. Inventory Products Fine Gold / Silver Stock
    const [prodRows] = await db.query(`
      SELECT metal_type, purity,
             COALESCE(SUM(stock_qty * net_weight), 0) AS total_gross
      FROM products
      WHERE (status = 'Active' OR status IS NULL) AND stock_qty > 0
      GROUP BY metal_type, purity
    `);

    let inventoryFineGold = 0;
    let inventoryFineSilver = 0;

    prodRows.forEach(p => {
      const frac = getPurityFraction(p.purity, p.metal_type);
      const fine = Number(p.total_gross) * frac;
      if (p.metal_type === "Silver") {
        inventoryFineSilver += fine;
      } else {
        inventoryFineGold += fine;
      }
    });

    // 2. Karigar Metal Balance (Issued - Received)
    const [issueRows] = await db.query(`
      SELECT metal_type, purity, gross_weight, net_weight FROM gold_issues
    `);
    let totalIssuedFine = 0;
    issueRows.forEach(i => {
      const frac = getPurityFraction(i.purity, i.metal_type);
      totalIssuedFine += (Number(i.gross_weight || i.net_weight || 0) * frac);
    });

    const [recvRows] = await db.query(`
      SELECT metal_type, purity, gross_weight, net_weight, wastage_reported FROM gold_receives
    `);
    let totalRecvFine = 0;
    let totalWastage = 0;
    recvRows.forEach(r => {
      const frac = getPurityFraction(r.purity, r.metal_type);
      totalRecvFine += (Number(r.net_weight || r.gross_weight || 0) * frac);
      totalWastage += Number(r.wastage_reported || 0);
    });

    const karigarHoldingFine = Math.max(0, totalIssuedFine - totalRecvFine);

    // 3. Old Metal Purchases / Scrap Inward
    const [[oldMetalStats]] = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN metal_type = 'Gold' THEN fine_weight ELSE 0 END), 0) AS old_fine_gold,
        COALESCE(SUM(CASE WHEN metal_type = 'Silver' THEN fine_weight ELSE 0 END), 0) AS old_fine_silver
      FROM old_metal_purchases
    `);

    // 4. Gold Exchanges from Customers
    const [[exchangeStats]] = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN metal_type = 'Gold' THEN fine_weight ELSE 0 END), 0) AS ex_fine_gold,
        COALESCE(SUM(CASE WHEN metal_type = 'Silver' THEN fine_weight ELSE 0 END), 0) AS ex_fine_silver
      FROM gold_exchanges
    `);

    // 5. Direct Fine Metal Ledger Manual Entries
    const [[ledgerStats]] = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN metal_type = 'Gold' AND flow = 'INWARD' THEN fine_weight ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN metal_type = 'Gold' AND flow = 'OUTWARD' THEN fine_weight ELSE 0 END), 0) AS ledger_fine_gold,
        COALESCE(SUM(CASE WHEN metal_type = 'Silver' AND flow = 'INWARD' THEN fine_weight ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN metal_type = 'Silver' AND flow = 'OUTWARD' THEN fine_weight ELSE 0 END), 0) AS ledger_fine_silver
      FROM fine_metal_ledger
    `);

    const totalFineGold = inventoryFineGold + karigarHoldingFine + Number(oldMetalStats.old_fine_gold) + Number(exchangeStats.ex_fine_gold) + Number(ledgerStats.ledger_fine_gold);
    const totalFineSilver = inventoryFineSilver + Number(oldMetalStats.old_fine_silver) + Number(exchangeStats.ex_fine_silver) + Number(ledgerStats.ledger_fine_silver);

    res.json({
      success: true,
      data: {
        fine_gold_balance: Number(totalFineGold.toFixed(3)),
        fine_silver_balance: Number(totalFineSilver.toFixed(3)),
        inventory_fine_gold: Number(inventoryFineGold.toFixed(3)),
        karigar_issued_fine: Number(totalIssuedFine.toFixed(3)),
        karigar_received_fine: Number(totalRecvFine.toFixed(3)),
        karigar_holding_fine: Number(karigarHoldingFine.toFixed(3)),
        total_wastage_fine: Number(totalWastage.toFixed(3)),
        scrap_gold_fine: Number(Number(oldMetalStats.old_fine_gold).toFixed(3)),
        exchange_gold_fine: Number(Number(exchangeStats.ex_fine_gold).toFixed(3))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/tunch/ledger (Unified Metal Movements) ─────────────────────────
async function getLedger(req, res) {
  try {
    const { metal_type, search } = req.query;
    const movements = [];

    // 1. Direct Fine Metal Ledger entries
    const [dirRows] = await db.query(`
      SELECT id, voucher_no, transaction_type, metal_type, purity, gross_weight, wastage,
             fine_weight, flow, party_name, narration, created_at AS date
      FROM fine_metal_ledger
      ORDER BY created_at DESC
      LIMIT 100
    `);
    dirRows.forEach(r => {
      movements.push({
        id: `FML-${r.id}`,
        voucher_no: r.voucher_no,
        type: r.transaction_type.replace(/_/g, " "),
        metal_type: r.metal_type,
        purity: r.purity,
        gross_weight: Number(r.gross_weight),
        wastage: Number(r.wastage),
        fine_weight: Number(r.fine_weight),
        flow: r.flow,
        party_name: r.party_name || "Store Vault",
        narration: r.narration,
        date: r.date
      });
    });

    // 2. Gold Issues to Karigars (Outward)
    const [issueRows] = await db.query(`
      SELECT gi.id, gi.issue_no, gi.issue_date AS date, gi.metal_type, gi.gross_weight, gi.purity,
             gi.work_order_ref, k.name AS karigar_name
      FROM gold_issues gi
      LEFT JOIN karigars k ON gi.karigar_id = k.id
      ORDER BY gi.created_at DESC
      LIMIT 100
    `);
    issueRows.forEach(gi => {
      const frac = getPurityFraction(gi.purity, gi.metal_type);
      const fine = Number(gi.gross_weight || 0) * frac;
      movements.push({
        id: `ISSUE-${gi.id}`,
        voucher_no: gi.issue_no || `GI-${gi.id}`,
        type: "Karigar Gold Issue",
        metal_type: gi.metal_type || "Gold",
        purity: gi.purity || "22K",
        gross_weight: Number(gi.gross_weight || 0),
        wastage: 0,
        fine_weight: Number(fine.toFixed(3)),
        flow: "OUTWARD",
        party_name: gi.karigar_name || "Karigar",
        narration: gi.work_order_ref || "Job Work Issue",
        date: gi.date
      });
    });

    // 3. Gold Receives from Karigars (Inward)
    const [recvRows] = await db.query(`
      SELECT gr.id, gr.receive_no, gr.receive_date AS date, gr.metal_type, gr.gross_weight, gr.net_weight, gr.purity,
             gr.wastage_reported, k.name AS karigar_name
      FROM gold_receives gr
      LEFT JOIN karigars k ON gr.karigar_id = k.id
      ORDER BY gr.created_at DESC
      LIMIT 100
    `);
    recvRows.forEach(gr => {
      const frac = getPurityFraction(gr.purity, gr.metal_type);
      const fine = Number(gr.net_weight || gr.gross_weight || 0) * frac;
      movements.push({
        id: `RECV-${gr.id}`,
        voucher_no: gr.receive_no || `GR-${gr.id}`,
        type: "Karigar Finished Receive",
        metal_type: gr.metal_type || "Gold",
        purity: gr.purity || "22K",
        gross_weight: Number(gr.gross_weight || 0),
        wastage: Number(gr.wastage_reported || 0),
        fine_weight: Number(fine.toFixed(3)),
        flow: "INWARD",
        party_name: gr.karigar_name || "Karigar",
        narration: `Finished jewelry received (Wastage: ${gr.wastage_reported || 0}g)`,
        date: gr.date
      });
    });

    // 4. Old Metal Purchases (Inward)
    const [omRows] = await db.query(`
      SELECT om.id, om.purchase_no AS voucher_no, om.metal_type, om.purity,
             om.gross_weight, om.fine_weight, om.created_at AS date, c.full_name AS customer_name
      FROM old_metal_purchases om
      LEFT JOIN customers c ON om.customer_id = c.id
      ORDER BY om.created_at DESC
      LIMIT 100
    `);
    omRows.forEach(om => {
      movements.push({
        id: `OMP-${om.id}`,
        voucher_no: om.voucher_no || `OMP-${om.id}`,
        type: "Old Metal Scrap Purchase",
        metal_type: om.metal_type || "Gold",
        purity: om.purity || "Old Gold",
        gross_weight: Number(om.gross_weight || 0),
        wastage: 0,
        fine_weight: Number(om.fine_weight || 0),
        flow: "INWARD",
        party_name: om.customer_name || "Customer",
        narration: "Scrap melting inward",
        date: om.date
      });
    });

    // 5. Gold Exchanges (Inward)
    const [exRows] = await db.query(`
      SELECT ge.id, ge.exchange_no AS voucher_no, ge.metal_type, ge.purity,
             ge.gross_weight, ge.net_weight, ge.fine_weight, ge.created_at AS date, c.full_name AS customer_name
      FROM gold_exchanges ge
      LEFT JOIN customers c ON ge.customer_id = c.id
      ORDER BY ge.created_at DESC
      LIMIT 100
    `);
    exRows.forEach(ge => {
      const frac = getPurityFraction(ge.purity, ge.metal_type);
      const fine = Number(ge.fine_weight || (Number(ge.net_weight || ge.gross_weight || 0) * frac));
      movements.push({
        id: `EX-${ge.id}`,
        voucher_no: ge.voucher_no || `EX-${ge.id}`,
        type: "Customer Gold Exchange",
        metal_type: ge.metal_type || "Gold",
        purity: ge.purity || "Old Gold",
        gross_weight: Number(ge.gross_weight || 0),
        wastage: 0,
        fine_weight: Number(fine.toFixed(3)),
        flow: "INWARD",
        party_name: ge.customer_name || "Customer",
        narration: "Old gold exchange value adjustment",
        date: ge.date
      });
    });

    // Filter by metal
    let filtered = movements;
    if (metal_type && metal_type !== "ALL") {
      filtered = filtered.filter(m => m.metal_type.toLowerCase() === metal_type.toLowerCase());
    }

    // Filter by search
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(m =>
        m.voucher_no.toLowerCase().includes(s) ||
        m.party_name.toLowerCase().includes(s) ||
        m.type.toLowerCase().includes(s)
      );
    }

    // Sort by date DESC
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Compute running balance
    let running = 0;
    filtered.slice().reverse().forEach(m => {
      if (m.flow === "INWARD") running += m.fine_weight;
      else running -= m.fine_weight;
      m.running_balance = Number(running.toFixed(3));
    });

    res.json({ success: true, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/tunch/karigar-balances ─────────────────────────────────────────
async function getKarigarBalances(req, res) {
  try {
    const [karigars] = await db.query(`
      SELECT id, name, phone, specialization FROM karigars WHERE status = 'Active' ORDER BY name ASC
    `);

    const [issues] = await db.query(`
      SELECT karigar_id, metal_type, purity, gross_weight, net_weight FROM gold_issues
    `);

    const [receives] = await db.query(`
      SELECT karigar_id, metal_type, purity, gross_weight, net_weight, wastage_reported FROM gold_receives
    `);

    const issueMap = {};
    issues.forEach(i => {
      const frac = getPurityFraction(i.purity, i.metal_type);
      const fine = Number(i.gross_weight || i.net_weight || 0) * frac;
      issueMap[i.karigar_id] = (issueMap[i.karigar_id] || 0) + fine;
    });

    const recvMap = {};
    const wasteMap = {};
    receives.forEach(r => {
      const frac = getPurityFraction(r.purity, r.metal_type);
      const fine = Number(r.net_weight || r.gross_weight || 0) * frac;
      recvMap[r.karigar_id] = (recvMap[r.karigar_id] || 0) + fine;
      wasteMap[r.karigar_id] = (wasteMap[r.karigar_id] || 0) + Number(r.wastage_reported || 0);
    });

    const report = karigars.map(k => {
      const issued = Number((issueMap[k.id] || 0).toFixed(3));
      const received = Number((recvMap[k.id] || 0).toFixed(3));
      const wastage = Number((wasteMap[k.id] || 0).toFixed(3));
      const balance = Math.max(0, Number((issued - received).toFixed(3)));

      return {
        id: k.id,
        name: k.name,
        phone: k.phone,
        specialization: k.specialization,
        total_issued_fine: issued,
        total_received_fine: received,
        total_wastage: wastage,
        current_holding_fine: balance
      };
    });

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/tunch/record (Transactional Fine Metal Adjustment) ────────────
async function recordMovement(req, res) {
  const {
    transaction_type = "MANUAL_ENTRY",
    metal_type = "Gold",
    purity = "24K",
    gross_weight,
    wastage = 0,
    flow = "INWARD",
    party_type = "Store",
    party_name,
    narration
  } = req.body;

  const gw = parseFloat(gross_weight);
  if (!gw || isNaN(gw) || gw <= 0) {
    return res.status(400).json({ success: false, message: "Enter a valid positive gross metal weight in grams." });
  }

  const purityFraction = getPurityFraction(purity, metal_type);
  const netWeight = Math.max(0, gw - (parseFloat(wastage) || 0));
  const fineWeight = Number((netWeight * purityFraction).toFixed(3));
  const performedBy = req.user?.full_name || req.user?.username || "Admin";

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM fine_metal_ledger");
    const voucher_no = `FML-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    await conn.query(`
      INSERT INTO fine_metal_ledger
        (voucher_no, transaction_type, metal_type, purity, purity_fraction, gross_weight, wastage, fine_weight, flow, party_type, party_name, narration, performed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      voucher_no, transaction_type, metal_type, purity, purityFraction, gw, wastage || 0,
      fineWeight, flow, party_type, party_name || "Store Vault", narration || null, performedBy
    ]);

    await conn.commit();
    res.status(201).json({
      success: true,
      message: `${flow === "INWARD" ? "Inward" : "Outward"} entry of ${fineWeight}g Fine ${metal_type} (${purity}) recorded successfully.`,
      data: { voucher_no, fine_weight: fineWeight, flow, metal_type, purity }
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
  getLedger,
  getKarigarBalances,
  recordMovement
};
