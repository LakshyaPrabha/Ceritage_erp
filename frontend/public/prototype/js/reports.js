/* ===================================================
   CERITAGE JEWELRY ERP — Reports Module
   15 Reports: Sales · Purchase · Inventory · Stock · Customer · Supplier
   Employee · Karigar · Profit · GST · Financial · Gold Rate
   Daily Business · Monthly · Yearly
   =================================================== */

const RPT = {
  // ---- SALES DATA ----
  salesDaily: [
    { date:'2026-08-16', bills:23, gross:840000, disc:12000, returns:0,  net:828000, cash:243800, upi:312000, card:192000, credit:80200 },
    { date:'2026-08-15', bills:18, gross:620000, disc:5000,  returns:0,  net:615000, cash:204000, upi:280000, card:131000, credit:0 },
    { date:'2026-08-14', bills:21, gross:980000, disc:8000,  returns:25000,net:947000,cash:180000,upi:380000, card:175000, credit:212000},
    { date:'2026-08-13', bills:15, gross:450000, disc:3000,  returns:8000,net:439000, cash:170000, upi:210000, card:59000,  credit:0 },
    { date:'2026-08-12', bills:19, gross:720000, disc:0,     returns:0,  net:720000, cash:260000, upi:320000, card:140000, credit:0 },
    { date:'2026-08-11', bills:12, gross:380000, disc:5000,  returns:15000,net:360000,cash:150000,upi:180000, card:30000,  credit:0 },
    { date:'2026-08-10', bills:26, gross:1100000,disc:0,     returns:0,  net:1100000,cash:450000, upi:420000, card:230000, credit:0 },
  ],
  salesByCategory: [
    { cat:'Gold Jewelry',   bills:148, revenue:52000000, returns:800000, net:51200000, margin:26 },
    { cat:'Diamond Jewelry',bills:64,  revenue:18000000, returns:200000, net:17800000, margin:33 },
    { cat:'Silver Items',   bills:212, revenue:8000000,  returns:120000, net:7880000,  margin:22 },
    { cat:'Gemstone',       bills:38,  revenue:4200000,  returns:60000,  net:4140000,  margin:30 },
    { cat:'Platinum',       bills:18,  revenue:3600000,  returns:0,      net:3600000,  margin:30 },
    { cat:'Repair Services',bills:98,  revenue:1800000,  returns:40000,  net:1760000,  margin:60 },
    { cat:'Gold Coins',     bills:44,  revenue:1400000,  returns:0,      net:1400000,  margin:8  },
  ],
  // ---- PURCHASE DATA ----
  purchases: [
    { id:'PO-2026-148', date:'2026-08-16', supplier:'Zaveri Bullion',      item:'Gold Bar 22K 100g',      qty:'100g',   rate:7240,  amount:724000, gst:21720,  total:745720, status:'Received',  paid:274000, balance:471720 },
    { id:'PO-2026-147', date:'2026-08-12', supplier:'Diamond Palace',      item:'Diamond 0.5ct 10pcs',   qty:'10 pcs', rate:28000, amount:280000, gst:700,    total:280700, status:'Pending',   paid:100000, balance:180700 },
    { id:'PO-2026-146', date:'2026-08-14', supplier:'Raj. Stone Works',    item:'Emerald 20 pcs',         qty:'20 pcs', rate:3750,  amount:75000,  gst:187,    total:75187,  status:'Received',  paid:75187,  balance:0 },
    { id:'PO-2026-145', date:'2026-08-08', supplier:'Zaveri Bullion',      item:'Gold Bar 22K 50g',       qty:'50g',    rate:7200,  amount:360000, gst:10800,  total:370800, status:'Received',  paid:370800, balance:0 },
    { id:'PO-2026-144', date:'2026-08-05', supplier:'KDM Gold Refinery',   item:'Gold Bar 24K 80g',       qty:'80g',    rate:7890,  amount:631200, gst:18936,  total:650136, status:'Received',  paid:650136, balance:0 },
    { id:'PO-2026-143', date:'2026-08-03', supplier:'Ratanlal & Sons',     item:'Silver 925 500g',        qty:'500g',   rate:92,    amount:46000,  gst:1380,   total:47380,  status:'Received',  paid:47380,  balance:0 },
  ],
  // ---- INVENTORY DATA ----
  inventory: [
    { cat:'Necklace',    items:48, qty:48, totalWt:'1,245g', value:90100000, lowStock:0, outOfStock:1 },
    { cat:'Ring',        items:67, qty:67, totalWt:'285g',   value:21400000, lowStock:2, outOfStock:0 },
    { cat:'Bangles',     items:53, qty:53, totalWt:'1,850g', value:134000000,lowStock:0, outOfStock:0 },
    { cat:'Earrings',    items:72, qty:72, totalWt:'610g',   value:44200000, lowStock:0, outOfStock:0 },
    { cat:'Diamond Items',items:31,qty:31, totalWt:'130g',   value:45500000, lowStock:3, outOfStock:0 },
    { cat:'Silver Items',items:71, qty:71, totalWt:'12.8kg', value:11800000, lowStock:0, outOfStock:0 },
    { cat:'Pendants',    items:19, qty:15, totalWt:'92g',    value:7800000,  lowStock:1, outOfStock:2 },
    { cat:'Coins',       items:14, qty:14, totalWt:'112g',   value:9030000,  lowStock:0, outOfStock:0 },
  ],
  // ---- KARIGAR REPORT DATA ----
  karigarReport: [
    { name:'Ramesh Soni',    skill:'Kundan Work',     jobs:3,  goldIssued:148.5,goldReceived:147.2,wastage:1.3, wastPct:0.87,labour:51975,  paid:18000,  pending:33975,rating:4.8 },
    { name:'Suresh Meena',   skill:'Diamond Setting', jobs:1,  goldIssued:4.2,  goldReceived:4.1,  wastage:0.1, wastPct:2.38,labour:5000,   paid:5000,   pending:0,    rating:4.6 },
    { name:'Harish Kumar',   skill:'Polishing',       jobs:6,  goldIssued:12.0, goldReceived:11.9, wastage:0.1, wastPct:0.83,labour:5600,   paid:2400,   pending:3200, rating:4.2 },
    { name:'Mohan Lal Verma',skill:'Casting',         jobs:1,  goldIssued:8.0,  goldReceived:0,    wastage:0,   wastPct:0,   labour:3500,   paid:1500,   pending:2000, rating:4.5 },
    { name:'Raju Filigree',  skill:'Filigree',        jobs:1,  goldIssued:0,    goldReceived:0,    wastage:0,   wastPct:0,   labour:12000,  paid:4000,   pending:8000, rating:4.9 },
    { name:'Bharat Shah',    skill:'Stone Setting',   jobs:1,  goldIssued:3.8,  goldReceived:0,    wastage:0,   wastPct:0,   labour:4500,   paid:0,      pending:4500, rating:4.3 },
  ],
  // ---- GOLD RATE DATA ----
  goldRates: [
    { date:'2026-08-16', k22:7240, k24:7890, k18:5920, silver:92, platinum:2850, dollar:83.50, change:+40 },
    { date:'2026-08-15', k22:7200, k24:7850, k18:5880, silver:91, platinum:2820, dollar:83.40, change:+80 },
    { date:'2026-08-14', k22:7120, k24:7760, k18:5820, silver:90, platinum:2800, dollar:83.30, change:-30 },
    { date:'2026-08-13', k22:7150, k24:7790, k18:5840, silver:91, platinum:2810, dollar:83.20, change:+20 },
    { date:'2026-08-12', k22:7130, k24:7770, k18:5830, silver:90, platinum:2800, dollar:83.10, change:-50 },
    { date:'2026-08-11', k22:7180, k24:7820, k18:5865, silver:92, platinum:2840, dollar:83.15, change:+10 },
    { date:'2026-08-10', k22:7170, k24:7810, k18:5860, silver:91, platinum:2835, dollar:83.00, change:-20 },
    { date:'2026-08-09', k22:7190, k24:7830, k18:5870, silver:91, platinum:2830, dollar:82.90, change:+30 },
    { date:'2026-08-08', k22:7160, k24:7800, k18:5850, silver:90, platinum:2820, dollar:82.80, change:-40 },
    { date:'2026-08-07', k22:7200, k24:7840, k18:5880, silver:92, platinum:2850, dollar:82.70, change:+60 },
  ],
  // ---- MONTHLY SUMMARY ----
  monthlySummary: [
    { month:'Jan', sales:5200000, purchase:3640000, expenses:1040000, profit:520000, customers:88,  newCust:12, bills:182 },
    { month:'Feb', sales:6100000, purchase:4270000, expenses:1100000, profit:730000, customers:95,  newCust:15, bills:210 },
    { month:'Mar', sales:5800000, purchase:4060000, expenses:1080000, profit:660000, customers:91,  newCust:10, bills:195 },
    { month:'Apr', sales:6800000, purchase:4760000, expenses:1140000, profit:900000, customers:105, newCust:18, bills:228 },
    { month:'May', sales:7200000, purchase:5040000, expenses:1180000, profit:980000, customers:112, newCust:20, bills:245 },
    { month:'Jun', sales:6500000, purchase:4550000, expenses:1120000, profit:830000, customers:102, newCust:14, bills:218 },
    { month:'Jul', sales:7800000, purchase:5460000, expenses:1200000, profit:1140000,customers:118, newCust:22, bills:262 },
    { month:'Aug', sales:8400000, purchase:6000000, expenses:1260000, profit:1140000,customers:128, newCust:28, bills:280 },
  ],
  // ---- YEARLY ----
  yearlySummary: [
    { year:'2022', sales:38000000, purchase:27360000, expenses:6840000, profit:3800000, customers:820,  growth:0    },
    { year:'2023', sales:52000000, purchase:37440000, expenses:9360000, profit:5200000, customers:980,  growth:36.8 },
    { year:'2024', sales:71000000, purchase:51120000, expenses:12780000,profit:7100000, customers:1120, growth:36.5 },
    { year:'2025', sales:82000000, purchase:59040000, expenses:14760000,profit:8200000, customers:1210, growth:15.5 },
    { year:'2026', sales:53800000, purchase:38736000, expenses:9684000, profit:5380000, customers:1247, growth:18.2 },
  ],
};

// ---- UTILS ----
function rFmt(n)   { if(!n) return '—'; if(n>=10000000) return '₹'+(n/10000000).toFixed(2)+'Cr'; if(n>=100000) return '₹'+(n/100000).toFixed(1)+'L'; return '₹'+n.toLocaleString('en-IN'); }
function rFull(n)  { return '₹'+(n||0).toLocaleString('en-IN'); }
function rDate(d)  { if(!d) return '—'; const dt=new Date(d); return isNaN(dt)?d:dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function rBar(pct,col){ const c=col||(pct>=80?'green':pct>=50?'':'red'); return `<div style="display:flex;align-items:center;gap:6px"><div class="progress" style="flex:1;height:5px"><div class="progress-bar ${c}" style="width:${Math.min(100,pct)}%"></div></div><span style="font-size:.7rem;font-weight:700">${pct}%</span></div>`; }
function rBadge(s) { const m={'Received':'badge-green','Paid':'badge-green','Pending':'badge-orange','Partial':'badge-orange','Overdue':'badge-red'}; return `<span class="badge ${m[s]||'badge-grey'} " style="font-size:.7rem">${s}</span>`; }

// ===================================================
// REPORT RENDERERS
// ===================================================

// 1. SALES REPORT
function renderSalesReport() {
  const tbody=document.getElementById('rpt-sales-tbody'); if(!tbody) return;
  const totBills   = RPT.salesDaily.reduce((s,d)=>s+d.bills,0);
  const totNet     = RPT.salesDaily.reduce((s,d)=>s+d.net,0);
  const totReturns = RPT.salesDaily.reduce((s,d)=>s+d.returns,0);
  const maxNet     = Math.max(...RPT.salesDaily.map(d=>d.net));
  tbody.innerHTML = RPT.salesDaily.map(d=>`
    <tr>
      <td class="fw-bold">${rDate(d.date)}</td>
      <td class="fw-bold">${d.bills}</td>
      <td class="text-gold fw-bold">${rFull(d.gross)}</td>
      <td class="text-danger">${d.disc?rFull(d.disc):'—'}</td>
      <td class="text-danger">${d.returns?rFull(d.returns):'—'}</td>
      <td class="text-success fw-bold">${rFull(d.net)}</td>
      <td style="font-size:.8rem">${rFull(d.cash)}</td>
      <td style="font-size:.8rem;color:var(--info)">${rFull(d.upi)}</td>
      <td style="font-size:.8rem">${rFull(d.card)}</td>
      <td style="font-size:.8rem;color:var(--warning)">${d.credit?rFull(d.credit):'—'}</td>
      <td style="min-width:100px">${rBar(Math.round(d.net/maxNet*100))}</td>
    </tr>`).join('');
  // summary
  ['rpt-s-bills','rpt-s-net','rpt-s-ret','rpt-s-avg'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=[totBills, rFull(totNet), rFull(totReturns), rFull(Math.round(totNet/RPT.salesDaily.length))][i];
  });
  // category table
  const ctbody=document.getElementById('rpt-sales-cat-tbody'); if(!ctbody) return;
  const totRev=RPT.salesByCategory.reduce((s,c)=>s+c.net,0);
  ctbody.innerHTML = RPT.salesByCategory.map(c=>`
    <tr>
      <td class="fw-bold">${c.cat}</td>
      <td>${c.bills}</td>
      <td class="text-gold fw-bold">${rFmt(c.revenue)}</td>
      <td class="text-danger">${c.returns?rFull(c.returns):'—'}</td>
      <td class="text-success fw-bold">${rFmt(c.net)}</td>
      <td class="${c.margin>=30?'text-success':c.margin>=20?'text-gold':'text-danger'} fw-bold">${c.margin}%</td>
      <td style="min-width:100px">${rBar(Math.round(c.net/totRev*100))}</td>
    </tr>`).join('');
}

// 2. PURCHASE REPORT
function renderPurchaseReport() {
  const tbody=document.getElementById('rpt-purch-tbody'); if(!tbody) return;
  const totAmt=RPT.purchases.reduce((s,p)=>s+p.amount,0);
  const totPaid=RPT.purchases.reduce((s,p)=>s+p.paid,0);
  const totBal=RPT.purchases.reduce((s,p)=>s+p.balance,0);
  tbody.innerHTML = RPT.purchases.map(p=>`
    <tr>
      <td><span class="badge badge-gold" style="font-size:.7rem">${p.id}</span></td>
      <td>${rDate(p.date)}</td>
      <td><strong>${p.supplier}</strong></td>
      <td style="font-size:.82rem">${p.item}</td>
      <td>${p.qty}</td>
      <td>${rFull(p.rate)}</td>
      <td class="text-gold fw-bold">${rFull(p.amount)}</td>
      <td class="text-danger">${rFull(p.gst)}</td>
      <td class="fw-bold">${rFull(p.total)}</td>
      <td class="text-success fw-bold">${rFull(p.paid)}</td>
      <td class="${p.balance>0?'text-danger fw-bold':''}">${p.balance?rFull(p.balance):'—'}</td>
      <td>${rBadge(p.status)}</td>
    </tr>`).join('');
  ['rpt-p-total','rpt-p-paid','rpt-p-bal','rpt-p-orders'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=[rFmt(totAmt), rFmt(totPaid), rFmt(totBal), RPT.purchases.length][i];
  });
}

// 3. INVENTORY REPORT
function renderInventoryReport() {
  const tbody=document.getElementById('rpt-inv-tbody'); if(!tbody) return;
  const totVal=RPT.inventory.reduce((s,i)=>s+i.value,0);
  tbody.innerHTML = RPT.inventory.map(c=>`
    <tr>
      <td class="fw-bold">${c.cat}</td>
      <td class="fw-bold">${c.items}</td>
      <td class="fw-bold">${c.qty}</td>
      <td>${c.totalWt}</td>
      <td class="text-gold fw-bold">${rFmt(c.value)}</td>
      <td>${rBar(Math.round(c.value/totVal*100))}</td>
      <td class="${c.lowStock>0?'text-warning fw-bold':''}">${c.lowStock||'—'}</td>
      <td class="${c.outOfStock>0?'text-danger fw-bold':''}">${c.outOfStock||'—'}</td>
      <td><span class="badge badge-${c.outOfStock?'red':c.lowStock?'orange':'green'}">${c.outOfStock?'⚠️ Out':c.lowStock?'⚠️ Low':'✅ OK'}</span></td>
    </tr>`).join('');
  ['rpt-i-items','rpt-i-val','rpt-i-low','rpt-i-out'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=[RPT.inventory.reduce((s,c)=>s+c.items,0),rFmt(totVal),RPT.inventory.reduce((s,c)=>s+c.lowStock,0),RPT.inventory.reduce((s,c)=>s+c.outOfStock,0)][i];
  });
}

// 4. STOCK REPORT (uses same inventory data, different view)
function renderStockReport() {
  const tbody=document.getElementById('rpt-stock-tbody'); if(!tbody) return;
  if(window.INV) {
    tbody.innerHTML = INV.stock.map(s=>`
      <tr>
        <td><code style="font-size:.73rem;color:var(--accent)">${s.sku}</code></td>
        <td><strong>${s.name}</strong></td>
        <td>${s.cat}</td>
        <td>${s.purity}</td>
        <td>${s.grossWt}g</td>
        <td class="fw-bold" style="color:${s.qty===0?'var(--danger)':s.qty<=s.minQty?'var(--warning)':'var(--success)'}">${s.qty}</td>
        <td class="text-gold fw-bold">${rFull(s.mrp)}</td>
        <td class="text-gold">${rFull(s.mrp*s.qty)}</td>
        <td>${s.branch}</td>
        <td><span class="badge badge-${s.status==='In Stock'?'green':s.status==='Low Stock'?'orange':'red'}">${s.status}</span></td>
      </tr>`).join('');
  } else {
    tbody.innerHTML=`<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text-muted)">Stock data will load when Inventory module is initialized</td></tr>`;
  }
}

// 5. CUSTOMER REPORT
function renderCustomerReport() {
  const tbody=document.getElementById('rpt-cust-tbody'); if(!tbody) return;
  if(window.CM) {
    tbody.innerHTML = CM.customers.map(c=>`
      <tr>
        <td><span class="badge badge-grey" style="font-size:.7rem">${c.id}</span></td>
        <td><strong>${c.name}</strong></td>
        <td>${c.phone}</td>
        <td>${c.city}</td>
        <td><span class="badge badge-${c.type==='Platinum'?'purple':c.type==='Gold'?'gold':c.type==='Silver'?'blue':'grey'}">${c.type}</span></td>
        <td class="text-gold fw-bold">${rFull(c.totalPurchase)}</td>
        <td class="${c.balance>0?'text-danger fw-bold':''}">${c.balance?rFull(c.balance):'—'}</td>
        <td class="text-gold">${c.loyaltyPts} pts</td>
        <td><span class="badge badge-${c.kyc==='Complete'?'green':c.kyc==='Pending'?'orange':'red'}">${c.kyc}</span></td>
        <td>${c.lastVisit||'—'}</td>
      </tr>`).join('');
  }
}

// 6. SUPPLIER REPORT
function renderSupplierReport() {
  const tbody=document.getElementById('rpt-sup-tbody'); if(!tbody) return;
  if(window.SUP) {
    tbody.innerHTML = SUP.suppliers.map(s=>`
      <tr>
        <td><span class="badge badge-grey" style="font-size:.7rem">${s.id}</span></td>
        <td><strong>${s.name}</strong></td>
        <td><span style="font-weight:700;color:${s.type==='Gold'?'#f0c040':s.type==='Diamond'?'#3498db':'var(--text-muted)'}">${s.type}</span></td>
        <td>${s.city}</td>
        <td class="text-gold fw-bold">${rFmt(s.totalPurchased)}</td>
        <td class="${s.outstanding>0?'text-danger fw-bold':''}">${s.outstanding?rFull(s.outstanding):'—'}</td>
        <td>${rFull(s.creditLimit)}</td>
        <td><span style="color:#f0c040">★</span> ${s.rating}</td>
        <td><span class="badge badge-${s.status==='Active'?'green':'red'}">${s.status}</span></td>
      </tr>`).join('');
  }
}

// 7. EMPLOYEE REPORT
function renderEmployeeReport() {
  const tbody=document.getElementById('rpt-emp-tbody'); if(!tbody) return;
  if(window.EMP) {
    tbody.innerHTML = EMP.employees.map(e=>{
      const a=EMP.attendance[e.id]||{P:0,A:0,L:0,total:26};
      const p=EMP.payroll[e.id]||{};
      const pr=EMP.performance[e.id]||{};
      const attPct=a.P?Math.round(a.P/(a.P+a.A+a.L)*100):0;
      return `<tr>
        <td><strong>${e.name}</strong></td>
        <td>${e.role}</td>
        <td>${e.branch}</td>
        <td class="text-gold fw-bold">${rFull(e.salary)}</td>
        <td class="text-success fw-bold">${rFull(p.net||e.salary)}</td>
        <td>${a.P}P / ${a.A}A / ${a.L}L</td>
        <td>${rBar(attPct)}</td>
        <td>${pr.rating?'<span style="color:#f0c040">★</span> '+pr.rating:'—'}</td>
        <td>${pr.salesAchieved&&e.target?rFmt(pr.salesAchieved)+' / '+rFmt(e.target):'N/A'}</td>
        <td>${rBadge(p.status||'Pending')}</td>
      </tr>`;
    }).join('');
  }
}

// 8. KARIGAR REPORT
function renderKarigarReport() {
  const tbody=document.getElementById('rpt-karigar-tbody'); if(!tbody) return;
  const totGold=RPT.karigarReport.reduce((s,k)=>s+k.goldIssued,0);
  const totLabour=RPT.karigarReport.reduce((s,k)=>s+k.labour,0);
  const totPending=RPT.karigarReport.reduce((s,k)=>s+k.pending,0);
  tbody.innerHTML = RPT.karigarReport.map(k=>`
    <tr>
      <td><strong>${k.name}</strong></td>
      <td>${k.skill}</td>
      <td class="fw-bold">${k.jobs}</td>
      <td class="text-gold">${k.goldIssued}g</td>
      <td class="text-success">${k.goldReceived}g</td>
      <td class="${k.wastage>0.5?'text-danger fw-bold':''}">${k.wastage}g</td>
      <td class="${k.wastPct>2?'text-danger':''}">${k.wastPct}%</td>
      <td class="text-gold fw-bold">${rFull(k.labour)}</td>
      <td class="text-success">${rFull(k.paid)}</td>
      <td class="${k.pending>0?'text-danger fw-bold':''}">${k.pending?rFull(k.pending):'—'}</td>
      <td><span style="color:#f0c040">★</span> ${k.rating}</td>
    </tr>`).join('');
  ['rpt-kg-gold','rpt-kg-labour','rpt-kg-pending'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=[totGold.toFixed(1)+'g', rFmt(totLabour), rFmt(totPending)][i];
  });
}

// 9. PROFIT REPORT
function renderProfitReport() {
  const tbody=document.getElementById('rpt-profit-tbody'); if(!tbody) return;
  tbody.innerHTML = RPT.monthlySummary.map((m,i)=>{
    const margin=Math.round(m.profit/m.sales*100);
    const prev=i>0?RPT.monthlySummary[i-1].profit:m.profit;
    const growth=i>0?((m.profit-prev)/prev*100).toFixed(1):'—';
    return `<tr>
      <td class="fw-bold">${m.month} 2026</td>
      <td class="text-gold fw-bold">${rFmt(m.sales)}</td>
      <td class="text-danger">${rFmt(m.purchase)}</td>
      <td class="text-danger">${rFmt(m.expenses)}</td>
      <td class="text-success fw-bold">${rFmt(m.profit)}</td>
      <td class="${margin>=20?'text-success':margin>=15?'text-gold':'text-danger'} fw-bold">${margin}%</td>
      <td>${i>0?`<span style="color:${growth>=0?'var(--success)':'var(--danger)'}">${growth>=0?'▲':'▼'} ${Math.abs(growth)}%</span>`:'—'}</td>
      <td style="min-width:100px">${rBar(anPct(m.profit,Math.max(...RPT.monthlySummary.map(x=>x.profit))))}</td>
    </tr>`;
  }).join('');
}

// 10. GST REPORT
function renderGstReport() {
  const tbody=document.getElementById('rpt-gst-tbody'); if(!tbody) return;
  // derive from sales
  const gstData = [
    { month:'Aug 2026', taxableVal:8457000, cgst:126855, sgst:126855, igst:0, totalGst:253710, itc:87400, net:166310, status:'Due' },
    { month:'Jul 2026', taxableVal:7800000, cgst:117000, sgst:117000, igst:0, totalGst:234000, itc:80000, net:154000, status:'Filed' },
    { month:'Jun 2026', taxableVal:6500000, cgst:97500,  sgst:97500,  igst:0, totalGst:195000, itc:67000, net:128000, status:'Filed' },
    { month:'May 2026', taxableVal:7200000, cgst:108000, sgst:108000, igst:0, totalGst:216000, itc:75000, net:141000, status:'Filed' },
  ];
  tbody.innerHTML = gstData.map(g=>`
    <tr>
      <td class="fw-bold">${g.month}</td>
      <td class="text-gold">${rFull(g.taxableVal)}</td>
      <td>${rFull(g.cgst)}</td>
      <td>${rFull(g.sgst)}</td>
      <td>${g.igst?rFull(g.igst):'—'}</td>
      <td class="text-gold fw-bold">${rFull(g.totalGst)}</td>
      <td class="text-success">${rFull(g.itc)}</td>
      <td class="${g.net>0?'text-danger fw-bold':''}">${rFull(g.net)}</td>
      <td>${rBadge(g.status)}</td>
      <td style="white-space:nowrap">
        ${g.status==='Due'?`<button class="btn btn-gold btn-xs" onclick="showModule('gst',null)">📤 File Now</button>`:''}
        <button class="btn btn-outline btn-xs" onclick="exportPDF('gst_'+g.month)">📄</button>
      </td>
    </tr>`).join('');
  // HSN summary
  const hsnEl=document.getElementById('rpt-gst-hsn'); if(!hsnEl) return;
  hsnEl.innerHTML = [
    {hsn:'7113', desc:'Gold/Silver Jewelry',   rate:'3%', taxable:rFmt(84570000), gst:rFmt(2537100)},
    {hsn:'7102', desc:'Diamonds (unset)',       rate:'0.25%',taxable:rFmt(18000000),gst:rFmt(45000)},
    {hsn:'7103', desc:'Gemstones (unset)',      rate:'0.25%',taxable:rFmt(4200000), gst:rFmt(10500)},
    {hsn:'9988', desc:'Making/Repair Services', rate:'18%', taxable:rFmt(1800000),  gst:rFmt(324000)},
  ].map(h=>`
    <tr>
      <td class="fw-bold">${h.hsn}</td>
      <td>${h.desc}</td>
      <td><span class="badge badge-gold">${h.rate}</span></td>
      <td class="text-gold">${h.taxable}</td>
      <td class="text-gold fw-bold">${h.gst}</td>
    </tr>`).join('');
}

// 11. FINANCIAL REPORT (P&L + BS summary)
function renderFinancialReport() {
  const el=document.getElementById('rpt-fin-content'); if(!el) return;
  const totSales=RPT.monthlySummary.reduce((s,m)=>s+m.sales,0);
  const totProfit=RPT.monthlySummary.reduce((s,m)=>s+m.profit,0);
  const totExpenses=RPT.monthlySummary.reduce((s,m)=>s+m.expenses,0);
  el.innerHTML = `
    <div class="grid-2">
      <div>
        <div class="form-section-title" style="margin-top:0">📊 P&amp;L Summary — Aug 2026 YTD</div>
        <table style="width:100%"><tbody>
          <tr><td style="padding:6px 0">Total Revenue</td><td class="text-right text-gold fw-bold">${rFmt(totSales)}</td></tr>
          <tr><td style="padding:6px 0">Total COGS</td><td class="text-right text-danger">${rFmt(RPT.monthlySummary.reduce((s,m)=>s+m.purchase,0))}</td></tr>
          <tr><td style="padding:6px 0">Gross Profit</td><td class="text-right text-success">${rFmt(totSales-RPT.monthlySummary.reduce((s,m)=>s+m.purchase,0))}</td></tr>
          <tr><td style="padding:6px 0">Total OpEx</td><td class="text-right text-danger">${rFmt(totExpenses)}</td></tr>
          <tr style="border-top:2px solid var(--accent)"><td class="fw-bold" style="padding:8px 0">Net Profit</td><td class="text-right text-success fw-bold">${rFmt(totProfit)}</td></tr>
          <tr><td style="padding:5px 0;color:var(--text-muted)">Net Margin</td><td class="text-right fw-bold">${Math.round(totProfit/totSales*100)}%</td></tr>
        </tbody></table>
        <div class="form-section-title">⚖️ Balance Sheet Summary</div>
        <table style="width:100%"><tbody>
          <tr><td style="padding:6px 0">Total Assets</td><td class="text-right text-gold fw-bold">₹3,44,50,000</td></tr>
          <tr><td style="padding:6px 0">Total Liabilities</td><td class="text-right text-danger">₹10,55,000</td></tr>
          <tr><td style="padding:6px 0">Capital</td><td class="text-right text-gold">₹2,80,00,000</td></tr>
          <tr><td style="padding:6px 0">Retained Earnings</td><td class="text-right text-success">${rFmt(totProfit)}</td></tr>
        </tbody></table>
      </div>
      <div>
        <div class="form-section-title" style="margin-top:0">💰 Cash Flow Summary</div>
        <table style="width:100%"><tbody>
          <tr><td style="padding:6px 0">Cash from Operations</td><td class="text-right text-success fw-bold">${rFmt(totProfit+1260000)}</td></tr>
          <tr><td style="padding:6px 0">Cash from Investing</td><td class="text-right text-danger">—</td></tr>
          <tr><td style="padding:6px 0">Cash from Financing</td><td class="text-right text-danger">—</td></tr>
          <tr style="border-top:1px solid var(--border)"><td class="fw-bold" style="padding:8px 0">Net Cash Flow</td><td class="text-right text-gold fw-bold">${rFmt(totProfit+1260000)}</td></tr>
        </tbody></table>
        <div class="form-section-title">📊 Key Ratios</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="background:var(--bg-card2);border-radius:8px;padding:10px;text-align:center"><div class="text-gold fw-bold">4.2x</div><div style="font-size:.7rem;color:var(--text-muted)">Inventory Turnover</div></div>
          <div style="background:var(--bg-card2);border-radius:8px;padding:10px;text-align:center"><div class="text-success fw-bold">${Math.round(totProfit/totSales*100)}%</div><div style="font-size:.7rem;color:var(--text-muted)">Net Profit Margin</div></div>
          <div style="background:var(--bg-card2);border-radius:8px;padding:10px;text-align:center"><div class="text-gold fw-bold">32.5x</div><div style="font-size:.7rem;color:var(--text-muted)">P/E Ratio</div></div>
          <div style="background:var(--bg-card2);border-radius:8px;padding:10px;text-align:center"><div class="text-info fw-bold">2.8x</div><div style="font-size:.7rem;color:var(--text-muted)">Current Ratio</div></div>
        </div>
      </div>
    </div>`;
}

// 12. GOLD RATE REPORT
function renderGoldRateReport() {
  const tbody=document.getElementById('rpt-gold-tbody'); if(!tbody) return;
  const max22=Math.max(...RPT.goldRates.map(r=>r.k22));
  const min22=Math.min(...RPT.goldRates.map(r=>r.k22));
  tbody.innerHTML = RPT.goldRates.map(r=>`
    <tr>
      <td class="fw-bold">${rDate(r.date)}</td>
      <td class="text-gold fw-bold">${rFull(r.k22)}/g</td>
      <td>${rFull(r.k24)}/g</td>
      <td style="color:var(--info)">${rFull(r.k18)}/g</td>
      <td style="color:var(--text-muted)">${rFull(r.silver)}/g</td>
      <td>${rFull(r.platinum)}/g</td>
      <td>₹${r.dollar}</td>
      <td class="${r.change>=0?'text-success':'text-danger'} fw-bold">${r.change>=0?'▲':'▼'} ₹${Math.abs(r.change)}</td>
      ${r.k22===max22?'<td><span class="badge badge-green">High</span></td>':r.k22===min22?'<td><span class="badge badge-red">Low</span></td>':'<td>—</td>'}
    </tr>`).join('');
  // stats
  const avg22=Math.round(RPT.goldRates.reduce((s,r)=>s+r.k22,0)/RPT.goldRates.length);
  ['rpt-gr-cur','rpt-gr-high','rpt-gr-low','rpt-gr-avg'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=['₹'+RPT.goldRates[0].k22+'/g', '₹'+max22+'/g', '₹'+min22+'/g', '₹'+avg22+'/g'][i];
  });
}

// 13. DAILY BUSINESS REPORT
function renderDailyReport() {
  const el=document.getElementById('rpt-daily-content'); if(!el) return;
  const d=RPT.salesDaily[0]; // today
  el.innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(184,134,11,.12),rgba(184,134,11,.04));border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px">
      <div style="font-size:1.1rem;font-weight:800;margin-bottom:4px">📅 Daily Business Report — 16 August 2026</div>
      <div style="font-size:.8rem;color:var(--text-muted)">Ceritage Jewelry · Mumbai HQ · Generated: ${new Date().toLocaleString('en-IN')}</div>
    </div>
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card"><div class="stat-icon gold">💰</div><div class="stat-value">${rFmt(d.net)}</div><div class="stat-label">Net Sales</div></div>
      <div class="stat-card green"><div class="stat-icon green">🧾</div><div class="stat-value">${d.bills}</div><div class="stat-label">Bills Raised</div></div>
      <div class="stat-card blue"><div class="stat-icon blue">💵</div><div class="stat-value">${rFmt(d.cash)}</div><div class="stat-label">Cash Collection</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(52,152,219,.15);color:#3498db">📱</div><div class="stat-value">${rFmt(d.upi)}</div><div class="stat-label">UPI Collection</div></div>
    </div>
    <div class="grid-2" style="margin-top:16px">
      <div class="card">
        <div class="card-title" style="margin-bottom:12px">📊 Collection Breakdown</div>
        <table style="width:100%;font-size:.83rem"><tbody>
          <tr><td style="padding:6px 0">Cash Sales</td><td class="text-right fw-bold">${rFull(d.cash)}</td></tr>
          <tr><td style="padding:6px 0">UPI (GPay/PhonePe)</td><td class="text-right fw-bold">${rFull(d.upi)}</td></tr>
          <tr><td style="padding:6px 0">Card Payments</td><td class="text-right fw-bold">${rFull(d.card)}</td></tr>
          <tr><td style="padding:6px 0">Credit / Pending</td><td class="text-right text-danger fw-bold">${rFull(d.credit)}</td></tr>
          <tr><td style="padding:6px 0;color:var(--danger)">Returns</td><td class="text-right text-danger">${rFull(d.returns)}</td></tr>
          <tr style="border-top:2px solid var(--accent)"><td class="fw-bold" style="padding:8px 0">Net Collection</td><td class="text-right text-gold fw-bold">${rFull(d.net)}</td></tr>
        </tbody></table>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:12px">📋 Operations Summary</div>
        <table style="width:100%;font-size:.83rem"><tbody>
          <tr><td style="padding:6px 0">Opening Cash Balance</td><td class="text-right text-gold">₹2,43,800</td></tr>
          <tr><td style="padding:6px 0">Cash Received Today</td><td class="text-right text-success">+ ${rFull(d.cash)}</td></tr>
          <tr><td style="padding:6px 0">Cash Payments Made</td><td class="text-right text-danger">- ₹3,09,000</td></tr>
          <tr style="border-top:1px solid var(--border)"><td class="fw-bold" style="padding:6px 0">Closing Cash Balance</td><td class="text-right text-gold fw-bold">₹2,43,800</td></tr>
          <tr><td style="padding:6px 0;color:var(--text-muted)">Repairs Received Today</td><td class="text-right">2</td></tr>
          <tr><td style="padding:6px 0;color:var(--text-muted)">Repairs Delivered Today</td><td class="text-right">1</td></tr>
          <tr><td style="padding:6px 0;color:var(--text-muted)">New Customers Today</td><td class="text-right text-info">3</td></tr>
        </tbody></table>
      </div>
    </div>`;
}

// 14. MONTHLY REPORT
function renderMonthlyReport() {
  const tbody=document.getElementById('rpt-monthly-tbody'); if(!tbody) return;
  const totSales=RPT.monthlySummary.reduce((s,m)=>s+m.sales,0);
  tbody.innerHTML = RPT.monthlySummary.map((m,i)=>`
    <tr>
      <td class="fw-bold">${m.month} 2026</td>
      <td class="text-gold fw-bold">${rFmt(m.sales)}</td>
      <td class="text-danger">${rFmt(m.purchase)}</td>
      <td class="text-danger">${rFmt(m.expenses)}</td>
      <td class="text-success fw-bold">${rFmt(m.profit)}</td>
      <td>${Math.round(m.profit/m.sales*100)}%</td>
      <td>${m.bills}</td>
      <td>${m.customers}</td>
      <td class="${m.newCust>15?'text-success':'text-gold'} fw-bold">+${m.newCust}</td>
      <td>${rBar(Math.round(m.sales/Math.max(...RPT.monthlySummary.map(x=>x.sales))*100))}</td>
    </tr>`).join('');
}

// 15. YEARLY REPORT
function renderYearlyReport() {
  const tbody=document.getElementById('rpt-yearly-tbody'); if(!tbody) return;
  const maxSales=Math.max(...RPT.yearlySummary.map(y=>y.sales));
  tbody.innerHTML = RPT.yearlySummary.map((y,i)=>`
    <tr>
      <td class="fw-bold">${y.year}</td>
      <td class="text-gold fw-bold">${rFmt(y.sales)}</td>
      <td class="text-danger">${rFmt(y.purchase)}</td>
      <td class="text-danger">${rFmt(y.expenses)}</td>
      <td class="text-success fw-bold">${rFmt(y.profit)}</td>
      <td>${Math.round(y.profit/y.sales*100)}%</td>
      <td>${y.customers.toLocaleString()}</td>
      <td class="${y.growth>=20?'text-success':'text-gold'} fw-bold">${i>0?'▲ '+y.growth+'%':'Base Year'}</td>
      <td>${rBar(Math.round(y.sales/maxSales*100))}</td>
    </tr>`).join('');
}

// Helper for profit reports (uses analytics function if available)
function anPct(a,b){ return b>0?Math.round(a/b*100):0; }

// ===================================================
// MASTER INIT
// ===================================================
function initReportsModule() {
  renderSalesReport();
  renderPurchaseReport();
  renderInventoryReport();
  renderStockReport();
  renderCustomerReport();
  renderSupplierReport();
  renderEmployeeReport();
  renderKarigarReport();
  renderProfitReport();
  renderGstReport();
  renderFinancialReport();
  renderGoldRateReport();
  renderDailyReport();
  renderMonthlyReport();
  renderYearlyReport();
}

document.addEventListener('DOMContentLoaded', () => {
  const orig = window.showModule;
  if (typeof orig === 'function') {
    window.showModule = function(m, n) {
      orig(m, n);
      if (m === 'reports') setTimeout(initReportsModule, 80);
    };
  }
});
