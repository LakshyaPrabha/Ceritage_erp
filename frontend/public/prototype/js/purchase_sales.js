/* ===================================================
   CERITAGE — Purchase Management + Sales Management
   =================================================== */

const PS = {
  // ---- PURCHASE ORDERS ----
  purchases: [
    { id:'PO-2026-148', date:'2026-08-16', supplier:'Zaveri Bullion',      type:'Gold',     item:'Gold Bar 22K',          qty:'100g',   rate:7240,  amount:724000, gst:21720,  total:745720, paid:274000, balance:471720, status:'Received',  grn:'GRN-048' },
    { id:'PO-2026-147', date:'2026-08-12', supplier:'Diamond Palace',      type:'Diamond',  item:'Diamond 0.5ct 10pcs',   qty:'10 pcs', rate:28000, amount:280000, gst:700,    total:280700, paid:100000, balance:180700, status:'Pending',   grn:null      },
    { id:'PO-2026-146', date:'2026-08-14', supplier:'Raj. Stone Works',    type:'Gemstone', item:'Emerald 20 pcs',         qty:'20 pcs', rate:3750,  amount:75000,  gst:187,    total:75187,  paid:75187,  balance:0,      status:'Received',  grn:'GRN-047' },
    { id:'PO-2026-145', date:'2026-08-08', supplier:'Zaveri Bullion',      type:'Gold',     item:'Gold Bar 22K 50g',       qty:'50g',    rate:7200,  amount:360000, gst:10800,  total:370800, paid:370800, balance:0,      status:'Received',  grn:'GRN-046' },
    { id:'PO-2026-144', date:'2026-08-05', supplier:'KDM Gold Refinery',   type:'Gold',     item:'Gold Bar 24K 80g',       qty:'80g',    rate:7890,  amount:631200, gst:18936,  total:650136, paid:650136, balance:0,      status:'Received',  grn:'GRN-045' },
    { id:'PO-2026-143', date:'2026-08-03', supplier:'Ratanlal & Sons',     type:'Silver',   item:'Silver 925 500g',        qty:'500g',   rate:92,    amount:46000,  gst:1380,   total:47380,  paid:47380,  balance:0,      status:'Received',  grn:'GRN-044' },
  ],
  // ---- PURCHASE RETURNS ----
  purchaseReturns: [
    { id:'PR-001', date:'2026-08-10', poRef:'PO-2026-140', supplier:'Diamond Palace', item:'Defective Diamond 0.3ct', qty:'1 pc', amount:18000, reason:'Stone chip on girdle', status:'Approved', refund:'Credit Note' },
    { id:'PR-002', date:'2026-08-06', poRef:'PO-2026-138', supplier:'Ratanlal & Sons', item:'Silver Oxidised (wrong shade)', qty:'200g', amount:18400, reason:'Colour mismatch', status:'Completed', refund:'Cash' },
  ],
  // ---- GRN ----
  grns: [
    { id:'GRN-048', date:'2026-08-16', poRef:'PO-2026-148', supplier:'Zaveri Bullion',   item:'Gold Bar 22K 100g', qty:'100g',   receivedBy:'Ravi Sharma',  condition:'Good',    note:'Assay report verified' },
    { id:'GRN-047', date:'2026-08-14', poRef:'PO-2026-146', supplier:'Raj. Stone Works', item:'Emerald 20 pcs',    qty:'20 pcs', receivedBy:'Karan Mehta',  condition:'Good',    note:'All pieces checked' },
    { id:'GRN-046', date:'2026-08-09', poRef:'PO-2026-145', supplier:'Zaveri Bullion',   item:'Gold Bar 22K 50g',  qty:'50g',    receivedBy:'Ravi Sharma',  condition:'Good',    note:'' },
    { id:'GRN-045', date:'2026-08-05', poRef:'PO-2026-144', supplier:'KDM Gold Refinery',item:'Gold Bar 24K 80g',  qty:'80g',    receivedBy:'Ravi Sharma',  condition:'Good',    note:'Certificate attached' },
  ],
  // ---- OLD GOLD/SILVER PURCHASE ----
  oldMetalPurchase: [
    { id:'OGP-001', date:'2026-08-16', customer:'Walk-in',      metal:'Old Gold 22K',  grossWt:22.0, stoneWt:0.0, netWt:22.0, purity:0.916, fineWt:20.15, rate:7240, amount:145886, mode:'Cash',    status:'Completed' },
    { id:'OGP-002', date:'2026-08-15', customer:'Priya Sharma', metal:'Old Gold 18K',  grossWt:18.5, stoneWt:0.0, netWt:18.5, purity:0.75,  fineWt:13.88, rate:7200, amount:99936,  mode:'Cash',    status:'Completed' },
    { id:'OGP-003', date:'2026-08-13', customer:'Sunita Verma', metal:'Old Silver 925',grossWt:85.0, stoneWt:0.0, netWt:85.0, purity:0.925, fineWt:78.63, rate:91,   amount:7155,   mode:'UPI',     status:'Completed' },
    { id:'OGP-004', date:'2026-08-12', customer:'Amit Kumar',   metal:'Old Gold 14K',  grossWt:12.0, stoneWt:0.5, netWt:11.5, purity:0.583, fineWt:6.70,  rate:7130, amount:47771,  mode:'Cash',    status:'Completed' },
  ],
  // ---- SALES ----
  sales: [
    { id:'INV-2026-8841', date:'2026-08-16', customer:'Priya Sharma',    type:'Retail',    item:'Kundan Necklace Set',    amount:206000, discount:0,    net:206000, gst:6000,  mode:'UPI',     salesperson:'Karan Mehta',  status:'Paid',    return:false },
    { id:'INV-2026-8840', date:'2026-08-16', customer:'Rajesh Patel',    type:'Retail',    item:'Jhumka Earrings + Chain',amount:155800, discount:5000, net:150800, gst:4524,  mode:'Cash',    salesperson:'Deepika Singh', status:'Paid',    return:false },
    { id:'INV-2026-8839', date:'2026-08-15', customer:'Sunita Verma',    type:'Wholesale', item:'Bridal Set (Kundan)',     amount:261002, discount:0,    net:261002, gst:7830,  mode:'EMI',     salesperson:'Ravi Sharma',  status:'EMI',     return:false },
    { id:'INV-2026-8838', date:'2026-08-14', customer:'Vikram Malhotra', type:'Wholesale', item:'Solitaire Ring 2ct',      amount:1250000,discount:25000,net:1225000,gst:36750, mode:'RTGS',    salesperson:'Ravi Sharma',  status:'Paid',    return:false },
    { id:'INV-2026-8835', date:'2026-08-12', customer:'Deepa Nair',      type:'Retail',    item:'Gold Box Chain 22K',      amount:95400,  discount:0,    net:95400,  gst:2862,  mode:'Card',    salesperson:'Karan Mehta',  status:'Paid',    return:false },
    { id:'INV-2026-8820', date:'2026-08-08', customer:'Priya Sharma',    type:'Retail',    item:'Gold Ring 22K',           amount:48000,  discount:2000, net:46000,  gst:1380,  mode:'UPI',     salesperson:'Karan Mehta',  status:'Returned',return:true  },
    { id:'WHL-2026-0012', date:'2026-08-10', customer:'Suresh Traders',  type:'Online',    item:'Silver Set (5 pcs)',       amount:22000,  discount:1000, net:21000,  gst:630,   mode:'NEFT',    salesperson:'Ravi Sharma',  status:'Delivered',return:false},
    { id:'WHL-2026-0011', date:'2026-08-07', customer:'Meena Jewellers', type:'Wholesale', item:'Gold Bangles (10 pairs)',  amount:520000, discount:10000,net:510000, gst:15300, mode:'Cheque',  salesperson:'Ravi Sharma',  status:'Paid',    return:false },
  ],
  // ---- SALES RETURNS ----
  salesReturns: [
    { id:'RET-2026-0018', date:'2026-08-18', invRef:'INV-2026-8820', customer:'Priya Sharma',    item:'Gold Ring 22K',        reason:'Size issue',      amount:4140,   mode:'Exchange', status:'Completed' },
    { id:'RET-2026-0017', date:'2026-08-14', invRef:'INV-2026-8810', customer:'Vikram Malhotra', item:'Diamond Pendant 18K',  reason:'Defective stone', amount:58000,  mode:'Bank',     status:'Completed' },
    { id:'RET-2026-0016', date:'2026-08-10', invRef:'INV-2026-8795', customer:'Amit Kumar',      item:'Silver Bracelet',      reason:'Customer changed mind',amount:3200,mode:'Store Credit',status:'Completed'},
  ],
  // ---- DELIVERY CHALLANS ----
  challans: [
    { id:'DC-2026-088', date:'2026-08-16', invRef:'INV-2026-8841', customer:'Priya Sharma',    phone:'9876543210', address:'12, Marine Drive, Mumbai', items:'Kundan Necklace Set',    qty:1, deliveredBy:'Karan Mehta',  mode:'Hand Delivery', status:'Delivered' },
    { id:'DC-2026-087', date:'2026-08-14', invRef:'INV-2026-8838', customer:'Vikram Malhotra', phone:'9845612370', address:'90, Ring Road, Surat',     items:'Solitaire Ring 2ct',      qty:1, deliveredBy:'Courier',      mode:'Courier',       status:'In Transit' },
    { id:'DC-2026-086', date:'2026-08-10', invRef:'WHL-2026-0012', customer:'Suresh Traders',  phone:'9812345600', address:'45, Karol Bagh, Delhi',    items:'Silver Set (5 pcs)',       qty:5, deliveredBy:'BlueDart',     mode:'Courier',       status:'Delivered' },
  ],
};

// ---- UTILS ----
function psFmt(n)  { return '₹'+(n||0).toLocaleString('en-IN'); }
function psDate(d) { if(!d) return '—'; const dt=new Date(d); return isNaN(dt)?d:dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function psBadge(s){ const m={'Received':'badge-green','Paid':'badge-green','Delivered':'badge-green','Completed':'badge-green','Approved':'badge-green','Pending':'badge-orange','In Transit':'badge-blue','EMI':'badge-purple','Returned':'badge-red','Overdue':'badge-red','Retail':'badge-gold','Wholesale':'badge-blue','Online':'badge-purple'}; return `<span class="badge ${m[s]||'badge-grey'}">${s}</span>`; }

// ===================================================
// PURCHASE MODULE
// ===================================================
function renderPurchaseOrders() {
  const tbody=document.getElementById('pm-po-tbody'); if(!tbody) return;
  const totAmt=PS.purchases.reduce((s,p)=>s+p.amount,0);
  const totBal=PS.purchases.reduce((s,p)=>s+p.balance,0);
  ['pm-kpi-total','pm-kpi-month','pm-kpi-pending','pm-kpi-orders'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=[psFmt(totAmt),psFmt(PS.purchases.reduce((s,p)=>s+p.total,0)),psFmt(totBal),PS.purchases.length][i];
  });
  tbody.innerHTML = PS.purchases.map(p=>`
    <tr>
      <td><span class="badge badge-gold" style="font-size:.7rem">${p.id}</span></td>
      <td>${psDate(p.date)}</td>
      <td><strong>${p.supplier}</strong></td>
      <td><span class="badge badge-${p.type==='Gold'?'gold':p.type==='Diamond'?'blue':'grey'}" style="font-size:.7rem">${p.type}</span></td>
      <td style="font-size:.82rem">${p.item}</td>
      <td>${p.qty}</td>
      <td>${psFmt(p.rate)}</td>
      <td class="text-gold fw-bold">${psFmt(p.amount)}</td>
      <td class="text-danger">${psFmt(p.gst)}</td>
      <td class="fw-bold">${psFmt(p.total)}</td>
      <td class="text-success">${psFmt(p.paid)}</td>
      <td class="${p.balance>0?'text-danger fw-bold':''}">${p.balance?psFmt(p.balance):'—'}</td>
      <td>${psBadge(p.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="openModal('viewPOModal');document.getElementById('vpo-id').textContent='${p.id}';document.getElementById('vpo-supplier').textContent='${p.supplier}';document.getElementById('vpo-item').textContent='${p.item} (${p.qty})';document.getElementById('vpo-total').textContent='${psFmt(p.total)}';document.getElementById('vpo-balance').textContent='${psFmt(p.balance)}'">👁 View</button>
        ${p.grn?`<span class="badge badge-green" style="font-size:.68rem">GRN ✅</span>`:`<button class="btn btn-gold btn-xs" onclick="createGRN('${p.id}')">📦 GRN</button>`}
        ${p.balance>0?`<button class="btn btn-gold btn-xs" onclick="showToast('Payment recorded for '+p.id,'success')">💳 Pay</button>`:''}
      </td>
    </tr>`).join('');
}

function createGRN(poId) {
  const p=PS.purchases.find(x=>x.id===poId);
  if(!p) return;
  const id='GRN-'+String(PS.grns.length+49).padStart(3,'0');
  PS.grns.unshift({ id, date:new Date().toISOString().slice(0,10), poRef:poId, supplier:p.supplier, item:p.item, qty:p.qty, receivedBy:'Ravi Sharma', condition:'Good', note:'' });
  p.grn=id; p.status='Received';
  renderPurchaseOrders(); renderGRNs();
  showToast(id+' created for '+poId,'success');
}

function renderPurchaseReturns() {
  const tbody=document.getElementById('pm-pr-tbody'); if(!tbody) return;
  tbody.innerHTML = PS.purchaseReturns.map(r=>`
    <tr>
      <td><span class="badge badge-red" style="font-size:.7rem">${r.id}</span></td>
      <td>${psDate(r.date)}</td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${r.poRef}</span></td>
      <td><strong>${r.supplier}</strong></td>
      <td style="font-size:.82rem">${r.item}</td>
      <td>${r.qty}</td>
      <td class="text-danger fw-bold">${psFmt(r.amount)}</td>
      <td style="font-size:.8rem">${r.reason}</td>
      <td><span class="badge badge-blue" style="font-size:.7rem">${r.refund}</span></td>
      <td>${psBadge(r.status)}</td>
    </tr>`).join('');
}

function renderGRNs() {
  const tbody=document.getElementById('pm-grn-tbody'); if(!tbody) return;
  tbody.innerHTML = PS.grns.map(g=>`
    <tr>
      <td><span class="badge badge-green" style="font-size:.7rem">${g.id}</span></td>
      <td>${psDate(g.date)}</td>
      <td><span class="badge badge-gold" style="font-size:.7rem">${g.poRef}</span></td>
      <td><strong>${g.supplier}</strong></td>
      <td style="font-size:.82rem">${g.item}</td>
      <td>${g.qty}</td>
      <td>${g.receivedBy}</td>
      <td><span class="badge badge-${g.condition==='Good'?'green':'orange'}">${g.condition}</span></td>
      <td style="font-size:.78rem;color:var(--text-muted)">${g.note||'—'}</td>
      <td><button class="btn btn-outline btn-xs" onclick="showToast('GRN printed','success')">🖨️</button></td>
    </tr>`).join('');
}

function renderOldMetalPurchase() {
  const tbody=document.getElementById('pm-old-tbody'); if(!tbody) return;
  tbody.innerHTML = PS.oldMetalPurchase.map(o=>`
    <tr>
      <td><span class="badge badge-gold" style="font-size:.7rem">${o.id}</span></td>
      <td>${psDate(o.date)}</td>
      <td><strong>${o.customer}</strong></td>
      <td><span class="badge badge-${o.metal.includes('Silver')?'blue':'gold'}" style="font-size:.72rem">${o.metal}</span></td>
      <td>${o.grossWt}g</td>
      <td>${o.stoneWt}g</td>
      <td class="text-gold fw-bold">${o.fineWt.toFixed(2)}g</td>
      <td>₹${o.rate}/g</td>
      <td class="text-gold fw-bold">${psFmt(o.amount)}</td>
      <td><span class="badge badge-blue" style="font-size:.7rem">${o.mode}</span></td>
      <td>${psBadge(o.status)}</td>
      <td><button class="btn btn-outline btn-xs" onclick="showToast('Slip printed','success')">🖨️ Slip</button></td>
    </tr>`).join('');
}

function renderSupplierLedger() {
  const sel=document.getElementById('pm-sup-sel');
  if(!sel) return;
  // Build supplier list from PS purchases (no dependency on SUP module)
  const suppliers=[...new Set(PS.purchases.map(p=>p.supplier))];
  sel.innerHTML='<option value="">-- Select Supplier --</option>'+suppliers.map(s=>`<option value="${s}">${s}</option>`).join('');
  // Also add from SUP if loaded
  if(window.SUP) {
    SUP.suppliers.forEach(s=>{
      if(!suppliers.includes(s.name)){
        const opt=document.createElement('option');
        opt.value=s.name; opt.textContent=s.name;
        sel.appendChild(opt);
      }
    });
  }
}

function loadPMSupplierLedger(){
  const name=document.getElementById('pm-sup-sel')?.value;
  const tbody=document.getElementById('pm-sup-ledger-tbody');
  if(!tbody) return;
  if(!name){ tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">Select a supplier</td></tr>'; return; }
  const pos=PS.purchases.filter(p=>p.supplier===name);
  if(!pos.length){
    tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">No transactions for ${name}</td></tr>`;
    const sumEl=document.getElementById('pm-sup-bal'); if(sumEl) sumEl.textContent='₹0';
    return;
  }
  let totBal=0;
  tbody.innerHTML=`<tr style="background:var(--primary-glow)"><td colspan="6" style="padding:8px 14px;font-size:.78rem;color:var(--text-muted)">Opening Balance: ₹0</td></tr>`
  +pos.map(p=>{
    totBal+=p.balance;
    return `<tr>
      <td>${psDate(p.date)}</td>
      <td><span class="badge badge-gold" style="font-size:.7rem">${p.id}</span></td>
      <td style="font-size:.82rem">${p.item}</td>
      <td class="text-danger fw-bold">${psFmt(p.total)}</td>
      <td class="text-success">${psFmt(p.paid)}</td>
      <td class="${p.balance>0?'text-danger fw-bold':''}">${psFmt(p.balance)}</td>
    </tr>`;
  }).join('')
  +`<tr style="border-top:2px solid var(--accent);background:var(--primary-glow)">
    <td colspan="4" class="fw-bold" style="padding:10px 14px">Total Outstanding</td>
    <td></td>
    <td class="text-danger fw-bold" style="padding:10px 14px">${psFmt(totBal)}</td>
  </tr>`;
  const sumEl=document.getElementById('pm-sup-bal');
  if(sumEl){ sumEl.textContent=psFmt(totBal); sumEl.style.color=totBal>0?'var(--danger)':'var(--success)'; }
}

function renderSupplierPayments(){
  const tbody=document.getElementById('pm-sup-pay-tbody'); if(!tbody) return;
  // Use PS purchases that have been partially paid as payment records
  const payments=[];
  PS.purchases.filter(p=>p.paid>0).forEach(p=>{
    payments.push({ id:'SPY-'+p.id, suppName:p.supplier, date:p.date, amount:p.paid, mode:'NEFT/RTGS', ref:'UTR-'+Math.floor(Math.random()*9000000000+1000000000), balance:p.balance });
  });
  // Also include from SUP.payments if loaded
  const allPay = window.SUP ? [...payments, ...SUP.payments] : payments;
  if(!allPay.length){
    tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">No payment records</td></tr>';
    return;
  }
  tbody.innerHTML=allPay.map(p=>`
    <tr>
      <td><span class="badge badge-green" style="font-size:.7rem">${p.id}</span></td>
      <td><strong>${p.suppName}</strong></td>
      <td>${psDate(p.date)}</td>
      <td class="text-success fw-bold">${psFmt(p.amount)}</td>
      <td><span class="badge badge-blue" style="font-size:.7rem">${p.mode}</span></td>
      <td style="font-family:monospace;font-size:.75rem;color:var(--text-muted)">${p.ref}</td>
      <td class="${p.balance>0?'text-danger':''}">${psFmt(p.balance)}</td>
      <td><button class="btn btn-outline btn-xs" onclick="showToast('Receipt printed','success')">🖨️</button></td>
    </tr>`).join('');
}

function initPurchaseModule(){
  renderPurchaseOrders();
  renderPurchaseReturns();
  renderGRNs();
  renderOldMetalPurchase();
  renderSupplierLedger();
  renderSupplierPayments();
}

// ===================================================
// SALES MODULE
// ===================================================
function renderSalesRegister(typeFilter){
  const tbody=document.getElementById('sm-sales-tbody'); if(!tbody) return;
  const lq=(document.getElementById('sm-search')?.value||'').toLowerCase();
  let data=PS.sales;
  if(typeFilter&&typeFilter!=='All') data=data.filter(s=>s.type===typeFilter);
  if(lq) data=data.filter(s=>s.customer.toLowerCase().includes(lq)||s.id.toLowerCase().includes(lq));
  const totNet=data.reduce((s,x)=>s+x.net,0);
  const totRet=data.filter(x=>x.return).reduce((s,x)=>s+x.net,0);
  ['sm-kpi-sales','sm-kpi-bills','sm-kpi-returns','sm-kpi-avg'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=[psFmt(totNet),data.length,psFmt(totRet),psFmt(Math.round(totNet/data.length))][i];
  });
  tbody.innerHTML=data.map(s=>`
    <tr style="${s.return?'background:rgba(231,76,60,.04)':''}">
      <td><span class="badge badge-gold" style="font-size:.7rem">${s.id}</span></td>
      <td>${psDate(s.date)}</td>
      <td><strong>${s.customer}</strong></td>
      <td>${psBadge(s.type)}</td>
      <td style="font-size:.82rem;max-width:180px">${s.item}</td>
      <td class="text-gold fw-bold">${psFmt(s.amount)}</td>
      <td class="text-danger">${s.discount?psFmt(s.discount):'—'}</td>
      <td class="text-success fw-bold">${psFmt(s.net)}</td>
      <td>${psFmt(s.gst)}</td>
      <td><span class="badge badge-${s.mode==='Cash'?'grey':s.mode==='UPI'?'green':'blue'}" style="font-size:.7rem">${s.mode}</span></td>
      <td style="font-size:.78rem">${s.salesperson}</td>
      <td>${psBadge(s.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="showToast('Invoice printed','success')">🧾</button>
        ${!s.return?`<button class="btn btn-outline btn-xs" onclick="openModal('newSalesReturnModal');document.getElementById('sr-inv').value='${s.id}';document.getElementById('sr-cust').value='${s.customer}'">↩️</button>`:''}
        <button class="btn btn-outline btn-xs" onclick="showToast('Challan generated','success')">📄 DC</button>
      </td>
    </tr>`).join('');
}

function renderSalesReturns(){
  const tbody=document.getElementById('sm-ret-tbody'); if(!tbody) return;
  tbody.innerHTML=PS.salesReturns.map(r=>`
    <tr>
      <td><span class="badge badge-red" style="font-size:.7rem">${r.id}</span></td>
      <td>${psDate(r.date)}</td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${r.invRef}</span></td>
      <td><strong>${r.customer}</strong></td>
      <td style="font-size:.82rem">${r.item}</td>
      <td style="font-size:.8rem">${r.reason}</td>
      <td class="text-danger fw-bold">${psFmt(r.amount)}</td>
      <td><span class="badge badge-blue" style="font-size:.72rem">${r.mode}</span></td>
      <td>${psBadge(r.status)}</td>
    </tr>`).join('');
}

function renderChallans(){
  const tbody=document.getElementById('sm-dc-tbody'); if(!tbody) return;
  tbody.innerHTML=PS.challans.map(c=>`
    <tr>
      <td><span class="badge badge-blue" style="font-size:.7rem">${c.id}</span></td>
      <td>${psDate(c.date)}</td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${c.invRef}</span></td>
      <td><strong>${c.customer}</strong></td>
      <td>${c.phone}</td>
      <td style="font-size:.8rem;max-width:160px">${c.address}</td>
      <td style="font-size:.82rem">${c.items}</td>
      <td class="fw-bold">${c.qty}</td>
      <td>${c.deliveredBy}</td>
      <td><span class="badge badge-blue" style="font-size:.7rem">${c.mode}</span></td>
      <td>${psBadge(c.status)}</td>
      <td><button class="btn btn-outline btn-xs" onclick="showToast('Challan printed','success')">🖨️</button></td>
    </tr>`).join('');
}

function saveSalesReturn(){
  const inv=document.getElementById('sr-inv')?.value?.trim();
  const cust=document.getElementById('sr-cust')?.value?.trim();
  const item=document.getElementById('sr-item')?.value?.trim();
  const reason=document.getElementById('sr-reason')?.value;
  const amount=parseFloat(document.getElementById('sr-amount')?.value)||0;
  const mode=document.getElementById('sr-mode')?.value;
  if(!inv||!item||amount<=0){showToast('Fill all required fields','error');return;}
  const id='RET-2026-'+String(PS.salesReturns.length+19).padStart(4,'0');
  PS.salesReturns.unshift({id,date:new Date().toISOString().slice(0,10),invRef:inv,customer:cust,item,reason,amount,mode,status:'Completed'});
  const s=PS.sales.find(x=>x.id===inv);
  if(s){s.return=true;s.status='Returned';}
  closeModal('newSalesReturnModal');
  renderSalesReturns();renderSalesRegister();
  showToast(id+' processed — '+psFmt(amount),'success');
}

function initSalesModule(){
  renderSalesRegister();
  renderSalesReturns();
  renderChallans();
}

document.addEventListener('DOMContentLoaded',()=>{
  const orig=window.showModule;
  if(typeof orig==='function'){
    window.showModule=function(m,n){
      orig(m,n);
      if(m==='purchase') setTimeout(initPurchaseModule,60);
      if(m==='sales')    setTimeout(initSalesModule,60);
    };
  }
});

// ---- SUB-TAB RENDERERS (Retail / Wholesale / Online) ----
function renderSalesRetail(){
  const tbody=document.getElementById('sm-retail-tbody'); if(!tbody) return;
  const data=PS.sales.filter(s=>s.type==='Retail');
  tbody.innerHTML=data.map(s=>`<tr>
    <td><span class="badge badge-gold" style="font-size:.7rem">${s.id}</span></td>
    <td>${psDate(s.date)}</td><td><strong>${s.customer}</strong></td>
    <td style="font-size:.82rem">${s.item}</td>
    <td class="text-gold fw-bold">${psFmt(s.amount)}</td>
    <td>${s.discount?psFmt(s.discount):'—'}</td>
    <td class="text-success fw-bold">${psFmt(s.net)}</td>
    <td><span class="badge badge-${s.mode==='Cash'?'grey':'green'}" style="font-size:.7rem">${s.mode}</span></td>
    <td style="font-size:.78rem">${s.salesperson}</td>
    <td>${psBadge(s.status)}</td>
    <td><button class="btn btn-outline btn-xs" onclick="showToast('Invoice printed','success')">🧾</button></td>
  </tr>`).join('');
}

function renderSalesWholesale(){
  const tbody=document.getElementById('sm-wholesale-tbody'); if(!tbody) return;
  const data=PS.sales.filter(s=>s.type==='Wholesale');
  tbody.innerHTML=data.map(s=>`<tr>
    <td><span class="badge badge-blue" style="font-size:.7rem">${s.id}</span></td>
    <td>${psDate(s.date)}</td><td><strong>${s.customer}</strong></td>
    <td style="font-size:.82rem">${s.item}</td>
    <td class="text-gold fw-bold">${psFmt(s.amount)}</td>
    <td>${s.discount?psFmt(s.discount):'—'}</td>
    <td class="text-success fw-bold">${psFmt(s.net)}</td>
    <td><span class="badge badge-blue" style="font-size:.7rem">${s.mode}</span></td>
    <td style="font-size:.78rem">${s.salesperson}</td>
    <td>${psBadge(s.status)}</td>
    <td><button class="btn btn-outline btn-xs" onclick="showToast('Invoice printed','success')">🧾</button></td>
  </tr>`).join('');
}

function renderSalesOnline(){
  const tbody=document.getElementById('sm-online-tbody'); if(!tbody) return;
  const data=PS.sales.filter(s=>s.type==='Online');
  if(!data.length){
    tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">No online sales yet</td></tr>';
    return;
  }
  tbody.innerHTML=data.map(s=>`<tr>
    <td><span class="badge badge-purple" style="font-size:.7rem">${s.id}</span></td>
    <td>${psDate(s.date)}</td><td><strong>${s.customer}</strong></td>
    <td style="font-size:.82rem">${s.item}</td>
    <td class="text-gold fw-bold">${psFmt(s.amount)}</td>
    <td class="text-success fw-bold">${psFmt(s.net)}</td>
    <td><span class="badge badge-blue" style="font-size:.7rem">${s.mode}</span></td>
    <td>${psBadge(s.status)}</td>
    <td><button class="btn btn-outline btn-xs" onclick="showToast('Invoice printed','success')">🧾</button></td>
  </tr>`).join('');
}

// ---- PENDING ORDERS ----
function renderSalesPending(){
  const el=document.getElementById('sm-pending-content'); if(!el) return;
  // Pending = EMI active, credit, or advance balance remaining from orders
  const pending = [
    ...PS.sales.filter(s=>s.status==='EMI'),
    ...(window.EMID ? EMID.plans.filter(p=>p.status!=='Closed').map(p=>({
      id:p.id, date:p.startDate, customer:p.custName, type:'EMI Plan',
      item:p.item, amount:p.total, net:p.emiAmt*(p.months-p.paid),
      mode:'EMI', salesperson:'—', status:'Pending EMI'
    })) : []),
  ];
  if(!pending.length){
    el.innerHTML='<div class="card"><div style="text-align:center;padding:30px;color:var(--success)">✅ No pending orders!</div></div>';
    return;
  }
  el.innerHTML=`<div class="card">
    <div class="card-header"><div class="card-title">⏳ Pending Orders / EMI</div><button class="btn btn-outline btn-sm" onclick="showModule('emi',null)">🗓️ Manage EMI</button></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Ref ID</th><th>Date</th><th>Customer</th><th>Type</th><th>Item</th><th>Total</th><th>Pending Amt</th><th>Mode</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${pending.map(s=>`<tr>
        <td><span class="badge badge-orange" style="font-size:.7rem">${s.id}</span></td>
        <td>${psDate(s.date)}</td><td><strong>${s.customer}</strong></td>
        <td>${psBadge(s.type)}</td>
        <td style="font-size:.82rem">${s.item}</td>
        <td class="text-gold fw-bold">${psFmt(s.amount)}</td>
        <td class="text-danger fw-bold">${psFmt(s.net)}</td>
        <td><span class="badge badge-purple" style="font-size:.7rem">${s.mode}</span></td>
        <td>${psBadge(s.status)}</td>
        <td><button class="btn btn-gold btn-xs" onclick="showModule('emi',null)">💳 Collect</button>
            <button class="btn btn-outline btn-xs" onclick="showToast('Reminder sent','success')">📱</button></td>
      </tr>`).join('')}</tbody>
    </table></div>
  </div>`;
}

// ---- ADVANCE ORDERS ----
function renderSalesAdvance(){
  const el=document.getElementById('sm-advance-content'); if(!el) return;
  // Pull from XRO.orders (advance bookings) if available
  const orders = window.XRO ? XRO.orders.filter(o=>o.status!=='Delivered') : [];
  const advSales = PS.sales.filter(s=>s.id.startsWith('WHL'));
  el.innerHTML=`
  <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">
    <div class="stat-card purple"><div class="stat-icon purple">📅</div><div class="stat-value">${orders.length||6}</div><div class="stat-label">Active Advance Orders</div></div>
    <div class="stat-card"><div class="stat-icon gold">💰</div><div class="stat-value">₹8.4L</div><div class="stat-label">Advance Collected</div></div>
    <div class="stat-card green"><div class="stat-icon green">✅</div><div class="stat-value">${orders.filter?.(o=>o.status==='Ready').length||1}</div><div class="stat-label">Ready to Deliver</div></div>
    <div class="stat-card red"><div class="stat-icon red">⏰</div><div class="stat-value">${orders.filter?.(o=>o.status==='Overdue').length||1}</div><div class="stat-label">Overdue</div></div>
  </div>
  <div class="card">
    <div class="card-header"><div class="card-title">📅 Advance Orders</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" onclick="showModule('orders',null)">📋 Full Order Management</button>
        <button class="btn btn-gold btn-sm" onclick="showModule('orders',null);setTimeout(()=>openModal('addOrderModal'),200)">➕ New Advance Order</button>
      </div>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Order ID</th><th>Customer</th><th>Type</th><th>Item</th><th>Est. Amt</th><th>Advance</th><th>Balance</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${orders.length ? orders.map(o=>`<tr>
        <td><span class="badge badge-${o.type==='Bridal'?'purple':o.type==='Custom'?'blue':'gold'}" style="font-size:.7rem">${o.id}</span></td>
        <td><strong>${o.custName}</strong></td>
        <td><span class="badge badge-${o.type==='Bridal'?'purple':'blue'}" style="font-size:.7rem">${o.type}</span></td>
        <td style="font-size:.82rem">${o.item.slice(0,40)}${o.item.length>40?'...':''}</td>
        <td class="text-gold fw-bold">₹${o.estAmt.toLocaleString('en-IN')}</td>
        <td class="text-success fw-bold">₹${o.advancePaid.toLocaleString('en-IN')}</td>
        <td class="${o.balance>0?'text-danger fw-bold':''}">₹${o.balance.toLocaleString('en-IN')}</td>
        <td style="color:${new Date(o.dueDate)<new Date()?'var(--danger)':'var(--text-muted)'};font-weight:700">${psDate(o.dueDate)}</td>
        <td><span class="badge badge-${o.status==='Ready'?'green':o.status==='Overdue'?'red':o.status==='Manufacturing'?'blue':'orange'}">${o.status}</span></td>
        <td style="white-space:nowrap">
          <button class="btn btn-outline btn-xs" onclick="showModule('orders',null)">📋 View</button>
          ${o.balance>0?`<button class="btn btn-gold btn-xs" onclick="showToast('Collecting balance for '+o.id,'info')">💳 Collect</button>`:''}
        </td>
      </tr>`).join('') : `<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text-muted)">No advance orders. <a href="#" onclick="showModule('orders',null)" style="color:var(--accent)">Go to Order Booking →</a></td></tr>`}
      </tbody>
    </table></div>
  </div>`;
}

// Override initSalesModule to also render sub-tabs when switching
const _origInitSales = window.initSalesModule;
window.initSalesModule = function(){
  if(_origInitSales) _origInitSales();
  renderSalesRetail();
  renderSalesWholesale();
  renderSalesOnline();
  renderSalesPending();
  renderSalesAdvance();
};
