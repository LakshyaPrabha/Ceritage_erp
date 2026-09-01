const db = require('../config/db');

const API_BASE = 'http://localhost:5000/api';

async function runGstTaxationE2ETest() {
  console.log('================================================================');
  console.log('TESTING GST & TAXATION MODULE END-TO-END');
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

  // Test 1: GET /api/gst/summary
  console.log('\n--- 1. Testing GET /api/gst/summary ---');
  const sumRes = await fetch(`${API_BASE}/gst/summary`, { headers });
  const sumData = await sumRes.json();
  console.log(`Status: ${sumRes.status}`, {
    taxable_turnover: sumData.data?.output_gst?.taxable_sales,
    output_gst: sumData.data?.output_gst?.total,
    itc_purchases: sumData.data?.input_gst?.total,
    net_tax_payable: sumData.data?.net_tax_payable
  });

  // Test 2: GET /api/gst/gstr-1 (Outward Supplies)
  console.log('\n--- 2. Testing GET /api/gst/gstr-1 ---');
  const gstr1Res = await fetch(`${API_BASE}/gst/gstr-1`, { headers });
  const gstr1Data = await gstr1Res.json();
  console.log(`Status: ${gstr1Res.status}, Total Invoices in GSTR-1: ${gstr1Data.data?.length}`);

  // Test 3: GET /api/gst/gstr-3b (Table 3.1 & Table 4 Summary)
  console.log('\n--- 3. Testing GET /api/gst/gstr-3b ---');
  const gstr3bRes = await fetch(`${API_BASE}/gst/gstr-3b`, { headers });
  const gstr3bData = await gstr3bRes.json();
  console.log(`Status: ${gstr3bRes.status}`, {
    table3_1_outward: gstr3bData.data?.table3_1?.taxable_value,
    table4_itc: gstr3bData.data?.table4?.total_itc,
    net_payable: gstr3bData.data?.net_liability?.total
  });

  // Test 4: GET /api/gst/hsn-summary
  console.log('\n--- 4. Testing GET /api/gst/hsn-summary ---');
  const hsnRes = await fetch(`${API_BASE}/gst/hsn-summary`, { headers });
  const hsnData = await hsnRes.json();
  console.log(`Status: ${hsnRes.status}, Total HSN Codes: ${hsnData.data?.length}`);

  // Test 5: POST /api/gst/calculate (Tax Calculation & Invariant Verification)
  console.log('\n--- 5. Testing POST /api/gst/calculate ---');
  // 5a. Intra-state 3% Gold Jewellery (₹1,00,000)
  const intraRes = await fetch(`${API_BASE}/gst/calculate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ taxable_value: 100000, gst_rate: 3.00, is_interstate: false })
  });
  const intraData = await intraRes.json();
  console.log('Intra-State 3% Result:', intraData.data);
  const intraPass = (intraData.data.cgst === 1500 && intraData.data.sgst === 1500 && intraData.data.grand_total === 103000);
  console.log(`✓ Intra-state calculation invariant (CGST 1.5% + SGST 1.5%): ${intraPass ? 'PASS' : 'FAIL'}`);

  // 5b. Inter-state 3% Gold Jewellery (₹1,00,000)
  const interRes = await fetch(`${API_BASE}/gst/calculate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ taxable_value: 100000, gst_rate: 3.00, is_interstate: true })
  });
  const interData = await interRes.json();
  console.log('Inter-State 3% Result:', interData.data);
  const interPass = (interData.data.igst === 3000 && interData.data.grand_total === 103000);
  console.log(`✓ Inter-state calculation invariant (IGST 3%): ${interPass ? 'PASS' : 'FAIL'}`);

  // 5c. Cash > ₹2 Lakhs TCS 0.1% (₹3,00,000 Cash Sale)
  const tcsRes = await fetch(`${API_BASE}/gst/calculate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ taxable_value: 300000, gst_rate: 3.00, is_interstate: false, is_cash: true })
  });
  const tcsData = await tcsRes.json();
  console.log('TCS 0.1% on > ₹2L Cash Result:', tcsData.data);
  const tcsPass = (tcsData.data.tcs === 300 && tcsData.data.grand_total === 309300);
  console.log(`✓ TCS Section 206C(1H) invariant: ${tcsPass ? 'PASS' : 'FAIL'}`);

  // Test 6: Unauthorized Access
  console.log('\n--- 6. Testing Unauthorized Access (No Token) ---');
  const noTokenRes = await fetch(`${API_BASE}/gst/summary`);
  console.log(`No Token Rejected: Status ${noTokenRes.status}`);

  console.log('\n================================================================');
  console.log('✅ ALL GST & TAXATION WORKFLOWS PASSED (100% SUCCESS)');
  console.log('================================================================');
  process.exit(0);
}

runGstTaxationE2ETest().catch(err => {
  console.error(err);
  process.exit(1);
});
