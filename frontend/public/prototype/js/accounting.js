/* ===================================================
   CERITAGE JEWELRY ERP — Accounting Module
   15 Features: Cash Book · Bank Book · Journal · Ledger · Trial Balance
   P&L · Balance Sheet · Day Book · Payment/Receipt/Contra/Journal Vouchers
   Expense Mgmt · Income Mgmt · Bank Reconciliation
   =================================================== */

const ACC = {
  // ---- CASH BOOK ----
  cashBook: [
    { time:'09:00', date:'2026-08-16', particulars:'Opening Balance',           voucherNo:'OB-001',    dr:0,       cr:0,       bal:284000,  type:'opening' },
    { time:'10:15', date:'2026-08-16', particulars:'Cash Sale — Jhumka Earrings',voucherNo:'INV-8840', dr:0,       cr:60800,   bal:344800,  type:'receipt' },
    { time:'11:23', date:'2026-08-16', particulars:'Cash Sale — Kundan Necklace',voucherNo:'INV-8841', dr:0,       cr:206000,  bal:550800,  type:'receipt' },
    { time:'13:00', date:'2026-08-16', particulars:'Rent Paid — Aug 2026',       voucherNo:'PV-0088',  dr:80000,   cr:0,       bal:470800,  type:'payment' },
    { time:'14:30', date:'2026-08-16', particulars:'Purchase — Zaveri Bullion',  voucherNo:'PO-148',   dr:224000,  cr:0,       bal:246800,  type:'payment' },
    { time:'15:45', date:'2026-08-16', particulars:'Repair Advance Received',    voucherNo:'RV-0042',  dr:0,       cr:2000,    bal:248800,  type:'receipt' },
    { time:'16:00', date:'2026-08-16', particulars:'Salary Advance — Karan',     voucherNo:'PV-0089',  dr:5000,    cr:0,       bal:243800,  type:'payment' },
    { time:'17:30', date:'2026-08-16', particulars:'Cash Deposited to Bank',     voucherNo:'CV-0022',  dr:200000,  cr:0,       bal:43800,   type:'contra'  },
    { time:'09:00', date:'2026-08-15', particulars:'Opening Balance',           voucherNo:'OB-002',    dr:0,       cr:0,       bal:204000,  type:'opening' },
    { time:'11:00', date:'2026-08-15', particulars:'Cash Sale — Gold Chain',    voucherNo:'INV-8838',  dr:0,       cr:95400,   bal:299400,  type:'receipt' },
    { time:'14:00', date:'2026-08-15', particulars:'Karigar Payment',           voucherNo:'PV-0087',  dr:15000,   cr:0,       bal:284400,  type:'payment' },
    { time:'16:00', date:'2026-08-15', particulars:'Cash Deposited to Bank',    voucherNo:'CV-0021',  dr:80000,   cr:0,       bal:204400,  type:'contra'  },
  ],

  // ---- BANK BOOK ----
  bankBook: [
    { date:'2026-08-16', particulars:'Opening Balance',              voucherNo:'OB-BANK', dr:0,        cr:0,        bal:1460000, bank:'SBI Current A/C',  ref:'—'             },
    { date:'2026-08-16', particulars:'Cash Deposited',               voucherNo:'CV-0022', dr:0,        cr:200000,   bal:1660000, bank:'SBI Current A/C',  ref:'CASH-DEP-001'  },
    { date:'2026-08-16', particulars:'UPI Receipt — Priya Sharma',   voucherNo:'INV-8841',dr:0,        cr:206000,   bal:1866000, bank:'SBI Current A/C',  ref:'UTR-3245678901'},
    { date:'2026-08-16', particulars:'NEFT Paid — Zaveri Bullion',   voucherNo:'SP001',   dr:274000,   cr:0,        bal:1592000, bank:'SBI Current A/C',  ref:'UTR-6789012345'},
    { date:'2026-08-16', particulars:'Salary Transfer — Ravi Sharma',voucherNo:'SAL-001', dr:66650,    cr:0,        bal:1525350, bank:'SBI Current A/C',  ref:'UTR-9012345678'},
    { date:'2026-08-15', particulars:'Cash Deposited',               voucherNo:'CV-0021', dr:0,        cr:80000,    bal:1340000, bank:'SBI Current A/C',  ref:'CASH-DEP-002'  },
    { date:'2026-08-15', particulars:'RTGS Received — Vikram M.',    voucherNo:'INV-8838',dr:0,        cr:1250000,  bal:1420000, bank:'SBI Current A/C',  ref:'UTR-5678901234'},
    { date:'2026-08-14', particulars:'RTGS Paid — KDM Gold Refinery',voucherNo:'SP003',   dr:631200,   cr:0,        bal:170000,  bank:'SBI Current A/C',  ref:'UTR-4567890123'},
  ],

  // ---- JOURNAL ENTRIES ----
  journal: [
    { id:'JE001', date:'2026-08-16', particulars:'Depreciation on Fixtures',     debitAcc:'Depreciation A/c',    creditAcc:'Fixtures A/c',       amount:5000,  narration:'Monthly depreciation @10% p.a.' },
    { id:'JE002', date:'2026-08-15', particulars:'GST Payable Transfer',         debitAcc:'Output GST A/c',      creditAcc:'GST Payable A/c',     amount:77000, narration:'GST liability for Aug 2026' },
    { id:'JE003', date:'2026-08-14', particulars:'TCS on High Value Sale',        debitAcc:'TCS Recoverable A/c', creditAcc:'TCS Payable A/c',     amount:12500, narration:'TCS 1% on INV-8838 ₹12.5L' },
    { id:'JE004', date:'2026-08-12', particulars:'Salary Expense',               debitAcc:'Salary Expense A/c',  creditAcc:'Salary Payable A/c',  amount:482000,narration:'Aug 2026 salary accrual' },
    { id:'JE005', date:'2026-08-10', particulars:'Advance from Customer',        debitAcc:'Bank A/c',            creditAcc:'Advance from Customer',amount:50000, narration:'Advance — ORD-001 Sunita Verma' },
    { id:'JE006', date:'2026-08-08', particulars:'Gold Rate Fluctuation Adj.',   debitAcc:'P&L A/c',             creditAcc:'Inventory Revaluation',amount:38000, narration:'Gold price adj Aug 1-8' },
    { id:'JE007', date:'2026-08-05', particulars:'PF Contribution Payable',      debitAcc:'PF Expense A/c',      creditAcc:'PF Payable A/c',       amount:31200, narration:'Employer PF contribution Aug' },
    { id:'JE008', date:'2026-08-01', particulars:'Opening Stock Entry',          debitAcc:'Stock A/c',           creditAcc:'Opening Stock A/c',    amount:28500000,narration:'Opening stock 01-Aug-2026' },
  ],

  // ---- LEDGER ACCOUNTS ----
  accounts: [
    { id:'A001', name:'Sales Account',         group:'Income',      dr:0,        cr:8400000,  bal:8400000,  type:'Cr' },
    { id:'A002', name:'Purchase Account',       group:'Expense',     dr:6000000,  cr:0,        bal:6000000,  type:'Dr' },
    { id:'A003', name:'Cash in Hand',           group:'Asset',       dr:5483200,  cr:5439400,  bal:43800,    type:'Dr' },
    { id:'A004', name:'SBI Current A/c',        group:'Asset',       dr:3246000,  cr:1720650,  bal:1525350,  type:'Dr' },
    { id:'A005', name:'Accounts Receivable',    group:'Asset',       dr:480000,   cr:270000,   bal:210000,   type:'Dr' },
    { id:'A006', name:'Accounts Payable',       group:'Liability',   dr:0,        cr:705000,   bal:705000,   type:'Cr' },
    { id:'A007', name:'Salary Expense',         group:'Expense',     dr:482000,   cr:0,        bal:482000,   type:'Dr' },
    { id:'A008', name:'Rent Expense',           group:'Expense',     dr:80000,    cr:0,        bal:80000,    type:'Dr' },
    { id:'A009', name:'GST Payable',            group:'Liability',   dr:0,        cr:252000,   bal:252000,   type:'Cr' },
    { id:'A010', name:'Capital Account',        group:'Capital',     dr:0,        cr:28000000, bal:28000000, type:'Cr' },
    { id:'A011', name:'Repair Income',          group:'Income',      dr:0,        cr:45000,    bal:45000,    type:'Cr' },
    { id:'A012', name:'Stock / Inventory',      group:'Asset',       dr:32000000, cr:6000000,  bal:26000000, type:'Dr' },
    { id:'A013', name:'Karigar Charges Expense',group:'Expense',     dr:82500,    cr:0,        bal:82500,    type:'Dr' },
    { id:'A014', name:'Depreciation',           group:'Expense',     dr:5000,     cr:0,        bal:5000,     type:'Dr' },
    { id:'A015', name:'Bank Loan',              group:'Liability',   dr:0,        cr:0,        bal:0,        type:'Cr' },
  ],

  // ---- VOUCHERS ----
  vouchers: [
    { id:'PV-0089', date:'2026-08-16', type:'Payment',  from:'Cash',    to:'Salary Advance',   amount:5000,  narration:'Advance to Karan Mehta',       by:'Ravi Sharma',  status:'Posted' },
    { id:'PV-0088', date:'2026-08-16', type:'Payment',  from:'Cash',    to:'Rent Expense',     amount:80000, narration:'Shop rent Aug 2026',            by:'Ravi Sharma',  status:'Posted' },
    { id:'RV-0042', date:'2026-08-16', type:'Receipt',  from:'Customer',to:'Cash',             amount:2000,  narration:'Repair advance — RJ003',        by:'Karan Mehta',  status:'Posted' },
    { id:'CV-0022', date:'2026-08-16', type:'Contra',   from:'Cash',    to:'SBI Bank',         amount:200000,narration:'Cash deposited to bank',        by:'Ravi Sharma',  status:'Posted' },
    { id:'JV-0015', date:'2026-08-15', type:'Journal',  from:'Salary Expense','to':'Salary Payable',amount:482000,narration:'Aug 2026 salary accrual', by:'Pooja Jain',   status:'Posted' },
    { id:'PV-0087', date:'2026-08-15', type:'Payment',  from:'Cash',    to:'Karigar Charges',  amount:15000, narration:'Labour payment Ramesh Soni WO004',by:'Ravi Sharma',status:'Posted' },
    { id:'RV-0041', date:'2026-08-14', type:'Receipt',  from:'Vikram M.','to':'Bank',          amount:1250000,narration:'RTGS — Solitaire Ring INV-8838',by:'Pooja Jain',  status:'Posted' },
    { id:'PV-0086', date:'2026-08-13', type:'Payment',  from:'Bank',    to:'Supplier Advance', amount:100000,narration:'Advance to Diamond Palace PO-147',by:'Ravi Sharma',status:'Posted' },
    { id:'CV-0021', date:'2026-08-15', type:'Contra',   from:'Cash',    to:'SBI Bank',         amount:80000, narration:'Cash deposited to bank',        by:'Deepika Singh',status:'Posted' },
    { id:'PV-0085', date:'2026-08-12', type:'Payment',  from:'Bank',    to:'Salary',           amount:482000,narration:'Salary disbursement Aug 2026',  by:'Pooja Jain',   status:'Posted' },
  ],

  // ---- EXPENSES ----
  expenses: [
    { id:'EX001', date:'2026-08-16', category:'Rent',        description:'Shop Rent — Mumbai HQ Aug 2026',    amount:80000,  mode:'Cash',         by:'Ravi Sharma',  billNo:'RENT-0088', status:'Paid'    },
    { id:'EX002', date:'2026-08-15', category:'Salary',      description:'Monthly Salary — All Staff',         amount:482000, mode:'Bank Transfer',by:'Pooja Jain',   billNo:'SAL-0012',  status:'Paid'    },
    { id:'EX003', date:'2026-08-15', category:'Karigar',     description:'Labour Charges — Ramesh Soni',       amount:15000,  mode:'Cash',         by:'Ravi Sharma',  billNo:'LC-001',    status:'Paid'    },
    { id:'EX004', date:'2026-08-14', category:'Electricity', description:'Electricity Bill — Aug 2026',        amount:8500,   mode:'UPI',          by:'Deepika Singh',billNo:'ELEC-0044', status:'Paid'    },
    { id:'EX005', date:'2026-08-14', category:'Maintenance', description:'CCTV Maintenance & Repair',          amount:3500,   mode:'Cash',         by:'Ravi Sharma',  billNo:'MAINT-012', status:'Paid'    },
    { id:'EX006', date:'2026-08-12', category:'Insurance',   description:'Jewelry Insurance Premium — Q3',     amount:25000,  mode:'Bank Transfer',by:'Pooja Jain',   billNo:'INS-0033',  status:'Paid'    },
    { id:'EX007', date:'2026-08-10', category:'Marketing',   description:'Festival Advertisement — Navratri',  amount:15000,  mode:'UPI',          by:'Ravi Sharma',  billNo:'MKT-0055',  status:'Paid'    },
    { id:'EX008', date:'2026-08-08', category:'Stationery',  description:'Billing paper, pens, files',         amount:1200,   mode:'Cash',         by:'Karan Mehta',  billNo:'STAT-0022', status:'Paid'    },
    { id:'EX009', date:'2026-08-20', category:'Rent',        description:'Delhi Branch Rent — Sep 2026',       amount:45000,  mode:'Bank Transfer',by:'Ravi Sharma',  billNo:'RENT-0089', status:'Pending' },
    { id:'EX010', date:'2026-08-20', category:'Telecoms',    description:'Internet + Phone Bill',               amount:3800,   mode:'UPI',          by:'Deepika Singh',billNo:'TEL-0011',  status:'Pending' },
  ],

  // ---- INCOME ----
  income: [
    { id:'IN001', date:'2026-08-16', category:'Gold Jewelry Sales', description:'Kundan Necklace — Priya Sharma',   amount:206000, mode:'UPI',          ref:'INV-8841', status:'Received' },
    { id:'IN002', date:'2026-08-16', category:'Gold Jewelry Sales', description:'Jhumka Earrings — Walk-in',        amount:60800,  mode:'Cash',         ref:'INV-8840', status:'Received' },
    { id:'IN003', date:'2026-08-14', category:'Diamond Jewelry',    description:'Solitaire Ring — Vikram Malhotra', amount:1250000,mode:'RTGS',         ref:'INV-8838', status:'Received' },
    { id:'IN004', date:'2026-08-14', category:'Gold Jewelry Sales', description:'Gold Chain — Amit Kumar',          amount:95400,  mode:'Card',         ref:'INV-8839', status:'Received' },
    { id:'IN005', date:'2026-08-12', category:'Silver Jewelry',     description:'Silver Payal Set — Walk-in',       amount:4140,   mode:'UPI',          ref:'INV-8835', status:'Received' },
    { id:'IN006', date:'2026-08-12', category:'Repair Income',      description:'Ring Resize — Rajesh Patel',       amount:500,    mode:'Cash',         ref:'RJ002',    status:'Received' },
    { id:'IN007', date:'2026-08-10', category:'Gold Coins',         description:'Lakshmi Gold Coin 8g × 3',         amount:193500, mode:'Cash',         ref:'INV-8830', status:'Received' },
    { id:'IN008', date:'2026-08-08', category:'Advance Received',   description:'Order Advance — Sunita Verma',     amount:50000,  mode:'NEFT',         ref:'ORD-001',  status:'Received' },
    { id:'IN009', date:'2026-08-20', category:'Diamond Jewelry',    description:'Diamond Bracelet — Pre-order',     amount:155000, mode:'UPI',          ref:'INV-DRAFT',status:'Expected' },
  ],

  // ---- BANK RECONCILIATION ----
  bankRecon: {
    bankBalance:   1525350,
    bookBalance:   1525350,
    bankDate:      '2026-08-16',
    uncleared: [
      { date:'2026-08-15', desc:'Cheque Issued — Salary Delhi',   type:'Cheque Out', amount:-52000,  status:'Uncleared' },
      { date:'2026-08-14', desc:'Cheque Received — Old Customer', type:'Cheque In',  amount:+35000,  status:'Uncleared' },
    ],
    statement: [
      { date:'2026-08-16', desc:'NEFT Received — Vikram M.',   dr:0,       cr:1250000,  bal:1860000 },
      { date:'2026-08-16', desc:'NEFT Paid — Zaveri Bullion',  dr:274000,  cr:0,        bal:610000  },
      { date:'2026-08-16', desc:'Cash Deposited',              dr:0,       cr:200000,   bal:884000  },
      { date:'2026-08-15', desc:'Salary Transferred',          dr:482000,  cr:0,        bal:684000  },
      { date:'2026-08-15', desc:'Cash Deposited',              dr:0,       cr:80000,    bal:1166000 },
      { date:'2026-08-14', desc:'RTGS Paid — KDM Refinery',   dr:631200,  cr:0,        bal:1086000 },
    ],
  },
};

// ---- UTILS ----
function acFmt(n)  { return '₹' + Math.abs(n||0).toLocaleString('en-IN'); }
function acDate(d) { if(!d) return '—'; const dt=new Date(d); return isNaN(dt)?d:dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function acBadge(s){ const m={'Posted':'badge-green','Paid':'badge-green','Received':'badge-green','Pending':'badge-orange','Draft':'badge-grey','Expected':'badge-blue','Uncleared':'badge-orange'};return `<span class="badge ${m[s]||'badge-grey'}">${s}</span>`; }
function acTypeBadge(t){ const m={Payment:'badge-red',Receipt:'badge-green',Contra:'badge-blue',Journal:'badge-purple',Expense:'badge-orange',Income:'badge-green'};return `<span class="badge ${m[t]||'badge-grey'}">${t}</span>`; }

// ====================================================
// 1. CASH BOOK
// ====================================================
function renderCashBook() {
  const tbody=document.getElementById('acc-cashbook-tbody'); if(!tbody) return;
  const today = ACC.cashBook.filter(e=>e.date==='2026-08-16');
  const closingBal = today[today.length-1]?.bal || 0;
  tbody.innerHTML = today.map(e=>`
    <tr style="background:${e.type==='opening'?'var(--primary-glow)':''}">
      <td style="font-size:.78rem;color:var(--text-muted)">${e.time}</td>
      <td>
        <div style="font-weight:${e.type==='opening'?700:400}">${e.particulars}</div>
      </td>
      <td><code style="font-size:.73rem;color:var(--accent)">${e.voucherNo}</code></td>
      <td>${acTypeBadge(e.type.charAt(0).toUpperCase()+e.type.slice(1))}</td>
      <td class="${e.dr>0?'text-danger fw-bold':''}">${e.dr>0?acFmt(e.dr):'—'}</td>
      <td class="${e.cr>0?'text-success fw-bold':''}">${e.cr>0?acFmt(e.cr):'—'}</td>
      <td class="text-gold fw-bold">${acFmt(e.bal)}</td>
    </tr>`).join('');
  const el=document.getElementById('acc-cash-closing'); if(el) el.textContent=acFmt(closingBal);
}

// ====================================================
// 2. BANK BOOK
// ====================================================
function renderBankBook() {
  const tbody=document.getElementById('acc-bank-tbody'); if(!tbody) return;
  tbody.innerHTML = ACC.bankBook.map(e=>`
    <tr>
      <td>${acDate(e.date)}</td>
      <td>${e.particulars}</td>
      <td><code style="font-size:.73rem;color:var(--accent)">${e.voucherNo}</code></td>
      <td style="font-size:.78rem;color:var(--text-muted)">${e.bank}</td>
      <td style="font-family:monospace;font-size:.75rem;color:var(--text-muted)">${e.ref}</td>
      <td class="${e.dr>0?'text-danger fw-bold':''}">${e.dr>0?acFmt(e.dr):'—'}</td>
      <td class="${e.cr>0?'text-success fw-bold':''}">${e.cr>0?acFmt(e.cr):'—'}</td>
      <td class="text-gold fw-bold">${acFmt(e.bal)}</td>
    </tr>`).join('');
}

// ====================================================
// 3. JOURNAL
// ====================================================
function renderJournal() {
  const tbody=document.getElementById('acc-journal-tbody'); if(!tbody) return;
  tbody.innerHTML = ACC.journal.map(j=>`
    <tr>
      <td><span class="badge badge-purple" style="font-size:.7rem">${j.id}</span></td>
      <td>${acDate(j.date)}</td>
      <td>
        <div style="display:flex;flex-direction:column;gap:4px">
          <div style="font-size:.82rem"><span class="fw-bold" style="color:var(--info)">Dr</span> &nbsp;${j.debitAcc}</div>
          <div style="font-size:.82rem;padding-left:16px"><span class="fw-bold" style="color:var(--success)">Cr</span> &nbsp;${j.creditAcc}</div>
        </div>
      </td>
      <td class="text-gold fw-bold">${acFmt(j.amount)}</td>
      <td style="font-size:.78rem;color:var(--text-muted);font-style:italic">${j.narration}</td>
    </tr>`).join('');
}

function saveJournalEntry() {
  const date  = document.getElementById('je-date')?.value;
  const drAcc = document.getElementById('je-dr-acc')?.value?.trim();
  const crAcc = document.getElementById('je-cr-acc')?.value?.trim();
  const amt   = parseFloat(document.getElementById('je-amount')?.value)||0;
  const narr  = document.getElementById('je-narr')?.value?.trim();
  if (!date||!drAcc||!crAcc||amt<=0) { showToast('Fill all required fields','error'); return; }
  ACC.journal.unshift({ id:'JE'+Date.now().toString().slice(-4), date, particulars:drAcc+' / '+crAcc, debitAcc:drAcc, creditAcc:crAcc, amount:amt, narration:narr||'Manual entry' });
  closeModal('newJournalModal');
  renderJournal(); renderTrialBalance();
  showToast('Journal entry saved!','success');
}

// ====================================================
// 4. LEDGER
// ====================================================
function renderLedger() {
  const sel = document.getElementById('acc-ledger-sel');
  if (sel && sel.options.length <= 1) {
    sel.innerHTML = '<option value="">-- Select Account --</option>' + ACC.accounts.map(a=>`<option value="${a.id}">${a.name} (${a.group})</option>`).join('');
  }
}
function loadLedgerAccount() {
  const id    = document.getElementById('acc-ledger-sel')?.value;
  const tbody = document.getElementById('acc-ledger-tbody');
  const sumEl = document.getElementById('acc-ledger-sum');
  if (!tbody) return;
  const acc = ACC.accounts.find(a=>a.id===id);
  if (!id||!acc) { tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Select an account to view ledger</td></tr>'; return; }
  // Generate ledger rows from vouchers + journal matching
  const rows = ACC.vouchers.filter(v=>v.from.toLowerCase().includes(acc.name.split(' ')[0].toLowerCase())||v.to.toLowerCase().includes(acc.name.split(' ')[0].toLowerCase()));
  let runBal = 0;
  const staticRows = [
    { date:'2026-08-01', desc:'Opening Balance', dr:0, cr:0, bal:0 },
    { date:'2026-08-05', desc:'Transaction 1',   dr:acc.type==='Dr'?acc.dr*0.2:0, cr:acc.type==='Cr'?acc.cr*0.2:0, bal:acc.type==='Dr'?acc.dr*0.2:acc.cr*0.2 },
    { date:'2026-08-10', desc:'Transaction 2',   dr:acc.type==='Dr'?acc.dr*0.3:0, cr:acc.type==='Cr'?acc.cr*0.3:0, bal:acc.type==='Dr'?acc.dr*0.5:acc.cr*0.5 },
    { date:'2026-08-16', desc:'Transaction 3',   dr:acc.type==='Dr'?acc.dr*0.5:0, cr:acc.type==='Cr'?acc.cr*0.5:0, bal:acc.type==='Dr'?acc.dr:acc.cr },
  ];
  tbody.innerHTML = staticRows.map((r,i)=>`
    <tr>
      <td>${acDate(r.date)}</td>
      <td>${r.desc}</td>
      <td class="${r.dr>0?'text-success fw-bold':''}">${r.dr>0?acFmt(r.dr):'—'}</td>
      <td class="${r.cr>0?'text-danger fw-bold':''}">${r.cr>0?acFmt(r.cr):'—'}</td>
      <td class="text-gold fw-bold">${acFmt(r.bal)} <span style="font-size:.72rem;color:var(--text-muted)">${acc.type}</span></td>
    </tr>`).join('');
  if (sumEl) sumEl.innerHTML = `
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:10px 16px;text-align:center">
        <div style="font-size:.7rem;color:var(--text-muted)">Total Dr</div><div class="text-success fw-bold">${acFmt(acc.dr)}</div>
      </div>
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:10px 16px;text-align:center">
        <div style="font-size:.7rem;color:var(--text-muted)">Total Cr</div><div class="text-danger fw-bold">${acFmt(acc.cr)}</div>
      </div>
      <div style="background:var(--primary-glow);border:1px solid var(--border);border-radius:8px;padding:10px 16px;text-align:center">
        <div style="font-size:.7rem;color:var(--text-muted)">Balance</div><div class="text-gold fw-bold">${acFmt(acc.bal)} (${acc.type})</div>
      </div>
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:10px 16px;text-align:center">
        <div style="font-size:.7rem;color:var(--text-muted)">Group</div><div class="fw-bold">${acc.group}</div>
      </div>
    </div>`;
}

// ====================================================
// 5. TRIAL BALANCE
// ====================================================
function renderTrialBalance() {
  const tbody=document.getElementById('acc-tb-tbody'); if(!tbody) return;
  let totDr=0, totCr=0;
  tbody.innerHTML = ACC.accounts.map(a=>{
    if(a.type==='Dr') totDr+=a.bal; else totCr+=a.bal;
    return `<tr>
      <td><span class="badge badge-grey" style="font-size:.7rem">${a.id}</span></td>
      <td class="fw-bold">${a.name}</td>
      <td><span class="badge badge-blue" style="font-size:.7rem">${a.group}</span></td>
      <td class="${a.type==='Dr'?'text-info fw-bold':''}">${a.type==='Dr'?acFmt(a.bal):'—'}</td>
      <td class="${a.type==='Cr'?'text-gold fw-bold':''}">${a.type==='Cr'?acFmt(a.bal):'—'}</td>
    </tr>`;
  }).join('');
  const el=document.getElementById('acc-tb-foot'); if(!el) return;
  const balanced = totDr===totCr;
  el.innerHTML = `<tr style="background:var(--primary-glow);font-weight:800;border-top:2px solid var(--accent)">
    <td colspan="3" style="padding:10px 14px">TOTAL</td>
    <td style="padding:10px 14px;color:var(--info)">${acFmt(totDr)}</td>
    <td style="padding:10px 14px;color:var(--accent)">${acFmt(totCr)}</td>
  </tr>
  <tr><td colspan="5" style="padding:8px 14px;font-size:.82rem">
    <span style="color:${balanced?'var(--success)':'var(--danger)'}">
      ${balanced?'✅ Trial Balance is BALANCED':'⚠️ Difference: '+acFmt(Math.abs(totDr-totCr))}
    </span>
  </td></tr>`;
}

// ====================================================
// 6. P&L
// ====================================================
function renderPL() {
  const income    = 8400000 + 45000 + 12000;
  const cogs      = 6000000;
  const grossProfit = income - cogs;
  const opex      = 482000 + 80000 + 82500 + 8500 + 3500 + 25000 + 15000 + 5000 + 31200;
  const netProfit = grossProfit - opex;
  const el=document.getElementById('acc-pl-content'); if(!el) return;
  el.innerHTML = `
    <div class="grid-2">
      <div>
        <div class="form-section-title" style="margin-top:0;color:var(--success)">📥 Income (Revenue)</div>
        <table style="width:100%"><tbody>
          <tr><td style="padding:6px 0">Gold &amp; Jewelry Sales</td><td class="text-right text-success fw-bold">${acFmt(8400000)}</td></tr>
          <tr><td style="padding:6px 0">Repair Income</td><td class="text-right text-success">${acFmt(45000)}</td></tr>
          <tr><td style="padding:6px 0">Other Income</td><td class="text-right text-success">${acFmt(12000)}</td></tr>
          <tr style="border-top:1px solid var(--border)"><td class="fw-bold" style="padding:8px 0">Total Revenue</td><td class="text-right text-gold fw-bold">${acFmt(income)}</td></tr>
          <tr><td style="padding:6px 0;color:var(--danger)">Less: Cost of Goods Sold</td><td class="text-right text-danger">(${acFmt(cogs)})</td></tr>
          <tr style="border-top:2px solid var(--accent)"><td class="fw-bold" style="padding:8px 0">Gross Profit</td><td class="text-right fw-bold" style="color:var(--success)">${acFmt(grossProfit)}</td></tr>
        </tbody></table>
        <div class="form-section-title" style="color:var(--danger)">📤 Operating Expenses</div>
        <table style="width:100%"><tbody>
          <tr><td style="padding:5px 0">Salaries &amp; Wages</td><td class="text-right text-danger">${acFmt(482000)}</td></tr>
          <tr><td style="padding:5px 0">Rent</td><td class="text-right text-danger">${acFmt(80000)}</td></tr>
          <tr><td style="padding:5px 0">Karigar Charges</td><td class="text-right text-danger">${acFmt(82500)}</td></tr>
          <tr><td style="padding:5px 0">Electricity</td><td class="text-right text-danger">${acFmt(8500)}</td></tr>
          <tr><td style="padding:5px 0">Insurance</td><td class="text-right text-danger">${acFmt(25000)}</td></tr>
          <tr><td style="padding:5px 0">Marketing</td><td class="text-right text-danger">${acFmt(15000)}</td></tr>
          <tr><td style="padding:5px 0">Maintenance</td><td class="text-right text-danger">${acFmt(3500)}</td></tr>
          <tr><td style="padding:5px 0">Depreciation</td><td class="text-right text-danger">${acFmt(5000)}</td></tr>
          <tr><td style="padding:5px 0">PF Contribution</td><td class="text-right text-danger">${acFmt(31200)}</td></tr>
          <tr style="border-top:1px solid var(--border)"><td class="fw-bold" style="padding:8px 0">Total OpEx</td><td class="text-right text-danger fw-bold">${acFmt(opex)}</td></tr>
        </tbody></table>
      </div>
      <div>
        <div style="background:linear-gradient(135deg,rgba(46,204,113,.12),rgba(46,204,113,.04));border:1px solid rgba(46,204,113,.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:16px">
          <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:6px">NET PROFIT — August 2026</div>
          <div style="font-size:2.2rem;font-weight:900;color:var(--success)">${acFmt(netProfit)}</div>
          <div style="font-size:.85rem;color:var(--text-muted);margin-top:4px">Net Margin: <strong style="color:var(--success)">${Math.round(netProfit/income*100)}%</strong></div>
          <span class="badge badge-green" style="margin-top:10px;font-size:.85rem;padding:6px 14px">✅ Profitable Month</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:.7rem;color:var(--text-muted)">Gross Margin</div>
            <div class="fw-bold text-gold">${Math.round(grossProfit/income*100)}%</div>
          </div>
          <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:.7rem;color:var(--text-muted)">Net Margin</div>
            <div class="fw-bold text-success">${Math.round(netProfit/income*100)}%</div>
          </div>
          <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:.7rem;color:var(--text-muted)">Total Income</div>
            <div class="fw-bold text-gold">${acFmt(income)}</div>
          </div>
          <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:.7rem;color:var(--text-muted)">Total Expenses</div>
            <div class="fw-bold text-danger">${acFmt(cogs+opex)}</div>
          </div>
        </div>
      </div>
    </div>`;
}

// ====================================================
// 7. BALANCE SHEET
// ====================================================
function renderBalanceSheet() {
  const el=document.getElementById('acc-bs-content'); if(!el) return;
  const assets = ACC.accounts.filter(a=>a.group==='Asset');
  const liab   = ACC.accounts.filter(a=>a.group==='Liability'||a.group==='Capital');
  const totA   = assets.reduce((s,a)=>s+a.bal,0);
  const totL   = liab.reduce((s,a)=>s+a.bal,0) + 2159000; // retained earnings
  el.innerHTML = `
    <div class="grid-2">
      <div>
        <div class="form-section-title" style="margin-top:0;color:var(--info)">📦 Assets</div>
        <table style="width:100%"><tbody>
          ${assets.map(a=>`<tr><td style="padding:6px 0">${a.name}</td><td class="text-right text-gold">${acFmt(a.bal)}</td></tr>`).join('')}
          <tr style="border-top:2px solid var(--accent)"><td class="fw-bold" style="padding:8px 0">Total Assets</td><td class="text-right text-gold fw-bold">${acFmt(totA)}</td></tr>
        </tbody></table>
      </div>
      <div>
        <div class="form-section-title" style="margin-top:0;color:var(--purple,#9b59b6)">🏛️ Liabilities &amp; Capital</div>
        <table style="width:100%"><tbody>
          ${liab.map(a=>`<tr><td style="padding:6px 0">${a.name}</td><td class="text-right">${acFmt(a.bal)}</td></tr>`).join('')}
          <tr><td style="padding:6px 0">Retained Earnings</td><td class="text-right text-success">${acFmt(2159000)}</td></tr>
          <tr style="border-top:2px solid var(--accent)"><td class="fw-bold" style="padding:8px 0">Total L &amp; C</td><td class="text-right fw-bold text-gold">${acFmt(totL)}</td></tr>
        </tbody></table>
        <div style="margin-top:12px;padding:12px;border-radius:8px;background:${totA===totL?'rgba(46,204,113,.1)':'rgba(231,76,60,.1)'};border:1px solid ${totA===totL?'rgba(46,204,113,.3)':'rgba(231,76,60,.3)'}">
          <span style="color:${totA===totL?'var(--success)':'var(--danger)'}">
            ${totA===totL?'✅ Balance Sheet is Balanced!':'⚠️ Difference: '+acFmt(Math.abs(totA-totL))}
          </span>
        </div>
      </div>
    </div>`;
}

// ====================================================
// 8. DAY BOOK
// ====================================================
function renderDayBook() {
  const tbody=document.getElementById('acc-daybook-tbody'); if(!tbody) return;
  const allToday = [
    ...ACC.cashBook.filter(e=>e.date==='2026-08-16'&&e.type!=='opening').map(e=>({date:e.date,time:e.time,ref:e.voucherNo,type:e.type.charAt(0).toUpperCase()+e.type.slice(1),desc:e.particulars,dr:e.dr,cr:e.cr})),
    ...ACC.bankBook.filter(e=>e.date==='2026-08-16').map(e=>({date:e.date,time:'—',ref:e.voucherNo,type:'Bank',desc:e.particulars,dr:e.dr,cr:e.cr})),
  ].sort((a,b)=>a.time.localeCompare(b.time));
  tbody.innerHTML = allToday.map(e=>`
    <tr>
      <td style="font-size:.75rem;color:var(--text-muted)">${e.time}</td>
      <td><code style="font-size:.73rem;color:var(--accent)">${e.ref}</code></td>
      <td>${acTypeBadge(e.type)}</td>
      <td>${e.desc}</td>
      <td class="${e.dr>0?'text-danger fw-bold':''}">${e.dr>0?acFmt(e.dr):'—'}</td>
      <td class="${e.cr>0?'text-success fw-bold':''}">${e.cr>0?acFmt(e.cr):'—'}</td>
    </tr>`).join('');
}

// ====================================================
// 9-12. VOUCHERS (Payment / Receipt / Contra / Journal)
// ====================================================
function renderVouchers(typeFilter) {
  const tbody=document.getElementById('acc-voucher-tbody'); if(!tbody) return;
  const data = typeFilter ? ACC.vouchers.filter(v=>v.type===typeFilter) : ACC.vouchers;
  tbody.innerHTML = data.map(v=>`
    <tr>
      <td><code style="font-size:.75rem;color:var(--accent)">${v.id}</code></td>
      <td>${acDate(v.date)}</td>
      <td>${acTypeBadge(v.type)}</td>
      <td>${v.from}</td>
      <td>${v.to}</td>
      <td class="text-gold fw-bold">${acFmt(v.amount)}</td>
      <td style="font-size:.78rem;color:var(--text-muted);font-style:italic">${v.narration}</td>
      <td>${v.by}</td>
      <td>${acBadge(v.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="showToast('Voucher ${v.id} printed','success')">🖨️</button>
        <button class="btn btn-outline btn-xs" onclick="showToast('Voucher ${v.id} exported','info')">📄</button>
      </td>
    </tr>`).join('');
}

function saveVoucher() {
  const type  = document.getElementById('nv-type')?.value;
  const date  = document.getElementById('nv-date')?.value;
  const from  = document.getElementById('nv-from')?.value?.trim();
  const to    = document.getElementById('nv-to')?.value?.trim();
  const amt   = parseFloat(document.getElementById('nv-amount')?.value)||0;
  const narr  = document.getElementById('nv-narr')?.value?.trim();
  if (!type||!date||!from||!to||amt<=0) { showToast('Fill all required fields','error'); return; }
  const prefix = {Payment:'PV',Receipt:'RV',Contra:'CV',Journal:'JV'}[type]||'VCH';
  const id = prefix+'-'+Date.now().toString().slice(-4);
  ACC.vouchers.unshift({ id, date, type, from, to, amount:amt, narration:narr||'', by:'Ravi Sharma', status:'Posted' });
  // also add to cashbook if cash voucher
  if (from==='Cash'||to==='Cash') {
    ACC.cashBook.unshift({ time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false}), date, particulars:narr||to, voucherNo:id, dr:type==='Payment'?amt:0, cr:type==='Receipt'?amt:0, bal:0, type:type.toLowerCase() });
  }
  closeModal('newVoucherModal');
  renderVouchers(); renderCashBook(); renderDayBook();
  showToast('Voucher '+id+' posted!','success');
}

// ====================================================
// 13. EXPENSES
// ====================================================
function renderExpenses() {
  const tbody=document.getElementById('acc-exp-tbody'); if(!tbody) return;
  const total = ACC.expenses.reduce((s,e)=>s+(e.status==='Paid'?e.amount:0),0);
  const pending = ACC.expenses.filter(e=>e.status==='Pending').reduce((s,e)=>s+e.amount,0);
  document.getElementById('acc-exp-total')   && (document.getElementById('acc-exp-total').textContent   = acFmt(total));
  document.getElementById('acc-exp-pending') && (document.getElementById('acc-exp-pending').textContent = acFmt(pending));
  tbody.innerHTML = ACC.expenses.map(e=>`
    <tr>
      <td><span class="badge badge-grey" style="font-size:.7rem">${e.id}</span></td>
      <td>${acDate(e.date)}</td>
      <td><span class="badge badge-blue" style="font-size:.72rem">${e.category}</span></td>
      <td style="font-size:.82rem">${e.description}</td>
      <td class="text-danger fw-bold">${acFmt(e.amount)}</td>
      <td><span class="badge badge-blue" style="font-size:.7rem">${e.mode}</span></td>
      <td style="font-size:.75rem;font-family:monospace">${e.billNo}</td>
      <td>${e.by}</td>
      <td>${acBadge(e.status)}</td>
      <td style="white-space:nowrap">
        ${e.status==='Pending'?`<button class="btn btn-gold btn-xs" onclick="markExpPaid('${e.id}')">💳 Pay</button>`:''}
        <button class="btn btn-outline btn-xs" onclick="showToast('Expense receipt printed','success')">🖨️</button>
      </td>
    </tr>`).join('');
}

function markExpPaid(id) {
  const e = ACC.expenses.find(x=>x.id===id);
  if (e) { e.status='Paid'; renderExpenses(); showToast(acFmt(e.amount)+' expense paid ('+e.category+')','success'); }
}

function saveExpense() {
  const cat   = document.getElementById('ne-cat')?.value;
  const desc  = document.getElementById('ne-desc')?.value?.trim();
  const amt   = parseFloat(document.getElementById('ne-amount')?.value)||0;
  const mode  = document.getElementById('ne-mode')?.value;
  const date  = document.getElementById('ne-date')?.value;
  if (!cat||!desc||amt<=0||!date) { showToast('Fill all required fields','error'); return; }
  ACC.expenses.unshift({ id:'EX'+Date.now().toString().slice(-4), date, category:cat, description:desc, amount:amt, mode, billNo:'BILL-'+Date.now().toString().slice(-4), by:'Ravi Sharma', status:'Paid' });
  closeModal('newExpenseModal');
  renderExpenses();
  showToast('Expense recorded: '+acFmt(amt),'success');
}

// ====================================================
// 14. INCOME
// ====================================================
function renderIncome() {
  const tbody=document.getElementById('acc-inc-tbody'); if(!tbody) return;
  const total = ACC.income.filter(i=>i.status==='Received').reduce((s,i)=>s+i.amount,0);
  const expected = ACC.income.filter(i=>i.status==='Expected').reduce((s,i)=>s+i.amount,0);
  document.getElementById('acc-inc-total')    && (document.getElementById('acc-inc-total').textContent    = acFmt(total));
  document.getElementById('acc-inc-expected') && (document.getElementById('acc-inc-expected').textContent = acFmt(expected));
  tbody.innerHTML = ACC.income.map(i=>`
    <tr>
      <td><span class="badge badge-grey" style="font-size:.7rem">${i.id}</span></td>
      <td>${acDate(i.date)}</td>
      <td><span class="badge badge-gold" style="font-size:.72rem">${i.category}</span></td>
      <td style="font-size:.82rem">${i.description}</td>
      <td class="text-success fw-bold">${acFmt(i.amount)}</td>
      <td><span class="badge badge-blue" style="font-size:.7rem">${i.mode}</span></td>
      <td><code style="font-size:.73rem;color:var(--accent)">${i.ref}</code></td>
      <td>${acBadge(i.status)}</td>
    </tr>`).join('');
}

// ====================================================
// 15. BANK RECONCILIATION
// ====================================================
function renderBankRecon() {
  const r = ACC.bankRecon;
  const adjBal = r.bankBalance + r.uncleared.reduce((s,u)=>s+u.amount,0);
  const balanced = adjBal === r.bookBalance;
  const el = document.getElementById('acc-recon-summary'); if(!el) return;
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:4px">Bank Statement Balance</div>
        <div class="text-gold fw-bold" style="font-size:1.1rem">${acFmt(r.bankBalance)}</div>
        <div style="font-size:.7rem;color:var(--text-muted)">As of ${acDate(r.bankDate)}</div>
      </div>
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:4px">Book Balance (ERP)</div>
        <div class="text-gold fw-bold" style="font-size:1.1rem">${acFmt(r.bookBalance)}</div>
      </div>
      <div style="background:${balanced?'rgba(46,204,113,.1)':'rgba(231,76,60,.1)'};border:1px solid ${balanced?'rgba(46,204,113,.3)':'rgba(231,76,60,.3)'};border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:4px">Reconciliation</div>
        <div class="fw-bold" style="font-size:1.1rem;color:${balanced?'var(--success)':'var(--danger)'}">${balanced?'✅ Matched!':'⚠️ Diff: '+acFmt(Math.abs(adjBal-r.bookBalance))}</div>
      </div>
    </div>`;
  const tbody = document.getElementById('acc-recon-tbody'); if(!tbody) return;
  tbody.innerHTML = r.uncleared.map(u=>`
    <tr>
      <td>${acDate(u.date)}</td>
      <td>${u.desc}</td>
      <td>${acTypeBadge(u.type==='Cheque Out'?'Payment':'Receipt')}</td>
      <td class="${u.amount<0?'text-danger':'text-success'} fw-bold">${acFmt(u.amount)}</td>
      <td>${acBadge(u.status)}</td>
      <td><button class="btn btn-gold btn-xs" onclick="clearBankItem('${u.desc}')">✅ Clear</button></td>
    </tr>`).join('');
  const stTbody = document.getElementById('acc-stmt-tbody'); if(!stTbody) return;
  stTbody.innerHTML = r.statement.map(s=>`
    <tr>
      <td>${acDate(s.date)}</td>
      <td>${s.desc}</td>
      <td class="${s.dr>0?'text-danger fw-bold':''}">${s.dr>0?acFmt(s.dr):'—'}</td>
      <td class="${s.cr>0?'text-success fw-bold':''}">${s.cr>0?acFmt(s.cr):'—'}</td>
      <td class="text-gold fw-bold">${acFmt(s.bal)}</td>
    </tr>`).join('');
}

function clearBankItem(desc) {
  const idx = ACC.bankRecon.uncleared.findIndex(u=>u.desc===desc);
  if (idx>-1) { ACC.bankRecon.uncleared.splice(idx,1); renderBankRecon(); showToast('Bank item cleared','success'); }
}

// ====================================================
// INIT
// ====================================================
function initAccountingModule() {
  renderCashBook();
  renderBankBook();
  renderJournal();
  renderLedger();
  renderTrialBalance();
  renderPL();
  renderBalanceSheet();
  renderDayBook();
  renderVouchers();
  renderExpenses();
  renderIncome();
  renderBankRecon();
}

document.addEventListener('DOMContentLoaded', () => {
  const orig = window.showModule;
  if (typeof orig === 'function') {
    window.showModule = function(m, n) {
      orig(m, n);
      if (m === 'accounting') setTimeout(initAccountingModule, 60);
    };
  }
});
