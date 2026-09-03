const db = require('../config/db');

const API_BASE = 'http://localhost:5000/api';

async function verifyAll31Modules() {
  console.log('================================================================');
  console.log('CERITAGE ERP — FULL 31-MODULE END-TO-END VERIFICATION (AIVEN)');
  console.log('================================================================');

  // Verify DB
  const [dbRow] = await db.query('SELECT DATABASE() AS db, @@hostname AS host, @@port AS port, VERSION() AS ver');
  console.log(`Database: ${dbRow[0].db} | Host: ${dbRow[0].host} | Port: ${dbRow[0].port} | MySQL: ${dbRow[0].ver}`);

  // Authenticate Admin
  const authRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'ceritage123' })
  });
  const { token } = await authRes.json();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const endpoints = [
    { num: 1,  name: "Dashboard",             url: "/dashboard/kpis" },
    { num: 2,  name: "Analytics",             url: "/analytics/summary" },
    { num: 3,  name: "Customers",             url: "/customers/kpis" },
    { num: 4,  name: "Products & Inventory",  url: "/products/kpis" },
    { num: 5,  name: "Billing / GST Invoice", url: "/billing/kpis" },
    { num: 6,  name: "Sales",                 url: "/sales/kpis" },
    { num: 7,  name: "Purchase",              url: "/purchase/kpis" },
    { num: 8,  name: "Gold Exchange",         url: "/gold-exchange/kpis" },
    { num: 9,  name: "Repair Job Card",       url: "/repair/kpis" },
    { num: 10, name: "Order Booking",         url: "/orders/kpis" },
    { num: 11, name: "Karigar Management",    url: "/karigar" },
    { num: 12, name: "Jangad / Approval",     url: null, status: "UI ONLY" },
    { num: 13, name: "Accounting",            url: "/accounting/summary" },
    { num: 14, name: "Payment Modes",         url: "/payments/kpis" },
    { num: 15, name: "EMI & Credit",          url: "/emi/plans" },
    { num: 16, name: "GST & Taxation",        url: "/gst/summary" },
    { num: 17, name: "Fine Metal Ledger",     url: "/tunch/summary" },
    { num: 18, name: "TCS & Compliance",      url: null, status: "UI ONLY" },
    { num: 19, name: "Inventory",             url: "/inventory/kpis" },
    { num: 20, name: "Hallmark & HUID",       url: "/hallmark/kpis" },
    { num: 21, name: "Gold & Silver Rates",   url: "/metal-rates/current" },
    { num: 22, name: "RFID & Tray Audit",     url: "/rfid/kpis" },
    { num: 23, name: "Rate Lock / Advance",   url: "/advance" },
    { num: 24, name: "Employees",             url: "/employees" },
    { num: 25, name: "Suppliers",             url: "/suppliers" },
    { num: 26, name: "Multi-Branch",          url: "/branch" },
    { num: 27, name: "Reports",               url: null, status: "UI ONLY" },
    { num: 28, name: "Users & Roles",         url: "/users" },
    { num: 29, name: "Security",              url: null, status: "UI ONLY" },
    { num: 30, name: "AI Features",           url: null, status: "UI ONLY" },
    { num: 31, name: "Communication",         url: "/communications/templates" }
  ];

  console.log('\n--- VERIFYING ENDPOINTS ---');
  let completeCount = 0;
  let uiOnlyCount = 0;
  let brokenCount = 0;

  for (const ep of endpoints) {
    if (!ep.url) {
      uiOnlyCount++;
      console.log(`[${String(ep.num).padStart(2, '0')}] ${ep.name.padEnd(28)} -> 🔵 UI ONLY`);
      continue;
    }

    try {
      const res = await fetch(`${API_BASE}${ep.url}`, { headers });
      if (res.ok) {
        completeCount++;
        console.log(`[${String(ep.num).padStart(2, '0')}] ${ep.name.padEnd(28)} -> 🟢 COMPLETE (HTTP ${res.status} OK)`);
      } else {
        brokenCount++;
        console.log(`[${String(ep.num).padStart(2, '0')}] ${ep.name.padEnd(28)} -> ⚠️ BROKEN (HTTP ${res.status})`);
      }
    } catch (e) {
      brokenCount++;
      console.log(`[${String(ep.num).padStart(2, '0')}] ${ep.name.padEnd(28)} -> ⚠️ ERROR (${e.message})`);
    }
  }

  console.log('\n================================================================');
  console.log(`AUDIT SUMMARY: ${completeCount} COMPLETE, ${uiOnlyCount} UI ONLY, ${brokenCount} BROKEN / TOTAL: 31`);
  console.log('================================================================');

  process.exit(0);
}

verifyAll31Modules().catch(err => {
  console.error(err);
  process.exit(1);
});
