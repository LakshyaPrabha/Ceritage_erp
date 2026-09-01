const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function inspectAllModules() {
  console.log('================================================================');
  console.log('AUDITING ALL 31 MODULES FRONTEND + BACKEND + DATABASE');
  console.log('================================================================');

  // 1. List frontend module files
  const frontendModulesDir = path.resolve(__dirname, '../../frontend/src/pages/modules');
  const frontendFiles = fs.readdirSync(frontendModulesDir);
  console.log('Frontend module files:', frontendFiles.length);

  // 2. Read Dashboard.jsx to see module mappings
  const dashboardContent = fs.readFileSync(path.resolve(__dirname, '../../frontend/src/pages/Dashboard.jsx'), 'utf8');

  // 3. Database tables
  const [dbTables] = await db.query(`
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME ASC
  `);
  const tableNames = dbTables.map(t => t.TABLE_NAME);

  // 4. Authenticate
  let adminToken = '';
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'ceritage123' })
    });
    const data = await res.json();
    adminToken = data.token;
  } catch (e) {
    console.error('Auth fail:', e.message);
  }
  const headers = { Authorization: `Bearer ${adminToken}` };

  // 5. Test 31 modules
  const modules31 = [
    { num: 1, name: 'Dashboard', feFile: 'DashboardHome.jsx', beRoute: '/dashboard', testEp: '/dashboard' },
    { num: 2, name: 'Analytics', feFile: 'Analytics.jsx', beRoute: '/analytics', testEp: '/analytics?range=30d' },
    { num: 3, name: 'Customers', feFile: 'Customers.jsx', beRoute: '/customers', testEp: '/customers?limit=10' },
    { num: 4, name: 'Products & Inventory', feFile: 'Products.jsx', beRoute: '/products', testEp: '/products?limit=10' },
    { num: 5, name: 'Billing / GST Invoice', feFile: 'Billing.jsx', beRoute: '/billing', testEp: '/billing?limit=10' },
    { num: 6, name: 'Sales', feFile: 'Sales.jsx', beRoute: '/sales', testEp: '/sales?limit=10' },
    { num: 7, name: 'Purchase', feFile: 'Purchase.jsx', beRoute: '/purchase', testEp: '/purchase?limit=10' },
    { num: 8, name: 'Gold Exchange', feFile: 'GoldExchange.jsx', beRoute: '/gold-exchange', testEp: '/gold-exchange?limit=10' },
    { num: 9, name: 'Repair Job Card', feFile: 'Repair.jsx', beRoute: '/repair', testEp: '/repair?limit=10' },
    { num: 10, name: 'Order Booking', feFile: 'Orders.jsx', beRoute: '/orders', testEp: '/orders?limit=10' },
    { num: 11, name: 'Karigar Management', feFile: 'Karigar.jsx', beRoute: '/karigar', testEp: '/karigar?limit=10' },
    { num: 12, name: 'Jangad / Approval', feFile: 'Jangad.jsx', beRoute: '/jangad', testEp: '/jangad' },
    { num: 13, name: 'Accounting', feFile: 'Accounting.jsx', beRoute: '/accounting', testEp: '/accounting' },
    { num: 14, name: 'Payment Modes', feFile: 'Payments.jsx', beRoute: '/payments', testEp: '/payments' },
    { num: 15, name: 'EMI & Credit', feFile: 'Emi.jsx', beRoute: '/emi', testEp: '/emi/plans' },
    { num: 16, name: 'GST & Taxation', feFile: 'Gst.jsx', beRoute: '/gst', testEp: '/gst' },
    { num: 17, name: 'Fine Metal Ledger', feFile: 'Tunch.jsx', beRoute: '/tunch', testEp: '/tunch' },
    { num: 18, name: 'TCS & Compliance', feFile: 'Compliance.jsx', beRoute: '/compliance', testEp: '/compliance' },
    { num: 19, name: 'Inventory', feFile: 'Inventory.jsx', beRoute: '/inventory', testEp: '/inventory/live' },
    { num: 20, name: 'Hallmark & HUID', feFile: 'Hallmark.jsx', beRoute: '/hallmark', testEp: '/hallmark' },
    { num: 21, name: 'Gold & Silver Rates', feFile: 'Rates.jsx', beRoute: '/rates', testEp: '/rates/current' },
    { num: 22, name: 'RFID & Tray Audit', feFile: 'Rfid.jsx', beRoute: '/rfid', testEp: '/rfid' },
    { num: 23, name: 'Rate Lock / Advance', feFile: 'Advance.jsx', beRoute: '/advance', testEp: '/advance?limit=10' },
    { num: 24, name: 'Employees', feFile: 'Employees.jsx', beRoute: '/employees', testEp: '/employees?limit=10' },
    { num: 25, name: 'Suppliers', feFile: 'Suppliers.jsx', beRoute: '/suppliers', testEp: '/suppliers?limit=10' },
    { num: 26, name: 'Multi-Branch', feFile: 'Branch.jsx', beRoute: '/branch', testEp: '/branch' },
    { num: 27, name: 'Reports', feFile: 'Reports.jsx', beRoute: '/reports', testEp: '/reports' },
    { num: 28, name: 'Users & Roles', feFile: 'Users.jsx', beRoute: '/users', testEp: '/users?limit=10' },
    { num: 29, name: 'Security', feFile: 'Security.jsx', beRoute: '/security', testEp: '/security' },
    { num: 30, name: 'AI Features', feFile: 'Ai.jsx', beRoute: '/ai', testEp: '/ai' },
    { num: 31, name: 'Communication', feFile: 'Communication.jsx', beRoute: '/communications', testEp: '/communications/logs' },
  ];

  const auditReport = [];

  for (const m of modules31) {
    const fePath = path.join(frontendModulesDir, m.feFile);
    const feExists = fs.existsSync(fePath);
    let feLines = 0;
    let feIsMock = false;
    let feCode = '';
    if (feExists) {
      feCode = fs.readFileSync(fePath, 'utf8');
      feLines = feCode.split('\n').length;
      if (!feCode.includes('fetch(') && !feCode.includes('apiRequest(') && !feCode.includes('axios')) {
        feIsMock = true;
      }
    }

    let httpStatus = 0;
    let beSuccess = false;
    let beMsg = '';
    try {
      const res = await fetch(`http://localhost:5000/api${m.testEp}`, { headers });
      httpStatus = res.status;
      const data = await res.json().catch(() => ({}));
      beSuccess = res.ok && (data.success !== false);
      beMsg = data.message || '';
    } catch (e) {
      beMsg = e.message;
    }

    auditReport.push({
      ...m,
      feExists,
      feLines,
      feIsMock,
      httpStatus,
      beSuccess,
      beMsg
    });

    console.log(`[#${m.num.toString().padStart(2, '0')}] ${m.name.padEnd(25)} | FE: ${feExists ? feLines + ' lines' : 'MISSING'} ${feIsMock ? '(MOCK UI)' : '(LIVE API)'} | BE: HTTP ${httpStatus} (${beSuccess ? 'PASS' : 'FAIL: ' + beMsg})`);
  }

  fs.writeFileSync('./tests/module_summary.json', JSON.stringify(auditReport, null, 2));
  console.log('\nAudit complete.');
  process.exit(0);
}

inspectAllModules().catch(e => {
  console.error(e);
  process.exit(1);
});
