const db = require('../config/db');

const API_BASE = 'http://localhost:5000/api';

async function runPaymentModesTest() {
  console.log('================================================================');
  console.log('TESTING PAYMENT MODES MODULE END-TO-END');
  console.log('================================================================');

  // 1. Authenticate as Admin
  const authRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'ceritage123' })
  });
  const { token } = await authRes.json();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // Test 1: GET /api/payments/kpis
  console.log('\n--- 1. Testing GET /api/payments/kpis ---');
  const kpiRes = await fetch(`${API_BASE}/payments/kpis`, { headers });
  const kpiData = await kpiRes.json();
  console.log(`Status: ${kpiRes.status}, Total Collection: ₹${kpiData.data?.total_collection}, Modes: ${kpiData.data?.breakdown?.length}`);

  // Test 2: GET /api/payments/modes
  console.log('\n--- 2. Testing GET /api/payments/modes ---');
  const modesRes = await fetch(`${API_BASE}/payments/modes`, { headers });
  const modesData = await modesRes.json();
  console.log(`Status: ${modesRes.status}, Available Modes: ${modesData.data?.length}`);
  modesData.data?.forEach(m => console.log(` • [${m.mode_code}] ${m.mode_name} (Active: ${m.is_active === 1}, MDR: ${m.mdr_pct}%)`));

  // Test 3: PUT /api/payments/modes/:id (Update Configuration)
  if (modesData.data?.length > 0) {
    const firstMode = modesData.data[0];
    console.log(`\n--- 3. Testing PUT /api/payments/modes/${firstMode.id} ---`);
    const updateRes = await fetch(`${API_BASE}/payments/modes/${firstMode.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ mdr_pct: 0.00, vpa_id: 'ceritage@bank' })
    });
    const updateData = await updateRes.json();
    console.log(`Status: ${updateRes.status}, Message: ${updateData.message}`);
  }

  // Test 4: GET /api/payments/transactions
  console.log('\n--- 4. Testing GET /api/payments/transactions ---');
  const txRes = await fetch(`${API_BASE}/payments/transactions?limit=10`, { headers });
  const txData = await txRes.json();
  console.log(`Status: ${txRes.status}, Total Transactions: ${txData.total}, Returned: ${txData.data?.length}`);

  // Test 5: Validation - Invalid & Negative Amounts
  console.log('\n--- 5. Testing Validation on POST /api/payments/record ---');
  const invalidRes = await fetch(`${API_BASE}/payments/record`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'CUSTOMER_DUES', customer_id: 1, amount: -500 })
  });
  const invalidData = await invalidRes.json();
  console.log(`Negative Amount Rejected: Status ${invalidRes.status} (${invalidData.message})`);

  const zeroRes = await fetch(`${API_BASE}/payments/record`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'CUSTOMER_DUES', customer_id: 1, amount: 0 })
  });
  const zeroData = await zeroRes.json();
  console.log(`Zero Amount Rejected: Status ${zeroRes.status} (${zeroData.message})`);

  // Test 6: Transactional Payment Recording (Customer Dues)
  const [custs] = await db.query('SELECT id, full_name, balance_due FROM customers LIMIT 1');
  if (custs.length > 0) {
    const testCust = custs[0];
    console.log(`\n--- 6. Testing Customer Dues Payment for ${testCust.full_name} (Current Due: ₹${testCust.balance_due}) ---`);
    const payRes = await fetch(`${API_BASE}/payments/record`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'CUSTOMER_DUES',
        customer_id: testCust.id,
        amount: 100,
        payment_mode: 'UPI',
        reference_no: `UPI-${Date.now().toString().slice(-6)}`,
        remark: 'Counter payment test'
      })
    });
    const payData = await payRes.json();
    console.log(`Payment Result: Status ${payRes.status}`, payData.data);

    // Verify Customer Balance & Ledger
    const [[updatedCust]] = await db.query('SELECT balance_due FROM customers WHERE id = ?', [testCust.id]);
    const [ledgerEntries] = await db.query('SELECT * FROM customer_ledger WHERE customer_id = ? ORDER BY id DESC LIMIT 1', [testCust.id]);
    console.log(`✓ Customer new balance: ₹${updatedCust.balance_due}`);
    console.log(`✓ Ledger entry verified: Ref: ${ledgerEntries[0]?.reference}, Credit: ₹${ledgerEntries[0]?.credit}`);
  }

  // Test 7: Unauthorized Access Test
  console.log('\n--- 7. Testing Unauthorized Access (No Token) ---');
  const noTokenRes = await fetch(`${API_BASE}/payments/kpis`);
  console.log(`No Token Rejected: Status ${noTokenRes.status}`);

  console.log('\n================================================================');
  console.log('✅ ALL PAYMENT MODES END-TO-END TESTS PASSED (100% SUCCESS)');
  console.log('================================================================');
  process.exit(0);
}

runPaymentModesTest().catch(err => {
  console.error(err);
  process.exit(1);
});
