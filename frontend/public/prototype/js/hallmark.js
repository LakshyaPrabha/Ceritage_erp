/* ===================================================
   CERITAGE JEWELRY ERP — Hallmark & HUID Management
   4 Features: BIS Hallmark · HUID Tracking
                Hallmark Verification · Hallmark Certificate
   =================================================== */

// ============================================================
// SAMPLE DATA
// ============================================================
const HM = {

  // ---- BIS HALLMARK CENTRE INFO ----
  centre: {
    code: 'HM-MUM-142',
    name: 'BIS Hallmarking Centre — Fort, Mumbai',
    bisLicNo: 'BIS/HMK/MUM/2019/142',
    address: 'Ground Floor, Bhoiwada, Fort, Mumbai – 400 001',
    phone: '+91 22 2282 4567',
    validTill: '2027-03-31',
    assessor: 'Anil Mehta',
    assessorId: 'BIS-ASM-4421',
  },

  // ---- HUID REGISTRY ----
  huid: [
    { id:'HM2026A001', sku:'NK-KND-001', product:'Kundan Necklace Set',    category:'Necklace',  purity:'22K (916)',  grossWt:29.0, netWt:28.5, stoneWt:0.5,  hallmarkDate:'2026-08-10', bisRegDate:'2026-08-11', expiryDate:'N/A', centre:'HM-MUM-142', status:'Registered',   bisPortalStatus:'Live',    soldDate:null,         invoiceNo:null,           customer:null,         branch:'Mumbai HQ', verifiedBy:'Anil Mehta' },
    { id:'HM2026B002', sku:'RG-DIA-001', product:'Diamond Solitaire Ring', category:'Ring',      purity:'18K (750)',  grossWt:4.5,  netWt:4.2,  stoneWt:0.3,  hallmarkDate:'2026-08-08', bisRegDate:'2026-08-09', expiryDate:'N/A', centre:'HM-MUM-142', status:'Registered',   bisPortalStatus:'Live',    soldDate:'2026-08-15', invoiceNo:'INV-2026-8840', customer:'Rajesh Patel', branch:'Mumbai HQ', verifiedBy:'Anil Mehta' },
    { id:'HM2026A003', sku:'BG-GLD-002', product:'Gold Bangles Pair',      category:'Bangles',   purity:'22K (916)',  grossWt:35.5, netWt:35.0, stoneWt:0.0,  hallmarkDate:'2026-07-25', bisRegDate:'2026-07-26', expiryDate:'N/A', centre:'HM-MUM-142', status:'Registered',   bisPortalStatus:'Live',    soldDate:null,         invoiceNo:null,           customer:null,         branch:'Mumbai HQ', verifiedBy:'Anil Mehta' },
    { id:'HM2026C004', sku:'ER-JHK-001', product:'Jhumka Earrings',        category:'Earrings',  purity:'22K (916)',  grossWt:8.8,  netWt:8.4,  stoneWt:0.4,  hallmarkDate:'2026-07-20', bisRegDate:'2026-07-21', expiryDate:'N/A', centre:'HM-MUM-142', status:'Registered',   bisPortalStatus:'Live',    soldDate:null,         invoiceNo:null,           customer:null,         branch:'Mumbai HQ', verifiedBy:'Anil Mehta' },
    { id:'HM2026D005', sku:'PD-TMP-003', product:'Temple Pendant',         category:'Pendant',   purity:'24K (999)',  grossWt:5.3,  netWt:5.1,  stoneWt:0.2,  hallmarkDate:'2026-08-01', bisRegDate:'2026-08-02', expiryDate:'N/A', centre:'HM-MUM-142', status:'Registered',   bisPortalStatus:'Live',    soldDate:null,         invoiceNo:null,           customer:null,         branch:'Mumbai HQ', verifiedBy:'Anil Mehta' },
    { id:'HM2026E007', sku:'MS-GLD-001', product:'Gold Mangalsutra',       category:'Mangalsutra',purity:'22K (916)', grossWt:9.2,  netWt:9.2,  stoneWt:0.0,  hallmarkDate:'2026-08-05', bisRegDate:'2026-08-06', expiryDate:'N/A', centre:'HM-MUM-142', status:'Registered',   bisPortalStatus:'Live',    soldDate:null,         invoiceNo:null,           customer:null,         branch:'Delhi',     verifiedBy:'BIS Delhi' },
    { id:'HM2026F009', sku:'PD-EMR-001', product:'Emerald Pendant 18K',    category:'Pendant',   purity:'18K (750)',  grossWt:3.8,  netWt:2.6,  stoneWt:1.2,  hallmarkDate:'2026-08-03', bisRegDate:'2026-08-04', expiryDate:'N/A', centre:'HM-MUM-142', status:'Registered',   bisPortalStatus:'Live',    soldDate:null,         invoiceNo:null,           customer:null,         branch:'Jaipur',    verifiedBy:'BIS Jaipur' },
    { id:'HM2026G010', sku:'CH-GLD-001', product:'Gold Box Chain 20"',     category:'Chain',     purity:'22K (916)',  grossWt:12.0, netWt:12.0, stoneWt:0.0,  hallmarkDate:'2026-08-06', bisRegDate:'2026-08-07', expiryDate:'N/A', centre:'HM-MUM-142', status:'Registered',   bisPortalStatus:'Live',    soldDate:null,         invoiceNo:null,           customer:null,         branch:'Mumbai HQ', verifiedBy:'Anil Mehta' },
    { id:'HM2026I013', sku:'BT-DIA-001', product:'Diamond Tennis Bracelet',category:'Bracelet',  purity:'18K (750)',  grossWt:10.5, netWt:8.4,  stoneWt:2.1,  hallmarkDate:'2026-07-18', bisRegDate:'2026-07-19', expiryDate:'N/A', centre:'HM-MUM-142', status:'Registered',   bisPortalStatus:'Live',    soldDate:null,         invoiceNo:null,           customer:null,         branch:'Mumbai HQ', verifiedBy:'Anil Mehta' },
    { id:'HM2026K015', sku:'CN-GLD-001', product:'Gold Coin 8g Lakshmi',   category:'Coin',      purity:'24K (999)',  grossWt:8.0,  netWt:8.0,  stoneWt:0.0,  hallmarkDate:'2026-08-09', bisRegDate:'2026-08-10', expiryDate:'N/A', centre:'HM-MUM-142', status:'Registered',   bisPortalStatus:'Live',    soldDate:null,         invoiceNo:null,           customer:null,         branch:'Mumbai HQ', verifiedBy:'Anil Mehta' },
    // Pending items
    { id:null, sku:'BG-GLD-005', product:'Gold Bangle Set Premium',  category:'Bangles',   purity:'22K (916)',  grossWt:42.0, netWt:41.5, stoneWt:0.5,  hallmarkDate:null, bisRegDate:null, expiryDate:null, centre:'HM-MUM-142', status:'Pending', bisPortalStatus:'Not Uploaded', soldDate:null, invoiceNo:null, customer:null, branch:'Mumbai HQ', verifiedBy:null },
    { id:null, sku:'RG-GLD-003', product:'Gold Solitaire Ring',       category:'Ring',      purity:'18K (750)',  grossWt:5.2,  netWt:5.0,  stoneWt:0.2,  hallmarkDate:null, bisRegDate:null, expiryDate:null, centre:'HM-MUM-142', status:'Pending', bisPortalStatus:'Not Uploaded', soldDate:null, invoiceNo:null, customer:null, branch:'Mumbai HQ', verifiedBy:null },
    { id:null, sku:'NK-GLD-004', product:'Gold Choker Necklace',      category:'Necklace',  purity:'22K (916)',  grossWt:38.0, netWt:37.2, stoneWt:0.8,  hallmarkDate:null, bisRegDate:null, expiryDate:null, centre:'HM-MUM-142', status:'Pending', bisPortalStatus:'Not Uploaded', soldDate:null, invoiceNo:null, customer:null, branch:'Mumbai HQ', verifiedBy:null },
    { id:null, sku:'ER-GLD-007', product:'Gold Drop Earrings',        category:'Earrings',  purity:'22K (916)',  grossWt:7.4,  netWt:7.1,  stoneWt:0.3,  hallmarkDate:null, bisRegDate:null, expiryDate:null, centre:'HM-MUM-142', status:'Sent to Centre', bisPortalStatus:'Processing', soldDate:null, invoiceNo:null, customer:null, branch:'Mumbai HQ', verifiedBy:null },
    { id:null, sku:'BR-GLD-002', product:'Gold Bracelet 18K',         category:'Bracelet',  purity:'18K (750)',  grossWt:11.5, netWt:11.2, stoneWt:0.3,  hallmarkDate:null, bisRegDate:null, expiryDate:null, centre:'HM-MUM-142', status:'Sent to Centre', bisPortalStatus:'Processing', soldDate:null, invoiceNo:null, customer:null, branch:'Mumbai HQ', verifiedBy:null },
  ],

  // ---- VERIFICATION LOG ----
  verifications: [
    { id:'VER001', huid:'HM2026A001', product:'Kundan Necklace Set',    verifiedBy:'Karan Mehta',   date:'2026-08-16', method:'HUID App Scan', result:'Genuine ✅', remarks:'Matches BIS portal exactly' },
    { id:'VER002', huid:'HM2026B002', product:'Diamond Solitaire Ring', verifiedBy:'Ravi Sharma',   date:'2026-08-15', method:'BIS Portal Check', result:'Genuine ✅', remarks:'Sold item — customer verification' },
    { id:'VER003', huid:'HM2026C004', product:'Jhumka Earrings',        verifiedBy:'Deepika Singh', date:'2026-08-14', method:'Physical Stamp', result:'Genuine ✅', remarks:'BIS stamp visible & clear' },
    { id:'VER004', huid:'HM2026G010', product:'Gold Box Chain',         verifiedBy:'Karan Mehta',   date:'2026-08-12', method:'HUID App Scan', result:'Genuine ✅', remarks:'Clean verification' },
    { id:'VER005', huid:'UNKNOWN',    product:'Unknown Ring (Customer)',  verifiedBy:'Ravi Sharma',  date:'2026-08-10', method:'HUID App Scan', result:'⚠️ Not Found', remarks:'HUID not in BIS database — possible fake' },
    { id:'VER006', huid:'HM2026I013', product:'Diamond Tennis Bracelet',verifiedBy:'Ravi Sharma',   date:'2026-08-08', method:'BIS Portal Check', result:'Genuine ✅', remarks:'Matches registered data' },
  ],

  // ---- CERTIFICATES ----
  certificates: [
    { id:'CERT001', huid:'HM2026A001', product:'Kundan Necklace Set',    sku:'NK-KND-001', purity:'22K (916)', grossWt:29.0, netWt:28.5, issuedDate:'2026-08-10', centre:'HM-MUM-142', centreName:'BIS Centre Fort Mumbai', bisAssessor:'Anil Mehta', invoiceNo:null,          customer:null,           serialOnCert:'NK-KND-001-001', status:'Active' },
    { id:'CERT002', huid:'HM2026B002', product:'Diamond Solitaire Ring', sku:'RG-DIA-001', purity:'18K (750)', grossWt:4.5,  netWt:4.2,  issuedDate:'2026-08-08', centre:'HM-MUM-142', centreName:'BIS Centre Fort Mumbai', bisAssessor:'Anil Mehta', invoiceNo:'INV-2026-8840', customer:'Rajesh Patel',  serialOnCert:'RG-DIA-001-001', status:'Sold' },
    { id:'CERT003', huid:'HM2026A003', product:'Gold Bangles Pair',      sku:'BG-GLD-002', purity:'22K (916)', grossWt:35.5, netWt:35.0, issuedDate:'2026-07-25', centre:'HM-MUM-142', centreName:'BIS Centre Fort Mumbai', bisAssessor:'Anil Mehta', invoiceNo:null,          customer:null,           serialOnCert:'BG-GLD-002-001', status:'Active' },
    { id:'CERT004', huid:'HM2026C004', product:'Jhumka Earrings',        sku:'ER-JHK-001', purity:'22K (916)', grossWt:8.8,  netWt:8.4,  issuedDate:'2026-07-20', centre:'HM-MUM-142', centreName:'BIS Centre Fort Mumbai', bisAssessor:'Anil Mehta', invoiceNo:null,          customer:null,           serialOnCert:'ER-JHK-001-001', status:'Active' },
    { id:'CERT005', huid:'HM2026D005', product:'Temple Pendant',         sku:'PD-TMP-003', purity:'24K (999)', grossWt:5.3,  netWt:5.1,  issuedDate:'2026-08-01', centre:'HM-MUM-142', centreName:'BIS Centre Fort Mumbai', bisAssessor:'Anil Mehta', invoiceNo:null,          customer:null,           serialOnCert:'PD-TMP-003-001', status:'Active' },
    { id:'CERT006', huid:'HM2026I013', product:'Diamond Tennis Bracelet',sku:'BT-DIA-001', purity:'18K (750)', grossWt:10.5, netWt:8.4,  issuedDate:'2026-07-18', centre:'HM-MUM-142', centreName:'BIS Centre Fort Mumbai', bisAssessor:'Anil Mehta', invoiceNo:null,          customer:null,           serialOnCert:'BT-DIA-001-001', status:'Active' },
    { id:'CERT007', huid:'HM2026K015', product:'Gold Coin 8g Lakshmi',   sku:'CN-GLD-001', purity:'24K (999)', grossWt:8.0,  netWt:8.0,  issuedDate:'2026-08-09', centre:'HM-MUM-142', centreName:'BIS Centre Fort Mumbai', bisAssessor:'Anil Mehta', invoiceNo:null,          customer:null,           serialOnCert:'CN-GLD-001-001', status:'Active' },
  ],
};

// ============================================================
// UTILITIES
// ============================================================
function hmFmt(n)  { return '₹' + (n||0).toLocaleString('en-IN'); }
function hmDate(d) { if(!d) return '—'; const dt=new Date(d); return isNaN(dt)?d:dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function hmBadge(s) {
  const m = {
    'Registered':'badge-green', 'Active':'badge-green', 'Sold':'badge-blue',
    'Pending':'badge-orange', 'Sent to Centre':'badge-blue',
    'Not Uploaded':'badge-grey', 'Processing':'badge-orange',
    'Live':'badge-green', 'Cancelled':'badge-red',
  };
  return `<span class="badge ${m[s]||'badge-grey'}">${s}</span>`;
}
function hmPurityColor(p) {
  if (p.includes('24K')||p.includes('999')) return '#f0c040';
  if (p.includes('22K')||p.includes('916')) return '#b8860b';
  if (p.includes('18K')||p.includes('750')) return '#3498db';
  if (p.includes('14K')) return '#95a5a6';
  return 'var(--text-muted)';
}

// ============================================================
// 1. BIS HALLMARK — main registry
// ============================================================
let hmFilter = { search:'', status:'', purity:'', branch:'' };

function renderBisHallmark() {
  const tbody = document.getElementById('hm-bis-tbody');
  if (!tbody) return;
  const lq = hmFilter.search.toLowerCase();
  const data = HM.huid.filter(h => {
    const ms  = !lq || (h.id||'').toLowerCase().includes(lq) || h.product.toLowerCase().includes(lq) || h.sku.toLowerCase().includes(lq);
    const mst = !hmFilter.status || h.status === hmFilter.status;
    const mpu = !hmFilter.purity || h.purity.includes(hmFilter.purity.replace('K',''));
    const mb  = !hmFilter.branch || h.branch === hmFilter.branch;
    return ms && mst && mpu && mb;
  });

  // update kpis
  const registered = HM.huid.filter(h=>h.status==='Registered').length;
  const pending    = HM.huid.filter(h=>h.status==='Pending').length;
  const atCentre   = HM.huid.filter(h=>h.status==='Sent to Centre').length;
  const sold       = HM.huid.filter(h=>h.soldDate).length;
  const setK = (id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  setK('hm-kpi-registered', registered);
  setK('hm-kpi-pending',    pending);
  setK('hm-kpi-centre',     atCentre);
  setK('hm-kpi-sold',       sold);

  tbody.innerHTML = data.map(h => `
    <tr>
      <td>
        ${h.id
          ? `<span class="badge badge-gold" style="font-family:monospace;font-size:.72rem;letter-spacing:.5px">${h.id}</span>`
          : `<span class="badge badge-grey" style="font-size:.72rem">Not Assigned</span>`}
      </td>
      <td>
        <div style="font-weight:700;font-size:.85rem">${h.product}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">${h.sku} · ${h.category}</div>
      </td>
      <td><span style="font-weight:700;color:${hmPurityColor(h.purity)}">${h.purity}</span></td>
      <td>${h.grossWt}g / <span style="color:var(--accent)">${h.netWt}g net</span></td>
      <td>${hmDate(h.hallmarkDate)}</td>
      <td>${hmDate(h.bisRegDate)}</td>
      <td><code style="font-size:.73rem">${h.centre}</code></td>
      <td>${h.branch}</td>
      <td>${hmBadge(h.status)}</td>
      <td>${hmBadge(h.bisPortalStatus)}</td>
      <td>${h.soldDate ? `<div style="font-size:.78rem;color:var(--info)">${hmDate(h.soldDate)}</div><div style="font-size:.7rem;color:var(--text-muted)">${h.invoiceNo||''}</div>` : '—'}</td>
      <td style="white-space:nowrap">
        ${h.id ? `<button class="btn btn-outline btn-xs" onclick="openHuidDetail('${h.id}')">👁 View</button>` : ''}
        ${!h.id ? `<button class="btn btn-gold btn-xs" onclick="registerHUID('${h.sku}')">🔏 Register</button>` : ''}
        ${h.id ? `<button class="btn btn-outline btn-xs" onclick="openCertificate('${h.id}')">📄 Cert</button>` : ''}
        <button class="btn btn-outline btn-xs" onclick="openVerification('${h.id||h.sku}')">✅ Verify</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="12" style="text-align:center;padding:24px;color:var(--text-muted)">No items found</td></tr>`;
}

function setHmFilter(key, val) { hmFilter[key] = val; renderBisHallmark(); }

function registerHUID(sku) {
  openModal('registerHuidModal');
  document.getElementById('rhm-sku').value = sku || '';
  const huid = 'HM' + new Date().getFullYear() + String.fromCharCode(65+Math.floor(Math.random()*26)) + String(Math.floor(Math.random()*900)+100);
  document.getElementById('rhm-huid-preview').textContent = huid;
  document.getElementById('rhm-huid-val').value = huid;
}

function saveHuidRegistration() {
  const sku   = document.getElementById('rhm-sku')?.value?.trim();
  const huid  = document.getElementById('rhm-huid-val')?.value?.trim();
  const date  = document.getElementById('rhm-date')?.value;
  if (!sku || !huid || !date) { showToast('Fill all required fields', 'error'); return; }
  const item  = HM.huid.find(h=>h.sku===sku);
  if (item) {
    item.id           = huid;
    item.hallmarkDate = date;
    item.bisRegDate   = date;
    item.status       = 'Registered';
    item.bisPortalStatus = 'Live';
    item.verifiedBy   = 'Anil Mehta';
    // add cert
    HM.certificates.push({ id:'CERT'+Date.now(), huid, product:item.product, sku, purity:item.purity, grossWt:item.grossWt, netWt:item.netWt, issuedDate:date, centre:item.centre, centreName:'BIS Centre Fort Mumbai', bisAssessor:'Anil Mehta', invoiceNo:null, customer:null, serialOnCert:sku+'-NEW', status:'Active' });
  }
  closeModal('registerHuidModal');
  renderBisHallmark(); renderHuidTracking(); renderCertificates();
  showToast('HUID ' + huid + ' registered successfully!', 'success');
}

// ============================================================
// 2. HUID TRACKING
// ============================================================
function renderHuidTracking() {
  const tbody = document.getElementById('hm-track-tbody');
  if (!tbody) return;
  const registered = HM.huid.filter(h=>h.id);
  tbody.innerHTML = registered.map(h => {
    const lifecycle = h.soldDate ? 'Sold' : 'In Stock';
    const lifeBadge = h.soldDate ? 'badge-blue' : 'badge-green';
    return `<tr>
      <td><span class="badge badge-gold" style="font-family:monospace;font-size:.72rem">${h.id}</span></td>
      <td><strong>${h.product}</strong><br><span style="font-size:.72rem;color:var(--text-muted)">${h.sku}</span></td>
      <td><span style="color:${hmPurityColor(h.purity)};font-weight:700">${h.purity}</span></td>
      <td>${h.netWt}g</td>
      <td>${hmDate(h.hallmarkDate)}</td>
      <td>${hmDate(h.bisRegDate)}</td>
      <td><span class="badge ${lifeBadge}">${lifecycle}</span></td>
      <td>${h.branch}</td>
      <td>${h.soldDate ? `<div style="font-size:.8rem">${hmDate(h.soldDate)}</div><div style="font-size:.72rem;color:var(--text-muted)">${h.invoiceNo||''}</div><div style="font-size:.72rem;color:var(--info)">${h.customer||''}</div>` : '—'}</td>
      <td>${hmBadge(h.bisPortalStatus)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="openHuidDetail('${h.id}')">📋 Detail</button>
        <button class="btn btn-outline btn-xs" onclick="openVerification('${h.id}')">✅ Verify</button>
        <button class="btn btn-gold btn-xs" onclick="openCertificate('${h.id}')">📄 Cert</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="11" style="text-align:center;padding:20px;color:var(--text-muted)">No registered HUIDs</td></tr>`;
}

function openHuidDetail(id) {
  const h = HM.huid.find(x=>x.id===id);
  if (!h) return;
  openModal('huidDetailModal');
  document.getElementById('hdm-huid').textContent     = h.id;
  document.getElementById('hdm-product').textContent  = h.product;
  document.getElementById('hdm-sku').textContent      = h.sku;
  document.getElementById('hdm-cat').textContent      = h.category;
  document.getElementById('hdm-purity').textContent   = h.purity;
  document.getElementById('hdm-purity').style.color   = hmPurityColor(h.purity);
  document.getElementById('hdm-gross').textContent    = h.grossWt + 'g';
  document.getElementById('hdm-net').textContent      = h.netWt + 'g';
  document.getElementById('hdm-stone').textContent    = h.stoneWt + 'g';
  document.getElementById('hdm-hmdate').textContent   = hmDate(h.hallmarkDate);
  document.getElementById('hdm-bisdate').textContent  = hmDate(h.bisRegDate);
  document.getElementById('hdm-centre').textContent   = h.centre + ' — ' + HM.centre.name;
  document.getElementById('hdm-assessor').textContent = h.verifiedBy || '—';
  document.getElementById('hdm-status').innerHTML     = hmBadge(h.status);
  document.getElementById('hdm-portal').innerHTML     = hmBadge(h.bisPortalStatus);
  document.getElementById('hdm-branch').textContent   = h.branch;
  document.getElementById('hdm-sold').textContent     = h.soldDate ? hmDate(h.soldDate) + ' · ' + (h.invoiceNo||'') + ' · ' + (h.customer||'') : 'Not Sold — In Stock';
  document.getElementById('hdm-sold').style.color     = h.soldDate ? 'var(--info)' : 'var(--success)';
}

// ============================================================
// 3. HALLMARK VERIFICATION
// ============================================================
let verHistFilter = '';

function renderVerificationHistory() {
  const tbody = document.getElementById('hm-ver-tbody');
  if (!tbody) return;
  const lq = verHistFilter.toLowerCase();
  const data = lq ? HM.verifications.filter(v=>v.huid.toLowerCase().includes(lq)||v.product.toLowerCase().includes(lq)) : HM.verifications;
  tbody.innerHTML = data.map(v => {
    const genuine = v.result.includes('✅');
    return `<tr>
      <td><span class="badge badge-grey" style="font-size:.7rem">${v.id}</span></td>
      <td><code style="font-size:.75rem;color:${genuine?'var(--accent)':'var(--danger)'}">${v.huid}</code></td>
      <td>${v.product}</td>
      <td>${v.verifiedBy}</td>
      <td>${hmDate(v.date)}</td>
      <td><span class="badge badge-blue" style="font-size:.72rem">${v.method}</span></td>
      <td><span style="font-weight:700;color:${genuine?'var(--success)':'var(--danger)'}">${v.result}</span></td>
      <td style="font-size:.78rem;color:var(--text-muted)">${v.remarks}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">No verification records</td></tr>`;
}

function openVerification(huidOrSku) {
  openModal('verifyHuidModal');
  document.getElementById('ver-input').value = huidOrSku !== 'undefined' ? huidOrSku : '';
  if (huidOrSku && huidOrSku !== 'undefined') runVerification(huidOrSku);
}

function runVerification(val) {
  if (!val) val = document.getElementById('ver-input')?.value?.trim().toUpperCase();
  if (!val) { showToast('Enter a HUID to verify', 'error'); return; }
  const h = HM.huid.find(x=>x.id===val||x.sku===val);
  const result = document.getElementById('ver-result');
  if (!result) return;
  if (h && h.id) {
    result.style.display = 'block';
    result.style.background = 'rgba(46,204,113,.1)';
    result.style.borderLeft = '3px solid var(--success)';
    result.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="font-size:2rem">✅</span>
        <div>
          <div style="font-weight:800;font-size:1rem;color:var(--success)">GENUINE — BIS Hallmarked</div>
          <div style="font-size:.78rem;color:var(--text-muted)">Verified against BIS Central Portal</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.83rem">
        <div><span style="color:var(--text-muted)">HUID:</span> <strong style="color:var(--accent);font-family:monospace">${h.id}</strong></div>
        <div><span style="color:var(--text-muted)">Item:</span> <strong>${h.product}</strong></div>
        <div><span style="color:var(--text-muted)">Purity:</span> <strong style="color:${hmPurityColor(h.purity)}">${h.purity}</strong></div>
        <div><span style="color:var(--text-muted)">Net Weight:</span> <strong>${h.netWt}g</strong></div>
        <div><span style="color:var(--text-muted)">Hallmark Date:</span> <strong>${hmDate(h.hallmarkDate)}</strong></div>
        <div><span style="color:var(--text-muted)">BIS Centre:</span> <strong>${h.centre}</strong></div>
        <div><span style="color:var(--text-muted)">Status:</span> ${hmBadge(h.status)}</div>
        <div><span style="color:var(--text-muted)">Sold:</span> ${h.soldDate?`<span style="color:var(--info)">${hmDate(h.soldDate)} to ${h.customer}</span>`:'<span style="color:var(--success)">In Stock</span>'}</div>
      </div>`;
    // log verification
    HM.verifications.unshift({ id:'VER'+Date.now(), huid:val, product:h.product, verifiedBy:'Ravi Sharma', date:new Date().toISOString().slice(0,10), method:'HUID App Scan', result:'Genuine ✅', remarks:'Verified via ERP portal' });
  } else {
    result.style.display = 'block';
    result.style.background = 'rgba(231,76,60,.1)';
    result.style.borderLeft = '3px solid var(--danger)';
    result.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:2rem">⚠️</span>
        <div>
          <div style="font-weight:800;font-size:1rem;color:var(--danger)">NOT FOUND IN BIS DATABASE</div>
          <div style="font-size:.82rem;margin-top:4px">HUID <strong>${val}</strong> is not registered. This item may be fake or the HUID may be incorrectly entered.</div>
          <div style="font-size:.78rem;margin-top:6px;color:var(--text-muted)">Contact BIS helpline: 1800-11-4566</div>
        </div>
      </div>`;
    HM.verifications.unshift({ id:'VER'+Date.now(), huid:val, product:'Unknown Item', verifiedBy:'Ravi Sharma', date:new Date().toISOString().slice(0,10), method:'HUID App Scan', result:'⚠️ Not Found', remarks:'HUID not in BIS database' });
  }
  renderVerificationHistory();
}

// ============================================================
// 4. HALLMARK CERTIFICATES
// ============================================================
function renderCertificates() {
  const tbody = document.getElementById('hm-cert-tbody');
  if (!tbody) return;
  tbody.innerHTML = HM.certificates.map(c => `
    <tr>
      <td><span class="badge badge-grey" style="font-size:.7rem">${c.id}</span></td>
      <td><code style="font-size:.75rem;color:var(--accent)">${c.huid}</code></td>
      <td><strong>${c.product}</strong><br><span style="font-size:.72rem;color:var(--text-muted)">${c.sku}</span></td>
      <td><span style="font-weight:700;color:${hmPurityColor(c.purity)}">${c.purity}</span></td>
      <td>${c.grossWt}g / ${c.netWt}g</td>
      <td>${hmDate(c.issuedDate)}</td>
      <td style="font-size:.78rem"><code>${c.centre}</code><br><span style="color:var(--text-muted)">${c.bisAssessor}</span></td>
      <td>${c.customer ? `<div style="font-size:.8rem">${c.customer}</div><div style="font-size:.72rem;color:var(--text-muted)">${c.invoiceNo||''}</div>` : '<span style="color:var(--success)">In Stock</span>'}</td>
      <td>${hmBadge(c.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-gold btn-xs" onclick="openCertificate('${c.huid}')">📄 View</button>
        <button class="btn btn-outline btn-xs" onclick="printCertificate('${c.id}')">🖨️ Print</button>
        <button class="btn btn-outline btn-xs" onclick="downloadCertificate('${c.id}')">⬇️ PDF</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text-muted)">No certificates yet</td></tr>`;
}

let activeCertHuid = null;

function openCertificate(huid) {
  const h  = HM.huid.find(x=>x.id===huid);
  const c  = HM.certificates.find(x=>x.huid===huid);
  if (!h && !c) { showToast('Certificate not found for HUID: '+huid, 'error'); return; }
  activeCertHuid = huid;
  const src = h || {};
  const cert = c || {};
  openModal('certViewModal');

  // Populate certificate preview
  document.getElementById('cv-huid').textContent       = huid;
  document.getElementById('cv-product').textContent    = src.product || cert.product || '—';
  document.getElementById('cv-sku').textContent        = src.sku || cert.sku || '—';
  document.getElementById('cv-purity').textContent     = src.purity || cert.purity || '—';
  document.getElementById('cv-purity').style.color     = hmPurityColor(src.purity || cert.purity || '');
  document.getElementById('cv-gross').textContent      = (src.grossWt || cert.grossWt || 0) + 'g';
  document.getElementById('cv-net').textContent        = (src.netWt   || cert.netWt   || 0) + 'g';
  document.getElementById('cv-stone').textContent      = (src.stoneWt || 0) + 'g';
  document.getElementById('cv-hmdate').textContent     = hmDate(src.hallmarkDate || cert.issuedDate);
  document.getElementById('cv-bisdate').textContent    = hmDate(src.bisRegDate   || cert.issuedDate);
  document.getElementById('cv-centre-code').textContent = HM.centre.code;
  document.getElementById('cv-centre-name').textContent = HM.centre.name;
  document.getElementById('cv-bis-lic').textContent    = HM.centre.bisLicNo;
  document.getElementById('cv-assessor').textContent   = src.verifiedBy || cert.bisAssessor || HM.centre.assessor;
  document.getElementById('cv-cert-id').textContent    = cert.id || ('CERT-' + huid);
  document.getElementById('cv-serial').textContent     = cert.serialOnCert || src.sku || '—';
  document.getElementById('cv-issued-to').textContent  = src.customer || cert.customer || 'In Stock — Not Sold';
  document.getElementById('cv-invoice').textContent    = src.invoiceNo || cert.invoiceNo || '—';
  document.getElementById('cv-status').innerHTML       = hmBadge(cert.status || src.status || 'Active');
  // QR placeholder
  const qrCanvas = document.getElementById('cv-qr');
  if (qrCanvas) { drawQROnCanvas('cv-qr', huid); }
}

function printCertificate(id) {
  const c = HM.certificates.find(x=>x.id===id);
  openCertificate(c?.huid || id);
  setTimeout(() => { showToast('Certificate sent to printer', 'success'); }, 300);
}

function downloadCertificate(id) {
  showToast('Certificate PDF downloading...', 'success');
}

// ============================================================
// MASTER INIT
// ============================================================
function initHallmarkModule() {
  renderBisHallmark();
  renderHuidTracking();
  renderVerificationHistory();
  renderCertificates();
}

document.addEventListener('DOMContentLoaded', () => {
  const orig = window.showModule;
  if (typeof orig === 'function') {
    window.showModule = function(moduleId, navEl) {
      orig(moduleId, navEl);
      if (moduleId === 'hallmark') setTimeout(initHallmarkModule, 60);
    };
  }
});

// Search helpers called from HTML
function hmTrackSearch(q) {
  const tbody = document.getElementById('hm-track-tbody');
  if (!tbody) return;
  const lq = q.toLowerCase();
  const data = lq ? HM.huid.filter(h=>h.id&&(h.id.toLowerCase().includes(lq)||h.sku.toLowerCase().includes(lq)||h.product.toLowerCase().includes(lq))) : HM.huid.filter(h=>h.id);
  tbody.innerHTML = data.map(h => {
    const lifecycle = h.soldDate ? 'Sold' : 'In Stock';
    return `<tr>
      <td><span class="badge badge-gold" style="font-family:monospace;font-size:.72rem">${h.id}</span></td>
      <td><strong>${h.product}</strong><br><span style="font-size:.72rem;color:var(--text-muted)">${h.sku}</span></td>
      <td><span style="color:${hmPurityColor(h.purity)};font-weight:700">${h.purity}</span></td>
      <td>${h.netWt}g</td>
      <td>${hmDate(h.hallmarkDate)}</td>
      <td>${hmDate(h.bisRegDate)}</td>
      <td><span class="badge badge-${lifecycle==='Sold'?'blue':'green'}">${lifecycle}</span></td>
      <td>${h.branch}</td>
      <td>${h.soldDate?`${hmDate(h.soldDate)} · ${h.invoiceNo||''} · ${h.customer||''}`:'—'}</td>
      <td>${hmBadge(h.bisPortalStatus)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="openHuidDetail('${h.id}')">📋</button>
        <button class="btn btn-outline btn-xs" onclick="openVerification('${h.id}')">✅</button>
        <button class="btn btn-gold btn-xs" onclick="openCertificate('${h.id}')">📄</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="11" style="text-align:center;padding:20px;color:var(--text-muted)">No results</td></tr>`;
}

function hmCertSearch(q) {
  const tbody = document.getElementById('hm-cert-tbody');
  if (!tbody) return;
  const lq = q.toLowerCase();
  const data = lq ? HM.certificates.filter(c=>c.huid.toLowerCase().includes(lq)||c.product.toLowerCase().includes(lq)||c.id.toLowerCase().includes(lq)) : HM.certificates;
  tbody.innerHTML = data.map(c => `
    <tr>
      <td><span class="badge badge-grey" style="font-size:.7rem">${c.id}</span></td>
      <td><code style="font-size:.75rem;color:var(--accent)">${c.huid}</code></td>
      <td><strong>${c.product}</strong><br><span style="font-size:.72rem;color:var(--text-muted)">${c.sku}</span></td>
      <td><span style="font-weight:700;color:${hmPurityColor(c.purity)}">${c.purity}</span></td>
      <td>${c.grossWt}g / ${c.netWt}g</td>
      <td>${hmDate(c.issuedDate)}</td>
      <td style="font-size:.78rem"><code>${c.centre}</code><br><span style="color:var(--text-muted)">${c.bisAssessor}</span></td>
      <td>${c.customer?`${c.customer}<br><span style="font-size:.72rem;color:var(--text-muted)">${c.invoiceNo||''}</span>`:'<span style="color:var(--success)">In Stock</span>'}</td>
      <td>${hmBadge(c.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-gold btn-xs" onclick="openCertificate('${c.huid}')">📄 View</button>
        <button class="btn btn-outline btn-xs" onclick="printCertificate('${c.id}')">🖨️</button>
        <button class="btn btn-outline btn-xs" onclick="downloadCertificate('${c.id}')">⬇️</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text-muted)">No results</td></tr>`;
}
