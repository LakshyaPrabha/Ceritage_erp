const db = require('../config/db');

const API_BASE = 'http://localhost:5000/api';

async function runMasterAudit() {
  console.log('================================================================');
  console.log('CERITAGE ERP — POST-MERGE 31-MODULE MASTER AUDIT (AIVEN)');
  console.log('================================================================');

  // 1. Verify DB
  const [dbRow] = await db.query('SELECT DATABASE() AS db, @@hostname AS host, @@port AS port, VERSION() AS ver');
  console.log(`Database: ${dbRow[0].db} | Host: ${dbRow[0].host} | Port: ${dbRow[0].port} | MySQL: ${dbRow[0].ver}`);

  // 2. Auth Admin
  const authRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'ceritage123' })
  });
  const authData = await authRes.json();
  const token = authData.token;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  console.log(`Admin Auth: ${authRes.status === 200 ? 'SUCCESS' : 'FAILED'}`);

  const results = {};

  async function checkEndpoint(moduleKey, name, url, method = 'GET', body = null) {
    try {
      const opts = { method, headers };
      if (body) opts.body = JSON.stringify(body);
      const r = await fetch(`${API_BASE}${url}`, opts);
      const isJson = (r.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await r.json() : null;
      return { status: r.status, ok: r.ok, data };
    } catch (e) {
      return { status: 'ERR', ok: false, error: e.message };
    }
  }

  // 1. Dashboard
  results['1. Dashboard'] = await checkEndpoint('dashboard', 'Dashboard KPIs', '/dashboard/kpis');

  // 2. Analytics
  results['2. Analytics'] = await checkEndpoint('analytics', 'Analytics Summary', '/analytics/summary');

  // 3. Customers
  results['3. Customers'] = await checkEndpoint('customers', 'Customers KPIs', '/customers/kpis');

  // 4. Products & Inventory
  results['4. Products & Inventory'] = await checkEndpoint('products', 'Products KPIs', '/products/kpis');

  // 5. Billing / GST Invoice
  results['5. Billing / GST Invoice'] = await checkEndpoint('billing', 'Billing KPIs', '/billing/kpis');

  // 6. Sales
  results['6. Sales'] = await checkEndpoint('sales', 'Sales History', '/sales/history');

  // 7. Purchase
  results['7. Purchase'] = await checkEndpoint('purchase', 'Purchase Orders', '/purchase/orders');

  // 8. Gold Exchange
  results['8. Gold Exchange'] = await checkEndpoint('goldExchange', 'Gold Exchange List', '/gold-exchange/exchanges');

  // 9. Repair Job Card
  results['9. Repair Job Card'] = await checkEndpoint('repair', 'Repair Jobs', '/repair/jobs');

  // 10. Order Booking
  results['10. Order Booking'] = await checkEndpoint('orders', 'Custom Orders', '/orders/custom');

  // 11. Karigar Management
  results['11. Karigar Management'] = await checkEndpoint('karigar', 'Karigars List', '/karigar');

  // 12. Jangad / Approval
  results['12. Jangad / Approval'] = await checkEndpoint('jangad', 'Jangad Approvals', '/jangad');

  // 13. Accounting
  results['13. Accounting'] = await checkEndpoint('accounting', 'Accounting Summary', '/accounting/summary');

  // 14. Payment Modes
  results['14. Payment Modes'] = await checkEndpoint('payments', 'Payment KPIs', '/payments/kpis');

  // 15. EMI & Credit
  results['15. EMI & Credit'] = await checkEndpoint('emi', 'EMI Plans', '/emi/plans');

  // 16. GST & Taxation
  results['16. GST & Taxation'] = await checkEndpoint('gst', 'GST Summary', '/gst/summary');

  // 17. Fine Metal Ledger
  results['17. Fine Metal Ledger'] = await checkEndpoint('tunch', 'Fine Metal Summary', '/tunch/summary');

  // 18. TCS & Compliance
  results['18. TCS & Compliance'] = await checkEndpoint('compliance', 'Compliance Overview', '/compliance');

  // 19. Inventory
  results['19. Inventory'] = await checkEndpoint('inventory', 'Inventory Valuation', '/inventory/valuation');

  // 20. Hallmark & HUID
  results['20. Hallmark & HUID'] = await checkEndpoint('hallmark', 'Hallmark Records', '/hallmark');

  // 21. Gold & Silver Rates
  results['21. Gold & Silver Rates'] = await checkEndpoint('rates', 'Live Rates', '/metal-rates/current');

  // 22. RFID & Tray Audit
  results['22. RFID & Tray Audit'] = await checkEndpoint('rfid', 'RFID Trays', '/rfid/trays');

  // 23. Rate Lock / Advance
  results['23. Rate Lock / Advance'] = await checkEndpoint('advance', 'Rate Lock Bookings', '/advance');

  // 24. Employees
  results['24. Employees'] = await checkEndpoint('employees', 'Staff Directory', '/employees');

  // 25. Suppliers
  results['25. Suppliers'] = await checkEndpoint('suppliers', 'Suppliers List', '/suppliers');

  // 26. Multi-Branch
  results['26. Multi-Branch'] = await checkEndpoint('branch', 'Branch Directory', '/branch');

  // 27. Reports
  results['27. Reports'] = await checkEndpoint('reports', 'Reports Directory', '/reports');

  // 28. Users & Roles
  results['28. Users & Roles'] = await checkEndpoint('users', 'Users List', '/users');

  // 29. Security
  results['29. Security'] = await checkEndpoint('security', 'Security Logs', '/security');

  // 30. AI Features
  results['30. AI Features'] = await checkEndpoint('ai', 'AI Insights', '/ai');

  // 31. Communication
  results['31. Communication'] = await checkEndpoint('communication', 'Communications', '/communications/templates');

  console.log('\n================================================================');
  console.log('AUDIT RESULTS BY MODULE:');
  console.log('================================================================');

  for (const [mod, res] of Object.entries(results)) {
    const statusStr = res.ok ? '🟢 HTTP 200 OK' : res.status === 404 ? '🔵 HTTP 404 (UI Only / No Endpoint)' : `⚠️ HTTP ${res.status}`;
    console.log(`${mod.padEnd(32)} -> ${statusStr}`);
  }

  process.exit(0);
}

runMasterAudit().catch(err => {
  console.error('Audit script error:', err);
  process.exit(1);
});
