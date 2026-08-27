/* ===========================
   CERITAGE JEWELRY ERP
   Core Application Logic
   =========================== */

// ======= SESSION / AUTH CHECK =======
(function() {
  const auth = sessionStorage.getItem('ceritage_auth');
  if (!auth || auth !== 'true') {
    // Login nahi kiya — wapas login page pe bhejo
    window.location.href = '/';
    return;
  }
  // User ka naam sidebar mein set karo
  const storedUser = sessionStorage.getItem('ceritage_user') || 'Admin';
  const nameEl = document.querySelector('.u-name');
  if (nameEl) nameEl.textContent = storedUser.charAt(0).toUpperCase() + storedUser.slice(1);
  // Avatar initials
  const avatarEls = document.querySelectorAll('.avatar[title="Profile"]');
  const initials = storedUser.slice(0, 2).toUpperCase();
  avatarEls.forEach(el => { el.textContent = initials; });
})();

// ======= LOGOUT =======
function logout() {
  sessionStorage.removeItem('ceritage_auth');
  sessionStorage.removeItem('ceritage_user');
  // React app ka login page
  window.location.href = '/';
}

// ======= NAVIGATION =======
function showModule(moduleId, navEl) {
  // ceritage_user ab plain string hai (username), role hamesha admin hai
  const role = 'admin';

  // Role-based access restrictions
  const restricted = {
    'sales': ['cashier'],
    'accounting': ['admin', 'branch_manager', 'accounts'],
    'reports': ['admin', 'branch_manager', 'accounts'],
    'users': ['admin'],
    'security': ['admin'],
    'compliance': ['admin', 'accounts'],
    'tunch': ['admin', 'branch_manager', 'accounts'],
    'employees': ['admin', 'branch_manager'],
    'suppliers': ['admin', 'branch_manager', 'accounts'],
    'gst': ['admin', 'accounts'],
    'branch': ['admin'],
    'ai': ['admin', 'branch_manager'],
  };

  if (restricted[moduleId] && !restricted[moduleId].includes(role)) {
    showToast('Access denied for your role.', 'error');
    return;
  }
  document.querySelectorAll('.module-page').forEach(p => p.classList.add('hidden'));
  const page = document.getElementById(moduleId);
  if (page) { page.classList.remove('hidden'); page.classList.add('fade-in'); }

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');

  // Update topbar title
  const titles = {
    'dashboard': 'Dashboard', 'customers': 'Customer Management',
    'products': 'Product & Inventory', 'billing': 'Billing & GST Invoice',
    'purchase': 'Purchase Management', 'sales': 'Sales Management',
    'gold-exchange': 'Gold Exchange', 'repair': 'Repair Job Card',
    'orders': 'Order Booking', 'inventory': 'Inventory Management',
    'karigar': 'Karigar Management', 'hallmark': 'Hallmark & HUID',
    'rates': 'Gold & Silver Rates', 'accounting': 'Accounting',
    'payments': 'Payment Modes', 'emi': 'EMI & Credit Management',
    'reports': 'Reports & Analytics', 'employees': 'Employee Management',
    'suppliers': 'Supplier Management', 'users': 'Multi-User Login',
    'security': 'Security Settings', 'ai': 'AI Features',
    'cloud': 'Cloud & Backup', 'communication': 'Communication',
    'gst-returns': 'GST Returns Filing', 'analytics': 'Analytics Dashboard',
    'branch': 'Multi-Branch Management', 'jangad': 'Jangad & Approval',
    'tunch': 'Fine Metal Ledger', 'rfid': 'RFID & Tray Audit',
    'advance': 'Advance Orders / Rate Lock', 'compliance': 'TCS & Compliance'
  };
  const el = document.getElementById('current-module-title');
  if (el) el.textContent = titles[moduleId] || moduleId;
}

// ======= TABS =======
function showTab(tabId, btnEl, container) {
  const parent = container || document.body;
  parent.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const tc = parent.querySelector('#' + tabId);
  if (tc) tc.classList.add('active');
  if (btnEl) btnEl.classList.add('active');
}

// ======= MODAL =======
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}
// Close on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ======= TOGGLE =======
function toggleSwitch(el) { el.classList.toggle('on'); }

// ======= GOLD RATE TICKER =======
const goldRates = { gold22: 7240, gold24: 7890, silver: 92 };
function updateGoldTicker() {
  const el = document.getElementById('gold-ticker');
  if (!el) return;
  const change = (Math.random() * 40 - 20).toFixed(0);
  const dir = change > 0 ? 'up' : 'down';
  el.innerHTML = `🏅 22K: ₹${goldRates.gold22}/g &nbsp;|&nbsp; 24K: ₹${goldRates.gold24}/g &nbsp;|&nbsp; 🥈 Silver: ₹${goldRates.silver}/g <span class="${dir}">${dir === 'up' ? '▲' : '▼'} ₹${Math.abs(change)}</span>`;
}
setInterval(updateGoldTicker, 8000);

// ======= CHARTS (Canvas) =======
function drawBarChart(canvasId, labels, values, color = '#b8860b') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const max = Math.max(...values) || 1;
  const pad = 36, barW = (W - pad * 2) / values.length - 8;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad + (H - pad * 2) * i / 4;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  }

  values.forEach((val, i) => {
    const x = pad + i * ((W - pad * 2) / values.length) + 4;
    const barH = ((H - pad * 2) * val / max);
    const y = H - pad - barH;

    // Bar gradient
    const grad = ctx.createLinearGradient(0, y, 0, H - pad);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '44');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    // Label
    ctx.fillStyle = '#6b5e4e';
    ctx.font = '10px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x + barW / 2, H - 10);

    // Value
    ctx.fillStyle = '#f0c040';
    ctx.font = 'bold 10px Segoe UI';
    ctx.fillText('₹' + formatK(val), x + barW / 2, y - 5);
  });
}

function drawLineChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = 40;
  let max = 0;
  datasets.forEach(ds => ds.values.forEach(v => { if (v > max) max = v; }));
  if (!max) max = 1;

  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i <= 4; i++) {
    const y = pad + (H - pad * 2) * i / 4;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  }

  datasets.forEach(ds => {
    const pts = ds.values.map((v, i) => ({
      x: pad + i * (W - pad * 2) / (ds.values.length - 1),
      y: H - pad - (H - pad * 2) * v / max
    }));

    // Fill
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H - pad);
    ctx.lineTo(pts[0].x, H - pad);
    ctx.closePath();
    ctx.fillStyle = ds.color + '22';
    ctx.fill();

    // Line
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = ds.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = ds.color; ctx.fill();
    });

    // Labels
    ctx.fillStyle = '#6b5e4e'; ctx.font = '10px Segoe UI'; ctx.textAlign = 'center';
    labels.forEach((l, i) => ctx.fillText(l, pad + i * (W - pad * 2) / (labels.length - 1), H - 8));
  });
}

function drawDonutChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2, r = 70, ir = 45;
  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = -Math.PI / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  data.forEach(d => {
    const slice = (d.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = d.color; ctx.fill();
    angle += slice;
  });

  // Inner hole
  ctx.beginPath(); ctx.arc(cx, cy, ir, 0, Math.PI * 2);
  ctx.fillStyle = '#1c1c2e'; ctx.fill();

  // Center text
  ctx.fillStyle = '#f0c040'; ctx.font = 'bold 18px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillText('₹' + formatK(total), cx, cy + 5);
  ctx.fillStyle = '#6b5e4e'; ctx.font = '10px Segoe UI';
  ctx.fillText('Total', cx, cy + 18);
}

function formatK(n) {
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n;
}

// ======= SAMPLE DATA =======
const sampleCustomers = [
  { id: 'C001', name: 'Priya Sharma', phone: '9876543210', city: 'Mumbai', type: 'Gold', balance: 15000, total: 285000 },
  { id: 'C002', name: 'Rajesh Patel', phone: '9856231470', city: 'Ahmedabad', type: 'Silver', balance: 0, total: 142000 },
  { id: 'C003', name: 'Sunita Verma', phone: '9934521870', city: 'Delhi', type: 'Platinum', balance: 45000, total: 890000 },
  { id: 'C004', name: 'Amit Kumar', phone: '9712345678', city: 'Jaipur', type: 'Gold', balance: 5200, total: 320000 },
  { id: 'C005', name: 'Meena Singh', phone: '9623471230', city: 'Pune', type: 'Regular', balance: 0, total: 67000 },
  { id: 'C006', name: 'Vikram Malhotra', phone: '9845612370', city: 'Surat', type: 'Platinum', balance: 120000, total: 1250000 },
];

const sampleProducts = [
  { id:'P001', code:'PRD-2026-001', name:'Kundan Necklace Set',    sku:'NK-KND-001', jwlCat:'gold',     category:'Necklace',    subCat:'Bridal',       purity:'22K',        grossWt:29.0, stoneWt:0.5, netWt:28.5, wastage:2,   making:450,  purchasePrice:185000, sellingPrice:195000, mrp:206000,  discount:0,  stock:3,  huid:'HM2026A001', hsn:'7113', hallmark:'BIS Hallmarked', gender:'Women',  occasion:'Bridal',     brand:'Ceritage', collection:'Bridal 2026',  desc:'Traditional Kundan Necklace with Meenakari work, 22K gold',          emoji:'📿' },
  { id:'P002', code:'PRD-2026-002', name:'Diamond Solitaire Ring', sku:'RG-DIA-001', jwlCat:'diamond',  category:'Ring',        subCat:'Solitaire',    purity:'18K',        grossWt:4.5,  stoneWt:0.3, netWt:4.2,  wastage:1,   making:1200, purchasePrice:46000,  sellingPrice:55000,  mrp:58000,   discount:0,  stock:8,  huid:'HM2026B002', hsn:'7113', hallmark:'BIS Hallmarked', gender:'Women',  occasion:'Party',      brand:'Ceritage', collection:'Solitaire',    desc:'18K Gold Solitaire Ring with 0.5ct Round Brilliant Diamond',         emoji:'💍' },
  { id:'P003', code:'PRD-2026-003', name:'Gold Bangles Pair',      sku:'BG-GLD-002', jwlCat:'gold',     category:'Bangles',     subCat:'Plain',        purity:'22K',        grossWt:35.5, stoneWt:0.0, netWt:35.0, wastage:1.5, making:380,  purchasePrice:228000, sellingPrice:240000, mrp:253400,  discount:0,  stock:5,  huid:'HM2026A003', hsn:'7113', hallmark:'BIS Hallmarked', gender:'Women',  occasion:'Festival',   brand:'Ceritage', collection:'Heritage',     desc:'Plain 22K Gold Bangles pair, 35g total weight',                      emoji:'✨' },
  { id:'P004', code:'PRD-2026-004', name:'Jhumka Earrings',        sku:'ER-JHK-001', jwlCat:'gold',     category:'Earrings',    subCat:'Jhumka',       purity:'22K',        grossWt:8.8,  stoneWt:0.4, netWt:8.4,  wastage:2,   making:500,  purchasePrice:52000,  sellingPrice:57000,  mrp:60800,   discount:0,  stock:12, huid:'HM2026C004', hsn:'7113', hallmark:'BIS Hallmarked', gender:'Women',  occasion:'Festival',   brand:'Ceritage', collection:'Jhumka',       desc:'Traditional 22K Jhumka Earrings with stone work',                    emoji:'👂' },
  { id:'P005', code:'PRD-2026-005', name:'Temple Pendant',         sku:'PD-TMP-003', jwlCat:'gold',     category:'Pendant',     subCat:'Temple',       purity:'24K',        grossWt:5.3,  stoneWt:0.2, netWt:5.1,  wastage:1,   making:600,  purchasePrice:33000,  sellingPrice:38000,  mrp:40239,   discount:0,  stock:6,  huid:'HM2026D005', hsn:'7113', hallmark:'BIS Hallmarked', gender:'Women',  occasion:'Daily Wear', brand:'Ceritage', collection:'Temple',       desc:'24K Gold Temple Pendant with Goddess Lakshmi motif',                 emoji:'🙏' },
  { id:'P006', code:'PRD-2026-006', name:'Silver Payal Pair',      sku:'SV-PYL-001', jwlCat:'silver',   category:'Anklet',      subCat:'Plain',        purity:'Silver 925', grossWt:45.5, stoneWt:0.0, netWt:45.0, wastage:0.5, making:80,   purchasePrice:3600,   sellingPrice:3900,   mrp:4140,    discount:5,  stock:15, huid:'',           hsn:'7113', hallmark:'Non-Hallmarked', gender:'Women',  occasion:'Daily Wear', brand:'Ceritage', collection:'Silver',       desc:'Pure Silver 925 Anklet Pair, plain design, 45g',                     emoji:'🦶' },
  { id:'P007', code:'PRD-2026-007', name:'Gold Mangalsutra',       sku:'MS-GLD-001', jwlCat:'gold',     category:'Mangalsutra', subCat:'Tanmaniya',    purity:'22K',        grossWt:9.2,  stoneWt:0.0, netWt:9.2,  wastage:1.5, making:420,  purchasePrice:65000,  sellingPrice:72000,  mrp:76800,   discount:0,  stock:4,  huid:'HM2026E007', hsn:'7113', hallmark:'BIS Hallmarked', gender:'Women',  occasion:'Bridal',     brand:'Ceritage', collection:'Bridal 2026',  desc:'22K Gold Tanmaniya Mangalsutra with black beads, 9.2g',              emoji:'🔴' },
  { id:'P008', code:'PRD-2026-008', name:'Platinum Band Ring',     sku:'RG-PLT-001', jwlCat:'platinum', category:'Ring',        subCat:'Band',         purity:'Platinum',   grossWt:5.1,  stoneWt:0.0, netWt:5.1,  wastage:0.5, making:1500, purchasePrice:28000,  sellingPrice:34000,  mrp:36500,   discount:0,  stock:3,  huid:'',           hsn:'7113', hallmark:'BIS Hallmarked', gender:'Unisex', occasion:'Daily Wear', brand:'Ceritage', collection:'Platinum',     desc:'Platinum 950 Plain Band Ring for Men/Women',                         emoji:'⬜' },
  { id:'P009', code:'PRD-2026-009', name:'Emerald Pendant 18K',    sku:'PD-EMR-001', jwlCat:'gemstone', category:'Pendant',     subCat:'Gemstone',     purity:'18K',        grossWt:3.8,  stoneWt:1.2, netWt:2.6,  wastage:1,   making:900,  purchasePrice:42000,  sellingPrice:52000,  mrp:55000,   discount:5,  stock:2,  huid:'HM2026F009', hsn:'7113', hallmark:'BIS Hallmarked', gender:'Women',  occasion:'Party',      brand:'Ceritage', collection:'Gemstone',     desc:'Natural Colombian Emerald Pendant in 18K Gold, 1.2ct stone',         emoji:'💚' },
  { id:'P010', code:'PRD-2026-010', name:'Gold Box Chain 20"',     sku:'CH-GLD-001', jwlCat:'gold',     category:'Chain',       subCat:'Box Chain',    purity:'22K',        grossWt:12.0, stoneWt:0.0, netWt:12.0, wastage:1,   making:320,  purchasePrice:85000,  sellingPrice:90000,  mrp:95400,   discount:0,  stock:7,  huid:'HM2026G010', hsn:'7113', hallmark:'BIS Hallmarked', gender:'Unisex', occasion:'Daily Wear', brand:'Ceritage', collection:'Heritage',     desc:'22K Gold Box Chain 20 inches, 12g, lobster clasp',                   emoji:'⛓️' },
  { id:'P011', code:'PRD-2026-011', name:'Gold Nose Pin Stud',     sku:'NP-GLD-001', jwlCat:'gold',     category:'Nose Pin',    subCat:'Stud',         purity:'22K',        grossWt:0.8,  stoneWt:0.0, netWt:0.8,  wastage:1,   making:600,  purchasePrice:5200,   sellingPrice:5800,   mrp:6200,    discount:0,  stock:20, huid:'HM2026H011', hsn:'7113', hallmark:'BIS Hallmarked', gender:'Women',  occasion:'Daily Wear', brand:'Ceritage', collection:'Daily',        desc:'22K Gold Plain Nose Stud Pin, 0.8g',                                 emoji:'👃' },
  { id:'P012', code:'PRD-2026-012', name:'Silver Oxidised Kada',   sku:'KD-SLV-001', jwlCat:'silver',   category:'Kada',        subCat:'Oxidised',     purity:'Silver 925', grossWt:28.0, stoneWt:0.0, netWt:28.0, wastage:0.5, making:90,   purchasePrice:2300,   sellingPrice:2600,   mrp:2800,    discount:0,  stock:9,  huid:'',           hsn:'7113', hallmark:'Non-Hallmarked', gender:'Men',    occasion:'Daily Wear', brand:'Ceritage', collection:'Silver',       desc:'925 Silver Oxidised Kada for Men, 28g',                              emoji:'⭕' },
  { id:'P013', code:'PRD-2026-013', name:'Diamond Tennis Bracelet',sku:'BR-DIA-001', jwlCat:'diamond',  category:'Bracelet',    subCat:'Tennis',       purity:'18K',        grossWt:10.5, stoneWt:2.1, netWt:8.4,  wastage:1,   making:1100, purchasePrice:120000, sellingPrice:145000, mrp:155000,  discount:3,  stock:2,  huid:'HM2026I013', hsn:'7113', hallmark:'BIS Hallmarked', gender:'Women',  occasion:'Party',      brand:'Ceritage', collection:'Solitaire',    desc:'18K Gold Tennis Bracelet with 2.1ct total diamond weight',           emoji:'✨' },
  { id:'P014', code:'PRD-2026-014', name:'Gold Toe Ring Pair',     sku:'TR-GLD-001', jwlCat:'gold',     category:'Toe Ring',    subCat:'Plain',        purity:'22K',        grossWt:2.4,  stoneWt:0.0, netWt:2.4,  wastage:1,   making:400,  purchasePrice:15500,  sellingPrice:17000,  mrp:18200,   discount:0,  stock:10, huid:'HM2026J014', hsn:'7113', hallmark:'BIS Hallmarked', gender:'Women',  occasion:'Daily Wear', brand:'Ceritage', collection:'Daily',        desc:'22K Gold Plain Toe Ring Pair (Bichiya), 2.4g pair',                  emoji:'🦶' },
  { id:'P015', code:'PRD-2026-015', name:'Gold Coin 8g Lakshmi',   sku:'CN-GLD-001', jwlCat:'gold',     category:'Coin',        subCat:'Lakshmi',      purity:'24K',        grossWt:8.0,  stoneWt:0.0, netWt:8.0,  wastage:0,   making:200,  purchasePrice:58000,  sellingPrice:62000,  mrp:64500,   discount:0,  stock:6,  huid:'HM2026K015', hsn:'7113', hallmark:'BIS Hallmarked', gender:'Unisex', occasion:'Gifting',    brand:'Ceritage', collection:'Coins',        desc:'24K Pure Gold Coin 8g with Goddess Lakshmi embossing',               emoji:'🪙' },
];

const sampleStones = [
  { id:'ST001', name:'Round Brilliant Diamond', type:'Diamond',        color:'G (Near Colorless)', shape:'Round Brilliant', size:'4.5×4.5mm', clarity:'VS1',  cut:'Excellent',  ratti:2.22,  carat:0.50, weightG:0.10, pieces:45, purchasePrice:24000, sellingPrice:28000, certNo:'GIA-2026-44891', supplier:'Diamond Palace',     status:'In Stock' },
  { id:'ST002', name:'Pigeon Blood Ruby',        type:'Ruby',           color:'Pigeon Blood Red',   shape:'Oval',            size:'8×6mm',     clarity:'N/A',  cut:'Mixed',      ratti:8.88,  carat:2.00, weightG:0.40, pieces:12, purchasePrice:15000, sellingPrice:18000, certNo:'IGI-2026-22341', supplier:'Ratanlal & Sons',    status:'In Stock' },
  { id:'ST003', name:'Colombian Emerald',        type:'Emerald',        color:'Deep Vivid Green',   shape:'Emerald Cut',     size:'7×5mm',     clarity:'N/A',  cut:'Step Cut',   ratti:6.66,  carat:1.50, weightG:0.30, pieces:8,  purchasePrice:12000, sellingPrice:15000, certNo:'GRS-2026-11023', supplier:'Gem World',          status:'In Stock' },
  { id:'ST004', name:'Ceylon Blue Sapphire',     type:'Sapphire',       color:'Royal Blue',         shape:'Cushion',         size:'9×7mm',     clarity:'N/A',  cut:'Very Good',  ratti:13.32, carat:3.00, weightG:0.60, pieces:6,  purchasePrice:18000, sellingPrice:22000, certNo:'IGI-2026-33412', supplier:'Gem World',          status:'In Stock' },
  { id:'ST005', name:'South Sea Pearl',          type:'Pearl',          color:'Cream White',        shape:'Round',           size:'10mm',      clarity:'N/A',  cut:'Cabochon',   ratti:0,     carat:0,    weightG:1.20, pieces:30, purchasePrice:2500,  sellingPrice:3200,  certNo:'',               supplier:'Gem World',          status:'In Stock' },
  { id:'ST006', name:'Ethiopian Welo Opal',      type:'Opal',           color:'Multi-Color Play',   shape:'Oval Cabochon',   size:'10×8mm',    clarity:'N/A',  cut:'Cabochon',   ratti:3.55,  carat:0.80, weightG:0.16, pieces:15, purchasePrice:3500,  sellingPrice:4500,  certNo:'',               supplier:'Ratanlal & Sons',    status:'In Stock' },
  { id:'ST007', name:'Sky Blue Topaz',           type:'Topaz',          color:'Sky Blue',           shape:'Pear',            size:'9×6mm',     clarity:'VVS1', cut:'Excellent',  ratti:4.44,  carat:1.00, weightG:0.20, pieces:20, purchasePrice:800,   sellingPrice:1200,  certNo:'',               supplier:'Ratanlal & Sons',    status:'In Stock' },
  { id:'ST008', name:'Mozambique Red Garnet',    type:'Garnet',         color:'Deep Red',           shape:'Round',           size:'5mm',       clarity:'VS1',  cut:'Good',       ratti:2.22,  carat:0.50, weightG:0.10, pieces:25, purchasePrice:1200,  sellingPrice:1800,  certNo:'',               supplier:'Ratanlal & Sons',    status:'In Stock' },
  { id:'ST009', name:'Blue Zircon',              type:'Zircon',         color:'Electric Blue',      shape:'Round Brilliant', size:'6mm',       clarity:'VVS2', cut:'Excellent',  ratti:3.11,  carat:0.70, weightG:0.14, pieces:18, purchasePrice:2000,  sellingPrice:3000,  certNo:'',               supplier:'Diamond Palace',     status:'In Stock' },
  { id:'ST010', name:'White Cubic Zirconia',     type:'Cubic Zirconia', color:'Colorless White',    shape:'Round Brilliant', size:'2mm',       clarity:'FL',   cut:'Excellent',  ratti:0.44,  carat:0.10, weightG:0.02, pieces:200,purchasePrice:50,    sellingPrice:100,   certNo:'',               supplier:'Diamond Palace',     status:'In Stock' },
  { id:'ST011', name:'Charles & Colvard Moissanite', type:'Moissanite', color:'D (Colorless)',      shape:'Round Brilliant', size:'6.5mm',     clarity:'VVS1', cut:'Excellent',  ratti:4.44,  carat:1.00, weightG:0.20, pieces:18, purchasePrice:4500,  sellingPrice:6500,  certNo:'MSI-2026-0077',  supplier:'Diamond Palace',     status:'In Stock' },
  { id:'ST012', name:'Burmese Ruby Small',       type:'Ruby',           color:'Pinkish Red',        shape:'Round',           size:'3mm',       clarity:'SI1',  cut:'Good',       ratti:1.33,  carat:0.30, weightG:0.06, pieces:40, purchasePrice:4500,  sellingPrice:6000,  certNo:'',               supplier:'Gem World',          status:'Low Stock' },
  { id:'ST013', name:'Princess Cut Diamond',     type:'Diamond',        color:'H (Near Colorless)', shape:'Princess Cut',    size:'4×4mm',     clarity:'VS2',  cut:'Very Good',  ratti:1.78,  carat:0.40, weightG:0.08, pieces:22, purchasePrice:18000, sellingPrice:22000, certNo:'GIA-2026-55672', supplier:'Diamond Palace',     status:'In Stock' },
  { id:'ST014', name:'Alexandrite',              type:'Other Precious', color:'Green / Red (Shift)','shape':'Oval',          size:'6×4mm',     clarity:'VS1',  cut:'Very Good',  ratti:2.44,  carat:0.55, weightG:0.11, pieces:4,  purchasePrice:35000, sellingPrice:45000, certNo:'GRS-2026-77234', supplier:'Gem World',          status:'Low Stock' },
  { id:'ST015', name:'Yellow Sapphire (Pukhraj)',type:'Sapphire',       color:'Canary Yellow',      shape:'Oval',            size:'8×6mm',     clarity:'N/A',  cut:'Mixed',      ratti:6.22,  carat:1.40, weightG:0.28, pieces:9,  purchasePrice:8000,  sellingPrice:12000, certNo:'',               supplier:'Ratanlal & Sons',    status:'In Stock' },
];

const sampleKarigars = [
  { id: 'K001', name: 'Ramesh Soni', phone: '9812345670', skill: 'Kundan Work', status: 'Active', pending: 3 },
  { id: 'K002', name: 'Suresh Meena', phone: '9745612340', skill: 'Diamond Setting', status: 'Active', pending: 1 },
  { id: 'K003', name: 'Harish Kumar', phone: '9923415670', skill: 'Polishing', status: 'Active', pending: 5 },
  { id: 'K004', name: 'Dinesh Prajapat', phone: '9867234510', skill: 'Enamel Work', status: 'Inactive', pending: 0 },
];

const sampleRepairs = [
  { id: 'RJ001', customer: 'Priya Sharma', item: 'Gold Necklace - Chain broken', karigar: 'Ramesh Soni', received: '2026-08-10', due: '2026-08-17', status: 'In Progress', advance: 500 },
  { id: 'RJ002', customer: 'Rajesh Patel', item: 'Diamond Ring - Resizing', karigar: 'Suresh Meena', received: '2026-08-12', due: '2026-08-15', status: 'Ready', advance: 200 },
  { id: 'RJ003', customer: 'Meena Singh', item: 'Silver Bangle - Polish', karigar: 'Harish Kumar', received: '2026-08-14', due: '2026-08-18', status: 'Pending', advance: 0 },
];

const sampleOrders = [
  { id: 'ORD001', customer: 'Sunita Verma', item: 'Custom Bridal Set', weight: '120g', advance: 50000, due: '2026-09-15', status: 'In Design' },
  { id: 'ORD002', customer: 'Vikram Malhotra', item: 'Solitaire Ring 2ct', weight: '8g', advance: 100000, due: '2026-09-01', status: 'Manufacturing' },
];

const sampleSuppliers = [
  { id: 'SUP001', name: 'Zaveri Bullion Pvt Ltd', city: 'Mumbai', type: 'Gold', outstanding: 450000, gstin: '27AABCZ1234B1Z5' },
  { id: 'SUP002', name: 'Diamond Palace', city: 'Surat', type: 'Diamond', outstanding: 180000, gstin: '24AABCD5678B1Z3' },
  { id: 'SUP003', name: 'Rajasthan Stone Works', city: 'Jaipur', type: 'Stones', outstanding: 75000, gstin: '08AABCR9012B1Z1' },
];

const sampleEmployees = [
  { id: 'EMP001', name: 'Karan Mehta', role: 'Sales Executive', phone: '9834512670', salary: 35000, join: '2024-01-15', status: 'Active' },
  { id: 'EMP002', name: 'Pooja Jain', role: 'Accountant', phone: '9712345698', salary: 40000, join: '2023-06-01', status: 'Active' },
  { id: 'EMP003', name: 'Ravi Sharma', role: 'Store Manager', phone: '9845672310', salary: 55000, join: '2022-03-10', status: 'Active' },
  { id: 'EMP004', name: 'Deepika Singh', role: 'Cashier', phone: '9923456712', salary: 28000, join: '2025-02-20', status: 'Active' },
];

// ======= DOM READY =======
document.addEventListener('DOMContentLoaded', () => {
  updateGoldTicker();

  // Render charts on dashboard
  setTimeout(() => {
    drawBarChart('salesChart', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      [485000, 620000, 550000, 780000, 690000, 840000, 910000, 750000]);
    drawLineChart('trendChart', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      [
        { values: [40, 55, 48, 72, 65, 81], color: '#b8860b' },
        { values: [30, 42, 38, 50, 44, 60], color: '#3498db' }
      ]);
    drawDonutChart('salesBreakdown',
      [
        { value: 450000, color: '#b8860b' },
        { value: 280000, color: '#3498db' },
        { value: 180000, color: '#2ecc71' },
        { value: 90000, color: '#9b59b6' }
      ]);
  }, 100);

  // Populate customer table
  renderCustomerTable();
  renderProductGrid();
  renderProductListTable();
  renderStoneTable();
  renderKarigarTable();
  renderRepairTable();
  renderOrderTable();
  renderSupplierTable();
  renderEmployeeTable();
});

// ======= RENDER FUNCTIONS =======
function renderCustomerTable(filter = '') {
  const tbody = document.getElementById('customer-tbody');
  if (!tbody) return;
  const data = filter ? sampleCustomers.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    c.phone.includes(filter)
  ) : sampleCustomers;

  tbody.innerHTML = data.map(c => `
    <tr>
      <td><span class="badge badge-grey">${c.id}</span></td>
      <td><strong>${c.name}</strong></td>
      <td>${c.phone}</td>
      <td>${c.city}</td>
      <td><span class="badge badge-${c.type === 'Platinum' ? 'purple' : c.type === 'Gold' ? 'gold' : c.type === 'Silver' ? 'blue' : 'grey'}">${c.type}</span></td>
      <td class="${c.balance > 0 ? 'text-danger' : 'text-success'}">₹${c.balance.toLocaleString()}</td>
      <td>₹${c.total.toLocaleString()}</td>
      <td>
        <button class="btn btn-outline btn-xs" onclick="viewCustomer('${c.id}')">👁 View</button>
        <button class="btn btn-gold btn-xs" onclick="openModal('newBillModal')">🧾 Bill</button>
      </td>
    </tr>
  `).join('');
}

function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const catFilter    = (document.getElementById('gridCatFilter')    || {}).value || '';
  const purityFilter = (document.getElementById('gridPurityFilter') || {}).value || '';
  const sortVal      = (document.getElementById('gridSortFilter')   || {}).value || 'latest';

  let data = [...sampleProducts];
  if (catFilter)    data = data.filter(p => p.category === catFilter);
  if (purityFilter) data = data.filter(p => p.purity   === purityFilter);
  if (sortVal === 'price_asc')  data.sort((a,b) => a.mrp - b.mrp);
  if (sortVal === 'price_desc') data.sort((a,b) => b.mrp - a.mrp);
  if (sortVal === 'weight_asc') data.sort((a,b) => a.grossWt - b.grossWt);

  const cnt = document.getElementById('gridCount');
  if (cnt) cnt.textContent = data.length + ' products';

  if (!data.length) {
    grid.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">No products found for selected filters.</div>';
    return;
  }
  grid.innerHTML = data.map(p => `
    <div class="product-card" onclick="openProductDetail('${p.id}')">
      <div class="product-img">${p.emoji}</div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-sku">${p.sku} &bull; ${p.purity} &bull; ${p.grossWt}g</div>
        <div style="font-size:.73rem;color:var(--text-muted);margin:3px 0">${p.category} &bull; ${p.occasion}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <div class="product-price">₹${(p.mrp/1000).toFixed(0)}K</div>
          <span class="badge badge-${p.stock < 5 ? 'red' : 'green'}">Qty: ${p.stock}</span>
        </div>
        <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">
          ${p.huid ? `<span style="font-size:.65rem;padding:2px 6px;border-radius:4px;background:rgba(46,204,113,.15);color:#2ecc71;border:1px solid rgba(46,204,113,.3)">✅ HUID</span>` : `<span style="font-size:.65rem;padding:2px 6px;border-radius:4px;background:rgba(231,76,60,.12);color:#e74c3c;border:1px solid rgba(231,76,60,.25)">⚠ No HUID</span>`}
          <span style="font-size:.65rem;padding:2px 6px;border-radius:4px;background:var(--secondary-light);color:var(--text-muted)">${p.purity}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderProductListTable(data) {
  const tbody = document.getElementById('prodListBody');
  if (!tbody) return;
  const rows = data || sampleProducts;
  tbody.innerHTML = rows.map(p => `
    <tr>
      <td><code style="font-size:.72rem">${p.code}</code></td>
      <td><code style="font-size:.72rem">${p.sku}</code></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.category}</td>
      <td style="color:var(--text-muted);font-size:.8rem">${p.subCat}</td>
      <td><span class="badge badge-gold">${p.purity}</span></td>
      <td>${p.grossWt}g</td>
      <td>${p.netWt}g</td>
      <td>${p.stoneWt}g</td>
      <td>${p.wastage}%</td>
      <td>₹${p.making}/g</td>
      <td>₹${p.purchasePrice.toLocaleString()}</td>
      <td class="text-gold fw-bold">₹${p.mrp.toLocaleString()}</td>
      <td>${p.discount}%</td>
      <td><span class="badge badge-${p.stock < 5 ? 'red' : p.stock < 10 ? 'orange' : 'green'}">${p.stock}</span></td>
      <td style="font-size:.78rem">${p.huid || '—'}</td>
      <td>${p.hsn}</td>
      <td>${p.gender}</td>
      <td>${p.occasion}</td>
      <td>${p.huid ? '<span style="color:#2ecc71;font-size:.8rem">✅ BIS</span>' : '<span style="color:#e74c3c;font-size:.8rem">⚠ None</span>'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="openProductDetail('${p.id}')" title="View">👁</button>
        <button class="btn btn-outline btn-xs" title="Edit">✏️</button>
        <button class="btn btn-xs" style="background:#9b59b6;color:#fff" onclick="openBarcodeForSku('${p.sku}')" title="Barcode/QR">🏷️</button>
      </td>
    </tr>
  `).join('');
}

function filterProductTable(q) {
  const lq = q.toLowerCase();
  const filtered = sampleProducts.filter(p =>
    p.name.toLowerCase().includes(lq) || p.sku.toLowerCase().includes(lq) ||
    p.code.toLowerCase().includes(lq) || p.huid.toLowerCase().includes(lq) ||
    p.category.toLowerCase().includes(lq) || p.purity.toLowerCase().includes(lq)
  );
  renderProductListTable(filtered);
  const cnt = document.getElementById('gridCount');
  if (cnt) cnt.textContent = filtered.length + ' products';
}

function filterJwlCat(btn, cat) {
  document.querySelectorAll('#jwl-cat-pills .pill-btn').forEach(b => b.classList.remove('active'));
  if (btn && btn.classList) btn.classList.add('active');
  const filtered = cat === 'all' ? sampleProducts : sampleProducts.filter(p => p.jwlCat === cat);
  renderProductListTable(filtered);
  const grid = document.getElementById('product-grid');
  const cnt  = document.getElementById('gridCount');
  if (cnt) cnt.textContent = filtered.length + ' products';
  if (!grid) return;
  if (!filtered.length) { grid.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">No products in this category.</div>'; return; }
  grid.innerHTML = filtered.map(p => `
    <div class="product-card" onclick="openProductDetail('${p.id}')">
      <div class="product-img">${p.emoji}</div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-sku">${p.sku} &bull; ${p.purity} &bull; ${p.grossWt}g</div>
        <div style="font-size:.73rem;color:var(--text-muted);margin:3px 0">${p.category} &bull; ${p.occasion}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <div class="product-price">₹${(p.mrp/1000).toFixed(0)}K</div>
          <span class="badge badge-${p.stock < 5 ? 'red' : 'green'}">Qty: ${p.stock}</span>
        </div>
        <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">
          ${p.huid ? `<span style="font-size:.65rem;padding:2px 6px;border-radius:4px;background:rgba(46,204,113,.15);color:#2ecc71">✅ HUID</span>` : `<span style="font-size:.65rem;padding:2px 6px;border-radius:4px;background:rgba(231,76,60,.12);color:#e74c3c">⚠ No HUID</span>`}
        </div>
      </div>
    </div>
  `).join('');
}

function filterByCat(cat) {
  const gridTabBtn = document.querySelector('[onclick*="prod-grid-tab"]');
  if (gridTabBtn) gridTabBtn.click();
  filterJwlCat(null, cat);
}

function openProductDetail(id) {
  const p = sampleProducts.find(x => x.id === id);
  if (!p) { openModal('productDetailModal'); return; }
  const el = (sel) => document.getElementById(sel);
  if (el('pdm_title')) el('pdm_title').textContent = p.emoji + ' ' + p.name;
  if (el('pdm_emoji')) el('pdm_emoji').textContent = p.emoji;
  if (el('pdm_name'))  el('pdm_name').textContent  = p.name;
  if (el('pdm_meta'))  el('pdm_meta').innerHTML    = `SKU: <b>${p.sku}</b> &bull; Code: ${p.code} &bull; ${p.purity} &bull; ${p.grossWt}g`;
  if (el('pdm_kpis'))  el('pdm_kpis').innerHTML = `
    <div style="text-align:center;padding:8px;background:var(--secondary-light);border-radius:8px"><div style="font-weight:700;color:var(--accent)">₹${(p.mrp/1000).toFixed(0)}K</div><div style="font-size:.7rem;color:var(--text-muted)">MRP</div></div>
    <div style="text-align:center;padding:8px;background:var(--secondary-light);border-radius:8px"><div style="font-weight:700">${p.stock}</div><div style="font-size:.7rem;color:var(--text-muted)">Stock</div></div>
    <div style="text-align:center;padding:8px;background:var(--secondary-light);border-radius:8px"><div style="font-weight:700">3%</div><div style="font-size:.7rem;color:var(--text-muted)">GST</div></div>
    <div style="text-align:center;padding:8px;background:var(--secondary-light);border-radius:8px"><div style="font-weight:700">${p.wastage}%</div><div style="font-size:.7rem;color:var(--text-muted)">Wastage</div></div>
  `;
  if (el('pdm_badges')) el('pdm_badges').innerHTML = `
    <span class="badge badge-gold">${p.purity}</span>&nbsp;
    <span class="badge badge-blue">${p.category}</span>&nbsp;
    ${p.huid ? '<span class="badge badge-green">✅ BIS Hallmarked</span>' : '<span class="badge badge-red">⚠ No HUID</span>'}&nbsp;
    <span class="badge badge-grey">${p.gender}</span>
  `;
  if (el('pdm_extra')) el('pdm_extra').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.82rem;margin-top:10px">
      <div><b>HUID:</b> ${p.huid||'—'}</div><div><b>HSN Code:</b> ${p.hsn}</div>
      <div><b>Gross Wt:</b> ${p.grossWt}g</div><div><b>Net Wt:</b> ${p.netWt}g</div>
      <div><b>Stone Wt:</b> ${p.stoneWt}g</div><div><b>Wastage:</b> ${p.wastage}%</div>
      <div><b>Making:</b> ₹${p.making}/g</div><div><b>Purchase:</b> ₹${p.purchasePrice.toLocaleString()}</div>
      <div><b>Selling:</b> ₹${p.sellingPrice.toLocaleString()}</div><div><b>Discount:</b> ${p.discount}%</div>
      <div><b>Occasion:</b> ${p.occasion}</div><div><b>Brand:</b> ${p.brand}</div>
      <div><b>Collection:</b> ${p.collection}</div><div><b>Hallmark:</b> ${p.hallmark}</div>
    </div>
    <div style="margin-top:8px;font-size:.8rem;color:var(--text-muted);font-style:italic">${p.desc}</div>
  `;
  openModal('productDetailModal');
}

function saveNewProduct() {
  const name = (document.getElementById('ap_name') || {}).value || '';
  if (!name.trim()) { showToast('Product name is required', 'error'); return; }
  showToast('Product "' + name.trim() + '" saved successfully!', 'success');
  closeModal('addProductModal');
  renderProductGrid();
  renderProductListTable();
}

function renderStoneTable(data) {
  const tbody = document.getElementById('stoneListBody');
  if (!tbody) return;
  const rows = data || sampleStones;
  const colorMap = { Diamond:'badge-blue', Ruby:'badge-red', Emerald:'badge-green', Sapphire:'badge-purple',
    Pearl:'badge-grey', Opal:'badge-blue', Topaz:'badge-gold', Garnet:'badge-red',
    Zircon:'badge-blue', 'Cubic Zirconia':'badge-grey', Moissanite:'badge-blue', 'Other Precious':'badge-purple' };
  tbody.innerHTML = rows.map(s => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td><span class="badge ${colorMap[s.type]||'badge-grey'}">${s.type}</span></td>
      <td>${s.color}</td>
      <td>${s.shape}</td>
      <td>${s.size}</td>
      <td>${s.clarity}</td>
      <td>${s.cut}</td>
      <td>${s.ratti||'—'}</td>
      <td>${s.carat||'—'} ct</td>
      <td>${s.weightG}g</td>
      <td><span class="badge badge-${s.pieces < 10 ? 'red' : 'green'}">${s.pieces} pcs</span></td>
      <td>₹${s.purchasePrice.toLocaleString()}/ct</td>
      <td class="text-gold">₹${s.sellingPrice.toLocaleString()}/ct</td>
      <td style="font-size:.75rem">${s.certNo||'—'}</td>
      <td>${s.supplier}</td>
      <td><span class="badge badge-${s.status==='In Stock'?'green':'red'}" style="font-size:.7rem">${s.status}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs">✏️</button>
        <button class="btn btn-outline btn-xs" onclick="showToast('Stone deleted','error')">🗑</button>
      </td>
    </tr>
  `).join('');
}

function filterStoneCat(btn, cat) {
  document.querySelectorAll('#stoneCatPills .pill-btn').forEach(b => b.classList.remove('active'));
  if (btn && btn.classList) btn.classList.add('active');
  const filtered = cat === 'all' ? sampleStones : sampleStones.filter(s => s.type === cat);
  renderStoneTable(filtered);
}

/* ---- Barcode / QR Canvas ---- */
function drawBarcodeOnCanvas(canvasId, sku) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !sku) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const bw = canvas.width / 70, bh = canvas.height - 14;
  for (let i = 0; i < 70; i++) {
    const code = sku.charCodeAt(i % sku.length) + i * 7;
    ctx.fillStyle = (code % 4 !== 0) ? '#1a1a2e' : '#ffffff';
    ctx.fillRect(i * bw, 5, bw * ((code % 3 === 0) ? 0.6 : 1), bh);
  }
}

function drawQROnCanvas(canvasId, sku) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !sku) return;
  const ctx = canvas.getContext('2d'), sz = canvas.width, cell = 5, cols = Math.floor(sz/cell);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sz, sz);
  for (let r = 0; r < cols; r++) for (let c = 0; c < cols; c++) {
    const v = (sku.charCodeAt((r+c*3)%sku.length) + r*7 + c*13) % 3;
    ctx.fillStyle = v === 0 ? '#1a1a2e' : '#ffffff';
    ctx.fillRect(c*cell+1, r*cell+1, cell-1, cell-1);
  }
  ['tl','tr','bl'].forEach(pos => {
    const x = pos==='tr' ? sz-cell*8 : cell, y = pos==='bl' ? sz-cell*8 : cell;
    ctx.fillStyle='#1a1a2e'; ctx.fillRect(x,y,cell*7,cell*7);
    ctx.fillStyle='#ffffff'; ctx.fillRect(x+cell,y+cell,cell*5,cell*5);
    ctx.fillStyle='#1a1a2e'; ctx.fillRect(x+cell*2,y+cell*2,cell*3,cell*3);
  });
}

function previewBarcode(sku) {
  drawBarcodeOnCanvas('barcodeCanvas', sku);
  const lbl = document.getElementById('barcodeSkuLabel');
  if (lbl) lbl.textContent = sku || '—';
}
function previewQR(sku) {
  drawQROnCanvas('qrCanvas', sku);
  const lbl = document.getElementById('qrSkuLabel');
  if (lbl) lbl.textContent = sku || '—';
}
function modalBarcodePreview(sku) {
  drawBarcodeOnCanvas('modalBarcodeCanvas', sku);
  drawQROnCanvas('modalQRCanvas', sku);
  ['modalBarcodeLabel','modalQRLabel'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=sku||'—'; });
}
function openBarcodeForSku(sku) {
  openModal('barcodeModal');
  const inp = document.getElementById('modalBarcodeInput');
  if (inp) { inp.value = sku; modalBarcodePreview(sku); }
}
function printBarcode() {
  const sku = (document.getElementById('barcodeSkuInput')||{}).value;
  if (!sku) { showToast('Enter a SKU first','error'); return; }
  showToast('Barcode sent to printer: ' + sku,'success');
}
function printQR() {
  const sku = (document.getElementById('qrSkuInput')||{}).value;
  if (!sku) { showToast('Enter a SKU first','error'); return; }
  showToast('QR Code sent to printer: ' + sku,'success');
}
function switchBarcodeTab(tab) {
  ['generate','scan','print'].forEach(t => {
    const el = document.getElementById('bm_'+t); if(el) el.style.display = t===tab?'block':'none';
  });
}
function handleScanResult(val) {
  if (!val || val.length < 3) return;
  const p = sampleProducts.find(x => x.sku.toLowerCase()===val.toLowerCase()||x.code.toLowerCase()===val.toLowerCase());
  const resEl = document.getElementById('scanResult'), dataEl = document.getElementById('scanResultData');
  if (!resEl||!dataEl) return;
  resEl.style.display='block';
  dataEl.innerHTML = p
    ? `<b>${p.name}</b> &bull; ${p.sku} &bull; ${p.purity} &bull; ₹${p.mrp.toLocaleString()} &bull; Stock: ${p.stock}`
    : `<span style="color:#e74c3c">Product not found for: ${val}</span>`;
}

// Auto net weight calc in add product modal
document.addEventListener('input', function(e) {
  if (e.target.id === 'ap_gross' || e.target.id === 'ap_stone_wt') {
    const gross = parseFloat((document.getElementById('ap_gross')||{}).value)||0;
    const stone = parseFloat((document.getElementById('ap_stone_wt')||{}).value)||0;
    const net   = document.getElementById('ap_net');
    if (net) net.value = Math.max(0, gross-stone).toFixed(3);
  }
});

function renderKarigarTable() {
  const tbody = document.getElementById('karigar-tbody');
  if (!tbody) return;
  tbody.innerHTML = sampleKarigars.map(k => `
    <tr>
      <td><span class="badge badge-grey">${k.id}</span></td>
      <td><strong>${k.name}</strong></td>
      <td>${k.phone}</td>
      <td>${k.skill}</td>
      <td><span class="badge badge-${k.status === 'Active' ? 'green' : 'grey'}">${k.status}</span></td>
      <td><span class="badge badge-${k.pending > 3 ? 'red' : k.pending > 0 ? 'orange' : 'green'}">${k.pending} pending</span></td>
      <td>
        <button class="btn btn-outline btn-xs">📋 Jobs</button>
        <button class="btn btn-gold btn-xs">📦 Issue</button>
      </td>
    </tr>
  `).join('');
}

function renderRepairTable() {
  const tbody = document.getElementById('repair-tbody');
  if (!tbody) return;
  tbody.innerHTML = sampleRepairs.map(r => `
    <tr>
      <td><span class="badge badge-blue">${r.id}</span></td>
      <td><strong>${r.customer}</strong></td>
      <td>${r.item}</td>
      <td>${r.karigar}</td>
      <td>${r.received}</td>
      <td>${r.due}</td>
      <td><span class="badge badge-${r.status === 'Ready' ? 'green' : r.status === 'In Progress' ? 'orange' : 'grey'}">${r.status}</span></td>
      <td>₹${r.advance}</td>
      <td>
        <button class="btn btn-outline btn-xs">✏️ Update</button>
        ${r.status === 'Ready' ? '<button class="btn btn-success btn-xs">✅ Deliver</button>' : ''}
      </td>
    </tr>
  `).join('');
}

function renderOrderTable() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  tbody.innerHTML = sampleOrders.map(o => `
    <tr>
      <td><span class="badge badge-purple">${o.id}</span></td>
      <td><strong>${o.customer}</strong></td>
      <td>${o.item}</td>
      <td>${o.weight}</td>
      <td>₹${o.advance.toLocaleString()}</td>
      <td>${o.due}</td>
      <td><span class="badge badge-orange">${o.status}</span></td>
      <td>
        <button class="btn btn-outline btn-xs">📋 Track</button>
        <button class="btn btn-gold btn-xs">🧾 Invoice</button>
      </td>
    </tr>
  `).join('');
}

function renderSupplierTable() {
  const tbody = document.getElementById('supplier-tbody');
  if (!tbody) return;
  tbody.innerHTML = sampleSuppliers.map(s => `
    <tr>
      <td><span class="badge badge-grey">${s.id}</span></td>
      <td><strong>${s.name}</strong></td>
      <td>${s.city}</td>
      <td><span class="badge badge-gold">${s.type}</span></td>
      <td>${s.gstin}</td>
      <td class="text-danger fw-bold">₹${s.outstanding.toLocaleString()}</td>
      <td>
        <button class="btn btn-outline btn-xs">📋 Ledger</button>
        <button class="btn btn-gold btn-xs">💳 Pay</button>
      </td>
    </tr>
  `).join('');
}

function renderEmployeeTable() {
  const tbody = document.getElementById('employee-tbody');
  if (!tbody) return;
  tbody.innerHTML = sampleEmployees.map(e => `
    <tr>
      <td><span class="badge badge-grey">${e.id}</span></td>
      <td><strong>${e.name}</strong></td>
      <td>${e.role}</td>
      <td>${e.phone}</td>
      <td>₹${e.salary.toLocaleString()}</td>
      <td>${e.join}</td>
      <td><span class="badge badge-green">${e.status}</span></td>
      <td>
        <button class="btn btn-outline btn-xs">✏️ Edit</button>
        <button class="btn btn-gold btn-xs">💰 Payslip</button>
      </td>
    </tr>
  `).join('');
}

function viewCustomer(id) {
  const c = sampleCustomers.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modal-customer-name').textContent = c.name;
  document.getElementById('modal-customer-phone').textContent = c.phone;
  document.getElementById('modal-customer-city').textContent = c.city;
  document.getElementById('modal-customer-type').textContent = c.type;
  document.getElementById('modal-customer-balance').textContent = '₹' + c.balance.toLocaleString();
  document.getElementById('modal-customer-total').textContent = '₹' + c.total.toLocaleString();
  openModal('customerDetailModal');
}

// ======= RATES UPDATE =======
function updateRates() {
  const g22 = document.getElementById('rate-gold22');
  const g24 = document.getElementById('rate-gold24');
  const sv = document.getElementById('rate-silver');
  if (g22) goldRates.gold22 = +g22.value;
  if (g24) goldRates.gold24 = +g24.value;
  if (sv) goldRates.silver = +sv.value;
  updateGoldTicker();
  showToast('Rates updated successfully!', 'success');
}

// ======= TOAST =======
function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:28px;right:28px;
    background:${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#b8860b'};
    color:#fff;padding:12px 22px;border-radius:8px;
    font-size:0.85rem;font-weight:600;
    z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.4);
    animation:fadeIn 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ======= MISC HELPERS =======
function printInvoice() { window.print(); }

function generateBillNo() {
  return 'INV-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 9000 + 1000);
}


// ======= EXPORT HELPER =======
function exportData() {
  showToast('Exporting data to Excel...', 'info');
}

// ======= GOLD EXCHANGE CALC =======
function calcExchange(input) {
  const gross = parseFloat(input.value) || 0;
  const rate = parseFloat(document.getElementById('exch-rate')?.value) || 7240;
  const purity = 0.916; // 22K default
  const fine = gross * purity;
  const val = fine * rate;
  const valEl = document.getElementById('exch-value');
  const pureEl = document.getElementById('exch-pure');
  if (valEl) valEl.textContent = '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  if (pureEl) pureEl.textContent = fine.toFixed(2) + 'g';
}

// ======= AUTO-HIDE module pages on tab init =======
document.addEventListener('DOMContentLoaded', () => {
  // First module page (dashboard) stays visible, rest hidden — already set via class
  // Initialize all tab groups: activate first tab in each card that has tabs
  document.querySelectorAll('.card .tabs').forEach(tabGroup => {
    const card = tabGroup.closest('.card');
    if (!card) return;
    const firstTab = tabGroup.querySelector('.tab');
    const allContents = card.querySelectorAll('.tab-content');
    allContents.forEach((tc, idx) => {
      if (idx === 0) tc.classList.add('active');
      else tc.classList.remove('active');
    });
    if (firstTab) {
      tabGroup.querySelectorAll('.tab').forEach((t, idx) => {
        if (idx === 0) t.classList.add('active');
        else t.classList.remove('active');
      });
    }
  });
});


// ======= LOGOUT =======
function logout() {
  sessionStorage.removeItem('ceritage_user');
  window.location.href = 'login.html';
}

// ======= ROLE-BASED UI INIT =======
function initRoleUI() {
  const user = JSON.parse(sessionStorage.getItem('ceritage_user') || '{}');
  if (!user.name) return;

  // Update avatar + name in sidebar
  const avatarEls = document.querySelectorAll('.avatar');
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  avatarEls.forEach(el => el.textContent = initials);

  const uName = document.querySelector('.u-name');
  const uRole = document.querySelector('.u-role');
  const roleLabels = {
    admin: 'Administrator', branch_manager: 'Branch Manager',
    sales: 'Sales Executive', accounts: 'Accountant',
    cashier: 'Cashier', inventory: 'Inventory Manager'
  };
  if (uName) uName.textContent = user.name;
  if (uRole) uRole.textContent = roleLabels[user.role] || user.role;

  // Topbar greeting
  const greeting = document.querySelector('#dashboard .page-title h2');
  if (greeting) {
    const hr = new Date().getHours();
    const time = hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening';
    greeting.textContent = `${time}, ${user.name.split(' ')[0]} 👋`;
  }

  // Branch in subtitle
  const branchEl = document.querySelector('#dashboard .page-title p');
  if (branchEl && user.branch) {
    const d = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    branchEl.textContent = `${days[d.getDay()]}, ${d.getDate()} August 2026 • Ceritage Jewelry, ${user.branch}`;
  }

  // ---- Role Banner ----
  applyRoleDashboard(user);

  // ---- Hide restricted nav items ----
  const roleNav = {
    sales:     ['users','security','compliance','tunch','employees','suppliers','gst','branch','ai','accounting','reports'],
    cashier:   ['users','security','compliance','tunch','employees','suppliers','gst','branch','ai','accounting','reports','purchase','karigar','jangad','rfid','advance'],
    inventory: ['users','security','compliance','accounting','reports','gst','branch'],
    accounts:  ['users','security','karigar','repair','orders','jangad','rfid','advance'],
  };
  const hidden = roleNav[user.role] || [];
  document.querySelectorAll('.nav-item').forEach(item => {
    const onclick = item.getAttribute('onclick') || '';
    const match = onclick.match(/'([^']+)'/);
    if (match && hidden.includes(match[1])) {
      item.style.display = 'none';
    }
  });
}

// ---- Role-specific dashboard customisation ----
function applyRoleDashboard(user) {
  const banner  = document.getElementById('role-banner');
  const bIcon   = document.getElementById('role-banner-icon');
  const bTitle  = document.getElementById('role-banner-title');
  const bDesc   = document.getElementById('role-banner-desc');
  const bBadge  = document.getElementById('role-banner-badge');
  const actions = document.getElementById('dashboard-actions');

  const configs = {
    admin: {
      icon: '👑', color: 'rgba(184,134,11,0.12)',
      borderColor: 'rgba(184,134,11,0.35)',
      title: 'Administrator Access',
      desc: 'Full system access — all modules, all branches, all reports.',
      badge: '<span class="badge badge-gold">Full Access</span>',
      actions: `<button class="btn btn-outline" onclick="showModule('rates',null)">📈 Update Rates</button>
                <button class="btn btn-outline" onclick="showModule('branch',null)">🏢 All Branches</button>
                <button class="btn btn-gold" onclick="showModule('billing',null)">🧾 New Invoice</button>`
    },
    branch_manager: {
      icon: '🏢', color: 'rgba(52,152,219,0.1)',
      borderColor: 'rgba(52,152,219,0.3)',
      title: 'Branch Manager — ' + (user.branch || 'Branch'),
      desc: 'Manage your branch: staff performance, sales targets, stock & daily operations.',
      badge: '<span class="badge badge-blue">Branch Manager</span>',
      actions: `<button class="btn btn-outline" onclick="showModule('employees',null)">👔 My Staff</button>
                <button class="btn btn-outline" onclick="showModule('reports',null)">📑 Reports</button>
                <button class="btn btn-gold" onclick="showModule('billing',null)">🧾 New Invoice</button>`
    },
    sales: {
      icon: '💰', color: 'rgba(46,204,113,0.08)',
      borderColor: 'rgba(46,204,113,0.25)',
      title: 'Sales Executive Dashboard',
      desc: 'Focus on billing, customer management & meeting today\'s sales target.',
      badge: '<span class="badge badge-green">Sales Executive</span>',
      actions: `<button class="btn btn-outline" onclick="showModule('customers',null)">👥 Customers</button>
                <button class="btn btn-gold" onclick="showModule('billing',null)">🧾 New Invoice</button>`
    },
    accounts: {
      icon: '📒', color: 'rgba(155,89,182,0.08)',
      borderColor: 'rgba(155,89,182,0.25)',
      title: 'Accounts Dashboard',
      desc: 'Today\'s cash position, pending supplier payments, GST summary & ledger.',
      badge: '<span class="badge badge-purple">Accountant</span>',
      actions: `<button class="btn btn-outline" onclick="showModule('accounting',null)">📒 Ledger</button>
                <button class="btn btn-outline" onclick="showModule('gst',null)">🏛️ GST</button>
                <button class="btn btn-gold" onclick="showModule('reports',null)">📑 Reports</button>`
    },
    cashier: {
      icon: '🪙', color: 'rgba(243,156,18,0.08)',
      borderColor: 'rgba(243,156,18,0.25)',
      title: 'Cashier View',
      desc: 'Quick billing, payment collection & today\'s cash book summary.',
      badge: '<span class="badge badge-orange">Cashier</span>',
      actions: `<button class="btn btn-outline" onclick="showModule('payments',null)">💳 Payments</button>
                <button class="btn btn-gold" onclick="showModule('billing',null)">🧾 New Invoice</button>`
    },
    inventory: {
      icon: '📦', color: 'rgba(52,152,219,0.06)',
      borderColor: 'rgba(52,152,219,0.2)',
      title: 'Inventory Dashboard',
      desc: 'Live stock levels, low-stock alerts, karigar material tracking & tray audit.',
      badge: '<span class="badge badge-blue">Inventory</span>',
      actions: `<button class="btn btn-outline" onclick="showModule('inventory',null)">📦 Stock</button>
                <button class="btn btn-outline" onclick="showModule('karigar',null)">🧑‍🔨 Karigars</button>
                <button class="btn btn-gold" onclick="showModule('products',null)">💍 Products</button>`
    },
  };

  const cfg = configs[user.role];
  if (!cfg || !banner) return;

  banner.style.display     = 'flex';
  banner.style.background  = cfg.color;
  banner.style.borderColor = cfg.borderColor;
  bIcon.textContent  = cfg.icon;
  bTitle.textContent = cfg.title;
  bDesc.textContent  = cfg.desc;
  bBadge.innerHTML   = cfg.badge;
  if (actions) actions.innerHTML = cfg.actions;

  // Sales role — replace last stat card with personal target
  if (user.role === 'sales') {
    const statCards = document.querySelectorAll('#dashboard .stat-card');
    if (statCards[5]) {
      statCards[5].querySelector('.stat-value').textContent = '87%';
      statCards[5].querySelector('.stat-label').textContent = 'My Target';
      const ch = statCards[5].querySelector('.stat-change');
      if (ch) { ch.textContent = '▲ ₹3L more to goal'; ch.className = 'stat-change up'; }
    }
  }
  // Branch manager — branch rank
  if (user.role === 'branch_manager') {
    const statCards = document.querySelectorAll('#dashboard .stat-card');
    if (statCards[5]) {
      statCards[5].querySelector('.stat-value').textContent = '#1';
      statCards[5].querySelector('.stat-label').textContent = 'Branch Rank';
      const ch = statCards[5].querySelector('.stat-change');
      if (ch) { ch.textContent = '▲ Best branch this month'; ch.className = 'stat-change up'; }
    }
  }
  // Cashier — simplify stats
  if (user.role === 'cashier') {
    const statCards = document.querySelectorAll('#dashboard .stat-card');
    if (statCards[4]) {
      statCards[4].querySelector('.stat-value').textContent = '₹3.24L';
      statCards[4].querySelector('.stat-label').textContent = 'Cash in Hand';
    }
    if (statCards[5]) {
      statCards[5].querySelector('.stat-value').textContent = '23';
      statCards[5].querySelector('.stat-label').textContent = 'Bills Today';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initRoleUI();
});


// ======= EXPORT FUNCTIONS =======
function exportExcel(module) {
  const names = {
    customers:'Customers', purchase:'Purchase_Orders', sales:'Sales_Report',
    inventory:'Inventory_Stock', accounting:'Accounts_Ledger', employees:'Employee_List',
    suppliers:'Supplier_List', karigar:'Karigar_Register', gst:'GST_Summary',
    gstr1:'GSTR1_Return', gstr3b:'GSTR3B_Return', stones:'Stone_Details',
    reports:'All_Reports', all:'Complete_Data'
  };
  const fname = (names[module] || module) + '_' + new Date().toISOString().slice(0,10) + '.xlsx';
  showToast('Exporting ' + fname + ' ...', 'success');
  // In production: generate real xlsx via SheetJS
  setTimeout(() => showToast(fname + ' downloaded!', 'success'), 1200);
}

function exportPDF(module) {
  const names = {
    customers:'Customer_Report', purchase:'Purchase_Report', sales:'Sales_Report',
    inventory:'Stock_Report', accounting:'Accounts_Report', employees:'Employee_Report',
    suppliers:'Supplier_Report', karigar:'Karigar_Report', gst:'GST_Report',
    gstr1:'GSTR1_Report', gstr3b:'GSTR3B_Report', stones:'Stone_Report',
    reports:'Analytics_Report'
  };
  const fname = (names[module] || module) + '_' + new Date().toISOString().slice(0,10) + '.pdf';
  showToast('Generating ' + fname + ' ...', 'info');
  setTimeout(() => showToast(fname + ' ready to print!', 'success'), 1400);
  // In production: use jsPDF or server-side PDF generation
}

// ======= STONE WEIGHT CONVERTER =======
function convertStoneWeight() {
  const val  = parseFloat(document.getElementById('conv-val')?.value) || 0;
  const from = document.getElementById('conv-from')?.value || 'ct';
  let ct, ratti, gram;
  if (from === 'ct')    { ct = val; ratti = val * 1.8519; gram = val * 0.2; }
  if (from === 'ratti') { ct = val * 0.5400; ratti = val; gram = val * 0.1080; }
  if (from === 'gram')  { ct = val * 5; ratti = val * 9.259; gram = val; }
  const fmt = n => n.toFixed(3);
  const ctEl    = document.getElementById('res-ct');
  const rattiEl = document.getElementById('res-ratti');
  const gramEl  = document.getElementById('res-gram');
  if (ctEl)    ctEl.textContent    = fmt(ct) + ' ct';
  if (rattiEl) rattiEl.textContent = fmt(ratti) + ' Ratti';
  if (gramEl)  gramEl.textContent  = fmt(gram) + ' g';
}

// ======= ADD STONE — AUTO CONVERT =======
function autoConvert(from) {
  const ctEl    = document.getElementById('add-wt-ct');
  const rattiEl = document.getElementById('add-wt-ratti');
  const gramEl  = document.getElementById('add-wt-gram');
  if (!ctEl) return;
  const val = parseFloat(
    from === 'ct' ? ctEl.value : from === 'ratti' ? rattiEl.value : gramEl.value
  ) || 0;
  let ct, ratti, gram;
  if (from === 'ct')    { ct = val; ratti = val * 1.8519; gram = val * 0.2; }
  if (from === 'ratti') { ct = val * 0.5400; ratti = val; gram = val * 0.1080; }
  if (from === 'gram')  { ct = val * 5; ratti = val * 9.259; gram = val; }
  const fmt = n => parseFloat(n.toFixed(4));
  if (from !== 'ct')    ctEl.value    = fmt(ct);
  if (from !== 'ratti') rattiEl.value = fmt(ratti);
  if (from !== 'gram')  gramEl.value  = fmt(gram);
}


// ======= GST TAX CALCULATOR =======
function calcGST() {
  const typeEl  = document.getElementById('tax-item-type');
  const txnEl   = document.getElementById('tax-type');
  const baseEl  = document.getElementById('tax-base');
  if (!typeEl || !baseEl) return;

  const base = parseFloat(baseEl.value) || 0;
  const txn  = txnEl?.value || 'intra';
  const rates = {
    jewelry: 3, diamond: 0.25, gemstone: 0.25, imitation: 3, repair: 18
  };
  const rate = rates[typeEl.value] || 3;
  const tax  = base * rate / 100;
  const cgst = txn === 'intra' ? tax / 2 : 0;
  const sgst = txn === 'intra' ? tax / 2 : tax;
  const total = base + tax;
  const fmt = n => '₹' + n.toLocaleString('en-IN', {maximumFractionDigits: 0});

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('tax-show-base',  fmt(base));
  set('tax-show-cgst',  fmt(cgst));
  set('tax-show-sgst',  fmt(sgst));
  set('tax-show-total', fmt(total));
}

// Init tax calculator on load
document.addEventListener('DOMContentLoaded', () => {
  calcGST();
  renderGstOverview();
  renderGstr1Table();
  renderGstr9Hsn();
});

// ======= GST & TAXATION MODULE =======
const sampleHsnCodes = [
  { code: '7113', desc: 'Articles of jewellery of precious metal', cat: 'jewelry', rate: 3, products: 142, active: true },
  { code: '7114', desc: 'Articles of goldsmiths/silversmiths wares', cat: 'jewelry', rate: 3, products: 28, active: true },
  { code: '7102', desc: 'Diamonds, whether or not worked', cat: 'diamond', rate: 0.25, products: 35, active: true },
  { code: '7103', desc: 'Precious/semi-precious stones (other than diamonds)', cat: 'gemstone', rate: 0.25, products: 18, active: true },
  { code: '7116', desc: 'Articles of imitation jewellery', cat: 'jewelry', rate: 3, products: 22, active: true },
  { code: '7106', desc: 'Silver (including silver plated with gold)', cat: 'jewelry', rate: 3, products: 15, active: true },
  { code: '9988', desc: 'Manufacturing services on physical inputs', cat: 'service', rate: 18, products: 0, active: true },
  { code: '9997', desc: 'Other services (repair, polishing)', cat: 'service', rate: 18, products: 0, active: true },
];

const sampleGstr1Data = [
  { inv: 'INV-2026-8841', date: '16-Aug-2026', gstin: '27AABCP1234M1Z5', taxable: 200000, cgst: 3000, sgst: 3000, total: 206000 },
  { inv: 'INV-2026-8840', date: '16-Aug-2026', gstin: 'Unregistered', taxable: 56310, cgst: 845, sgst: 845, total: 58000 },
  { inv: 'INV-2026-8839', date: '15-Aug-2026', gstin: '24AABCV5678K1Z2', taxable: 245630, cgst: 6141, sgst: 6141, total: 257912 },
  { inv: 'INV-2026-8838', date: '14-Aug-2026', gstin: 'Unregistered', taxable: 98058, cgst: 1471, sgst: 1471, total: 101000 },
  { inv: 'INV-2026-8837', date: '12-Aug-2026', gstin: '27AABCP1234M1Z5', taxable: 175000, cgst: 2625, sgst: 2625, total: 180250 },
];

const sampleEinvoices = [
  { inv: 'INV-2026-8841', date: '16-Aug-2026', customer: 'Priya Sharma', gstin: '27AABCP1234M1Z5', amount: 206000, irn: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234ab', status: 'Generated' },
  { inv: 'INV-2026-8839', date: '15-Aug-2026', customer: 'Vikram Malhotra', gstin: '24AABCV5678K1Z2', amount: 257912, irn: 'f9e8d7c6b5a4321098765432109876543210987654321098765432109876cd', status: 'Generated' },
  { inv: 'INV-2026-8837', date: '12-Aug-2026', customer: 'Priya Sharma', gstin: '27AABCP1234M1Z5', amount: 180250, irn: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abef', status: 'Generated' },
  { inv: 'INV-2026-8840', date: '16-Aug-2026', customer: 'Rajesh Patel', gstin: 'Unregistered', amount: 58000, irn: '—', status: 'N/A (B2C)' },
  { inv: 'INV-2026-8835', date: '10-Aug-2026', customer: 'Diamond Exports Ltd', gstin: '29AABCD9999K1Z8', amount: 450000, irn: '', status: 'Pending' },
];

const sampleEwayBills = [
  { no: '341901234567', date: '16-Aug-2026', inv: 'INV-2026-8841', from: 'Mumbai, MH', to: 'Pune, MH', value: 206000, vehicle: 'MH12AB3456', valid: '17-Aug-2026', status: 'Active' },
  { no: '341901234568', date: '15-Aug-2026', inv: 'INV-2026-8839', from: 'Mumbai, MH', to: 'Ahmedabad, GJ', value: 257912, vehicle: 'GJ01CD7890', valid: '16-Aug-2026', status: 'Active' },
  { no: '341901234569', date: '14-Aug-2026', inv: 'INV-2026-8830', from: 'Mumbai, MH', to: 'Delhi, DL', value: 520000, vehicle: 'MH04EF1234', valid: '15-Aug-2026', status: 'Expired' },
  { no: '341901234570', date: '16-Aug-2026', inv: 'INV-2026-8832', from: 'Mumbai, MH', to: 'Nashik, MH', value: 85000, vehicle: 'MH15GH5678', valid: '17-Aug-2026', status: 'Active' },
  { no: '341901234571', date: '16-Aug-2026', inv: 'INV-2026-8828', from: 'Mumbai, MH', to: 'Bangalore, KA', value: 380000, vehicle: 'KA03IJ9012', valid: '17-Aug-2026', status: 'Active' },
];

let hsnFilterCat = 'all';

function renderGstOverview() {
  const tbody = document.getElementById('gst-hsn-summary-tbody');
  if (!tbody) return;
  tbody.innerHTML = sampleHsnCodes.filter(h => h.cat !== 'service').map(h => `
    <tr><td>${h.code}</td><td>${h.desc.split(' ').slice(0, 4).join(' ')}</td>
    <td><span class="badge badge-gold">${h.rate}%</span></td>
    <td>₹${(h.products * 55000).toLocaleString()}</td></tr>
  `).join('');
}

function initGstBilling() {
  if (billItems.length === 0) {
    billItems.push({ item: 'Gold Necklace 22K', hsn: '7113', weight: 25.5, rate: 7240, making: 8500, gst: 3, taxable: 0, tax: 0, amount: 0 });
    calcBillRow(0);
  }
  const noEl = document.getElementById('gst-bill-no');
  const dateEl = document.getElementById('gst-bill-date');
  if (noEl && noEl.textContent === '—') noEl.textContent = generateBillNo();
  if (dateEl && dateEl.textContent === '—') dateEl.textContent = new Date().toLocaleDateString('en-IN');
}

function updateGstBillCustomer() {
  const sel = document.getElementById('gst-bill-customer');
  const info = document.getElementById('gst-bill-customer-info');
  if (!sel || !info) return;
  const map = {
    priya: 'Priya Sharma<br>GSTIN: 27AABCP1234M1Z5<br>Mumbai, Maharashtra',
    rajesh: 'Rajesh Patel<br>Unregistered (B2C)<br>Walk-in Customer',
    vikram: 'Vikram Malhotra<br>GSTIN: 24AABCV5678K1Z2<br>Surat, Gujarat',
  };
  info.innerHTML = map[sel.value] || 'Select customer for GSTIN details';
}

function saveGstBill() {
  if (billItems.length === 0) { showToast('Add at least one item!', 'error'); return; }
  const invNo = document.getElementById('gst-bill-no')?.textContent || generateBillNo();
  showToast('GST Invoice ' + invNo + ' saved!', 'success');
}

function renderGstr1Table() {
  const tbody = document.getElementById('gstr1-tbody');
  if (!tbody) return;
  tbody.innerHTML = sampleGstr1Data.map(r => `
    <tr><td class="text-gold">${r.inv}</td><td>${r.date}</td><td>${r.gstin}</td>
    <td>₹${r.taxable.toLocaleString()}</td><td>₹${r.cgst.toLocaleString()}</td><td>₹${r.sgst.toLocaleString()}</td>
    <td class="fw-bold">₹${r.total.toLocaleString()}</td></tr>
  `).join('');
  const total = sampleGstr1Data.reduce((s, r) => s + r.total, 0);
  const el = document.getElementById('gstr1-total');
  if (el) el.textContent = '₹' + total.toLocaleString();
}

function renderGstr9Hsn() {
  const tbody = document.getElementById('gstr9-hsn-tbody');
  if (!tbody) return;
  tbody.innerHTML = sampleHsnCodes.filter(h => h.cat !== 'service').map(h => `
    <tr><td>${h.code}</td><td class="text-right text-gold">₹${(h.products * 55000 * 12).toLocaleString()}</td></tr>
  `).join('');
}

function filterHsnCategory(cat, btn) {
  hsnFilterCat = cat;
  btn.closest('.filters-bar')?.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderHsnTable();
}

function renderHsnTable() {
  const tbody = document.getElementById('hsn-tbody');
  if (!tbody) return;
  const search = (document.getElementById('hsn-search')?.value || '').toLowerCase();
  const filtered = sampleHsnCodes.filter(h => {
    if (hsnFilterCat !== 'all' && h.cat !== hsnFilterCat) return false;
    if (search && !h.code.includes(search) && !h.desc.toLowerCase().includes(search)) return false;
    return true;
  });
  tbody.innerHTML = filtered.map((h, i) => {
    const idx = sampleHsnCodes.indexOf(h);
    const half = h.rate / 2;
    return `<tr>
      <td class="text-gold fw-bold">${h.code}</td><td>${h.desc}</td>
      <td><span class="badge badge-${h.cat==='service'?'purple':'gold'}">${h.cat}</span></td>
      <td><span class="badge badge-gold">${h.rate}%</span></td>
      <td>${half}%</td><td>${half}%</td>
      <td>${h.products || '—'}</td>
      <td><span class="badge badge-${h.active?'green':'grey'}">${h.active?'Active':'Inactive'}</span></td>
      <td><button class="btn btn-outline btn-xs" onclick="showToast('HSN ${h.code} updated','success')">✏️</button>
      <button class="btn btn-danger btn-xs" onclick="deleteHsnCode(${idx})">✕</button></td>
    </tr>`;
  }).join('');
}

function addHsnCode() {
  const code = document.getElementById('new-hsn-code')?.value.trim();
  const desc = document.getElementById('new-hsn-desc')?.value.trim();
  const cat = document.getElementById('new-hsn-cat')?.value || 'jewelry';
  const rate = parseFloat(document.getElementById('new-hsn-rate')?.value) || 3;
  if (!code || !desc) { showToast('Enter HSN code and description!', 'error'); return; }
  sampleHsnCodes.push({ code, desc, cat, rate, products: 0, active: true });
  closeModal('addHsnModal');
  renderHsnTable();
  renderGstOverview();
  showToast('HSN ' + code + ' added!', 'success');
}

function deleteHsnCode(idx) {
  sampleHsnCodes.splice(idx, 1);
  renderHsnTable();
  renderGstOverview();
  showToast('HSN code removed', 'info');
}

function fileGstrReturn() {
  const type = document.getElementById('file-gstr-type')?.value || 'GSTR-3B';
  closeModal('fileGstrModal');
  showToast('Redirecting to GST Portal for ' + type + '...', 'info');
  setTimeout(() => showToast(type + ' filed successfully!', 'success'), 2000);
}

function renderEinvoiceTable() {
  const tbody = document.getElementById('einvoice-tbody');
  if (!tbody) return;
  tbody.innerHTML = sampleEinvoices.map((e, i) => {
    const statusBadge = e.status === 'Generated' ? 'green' : e.status.includes('N/A') ? 'grey' : 'orange';
    const irnShort = e.irn ? e.irn.slice(0, 12) + '...' : '—';
    return `<tr>
      <td class="text-gold">${e.inv}</td><td>${e.date}</td><td>${e.customer}</td><td>${e.gstin}</td>
      <td class="fw-bold">₹${e.amount.toLocaleString()}</td>
      <td style="font-size:.72rem;font-family:monospace" title="${e.irn}">${irnShort}</td>
      <td><span class="badge badge-${statusBadge}">${e.status}</span></td>
      <td>${e.status === 'Generated' ? '<button class="btn btn-outline btn-xs" onclick="showToast(\'IRN QR downloaded\',\'success\')">📥 QR</button>' :
        e.status === 'Pending' ? '<button class="btn btn-gold btn-xs" onclick="generateEinvoice(' + i + ')">⚡ Generate</button>' : '—'}</td>
    </tr>`;
  }).join('');
}

function generateEinvoice(idx) {
  if (idx !== undefined && sampleEinvoices[idx]) {
    const e = sampleEinvoices[idx];
    if (e.gstin === 'Unregistered') { showToast('E-Invoice not applicable for B2C/unregistered', 'error'); return; }
    e.irn = Math.random().toString(36).slice(2) + Date.now().toString(36);
    e.status = 'Generated';
    renderEinvoiceTable();
    showToast('IRN generated for ' + e.inv, 'success');
    return;
  }
  const pending = sampleEinvoices.find(e => e.status === 'Pending');
  if (pending) { generateEinvoice(sampleEinvoices.indexOf(pending)); }
  else { showToast('All eligible invoices have IRN', 'info'); }
}

function renderEwayTable() {
  const tbody = document.getElementById('eway-tbody');
  if (!tbody) return;
  tbody.innerHTML = sampleEwayBills.map(e => {
    const badge = e.status === 'Active' ? 'green' : e.status === 'Expired' ? 'red' : 'grey';
    return `<tr>
      <td class="text-gold">${e.no}</td><td>${e.date}</td><td>${e.inv}</td>
      <td>${e.from} → ${e.to}</td><td class="fw-bold">₹${e.value.toLocaleString()}</td>
      <td>${e.vehicle}</td><td>${e.valid}</td>
      <td><span class="badge badge-${badge}">${e.status}</span></td>
      <td><button class="btn btn-outline btn-xs" onclick="showToast('E-Way Bill ${e.no} printed','success')">🖨️</button></td>
    </tr>`;
  }).join('');
}

function generateEwayBill() {
  const to = document.getElementById('eway-to')?.value.trim();
  const vehicle = document.getElementById('eway-vehicle')?.value.trim();
  const value = parseFloat(document.getElementById('eway-value')?.value) || 0;
  if (!to || !vehicle) { showToast('Enter destination and vehicle number!', 'error'); return; }
  if (value < 50000) { showToast('E-Way Bill required only for goods value > ₹50,000', 'error'); return; }
  const inv = document.getElementById('eway-invoice')?.value || 'INV-2026-8841';
  const no = '3419' + Math.floor(Math.random() * 900000000 + 100000000);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  sampleEwayBills.unshift({
    no, date: new Date().toLocaleDateString('en-IN'), inv,
    from: 'Mumbai, MH', to, value, vehicle,
    valid: tomorrow.toLocaleDateString('en-IN'), status: 'Active'
  });
  closeModal('generateEwayModal');
  renderEwayTable();
  showToast('E-Way Bill ' + no + ' generated!', 'success');
}

// ============================================================
// BILLING MODULE FUNCTIONS
// ============================================================

const billTypeConfig = {
  retail:     { label:'RETAIL INVOICE',    note:'🛍️ <b>Retail Invoice</b> — Standard GST invoice for walk-in customers. CGST + SGST applied.' },
  wholesale:  { label:'WHOLESALE INVOICE', note:'🏭 <b>Wholesale Invoice</b> — For bulk/trade buyers. B2B GST with buyer GSTIN required.' },
  tax:        { label:'TAX INVOICE',       note:'🏛️ <b>Tax Invoice</b> — Full GST-compliant invoice with CGST/SGST split and HSN details.' },
  estimate:   { label:'ESTIMATE',          note:'📝 <b>Estimate Invoice</b> — No tax obligation. Customer quote, can be converted to invoice.' },
  quotation:  { label:'QUOTATION',         note:'💬 <b>Quotation</b> — Price quote valid for specified period. No GST applied yet.' },
  credit_note:{ label:'CREDIT NOTE',       note:'📋 <b>Credit Note</b> — Issued against a previous invoice to reduce amount payable by customer.' },
  debit_note: { label:'DEBIT NOTE',        note:'📄 <b>Debit Note</b> — Issued to recover additional amount from customer.' },
  exchange:   { label:'EXCHANGE BILLING',  note:'🔄 <b>Exchange Billing</b> — Old gold exchange + new purchase. Net amount billed.' },
  return:     { label:'RETURN INVOICE',    note:'↩️ <b>Return Invoice</b> — Customer returning goods. Stock restored, amount refunded.' },
  refund:     { label:'REFUND INVOICE',    note:'💸 <b>Refund Invoice</b> — Cash/UPI/bank refund after product return or cancellation.' }
};

let currentBillType = 'retail';
let billItems = [];
let couponDiscount = 0;
let activeCoupons = { 'DIWALI10':10, 'FLAT500':0, 'WELCOME5':5 };
let activeVouchers = { 'GV-1234-ABCD':2000, 'GV-5678-EFGH':5000 };

function setBillType(type, btn) {
  currentBillType = type;
  const cfg = billTypeConfig[type] || billTypeConfig.retail;
  const badge = document.getElementById('inv_type_badge');
  const note  = document.getElementById('billTypeNote');
  const prevLabel = document.getElementById('prev_type_label');
  if (badge) badge.textContent = cfg.label;
  if (note)  note.innerHTML = cfg.note;
  if (prevLabel) prevLabel.textContent = cfg.label;
  // Update invoice number prefix
  const inv_no = document.getElementById('inv_no');
  if (inv_no) {
    const prefix = { retail:'INV', wholesale:'WHL', tax:'TAX', estimate:'EST', quotation:'QUO', credit_note:'CN', debit_note:'DN', exchange:'EXC', return:'RET', refund:'REF' };
    inv_no.value = (prefix[type]||'INV') + '-2026-' + (8840 + Math.floor(Math.random()*10));
  }
  // Update pills
  if (btn) {
    document.querySelectorAll('#invTypePills .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
}

function selectPayMode(btn, mode) {
  document.querySelectorAll('#payModePills .pay-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const allFields = ['pay_cash','pay_card','pay_upi','pay_neft','pay_wallet','pay_emi','pay_cheque','pay_exchange','pay_credit'];
  allFields.forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
  const map = { cash:'pay_cash', card:'pay_card', upi:'pay_upi', neft:'pay_neft', wallet:'pay_wallet', emi:'pay_emi', cheque:'pay_cheque', exchange:'pay_exchange', credit:'pay_credit' };
  const target = document.getElementById(map[mode]);
  if (target) target.style.display = 'block';
}

function addBillItem() {
  const empty = document.getElementById('bill-empty-row');
  if (empty) empty.remove();
  const tbody = document.getElementById('bill-items-tbody');
  if (!tbody) return;
  const idx = billItems.length;
  billItems.push({ desc:'', hsn:'7113', purity:'22K', wt:0, rate:7240, making:0, stone:0, gst:3, disc:0 });
  const tr = document.createElement('tr');
  tr.id = 'bill-row-' + idx;
  tr.innerHTML = `
    <td><input class="form-control" style="min-width:130px" placeholder="Item description" oninput="billItems[${idx}].desc=this.value;updateBillPreview()"></td>
    <td><input class="form-control" style="width:60px" value="7113" oninput="billItems[${idx}].hsn=this.value"></td>
    <td><select class="form-control" style="width:70px" onchange="billItems[${idx}].purity=this.value">
      <option>22K</option><option>24K</option><option>18K</option><option>14K</option><option>Silver</option>
    </select></td>
    <td><input class="form-control" style="width:65px" type="number" step="0.001" value="0" oninput="billItems[${idx}].wt=+this.value;calcBillRow(${idx})"></td>
    <td><input class="form-control" style="width:75px" type="number" value="7240" oninput="billItems[${idx}].rate=+this.value;calcBillRow(${idx})"></td>
    <td><input class="form-control" style="width:70px" type="number" value="0" oninput="billItems[${idx}].making=+this.value;calcBillRow(${idx})"></td>
    <td><input class="form-control" style="width:70px" type="number" value="0" oninput="billItems[${idx}].stone=+this.value;calcBillRow(${idx})"></td>
    <td><select class="form-control" style="width:60px" onchange="billItems[${idx}].gst=+this.value;calcBillRow(${idx})">
      <option value="3" selected>3%</option><option value="5">5%</option><option value="18">18%</option><option value="0">0%</option>
    </select></td>
    <td><input class="form-control" style="width:55px" type="number" value="0" min="0" max="100" oninput="billItems[${idx}].disc=+this.value;calcBillRow(${idx})"></td>
    <td class="fw-bold text-gold" id="bill-row-amt-${idx}">₹0</td>
    <td><button class="btn btn-xs" style="background:#e74c3c;color:#fff;padding:3px 7px" onclick="removeBillItem(${idx})">✕</button></td>
  `;
  tbody.appendChild(tr);
}

function calcBillRow(i) {
  const p = billItems[i];
  const base = (p.wt * p.rate) + p.making + p.stone;
  const disc = base * (p.disc/100);
  const gst  = (base - disc) * (p.gst/100);
  const total = base - disc + gst;
  p.total = total; p.gstAmt = gst; p.base = base; p.discAmt = disc;
  const el = document.getElementById('bill-row-amt-'+i);
  if (el) el.textContent = '₹' + Math.round(total).toLocaleString('en-IN');
  recalcBillTotal();
}

function removeBillItem(i) {
  billItems[i].total = 0; billItems[i].removed = true;
  const row = document.getElementById('bill-row-'+i);
  if (row) row.remove();
  recalcBillTotal();
}

function recalcBillTotal() {
  const active = billItems.filter(p => !p.removed);
  const subtotal  = active.reduce((s,p) => s + (p.base||0) - (p.discAmt||0), 0);
  const gstTotal  = active.reduce((s,p) => s + (p.gstAmt||0), 0);
  const itemDisc  = active.reduce((s,p) => s + (p.discAmt||0), 0);
  const extraDisc = +(document.getElementById('bill_disc_pct')  || {value:0}).value || 0;
  const extraDiscAmt = +(document.getElementById('bill_disc_amt') || {value:0}).value || 0;
  const exchVal   = +(document.getElementById('bill_exchange')   || {value:0}).value || 0;
  const extraD    = subtotal * (extraDisc/100) + extraDiscAmt;
  const tcsBase   = subtotal + gstTotal - extraD - couponDiscount - exchVal;
  const tcs       = tcsBase > 200000 ? tcsBase * 0.01 : 0;
  const grand     = Math.max(0, tcsBase + tcs);

  const set = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
  const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
  set('tot_subtotal',   fmt(subtotal));
  set('tot_cgst',       fmt(gstTotal/2));
  set('tot_sgst',       fmt(gstTotal/2));
  set('tot_item_disc',  '- ' + fmt(itemDisc));
  set('tot_coupon',     '- ' + fmt(couponDiscount));
  set('tot_exchange_val','- ' + fmt(exchVal));
  set('tot_tcs',        fmt(tcs));
  set('bill-grand-total', fmt(grand));
  set('tot_words',      numToWords(Math.round(grand)) + ' Rupees Only');
  // preview
  set('prev_cgst',  fmt(gstTotal/2));
  set('prev_sgst',  fmt(gstTotal/2));
  set('prev_total', fmt(grand));
  updateBillPreview();
}

function updateBillPreview() {
  const tbody = document.getElementById('prev_items');
  if (!tbody) return;
  const active = billItems.filter(p => !p.removed && p.desc);
  if (!active.length) { tbody.innerHTML='<tr><td colspan="4" style="text-align:center;padding:8px;color:#aaa">No items</td></tr>'; return; }
  tbody.innerHTML = active.map(p => `<tr style="border-bottom:1px solid #eee"><td style="padding:3px">${p.desc}</td><td>${p.wt}g</td><td>₹${p.rate}</td><td>₹${Math.round(p.total||0).toLocaleString('en-IN')}</td></tr>`).join('');
  const custEl = document.getElementById('inv_customer');
  const prevCust = document.getElementById('prev_customer');
  if (custEl && prevCust) prevCust.textContent = custEl.options[custEl.selectedIndex]?.text || '—';
}

function calcChange() {
  const grandEl = document.getElementById('bill-grand-total');
  const amtEl   = document.getElementById('pay_cash_amt');
  const chgEl   = document.getElementById('pay_change');
  if (!grandEl || !amtEl || !chgEl) return;
  const grand = parseInt((grandEl.textContent||'0').replace(/[₹,]/g,'')) || 0;
  const paid  = +amtEl.value || 0;
  chgEl.value = '₹' + Math.max(0, paid - grand).toLocaleString('en-IN');
  chgEl.style.color = paid >= grand ? 'var(--success)' : '#e74c3c';
}

function calcEMI() {
  const grandEl = document.getElementById('bill-grand-total');
  const downEl  = document.getElementById('emi_down');
  const mthEl   = document.getElementById('emi_months');
  const intEl   = document.getElementById('emi_int');
  const emiEl   = document.getElementById('emi_amount');
  if (!grandEl || !downEl || !mthEl || !emiEl) return;
  const grand   = parseInt((grandEl.textContent||'0').replace(/[₹,]/g,'')) || 0;
  const down    = +downEl.value || 0;
  const months  = +mthEl.value || 12;
  const rate    = (+intEl.value || 0) / 100 / 12;
  const financed = grand - down;
  let emi;
  if (rate === 0) { emi = financed / months; }
  else { emi = financed * rate * Math.pow(1+rate, months) / (Math.pow(1+rate, months) - 1); }
  emiEl.value = '₹' + Math.round(emi).toLocaleString('en-IN');
}

function applyCoupon() {
  const code = (document.getElementById('coupon_code')||{}).value?.trim().toUpperCase();
  const msgEl = document.getElementById('coupon_msg');
  if (!msgEl) return;
  msgEl.style.display = 'block';
  if (activeCoupons[code] !== undefined) {
    const pct = activeCoupons[code];
    const grandEl = document.getElementById('bill-grand-total');
    const grand = parseInt((grandEl?.textContent||'0').replace(/[₹,]/g,'')) || 0;
    couponDiscount = code === 'FLAT500' ? 500 : grand * pct / 100;
    msgEl.style.background = 'rgba(46,204,113,.15)';
    msgEl.style.color = '#2ecc71';
    msgEl.innerHTML = `✅ Coupon <b>${code}</b> applied! You save ₹${Math.round(couponDiscount).toLocaleString('en-IN')}`;
    recalcBillTotal();
  } else {
    msgEl.style.background = 'rgba(231,76,60,.12)';
    msgEl.style.color = '#e74c3c';
    msgEl.innerHTML = `❌ Invalid coupon code. Try: DIWALI10, FLAT500, WELCOME5`;
  }
}

function applyGiftVoucher() {
  const code = (document.getElementById('gift_voucher')||{}).value?.trim().toUpperCase();
  const msgEl = document.getElementById('coupon_msg');
  if (!msgEl) return;
  msgEl.style.display = 'block';
  if (activeVouchers[code]) {
    const val = activeVouchers[code];
    couponDiscount += val;
    msgEl.style.background = 'rgba(46,204,113,.15)';
    msgEl.style.color = '#2ecc71';
    msgEl.innerHTML = `🎟️ Gift Voucher <b>${code}</b> applied! Value: ₹${val.toLocaleString('en-IN')}`;
    recalcBillTotal();
  } else {
    msgEl.style.background = 'rgba(231,76,60,.12)';
    msgEl.style.color = '#e74c3c';
    msgEl.innerHTML = `❌ Invalid Gift Voucher. Try: GV-1234-ABCD`;
  }
}

function finalizeBill() {
  const custEl = document.getElementById('inv_customer');
  if (!custEl?.value) { showToast('Please select a customer','error'); return; }
  if (!billItems.filter(p=>!p.removed).length) { showToast('Please add at least one item','error'); return; }
  const invNo = (document.getElementById('inv_no')||{}).value || 'INV-2026-XXXX';
  showToast(invNo + ' finalized! Sending to printer...', 'success');
  setTimeout(() => printInvoice(), 800);
}

function showBillPreview() {
  showToast('Preview updated in right panel','info');
}

function numToWords(n) {
  if (n === 0) return 'Zero';
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const inWords = n => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + (n%10?' '+a[n%10]:'');
    if (n < 1000) return a[Math.floor(n/100)]+' Hundred'+(n%100?' '+inWords(n%100):'');
    if (n < 100000) return inWords(Math.floor(n/1000))+' Thousand'+(n%1000?' '+inWords(n%1000):'');
    if (n < 10000000) return inWords(Math.floor(n/100000))+' Lakh'+(n%100000?' '+inWords(n%100000):'');
    return inWords(Math.floor(n/10000000))+' Crore'+(n%10000000?' '+inWords(n%10000000):'');
  };
  return inWords(n);
}
