/* ===================================================
   CERITAGE JEWELRY ERP
   Gold Exchange · Repair Job Card · Order Booking
   =================================================== */

// ============================================================
// SHARED DATA
// ============================================================
const XRO = {

  // ---- GOLD / SILVER EXCHANGE ----
  exchanges: [
    { id:'EX001', date:'2026-08-16', custName:'Walk-in Customer', phone:'—',        type:'Gold',   metal:'22K Gold',  item:'Old Bangle Set',          grossWt:22.0, stoneWt:0.0, netWt:22.0, purity:0.916, fineWt:20.15, rate:7240, value:145886, exchangeFor:'New Purchase',  invoice:'INV-2026-8841', status:'Completed' },
    { id:'EX002', date:'2026-08-15', custName:'Priya Sharma',     phone:'9876543210',type:'Gold',   metal:'18K Gold',  item:'Old Chain',               grossWt:18.5, stoneWt:0.0, netWt:18.5, purity:0.75,  fineWt:13.88, rate:7200, value:99936,  exchangeFor:'Cash Payout',  invoice:'—',            status:'Completed' },
    { id:'EX003', date:'2026-08-14', custName:'Rajesh Patel',     phone:'9856231470',type:'Gold',   metal:'22K Gold',  item:'Old Ring (pair)',          grossWt:8.2,  stoneWt:0.3, netWt:7.9,  purity:0.916, fineWt:7.24,  rate:7120, value:51533,  exchangeFor:'New Purchase',  invoice:'INV-2026-8840', status:'Completed' },
    { id:'EX004', date:'2026-08-13', custName:'Sunita Verma',     phone:'9934521870',type:'Silver', metal:'Silver 925',item:'Old Silver Set',           grossWt:85.0, stoneWt:0.0, netWt:85.0, purity:0.925, fineWt:78.63, rate:91,   value:7155,   exchangeFor:'New Purchase',  invoice:'—',            status:'Completed' },
    { id:'EX005', date:'2026-08-12', custName:'Amit Kumar',       phone:'9712345678',type:'Gold',   metal:'14K Gold',  item:'Old Bracelet',            grossWt:12.0, stoneWt:0.5, netWt:11.5, purity:0.583, fineWt:6.70,  rate:7130, value:47771,  exchangeFor:'Cash Payout',  invoice:'—',            status:'Completed' },
  ],

  // ---- REPAIR JOBS ----
  repairs: [
    { id:'RJ001', date:'2026-08-10', custName:'Priya Sharma',    phone:'9876543210', item:'Gold Necklace',     issue:'Chain broken — soldering needed',           itemType:'Necklace', metal:'22K Gold', wt:28.5, karigar:'Ramesh Soni',  dueDate:'2026-08-17', status:'In Progress', estimate:1300, advance:500,  balance:800,  charges:1300, gst:234,  total:1534, deliveredDate:null,     notified:false },
    { id:'RJ002', date:'2026-08-12', custName:'Rajesh Patel',    phone:'9856231470', item:'Diamond Ring',      issue:'Ring resizing — size 16 to 18',              itemType:'Ring',     metal:'18K Gold', wt:4.2,  karigar:'Suresh Meena', dueDate:'2026-08-15', status:'Ready',       estimate:500,  advance:200,  balance:300,  charges:500,  gst:90,   total:590,  deliveredDate:null,     notified:true  },
    { id:'RJ003', date:'2026-08-14', custName:'Meena Singh',     phone:'9623471230', item:'Silver Bangle Set', issue:'Polish & clean — 3 bangles',                 itemType:'Bangles',  metal:'Silver',   wt:135.0,karigar:'Harish Kumar', dueDate:'2026-08-18', status:'Pending',     estimate:800,  advance:0,    balance:800,  charges:800,  gst:144,  total:944,  deliveredDate:null,     notified:false },
    { id:'RJ004', date:'2026-08-15', custName:'Vikram Malhotra', phone:'9845612370', item:'Gold Bangles Pair', issue:'Stone missing — re-setting 2 stones',        itemType:'Bangles',  metal:'22K Gold', wt:35.0, karigar:'Suresh Meena', dueDate:'2026-08-22', status:'In Progress', estimate:2200, advance:1000, balance:1200, charges:2200, gst:396,  total:2596, deliveredDate:null,     notified:false },
    { id:'RJ005', date:'2026-08-11', custName:'Sunita Verma',    phone:'9934521870', item:'Kundan Pendant',    issue:'Clasp repair + re-string thread',            itemType:'Pendant',  metal:'22K Gold', wt:5.1,  karigar:'Ramesh Soni',  dueDate:'2026-08-16', status:'Overdue',     estimate:600,  advance:300,  balance:300,  charges:600,  gst:108,  total:708,  deliveredDate:null,     notified:false },
    { id:'RJ006', date:'2026-08-08', custName:'Deepa Nair',      phone:'9701234560', item:'Gold Chain 22K',    issue:'Polishing + clasp replacement',              itemType:'Chain',    metal:'22K Gold', wt:12.0, karigar:'Harish Kumar', dueDate:'2026-08-14', status:'Delivered',   estimate:900,  advance:900,  balance:0,    charges:900,  gst:162,  total:1062, deliveredDate:'2026-08-14', notified:true  },
    { id:'RJ007', date:'2026-08-16', custName:'Amit Kumar',      phone:'9712345678', item:'Diamond Stud Earrings',issue:'Back clamp broken — both pieces',         itemType:'Earrings', metal:'18K Gold', wt:3.2,  karigar:'Suresh Meena', dueDate:'2026-08-21', status:'Pending',     estimate:400,  advance:0,    balance:400,  charges:400,  gst:72,   total:472,  deliveredDate:null,     notified:false },
  ],

  // ---- ORDERS ----
  orders: [
    { id:'ORD001', date:'2026-08-08', custName:'Sunita Verma',    phone:'9934521870', type:'Bridal',  item:'Custom Bridal Set — Kundan 22K (Necklace+Earrings+Maangtikka)',  purity:'22K', estWt:120.0, estAmt:950000, advancePaid:250000, balance:700000, goldRate:7240, karigar:'Ramesh Soni',  dueDate:'2026-09-15', status:'In Design',      priority:'High',   notified:false },
    { id:'ORD002', date:'2026-08-05', custName:'Vikram Malhotra', phone:'9845612370', type:'Custom',  item:'Solitaire Engagement Ring — 18K Diamond 2ct',                    purity:'18K', estWt:8.0,   estAmt:1250000,advancePaid:500000, balance:750000, goldRate:7200, karigar:'Suresh Meena', dueDate:'2026-09-01', status:'Manufacturing',  priority:'Urgent', notified:false },
    { id:'ORD003', date:'2026-08-14', custName:'Priya Sharma',    phone:'9876543210', type:'Advance', item:'Gold Bangles Pair 22K — Navratri Collection',                    purity:'22K', estWt:35.0,  estAmt:253400, advancePaid:63000,  balance:190400, goldRate:7240, karigar:'Ramesh Soni',  dueDate:'2026-10-01', status:'Confirmed',     priority:'Normal', notified:false },
    { id:'ORD004', date:'2026-08-13', custName:'Amit Kumar',      phone:'9712345678', type:'Custom',  item:'Diamond Tennis Bracelet — 18K 2.1ct total',                      purity:'18K', estWt:10.5,  estAmt:155000, advancePaid:50000,  balance:105000, goldRate:7130, karigar:'Suresh Meena', dueDate:'2026-09-10', status:'Pending',       priority:'Normal', notified:false },
    { id:'ORD005', date:'2026-08-01', custName:'Deepa Nair',      phone:'9701234560', type:'Bridal',  item:'Temple Jewellery Set — 22K Gold Full Bridal',                    purity:'22K', estWt:95.0,  estAmt:720000, advancePaid:200000, balance:520000, goldRate:7170, karigar:'Ramesh Soni',  dueDate:'2026-09-20', status:'Ready',         priority:'High',   notified:true  },
    { id:'ORD006', date:'2026-07-25', custName:'Rajesh Patel',    phone:'9856231470', type:'Advance', item:'Silver Filigree Choker — 925 Silver',                            purity:'925', estWt:45.0,  estAmt:18000,  advancePaid:5000,   balance:13000,  goldRate:0,    karigar:'Raju Filigree',dueDate:'2026-08-20', status:'Overdue',       priority:'High',   notified:true  },
  ],
};

// ---- UTILITIES ----
function xFmt(n)   { return '₹'+(n||0).toLocaleString('en-IN'); }
function xDate(d)  { if(!d) return '—'; const dt=new Date(d); return isNaN(dt)?d:dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function xDaysLeft(d){ if(!d) return null; return Math.ceil((new Date(d)-new Date())/86400000); }
function xBadge(s) {
  const m = { 'Completed':'badge-green','Ready':'badge-green','Delivered':'badge-green','In Progress':'badge-orange',
    'Pending':'badge-grey','Overdue':'badge-red','In Design':'badge-purple','Manufacturing':'badge-blue',
    'Confirmed':'badge-blue','Cash Payout':'badge-grey','New Purchase':'badge-gold' };
  return `<span class="badge ${m[s]||'badge-grey'}">${s}</span>`;
}
function xPriBadge(p){ const m={Urgent:'badge-red',High:'badge-orange',Normal:'badge-grey'}; return `<span class="badge ${m[p]||'badge-grey'}">${p}</span>`; }

// ============================================================
// GOLD EXCHANGE — 7 FEATURES
// ============================================================

// Live calculator
function calcExchangeLive() {
  const gross  = parseFloat(document.getElementById('xe-gross')?.value)  || 0;
  const stone  = parseFloat(document.getElementById('xe-stone')?.value)  || 0;
  const purity = parseFloat(document.getElementById('xe-purity-sel')?.value) || 0.916;
  const rate   = parseFloat(document.getElementById('xe-rate')?.value)   || (window.RATES?RATES.current.k22:7240);
  const metal  = document.getElementById('xe-metal')?.value || 'gold';
  const effectiveRate = metal==='silver' ? (window.RATES?RATES.current.silver:92) : rate;
  const net   = Math.max(0, gross - stone);
  const fine  = net * purity;
  const value = fine * effectiveRate;
  // wastage deduction
  const wastage = parseFloat(document.getElementById('xe-wastage')?.value)||0;
  const deduction = value * (wastage/100);
  const finalValue = value - deduction;
  const setEl=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  setEl('xe-net-wt',   net.toFixed(3)+'g');
  setEl('xe-fine-wt',  fine.toFixed(3)+'g');
  setEl('xe-base-val', xFmt(Math.round(value)));
  setEl('xe-deduction',wastage?xFmt(Math.round(deduction)):xFmt(0));
  setEl('xe-final-val',xFmt(Math.round(finalValue)));
  // purity %
  setEl('xe-purity-show',(purity*100).toFixed(1)+'%');
  return { gross, stone, net, purity, fine, value:Math.round(finalValue), rate:effectiveRate };
}

function renderExchangeList() {
  const tbody=document.getElementById('xe-list-tbody'); if(!tbody) return;
  tbody.innerHTML = XRO.exchanges.map(e=>`
    <tr>
      <td><span class="badge badge-gold" style="font-size:.7rem">${e.id}</span></td>
      <td>${xDate(e.date)}</td>
      <td><strong>${e.custName}</strong><div style="font-size:.72rem;color:var(--text-muted)">${e.phone}</div></td>
      <td style="font-size:.82rem">${e.item}</td>
      <td><span class="badge badge-${e.type==='Gold'?'gold':'blue'}">${e.metal}</span></td>
      <td>${e.grossWt}g</td>
      <td style="font-size:.78rem;color:var(--text-muted)">${e.stoneWt}g</td>
      <td class="text-gold fw-bold">${e.fineWt.toFixed(2)}g</td>
      <td>₹${e.rate}/g</td>
      <td class="text-gold fw-bold">${xFmt(e.value)}</td>
      <td>${xBadge(e.exchangeFor)}</td>
      <td>${e.invoice!=='—'?`<code style="font-size:.7rem">${e.invoice}</code>`:'—'}</td>
      <td>${xBadge(e.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="showToast('Exchange slip printed','success')">🖨️ Slip</button>
        <button class="btn btn-outline btn-xs" onclick="showToast('Exchange added to bill','success')">🧾 Bill</button>
      </td>
    </tr>`).join('');
  // update kpis
  const totGold=XRO.exchanges.filter(e=>e.type==='Gold').reduce((s,e)=>s+e.fineWt,0);
  const totSilver=XRO.exchanges.filter(e=>e.type==='Silver').reduce((s,e)=>s+e.fineWt,0);
  const totVal=XRO.exchanges.reduce((s,e)=>s+e.value,0);
  ['xe-kpi-count','xe-kpi-gold','xe-kpi-silver','xe-kpi-val'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=[XRO.exchanges.length, totGold.toFixed(2)+'g', totSilver.toFixed(2)+'g', xFmt(totVal)][i];
  });
}

function saveExchange() {
  const custEl=document.getElementById('xe-cust');
  const custName=custEl?.value==='walkin'?'Walk-in Customer':custEl?.options[custEl.selectedIndex]?.text||'Walk-in';
  const item=document.getElementById('xe-item')?.value?.trim();
  const calc=calcExchangeLive();
  if(!item||calc.gross<=0) { showToast('Fill all required fields','error'); return; }
  const forWhat=document.getElementById('xe-for')?.value||'New Purchase';
  const newId='EX'+String(XRO.exchanges.length+1).padStart(3,'0');
  XRO.exchanges.unshift({ id:newId, date:new Date().toISOString().slice(0,10), custName, phone:'—', type:calc.purity<0.5?'Silver':'Gold', metal:document.getElementById('xe-metal')?.value==='silver'?'Silver 925':'22K Gold', item, grossWt:calc.gross, stoneWt:calc.stone, netWt:calc.net, purity:calc.purity, fineWt:calc.fine, rate:calc.rate, value:calc.value, exchangeFor:forWhat, invoice:'—', status:'Completed' });
  renderExchangeList();
  showToast('Exchange '+newId+' recorded — '+xFmt(calc.value),'success');
  // reset form
  ['xe-gross','xe-stone','xe-wastage'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  calcExchangeLive();
}

// ============================================================
// REPAIR JOB CARD — 6 FEATURES
// ============================================================

function renderRepairs(statusFilter) {
  const tbody=document.getElementById('repair-tbody'); if(!tbody) return;
  const lq=(document.getElementById('repair-search')?.value||'').toLowerCase();
  let data=XRO.repairs;
  if(statusFilter&&statusFilter!=='All') data=data.filter(r=>r.status===statusFilter);
  if(lq) data=data.filter(r=>r.id.toLowerCase().includes(lq)||r.custName.toLowerCase().includes(lq)||r.item.toLowerCase().includes(lq));
  // kpi update
  ['rp-kpi-pending','rp-kpi-ready','rp-kpi-overdue','rp-kpi-advance'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=[data.filter(r=>r.status==='Pending'||r.status==='In Progress').length, data.filter(r=>r.status==='Ready').length, data.filter(r=>r.status==='Overdue').length, xFmt(data.reduce((s,r)=>s+r.advance,0))][i];
  });
  tbody.innerHTML = data.map(r=>{
    const dl=xDaysLeft(r.dueDate);
    const overdue=dl!==null&&dl<0&&r.status!=='Delivered';
    const dueColor=overdue?'var(--danger)':dl!==null&&dl<=2?'var(--warning)':'var(--text-muted)';
    const pct=r.advance?Math.min(100,Math.round(r.advance/r.total*100)):0;
    return `<tr style="${overdue?'background:rgba(231,76,60,.04)':''}">
      <td><span class="badge badge-blue" style="font-size:.7rem">${r.id}</span></td>
      <td>
        <div style="font-weight:700">${r.custName}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">${r.phone}</div>
      </td>
      <td>
        <div style="font-weight:600;font-size:.85rem">${r.item}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">${r.issue}</div>
      </td>
      <td>${r.itemType}</td>
      <td>${r.karigar}</td>
      <td>${xDate(r.date)}</td>
      <td style="color:${dueColor};font-weight:700">${xDate(r.dueDate)}${overdue?' ⚠️':dl!==null&&dl<=2?' 🔔':''}</td>
      <td>${xBadge(overdue?'Overdue':r.status)}</td>
      <td class="text-gold fw-bold">${xFmt(r.total)}</td>
      <td class="text-success">${xFmt(r.advance)}</td>
      <td class="${r.balance>0?'text-danger fw-bold':''}">${r.balance?xFmt(r.balance):'—'}</td>
      <td style="white-space:nowrap">
        ${r.status!=='Delivered'?`<button class="btn btn-gold btn-xs" onclick="openJobCard('${r.id}')">📋 Card</button>`:''}
        ${r.status==='Pending'||r.status==='In Progress'?`<button class="btn btn-outline btn-xs" onclick="updateRepairStatus('${r.id}','Ready')">✅ Ready</button>`:''}
        ${r.status==='Ready'?`<button class="btn btn-gold btn-xs" onclick="deliverRepair('${r.id}')">📦 Deliver</button>`:''}
        ${!r.notified?`<button class="btn btn-outline btn-xs" onclick="notifyRepairCustomer('${r.id}')">📱</button>`:''}
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="12" style="text-align:center;padding:20px;color:var(--text-muted)">No repairs found</td></tr>`;
}

function updateRepairStatus(id, status) {
  const r=XRO.repairs.find(x=>x.id===id);
  if(r){ r.status=status; renderRepairs(); showToast(r.id+' — '+status,'success'); }
}

function deliverRepair(id) {
  const r=XRO.repairs.find(x=>x.id===id);
  if(!r) return;
  if(r.balance>0){ showToast('Collect balance ₹'+r.balance.toLocaleString('en-IN')+' before delivery','error'); return; }
  r.status='Delivered'; r.deliveredDate=new Date().toISOString().slice(0,10); r.notified=true;
  renderRepairs();
  showToast(r.id+' delivered to '+r.custName,'success');
}

function notifyRepairCustomer(id) {
  const r=XRO.repairs.find(x=>x.id===id);
  if(!r) return;
  r.notified=true;
  const msg=r.status==='Ready'?`Your repair job ${r.id} (${r.item}) is ready for pickup at Ceritage Jewelry. Balance: ₹${r.balance}. Timing: 10AM-8PM.`:`Update on your repair job ${r.id}: ${r.status}. Due: ${xDate(r.dueDate)}.`;
  showToast('📱 WhatsApp sent to '+r.custName+': '+r.status,'success');
  renderRepairs();
}

function openJobCard(id) {
  const r=XRO.repairs.find(x=>x.id===id);
  if(!r) return;
  openModal('jobCardModal');
  const set=(el,v)=>{ const e=document.getElementById(el); if(e) e.textContent=v||'—'; };
  set('jc-id',r.id); set('jc-cust',r.custName); set('jc-phone',r.phone);
  set('jc-item',r.item); set('jc-issue',r.issue); set('jc-type',r.itemType);
  set('jc-metal',r.metal); set('jc-wt',r.wt+'g'); set('jc-karigar',r.karigar);
  set('jc-received',xDate(r.date)); set('jc-due',xDate(r.dueDate));
  set('jc-estimate',xFmt(r.estimate)); set('jc-advance',xFmt(r.advance));
  set('jc-balance',xFmt(r.balance)); set('jc-charges',xFmt(r.charges));
  set('jc-gst',xFmt(r.gst)); set('jc-total',xFmt(r.total));
  document.getElementById('jc-status') && (document.getElementById('jc-status').innerHTML=xBadge(r.status));
  // progress steps
  const steps=['Pending','In Progress','Ready','Delivered'];
  const stepsEl=document.getElementById('jc-steps'); if(!stepsEl) return;
  stepsEl.innerHTML=steps.map((s,i)=>{
    const done=steps.indexOf(r.status)>=i;
    return `<div style="display:flex;align-items:center;gap:6px;font-size:.82rem">
      <div style="width:24px;height:24px;border-radius:50%;background:${done?'var(--success)':'var(--border)'};display:flex;align-items:center;justify-content:center;color:#fff;font-size:.7rem;font-weight:800">${done?'✓':i+1}</div>
      <span style="color:${done?'var(--success)':'var(--text-muted)'}${r.status===s?';font-weight:700':''}">${s}</span>
      ${i<steps.length-1?`<div style="flex:1;height:2px;background:${done?'var(--success)':'var(--border)'}"></div>`:''}
    </div>`;
  }).join('');
}

function saveNewRepair() {
  const custEl=document.getElementById('rp-cust');
  const custName=custEl?.options[custEl?.selectedIndex]?.text||'Walk-in';
  const phone=document.getElementById('rp-phone')?.value||'—';
  const item=document.getElementById('rp-item')?.value?.trim();
  const issue=document.getElementById('rp-issue')?.value?.trim();
  const karigar=document.getElementById('rp-karigar')?.value;
  const due=document.getElementById('rp-due')?.value;
  const estimate=parseFloat(document.getElementById('rp-estimate')?.value)||0;
  const advance=parseFloat(document.getElementById('rp-advance')?.value)||0;
  if(!item||!issue||!due) { showToast('Fill all required fields','error'); return; }
  const gst=Math.round(estimate*0.18);
  const total=estimate+gst;
  const newId='RJ'+String(XRO.repairs.length+1).padStart(3,'0');
  XRO.repairs.unshift({ id:newId, date:new Date().toISOString().slice(0,10), custName, phone, item, issue, itemType:document.getElementById('rp-type')?.value||'Other', metal:document.getElementById('rp-metal')?.value||'22K Gold', wt:parseFloat(document.getElementById('rp-wt')?.value)||0, karigar, dueDate:due, status:'Pending', estimate, advance, balance:total-advance, charges:estimate, gst, total, deliveredDate:null, notified:false });
  closeModal('addRepairModal');
  renderRepairs();
  showToast('Job Card '+newId+' created for '+custName,'success');
}

// ============================================================
// ORDER BOOKING — 6 FEATURES
// ============================================================

function renderOrders(typeFilter) {
  const tbody=document.getElementById('orders-tbody'); if(!tbody) return;
  let data=typeFilter&&typeFilter!=='All'?XRO.orders.filter(o=>o.type===typeFilter):XRO.orders;
  // kpis
  ['ord-kpi-active','ord-kpi-advance','ord-kpi-ready','ord-kpi-overdue'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=[data.filter(o=>o.status!=='Delivered').length, xFmt(data.reduce((s,o)=>s+o.advancePaid,0)), data.filter(o=>o.status==='Ready').length, data.filter(o=>o.status==='Overdue').length][i];
  });
  tbody.innerHTML = data.map(o=>{
    const dl=xDaysLeft(o.dueDate);
    const overdue=dl!==null&&dl<0&&o.status!=='Delivered';
    const dueColor=overdue?'var(--danger)':dl!==null&&dl<=7?'var(--warning)':'var(--text-muted)';
    const pct=Math.round(o.advancePaid/o.estAmt*100);
    return `<tr style="${overdue?'background:rgba(231,76,60,.04)':''}">
      <td><span class="badge badge-${o.type==='Bridal'?'purple':o.type==='Custom'?'blue':'gold'}">${o.id}</span></td>
      <td><strong>${o.custName}</strong><div style="font-size:.72rem;color:var(--text-muted)">${o.phone}</div></td>
      <td><span class="badge badge-${o.type==='Bridal'?'purple':o.type==='Custom'?'blue':'grey'}" style="font-size:.7rem">${o.type}</span></td>
      <td style="font-size:.82rem;max-width:200px">${o.item}</td>
      <td>${o.purity} · ${o.estWt}g</td>
      <td class="text-gold fw-bold">${xFmt(o.estAmt)}</td>
      <td>
        <div class="text-success fw-bold">${xFmt(o.advancePaid)}</div>
        <div style="font-size:.7rem;color:var(--text-muted)">${pct}% paid</div>
        <div class="progress" style="height:4px;margin-top:3px"><div class="progress-bar ${pct>=50?'green':''}" style="width:${pct}%"></div></div>
      </td>
      <td class="${o.balance>0?'text-danger fw-bold':''}">${xFmt(o.balance)}</td>
      <td style="color:${dueColor};font-weight:700">${xDate(o.dueDate)}${overdue?' ⚠️':dl!==null&&dl<=7?' 🔔':''}</td>
      <td>${o.karigar}</td>
      <td>${xPriBadge(o.priority)}</td>
      <td>${xBadge(overdue?'Overdue':o.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="openOrderDetail('${o.id}')">📋 View</button>
        ${o.status==='Ready'?`<button class="btn btn-gold btn-xs" onclick="deliverOrder('${o.id}')">📦 Deliver</button>`:''}
        ${o.status!=='Delivered'?`<button class="btn btn-outline btn-xs" onclick="updateOrderStatus('${o.id}')">⚙️</button>`:''}
        ${!o.notified?`<button class="btn btn-outline btn-xs" onclick="notifyOrderCustomer('${o.id}')">📱</button>`:''}
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="13" style="text-align:center;padding:20px;color:var(--text-muted)">No orders found</td></tr>`;
}

function updateOrderStatus(id) {
  const o=XRO.orders.find(x=>x.id===id);
  if(!o) return;
  const flow=['Pending','Confirmed','In Design','Manufacturing','Quality Check','Ready','Delivered'];
  const idx=flow.indexOf(o.status);
  if(idx<flow.length-1){ o.status=flow[idx+1]; renderOrders(); showToast(o.id+' → '+o.status,'success'); }
}

function deliverOrder(id) {
  const o=XRO.orders.find(x=>x.id===id);
  if(!o) return;
  if(o.balance>0){ showToast('Collect balance '+xFmt(o.balance)+' before delivery','error'); return; }
  o.status='Delivered'; o.notified=true; renderOrders(); showToast(o.id+' delivered to '+o.custName,'success');
}

function notifyOrderCustomer(id) {
  const o=XRO.orders.find(x=>x.id===id);
  if(!o) return;
  o.notified=true; renderOrders();
  showToast('📱 Update sent to '+o.custName+' — Order '+o.status,'success');
}

function openOrderDetail(id) {
  const o=XRO.orders.find(x=>x.id===id);
  if(!o) return;
  openModal('orderDetailModal');
  const set=(el,v)=>{ const e=document.getElementById(el); if(e) e.textContent=v||'—'; };
  set('od-id',o.id); set('od-cust',o.custName); set('od-phone',o.phone);
  set('od-type',o.type); set('od-item',o.item); set('od-purity',o.purity);
  set('od-wt',o.estWt+'g'); set('od-amt',xFmt(o.estAmt)); set('od-advance',xFmt(o.advancePaid));
  set('od-balance',xFmt(o.balance)); set('od-goldrate','₹'+o.goldRate+'/g');
  set('od-karigar',o.karigar); set('od-due',xDate(o.dueDate)); set('od-priority',o.priority);
  document.getElementById('od-status') && (document.getElementById('od-status').innerHTML=xBadge(o.status));
  // order flow steps
  const flow=['Pending','Confirmed','In Design','Manufacturing','Quality Check','Ready','Delivered'];
  const curIdx=flow.indexOf(o.status);
  const stepsEl=document.getElementById('od-steps'); if(!stepsEl) return;
  stepsEl.innerHTML=`<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">`+flow.map((s,i)=>{
    const done=i<=curIdx; const cur=i===curIdx;
    return `<div style="display:flex;align-items:center;gap:4px">
      <div style="padding:4px 8px;border-radius:4px;font-size:.72rem;font-weight:${cur?700:400};background:${done?'var(--success)':'var(--bg-card2)'};color:${done?'#fff':'var(--text-muted)'};">${s}</div>
      ${i<flow.length-1?`<span style="color:var(--text-muted);font-size:.8rem">›</span>`:''}
    </div>`;
  }).join('')+'</div>';
}

function saveNewOrder() {
  const custEl=document.getElementById('nord-cust');
  const custName=custEl?.options[custEl?.selectedIndex]?.text||'Customer';
  const type=document.getElementById('nord-type')?.value;
  const item=document.getElementById('nord-item')?.value?.trim();
  const purity=document.getElementById('nord-purity')?.value;
  const estWt=parseFloat(document.getElementById('nord-wt')?.value)||0;
  const estAmt=parseFloat(document.getElementById('nord-amt')?.value)||0;
  const advance=parseFloat(document.getElementById('nord-advance')?.value)||0;
  const due=document.getElementById('nord-due')?.value;
  const priority=document.getElementById('nord-priority')?.value||'Normal';
  const karigar=document.getElementById('nord-karigar')?.value||'TBD';
  const goldRate=parseFloat(document.getElementById('nord-goldrate')?.value)||7240;
  if(!item||!due||estAmt<=0) { showToast('Fill all required fields','error'); return; }
  if(advance<estAmt*0.1) { showToast('Minimum 10% advance required','error'); return; }
  const newId='ORD'+String(XRO.orders.length+1).padStart(3,'0');
  XRO.orders.unshift({ id:newId, date:new Date().toISOString().slice(0,10), custName, phone:'—', type, item, purity, estWt, estAmt, advancePaid:advance, balance:estAmt-advance, goldRate, karigar, dueDate:due, status:'Confirmed', priority, notified:false });
  closeModal('addOrderModal');
  renderOrders();
  showToast('Order '+newId+' booked for '+custName,'success');
}

function collectOrderAdvance(id) {
  const o=XRO.orders.find(x=>x.id===id);
  if(!o||o.balance<=0) return;
  const amt=parseFloat(prompt('Collect advance for '+o.custName+'\nRemaining Balance: ₹'+o.balance.toLocaleString('en-IN')+'\nEnter amount:', o.balance));
  if(isNaN(amt)||amt<=0) return;
  const paid=Math.min(amt,o.balance);
  o.advancePaid+=paid; o.balance=Math.max(0,o.balance-paid);
  renderOrders(); showToast(xFmt(paid)+' collected from '+o.custName,'success');
}

// ============================================================
// INIT
// ============================================================
function initExchangeModule() {
  renderExchangeList();
  calcExchangeLive();
}
function initRepairModule() {
  renderRepairs();
  // populate repair customer dropdown
  const sel=document.getElementById('rp-cust');
  if(sel&&window.CM) sel.innerHTML='<option value="">-- Select --</option>'+CM.customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')+'<option value="walkin">Walk-in</option>';
}
function initOrdersModule() {
  renderOrders();
  const sel=document.getElementById('nord-cust');
  if(sel&&window.CM) sel.innerHTML='<option value="">-- Select Customer --</option>'+CM.customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', ()=>{
  const orig=window.showModule;
  if(typeof orig==='function'){
    window.showModule=function(m,n){
      orig(m,n);
      if(m==='gold-exchange') setTimeout(initExchangeModule,60);
      if(m==='repair') setTimeout(initRepairModule,60);
      if(m==='orders') setTimeout(initOrdersModule,60);
    };
  }
  // override app.js calcExchange
  window.calcExchange = function(){ calcExchangeLive(); };
});
