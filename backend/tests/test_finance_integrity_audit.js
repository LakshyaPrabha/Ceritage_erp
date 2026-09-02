const db = require('../config/db');

const API = 'http://localhost:5000/api';
let token = null;
let H = {};

async function auth() {
  const r = await fetch(API+'/auth/login', {method:'POST',headers:{'Content-Type':'application/json'},
    body: JSON.stringify({username:'admin',password:'ceritage123'})});
  const j = await r.json();
  token = j.token;
  H = {'Content-Type':'application/json','Authorization':'Bearer '+token};
  console.log('Authenticated as admin');
}

async function testCashSale() {
  console.log('\n=== TEST 1: CASH SALE ₹100,000 (HSN 7113, GST 3%) ===');
  // Taxable = 100000 / 1.03 = 97087.38
  const r = await fetch(API+'/billing', {method:'POST', headers:H, body:JSON.stringify({
    invoice_type:'Retail Invoice',
    invoice_date: new Date().toISOString().slice(0,10),
    payment_mode: 'Cash', hsn_code:'7113',
    cgst: 1456.31, sgst: 1456.31, igst: 0, tcs: 0,
    grand_total: 100000, paid_amount: 100000,
    items: [{description:'TEST Gold Ring 22K',hsn:'7113',purity:'22K',weight_g:10,rate_per_gram:6825,making_charges:5000,stone_charges:0,gst_pct:3,amount:97087.38}]
  })});
  const j = await r.json();
  if (!j.success) { console.log('FAILED:', j.message); return null; }
  console.log('✓ Invoice Created:', j.data.invoice_no, '| Grand Total: ₹100,000 | Mode: Cash | Status: Paid');
  console.log('  Expected Journal: DR Cash 1010 ₹100,000 | CR Sales 4010 ₹97,087.38 | CR GST Output 2020 ₹2,912.62');
  return j.data.invoice_no;
}

async function testUpiSale() {
  console.log('\n=== TEST 2: UPI SALE ₹50,000 (HSN 7113, GST 3%) ===');
  const r = await fetch(API+'/billing', {method:'POST', headers:H, body:JSON.stringify({
    invoice_type:'Retail Invoice',
    invoice_date: new Date().toISOString().slice(0,10),
    payment_mode: 'UPI', hsn_code:'7113',
    cgst: 727.47, sgst: 727.47, igst: 0, tcs: 0,
    grand_total: 50000, paid_amount: 50000,
    items: [{description:'TEST Silver Bracelet',hsn:'7113',purity:'999',weight_g:100,rate_per_gram:88.5,making_charges:2000,stone_charges:0,gst_pct:3,amount:48545.06}]
  })});
  const j = await r.json();
  if (!j.success) { console.log('FAILED:', j.message); return null; }
  console.log('✓ Invoice Created:', j.data.invoice_no, '| Grand Total: ₹50,000 | Mode: UPI | Status: Paid');
  console.log('  Note: UPI maps to Account 1020 (Bank Current A/C & UPI/POS Settlement) — NO separate UPI clearing account');
  return j.data.invoice_no;
}

async function testCreditSale() {
  console.log('\n=== TEST 3: CREDIT SALE ₹100,000 — Down ₹20,000 | Balance ₹80,000 ===');
  // Get first customer
  const cr = await fetch(API+'/customers?limit=1', {headers:H});
  const cj = await cr.json();
  const cust = cj.data?.[0];
  if (!cust) { console.log('No customer found. Skipping credit test.'); return null; }

  const r = await fetch(API+'/billing', {method:'POST', headers:H, body:JSON.stringify({
    invoice_type:'Retail Invoice',
    customer_id: cust.id,
    invoice_date: new Date().toISOString().slice(0,10),
    payment_mode: 'Credit', hsn_code:'7113',
    cgst: 1456.31, sgst: 1456.31, igst: 0, tcs: 0,
    grand_total: 100000, paid_amount: 20000,
    credit_days: 30,
    items: [{description:'TEST Diamond Necklace',hsn:'7113',purity:'22K',weight_g:20,rate_per_gram:6825,making_charges:10000,stone_charges:5000,gst_pct:3,amount:97087.38}]
  })});
  const j = await r.json();
  if (!j.success) { console.log('CREDIT SALE FAILED:', j.message); return null; }
  console.log('✓ Credit Invoice:', j.data.invoice_no, '| Customer:', cust.full_name, '| Status: Credit');
  console.log('  Expected: AR 1030 +₹80,000 | Cash 1010 +₹20,000 | Sales CR 4010 ₹97,087 | GST CR 2020 ₹2,912');
  return j.data.invoice_no;
}

async function testEmiPlan() {
  console.log('\n=== TEST 4: EMI PLAN — ₹120,000 | Down ₹20,000 | 10 months ===');
  const cr = await fetch(API+'/customers?limit=1', {headers:H});
  const cj = await cr.json();
  const cust = cj.data?.[0];
  if (!cust) { console.log('No customer found. Skipping EMI test.'); return null; }

  const firstDue = new Date(Date.now() + 30*86400000).toISOString().slice(0,10);
  const r = await fetch(API+'/emi/plans', {method:'POST', headers:H, body:JSON.stringify({
    customer_id: cust.id,
    invoice_ref: null,
    item_description: 'TEST Diamond Set Purchase',
    total_amount: 120000,
    down_payment: 20000,
    num_emis: 10,
    interest_rate: 0,
    finance_partner: 'In-House',
    first_due_date: firstDue
  })});
  const j = await r.json();
  if (!j.success) { console.log('EMI PLAN FAILED:', j.message); return null; }
  console.log('✓ EMI Plan Created:', j.data.plan_id);
  console.log('  Loan Amount: ₹', j.data.loan_amount);
  console.log('  Monthly EMI: ₹', j.data.emi_amount, '| Final EMI: ₹', j.data.final_emi);
  console.log('  First Due:', j.data.first_due_date);

  // Fetch plan details
  const planRes = await fetch(API+'/emi/plans/'+j.data.id, {headers:H});
  const planJ = await planRes.json();
  const installments = planJ.data?.installments || [];
  console.log('  Installments Created:', installments.length);
  installments.slice(0,3).forEach(i => console.log('   - #'+i.installment_no+' Due:'+i.due_date+' Amount:₹'+i.amount_due+' Status:'+i.status));

  return {planId: j.data.id, planCode: j.data.plan_id, installments, customer_id: cust.id};
}

async function testEmiPayment(planInfo) {
  if (!planInfo) return;
  console.log('\n=== TEST 5: EMI PAYMENT — Installment #1 ===');
  const inst1 = planInfo.installments[0];
  const r = await fetch(API+'/emi/plans/'+planInfo.planId+'/collect', {method:'POST', headers:H, body:JSON.stringify({
    installment_id: inst1.id,
    amount: inst1.amount_due,
    payment_mode: 'Cash',
    notes: 'Test Payment Installment #1'
  })});
  const j = await r.json();
  if (!j.success) { console.log('EMI PAYMENT FAILED:', j.message); return; }
  console.log('✓ Installment #1 PAID:', j.data.receipt_no, '| Amount: ₹', j.data.amount_collected);
  console.log('  Remaining Plan Balance: ₹', j.data.remaining_plan_balance);
  console.log('  Customer Balance Due: ₹', j.data.new_customer_balance_due);

  // Test failed installment #2 (overpay to detect guard)
  console.log('\n=== TEST 6: EMI FAILED PAYMENT — Overpay Guard on Installment #2 ===');
  const inst2 = planInfo.installments[1];
  const r2 = await fetch(API+'/emi/plans/'+planInfo.planId+'/collect', {method:'POST', headers:H, body:JSON.stringify({
    installment_id: inst2.id,
    amount: inst2.amount_due * 2, // try to overpay - should be rejected
    payment_mode: 'Cash'
  })});
  const j2 = await r2.json();
  console.log('Overpay Rejected (expected 400):', r2.status, j2.message);
}

async function testTrialBalance() {
  console.log('\n=== TRIAL BALANCE VERIFICATION ===');
  const r = await fetch(API+'/accounting/trial-balance', {headers:H});
  const j = await r.json();
  const t = j.data?.totals;
  console.log('Total Debit: ₹', t?.total_debit?.toFixed(2));
  console.log('Total Credit: ₹', t?.total_credit?.toFixed(2));
  console.log('Balanced:', t?.balanced ? '✓ YES' : '✗ NO');

  const rows = j.data?.data || [];
  console.log('\nActive Accounts:');
  rows.filter(r => r.debit > 0 || r.credit > 0).forEach(r => {
    console.log(' ', r.code, r.name.substring(0,40).padEnd(40), '| DR:', (r.debit||0).toFixed(2).padStart(12), '| CR:', (r.credit||0).toFixed(2).padStart(12));
  });
}

async function testGstFlow() {
  console.log('\n=== GST FLOW VERIFICATION ===');
  const r = await fetch(API+'/gst/summary', {headers:H});
  const j = await r.json();
  const d = j.data;
  console.log('Taxable Sales: ₹', d?.output_gst?.taxable_sales);
  console.log('Output CGST:   ₹', d?.output_gst?.cgst);
  console.log('Output SGST:   ₹', d?.output_gst?.sgst);
  console.log('Output IGST:   ₹', d?.output_gst?.igst);
  console.log('Total Output GST: ₹', d?.output_gst?.total);
  console.log('Input ITC:     ₹', d?.input_gst?.total);
  console.log('Net Payable:   ₹', d?.net_tax_payable);

  // Test GST calculation
  const calcR = await fetch(API+'/gst/calculate', {method:'POST', headers:H, body:JSON.stringify({
    taxable_value: 97087.38, gst_rate: 3, state_of_supply: '24-Gujarat', customer_state: '24-Gujarat', payment_amount: 100000
  })});
  const calcJ = await calcR.json();
  const c = calcJ.data;
  console.log('\nGST Calculation Test (₹97,087.38 @ 3%):');
  console.log('  Taxable Value: ₹', c?.taxable_value);
  console.log('  CGST (1.5%):  ₹', c?.cgst);
  console.log('  SGST (1.5%):  ₹', c?.sgst);
  console.log('  IGST:         ₹', c?.igst);
  console.log('  Grand Total:  ₹', c?.grand_total);
  console.log('  Intra-State Calc:', c?.cgst === c?.sgst && c?.igst === 0 ? '✓ CORRECT' : '✗ WRONG');
}

async function testAccountingReconciliation() {
  console.log('\n=== ACCOUNTING RECONCILIATION ===');
  // Journal entries
  const r = await fetch(API+'/accounting/journal', {headers:H});
  const j = await r.json();
  console.log('Total Journal Entries: ', j.data?.length);

  // Summary
  const sr = await fetch(API+'/accounting/summary', {headers:H});
  const sj = await sr.json();
  const s = sj.data;
  console.log('Cash In Hand: ₹', s?.cash_in_hand);
  console.log('Bank Balance: ₹', s?.bank_balance);
  console.log('Receivables:  ₹', s?.receivables);
  console.log('Stock Value:  ₹', s?.stock_valuation);
  console.log('GST Payable:  ₹', s?.gst_payable);
  console.log('Net Profit:   ₹', s?.net_profit);
  console.log('Total Assets: ₹', s?.total_assets);
}

async function main() {
  await auth();
  const inv1 = await testCashSale();
  const inv2 = await testUpiSale();
  const inv3 = await testCreditSale();
  const planInfo = await testEmiPlan();
  await testEmiPayment(planInfo);
  await testTrialBalance();
  await testGstFlow();
  await testAccountingReconciliation();
  console.log('\n=== AUDIT COMPLETE ===');
  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
