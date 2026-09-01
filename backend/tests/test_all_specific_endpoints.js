const db = require('../config/db');

async function testAllSpecificEndpoints() {
  console.log('================================================================');
  console.log('TESTING ACCURATE ENDPOINTS FOR ALL 31 MODULES');
  console.log('================================================================');

  const authRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'ceritage123' })
  });
  const { token } = await authRes.json();
  const headers = { Authorization: `Bearer ${token}` };

  const testList = [
    { num: 1, name: 'Dashboard', ep: '/dashboard/kpis' },
    { num: 2, name: 'Analytics', ep: '/analytics/summary' },
    { num: 3, name: 'Customers', ep: '/customers/kpis' },
    { num: 4, name: 'Products & Inventory', ep: '/products/kpis' },
    { num: 5, name: 'Billing / GST Invoice', ep: '/billing/kpis' },
    { num: 6, name: 'Sales', ep: '/sales/kpis' },
    { num: 7, name: 'Purchase', ep: '/purchase/kpis' },
    { num: 8, name: 'Gold Exchange', ep: '/gold-exchange/kpis' },
    { num: 9, name: 'Repair Job Card', ep: '/repair/kpis' },
    { num: 10, name: 'Order Booking', ep: '/orders/kpis' },
    { num: 11, name: 'Karigar Management', ep: '/karigar/kpis' },
    { num: 12, name: 'Jangad / Approval', ep: '/jangad' },
    { num: 13, name: 'Accounting', ep: '/accounting' },
    { num: 14, name: 'Payment Modes', ep: '/payments' },
    { num: 15, name: 'EMI & Credit', ep: '/emi/kpis' },
    { num: 16, name: 'GST & Taxation', ep: '/gst' },
    { num: 17, name: 'Fine Metal Ledger', ep: '/tunch' },
    { num: 18, name: 'TCS & Compliance', ep: '/compliance' },
    { num: 19, name: 'Inventory', ep: '/inventory/kpis' },
    { num: 20, name: 'Hallmark & HUID', ep: '/hallmark/kpis' },
    { num: 21, name: 'Gold & Silver Rates', ep: '/metal-rates/current' },
    { num: 22, name: 'RFID & Tray Audit', ep: '/rfid' },
    { num: 23, name: 'Rate Lock / Advance', ep: '/advance/kpis' },
    { num: 24, name: 'Employees', ep: '/employees/kpis' },
    { num: 25, name: 'Suppliers', ep: '/suppliers/kpis' },
    { num: 26, name: 'Multi-Branch', ep: '/branch' },
    { num: 27, name: 'Reports', ep: '/reports' },
    { num: 28, name: 'Users & Roles', ep: '/users/permissions/matrix' },
    { num: 29, name: 'Security', ep: '/security' },
    { num: 30, name: 'AI Features', ep: '/ai' },
    { num: 31, name: 'Communication', ep: '/communications/logs' },
  ];

  for (const t of testList) {
    try {
      const res = await fetch(`http://localhost:5000/api${t.ep}`, { headers });
      const data = await res.json().catch(() => ({}));
      console.log(`[#${t.num.toString().padStart(2, '0')}] ${t.name.padEnd(25)} -> HTTP ${res.status} | Success: ${data.success !== false}`);
    } catch (e) {
      console.log(`[#${t.num.toString().padStart(2, '0')}] ${t.name.padEnd(25)} -> ERROR: ${e.message}`);
    }
  }

  process.exit(0);
}

testAllSpecificEndpoints().catch(console.error);
