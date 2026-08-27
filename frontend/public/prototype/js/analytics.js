/* ===================================================
   CERITAGE JEWELRY ERP — Analytics Dashboard
   9 Features: Daily · Monthly · Yearly Sales · Best/Low Stock Products
                Customer Analytics · Profit Analysis · Branch · Employee Performance
   =================================================== */

// ---- DATA ----
const AN = {
  daily: [
    { date:'2026-08-16', bills:23, revenue:840000, returns:12000, net:828000, cash:324000, upi:312000, card:192000, credit:0 },
    { date:'2026-08-15', bills:18, revenue:620000, returns:0,     net:620000, cash:220000, upi:280000, card:120000, credit:0 },
    { date:'2026-08-14', bills:21, revenue:980000, returns:25000, net:955000, cash:400000, upi:380000, card:175000, credit:25000 },
    { date:'2026-08-13', bills:15, revenue:450000, returns:8000,  net:442000, cash:180000, upi:210000, card:52000,  credit:0 },
    { date:'2026-08-12', bills:19, revenue:720000, returns:0,     net:720000, cash:260000, upi:320000, card:140000, credit:0 },
    { date:'2026-08-11', bills:12, revenue:380000, returns:15000, net:365000, cash:150000, upi:180000, card:35000,  credit:15000 },
    { date:'2026-08-10', bills:26, revenue:1100000,returns:0,     net:1100000,cash:450000, upi:420000, card:230000, credit:0 },
  ],
  monthly: [
    { month:'Jan', revenue:5200000, cost:3800000, profit:1400000, bills:182 },
    { month:'Feb', revenue:6100000, cost:4400000, profit:1700000, bills:210 },
    { month:'Mar', revenue:5800000, cost:4200000, profit:1600000, bills:195 },
    { month:'Apr', revenue:6800000, cost:4900000, profit:1900000, bills:228 },
    { month:'May', revenue:7200000, cost:5200000, profit:2000000, bills:245 },
    { month:'Jun', revenue:6500000, cost:4700000, profit:1800000, bills:218 },
    { month:'Jul', revenue:7800000, cost:5600000, profit:2200000, bills:262 },
    { month:'Aug', revenue:8400000, cost:6000000, profit:2400000, bills:280 },
  ],
  yearly: [
    { year:'2022', revenue:42000000, cost:31000000, profit:11000000 },
    { year:'2023', revenue:56000000, cost:41000000, profit:15000000 },
    { year:'2024', revenue:71000000, cost:51000000, profit:20000000 },
    { year:'2025', revenue:82000000, cost:59000000, profit:23000000 },
    { year:'2026', revenue:53800000, cost:38800000, profit:15000000 },
  ],
  topProducts: [
    { name:'Kundan Necklace Set',    sku:'NK-KND-001', cat:'Necklace',  emoji:'📿', unitsSold:14, revenue:2884000, margin:12.5 },
    { name:'Diamond Solitaire Ring', sku:'RG-DIA-001', cat:'Ring',      emoji:'💍', unitsSold:22, revenue:1276000, margin:21.8 },
    { name:'Gold Bangles Pair',      sku:'BG-GLD-002', cat:'Bangles',   emoji:'✨', unitsSold:31, revenue:1590000, margin:11.2 },
    { name:'Jhumka Earrings',        sku:'ER-JHK-001', cat:'Earrings',  emoji:'👂', unitsSold:48, revenue:1210000, margin:14.6 },
    { name:'Gold Box Chain',         sku:'CH-GLD-001', cat:'Chain',     emoji:'⛓️', unitsSold:19, revenue:862000,  margin:10.8 },
    { name:'Gold Mangalsutra',       sku:'MS-GLD-001', cat:'Mangalsutra',emoji:'🔴',unitsSold:12, revenue:768000,  margin:13.4 },
    { name:'Gold Coin 8g Lakshmi',   sku:'CN-GLD-001', cat:'Coin',      emoji:'🪙', unitsSold:38, revenue:645000,  margin:9.8  },
    { name:'Temple Pendant',         sku:'PD-TMP-003', cat:'Pendant',   emoji:'🙏', unitsSold:16, revenue:522000,  margin:15.2 },
  ],
  lowStock: [
    { name:'Temple Pendant',         sku:'PD-TMP-003', cat:'Pendant',   qty:2, minQty:3, reorder:5,  lastSold:'2026-08-14', daysCover:8  },
    { name:'Platinum Band Ring',     sku:'RG-PLT-001', cat:'Ring',      qty:1, minQty:2, reorder:3,  lastSold:'2026-08-12', daysCover:5  },
    { name:'Emerald Pendant 18K',    sku:'PD-EMR-001', cat:'Pendant',   qty:2, minQty:2, reorder:3,  lastSold:'2026-08-11', daysCover:12 },
    { name:'Diamond Tennis Bracelet',sku:'BT-DIA-001', cat:'Bracelet',  qty:2, minQty:2, reorder:4,  lastSold:'2026-08-10', daysCover:7  },
    { name:'Kundan Choker Set',      sku:'NK-KND-002', cat:'Necklace',  qty:0, minQty:2, reorder:3,  lastSold:'2026-08-09', daysCover:0  },
    { name:'Diamond Stud Earrings',  sku:'ER-STD-001', cat:'Earrings',  qty:0, minQty:2, reorder:4,  lastSold:'2026-08-07', daysCover:0  },
  ],
  customers: {
    tiers: { Platinum:48, Gold:312, Silver:487, Regular:400 },
    newThisMonth: 28,
    repeatRate: 68,
    avgSpend: 42800,
    topCustomers: [
      { name:'Sanjay Gupta',    spent:1800000, visits:8, tier:'Platinum' },
      { name:'Vikram Malhotra', spent:1250000, visits:5, tier:'Platinum' },
      { name:'Sunita Verma',    spent:890000,  visits:12,tier:'Platinum' },
      { name:'Priya Sharma',    spent:285000,  visits:18,tier:'Gold'     },
      { name:'Amit Kumar',      spent:320000,  visits:9, tier:'Gold'     },
    ],
    cityWise: [
      { city:'Mumbai',    customers:524, revenue:38400000 },
      { city:'Delhi',     customers:312, revenue:22800000 },
      { city:'Jaipur',    customers:188, revenue:11200000 },
      { city:'Ahmedabad', customers:142, revenue:8600000  },
      { city:'Surat',     customers:81,  revenue:6200000  },
    ],
  },
  profit: {
    monthly: [
      { month:'Jan', revenue:5200000, cogs:3640000, opex:520000, gross:1560000, net:1040000 },
      { month:'Feb', revenue:6100000, cogs:4270000, opex:550000, gross:1830000, net:1280000 },
      { month:'Mar', revenue:5800000, cogs:4060000, opex:540000, gross:1740000, net:1200000 },
      { month:'Apr', revenue:6800000, cogs:4760000, opex:570000, gross:2040000, net:1470000 },
      { month:'May', revenue:7200000, cogs:5040000, opex:590000, gross:2160000, net:1570000 },
      { month:'Jun', revenue:6500000, cogs:4550000, opex:560000, gross:1950000, net:1390000 },
      { month:'Jul', revenue:7800000, cogs:5460000, opex:600000, gross:2340000, net:1740000 },
      { month:'Aug', revenue:8400000, cogs:5880000, opex:630000, gross:2520000, net:1890000 },
    ],
    byCategory: [
      { cat:'Gold Jewelry',   revenue:52000000, cogs:38480000, margin:26 },
      { cat:'Diamond Jewelry',revenue:18000000, cogs:12060000, margin:33 },
      { cat:'Silver Items',   revenue:8000000,  cogs:6240000,  margin:22 },
      { cat:'Gemstone',       revenue:4200000,  cogs:2940000,  margin:30 },
      { cat:'Platinum',       revenue:3600000,  cogs:2520000,  margin:30 },
      { cat:'Repair Services',revenue:1800000,  cogs:720000,   margin:60 },
    ],
  },
  branches: [
    { name:'Mumbai HQ', sales:8400000, target:10000000, items:248, bills:280, customers:524, staff:4, profit:2100000, growth:12 },
    { name:'Delhi',     sales:5200000, target:7000000,  items:152, bills:175, customers:312, staff:3, profit:1300000, growth:8  },
    { name:'Jaipur',    sales:3800000, target:5000000,  items:99,  bills:128, customers:188, staff:3, profit:950000,  growth:15 },
  ],
  employees: [
    { name:'Ravi Sharma',   role:'Store Manager',   branch:'Mumbai HQ',sales:3200000, target:3500000, bills:98,  rating:4.6, customers:142, avgTicket:32653 },
    { name:'Karan Mehta',   role:'Sales Executive', branch:'Mumbai HQ',sales:3180000, target:3500000, bills:104, rating:4.5, customers:156, avgTicket:30577 },
    { name:'Anita Sharma',  role:'Sales Executive', branch:'Delhi',    sales:1850000, target:2500000, bills:62,  rating:3.8, customers:88,  avgTicket:29839 },
    { name:'Sunita Pillai', role:'Store Manager',   branch:'Jaipur',   sales:1920000, target:2000000, bills:68,  rating:4.7, customers:74,  avgTicket:28235 },
    { name:'Deepika Singh', role:'Cashier',         branch:'Mumbai HQ',sales:0,       target:0,       bills:280, rating:4.0, customers:280, avgTicket:0     },
  ],
};

// ---- Utils ----
function anFmt(n)    { if(n>=10000000) return '₹'+(n/10000000).toFixed(2)+'Cr'; if(n>=100000) return '₹'+(n/100000).toFixed(1)+'L'; if(n>=1000) return '₹'+(n/1000).toFixed(0)+'K'; return '₹'+n; }
function anFull(n)   { return '₹'+(n||0).toLocaleString('en-IN'); }
function anPct(a,b)  { return b>0 ? Math.round(a/b*100) : 0; }
function anBar(pct, col) { const c=pct>=90?'green':pct>=70?'':'red'; return `<div style="display:flex;align-items:center;gap:6px"><div class="progress" style="flex:1;height:6px"><div class="progress-bar ${col||c}" style="width:${pct}%"></div></div><span style="font-size:.72rem;font-weight:700">${pct}%</span></div>`; }

// ---- Canvas charts ----
function anDrawBars(canvasId, labels, values, color) {
  const c = document.getElementById(canvasId); if(!c) return;
  const ctx = c.getContext('2d'); const W=c.width, H=c.height, pad=32;
  const max = Math.max(...values)||1;
  ctx.clearRect(0,0,W,H);
  const bw = (W-pad*2)/values.length - 6;
  // grid
  ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
  for(let i=0;i<=4;i++) { const y=pad+(H-pad*2)*i/4; ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(W-pad,y);ctx.stroke(); }
  values.forEach((v,i) => {
    const x = pad + i*((W-pad*2)/values.length) + 3;
    const bh = (H-pad*2)*v/max;
    const y  = H-pad-bh;
    const g  = ctx.createLinearGradient(0,y,0,H-pad);
    g.addColorStop(0,color||'#b8860b'); g.addColorStop(1,(color||'#b8860b')+'44');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.roundRect(x,y,bw,bh,[3,3,0,0]); ctx.fill();
    ctx.fillStyle='#6b5e4e'; ctx.font='9px Segoe UI'; ctx.textAlign='center';
    ctx.fillText(labels[i], x+bw/2, H-8);
    if(v>0){ ctx.fillStyle=color||'#f0c040'; ctx.font='bold 9px Segoe UI'; ctx.fillText(anFmt(v),x+bw/2,y-4); }
  });
}
function anDrawLine(canvasId, labels, datasets) {
  const c = document.getElementById(canvasId); if(!c) return;
  const ctx=c.getContext('2d'); const W=c.width,H=c.height,pad=36;
  let max=0; datasets.forEach(d=>d.values.forEach(v=>{ if(v>max)max=v; })); if(!max)max=1;
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
  for(let i=0;i<=4;i++){ const y=pad+(H-pad*2)*i/4; ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(W-pad,y);ctx.stroke(); }
  datasets.forEach(ds=>{
    const pts=ds.values.map((v,i)=>({ x:pad+i*(W-pad*2)/(ds.values.length-1), y:H-pad-(H-pad*2)*v/max }));
    ctx.beginPath(); pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.lineTo(pts[pts.length-1].x,H-pad); ctx.lineTo(pts[0].x,H-pad); ctx.closePath();
    ctx.fillStyle=ds.color+'22'; ctx.fill();
    ctx.beginPath(); pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.strokeStyle=ds.color; ctx.lineWidth=2; ctx.stroke();
    pts.forEach(p=>{ ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fillStyle=ds.color;ctx.fill(); });
    ctx.fillStyle='#6b5e4e'; ctx.font='9px Segoe UI'; ctx.textAlign='center';
    labels.forEach((l,i)=>ctx.fillText(l,pad+i*(W-pad*2)/(labels.length-1),H-8));
  });
}
function anDrawDonut(canvasId, data) {
  const c=document.getElementById(canvasId); if(!c) return;
  const ctx=c.getContext('2d'); const cx=c.width/2,cy=c.height/2,r=Math.min(cx,cy)-8,ir=r*0.55;
  const total=data.reduce((s,d)=>s+d.v,0); let angle=-Math.PI/2;
  ctx.clearRect(0,0,c.width,c.height);
  data.forEach(d=>{ const sl=d.v/total*Math.PI*2; ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,angle,angle+sl);ctx.closePath();ctx.fillStyle=d.c;ctx.fill();angle+=sl; });
  ctx.beginPath();ctx.arc(cx,cy,ir,0,Math.PI*2);ctx.fillStyle='var(--bg-card)';ctx.fill();
  ctx.fillStyle='var(--accent)';ctx.font='bold 11px Segoe UI';ctx.textAlign='center';
  ctx.fillText(anFmt(total),cx,cy+4);
}

// ====================================================
// 1. DAILY SALES
// ====================================================
function renderDailySales() {
  const tbody=document.getElementById('an-daily-tbody'); if(!tbody) return;
  const tot = AN.daily.reduce((s,d)=>s+d.net,0);
  tbody.innerHTML = AN.daily.map(d=>{
    const pct = anPct(d.net, Math.max(...AN.daily.map(x=>x.net)));
    return `<tr>
      <td style="font-weight:700">${new Date(d.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
      <td class="fw-bold">${d.bills}</td>
      <td class="text-gold fw-bold">${anFull(d.revenue)}</td>
      <td class="text-danger">${d.returns>0?anFull(d.returns):'—'}</td>
      <td class="text-success fw-bold">${anFull(d.net)}</td>
      <td style="font-size:.78rem;color:var(--text-muted)">${anFull(d.cash)}</td>
      <td style="font-size:.78rem;color:var(--info)">${anFull(d.upi)}</td>
      <td style="font-size:.78rem">${anFull(d.card)}</td>
      <td style="min-width:100px">${anBar(pct)}</td>
    </tr>`;
  }).join('');
  setTimeout(()=>anDrawBars('an-daily-chart', AN.daily.map(d=>d.date.slice(8)+'Aug'), AN.daily.map(d=>d.net)), 50);
  ['an-day-tot','an-day-avg','an-day-ret','an-day-bills'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent = [anFull(tot), anFull(Math.round(tot/AN.daily.length)), anFull(AN.daily.reduce((s,d)=>s+d.returns,0)), AN.daily.reduce((s,d)=>s+d.bills,0)][i];
  });
}

// ====================================================
// 2. MONTHLY SALES
// ====================================================
function renderMonthlySales() {
  const tbody=document.getElementById('an-monthly-tbody'); if(!tbody) return;
  tbody.innerHTML = AN.monthly.map((m,i)=>{
    const prev = i>0 ? AN.monthly[i-1].revenue : m.revenue;
    const growth = i>0 ? ((m.revenue-prev)/prev*100).toFixed(1) : '—';
    const margin = Math.round(m.profit/m.revenue*100);
    return `<tr>
      <td class="fw-bold">${m.month} 2026</td>
      <td class="text-gold fw-bold">${anFull(m.revenue)}</td>
      <td class="text-danger">${anFull(m.cost)}</td>
      <td class="text-success fw-bold">${anFull(m.profit)}</td>
      <td>${margin}%</td>
      <td>${m.bills}</td>
      <td>${i>0?`<span style="color:${growth>=0?'var(--success)':'var(--danger)'}">${growth>=0?'▲':'▼'} ${Math.abs(growth)}%</span>`:'—'}</td>
      <td style="min-width:100px">${anBar(anPct(m.revenue,Math.max(...AN.monthly.map(x=>x.revenue))))}</td>
    </tr>`;
  }).join('');
  setTimeout(()=>{
    anDrawBars('an-monthly-rev-chart', AN.monthly.map(m=>m.month), AN.monthly.map(m=>m.revenue));
    anDrawLine('an-monthly-profit-chart', AN.monthly.map(m=>m.month), [
      { values:AN.monthly.map(m=>m.revenue), color:'#b8860b' },
      { values:AN.monthly.map(m=>m.profit),  color:'#2ecc71' },
    ]);
  }, 50);
}

// ====================================================
// 3. YEARLY SALES
// ====================================================
function renderYearlySales() {
  const tbody=document.getElementById('an-yearly-tbody'); if(!tbody) return;
  tbody.innerHTML = AN.yearly.map((y,i)=>{
    const prev = i>0 ? AN.yearly[i-1].revenue : y.revenue;
    const growth = i>0 ? ((y.revenue-prev)/prev*100).toFixed(1) : '—';
    return `<tr>
      <td class="fw-bold">${y.year}</td>
      <td class="text-gold fw-bold">${anFull(y.revenue)}</td>
      <td class="text-danger">${anFull(y.cost)}</td>
      <td class="text-success fw-bold">${anFull(y.profit)}</td>
      <td>${Math.round(y.profit/y.revenue*100)}%</td>
      <td>${i>0?`<span style="color:${growth>=0?'var(--success)':'var(--danger)'}">${growth>=0?'▲':'▼'} ${Math.abs(growth)}%</span>`:'—'}</td>
      <td style="min-width:120px">${anBar(anPct(y.revenue,Math.max(...AN.yearly.map(x=>x.revenue))))}</td>
    </tr>`;
  }).join('');
  setTimeout(()=>anDrawBars('an-yearly-chart', AN.yearly.map(y=>y.year), AN.yearly.map(y=>y.revenue),'#b8860b'),50);
}

// ====================================================
// 4. BEST SELLING PRODUCTS
// ====================================================
function renderBestProducts() {
  const tbody=document.getElementById('an-best-tbody'); if(!tbody) return;
  const sorted=[...AN.topProducts].sort((a,b)=>b.revenue-a.revenue);
  const maxRev=sorted[0]?.revenue||1;
  tbody.innerHTML = sorted.map((p,i)=>`
    <tr>
      <td><span style="font-size:1.1rem">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'  '}</span></td>
      <td style="font-size:1.2rem">${p.emoji}</td>
      <td><div style="font-weight:700">${p.name}</div><div style="font-size:.72rem;color:var(--text-muted)">${p.sku} · ${p.cat}</div></td>
      <td class="fw-bold text-gold">${p.unitsSold}</td>
      <td class="text-gold fw-bold">${anFull(p.revenue)}</td>
      <td class="text-success">${p.margin}%</td>
      <td style="min-width:120px">${anBar(anPct(p.revenue,maxRev))}</td>
      <td><button class="btn btn-gold btn-xs" onclick="showModule('products',null)">📦 View</button></td>
    </tr>`).join('');
  setTimeout(()=>{
    anDrawDonut('an-cat-donut', [
      {v:52000000,c:'#b8860b'},{v:18000000,c:'#3498db'},
      {v:8000000, c:'#95a5a6'},{v:4200000, c:'#9b59b6'},{v:3600000,c:'#bdc3c7'},
    ]);
    anDrawBars('an-products-bar', AN.topProducts.map(p=>p.name.split(' ').slice(0,2).join(' ')), AN.topProducts.map(p=>p.revenue),'#b8860b');
  },50);
}

// ====================================================
// 5. LOW STOCK PRODUCTS
// ====================================================
function renderLowStockAn() {
  const tbody=document.getElementById('an-low-tbody'); if(!tbody) return;
  tbody.innerHTML = AN.lowStock.map(p=>`
    <tr>
      <td><code style="font-size:.75rem">${p.sku}</code></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.cat}</td>
      <td class="fw-bold" style="color:${p.qty===0?'var(--danger)':'var(--warning)'}">${p.qty}</td>
      <td>${p.minQty}</td>
      <td class="fw-bold text-gold">${p.reorder}</td>
      <td>${p.daysCover===0?'<span style="color:var(--danger)">OUT OF STOCK</span>':`${p.daysCover} days`}</td>
      <td>${p.lastSold}</td>
      <td><span class="badge badge-${p.qty===0?'red':'orange'}">${p.qty===0?'Out of Stock':'Low Stock'}</span></td>
      <td><button class="btn btn-gold btn-xs" onclick="showModule('purchase',null)">🛒 Reorder</button></td>
    </tr>`).join('');
}

// ====================================================
// 6. CUSTOMER ANALYTICS
// ====================================================
function renderCustomerAn() {
  const c = AN.customers;
  const total = Object.values(c.tiers).reduce((s,v)=>s+v,0);
  // tier bars
  const tierEl = document.getElementById('an-tier-grid'); if(!tierEl) return;
  const tColors = { Platinum:'#9b59b6', Gold:'#b8860b', Silver:'#95a5a6', Regular:'#6b5e4e' };
  tierEl.innerHTML = Object.entries(c.tiers).map(([tier,count])=>`
    <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">
      <div style="font-size:1.2rem;font-weight:800;color:${tColors[tier]||'var(--accent)'}">${count}</div>
      <div style="font-size:.73rem;color:var(--text-muted);margin-top:2px">${tier}</div>
      <div style="margin-top:6px">${anBar(anPct(count,total),'')}</div>
    </div>`).join('');
  // top customers
  const tcTbody=document.getElementById('an-top-cust'); if(!tcTbody) return;
  tcTbody.innerHTML = c.topCustomers.map((cu,i)=>`
    <tr>
      <td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td>
      <td><strong>${cu.name}</strong></td>
      <td><span class="badge badge-${cu.tier==='Platinum'?'purple':cu.tier==='Gold'?'gold':'blue'}">${cu.tier}</span></td>
      <td class="text-gold fw-bold">${anFull(cu.spent)}</td>
      <td>${cu.visits}</td>
      <td>${anFull(Math.round(cu.spent/cu.visits))}</td>
    </tr>`).join('');
  // city
  const cityTbody=document.getElementById('an-city-tbody'); if(!cityTbody) return;
  const maxCityRev = Math.max(...c.cityWise.map(x=>x.revenue));
  cityTbody.innerHTML = c.cityWise.map(ci=>`
    <tr>
      <td class="fw-bold">${ci.city}</td>
      <td>${ci.customers}</td>
      <td class="text-gold fw-bold">${anFull(ci.revenue)}</td>
      <td>${anFull(Math.round(ci.revenue/ci.customers))}</td>
      <td style="min-width:120px">${anBar(anPct(ci.revenue,maxCityRev))}</td>
    </tr>`).join('');
  // kpis
  document.getElementById('an-cust-total') && (document.getElementById('an-cust-total').textContent=total);
  document.getElementById('an-cust-new')   && (document.getElementById('an-cust-new').textContent=c.newThisMonth);
  document.getElementById('an-cust-repeat')&& (document.getElementById('an-cust-repeat').textContent=c.repeatRate+'%');
  document.getElementById('an-cust-avg')   && (document.getElementById('an-cust-avg').textContent=anFull(c.avgSpend));
}

// ====================================================
// 7. PROFIT ANALYSIS
// ====================================================
function renderProfitAn() {
  const tbody=document.getElementById('an-profit-tbody'); if(!tbody) return;
  tbody.innerHTML = AN.profit.monthly.map(m=>`
    <tr>
      <td class="fw-bold">${m.month}</td>
      <td class="text-gold fw-bold">${anFull(m.revenue)}</td>
      <td class="text-danger">${anFull(m.cogs)}</td>
      <td class="text-success fw-bold">${anFull(m.gross)}</td>
      <td class="text-danger">${anFull(m.opex)}</td>
      <td class="text-success fw-bold">${anFull(m.net)}</td>
      <td class="fw-bold">${Math.round(m.net/m.revenue*100)}%</td>
      <td style="min-width:100px">${anBar(anPct(m.net,Math.max(...AN.profit.monthly.map(x=>x.net))))}</td>
    </tr>`).join('');
  // by category
  const catTbody=document.getElementById('an-profit-cat'); if(!catTbody) return;
  catTbody.innerHTML = AN.profit.byCategory.map(c=>`
    <tr>
      <td class="fw-bold">${c.cat}</td>
      <td class="text-gold fw-bold">${anFull(c.revenue)}</td>
      <td class="text-danger">${anFull(c.cogs)}</td>
      <td class="text-success fw-bold">${anFull(c.revenue-c.cogs)}</td>
      <td class="${c.margin>=30?'text-success':c.margin>=20?'text-gold':'text-danger'} fw-bold">${c.margin}%</td>
      <td style="min-width:100px">${anBar(c.margin,'')}</td>
    </tr>`).join('');
  setTimeout(()=>anDrawLine('an-profit-chart', AN.profit.monthly.map(m=>m.month),[
    {values:AN.profit.monthly.map(m=>m.revenue),color:'#b8860b'},
    {values:AN.profit.monthly.map(m=>m.gross),  color:'#3498db'},
    {values:AN.profit.monthly.map(m=>m.net),    color:'#2ecc71'},
  ]),50);
}

// ====================================================
// 8. BRANCH PERFORMANCE
// ====================================================
function renderBranchAn() {
  const grid=document.getElementById('an-branch-grid'); if(!grid) return;
  const maxSales=Math.max(...AN.branches.map(b=>b.sales));
  grid.innerHTML = AN.branches.map((b,i)=>{
    const tgtPct=anPct(b.sales,b.target);
    const medal=i===0?'🥇':i===1?'🥈':'🥉';
    return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:18px">
      <div style="display:flex;justify-content:space-between;margin-bottom:14px">
        <div>
          <div style="font-weight:800;font-size:1rem">${medal} ${b.name}</div>
          <div style="font-size:.73rem;color:var(--text-muted)">${b.staff} staff · ${b.items} items</div>
        </div>
        <span class="badge badge-${b.growth>=10?'green':'orange'}" style="font-size:.75rem">▲ ${b.growth}% growth</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:var(--bg-card2);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:1rem;font-weight:800;color:var(--accent)">${anFmt(b.sales)}</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Sales</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:1rem;font-weight:800;color:var(--success)">${anFmt(b.profit)}</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Profit</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:1rem;font-weight:800;color:var(--info)">${b.bills}</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Bills</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:1rem;font-weight:800">${b.customers}</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Customers</div>
        </div>
      </div>
      <div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:4px">
          <span>Target Achievement</span><span class="fw-bold" style="color:${tgtPct>=90?'var(--success)':tgtPct>=70?'var(--warning)':'var(--danger)'}">${tgtPct}%</span>
        </div>
        ${anBar(tgtPct,'')}
      </div>
      <div style="font-size:.75rem;display:flex;justify-content:space-between;color:var(--text-muted);margin-top:8px">
        <span>Target: ${anFmt(b.target)}</span><span>Gap: ${anFmt(b.target-b.sales)}</span>
      </div>
    </div>`;
  }).join('');
  // branch comparison bar
  setTimeout(()=>anDrawBars('an-branch-chart', AN.branches.map(b=>b.name.split(' ')[0]), AN.branches.map(b=>b.sales),'#b8860b'),50);
}

// ====================================================
// 9. EMPLOYEE PERFORMANCE
// ====================================================
function renderEmployeeAn() {
  const tbody=document.getElementById('an-emp-tbody'); if(!tbody) return;
  const sorted=[...AN.employees].sort((a,b)=>b.sales-a.sales);
  const maxSales=Math.max(...sorted.map(e=>e.sales))||1;
  tbody.innerHTML = sorted.map((e,i)=>`
    <tr>
      <td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td>
      <td><strong>${e.name}</strong><div style="font-size:.72rem;color:var(--text-muted)">${e.role} · ${e.branch}</div></td>
      <td>${e.target>0?`<div class="fw-bold text-gold">${anFull(e.sales)}</div><div style="font-size:.72rem;color:var(--text-muted)">of ${anFull(e.target)}</div>`:'N/A'}</td>
      <td>${e.target>0?anBar(anPct(e.sales,e.target),''): '—'}</td>
      <td class="fw-bold">${e.bills}</td>
      <td>${e.customers}</td>
      <td>${e.avgTicket>0?anFull(e.avgTicket):'—'}</td>
      <td><span style="color:#f0c040">★</span> ${e.rating}</td>
    </tr>`).join('');
  setTimeout(()=>anDrawBars('an-emp-chart', sorted.map(e=>e.name.split(' ')[0]), sorted.map(e=>e.sales||e.bills*1000),'#b8860b'),50);
}

// ====================================================
// INIT
// ====================================================
function initAnalyticsModule() {
  renderDailySales();
  renderMonthlySales();
  renderYearlySales();
  renderBestProducts();
  renderLowStockAn();
  renderCustomerAn();
  renderProfitAn();
  renderBranchAn();
  renderEmployeeAn();
}

document.addEventListener('DOMContentLoaded', () => {
  const orig = window.showModule;
  if (typeof orig === 'function') {
    window.showModule = function(m, n) { orig(m, n); if(m==='analytics') setTimeout(initAnalyticsModule, 80); };
  }
});
