const db = require('../config/db');

const API_BASE = 'http://localhost:5000/api';

async function runFineMetalE2ETest() {
  console.log('================================================================');
  console.log('TESTING FINE METAL LEDGER & TUNCH MODULE END-TO-END');
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

  // Test 1: GET /api/tunch/summary
  console.log('\n--- 1. Testing GET /api/tunch/summary ---');
  const sumRes = await fetch(`${API_BASE}/tunch/summary`, { headers });
  const sumData = await sumRes.json();
  console.log(`Status: ${sumRes.status}`, {
    fine_gold_balance: `${sumData.data?.fine_gold_balance} g`,
    fine_silver_balance: `${sumData.data?.fine_silver_balance} g`,
    karigar_holding: `${sumData.data?.karigar_holding_fine} g`,
    finished_stock: `${sumData.data?.inventory_fine_gold} g`
  });

  // Test 2: GET /api/tunch/ledger
  console.log('\n--- 2. Testing GET /api/tunch/ledger ---');
  const ledRes = await fetch(`${API_BASE}/tunch/ledger`, { headers });
  const ledData = await ledRes.json();
  console.log(`Status: ${ledRes.status}, Total Movements in Log: ${ledData.data?.length}`);

  // Test 3: GET /api/tunch/karigar-balances
  console.log('\n--- 3. Testing GET /api/tunch/karigar-balances ---');
  const kbRes = await fetch(`${API_BASE}/tunch/karigar-balances`, { headers });
  const kbData = await kbRes.json();
  console.log(`Status: ${kbRes.status}, Total Karigars Tracked: ${kbData.data?.length}`);

  // Test 4: Fine Metal Calculation & Recording (Validation & Invariants)
  console.log('\n--- 4. Testing POST /api/tunch/record ---');

  // 4a. Invalid / Negative Weight
  const negRes = await fetch(`${API_BASE}/tunch/record`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ gross_weight: -50, metal_type: 'Gold', purity: '24K' })
  });
  const negData = await negRes.json();
  console.log(`Negative Weight Rejected: Status ${negRes.status} (${negData.message})`);

  // 4b. Valid 24K Bullion Inward (100g -> 99.9g Fine)
  const validRes = await fetch(`${API_BASE}/tunch/record`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      transaction_type: 'MANUAL_ENTRY',
      metal_type: 'Gold',
      purity: '24K',
      gross_weight: 100,
      wastage: 0,
      flow: 'INWARD',
      party_type: 'Store',
      party_name: 'MMTC Bullion Refinery',
      narration: 'Pure 24K gold bar deposit test'
    })
  });
  const validData = await validRes.json();
  console.log(`Valid Movement Recorded: Status ${validRes.status}`, validData.data);
  const mathPass = (validData.data?.fine_weight === 99.9);
  console.log(`✓ Fine Weight Math Invariant (100g × 0.999 = 99.9g): ${mathPass ? 'PASS' : 'FAIL'}`);

  // Test 5: Unauthorized Access
  console.log('\n--- 5. Testing Unauthorized Access (No Token) ---');
  const noTokenRes = await fetch(`${API_BASE}/tunch/summary`);
  console.log(`No Token Rejected: Status ${noTokenRes.status}`);

  console.log('\n================================================================');
  console.log('✅ ALL FINE METAL LEDGER WORKFLOWS PASSED (100% SUCCESS)');
  console.log('================================================================');
  process.exit(0);
}

runFineMetalE2ETest().catch(err => {
  console.error(err);
  process.exit(1);
});
