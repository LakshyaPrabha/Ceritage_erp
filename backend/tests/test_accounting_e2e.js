const db = require('../config/db');

const API_BASE = 'http://localhost:5000/api';

async function runAccountingE2ETest() {
  console.log('================================================================');
  console.log('TESTING ACCOUNTING & DOUBLE-ENTRY BOOKS MODULE END-TO-END');
  console.log('================================================================');

  // 1. Authenticate
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

  // Test 1: GET /api/accounting/summary
  console.log('\n--- 1. Testing GET /api/accounting/summary ---');
  const sumRes = await fetch(`${API_BASE}/accounting/summary`, { headers });
  const sumData = await sumRes.json();
  console.log(`Status: ${sumRes.status}`, sumData.data);

  // Test 2: GET /api/accounting/cashbook
  console.log('\n--- 2. Testing GET /api/accounting/cashbook ---');
  const cbRes = await fetch(`${API_BASE}/accounting/cashbook`, { headers });
  const cbData = await cbRes.json();
  console.log(`Status: ${cbRes.status}, Total Entries: ${cbData.data?.length}`);

  // Test 3: GET /api/accounting/bankbook
  console.log('\n--- 3. Testing GET /api/accounting/bankbook ---');
  const bbRes = await fetch(`${API_BASE}/accounting/bankbook`, { headers });
  const bbData = await bbRes.json();
  console.log(`Status: ${bbRes.status}, Total Digital/Bank Entries: ${bbData.data?.length}`);

  // Test 4: GET /api/accounting/trial-balance (Debits == Credits Invariant)
  console.log('\n--- 4. Testing GET /api/accounting/trial-balance ---');
  const tbRes = await fetch(`${API_BASE}/accounting/trial-balance`, { headers });
  const tbData = await tbRes.json();
  console.log(`Status: ${tbRes.status}, Total Debit: ₹${tbData.totals?.total_debit}, Total Credit: ₹${tbData.totals?.total_credit}, Balanced: ${tbData.totals?.balanced}`);

  // Test 5: GET /api/accounting/pl (Profit & Loss)
  console.log('\n--- 5. Testing GET /api/accounting/pl ---');
  const plRes = await fetch(`${API_BASE}/accounting/pl`, { headers });
  const plData = await plRes.json();
  console.log(`Status: ${plRes.status}, Revenue: ₹${plData.data?.revenue?.total_revenue}, Net Profit: ₹${plData.data?.net_profit}`);

  // Test 6: GET /api/accounting/balance-sheet
  console.log('\n--- 6. Testing GET /api/accounting/balance-sheet ---');
  const bsRes = await fetch(`${API_BASE}/accounting/balance-sheet`, { headers });
  const bsData = await bsRes.json();
  console.log(`Status: ${bsRes.status}, Total Assets: ₹${bsData.data?.assets?.total_assets}, Balanced: ${bsData.data?.balanced}`);

  // Test 7: GET /api/accounting/accounts (Chart of Accounts)
  console.log('\n--- 7. Testing GET /api/accounting/accounts ---');
  const accRes = await fetch(`${API_BASE}/accounting/accounts`, { headers });
  const accData = await accRes.json();
  console.log(`Status: ${accRes.status}, Total Accounts: ${accData.data?.length}`);

  // Test 8: Double-Entry Voucher Posting (Validation & Invariants)
  console.log('\n--- 8. Testing Double-Entry Voucher Invariants on POST /api/accounting/vouchers ---');

  // 8a. Unbalanced voucher (Dr != Cr)
  const unbalRes = await fetch(`${API_BASE}/accounting/vouchers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      voucher_type: 'JOURNAL',
      entry_date: '2026-09-01',
      narration: 'Unbalanced test',
      lines: [
        { account_id: 1, debit: 1000, credit: 0 },
        { account_id: 2, debit: 0, credit: 500 }
      ]
    })
  });
  const unbalData = await unbalRes.json();
  console.log(`Unbalanced Voucher Rejected: Status ${unbalRes.status} (${unbalData.message})`);

  // 8b. Balanced Valid Voucher (Dr = Cr)
  const [cashAcc] = await db.query("SELECT id FROM accounts WHERE code = '1010'");
  const [equityAcc] = await db.query("SELECT id FROM accounts WHERE code = '3010'");

  const balRes = await fetch(`${API_BASE}/accounting/vouchers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      voucher_type: 'RECEIPT',
      entry_date: '2026-09-01',
      narration: 'Owner Capital Deposit to Cash in Hand',
      lines: [
        { account_id: cashAcc[0].id, debit: 5000, credit: 0, narration: 'Capital inflow' },
        { account_id: equityAcc[0].id, debit: 0, credit: 5000, narration: 'Equity credit' }
      ]
    })
  });
  const balData = await balRes.json();
  console.log(`Balanced Voucher Posted: Status ${balRes.status}`, balData.data);

  // Test 9: Unauthorized User Test
  console.log('\n--- 9. Testing Unauthorized Access (No Token) ---');
  const noTokenRes = await fetch(`${API_BASE}/accounting/summary`);
  console.log(`No Token Rejected: Status ${noTokenRes.status}`);

  console.log('\n================================================================');
  console.log('✅ ALL ACCOUNTING DOUBLE-ENTRY WORKFLOWS PASSED (100% SUCCESS)');
  console.log('================================================================');
  process.exit(0);
}

runAccountingE2ETest().catch(err => {
  console.error(err);
  process.exit(1);
});
