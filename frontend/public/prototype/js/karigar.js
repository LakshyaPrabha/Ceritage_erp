/* ===================================================
   CERITAGE JEWELRY ERP — Karigar Management Module
   10 Features: Profile · Work Order · Gold Issue · Gold Receive
                Stone Issue · Stone Receive · Labour Charges
                Pending Work · Payment · Performance Report
   =================================================== */

// ============================================================
// SAMPLE DATA
// ============================================================
const KG = {

  karigars: [
    { id:'KG001', name:'Ramesh Soni',      phone:'9812345670', email:'ramesh@gmail.com',  skill:'Kundan Work',      experience:12, address:'12, Zaveri Nagar, Mumbai', aadhaar:'1234 5678 9012', pan:'ABCRS1234F', bankAcc:'SBI-4521890123', ifsc:'SBIN0001234', rate:350, rateUnit:'per gram',   status:'Active',   joined:'2020-03-15', photo:'RS', rating:4.8, totalJobs:148, completedJobs:142, pendingJobs:3, goldIssued:2840, goldReceived:2801, goldBalance:39, totalEarned:485000, pendingPayment:12500 },
    { id:'KG002', name:'Suresh Meena',     phone:'9745612340', email:'suresh@gmail.com',  skill:'Diamond Setting',  experience:8,  address:'45, Soni Mohalla, Jaipur',  aadhaar:'2345 6789 0123', pan:'ABCSM5678G', bankAcc:'HDFC-8832105672', ifsc:'HDFC0002345', rate:500, rateUnit:'per piece',  status:'Active',   joined:'2021-06-20', photo:'SM', rating:4.6, totalJobs:92,  completedJobs:88,  pendingJobs:1, goldIssued:920,  goldReceived:910,  goldBalance:10, totalEarned:312000, pendingPayment:8000  },
    { id:'KG003', name:'Harish Kumar',     phone:'9923415670', email:'harish@gmail.com',  skill:'Polishing',        experience:6,  address:'78, Kalyan Colony, Pune',   aadhaar:'3456 7890 1234', pan:'ABCHK9012H', bankAcc:'ICICI-2214567890',ifsc:'ICIC0003456', rate:200, rateUnit:'per gram',   status:'Active',   joined:'2022-01-10', photo:'HK', rating:4.2, totalJobs:201, completedJobs:196, pendingJobs:5, goldIssued:1240, goldReceived:1224, goldBalance:16, totalEarned:224000, pendingPayment:5500  },
    { id:'KG004', name:'Dinesh Prajapat',  phone:'9867234510', email:'',                  skill:'Enamel Work',      experience:15, address:'22, Enamel Gali, Jaipur',   aadhaar:'4567 8901 2345', pan:'ABCDP3456I', bankAcc:'PNB-6671234567',  ifsc:'PUNB0004567', rate:400, rateUnit:'per piece',  status:'Inactive', joined:'2019-11-05', photo:'DP', rating:4.0, totalJobs:65,  completedJobs:65,  pendingJobs:0, goldIssued:650,  goldReceived:648,  goldBalance:2,  totalEarned:186000, pendingPayment:0     },
    { id:'KG005', name:'Mohan Lal Verma',  phone:'9834561230', email:'mohan@gmail.com',   skill:'Casting',          experience:10, address:'56, Dhaatu Nagar, Rajkot',  aadhaar:'5678 9012 3456', pan:'ABCMV7890J', bankAcc:'BOB-1123456789',  ifsc:'BARB0005678', rate:300, rateUnit:'per gram',   status:'Active',   joined:'2021-09-01', photo:'MV', rating:4.5, totalJobs:118, completedJobs:112, pendingJobs:6, goldIssued:1580, goldReceived:1560, goldBalance:20, totalEarned:298000, pendingPayment:9800  },
    { id:'KG006', name:'Raju Filigree',    phone:'9701234568', email:'raju@gmail.com',    skill:'Filigree Work',    experience:20, address:'90, Silver Street, Cuttack', aadhaar:'6789 0123 4567', pan:'ABCRF2345K', bankAcc:'SBI-9934561230',  ifsc:'SBIN0006789', rate:600, rateUnit:'per piece',  status:'Active',   joined:'2018-05-12', photo:'RF', rating:4.9, totalJobs:78,  completedJobs:76,  pendingJobs:2, goldIssued:480,  goldReceived:478,  goldBalance:2,  totalEarned:395000, pendingPayment:18000 },
    { id:'KG007', name:'Bharat Shah',      phone:'9654321078', email:'bharat@gmail.com',  skill:'Stone Setting',    experience:7,  address:'34, Diamond Lane, Surat',   aadhaar:'7890 1234 5678', pan:'ABCBS6789L', bankAcc:'HDFC-4412345678', ifsc:'HDFC0007890', rate:450, rateUnit:'per piece',  status:'Active',   joined:'2023-02-14', photo:'BS', rating:4.3, totalJobs:54,  completedJobs:50,  pendingJobs:4, goldIssued:320,  goldReceived:310,  goldBalance:10, totalEarned:145000, pendingPayment:6200  },
    { id:'KG008', name:'Lalit Joshi',      phone:'9512345670', email:'lalit@gmail.com',   skill:'Wax Casting',      experience:5,  address:'67, Artisan Block, Varanasi',aadhaar:'8901 2345 6789', pan:'ABCLJ0123M', bankAcc:'SBI-7723456780',  ifsc:'SBIN0008901', rate:280, rateUnit:'per gram',   status:'On Leave', joined:'2024-01-20', photo:'LJ', rating:4.1, totalJobs:32,  completedJobs:28,  pendingJobs:4, goldIssued:280,  goldReceived:270,  goldBalance:10, totalEarned:68000,  pendingPayment:3200  },
  ],

  workOrders: [
    { id:'WO001', karigarId:'KG001', karigarName:'Ramesh Soni',     jobRef:'RJ001',   orderDate:'2026-08-10', dueDate:'2026-08-17', deliveredDate:null,         item:'Kundan Necklace — Clasp repair + polish', qty:1, goldIssued:28.5, goldExpected:28.3, goldReceived:null,   stoneIssued:0,  priority:'High',   status:'In Progress', labourRate:350, labourWt:28.5, labourAmt:9975,  advancePaid:3000, balanceDue:6975,  branch:'Mumbai HQ' },
    { id:'WO002', karigarId:'KG002', karigarName:'Suresh Meena',    jobRef:'RJ002',   orderDate:'2026-08-12', dueDate:'2026-08-15', deliveredDate:'2026-08-15', item:'Diamond Ring — Stone setting 0.5ct',      qty:1, goldIssued:4.2,  goldExpected:4.1,  goldReceived:4.1,   stoneIssued:1,  priority:'High',   status:'Delivered',   labourRate:500, labourWt:0,    labourAmt:5000,  advancePaid:2000, balanceDue:3000,  branch:'Mumbai HQ' },
    { id:'WO003', karigarId:'KG003', karigarName:'Harish Kumar',    jobRef:'RJ003',   orderDate:'2026-08-14', dueDate:'2026-08-18', deliveredDate:null,         item:'Silver Bangle Set — Polish & clean',      qty:3, goldIssued:0,    goldExpected:0,    goldReceived:null,   stoneIssued:0,  priority:'Normal', status:'Pending',     labourRate:200, labourWt:135,  labourAmt:3200,  advancePaid:0,    balanceDue:3200,  branch:'Mumbai HQ' },
    { id:'WO004', karigarId:'KG001', karigarName:'Ramesh Soni',     jobRef:'ORD001',  orderDate:'2026-08-08', dueDate:'2026-09-15', deliveredDate:null,         item:'Custom Bridal Set — 22K Kundan',          qty:1, goldIssued:120.0,goldExpected:118.5,goldReceived:null,   stoneIssued:24, priority:'Urgent', status:'In Progress', labourRate:350, labourWt:120,  labourAmt:42000, advancePaid:15000,balanceDue:27000, branch:'Mumbai HQ' },
    { id:'WO005', karigarId:'KG005', karigarName:'Mohan Lal Verma', jobRef:'ORD002',  orderDate:'2026-08-05', dueDate:'2026-09-01', deliveredDate:null,         item:'Solitaire Ring — 18K Casting + Setting',  qty:1, goldIssued:8.0,  goldExpected:7.8,  goldReceived:null,   stoneIssued:1,  priority:'High',   status:'In Progress', labourRate:300, labourWt:8,    labourAmt:3500,  advancePaid:1500, balanceDue:2000,  branch:'Mumbai HQ' },
    { id:'WO006', karigarId:'KG006', karigarName:'Raju Filigree',   jobRef:'ORD003',  orderDate:'2026-08-13', dueDate:'2026-08-25', deliveredDate:null,         item:'Silver Filigree Earrings (Pair)',          qty:2, goldIssued:0,    goldExpected:0,    goldReceived:null,   stoneIssued:0,  priority:'Normal', status:'In Progress', labourRate:600, labourWt:0,    labourAmt:12000, advancePaid:4000, balanceDue:8000,  branch:'Mumbai HQ' },
    { id:'WO007', karigarId:'KG007', karigarName:'Bharat Shah',     jobRef:'RJ004',   orderDate:'2026-08-15', dueDate:'2026-08-20', deliveredDate:null,         item:'Diamond Pendant — Prong setting 0.3ct',   qty:1, goldIssued:3.8,  goldExpected:3.7,  goldReceived:null,   stoneIssued:1,  priority:'Normal', status:'Pending',     labourRate:450, labourWt:0,    labourAmt:4500,  advancePaid:0,    balanceDue:4500,  branch:'Mumbai HQ' },
    { id:'WO008', karigarId:'KG003', karigarName:'Harish Kumar',    jobRef:'RJ005',   orderDate:'2026-08-11', dueDate:'2026-08-16', deliveredDate:'2026-08-14', item:'Gold Chain — Polishing 22K',              qty:1, goldIssued:12.0, goldExpected:11.9, goldReceived:11.9,  stoneIssued:0,  priority:'Normal', status:'Delivered',   labourRate:200, labourWt:12,   labourAmt:2400,  advancePaid:2400, balanceDue:0,     branch:'Mumbai HQ' },
  ],

  goldIssues: [
    { id:'GI001', karigarId:'KG001', karigarName:'Ramesh Soni',     woRef:'WO001', metal:'22K Gold', grossWt:29.0, stoneWt:0.5, netWt:28.5, issuedBy:'Ravi Sharma',  date:'2026-08-10', status:'Issued' },
    { id:'GI002', karigarId:'KG002', karigarName:'Suresh Meena',    woRef:'WO002', metal:'18K Gold', grossWt:4.5,  stoneWt:0.3, netWt:4.2,  issuedBy:'Karan Mehta',  date:'2026-08-12', status:'Received Back' },
    { id:'GI003', karigarId:'KG001', karigarName:'Ramesh Soni',     woRef:'WO004', metal:'22K Gold', grossWt:122.0,stoneWt:2.0, netWt:120.0,issuedBy:'Ravi Sharma',  date:'2026-08-08', status:'Issued' },
    { id:'GI004', karigarId:'KG005', karigarName:'Mohan Lal Verma', woRef:'WO005', metal:'18K Gold', grossWt:8.5,  stoneWt:0.5, netWt:8.0,  issuedBy:'Ravi Sharma',  date:'2026-08-05', status:'Issued' },
    { id:'GI005', karigarId:'KG003', karigarName:'Harish Kumar',    woRef:'WO008', metal:'22K Gold', grossWt:12.2, stoneWt:0.2, netWt:12.0, issuedBy:'Karan Mehta',  date:'2026-08-11', status:'Received Back' },
  ],

  goldReceives: [
    { id:'GR001', karigarId:'KG002', karigarName:'Suresh Meena',    woRef:'WO002', metal:'18K Gold', issuedWt:4.2,  receivedWt:4.1,  wastage:0.1,  wastPct:2.38,  receivedBy:'Ravi Sharma',  date:'2026-08-15', remarks:'Clean finish — acceptable wastage' },
    { id:'GR002', karigarId:'KG003', karigarName:'Harish Kumar',    woRef:'WO008', metal:'22K Gold', issuedWt:12.0, receivedWt:11.9, wastage:0.1,  wastPct:0.83,  receivedBy:'Karan Mehta',  date:'2026-08-14', remarks:'Good quality polish' },
    { id:'GR003', karigarId:'KG001', karigarName:'Ramesh Soni',     woRef:'WO-OLD',metal:'22K Gold', issuedWt:35.0, receivedWt:34.7, wastage:0.3,  wastPct:0.86,  receivedBy:'Ravi Sharma',  date:'2026-08-07', remarks:'Previous job' },
  ],

  stoneIssues: [
    { id:'SI001', karigarId:'KG002', karigarName:'Suresh Meena',    woRef:'WO002', stoneType:'Round Brilliant Diamond', carats:0.5,  pieces:1, issuedBy:'Ravi Sharma',  date:'2026-08-12', status:'Received Back' },
    { id:'SI002', karigarId:'KG001', karigarName:'Ramesh Soni',     woRef:'WO004', stoneType:'Kundan Stones (Mixed)',   carats:0,    pieces:24,issuedBy:'Ravi Sharma',  date:'2026-08-08', status:'Issued' },
    { id:'SI003', karigarId:'KG005', karigarName:'Mohan Lal Verma', woRef:'WO005', stoneType:'Oval Solitaire Diamond', carats:2.0,  pieces:1, issuedBy:'Karan Mehta',  date:'2026-08-05', status:'Issued' },
    { id:'SI004', karigarId:'KG007', karigarName:'Bharat Shah',     woRef:'WO007', stoneType:'Princess Diamond 0.3ct', carats:0.3,  pieces:1, issuedBy:'Ravi Sharma',  date:'2026-08-15', status:'Issued' },
  ],

  stoneReceives: [
    { id:'SR001', karigarId:'KG002', karigarName:'Suresh Meena',    woRef:'WO002', stoneType:'Round Brilliant Diamond', issuedPcs:1, receivedPcs:1, issuedCt:0.5, receivedCt:0.5, damage:0, receivedBy:'Ravi Sharma',  date:'2026-08-15', remarks:'Stone intact, set perfectly' },
  ],

  labourCharges: [
    { id:'LC001', karigarId:'KG001', karigarName:'Ramesh Soni',     woRef:'WO001', item:'Kundan Necklace Repair',     chargeType:'Per Gram',  rate:350, qty:28.5, amount:9975,  gst:18, gstAmt:1795, total:11770, status:'Pending',  date:'2026-08-17' },
    { id:'LC002', karigarId:'KG002', karigarName:'Suresh Meena',    woRef:'WO002', item:'Diamond Ring Stone Setting', chargeType:'Per Piece', rate:500, qty:1,    amount:5000,  gst:18, gstAmt:900,  total:5900,  status:'Paid',     date:'2026-08-15' },
    { id:'LC003', karigarId:'KG003', karigarName:'Harish Kumar',    woRef:'WO003', item:'Silver Bangle Polish',       chargeType:'Per Gram',  rate:200, qty:135,  amount:3200,  gst:18, gstAmt:576,  total:3776,  status:'Pending',  date:'2026-08-18' },
    { id:'LC004', karigarId:'KG001', karigarName:'Ramesh Soni',     woRef:'WO004', item:'Custom Bridal Set 22K',      chargeType:'Per Gram',  rate:350, qty:120,  amount:42000, gst:18, gstAmt:7560, total:49560, status:'Partial',  date:'2026-09-15' },
    { id:'LC005', karigarId:'KG005', karigarName:'Mohan Lal Verma', woRef:'WO005', item:'Solitaire Ring Casting',     chargeType:'Lump Sum',  rate:3500,qty:1,   amount:3500,  gst:18, gstAmt:630,  total:4130,  status:'Pending',  date:'2026-09-01' },
    { id:'LC006', karigarId:'KG006', karigarName:'Raju Filigree',   woRef:'WO006', item:'Silver Filigree Earrings',   chargeType:'Per Piece', rate:600, qty:2,    amount:12000, gst:18, gstAmt:2160, total:14160, status:'Pending',  date:'2026-08-25' },
    { id:'LC007', karigarId:'KG003', karigarName:'Harish Kumar',    woRef:'WO008', item:'Gold Chain Polish 22K',      chargeType:'Per Gram',  rate:200, qty:12,   amount:2400,  gst:18, gstAmt:432,  total:2832,  status:'Paid',     date:'2026-08-14' },
    { id:'LC008', karigarId:'KG007', karigarName:'Bharat Shah',     woRef:'WO007', item:'Diamond Pendant Prong Set',  chargeType:'Per Piece', rate:450, qty:1,    amount:4500,  gst:18, gstAmt:810,  total:5310,  status:'Pending',  date:'2026-08-20' },
  ],

  payments: [
    { id:'PY001', karigarId:'KG002', karigarName:'Suresh Meena',    date:'2026-08-15', amount:5000,  mode:'Bank Transfer', ref:'UTR-2345678901', woRef:'WO002', remark:'Full payment for WO002', balance:3000  },
    { id:'PY002', karigarId:'KG001', karigarName:'Ramesh Soni',     date:'2026-08-14', amount:3000,  mode:'Cash',          ref:'CASH-001',       woRef:'WO001', remark:'Advance for WO001',     balance:6975  },
    { id:'PY003', karigarId:'KG003', karigarName:'Harish Kumar',    date:'2026-08-14', amount:2400,  mode:'UPI',           ref:'GPay-8765432109',woRef:'WO008', remark:'Full payment for WO008', balance:0     },
    { id:'PY004', karigarId:'KG001', karigarName:'Ramesh Soni',     date:'2026-08-08', amount:15000, mode:'Bank Transfer', ref:'UTR-1234567890', woRef:'WO004', remark:'Advance for Bridal Set', balance:27000 },
    { id:'PY005', karigarId:'KG006', karigarName:'Raju Filigree',   date:'2026-08-13', amount:4000,  mode:'Cash',          ref:'CASH-002',       woRef:'WO006', remark:'Advance for WO006',     balance:8000  },
  ],
};

// ============================================================
// UTILITIES
// ============================================================
function kgFmt(n)  { return '₹' + (n||0).toLocaleString('en-IN'); }
function kgDate(d) { if(!d) return '—'; const dt=new Date(d); return isNaN(dt)?d:dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function kgStatusBadge(s) {
  const m = { 'Active':'badge-green','Delivered':'badge-green','Received Back':'badge-green','Paid':'badge-green',
    'In Progress':'badge-orange','Issued':'badge-blue','Partial':'badge-orange','On Leave':'badge-grey',
    'Pending':'badge-grey','Inactive':'badge-red','Overdue':'badge-red','Urgent':'badge-red' };
  return `<span class="badge ${m[s]||'badge-grey'}">${s}</span>`;
}
function kgDaysLeft(due) {
  if (!due) return null;
  const diff = Math.ceil((new Date(due) - new Date()) / 86400000);
  return diff;
}
function kgStars(r) {
  const full = Math.floor(r); const half = r%1>=0.5;
  let s = '';
  for(let i=0;i<5;i++) s += i<full ? '★' : (i===full&&half ? '½' : '☆');
  return `<span style="color:#f0c040;font-size:.9rem">${s}</span> <span style="font-size:.75rem;color:var(--text-muted)">(${r})</span>`;
}

// ============================================================
// 1. KARIGAR PROFILES
// ============================================================
let kgFilter = { search:'', status:'', skill:'' };
let activeKgId = null;

function renderKarigarProfiles() {
  const tbody = document.getElementById('kg-profile-tbody');
  if (!tbody) return;
  const lq = kgFilter.search.toLowerCase();
  const data = KG.karigars.filter(k => {
    const ms = !lq || k.name.toLowerCase().includes(lq) || k.id.includes(lq) || k.skill.toLowerCase().includes(lq);
    const mst = !kgFilter.status || k.status === kgFilter.status;
    const msk = !kgFilter.skill  || k.skill  === kgFilter.skill;
    return ms && mst && msk;
  });

  // Update KPIs
  const setK = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  setK('kg-kpi-total',  KG.karigars.length);
  setK('kg-kpi-active', KG.karigars.filter(k=>k.status==='Active').length);
  setK('kg-kpi-gold',   KG.karigars.reduce((s,k)=>s+k.goldBalance,0).toFixed(1)+'g');
  setK('kg-kpi-pending',KG.karigars.reduce((s,k)=>s+k.pendingJobs,0));

  tbody.innerHTML = data.map(k => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-dark));display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:800;color:#fff;flex-shrink:0">${k.photo}</div>
          <div>
            <div style="font-weight:700">${k.name}</div>
            <div style="font-size:.72rem;color:var(--text-muted)">${k.id} · ${k.phone}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-gold" style="font-size:.72rem">${k.skill}</span></td>
      <td>${k.experience} yrs</td>
      <td>${kgStars(k.rating)}</td>
      <td>${kgStatusBadge(k.status)}</td>
      <td><span class="badge badge-${k.pendingJobs>3?'red':k.pendingJobs>0?'orange':'green'}">${k.pendingJobs}</span></td>
      <td><span style="color:${k.goldBalance>5?'var(--danger)':'var(--text-muted)'};">${k.goldBalance}g</span></td>
      <td class="${k.pendingPayment>0?'text-danger fw-bold':''}">${kgFmt(k.pendingPayment)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="openKgProfile('${k.id}')">👁 Profile</button>
        <button class="btn btn-gold btn-xs" onclick="openNewWorkOrder('${k.id}')">📋 Work Order</button>
        <button class="btn btn-outline btn-xs" onclick="openIssueGold('${k.id}')">📤 Issue</button>
        <button class="btn btn-outline btn-xs" onclick="openKgPayment('${k.id}')">💳 Pay</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-muted)">No karigars found</td></tr>`;
}

function setKgFilter(key, val) { kgFilter[key] = val; renderKarigarProfiles(); }

function openKgProfile(id) {
  activeKgId = id;
  const k = KG.karigars.find(x=>x.id===id);
  if (!k) return;
  openModal('kgProfileModal');
  document.getElementById('kgp-name').textContent    = k.name;
  document.getElementById('kgp-id').textContent      = k.id;
  document.getElementById('kgp-skill').textContent   = k.skill;
  document.getElementById('kgp-exp').textContent     = k.experience + ' years';
  document.getElementById('kgp-phone').textContent   = k.phone;
  document.getElementById('kgp-email').textContent   = k.email || '—';
  document.getElementById('kgp-addr').textContent    = k.address;
  document.getElementById('kgp-aadhaar').textContent = k.aadhaar;
  document.getElementById('kgp-pan').textContent     = k.pan || '—';
  document.getElementById('kgp-bank').textContent    = k.bankAcc + ' (' + k.ifsc + ')';
  document.getElementById('kgp-rate').textContent    = kgFmt(k.rate) + ' ' + k.rateUnit;
  document.getElementById('kgp-joined').textContent  = kgDate(k.joined);
  document.getElementById('kgp-status').innerHTML    = kgStatusBadge(k.status);
  document.getElementById('kgp-stars').innerHTML     = kgStars(k.rating);
  document.getElementById('kgp-totalJobs').textContent    = k.totalJobs;
  document.getElementById('kgp-completedJobs').textContent= k.completedJobs;
  document.getElementById('kgp-pendingJobs').textContent  = k.pendingJobs;
  document.getElementById('kgp-goldIssued').textContent   = k.goldIssued + 'g';
  document.getElementById('kgp-goldReceived').textContent = k.goldReceived + 'g';
  document.getElementById('kgp-goldBalance').textContent  = k.goldBalance + 'g';
  document.getElementById('kgp-goldBalance').style.color  = k.goldBalance>5?'var(--danger)':'var(--success)';
  document.getElementById('kgp-totalEarned').textContent  = kgFmt(k.totalEarned);
  document.getElementById('kgp-pendingPay').textContent   = kgFmt(k.pendingPayment);
  document.getElementById('kgp-pendingPay').style.color   = k.pendingPayment>0?'var(--danger)':'var(--success)';
  document.getElementById('kgp-avatar-big').textContent   = k.photo;
}

function openNewWorkOrder(id) {
  activeKgId = id;
  openModal('newWorkOrderModal');
  const k = KG.karigars.find(x=>x.id===id);
  document.getElementById('nwo-karigar-label').textContent = k ? k.name + ' — ' + k.skill : id;
  document.getElementById('nwo-karigar-id').value = id;
}

function openIssueGold(id) {
  activeKgId = id;
  openModal('issueGoldModal');
  const k = KG.karigars.find(x=>x.id===id);
  document.getElementById('ig-karigar-label').textContent = k ? k.name : id;
  document.getElementById('ig-karigar-id').value = id;
  // populate work order dropdown
  const sel = document.getElementById('ig-wo-sel');
  if (sel) {
    const wos = KG.workOrders.filter(w=>w.karigarId===id&&w.status!=='Delivered');
    sel.innerHTML = '<option value="">-- Select Work Order --</option>' + wos.map(w=>`<option value="${w.id}">${w.id} — ${w.item.slice(0,30)}</option>`).join('');
  }
}

function openKgPayment(id) {
  activeKgId = id;
  const k = KG.karigars.find(x=>x.id===id);
  if (!k) return;
  openModal('kgPaymentModal');
  document.getElementById('kgpay-karigar-label').textContent = k.name;
  document.getElementById('kgpay-pending').textContent = kgFmt(k.pendingPayment);
  document.getElementById('kgpay-karigar-id').value = id;
  document.getElementById('kgpay-bank').textContent = k.bankAcc + ' (' + k.ifsc + ')';
  document.getElementById('kgpay-amount').value = k.pendingPayment || '';
}

// ============================================================
// 2. WORK ORDERS
// ============================================================
function renderWorkOrders(filterKgId) {
  const tbody = document.getElementById('kg-wo-tbody');
  if (!tbody) return;
  let data = filterKgId ? KG.workOrders.filter(w=>w.karigarId===filterKgId) : KG.workOrders;
  tbody.innerHTML = data.map(w => {
    const days = kgDaysLeft(w.dueDate);
    const overdue = days !== null && days < 0 && w.status !== 'Delivered';
    const dueColor = overdue ? 'var(--danger)' : days !== null && days <= 3 ? 'var(--warning)' : 'var(--text-muted)';
    return `<tr>
      <td><span class="badge badge-blue" style="font-size:.7rem">${w.id}</span></td>
      <td><strong>${w.karigarName}</strong></td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${w.jobRef}</span></td>
      <td style="max-width:200px;font-size:.82rem">${w.item}</td>
      <td>${kgDate(w.orderDate)}</td>
      <td style="color:${dueColor};font-weight:700">${kgDate(w.dueDate)}${overdue?' ⚠️':days!==null&&days<=3?' 🔔':''}</td>
      <td>${w.goldIssued > 0 ? w.goldIssued+'g' : '—'}</td>
      <td>${w.stoneIssued > 0 ? w.stoneIssued+' pcs' : '—'}</td>
      <td>${kgFmt(w.labourAmt)}</td>
      <td>${kgFmt(w.balanceDue)}</td>
      <td>${overdue ? kgStatusBadge('Overdue') : kgStatusBadge(w.status)}</td>
      <td style="white-space:nowrap">
        ${w.status!=='Delivered'?`<button class="btn btn-gold btn-xs" onclick="markWoDelivered('${w.id}')">✅ Deliver</button>`:''}
        <button class="btn btn-outline btn-xs" onclick="printWorkOrder('${w.id}')">🖨️</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="12" style="text-align:center;padding:20px;color:var(--text-muted)">No work orders found</td></tr>`;
}

function saveNewWorkOrder() {
  const kgId   = document.getElementById('nwo-karigar-id')?.value;
  const jobRef = document.getElementById('nwo-jobref')?.value?.trim();
  const item   = document.getElementById('nwo-item')?.value?.trim();
  const due    = document.getElementById('nwo-due')?.value;
  const priority = document.getElementById('nwo-priority')?.value;
  if (!kgId || !item || !due) { showToast('Fill all required fields', 'error'); return; }
  const k = KG.karigars.find(x=>x.id===kgId);
  const newId = 'WO' + (KG.workOrders.length + 1).toString().padStart(3,'0');
  KG.workOrders.unshift({ id:newId, karigarId:kgId, karigarName:k?.name||'', jobRef:jobRef||newId, orderDate:new Date().toISOString().slice(0,10), dueDate:due, deliveredDate:null, item, qty:1, goldIssued:0, goldExpected:0, goldReceived:null, stoneIssued:0, priority, status:'Pending', labourRate:k?.rate||0, labourWt:0, labourAmt:0, advancePaid:0, balanceDue:0, branch:'Mumbai HQ' });
  if (k) { k.pendingJobs++; k.totalJobs++; }
  closeModal('newWorkOrderModal');
  renderWorkOrders(); renderPendingWork(); renderKarigarProfiles();
  showToast('Work Order ' + newId + ' created!', 'success');
}

function markWoDelivered(id) {
  const w = KG.workOrders.find(x=>x.id===id);
  if (!w) return;
  w.status = 'Delivered'; w.deliveredDate = new Date().toISOString().slice(0,10);
  const k = KG.karigars.find(x=>x.id===w.karigarId);
  if (k) k.pendingJobs = Math.max(0, k.pendingJobs-1);
  renderWorkOrders(); renderPendingWork(); renderKarigarProfiles();
  showToast('Work Order ' + id + ' marked delivered!', 'success');
}

function printWorkOrder(id) { showToast('Work Order ' + id + ' sent to printer', 'success'); }

// ============================================================
// 3. GOLD ISSUE
// ============================================================
function renderGoldIssues() {
  const tbody = document.getElementById('kg-gi-tbody');
  if (!tbody) return;
  tbody.innerHTML = KG.goldIssues.map(g => `
    <tr>
      <td><span class="badge badge-gold" style="font-size:.7rem">${g.id}</span></td>
      <td>${g.karigarName}</td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${g.woRef}</span></td>
      <td><span class="badge badge-gold">${g.metal}</span></td>
      <td>${g.grossWt}g</td>
      <td>${g.stoneWt}g</td>
      <td class="fw-bold text-gold">${g.netWt}g</td>
      <td>${g.issuedBy}</td>
      <td>${kgDate(g.date)}</td>
      <td>${kgStatusBadge(g.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="showToast('Issue slip printed','success')">🖨️ Slip</button>
      </td>
    </tr>`).join('');
}

function saveGoldIssue() {
  const kgId  = document.getElementById('ig-karigar-id')?.value;
  const woRef = document.getElementById('ig-wo-sel')?.value;
  const metal = document.getElementById('ig-metal')?.value;
  const gross = parseFloat(document.getElementById('ig-gross')?.value)||0;
  const stone = parseFloat(document.getElementById('ig-stone')?.value)||0;
  const net   = gross - stone;
  if (!kgId||!metal||gross<=0) { showToast('Fill all required fields','error'); return; }
  const k = KG.karigars.find(x=>x.id===kgId);
  const newId = 'GI'+Date.now();
  KG.goldIssues.unshift({ id:newId, karigarId:kgId, karigarName:k?.name||'', woRef:woRef||'—', metal, grossWt:gross, stoneWt:stone, netWt:net, issuedBy:'Ravi Sharma', date:new Date().toISOString().slice(0,10), status:'Issued' });
  if (k) { k.goldIssued += net; k.goldBalance += net; }
  const wo = KG.workOrders.find(x=>x.id===woRef);
  if (wo) wo.goldIssued += net;
  closeModal('issueGoldModal');
  renderGoldIssues(); renderKarigarProfiles(); renderPendingWork();
  showToast(`${net}g ${metal} issued to ${k?.name||kgId}`, 'success');
}

// ============================================================
// 4. GOLD RECEIVE
// ============================================================
function renderGoldReceives() {
  const tbody = document.getElementById('kg-gr-tbody');
  if (!tbody) return;
  tbody.innerHTML = KG.goldReceives.map(r => `
    <tr>
      <td><span class="badge badge-green" style="font-size:.7rem">${r.id}</span></td>
      <td>${r.karigarName}</td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${r.woRef}</span></td>
      <td><span class="badge badge-gold">${r.metal}</span></td>
      <td>${r.issuedWt}g</td>
      <td class="text-success fw-bold">${r.receivedWt}g</td>
      <td class="${r.wastage>0.5?'text-danger fw-bold':'text-success'}">${r.wastage}g</td>
      <td class="${r.wastPct>2?'text-danger':''}">${r.wastPct}%</td>
      <td>${r.receivedBy}</td>
      <td>${kgDate(r.date)}</td>
      <td style="font-size:.78rem;color:var(--text-muted)">${r.remarks}</td>
    </tr>`).join('') || `<tr><td colspan="11" style="text-align:center;padding:20px;color:var(--text-muted)">No gold received yet</td></tr>`;
}

function saveGoldReceive() {
  const kgId    = document.getElementById('gr-karigar-sel')?.value;
  const woRef   = document.getElementById('gr-wo-sel')?.value;
  const issued  = parseFloat(document.getElementById('gr-issued')?.value)||0;
  const received= parseFloat(document.getElementById('gr-received')?.value)||0;
  const remarks = document.getElementById('gr-remarks')?.value?.trim();
  if (!kgId||!issued||!received) { showToast('Fill all required fields','error'); return; }
  const k = KG.karigars.find(x=>x.id===kgId);
  const wastage = parseFloat((issued-received).toFixed(3));
  const wastPct = parseFloat((wastage/issued*100).toFixed(2));
  const newId = 'GR'+Date.now();
  KG.goldReceives.unshift({ id:newId, karigarId:kgId, karigarName:k?.name||'', woRef:woRef||'—', metal:'22K Gold', issuedWt:issued, receivedWt:received, wastage, wastPct, receivedBy:'Ravi Sharma', date:new Date().toISOString().slice(0,10), remarks });
  if (k) { k.goldReceived += received; k.goldBalance = Math.max(0, k.goldBalance - received); }
  // mark WO gold received
  const gi = KG.goldIssues.find(x=>x.woRef===woRef);
  if (gi) gi.status = 'Received Back';
  const wo = KG.workOrders.find(x=>x.id===woRef);
  if (wo) wo.goldReceived = received;
  closeModal('receiveGoldModal');
  renderGoldReceives(); renderGoldIssues(); renderKarigarProfiles();
  showToast(`${received}g gold received from ${k?.name||kgId} (Wastage: ${wastage}g)`, 'success');
}

// ============================================================
// 5. STONE ISSUE
// ============================================================
function renderStoneIssues() {
  const tbody = document.getElementById('kg-si-tbody');
  if (!tbody) return;
  tbody.innerHTML = KG.stoneIssues.map(s => `
    <tr>
      <td><span class="badge badge-purple" style="font-size:.7rem">${s.id}</span></td>
      <td>${s.karigarName}</td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${s.woRef}</span></td>
      <td>${s.stoneType}</td>
      <td>${s.carats > 0 ? s.carats+' ct' : '—'}</td>
      <td>${s.pieces} pcs</td>
      <td>${s.issuedBy}</td>
      <td>${kgDate(s.date)}</td>
      <td>${kgStatusBadge(s.status)}</td>
      <td><button class="btn btn-outline btn-xs" onclick="showToast('Stone slip printed','success')">🖨️</button></td>
    </tr>`).join('');
}

function saveStoneIssue() {
  const kgId   = document.getElementById('si-karigar-sel')?.value;
  const woRef  = document.getElementById('si-wo-sel')?.value;
  const stone  = document.getElementById('si-stone-type')?.value?.trim();
  const carats = parseFloat(document.getElementById('si-carats')?.value)||0;
  const pieces = parseInt(document.getElementById('si-pieces')?.value)||0;
  if (!kgId||!stone||pieces<=0) { showToast('Fill all required fields','error'); return; }
  const k = KG.karigars.find(x=>x.id===kgId);
  KG.stoneIssues.unshift({ id:'SI'+Date.now(), karigarId:kgId, karigarName:k?.name||'', woRef:woRef||'—', stoneType:stone, carats, pieces, issuedBy:'Ravi Sharma', date:new Date().toISOString().slice(0,10), status:'Issued' });
  const wo = KG.workOrders.find(x=>x.id===woRef);
  if (wo) wo.stoneIssued += pieces;
  closeModal('issueStoneModal');
  renderStoneIssues();
  showToast(`${pieces} pcs of ${stone} issued to ${k?.name||kgId}`, 'success');
}

// ============================================================
// 6. STONE RECEIVE
// ============================================================
function renderStoneReceives() {
  const tbody = document.getElementById('kg-sr-tbody');
  if (!tbody) return;
  tbody.innerHTML = KG.stoneReceives.map(r => `
    <tr>
      <td><span class="badge badge-green" style="font-size:.7rem">${r.id}</span></td>
      <td>${r.karigarName}</td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${r.woRef}</span></td>
      <td>${r.stoneType}</td>
      <td>${r.issuedPcs} pcs / ${r.issuedCt}ct</td>
      <td class="text-success fw-bold">${r.receivedPcs} pcs / ${r.receivedCt}ct</td>
      <td class="${r.damage>0?'text-danger fw-bold':'text-success'}">${r.damage}</td>
      <td>${r.receivedBy}</td>
      <td>${kgDate(r.date)}</td>
      <td style="font-size:.78rem;color:var(--text-muted)">${r.remarks}</td>
    </tr>`).join('') || `<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text-muted)">No stones received yet</td></tr>`;
}

function saveStoneReceive() {
  const kgId    = document.getElementById('sr-karigar-sel')?.value;
  const woRef   = document.getElementById('sr-wo-ref')?.value?.trim();
  const stone   = document.getElementById('sr-stone-type')?.value?.trim();
  const issPcs  = parseInt(document.getElementById('sr-iss-pcs')?.value)||0;
  const recPcs  = parseInt(document.getElementById('sr-rec-pcs')?.value)||0;
  const issCt   = parseFloat(document.getElementById('sr-iss-ct')?.value)||0;
  const recCt   = parseFloat(document.getElementById('sr-rec-ct')?.value)||0;
  if (!kgId||!stone||!recPcs) { showToast('Fill all required fields','error'); return; }
  const k = KG.karigars.find(x=>x.id===kgId);
  const damage = issPcs - recPcs;
  KG.stoneReceives.unshift({ id:'SR'+Date.now(), karigarId:kgId, karigarName:k?.name||'', woRef:woRef||'—', stoneType:stone, issuedPcs:issPcs, receivedPcs:recPcs, issuedCt:issCt, receivedCt:recCt, damage, receivedBy:'Ravi Sharma', date:new Date().toISOString().slice(0,10), remarks:document.getElementById('sr-remarks')?.value||'' });
  const si = KG.stoneIssues.find(x=>x.woRef===woRef);
  if (si) si.status = 'Received Back';
  closeModal('receiveStoneModal');
  renderStoneReceives(); renderStoneIssues();
  showToast(`Stones received from ${k?.name||kgId}${damage?' — '+damage+' pcs missing!':''}`, damage?'error':'success');
}

// ============================================================
// 7. LABOUR CHARGES
// ============================================================
function renderLabourCharges() {
  const tbody = document.getElementById('kg-lc-tbody');
  if (!tbody) return;
  tbody.innerHTML = KG.labourCharges.map(lc => `
    <tr>
      <td><span class="badge badge-grey" style="font-size:.7rem">${lc.id}</span></td>
      <td><strong>${lc.karigarName}</strong></td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${lc.woRef}</span></td>
      <td style="font-size:.82rem;max-width:180px">${lc.item}</td>
      <td><span class="badge badge-blue" style="font-size:.7rem">${lc.chargeType}</span></td>
      <td>${kgFmt(lc.rate)}</td>
      <td>${lc.qty}</td>
      <td class="text-gold fw-bold">${kgFmt(lc.amount)}</td>
      <td>${lc.gst}% (${kgFmt(lc.gstAmt)})</td>
      <td class="fw-bold" style="color:var(--accent)">${kgFmt(lc.total)}</td>
      <td>${kgDate(lc.date)}</td>
      <td>${kgStatusBadge(lc.status)}</td>
      <td style="white-space:nowrap">
        ${lc.status!=='Paid'?`<button class="btn btn-gold btn-xs" onclick="payLabourCharge('${lc.id}')">💳 Pay</button>`:''}
        <button class="btn btn-outline btn-xs" onclick="showToast('Labour voucher printed','success')">🖨️</button>
      </td>
    </tr>`).join('');
}

function payLabourCharge(id) {
  const lc = KG.labourCharges.find(x=>x.id===id);
  if (!lc) return;
  const k = KG.karigars.find(x=>x.id===lc.karigarId);
  lc.status = 'Paid';
  if (k) k.pendingPayment = Math.max(0, k.pendingPayment - lc.total);
  KG.payments.unshift({ id:'PY'+Date.now(), karigarId:lc.karigarId, karigarName:lc.karigarName, date:new Date().toISOString().slice(0,10), amount:lc.total, mode:'Bank Transfer', ref:'AUTO-'+Date.now().toString().slice(-6), woRef:lc.woRef, remark:'Labour payment for '+lc.id, balance:k?.pendingPayment||0 });
  renderLabourCharges(); renderPayments(); renderKarigarProfiles();
  showToast(kgFmt(lc.total)+' paid to '+lc.karigarName, 'success');
}

// ============================================================
// 8. PENDING WORK
// ============================================================
function renderPendingWork() {
  const tbody = document.getElementById('kg-pending-tbody');
  if (!tbody) return;
  const pending = KG.workOrders.filter(w => w.status !== 'Delivered');
  const now = new Date();
  tbody.innerHTML = pending.map(w => {
    const days = kgDaysLeft(w.dueDate);
    const overdue = days !== null && days < 0;
    const urgent = days !== null && days <= 3 && !overdue;
    return `<tr style="background:${overdue?'rgba(231,76,60,.05)':urgent?'rgba(243,156,18,.04)':''}">
      <td><span class="badge badge-${overdue?'red':urgent?'orange':'blue'}" style="font-size:.7rem">${w.id}</span></td>
      <td><strong>${w.karigarName}</strong></td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${w.jobRef}</span></td>
      <td style="font-size:.82rem;max-width:200px">${w.item}</td>
      <td>${kgDate(w.orderDate)}</td>
      <td style="font-weight:700;color:${overdue?'var(--danger)':urgent?'var(--warning)':'var(--text-muted)'}">${kgDate(w.dueDate)} ${overdue?'⚠️ OVERDUE':urgent?'🔔 SOON':''}</td>
      <td>${w.goldIssued>0?w.goldIssued+'g':'—'}</td>
      <td>${w.stoneIssued>0?w.stoneIssued+' pcs':'—'}</td>
      <td><span class="badge badge-${w.priority==='Urgent'?'red':w.priority==='High'?'orange':'grey'}">${w.priority}</span></td>
      <td>${kgStatusBadge(overdue?'Overdue':w.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-gold btn-xs" onclick="markWoDelivered('${w.id}')">✅ Deliver</button>
        <button class="btn btn-outline btn-xs" onclick="showToast('Reminder sent to '+w.karigarName,'success')">📱 Remind</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="11" style="text-align:center;padding:20px;color:var(--success)">✅ No pending work!</td></tr>`;

  const el = document.getElementById('kg-pending-count');
  if (el) el.textContent = pending.length;
  const overEl = document.getElementById('kg-overdue-count');
  if (overEl) overEl.textContent = pending.filter(w=>kgDaysLeft(w.dueDate)<0).length;
}

// ============================================================
// 9. PAYMENTS
// ============================================================
function renderPayments() {
  const tbody = document.getElementById('kg-pay-tbody');
  if (!tbody) return;
  tbody.innerHTML = KG.payments.map(p => `
    <tr>
      <td><span class="badge badge-green" style="font-size:.7rem">${p.id}</span></td>
      <td><strong>${p.karigarName}</strong></td>
      <td>${kgDate(p.date)}</td>
      <td class="text-success fw-bold">${kgFmt(p.amount)}</td>
      <td><span class="badge badge-blue" style="font-size:.7rem">${p.mode}</span></td>
      <td style="font-size:.78rem;font-family:monospace">${p.ref}</td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${p.woRef}</span></td>
      <td style="font-size:.78rem;color:var(--text-muted)">${p.remark}</td>
      <td class="${p.balance>0?'text-danger':''}">${kgFmt(p.balance)}</td>
      <td><button class="btn btn-outline btn-xs" onclick="showToast('Payment receipt printed','success')">🖨️</button></td>
    </tr>`).join('') || `<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text-muted)">No payment records</td></tr>`;
}

function saveKgPayment() {
  const kgId   = document.getElementById('kgpay-karigar-id')?.value;
  const amount = parseFloat(document.getElementById('kgpay-amount')?.value)||0;
  const mode   = document.getElementById('kgpay-mode')?.value;
  const ref    = document.getElementById('kgpay-ref')?.value?.trim();
  const remark = document.getElementById('kgpay-remark')?.value?.trim();
  if (!kgId||amount<=0) { showToast('Enter valid amount','error'); return; }
  const k = KG.karigars.find(x=>x.id===kgId);
  if (k) k.pendingPayment = Math.max(0, k.pendingPayment - amount);
  KG.payments.unshift({ id:'PY'+Date.now(), karigarId:kgId, karigarName:k?.name||'', date:new Date().toISOString().slice(0,10), amount, mode, ref:ref||'PY'+Date.now().toString().slice(-6), woRef:'—', remark:remark||'Payment', balance:k?.pendingPayment||0 });
  closeModal('kgPaymentModal');
  renderPayments(); renderKarigarProfiles();
  showToast(kgFmt(amount)+' paid to '+(k?.name||kgId), 'success');
}

// ============================================================
// 10. PERFORMANCE REPORT
// ============================================================
function renderPerformanceReport() {
  const grid = document.getElementById('kg-perf-grid');
  if (!grid) return;
  const sorted = [...KG.karigars].sort((a,b)=>b.rating-a.rating);
  grid.innerHTML = sorted.map((k,i) => {
    const complRate = k.totalJobs > 0 ? Math.round((k.completedJobs/k.totalJobs)*100) : 0;
    const wastage   = k.goldIssued > 0 ? ((k.goldIssued-k.goldReceived)/k.goldIssued*100).toFixed(2) : 0;
    const medal     = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
    return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:18px;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${k.status==='Active'?'var(--success)':k.status==='Inactive'?'var(--danger)':'var(--text-muted)'},transparent)"></div>
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-dark));display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;flex-shrink:0">${k.photo}</div>
        <div style="flex:1">
          <div style="font-weight:800;font-size:.92rem">${medal} ${k.name}</div>
          <div style="font-size:.74rem;color:var(--text-muted)">${k.skill} · ${k.experience} yrs exp</div>
          <div style="margin-top:4px">${kgStars(k.rating)}</div>
        </div>
        <div>${kgStatusBadge(k.status)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:1.1rem;font-weight:800;color:var(--accent)">${k.completedJobs}</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Jobs Done</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:1.1rem;font-weight:800;color:${k.pendingJobs>3?'var(--danger)':'var(--text-muted)'}">${k.pendingJobs}</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Pending</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:1.1rem;font-weight:800;color:${wastage>2?'var(--danger)':'var(--success)'}">${wastage}%</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Wastage</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:1.1rem;font-weight:800;color:var(--info)">${complRate}%</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Completion</div>
        </div>
      </div>
      <div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:4px">
          <span>On-time Completion</span><span style="font-weight:700">${complRate}%</span>
        </div>
        <div class="progress" style="height:6px"><div class="progress-bar ${complRate>=90?'green':complRate>=70?'':'red'}" style="width:${complRate}%"></div></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:.78rem;border-top:1px solid var(--border-light);padding-top:10px;margin-top:8px">
        <div><span style="color:var(--text-muted)">Total Earned</span><br><strong class="text-gold">${kgFmt(k.totalEarned)}</strong></div>
        <div style="text-align:right"><span style="color:var(--text-muted)">Pending Pay</span><br><strong class="${k.pendingPayment>0?'text-danger':''}">${kgFmt(k.pendingPayment)}</strong></div>
      </div>
      <div style="display:flex;gap:6px;margin-top:10px">
        <button class="btn btn-outline btn-sm" style="flex:1;font-size:.75rem" onclick="openKgProfile('${k.id}')">👁 Profile</button>
        <button class="btn btn-gold btn-sm" style="flex:1;font-size:.75rem" onclick="openKgPayment('${k.id}')">💳 Pay</button>
      </div>
    </div>`;
  }).join('');
}

// ============================================================
// MASTER INIT
// ============================================================
function initKarigarModule() {
  renderKarigarProfiles();
  renderWorkOrders();
  renderGoldIssues();
  renderGoldReceives();
  renderStoneIssues();
  renderStoneReceives();
  renderLabourCharges();
  renderPendingWork();
  renderPayments();
  renderPerformanceReport();
  // populate karigar dropdowns in modals
  ['gr-karigar-sel','si-karigar-sel','sr-karigar-sel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="">-- Select Karigar --</option>' + KG.karigars.map(k=>`<option value="${k.id}">${k.name} (${k.id})</option>`).join('');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const orig = window.showModule;
  if (typeof orig === 'function') {
    window.showModule = function(moduleId, navEl) {
      orig(moduleId, navEl);
      if (moduleId === 'karigar') setTimeout(initKarigarModule, 60);
    };
  }
});

// Populate karigar selects on modal open
function populateKgSelects() {
  const opts = '<option value="">-- Select Karigar --</option>' + KG.karigars.map(k=>`<option value="${k.id}">${k.name} (${k.id})</option>`).join('');
  ['gr-karigar-sel','si-karigar-sel','sr-karigar-sel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
  // Also populate karigar select in payment modal
  const payKgSel = document.querySelector('#kgPaymentModal select[onchange]');
  if (payKgSel && !payKgSel.options.length > 1) payKgSel.innerHTML = opts;

  // New Work Order karigar select
  const nwoSel = document.querySelector('#newWorkOrderModal select[onchange]');
  if (nwoSel) nwoSel.innerHTML = opts;

  // Issue gold karigar select
  const igSel = document.querySelector('#issueGoldModal select[onchange]');
  if (igSel) igSel.innerHTML = opts;

  // Pending payments table
  const tbody = document.getElementById('pending-pay-placeholder');
  if (tbody) {
    const pending = KG.karigars.filter(k=>k.pendingPayment>0);
    tbody.outerHTML = pending.map(k=>`<tr>
      <td><strong>${k.name}</strong></td><td>${k.skill}</td>
      <td class="text-danger fw-bold">${kgFmt(k.pendingPayment)}</td>
      <td>${kgFmt(k.totalEarned)}</td>
      <td><button class="btn btn-gold btn-xs" onclick="openKgPayment('${k.id}')">💳 Pay Now</button></td>
    </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:14px;color:var(--success)">✅ All payments cleared</td></tr>';
  }

  // overdue count sync
  const el2 = document.getElementById('kg-overdue-count2');
  if (el2) el2.textContent = KG.workOrders.filter(w=>w.status!=='Delivered'&&kgDaysLeft(w.dueDate)<0).length;
}

// Override initKarigarModule to also call populateKgSelects
const _origInit = window.initKarigarModule;
window.initKarigarModule = function() {
  if (_origInit) _origInit();
  setTimeout(populateKgSelects, 100);
};
