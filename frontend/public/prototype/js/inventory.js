/* ===================================================
   CERITAGE JEWELRY ERP — Inventory Management Module
   All 17 Features
   =================================================== */

// ============================================================
// SAMPLE DATA
// ============================================================
const INV = {

  // ---- LIVE STOCK ----
  stock: [
    { id:'STK001', sku:'NK-KND-001', name:'Kundan Necklace Set',    cat:'Necklace',  jwlCat:'Gold',    purity:'22K', grossWt:29.0, netWt:28.5, qty:3,  minQty:2,  reorder:5,  mrp:206000, costPrice:185000, branch:'Mumbai HQ', warehouse:'WH-A', tray:'Tray A1', huid:'HM2026A001', status:'In Stock',  batch:'BT2026-01', serial:['SN-NK-001','SN-NK-002','SN-NK-003'] },
    { id:'STK002', sku:'RG-DIA-001', name:'Diamond Solitaire Ring', cat:'Ring',      jwlCat:'Diamond', purity:'18K', grossWt:4.5,  netWt:4.2,  qty:8,  minQty:3,  reorder:6,  mrp:58000,  costPrice:46000,  branch:'Mumbai HQ', warehouse:'WH-B', tray:'Tray B1', huid:'HM2026B002', status:'In Stock',  batch:'BT2026-02', serial:['SN-RG-001','SN-RG-002','SN-RG-003','SN-RG-004','SN-RG-005','SN-RG-006','SN-RG-007','SN-RG-008'] },
    { id:'STK003', sku:'BG-GLD-002', name:'Gold Bangles Pair',      cat:'Bangles',   jwlCat:'Gold',    purity:'22K', grossWt:35.5, netWt:35.0, qty:5,  minQty:3,  reorder:6,  mrp:253400, costPrice:228000, branch:'Mumbai HQ', warehouse:'WH-C', tray:'Tray C1', huid:'HM2026A003', status:'In Stock',  batch:'BT2026-01', serial:['SN-BG-001','SN-BG-002','SN-BG-003','SN-BG-004','SN-BG-005'] },
    { id:'STK004', sku:'ER-JHK-001', name:'Jhumka Earrings',        cat:'Earrings',  jwlCat:'Gold',    purity:'22K', grossWt:8.8,  netWt:8.4,  qty:12, minQty:5,  reorder:10, mrp:60800,  costPrice:52000,  branch:'Mumbai HQ', warehouse:'WH-D', tray:'Tray D1', huid:'HM2026C004', status:'In Stock',  batch:'BT2026-03', serial:[] },
    { id:'STK005', sku:'PD-TMP-003', name:'Temple Pendant',         cat:'Pendant',   jwlCat:'Gold',    purity:'24K', grossWt:5.3,  netWt:5.1,  qty:2,  minQty:3,  reorder:5,  mrp:40239,  costPrice:33000,  branch:'Mumbai HQ', warehouse:'WH-A', tray:'Tray A2', huid:'HM2026D005', status:'Low Stock', batch:'BT2026-02', serial:['SN-PD-001','SN-PD-002'] },
    { id:'STK006', sku:'SV-PYL-001', name:'Silver Payal Pair',      cat:'Anklet',    jwlCat:'Silver',  purity:'925', grossWt:45.5, netWt:45.0, qty:15, minQty:5,  reorder:10, mrp:4140,   costPrice:3600,   branch:'Mumbai HQ', warehouse:'WH-E', tray:'Rack E1', huid:'',           status:'In Stock',  batch:'BT2026-04', serial:[] },
    { id:'STK007', sku:'MS-GLD-001', name:'Gold Mangalsutra',       cat:'Mangalsutra',jwlCat:'Gold',   purity:'22K', grossWt:9.2,  netWt:9.2,  qty:4,  minQty:2,  reorder:4,  mrp:76800,  costPrice:65000,  branch:'Delhi',     warehouse:'WH-DEL', tray:'Tray G1',huid:'HM2026E007', status:'In Stock',  batch:'BT2026-01', serial:['SN-MS-001','SN-MS-002','SN-MS-003','SN-MS-004'] },
    { id:'STK008', sku:'RG-PLT-001', name:'Platinum Band Ring',     cat:'Ring',      jwlCat:'Platinum',purity:'950', grossWt:5.1,  netWt:5.1,  qty:1,  minQty:2,  reorder:3,  mrp:36500,  costPrice:28000,  branch:'Mumbai HQ', warehouse:'WH-B', tray:'Safe Box',huid:'',           status:'Low Stock', batch:'BT2026-05', serial:['SN-PLT-001'] },
    { id:'STK009', sku:'PD-EMR-001', name:'Emerald Pendant 18K',    cat:'Pendant',   jwlCat:'Gemstone',purity:'18K', grossWt:3.8,  netWt:2.6,  qty:2,  minQty:2,  reorder:3,  mrp:55000,  costPrice:42000,  branch:'Jaipur',    warehouse:'WH-JAI',tray:'Safe J1', huid:'HM2026F009', status:'Low Stock', batch:'BT2026-06', serial:['SN-EMR-001','SN-EMR-002'] },
    { id:'STK010', sku:'CH-GLD-001', name:'Gold Box Chain 20"',     cat:'Chain',     jwlCat:'Gold',    purity:'22K', grossWt:12.0, netWt:12.0, qty:7,  minQty:3,  reorder:6,  mrp:95400,  costPrice:85000,  branch:'Mumbai HQ', warehouse:'WH-A', tray:'Tray A3', huid:'HM2026G010', status:'In Stock',  batch:'BT2026-03', serial:[] },
    { id:'STK011', sku:'BT-DIA-001', name:'Diamond Tennis Bracelet',cat:'Bracelet',  jwlCat:'Diamond', purity:'18K', grossWt:10.5, netWt:8.4,  qty:2,  minQty:2,  reorder:4,  mrp:155000, costPrice:120000, branch:'Mumbai HQ', warehouse:'WH-B', tray:'Safe Box',huid:'HM2026I013', status:'Low Stock', batch:'BT2026-02', serial:['SN-DIA-001','SN-DIA-002'] },
    { id:'STK012', sku:'CN-GLD-001', name:'Gold Coin 8g Lakshmi',   cat:'Coin',      jwlCat:'Gold',    purity:'24K', grossWt:8.0,  netWt:8.0,  qty:6,  minQty:3,  reorder:10, mrp:64500,  costPrice:58000,  branch:'Delhi',     warehouse:'WH-DEL',tray:'Safe D1', huid:'HM2026K015', status:'In Stock',  batch:'BT2026-04', serial:['SN-CN-001','SN-CN-002','SN-CN-003','SN-CN-004','SN-CN-005','SN-CN-006'] },
    { id:'STK013', sku:'NK-KND-002', name:'Kundan Choker Set',       cat:'Necklace',  jwlCat:'Gold',    purity:'22K', grossWt:22.0, netWt:21.5, qty:0,  minQty:2,  reorder:3,  mrp:160000, costPrice:140000, branch:'Mumbai HQ', warehouse:'WH-A', tray:'Tray A4', huid:'HM2026A014', status:'Out of Stock',batch:'BT2026-01',serial:[] },
    { id:'STK014', sku:'ER-STD-001', name:'Diamond Stud Earrings',  cat:'Earrings',  jwlCat:'Diamond', purity:'18K', grossWt:3.2,  netWt:2.8,  qty:0,  minQty:2,  reorder:4,  mrp:48000,  costPrice:36000,  branch:'Jaipur',    warehouse:'WH-JAI',tray:'Safe J2', huid:'HM2026I015', status:'Out of Stock',batch:'BT2026-05',serial:[] },
    { id:'STK015', sku:'KD-SLV-001', name:'Silver Oxidised Kada',   cat:'Kada',      jwlCat:'Silver',  purity:'925', grossWt:28.0, netWt:28.0, qty:9,  minQty:4,  reorder:8,  mrp:2800,   costPrice:2300,   branch:'Mumbai HQ', warehouse:'WH-E', tray:'Rack E2', huid:'',           status:'In Stock',  batch:'BT2026-04', serial:[] },
  ],

  // ---- DAMAGED STOCK ----
  damaged: [
    { id:'DMG001', sku:'BG-GLD-003', name:'Gold Bangles 22K',      qty:1, reason:'Display damage — scratch on surface',   reportedBy:'Karan Mehta',  date:'2026-08-10', branch:'Mumbai HQ', action:'Repair',     repairCost:1200, status:'Repair Pending' },
    { id:'DMG002', sku:'RG-DIA-002', name:'Diamond Ring 18K',      qty:1, reason:'Stone fell off during customer trial',   reportedBy:'Ravi Sharma',  date:'2026-08-12', branch:'Mumbai HQ', action:'Return to Supplier',repairCost:0,status:'Pending Pickup' },
    { id:'DMG003', sku:'NK-KND-003', name:'Kundan Necklace',       qty:1, reason:'Clasp broken — metal fatigue',           reportedBy:'Deepika Singh',date:'2026-08-14', branch:'Delhi',     action:'Repair',     repairCost:800,  status:'Under Repair' },
    { id:'DMG004', sku:'SV-PYL-002', name:'Silver Anklet',         qty:2, reason:'Oxidation & surface damage from display',reportedBy:'Karan Mehta',  date:'2026-08-15', branch:'Mumbai HQ', action:'Write Off',  repairCost:0,    status:'Written Off' },
  ],

  // ---- LOST STOCK ----
  lost: [
    { id:'LST001', sku:'NP-GLD-001', name:'Gold Nose Pin 22K',    qty:1, reason:'Missing from Tray B3 — audit discrepancy', reportedBy:'Ravi Sharma',  date:'2026-07-28', branch:'Mumbai HQ', value:6200,  status:'Under Investigation', cctv:'Checked — no footage' },
    { id:'LST002', sku:'ER-JHK-002', name:'Jhumka (Single)',      qty:1, reason:'Customer trial — returned incomplete',      reportedBy:'Karan Mehta',  date:'2026-08-05', branch:'Mumbai HQ', value:30400, status:'Written Off',         cctv:'N/A' },
    { id:'LST003', sku:'TR-GLD-001', name:'Gold Toe Ring (Pair)', qty:1, reason:'Transit loss — inter-branch transfer',      reportedBy:'Deepika Singh',date:'2026-08-11', branch:'Delhi',     value:18200, status:'Insurance Claimed',   cctv:'In Transit' },
  ],

  // ---- REPAIR STOCK ----
  repairStock: [
    { id:'RST001', sku:'NK-KND-001', name:'Kundan Necklace (Customer)',  issue:'Clasp repair',        karigar:'Ramesh Soni',  issueDate:'2026-08-10', expectedDate:'2026-08-17', status:'In Progress', weight:28.5, custId:'C001' },
    { id:'RST002', sku:'RG-DIA-001', name:'Diamond Ring (Customer)',     issue:'Ring resizing',       karigar:'Suresh Meena', issueDate:'2026-08-12', expectedDate:'2026-08-15', status:'Ready',       weight:4.2,  custId:'C002' },
    { id:'RST003', sku:'BG-GLD-003', name:'Damaged Bangle (Own Stock)', issue:'Surface polish + scratch removal',karigar:'Harish Kumar',issueDate:'2026-08-14',expectedDate:'2026-08-18',status:'Pending',weight:35.0,custId:null },
  ],

  // ---- STOCK ADJUSTMENTS ----
  adjustments: [
    { id:'ADJ001', sku:'NK-KND-001', name:'Kundan Necklace Set',    adjType:'Increase', qty:2, reason:'Purchase receipt',         by:'Ravi Sharma',  date:'2026-08-10', branch:'Mumbai HQ' },
    { id:'ADJ002', sku:'RG-DIA-001', name:'Diamond Ring',           adjType:'Decrease', qty:1, reason:'Damaged item written off', by:'Karan Mehta',  date:'2026-08-12', branch:'Mumbai HQ' },
    { id:'ADJ003', sku:'SV-PYL-001', name:'Silver Payal',           adjType:'Increase', qty:5, reason:'Stock count correction',   by:'Ravi Sharma',  date:'2026-08-14', branch:'Mumbai HQ' },
    { id:'ADJ004', sku:'ER-JHK-001', name:'Jhumka Earrings',        adjType:'Decrease', qty:2, reason:'Lost items written off',   by:'Deepika Singh',date:'2026-08-15', branch:'Mumbai HQ' },
    { id:'ADJ005', sku:'BT-DIA-001', name:'Diamond Tennis Bracelet',adjType:'Increase', qty:1, reason:'Return from customer',     by:'Karan Mehta',  date:'2026-08-16', branch:'Mumbai HQ' },
  ],

  // ---- STOCK MOVEMENT ----
  movements: [
    { id:'MOV001', sku:'NK-KND-001', name:'Kundan Necklace Set',   type:'Sale',      qty:-1, from:'Mumbai HQ',  to:'Customer',     date:'2026-08-16', ref:'INV-2026-8841', by:'Karan Mehta' },
    { id:'MOV002', sku:'BG-GLD-002', name:'Gold Bangles Pair',     type:'Purchase',  qty:+3, from:'Zaveri Bullion',to:'Mumbai HQ', date:'2026-08-10', ref:'PO-2026-148',  by:'Ravi Sharma' },
    { id:'MOV003', sku:'MS-GLD-001', name:'Gold Mangalsutra',      type:'Transfer',  qty:+2, from:'Mumbai HQ',  to:'Delhi',        date:'2026-08-09', ref:'TRF-001',      by:'Ravi Sharma' },
    { id:'MOV004', sku:'RG-DIA-001', name:'Diamond Ring',          type:'Return',    qty:+1, from:'Customer',   to:'Mumbai HQ',    date:'2026-08-14', ref:'RET-2026-0018',by:'Deepika Singh' },
    { id:'MOV005', sku:'CN-GLD-001', name:'Gold Coin 8g',          type:'Purchase',  qty:+6, from:'Zaveri Bullion',to:'Mumbai HQ', date:'2026-08-12', ref:'PO-2026-147',  by:'Ravi Sharma' },
    { id:'MOV006', sku:'ER-JHK-001', name:'Jhumka Earrings',       type:'Sale',      qty:-2, from:'Mumbai HQ',  to:'Customer',     date:'2026-08-15', ref:'INV-2026-8840',by:'Karan Mehta' },
    { id:'MOV007', sku:'PD-TMP-003', name:'Temple Pendant',        type:'Transfer',  qty:+1, from:'Delhi',      to:'Mumbai HQ',    date:'2026-08-08', ref:'TRF-002',      by:'Ravi Sharma' },
    { id:'MOV008', sku:'NK-KND-002', name:'Kundan Choker Set',     type:'Damage',    qty:-1, from:'Mumbai HQ',  to:'Damaged',      date:'2026-08-13', ref:'DMG-001',      by:'Deepika Singh' },
  ],

  // ---- RESERVED STOCK ----
  reserved: [
    { id:'RES001', sku:'NK-KND-001', name:'Kundan Necklace Set',    qty:1, reason:'Custom Order',       reservedFor:'Sunita Verma',  ref:'ORD-001', date:'2026-08-10', expiry:'2026-09-10', branch:'Mumbai HQ' },
    { id:'RES002', sku:'RG-DIA-001', name:'Diamond Solitaire Ring', qty:1, reason:'Customer Hold',      reservedFor:'Vikram Malhotra',ref:'JG-002', date:'2026-08-15', expiry:'2026-08-22', branch:'Mumbai HQ' },
    { id:'RES003', sku:'BG-GLD-002', name:'Gold Bangles Pair',      qty:2, reason:'Festival Pre-order', reservedFor:'Meena Singh',   ref:'PRE-004',date:'2026-08-14', expiry:'2026-10-01', branch:'Mumbai HQ' },
  ],

  // ---- STOCK AUDIT LOG ----
  audit: [
    { id:'AUD001', date:'2026-08-16', type:'Full Audit',    branch:'Mumbai HQ', conducted:'Ravi Sharma + Karan Mehta', totalItems:342, matched:338, discrepancy:4, status:'Completed', notes:'4 items with count mismatch — 2 found, 2 missing' },
    { id:'AUD002', date:'2026-08-10', type:'Spot Check',    branch:'Mumbai HQ', conducted:'Ravi Sharma',              totalItems:48,  matched:47,  discrepancy:1, status:'Completed', notes:'1 nose pin missing — under investigation' },
    { id:'AUD003', date:'2026-08-01', type:'Branch Audit',  branch:'Delhi',      conducted:'Store Manager Delhi',       totalItems:218, matched:218, discrepancy:0, status:'Completed', notes:'All items matched — clean audit' },
    { id:'AUD004', date:'2026-07-16', type:'Full Audit',    branch:'Mumbai HQ', conducted:'Ravi Sharma',              totalItems:330, matched:325, discrepancy:5, status:'Completed', notes:'5 earring pairs unaccounted — written off' },
  ],

  // ---- STOCK TRANSFER ----
  transfers: [
    { id:'TRF001', from:'Mumbai HQ', to:'Delhi',   items:[{sku:'MS-GLD-001',name:'Gold Mangalsutra',qty:2},{sku:'ER-JHK-001',name:'Jhumka Earrings',qty:3}], date:'2026-08-09', by:'Ravi Sharma',  status:'Received',  value:214400 },
    { id:'TRF002', from:'Delhi',     to:'Mumbai HQ',items:[{sku:'PD-TMP-003',name:'Temple Pendant',qty:1}],                                                   date:'2026-08-08', by:'Ravi Sharma',  status:'Received',  value:40239 },
    { id:'TRF003', from:'Mumbai HQ', to:'Jaipur',   items:[{sku:'PD-EMR-001',name:'Emerald Pendant',qty:1},{sku:'CN-GLD-001',name:'Gold Coin',qty:2}],        date:'2026-08-14', by:'Karan Mehta',  status:'In Transit',value:184739 },
    { id:'TRF004', from:'Mumbai HQ', to:'Delhi',    items:[{sku:'NK-KND-001',name:'Kundan Necklace',qty:1}],                                                   date:'2026-08-16', by:'Deepika Singh',status:'Dispatched', value:206000 },
  ],

  // ---- WAREHOUSES ----
  warehouses: [
    { id:'WH-A',   name:'Display Section A', branch:'Mumbai HQ', capacity:60, used:48, type:'Display',  items:['Necklace','Chain','Pendant'],        manager:'Karan Mehta' },
    { id:'WH-B',   name:'Safe / High Value', branch:'Mumbai HQ', capacity:30, used:22, type:'Safe',     items:['Diamond','Platinum','High Value'],   manager:'Ravi Sharma' },
    { id:'WH-C',   name:'Bangles Counter',   branch:'Mumbai HQ', capacity:50, used:53, type:'Counter',  items:['Bangles','Kada'],                    manager:'Karan Mehta' },
    { id:'WH-D',   name:'Earrings Rack',     branch:'Mumbai HQ', capacity:80, used:72, type:'Display',  items:['Earrings','Nose Pin'],               manager:'Deepika Singh' },
    { id:'WH-E',   name:'Silver Section',    branch:'Mumbai HQ', capacity:100,used:24, type:'Display',  items:['Silver Items','Anklets','Kadaa'],    manager:'Deepika Singh' },
    { id:'WH-DEL', name:'Delhi Showroom',    branch:'Delhi',      capacity:100,used:68, type:'Showroom', items:['Mixed'],                             manager:'Delhi Manager' },
    { id:'WH-JAI', name:'Jaipur Store',      branch:'Jaipur',     capacity:80, used:55, type:'Showroom', items:['Gemstone','Custom'],                 manager:'Jaipur Manager' },
  ],

  // ---- BATCH DATA ----
  batches: [
    { id:'BT2026-01', name:'Bridal Collection 2026', purchaseDate:'2026-07-15', supplier:'Zaveri Bullion', items:4, totalWeight:'124.2g', totalValue:6150000, expiry:'N/A',        status:'Active' },
    { id:'BT2026-02', name:'Diamond Premium Lot',    purchaseDate:'2026-07-20', supplier:'Diamond Palace', items:3, totalWeight:'18.9g',  totalValue:2490000, expiry:'N/A',        status:'Active' },
    { id:'BT2026-03', name:'Festival Stock Aug 2026',purchaseDate:'2026-08-01', supplier:'Zaveri Bullion', items:2, totalWeight:'22.2g',  totalValue:756200,  expiry:'N/A',        status:'Active' },
    { id:'BT2026-04', name:'Silver Assortment Q3',   purchaseDate:'2026-07-10', supplier:'Ratanlal & Sons',items:3, totalWeight:'1.4kg',  totalValue:52600,   expiry:'2027-07-10', status:'Active' },
    { id:'BT2026-05', name:'Platinum Collection',    purchaseDate:'2026-06-15', supplier:'Diamond Palace', items:2, totalWeight:'9.7g',   totalValue:220000,  expiry:'N/A',        status:'Partial' },
    { id:'BT2026-06', name:'Gemstone Lot June 2026', purchaseDate:'2026-06-20', supplier:'Gem World',      items:1, totalWeight:'3.8g',   totalValue:110000,  expiry:'N/A',        status:'Partial' },
  ],

  // ---- MULTI-BRANCH SUMMARY ----
  branchStock: [
    { branch:'Mumbai HQ', items:248, goldWt:'2.8 kg', silverWt:'8.2 kg', diamonds:'210 ct', valuation:22400000 },
    { branch:'Delhi',      items:152, goldWt:'1.1 kg', silverWt:'3.2 kg', diamonds:'95 ct',  valuation:9800000  },
    { branch:'Jaipur',     items:99,  goldWt:'0.6 kg', silverWt:'2.1 kg', diamonds:'43 ct',  valuation:5200000  },
  ],

  // ---- OPENING / CLOSING STOCK ----
  stockSummary: {
    openingDate: '2026-08-01',
    closingDate:  '2026-08-16',
    opening: { items:330, goldWt:'3.9 kg', value:28500000 },
    received: { items:62,  goldWt:'0.8 kg', value:7200000 },
    sold:     { items:48,  goldWt:'0.5 kg', value:8400000 },
    damaged:  { items:4,   goldWt:'0.02 kg',value:95000 },
    lost:     { items:2,   goldWt:'0.01 kg',value:48600 },
    closing:  { items:342, goldWt:'4.2 kg', value:32000000 },
  },
};

// ============================================================
// UTILITY
// ============================================================
function invFmt(n)    { return '₹' + (n||0).toLocaleString('en-IN'); }
function invDate(d)   { if(!d) return '—'; const dt=new Date(d); return isNaN(dt)?d:dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function statusBadge(s) {
  const m = {
    'In Stock':'badge-green','Low Stock':'badge-orange','Out of Stock':'badge-red',
    'In Transit':'badge-blue','Dispatched':'badge-blue','Received':'badge-green',
    'Completed':'badge-green','Active':'badge-green','Partial':'badge-orange',
    'Pending':'badge-orange','Under Repair':'badge-blue','Ready':'badge-green',
    'Written Off':'badge-red','Under Investigation':'badge-orange','Insurance Claimed':'badge-purple',
    'Repair Pending':'badge-orange','Pending Pickup':'badge-orange',
  };
  return `<span class="badge ${m[s]||'badge-grey'}">${s}</span>`;
}
function stockBar(used, cap) {
  const pct = Math.min(100, Math.round((used/cap)*100));
  const col = pct>=100?'red':pct>=80?'':'green';
  return `<div style="display:flex;align-items:center;gap:6px">
    <div class="progress" style="flex:1;height:6px"><div class="progress-bar ${col}" style="width:${pct}%"></div></div>
    <span style="font-size:.72rem;font-weight:700;min-width:36px">${pct}%</span>
  </div>`;
}

// ============================================================
// 1. LIVE STOCK
// ============================================================
let invFilter = { search:'', cat:'', branch:'', status:'' };

function renderLiveStock() {
  const tbody = document.getElementById('inv-live-tbody');
  if (!tbody) return;
  const lq = invFilter.search.toLowerCase();
  let data = INV.stock.filter(s => {
    const ms = !lq || s.name.toLowerCase().includes(lq) || s.sku.toLowerCase().includes(lq) || s.cat.toLowerCase().includes(lq);
    const mc = !invFilter.cat    || s.cat    === invFilter.cat;
    const mb = !invFilter.branch || s.branch === invFilter.branch;
    const mst= !invFilter.status || s.status === invFilter.status;
    return ms && mc && mb && mst;
  });

  // KPI update
  const totalItems = data.length;
  const totalVal   = data.reduce((s,i) => s+i.mrp*i.qty, 0);
  const lowCount   = data.filter(i => i.status==='Low Stock').length;
  const outCount   = data.filter(i => i.status==='Out of Stock').length;
  const setKpi = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  setKpi('inv-kpi-items', data.reduce((s,i)=>s+i.qty,0));
  setKpi('inv-kpi-val',   invFmt(totalVal));
  setKpi('inv-kpi-low',   lowCount);
  setKpi('inv-kpi-out',   outCount);

  tbody.innerHTML = data.map(s => `
    <tr>
      <td><code style="font-size:.75rem;color:var(--accent)">${s.sku}</code></td>
      <td>
        <div style="font-weight:700;font-size:.85rem">${s.name}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">${s.cat} · ${s.jwlCat} · ${s.purity}</div>
      </td>
      <td>${s.branch}</td>
      <td>${s.warehouse} / ${s.tray}</td>
      <td>${s.grossWt}g / ${s.netWt}g</td>
      <td>
        <span style="font-size:1rem;font-weight:800;color:${s.qty===0?'var(--danger)':s.qty<=s.minQty?'var(--warning)':'var(--success)'}">${s.qty}</span>
        <span style="font-size:.72rem;color:var(--text-muted)"> / min ${s.minQty}</span>
      </td>
      <td class="text-gold fw-bold">${invFmt(s.mrp)}</td>
      <td>${invFmt(s.mrp * s.qty)}</td>
      <td>${statusBadge(s.status)}</td>
      <td>${s.huid ? `<span style="font-size:.72rem;color:var(--success)">✅ ${s.huid}</span>` : '<span style="font-size:.72rem;color:var(--text-muted)">—</span>'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="openInvDetail('${s.id}')">👁</button>
        <button class="btn btn-outline btn-xs" onclick="openAdjustModal('${s.id}')">⚙️</button>
        <button class="btn btn-gold btn-xs" onclick="showToast('Added to bill','success')">🧾</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="11" style="text-align:center;padding:24px;color:var(--text-muted)">No items match filters</td></tr>`;
}

function setInvFilter(key, val) { invFilter[key] = val; renderLiveStock(); }

function openInvDetail(id) {
  const s = INV.stock.find(x => x.id === id);
  if (!s) return;
  openModal('invDetailModal');
  document.getElementById('idm-name').textContent  = s.name;
  document.getElementById('idm-sku').textContent   = s.sku;
  document.getElementById('idm-cat').textContent   = s.cat + ' · ' + s.jwlCat;
  document.getElementById('idm-purity').textContent= s.purity;
  document.getElementById('idm-wt').textContent    = s.grossWt + 'g gross / ' + s.netWt + 'g net';
  document.getElementById('idm-qty').textContent   = s.qty + ' pcs (reorder at ' + s.reorder + ')';
  document.getElementById('idm-mrp').textContent   = invFmt(s.mrp);
  document.getElementById('idm-cost').textContent  = invFmt(s.costPrice);
  document.getElementById('idm-branch').textContent= s.branch;
  document.getElementById('idm-wh').textContent    = s.warehouse + ' / ' + s.tray;
  document.getElementById('idm-batch').textContent = s.batch;
  document.getElementById('idm-status').innerHTML  = statusBadge(s.status);
  document.getElementById('idm-serials').innerHTML = s.serial.length
    ? s.serial.map(sn=>`<span class="badge badge-grey" style="margin:2px;font-size:.7rem">${sn}</span>`).join('')
    : '<span style="color:var(--text-muted);font-size:.8rem">No serial numbers</span>';
}

function openAdjustModal(id) {
  openModal('stockAdjModal');
  document.getElementById('adj-sku-hidden').value = id;
  const s = INV.stock.find(x=>x.id===id);
  if (s) document.getElementById('adj-item-label').textContent = s.name + ' (' + s.sku + ') — Current Qty: ' + s.qty;
}

function saveStockAdj() {
  const id   = document.getElementById('adj-sku-hidden')?.value;
  const type = document.getElementById('adj-type')?.value;
  const qty  = parseInt(document.getElementById('adj-qty')?.value)||0;
  const reason=document.getElementById('adj-reason')?.value?.trim();
  if (!id||!reason||qty<=0) { showToast('Fill all fields','error'); return; }
  const s = INV.stock.find(x=>x.id===id);
  if (!s) return;
  const delta = type==='Increase' ? qty : -qty;
  s.qty = Math.max(0, s.qty + delta);
  s.status = s.qty===0?'Out of Stock':s.qty<=s.minQty?'Low Stock':'In Stock';
  INV.adjustments.unshift({ id:'ADJ'+Date.now(), sku:s.sku, name:s.name, adjType:type, qty, reason, by:'Ravi Sharma', date:new Date().toISOString().slice(0,10), branch:s.branch });
  closeModal('stockAdjModal');
  renderLiveStock(); renderAdjustments(); renderMovement(); renderLowStockAlerts();
  showToast(`Stock ${type}d: ${s.name} → ${s.qty} pcs`, 'success');
}

// ============================================================
// 2. MULTI-BRANCH STOCK
// ============================================================
function renderBranchStock() {
  const container = document.getElementById('branch-stock-container');
  if (!container) return;
  container.innerHTML = INV.branchStock.map(b => {
    const branchItems = INV.stock.filter(s => s.branch === b.branch);
    const cats = {};
    branchItems.forEach(s => { cats[s.cat]=(cats[s.cat]||0)+s.qty; });
    return `
    <div class="card" style="margin-bottom:18px">
      <div class="card-header">
        <div class="card-title" style="font-size:1rem">🏪 ${b.branch}</div>
        <div style="display:flex;gap:8px">
          <span class="badge badge-gold">🏅 Gold: ${b.goldWt}</span>
          <span class="badge badge-blue">🥈 Silver: ${b.silverWt}</span>
          <span class="badge badge-purple">💎 Diamonds: ${b.diamonds}</span>
          <span class="badge badge-green">₹${(b.valuation/10000000).toFixed(2)} Cr</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:16px">
        ${Object.entries(cats).map(([cat,qty])=>`
          <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.1rem;font-weight:800;color:var(--accent)">${qty}</div>
            <div style="font-size:.73rem;color:var(--text-muted)">${cat}</div>
          </div>`).join('')}
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>SKU</th><th>Name</th><th>Warehouse</th><th>Qty</th><th>Status</th><th>Value</th></tr></thead>
          <tbody>
            ${branchItems.map(s=>`<tr>
              <td><code style="font-size:.75rem">${s.sku}</code></td>
              <td>${s.name}</td><td>${s.warehouse}</td>
              <td class="fw-bold" style="color:${s.qty===0?'var(--danger)':s.qty<=s.minQty?'var(--warning)':'var(--success)'}">${s.qty}</td>
              <td>${statusBadge(s.status)}</td>
              <td class="text-gold">${invFmt(s.mrp*s.qty)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }).join('');
}

// ============================================================
// 3. WAREHOUSES
// ============================================================
function renderWarehouses() {
  const container = document.getElementById('warehouse-container');
  if (!container) return;
  container.innerHTML = INV.warehouses.map(w => {
    const pct = Math.min(100, Math.round((w.used/w.capacity)*100));
    const col  = pct>=100?'var(--danger)':pct>=80?'var(--warning)':'var(--success)';
    return `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:18px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <div style="font-weight:800;font-size:.95rem">${w.name}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">${w.id} · ${w.branch} · ${w.type}</div>
        </div>
        <span class="badge badge-${pct>=100?'red':pct>=80?'orange':'green'}">${pct}% Full</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:6px">
        <span>Capacity</span><span style="font-weight:700;color:${col}">${w.used} / ${w.capacity} items</span>
      </div>
      ${stockBar(w.used, w.capacity)}
      <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:5px">
        ${w.items.map(it=>`<span class="badge badge-grey" style="font-size:.7rem">${it}</span>`).join('')}
      </div>
      <div style="margin-top:10px;font-size:.75rem;color:var(--text-muted)">Manager: <strong>${w.manager}</strong></div>
      <button class="btn btn-outline btn-sm" style="width:100%;margin-top:10px" onclick="showToast('${w.name} details loaded','info')">📋 View Items</button>
    </div>`;
  }).join('');
}

// ============================================================
// 4. STOCK TRANSFER
// ============================================================
function renderTransfers() {
  const tbody = document.getElementById('transfer-tbody');
  if (!tbody) return;
  tbody.innerHTML = INV.transfers.map(t => `
    <tr>
      <td><span class="badge badge-blue">${t.id}</span></td>
      <td>${t.from}</td>
      <td>${t.to}</td>
      <td>
        ${t.items.map(i=>`<div style="font-size:.8rem">${i.name} (${i.qty} pcs)</div>`).join('')}
      </td>
      <td>${invDate(t.date)}</td>
      <td>${t.by}</td>
      <td class="text-gold fw-bold">${invFmt(t.value)}</td>
      <td>${statusBadge(t.status)}</td>
      <td style="white-space:nowrap">
        ${t.status==='Dispatched'||t.status==='In Transit'?`<button class="btn btn-gold btn-xs" onclick="receiveTransfer('${t.id}')">✅ Receive</button>`:''}
        <button class="btn btn-outline btn-xs" onclick="showToast('Transfer slip printed','success')">🖨️</button>
      </td>
    </tr>`).join('');
}

function receiveTransfer(id) {
  const t = INV.transfers.find(x=>x.id===id);
  if (!t) return;
  t.status = 'Received';
  t.items.forEach(item => {
    const s = INV.stock.find(x=>x.sku===item.sku);
    if (s) { s.qty+=item.qty; s.branch=t.to; s.status=s.qty>s.minQty?'In Stock':'Low Stock'; }
  });
  renderTransfers(); renderLiveStock();
  showToast(`Transfer ${id} received at ${t.to}!`, 'success');
}

function saveNewTransfer() {
  const from  = document.getElementById('trf-from')?.value;
  const to    = document.getElementById('trf-to')?.value;
  const sku   = document.getElementById('trf-sku')?.value?.trim();
  const qty   = parseInt(document.getElementById('trf-qty')?.value)||0;
  if (!from||!to||!sku||qty<=0) { showToast('Fill all fields','error'); return; }
  if (from===to) { showToast('From and To branches must be different','error'); return; }
  const s = INV.stock.find(x=>x.sku===sku);
  if (!s) { showToast('SKU not found','error'); return; }
  if (s.qty < qty) { showToast('Insufficient stock at '+from,'error'); return; }
  s.qty -= qty;
  s.status = s.qty===0?'Out of Stock':s.qty<=s.minQty?'Low Stock':'In Stock';
  const newTrf = { id:'TRF'+Date.now(), from, to, items:[{sku,name:s.name,qty}], date:new Date().toISOString().slice(0,10), by:'Ravi Sharma', status:'Dispatched', value:s.mrp*qty };
  INV.transfers.unshift(newTrf);
  INV.movements.unshift({ id:'MOV'+Date.now(), sku, name:s.name, type:'Transfer', qty:-qty, from, to, date:new Date().toISOString().slice(0,10), ref:newTrf.id, by:'Ravi Sharma' });
  closeModal('newTransferModal');
  renderTransfers(); renderLiveStock(); renderMovement();
  showToast(`${qty} pcs of ${s.name} dispatched to ${to}`, 'success');
}

// ============================================================
// 5. RESERVED STOCK
// ============================================================
function renderReserved() {
  const tbody = document.getElementById('reserved-tbody');
  if (!tbody) return;
  const now = new Date();
  tbody.innerHTML = INV.reserved.map(r => {
    const exp = new Date(r.expiry);
    const expiring = (exp-now)/(1000*60*60*24) <= 7;
    return `<tr>
      <td><span class="badge badge-blue">${r.id}</span></td>
      <td><strong>${r.name}</strong><div style="font-size:.72rem;color:var(--text-muted)">${r.sku||''}</div></td>
      <td class="fw-bold">${r.qty}</td>
      <td>${r.reason}</td>
      <td>${r.reservedFor}</td>
      <td><span class="badge badge-grey">${r.ref}</span></td>
      <td>${invDate(r.date)}</td>
      <td><span style="color:${expiring?'var(--danger)':'var(--text-muted)'};font-size:.8rem">${invDate(r.expiry)} ${expiring?'⚠️':''}</span></td>
      <td>${r.branch}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-gold btn-xs" onclick="releaseReserved('${r.id}')">✅ Release</button>
        <button class="btn btn-outline btn-xs" onclick="convertReservedToBill('${r.id}')">🧾 Bill</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text-muted)">No reserved items</td></tr>`;
}

function releaseReserved(id) {
  const idx = INV.reserved.findIndex(x=>x.id===id);
  if (idx>-1) { showToast('Reservation '+INV.reserved[idx].id+' released','info'); INV.reserved.splice(idx,1); renderReserved(); }
}

function convertReservedToBill(id) {
  const r = INV.reserved.find(x=>x.id===id);
  showToast(`Opening billing for ${r?.reservedFor||'customer'}...`,'success');
  showModule('billing',null);
}

// ============================================================
// 6. DAMAGED STOCK
// ============================================================
function renderDamaged() {
  const tbody = document.getElementById('damaged-tbody');
  if (!tbody) return;
  tbody.innerHTML = INV.damaged.map(d => `
    <tr>
      <td><span class="badge badge-red">${d.id}</span></td>
      <td><strong>${d.name}</strong><div style="font-size:.72rem;color:var(--text-muted)">${d.sku}</div></td>
      <td class="text-danger fw-bold">${d.qty}</td>
      <td style="font-size:.8rem">${d.reason}</td>
      <td>${d.reportedBy}</td>
      <td>${invDate(d.date)}</td>
      <td>${d.branch}</td>
      <td><span class="badge badge-blue">${d.action}</span></td>
      <td>${d.repairCost ? invFmt(d.repairCost) : '—'}</td>
      <td>${statusBadge(d.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="updateDamagedStatus('${d.id}','Repaired')">✅ Mark Repaired</button>
        <button class="btn btn-outline btn-xs" onclick="updateDamagedStatus('${d.id}','Written Off')">🗑 Write Off</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="11" style="text-align:center;padding:20px;color:var(--text-muted)">No damaged stock</td></tr>`;
}

function updateDamagedStatus(id, status) {
  const d = INV.damaged.find(x=>x.id===id);
  if (d) { d.status=status; renderDamaged(); showToast(d.name+' status: '+status,'success'); }
}

function reportDamage() {
  const sku    = document.getElementById('dmg-sku')?.value?.trim();
  const qty    = parseInt(document.getElementById('dmg-qty')?.value)||1;
  const reason = document.getElementById('dmg-reason')?.value?.trim();
  const action = document.getElementById('dmg-action')?.value;
  if (!sku||!reason) { showToast('Fill all required fields','error'); return; }
  const s = INV.stock.find(x=>x.sku===sku);
  if (!s) { showToast('SKU not found','error'); return; }
  s.qty = Math.max(0, s.qty - qty);
  s.status = s.qty===0?'Out of Stock':s.qty<=s.minQty?'Low Stock':'In Stock';
  INV.damaged.unshift({ id:'DMG'+Date.now(), sku, name:s.name, qty, reason, reportedBy:'Ravi Sharma', date:new Date().toISOString().slice(0,10), branch:s.branch, action, repairCost:0, status:'Repair Pending' });
  closeModal('reportDamageModal');
  renderDamaged(); renderLiveStock();
  showToast('Damage reported for '+s.name, 'success');
}

// ============================================================
// 7. LOST STOCK
// ============================================================
function renderLost() {
  const tbody = document.getElementById('lost-tbody');
  if (!tbody) return;
  tbody.innerHTML = INV.lost.map(l => `
    <tr>
      <td><span class="badge badge-red">${l.id}</span></td>
      <td><strong>${l.name}</strong><div style="font-size:.72rem;color:var(--text-muted)">${l.sku}</div></td>
      <td class="text-danger fw-bold">${l.qty}</td>
      <td style="font-size:.8rem">${l.reason}</td>
      <td>${l.reportedBy}</td>
      <td>${invDate(l.date)}</td>
      <td>${l.branch}</td>
      <td class="text-danger fw-bold">${invFmt(l.value)}</td>
      <td>${statusBadge(l.status)}</td>
      <td style="font-size:.78rem;color:var(--text-muted)">${l.cctv}</td>
      <td><button class="btn btn-outline btn-xs" onclick="updateLostStatus('${l.id}')">⚙️ Update</button></td>
    </tr>`).join('') || `<tr><td colspan="11" style="text-align:center;padding:20px;color:var(--text-muted)">No lost stock records</td></tr>`;
}

function updateLostStatus(id) {
  const statuses = ['Under Investigation','Written Off','Insurance Claimed','Found - Returned'];
  const l = INV.lost.find(x=>x.id===id);
  if (!l) return;
  const idx = statuses.indexOf(l.status);
  l.status = statuses[(idx+1)%statuses.length];
  renderLost();
  showToast(l.name + ' status → ' + l.status, 'info');
}

// ============================================================
// 8. REPAIR STOCK
// ============================================================
function renderRepairStock() {
  const tbody = document.getElementById('repair-stock-tbody');
  if (!tbody) return;
  tbody.innerHTML = INV.repairStock.map(r => `
    <tr>
      <td><span class="badge badge-purple">${r.id}</span></td>
      <td><strong>${r.name}</strong><div style="font-size:.72rem;color:var(--text-muted)">${r.sku}</div></td>
      <td style="font-size:.8rem">${r.issue}</td>
      <td>${r.karigar}</td>
      <td>${r.weight}g</td>
      <td>${invDate(r.issueDate)}</td>
      <td>${invDate(r.expectedDate)}</td>
      <td>${r.custId ? '<span class="badge badge-blue">'+r.custId+'</span>' : '<span class="badge badge-grey">Own Stock</span>'}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="white-space:nowrap">
        ${r.status!=='Ready'?`<button class="btn btn-gold btn-xs" onclick="markRepairReady('${r.id}')">✅ Ready</button>`:''}
        ${r.status==='Ready'&&r.custId?`<button class="btn btn-outline btn-xs" onclick="showToast('Customer notified','success')">📱 Notify</button>`:''}
        <button class="btn btn-outline btn-xs" onclick="showToast('Repair updated','info')">✏️</button>
      </td>
    </tr>`).join('');
}

function markRepairReady(id) {
  const r = INV.repairStock.find(x=>x.id===id);
  if (r) { r.status='Ready'; renderRepairStock(); showToast(r.name+' repair complete — ready for pickup!','success'); }
}

// ============================================================
// 9. STOCK ADJUSTMENTS
// ============================================================
function renderAdjustments() {
  const tbody = document.getElementById('adj-tbody');
  if (!tbody) return;
  tbody.innerHTML = INV.adjustments.map(a => `
    <tr>
      <td><span class="badge badge-grey">${a.id}</span></td>
      <td><code style="font-size:.75rem">${a.sku}</code></td>
      <td>${a.name}</td>
      <td><span class="badge badge-${a.adjType==='Increase'?'green':'red'}">${a.adjType==='Increase'?'▲':'▼'} ${a.adjType}</span></td>
      <td class="fw-bold ${a.adjType==='Increase'?'text-success':'text-danger'}">${a.adjType==='Increase'?'+':'−'}${a.qty}</td>
      <td style="font-size:.8rem">${a.reason}</td>
      <td>${a.by}</td>
      <td>${invDate(a.date)}</td>
      <td>${a.branch}</td>
    </tr>`).join('');
}

// ============================================================
// 10. STOCK AUDIT
// ============================================================
function renderAudit() {
  const tbody = document.getElementById('audit-tbody');
  if (!tbody) return;
  tbody.innerHTML = INV.audit.map(a => `
    <tr>
      <td><span class="badge badge-grey">${a.id}</span></td>
      <td>${invDate(a.date)}</td>
      <td><span class="badge badge-blue">${a.type}</span></td>
      <td>${a.branch}</td>
      <td>${a.conducted}</td>
      <td class="fw-bold">${a.totalItems}</td>
      <td class="text-success fw-bold">${a.matched}</td>
      <td class="${a.discrepancy>0?'text-danger fw-bold':''}">${a.discrepancy}</td>
      <td>${statusBadge(a.status)}</td>
      <td style="font-size:.78rem;color:var(--text-muted)">${a.notes}</td>
      <td><button class="btn btn-outline btn-xs" onclick="showToast('Audit report downloaded','success')">📄 Report</button></td>
    </tr>`).join('');
}

function startNewAudit() {
  showToast('New stock audit started for Mumbai HQ...', 'info');
  setTimeout(() => {
    const discrepancy = Math.floor(Math.random()*5);
    const total = INV.stock.filter(s=>s.branch==='Mumbai HQ').reduce((s,i)=>s+i.qty,0);
    INV.audit.unshift({ id:'AUD'+Date.now(), date:new Date().toISOString().slice(0,10), type:'Spot Check', branch:'Mumbai HQ', conducted:'Ravi Sharma', totalItems:total, matched:total-discrepancy, discrepancy, status:'Completed', notes:discrepancy?`${discrepancy} discrepancies found`:'All items matched' });
    renderAudit();
    showToast(`Audit complete — ${discrepancy} discrepancies found`, discrepancy?'error':'success');
  }, 1500);
}

// ============================================================
// 11. STOCK MOVEMENT
// ============================================================
function renderMovement() {
  const tbody = document.getElementById('movement-tbody');
  if (!tbody) return;
  const typeColor = { Sale:'badge-orange', Purchase:'badge-green', Transfer:'badge-blue', Return:'badge-purple', Damage:'badge-red', Lost:'badge-red', Adjustment:'badge-grey' };
  tbody.innerHTML = INV.movements.map(m => `
    <tr>
      <td><span class="badge badge-grey">${m.id}</span></td>
      <td>${invDate(m.date)}</td>
      <td><code style="font-size:.75rem">${m.sku}</code></td>
      <td>${m.name}</td>
      <td><span class="badge ${typeColor[m.type]||'badge-grey'}">${m.type}</span></td>
      <td class="fw-bold" style="color:${m.qty>0?'var(--success)':'var(--danger)'}">${m.qty>0?'+':''}${m.qty}</td>
      <td>${m.from}</td>
      <td>${m.to}</td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${m.ref}</span></td>
      <td>${m.by}</td>
    </tr>`).join('');
}

// ============================================================
// 12. OPENING / CLOSING STOCK
// ============================================================
function renderOpeningClosing() {
  const ss = INV.stockSummary;
  const rows = [
    ['Opening Stock',   ss.opening.items,  ss.opening.goldWt,  invFmt(ss.opening.value),  'badge-blue'],
    ['+ Stock Received',ss.received.items, ss.received.goldWt, invFmt(ss.received.value),  'badge-green'],
    ['− Stock Sold',    ss.sold.items,     ss.sold.goldWt,     invFmt(ss.sold.value),      'badge-orange'],
    ['− Damaged',       ss.damaged.items,  ss.damaged.goldWt,  invFmt(ss.damaged.value),   'badge-red'],
    ['− Lost',          ss.lost.items,     ss.lost.goldWt,     invFmt(ss.lost.value),      'badge-red'],
    ['= Closing Stock', ss.closing.items,  ss.closing.goldWt,  invFmt(ss.closing.value),   'badge-gold'],
  ];
  const el = document.getElementById('oc-stock-table');
  if (!el) return;
  el.innerHTML = rows.map((r,i) => `
    <tr style="${i===5?'border-top:2px solid var(--accent);font-weight:800;font-size:1rem':''} background:${i===5?'var(--primary-glow)':''}">
      <td style="padding:10px 14px"><span class="badge ${r[4]}">${r[0]}</span></td>
      <td style="padding:10px 14px;font-weight:${i===5?800:400}">${r[1]} items</td>
      <td style="padding:10px 14px">${r[2]}</td>
      <td style="padding:10px 14px;font-weight:700;color:${i===5?'var(--accent)':'inherit'}">${r[3]}</td>
    </tr>`).join('');
}

// ============================================================
// 13. LOW STOCK ALERTS
// ============================================================
function renderLowStockAlerts() {
  const lowItems  = INV.stock.filter(s => s.status==='Low Stock'||s.status==='Out of Stock');
  const tbody = document.getElementById('low-stock-tbody');
  if (!tbody) return;
  tbody.innerHTML = lowItems.map(s => `
    <tr>
      <td><code style="font-size:.75rem">${s.sku}</code></td>
      <td><strong>${s.name}</strong></td>
      <td>${s.cat}</td>
      <td>${s.branch}</td>
      <td class="fw-bold" style="color:${s.qty===0?'var(--danger)':'var(--warning)'}">${s.qty}</td>
      <td>${s.minQty}</td>
      <td class="fw-bold text-gold">${s.reorder}</td>
      <td>${statusBadge(s.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-gold btn-xs" onclick="createReorder('${s.id}')">🛒 Reorder</button>
        <button class="btn btn-outline btn-xs" onclick="openAdjustModal('${s.id}')">⚙️ Adjust</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--success)">✅ All stock levels normal!</td></tr>`;

  const el = document.getElementById('low-stock-count');
  if (el) el.textContent = lowItems.length;
}

function createReorder(id) {
  const s = INV.stock.find(x=>x.id===id);
  if (!s) return;
  showToast(`Purchase order created for ${s.name} (${s.reorder} units)`, 'success');
  showModule('purchase', null);
}

// ============================================================
// 14. REORDER LEVELS
// ============================================================
function renderReorderLevels() {
  const tbody = document.getElementById('reorder-tbody');
  if (!tbody) return;
  tbody.innerHTML = INV.stock.map(s => `
    <tr>
      <td><code style="font-size:.75rem">${s.sku}</code></td>
      <td>${s.name}</td>
      <td>${s.branch}</td>
      <td class="fw-bold" style="color:${s.qty===0?'var(--danger)':s.qty<=s.minQty?'var(--warning)':'var(--success)'}">${s.qty}</td>
      <td>
        <input type="number" class="form-control" style="width:70px;padding:4px 8px;text-align:center" value="${s.minQty}" onchange="updateMinQty('${s.id}',this.value)" min="0">
      </td>
      <td>
        <input type="number" class="form-control" style="width:70px;padding:4px 8px;text-align:center" value="${s.reorder}" onchange="updateReorder('${s.id}',this.value)" min="0">
      </td>
      <td>${statusBadge(s.status)}</td>
      <td>
        ${s.qty<=s.reorder ? `<button class="btn btn-gold btn-xs" onclick="createReorder('${s.id}')">🛒 Reorder Now</button>` : '<span style="color:var(--success);font-size:.8rem">✅ OK</span>'}
      </td>
    </tr>`).join('');
}

function updateMinQty(id, val) {
  const s = INV.stock.find(x=>x.id===id);
  if (s) { s.minQty=parseInt(val)||0; s.status=s.qty===0?'Out of Stock':s.qty<=s.minQty?'Low Stock':'In Stock'; renderLiveStock(); renderLowStockAlerts(); }
}
function updateReorder(id, val) {
  const s = INV.stock.find(x=>x.id===id);
  if (s) { s.reorder=parseInt(val)||0; }
}

// ============================================================
// 15. BATCH TRACKING
// ============================================================
function renderBatches() {
  const tbody = document.getElementById('batch-tbody');
  if (!tbody) return;
  tbody.innerHTML = INV.batches.map(b => {
    const batchItems = INV.stock.filter(s=>s.batch===b.id);
    return `<tr>
      <td><span class="badge badge-blue">${b.id}</span></td>
      <td><strong>${b.name}</strong></td>
      <td>${invDate(b.purchaseDate)}</td>
      <td>${b.supplier}</td>
      <td class="fw-bold">${batchItems.reduce((s,i)=>s+i.qty,0)} pcs (${b.items} SKUs)</td>
      <td>${b.totalWeight}</td>
      <td class="text-gold fw-bold">${invFmt(batchItems.reduce((s,i)=>s+i.costPrice*i.qty,0))}</td>
      <td>${b.expiry==='N/A'?'<span style="color:var(--text-muted)">N/A</span>':invDate(b.expiry)}</td>
      <td>${statusBadge(b.status)}</td>
      <td>
        <button class="btn btn-outline btn-xs" onclick="viewBatchItems('${b.id}')">📋 Items</button>
      </td>
    </tr>`;
  }).join('');
}

function viewBatchItems(batchId) {
  const items = INV.stock.filter(s=>s.batch===batchId);
  const b = INV.batches.find(x=>x.id===batchId);
  openModal('batchItemsModal');
  document.getElementById('bi-batch-name').textContent = b?.name || batchId;
  const tbody = document.getElementById('bi-items-tbody');
  if (tbody) tbody.innerHTML = items.map(s=>`
    <tr><td><code style="font-size:.75rem">${s.sku}</code></td><td>${s.name}</td>
    <td>${s.grossWt}g</td><td>${s.qty}</td><td>${invFmt(s.costPrice)}</td>
    <td>${statusBadge(s.status)}</td></tr>`).join('');
}

// ============================================================
// 16. SERIAL NUMBER TRACKING
// ============================================================
function renderSerialNumbers() {
  const tbody = document.getElementById('serial-tbody');
  if (!tbody) return;
  const serialItems = INV.stock.filter(s=>s.serial && s.serial.length > 0);
  tbody.innerHTML = serialItems.flatMap(s =>
    s.serial.map(sn => `
      <tr>
        <td><code style="font-size:.75rem">${sn}</code></td>
        <td><code style="font-size:.75rem">${s.sku}</code></td>
        <td>${s.name}</td>
        <td>${s.purity}</td>
        <td>${s.branch}</td>
        <td>${s.tray}</td>
        <td>${s.huid||'—'}</td>
        <td>${statusBadge(s.status)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-outline btn-xs" onclick="trackSerial('${sn}')">🔍 Track</button>
        </td>
      </tr>`)
  ).join('') || `<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-muted)">No serialized items</td></tr>`;
}

function searchSerial() {
  const q = document.getElementById('serial-search-input')?.value?.trim().toUpperCase();
  if (!q) { renderSerialNumbers(); return; }
  const tbody = document.getElementById('serial-tbody');
  const allSerial = INV.stock.flatMap(s => s.serial.map(sn=>({sn,s})));
  const found = allSerial.filter(x=>x.sn.toUpperCase().includes(q)||x.s.sku.toUpperCase().includes(q));
  if (!tbody) return;
  tbody.innerHTML = found.map(({sn,s}) => `
    <tr style="background:var(--primary-glow)">
      <td><code style="font-size:.75rem;color:var(--accent);font-weight:800">${sn}</code></td>
      <td><code>${s.sku}</code></td>
      <td>${s.name}</td><td>${s.purity}</td><td>${s.branch}</td>
      <td>${s.tray}</td><td>${s.huid||'—'}</td>
      <td>${statusBadge(s.status)}</td>
      <td><button class="btn btn-gold btn-xs" onclick="trackSerial('${sn}')">🔍 Track</button></td>
    </tr>`).join('') || `<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-muted)">No match for "${q}"</td></tr>`;
}

function trackSerial(sn) {
  const allSerial = INV.stock.flatMap(s=>s.serial.map(x=>({sn:x,s})));
  const found = allSerial.find(x=>x.sn===sn);
  if (!found) { showToast('Serial number not found','error'); return; }
  const {s} = found;
  openModal('serialTrackModal');
  const el = document.getElementById('st-details');
  if (el) el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><div style="font-size:.73rem;color:var(--text-muted)">Serial Number</div><div style="font-weight:800;color:var(--accent)">${sn}</div></div>
      <div><div style="font-size:.73rem;color:var(--text-muted)">SKU</div><div style="font-weight:700">${s.sku}</div></div>
      <div><div style="font-size:.73rem;color:var(--text-muted)">Item Name</div><div style="font-weight:700">${s.name}</div></div>
      <div><div style="font-size:.73rem;color:var(--text-muted)">Purity</div><div>${s.purity}</div></div>
      <div><div style="font-size:.73rem;color:var(--text-muted)">Branch</div><div>${s.branch}</div></div>
      <div><div style="font-size:.73rem;color:var(--text-muted)">Location</div><div>${s.warehouse} / ${s.tray}</div></div>
      <div><div style="font-size:.73rem;color:var(--text-muted)">HUID</div><div>${s.huid||'—'}</div></div>
      <div><div style="font-size:.73rem;color:var(--text-muted)">Batch</div><div>${s.batch}</div></div>
      <div><div style="font-size:.73rem;color:var(--text-muted)">Status</div><div>${s.status}</div></div>
      <div><div style="font-size:.73rem;color:var(--text-muted)">MRP</div><div class="text-gold fw-bold">${invFmt(s.mrp)}</div></div>
    </div>`;
}

// ============================================================
// MASTER INIT
// ============================================================
function initInventoryModule() {
  renderLiveStock();
  renderBranchStock();
  renderWarehouses();
  renderTransfers();
  renderReserved();
  renderDamaged();
  renderLost();
  renderRepairStock();
  renderAdjustments();
  renderAudit();
  renderMovement();
  renderOpeningClosing();
  renderLowStockAlerts();
  renderReorderLevels();
  renderBatches();
  renderSerialNumbers();
}

// Hook into showModule
document.addEventListener('DOMContentLoaded', () => {
  const origShow = window.showModule;
  if (typeof origShow === 'function') {
    window.showModule = function(moduleId, navEl) {
      origShow(moduleId, navEl);
      if (moduleId === 'inventory') setTimeout(initInventoryModule, 60);
    };
  }
});
