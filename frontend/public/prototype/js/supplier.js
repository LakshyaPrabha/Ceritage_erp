/* ===================================================
   CERITAGE JEWELRY ERP — Supplier Management
   5 Features: Registration · Ledger · Payments · Purchase History · Report
   =================================================== */
const SUP = {
  suppliers: [
    { id:'S001', name:'Zaveri Bullion Pvt Ltd',   contact:'Ramesh Zaveri',   phone:'9812345678', email:'zaveri@bullion.com',  city:'Mumbai',  state:'Maharashtra', gstin:'27AABCZ1234B1Z5', pan:'AABCZ1234B', type:'Gold',      rating:4.8, creditLimit:2000000, outstanding:450000, totalPurchased:18400000, joined:'2020-01-10', status:'Active',   bank:'SBI-1234567890', ifsc:'SBIN0001234' },
    { id:'S002', name:'Diamond Palace',            contact:'Sanjay Shah',     phone:'9845678901', email:'info@diamondpalace.com',city:'Surat',  state:'Gujarat',     gstin:'24AABCD5678B1Z3', pan:'AABCD5678B', type:'Diamond',   rating:4.6, creditLimit:1000000, outstanding:180000, totalPurchased:6800000,  joined:'2021-03-15', status:'Active',   bank:'HDFC-2345678901',ifsc:'HDFC0002345' },
    { id:'S003', name:'Rajasthan Stone Works',     contact:'Mukesh Meena',    phone:'9723456789', email:'raj.stone@gmail.com', city:'Jaipur',  state:'Rajasthan',   gstin:'08AABCR9012B1Z1', pan:'AABCR9012B', type:'Gemstones', rating:4.3, creditLimit:500000,  outstanding:75000,  totalPurchased:2800000,  joined:'2022-06-20', status:'Active',   bank:'PNB-3456789012', ifsc:'PUNB0003456' },
    { id:'S004', name:'Ratanlal & Sons',           contact:'Ratanlal Gupta',  phone:'9634567890', email:'ratanlal@sons.com',   city:'Jaipur',  state:'Rajasthan',   gstin:'08AABCR3456C1Z4', pan:'AABCR3456C', type:'Silver',    rating:4.5, creditLimit:300000,  outstanding:60000,  totalPurchased:1900000,  joined:'2021-09-05', status:'Active',   bank:'SBI-4567890123', ifsc:'SBIN0004567' },
    { id:'S005', name:'Gem World Exports',         contact:'Dinesh Patel',    phone:'9545678901', email:'gemworld@exports.com',city:'Mumbai',  state:'Maharashtra', gstin:'27AABCG7890D1Z5', pan:'AABCG7890D', type:'Gemstones', rating:4.1, creditLimit:400000,  outstanding:120000, totalPurchased:1200000,  joined:'2022-11-18', status:'Active',   bank:'HDFC-5678901234',ifsc:'HDFC0005678' },
    { id:'S006', name:'Silver Craft Industries',   contact:'Anand Verma',     phone:'9456789012', email:'silvercraft@ind.com', city:'Agra',    state:'UP',          gstin:'09AABCS2345E1Z6', pan:'AABCS2345E', type:'Silver',    rating:3.9, creditLimit:200000,  outstanding:0,      totalPurchased:800000,   joined:'2023-04-12', status:'Active',   bank:'BOB-6789012345', ifsc:'BARB0006789' },
    { id:'S007', name:'KDM Gold Refinery',         contact:'Harish Khanna',   phone:'9367890123', email:'kdm@refinery.com',   city:'Ahmedabad',state:'Gujarat',    gstin:'24AABCK4567F1Z7', pan:'AABCK4567F', type:'Gold',      rating:4.7, creditLimit:3000000, outstanding:0,      totalPurchased:12000000, joined:'2019-08-20', status:'Active',   bank:'SBI-7890123456', ifsc:'SBIN0007890' },
    { id:'S008', name:'National Platinum Works',   contact:'Suresh Iyer',     phone:'9278901234', email:'natplat@works.com',  city:'Chennai', state:'Tamil Nadu',  gstin:'33AABCN5678G1Z8', pan:'AABCN5678G', type:'Platinum',  rating:4.4, creditLimit:500000,  outstanding:0,      totalPurchased:1600000,  joined:'2023-02-28', status:'Inactive', bank:'HDFC-8901234567',ifsc:'HDFC0008901' },
  ],

  ledger: {
    S001: [
      { date:'2026-08-16', desc:'Purchase PO-2026-148 — Gold Bar 100g',   dr:0,       cr:724000,  bal:724000  },
      { date:'2026-08-16', desc:'Payment — NEFT',                          dr:274000,  cr:0,       bal:450000  },
      { date:'2026-08-01', desc:'Opening Balance',                         dr:0,       cr:450000,  bal:450000  },
    ],
    S002: [
      { date:'2026-08-12', desc:'Purchase PO-2026-147 — Diamond 10 pcs',  dr:0,       cr:280000,  bal:280000  },
      { date:'2026-08-12', desc:'Advance paid',                            dr:100000,  cr:0,       bal:180000  },
    ],
    S003: [
      { date:'2026-08-14', desc:'Purchase PO-2026-146 — Emerald 20 pcs',  dr:0,       cr:75000,   bal:75000   },
    ],
  },

  purchases: [
    { id:'PO-2026-148', suppId:'S001', suppName:'Zaveri Bullion',      item:'Gold Bar 22K 100g',        qty:'100g',   rate:'₹7,240/g', amount:724000,  date:'2026-08-16', status:'Received', invoice:'ZINV-2026-0089' },
    { id:'PO-2026-147', suppId:'S002', suppName:'Diamond Palace',      item:'Diamond Rounds 0.5ct 10pc',qty:'10 pcs', rate:'₹28,000/ct',amount:280000, date:'2026-08-12', status:'Pending',  invoice:'—' },
    { id:'PO-2026-146', suppId:'S003', suppName:'Rajasthan Stone Works',item:'Emerald Stones 20 pcs',   qty:'20 pcs', rate:'₹3,750/pc', amount:75000,  date:'2026-08-14', status:'Received', invoice:'RSW-2026-0334' },
    { id:'PO-2026-145', suppId:'S001', suppName:'Zaveri Bullion',      item:'Gold Bar 22K 50g',         qty:'50g',    rate:'₹7,200/g', amount:360000,  date:'2026-08-08', status:'Received', invoice:'ZINV-2026-0086' },
    { id:'PO-2026-144', suppId:'S007', suppName:'KDM Gold Refinery',   item:'Gold Bar 24K 80g',         qty:'80g',    rate:'₹7,890/g', amount:631200,  date:'2026-08-05', status:'Received', invoice:'KDM-2026-1221'  },
    { id:'PO-2026-143', suppId:'S004', suppName:'Ratanlal & Sons',     item:'Silver 925 — 500g',        qty:'500g',   rate:'₹92/g',    amount:46000,   date:'2026-08-03', status:'Received', invoice:'RS-2026-0567'   },
    { id:'PO-2026-142', suppId:'S002', suppName:'Diamond Palace',      item:'Diamond Set 2ct Oval',     qty:'1 pc',   rate:'₹120,000', amount:120000,  date:'2026-07-28', status:'Received', invoice:'DP-2026-0221'   },
  ],

  payments: [
    { id:'SP001', suppId:'S001', suppName:'Zaveri Bullion',      date:'2026-08-16', amount:274000, mode:'NEFT',     ref:'UTR-6789012345', poRef:'PO-2026-148', remark:'Part payment', balance:450000 },
    { id:'SP002', suppId:'S002', suppName:'Diamond Palace',      date:'2026-08-12', amount:100000, mode:'RTGS',     ref:'UTR-5678901234', poRef:'PO-2026-147', remark:'Advance 50%',  balance:180000 },
    { id:'SP003', suppId:'S007', suppName:'KDM Gold Refinery',   date:'2026-08-05', amount:631200, mode:'RTGS',     ref:'UTR-4567890123', poRef:'PO-2026-144', remark:'Full payment', balance:0      },
    { id:'SP004', suppId:'S004', suppName:'Ratanlal & Sons',     date:'2026-08-03', amount:46000,  mode:'NEFT',     ref:'UTR-3456789012', poRef:'PO-2026-143', remark:'Full payment', balance:0      },
    { id:'SP005', suppId:'S001', suppName:'Zaveri Bullion',      date:'2026-08-08', amount:360000, mode:'RTGS',     ref:'UTR-2345678901', poRef:'PO-2026-145', remark:'Full payment', balance:0      },
  ],
};

// ---- Utils ----
function supFmt(n)  { return '₹' + (n||0).toLocaleString('en-IN'); }
function supDate(d) { if(!d) return '—'; const dt=new Date(d); return isNaN(dt)?d:dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function supBadge(s){ const m={'Active':'badge-green','Inactive':'badge-red','Received':'badge-green','Pending':'badge-orange','Paid':'badge-green','Partial':'badge-orange'}; return `<span class="badge ${m[s]||'badge-grey'}">${s}</span>`; }
function supTypeColor(t){ const m={Gold:'#f0c040',Diamond:'#3498db',Gemstones:'#9b59b6',Silver:'#95a5a6',Platinum:'#bdc3c7'}; return m[t]||'var(--text-muted)'; }

// ---- 1. Supplier Registration ----
let supFilter = { search:'', type:'' };
function renderSuppliers() {
  const tbody = document.getElementById('sup-tbody');
  if (!tbody) return;
  const lq = supFilter.search.toLowerCase();
  const data = SUP.suppliers.filter(s => {
    const ms = !lq || s.name.toLowerCase().includes(lq) || s.id.includes(lq) || s.city.toLowerCase().includes(lq);
    return ms && (!supFilter.type || s.type === supFilter.type);
  });
  document.getElementById('sup-kpi-total')  && (document.getElementById('sup-kpi-total').textContent  = SUP.suppliers.length);
  document.getElementById('sup-kpi-active') && (document.getElementById('sup-kpi-active').textContent = SUP.suppliers.filter(s=>s.status==='Active').length);
  document.getElementById('sup-kpi-due')    && (document.getElementById('sup-kpi-due').textContent    = supFmt(SUP.suppliers.reduce((s,x)=>s+x.outstanding,0)));
  document.getElementById('sup-kpi-month')  && (document.getElementById('sup-kpi-month').textContent  = supFmt(SUP.purchases.reduce((s,p)=>s+p.amount,0)));

  tbody.innerHTML = data.map(s => `
    <tr>
      <td><span class="badge badge-grey" style="font-size:.7rem">${s.id}</span></td>
      <td>
        <div style="font-weight:700">${s.name}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">${s.contact} · ${s.city}</div>
      </td>
      <td><span style="font-weight:700;color:${supTypeColor(s.type)}">${s.type}</span></td>
      <td>${s.phone}</td>
      <td style="font-size:.78rem;font-family:monospace">${s.gstin}</td>
      <td class="text-gold fw-bold">${supFmt(s.totalPurchased)}</td>
      <td class="${s.outstanding>0?'text-danger fw-bold':''}">${supFmt(s.outstanding)}</td>
      <td><span style="color:#f0c040">★</span> ${s.rating}</td>
      <td>${supBadge(s.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="openSupProfile('${s.id}')">👁</button>
        <button class="btn btn-outline btn-xs" onclick="openSupLedger('${s.id}')">📒</button>
        <button class="btn btn-gold btn-xs" onclick="openSupPayModal('${s.id}')">💳 Pay</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text-muted)">No suppliers found</td></tr>`;
}

function openSupProfile(id) {
  const s = SUP.suppliers.find(x=>x.id===id);
  if (!s) return;
  openModal('supProfileModal');
  const set=(el,v)=>{ const e=document.getElementById(el); if(e) e.textContent=v||'—'; };
  set('spm-name',s.name); set('spm-id',s.id); set('spm-contact',s.contact);
  set('spm-phone',s.phone); set('spm-email',s.email); set('spm-city',s.city+', '+s.state);
  set('spm-gstin',s.gstin); set('spm-pan',s.pan); set('spm-type',s.type);
  set('spm-joined',supDate(s.joined)); set('spm-bank',s.bank+' ('+s.ifsc+')');
  set('spm-rating','★ '+s.rating); set('spm-limit',supFmt(s.creditLimit));
  set('spm-total',supFmt(s.totalPurchased)); set('spm-due',supFmt(s.outstanding));
  document.getElementById('spm-due') && (document.getElementById('spm-due').style.color=s.outstanding>0?'var(--danger)':'var(--success)');
  document.getElementById('spm-status') && (document.getElementById('spm-status').innerHTML=supBadge(s.status));
}

// ---- 2. Supplier Ledger ----
let activeSupLedger = '';
function renderSupLedger() {
  const sel = document.getElementById('sup-ledger-sel');
  if (sel && !sel.options.length || sel?.options[0]?.value==='') {
    sel.innerHTML = '<option value="">-- Select Supplier --</option>' + SUP.suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  }
}
function openSupLedger(id) {
  showTab('sup-ledger', document.querySelector('#suppliers .tab:nth-child(2)'), document.getElementById('suppliers'));
  document.querySelectorAll('#suppliers .tab').forEach((t,i)=>t.classList.toggle('active',i===1));
  renderSupLedger();
  const sel = document.getElementById('sup-ledger-sel');
  if (sel) { sel.value = id; loadSupLedger(); }
}
function loadSupLedger() {
  const id    = document.getElementById('sup-ledger-sel')?.value;
  const tbody = document.getElementById('sup-ledger-tbody');
  const s     = SUP.suppliers.find(x=>x.id===id);
  const sumEl = document.getElementById('sup-ledger-summary');
  if (!tbody) return;
  if (!id) { tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">Select a supplier</td></tr>'; return; }
  const rows = SUP.ledger[id] || [];
  tbody.innerHTML = rows.length ? rows.map((r,i)=>`
    <tr>
      <td>${i+1}</td><td>${supDate(r.date)}</td><td>${r.desc}</td>
      <td class="${r.dr?'text-success fw-bold':''}">${r.dr?supFmt(r.dr):'—'}</td>
      <td class="${r.cr?'text-danger fw-bold':''}">${r.cr?supFmt(r.cr):'—'}</td>
      <td class="text-gold fw-bold">${supFmt(r.bal)}</td>
    </tr>`).join('') : `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">No ledger entries for ${s?.name}</td></tr>`;
  if (sumEl && s) sumEl.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px">
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:.7rem;color:var(--text-muted)">Total Purchased</div><div class="text-gold fw-bold">${supFmt(s.totalPurchased)}</div>
      </div>
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:.7rem;color:var(--text-muted)">Outstanding</div><div style="font-weight:700;color:${s.outstanding>0?'var(--danger)':'var(--success)'}">${supFmt(s.outstanding)}</div>
      </div>
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:.7rem;color:var(--text-muted)">Credit Limit</div><div class="text-gold fw-bold">${supFmt(s.creditLimit)}</div>
      </div>
    </div>`;
}

// ---- 3. Supplier Payments ----
function renderSupPayments() {
  const tbody = document.getElementById('sup-pay-tbody');
  if (!tbody) return;
  tbody.innerHTML = SUP.payments.map(p => `
    <tr>
      <td><span class="badge badge-green" style="font-size:.7rem">${p.id}</span></td>
      <td><strong>${p.suppName}</strong></td>
      <td>${supDate(p.date)}</td>
      <td class="text-success fw-bold">${supFmt(p.amount)}</td>
      <td><span class="badge badge-blue" style="font-size:.72rem">${p.mode}</span></td>
      <td style="font-family:monospace;font-size:.78rem">${p.ref}</td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${p.poRef}</span></td>
      <td style="font-size:.78rem;color:var(--text-muted)">${p.remark}</td>
      <td class="${p.balance>0?'text-danger':''}">${supFmt(p.balance)}</td>
      <td><button class="btn btn-outline btn-xs" onclick="showToast('Receipt printed','success')">🖨️</button></td>
    </tr>`).join('');

  // pending table
  const pending = document.getElementById('sup-pending-tbody');
  if (pending) {
    const withDue = SUP.suppliers.filter(s=>s.outstanding>0);
    pending.innerHTML = withDue.map(s=>`
      <tr>
        <td><strong>${s.name}</strong></td>
        <td><span style="color:${supTypeColor(s.type)}">${s.type}</span></td>
        <td class="text-danger fw-bold">${supFmt(s.outstanding)}</td>
        <td>${supFmt(s.creditLimit)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-gold btn-xs" onclick="openSupPayModal('${s.id}')">💳 Pay Now</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:14px;color:var(--success)">✅ No pending dues</td></tr>';
  }
}

function openSupPayModal(id) {
  const s = SUP.suppliers.find(x=>x.id===id);
  if (!s) return;
  openModal('supPaymentModal');
  document.getElementById('sp-sup-name').textContent = s.name;
  document.getElementById('sp-outstanding').textContent = supFmt(s.outstanding);
  document.getElementById('sp-bank').textContent = s.bank + ' (' + s.ifsc + ')';
  document.getElementById('sp-sup-id').value = id;
  document.getElementById('sp-amount').value = s.outstanding || '';
}

function saveSupPayment() {
  const id     = document.getElementById('sp-sup-id')?.value;
  const amount = parseFloat(document.getElementById('sp-amount')?.value)||0;
  const mode   = document.getElementById('sp-mode')?.value;
  const ref    = document.getElementById('sp-ref')?.value?.trim();
  const remark = document.getElementById('sp-remark')?.value?.trim();
  const s = SUP.suppliers.find(x=>x.id===id);
  if (!s||amount<=0) { showToast('Enter valid amount','error'); return; }
  const paid = Math.min(amount, s.outstanding);
  s.outstanding = Math.max(0, s.outstanding - paid);
  SUP.payments.unshift({ id:'SP'+Date.now(), suppId:id, suppName:s.name, date:new Date().toISOString().slice(0,10), amount:paid, mode, ref:ref||'PAY'+Date.now().toString().slice(-6), poRef:'—', remark:remark||'Payment', balance:s.outstanding });
  if (!SUP.ledger[id]) SUP.ledger[id]=[];
  SUP.ledger[id].unshift({ date:new Date().toISOString().slice(0,10), desc:'Payment — '+mode, dr:paid, cr:0, bal:s.outstanding });
  closeModal('supPaymentModal');
  renderSupPayments(); renderSuppliers(); renderSupReport();
  showToast(supFmt(paid)+' paid to '+s.name, 'success');
}

// ---- 4. Purchase History ----
function renderSupPurchases(suppId) {
  const tbody = document.getElementById('sup-pur-tbody');
  if (!tbody) return;
  const data = suppId ? SUP.purchases.filter(p=>p.suppId===suppId) : SUP.purchases;
  tbody.innerHTML = data.map(p => `
    <tr>
      <td><span class="badge badge-gold" style="font-size:.7rem">${p.id}</span></td>
      <td><strong>${p.suppName}</strong></td>
      <td style="max-width:200px;font-size:.82rem">${p.item}</td>
      <td>${p.qty}</td>
      <td>${p.rate}</td>
      <td class="text-gold fw-bold">${supFmt(p.amount)}</td>
      <td>${supDate(p.date)}</td>
      <td style="font-size:.78rem;font-family:monospace">${p.invoice}</td>
      <td>${supBadge(p.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="showToast('PO printed','success')">🖨️</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text-muted)">No purchases found</td></tr>`;
}

// ---- 5. Supplier Report ----
function renderSupReport() {
  const grid = document.getElementById('sup-report-grid');
  if (!grid) return;
  const sorted = [...SUP.suppliers].filter(s=>s.status==='Active').sort((a,b)=>b.totalPurchased-a.totalPurchased);
  const maxPur = sorted[0]?.totalPurchased || 1;
  grid.innerHTML = sorted.map((s,i) => {
    const pct = Math.round((s.totalPurchased/maxPur)*100);
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
    return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <div style="font-weight:800;font-size:.9rem">${medal} ${s.name}</div>
          <div style="font-size:.73rem;color:var(--text-muted)">${s.id} · ${s.city} · <span style="color:${supTypeColor(s.type)}">${s.type}</span></div>
          <div style="margin-top:4px"><span style="color:#f0c040">★</span> ${s.rating} rating</div>
        </div>
        ${supBadge(s.status)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:.9rem;font-weight:800;color:var(--accent)">${supFmt(s.totalPurchased)}</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Total Purchased</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:.9rem;font-weight:800;color:${s.outstanding>0?'var(--danger)':'var(--success)'}">${supFmt(s.outstanding)}</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Outstanding</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:.9rem;font-weight:800;color:var(--info)">${supFmt(s.creditLimit)}</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Credit Limit</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:.9rem;font-weight:800;color:var(--text-muted)">${SUP.purchases.filter(p=>p.suppId===s.id).length}</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Total Orders</div>
        </div>
      </div>
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:4px"><span>Purchase Volume</span><span class="fw-bold">${pct}%</span></div>
        <div class="progress" style="height:6px"><div class="progress-bar" style="width:${pct}%;background:${supTypeColor(s.type)}"></div></div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-outline btn-sm" style="flex:1;font-size:.75rem" onclick="openSupProfile('${s.id}')">👁 Profile</button>
        <button class="btn btn-gold btn-sm" style="flex:1;font-size:.75rem" onclick="openSupPayModal('${s.id}')">💳 Pay</button>
      </div>
    </div>`;
  }).join('');
}

function initSupplierModule() {
  renderSuppliers();
  renderSupLedger();
  renderSupPayments();
  renderSupPurchases();
  renderSupReport();
}

document.addEventListener('DOMContentLoaded', () => {
  const orig = window.showModule;
  if (typeof orig === 'function') {
    window.showModule = function(m, n) { orig(m,n); if(m==='suppliers') setTimeout(initSupplierModule,60); };
  }
});
