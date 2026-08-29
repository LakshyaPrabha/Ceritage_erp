/* ===================================================
   CERITAGE JEWELRY ERP — Employee Management
   6 Features: Profile · Attendance · Salary · Leave · Performance · Payroll
   =================================================== */
const EMP = {
  employees: [
    { id:'E001', name:'Ravi Sharma',    role:'Store Manager',    dept:'Management', phone:'9845672310', email:'ravi@ceritage.com',   dob:'1985-03-12', join:'2022-03-10', salary:55000, branch:'Mumbai HQ', status:'Active',   aadhaar:'1234 5678 9012', pan:'ABCRS1234F', bank:'SBI-4521890123', ifsc:'SBIN0001234', pf:true,  esi:false, photo:'RS', target:3500000 },
    { id:'E002', name:'Karan Mehta',    role:'Sales Executive',  dept:'Sales',      phone:'9834512670', email:'karan@ceritage.com',  dob:'1996-07-22', join:'2024-01-15', salary:35000, branch:'Mumbai HQ', status:'Active',   aadhaar:'2345 6789 0123', pan:'ABCKM5678G', bank:'HDFC-8832105672',ifsc:'HDFC0002345', pf:true,  esi:true,  photo:'KM', target:3500000 },
    { id:'E003', name:'Pooja Jain',     role:'Accountant',       dept:'Finance',    phone:'9712345698', email:'pooja@ceritage.com',  dob:'1993-11-05', join:'2023-06-01', salary:40000, branch:'Mumbai HQ', status:'Active',   aadhaar:'3456 7890 1234', pan:'ABCPJ9012H', bank:'ICICI-2214567890',ifsc:'ICIC0003456', pf:true,  esi:true,  photo:'PJ', target:0 },
    { id:'E004', name:'Deepika Singh',  role:'Cashier',          dept:'Finance',    phone:'9923456712', email:'deepika@ceritage.com',dob:'1998-04-18', join:'2025-02-20', salary:28000, branch:'Mumbai HQ', status:'Active',   aadhaar:'4567 8901 2345', pan:'ABCDS3456I', bank:'PNB-6671234567', ifsc:'PUNB0004567', pf:true,  esi:true,  photo:'DS', target:0 },
    { id:'E005', name:'Vikram Nair',    role:'Security',         dept:'Admin',      phone:'9701234568', email:'',                   dob:'1980-09-30', join:'2021-08-01', salary:18000, branch:'Mumbai HQ', status:'Active',   aadhaar:'5678 9012 3456', pan:'ABCVN7890J', bank:'SBI-9934561230', ifsc:'SBIN0005678', pf:false, esi:true,  photo:'VN', target:0 },
    { id:'E006', name:'Anita Sharma',   role:'Sales Executive',  dept:'Sales',      phone:'9654321078', email:'anita@ceritage.com',  dob:'1994-02-14', join:'2023-09-05', salary:32000, branch:'Delhi',     status:'Active',   aadhaar:'6789 0123 4567', pan:'ABCAS2345K', bank:'HDFC-4412345678',ifsc:'HDFC0006789', pf:true,  esi:true,  photo:'AS', target:2500000 },
    { id:'E007', name:'Rajesh Gupta',   role:'Inventory Manager',dept:'Operations', phone:'9512345670', email:'rajesh@ceritage.com', dob:'1990-06-25', join:'2022-11-10', salary:38000, branch:'Mumbai HQ', status:'On Leave', aadhaar:'7890 1234 5678', pan:'ABCRG6789L', bank:'BOB-1123456789', ifsc:'BARB0007890', pf:true,  esi:true,  photo:'RG', target:0 },
    { id:'E008', name:'Sunita Pillai',  role:'Store Manager',    dept:'Management', phone:'9834561230', email:'sunita@ceritage.com', dob:'1987-12-01', join:'2020-05-15', salary:52000, branch:'Jaipur',    status:'Active',   aadhaar:'8901 2345 6789', pan:'ABCSP0123M', bank:'SBI-7723456780', ifsc:'SBIN0008901', pf:true,  esi:false, photo:'SP', target:2000000 },
  ],

  // Attendance for Aug 2026
  attendance: {
    E001: { P:14, A:0, L:1, H:1, total:16 },
    E002: { P:15, A:0, L:0, H:1, total:16 },
    E003: { P:13, A:1, L:1, H:1, total:16 },
    E004: { P:14, A:1, L:0, H:1, total:16 },
    E005: { P:16, A:0, L:0, H:0, total:16 },
    E006: { P:12, A:2, L:1, H:1, total:16 },
    E007: { P:5,  A:0, L:11,H:0, total:16 },
    E008: { P:14, A:0, L:1, H:1, total:16 },
  },

  // Leave records
  leaves: [
    { id:'LV001', empId:'E003', empName:'Pooja Jain',     type:'Sick Leave',   from:'2026-08-12', to:'2026-08-12', days:1, reason:'Fever',           status:'Approved', approvedBy:'Ravi Sharma' },
    { id:'LV002', empId:'E007', empName:'Rajesh Gupta',   type:'Casual Leave', from:'2026-08-06', to:'2026-08-16', days:11,reason:'Personal work',    status:'Approved', approvedBy:'Ravi Sharma' },
    { id:'LV003', empId:'E006', empName:'Anita Sharma',   type:'Sick Leave',   from:'2026-08-14', to:'2026-08-15', days:2, reason:'Medical',          status:'Approved', approvedBy:'Delhi Manager' },
    { id:'LV004', empId:'E002', empName:'Karan Mehta',    type:'Casual Leave', from:'2026-08-20', to:'2026-08-20', days:1, reason:'Personal',         status:'Pending',  approvedBy:null },
    { id:'LV005', empId:'E004', empName:'Deepika Singh',  type:'Casual Leave', from:'2026-08-22', to:'2026-08-23', days:2, reason:'Family function',  status:'Pending',  approvedBy:null },
  ],

  // Performance ratings
  performance: {
    E001: { salesAchieved:3200000, target:3500000, rating:4.6, punctuality:95, customerScore:4.8, taskComp:92, review:'Excellent leadership. Manages branch operations effectively.' },
    E002: { salesAchieved:3180000, target:3500000, rating:4.5, punctuality:98, customerScore:4.7, taskComp:89, review:'Top sales performer. Builds strong customer relationships.' },
    E003: { salesAchieved:0,       target:0,       rating:4.3, punctuality:90, customerScore:0,   taskComp:88, review:'Accurate accounting. GST filings on time.' },
    E004: { salesAchieved:0,       target:0,       rating:4.0, punctuality:92, customerScore:4.2, taskComp:85, review:'Handles cash well. Needs improvement in speed.' },
    E005: { salesAchieved:0,       target:0,       rating:4.1, punctuality:99, customerScore:0,   taskComp:95, review:'Very reliable. Never absent.' },
    E006: { salesAchieved:1850000, target:2500000, rating:3.8, punctuality:85, customerScore:4.0, taskComp:78, review:'Performance below target. Needs coaching.' },
    E007: { salesAchieved:0,       target:0,       rating:4.2, punctuality:88, customerScore:0,   taskComp:82, review:'Good stock management. High leave count this month.' },
    E008: { salesAchieved:1920000, target:2000000, rating:4.7, punctuality:96, customerScore:4.8, taskComp:94, review:'Excellent branch manager. Near-target performance.' },
  },

  // Payroll Aug 2026
  payroll: {
    E001: { basic:55000, hra:13750, da:5500, ta:1000, pf:6600, esi:0,   tds:2000, advance:0,   gross:75250, deductions:8600,  net:66650,  status:'Paid',    paidOn:'2026-08-31' },
    E002: { basic:35000, hra:8750,  da:3500, ta:800,  pf:4200, esi:413, tds:0,    advance:5000, gross:48050, deductions:9613,  net:38437,  status:'Paid',    paidOn:'2026-08-31' },
    E003: { basic:40000, hra:10000, da:4000, ta:800,  pf:4800, esi:473, tds:500,  advance:0,    gross:54800, deductions:5773,  net:49027,  status:'Paid',    paidOn:'2026-08-31' },
    E004: { basic:28000, hra:7000,  da:2800, ta:500,  pf:3360, esi:330, tds:0,    advance:2000, gross:38300, deductions:5690,  net:32610,  status:'Pending', paidOn:null },
    E005: { basic:18000, hra:4500,  da:1800, ta:400,  pf:0,    esi:212, tds:0,    advance:0,    gross:24700, deductions:212,   net:24488,  status:'Paid',    paidOn:'2026-08-31' },
    E006: { basic:32000, hra:8000,  da:3200, ta:800,  pf:3840, esi:377, tds:0,    advance:0,    gross:44000, deductions:4217,  net:39783,  status:'Paid',    paidOn:'2026-08-31' },
    E007: { basic:38000, hra:9500,  da:3800, ta:800,  pf:4560, esi:448, tds:0,    advance:0,    gross:52100, deductions:5008,  net:47092,  status:'Pending', paidOn:null },
    E008: { basic:52000, hra:13000, da:5200, ta:1000, pf:6240, esi:0,   tds:1500, advance:0,    gross:71200, deductions:7740,  net:63460,  status:'Paid',    paidOn:'2026-08-31' },
  },
};

// ---- Utils ----
function empFmt(n)  { return '₹' + (n||0).toLocaleString('en-IN'); }
function empDate(d) { if(!d) return '—'; const dt=new Date(d); return isNaN(dt)?d:dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function empBadge(s){ const m={'Active':'badge-green','On Leave':'badge-orange','Inactive':'badge-red','Approved':'badge-green','Pending':'badge-orange','Rejected':'badge-red','Paid':'badge-green','Unpaid':'badge-red'}; return `<span class="badge ${m[s]||'badge-grey'}">${s}</span>`; }
function empStars(r){ let s=''; for(let i=0;i<5;i++) s+=i<Math.floor(r)?'★':'☆'; return `<span style="color:#f0c040">${s}</span> <span style="font-size:.75rem;color:var(--text-muted)">(${r})</span>`; }

// ---- 1. Employee Profiles ----
function renderEmployeeProfiles() {
  const tbody = document.getElementById('emp-profile-tbody');
  if (!tbody) return;
  // kpis
  document.getElementById('emp-kpi-total')   && (document.getElementById('emp-kpi-total').textContent   = EMP.employees.length);
  document.getElementById('emp-kpi-active')  && (document.getElementById('emp-kpi-active').textContent  = EMP.employees.filter(e=>e.status==='Active').length);
  document.getElementById('emp-kpi-payroll') && (document.getElementById('emp-kpi-payroll').textContent = empFmt(EMP.employees.reduce((s,e)=>s+e.salary,0)));
  document.getElementById('emp-kpi-leave')   && (document.getElementById('emp-kpi-leave').textContent   = EMP.employees.filter(e=>e.status==='On Leave').length);

  tbody.innerHTML = EMP.employees.map(e => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px">
        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-dark));display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:800;color:#fff;flex-shrink:0">${e.photo}</div>
        <div><div style="font-weight:700">${e.name}</div><div style="font-size:.72rem;color:var(--text-muted)">${e.id}</div></div>
      </div></td>
      <td>${e.role}</td>
      <td>${e.dept}</td>
      <td>${e.branch}</td>
      <td>${e.phone}</td>
      <td class="text-gold fw-bold">${empFmt(e.salary)}</td>
      <td>${empDate(e.join)}</td>
      <td>${empBadge(e.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="openEmpProfile('${e.id}')">👁</button>
        <button class="btn btn-gold btn-xs" onclick="openPayslip('${e.id}')">💰 Payslip</button>
        <button class="btn btn-outline btn-xs" onclick="openModal('markAttModal');document.getElementById('ma-name').textContent='${e.name}';document.getElementById('ma-id').value='${e.id}'">📋 Att</button>
      </td>
    </tr>`).join('');
}

function openEmpProfile(id) {
  const e = EMP.employees.find(x=>x.id===id);
  if (!e) return;
  openModal('empProfileModal');
  const set = (elId, val) => { const el=document.getElementById(elId); if(el) el.textContent=val||'—'; };
  set('epm-name',   e.name);  set('epm-id',    e.id);    set('epm-role',  e.role);
  set('epm-dept',   e.dept);  set('epm-branch',e.branch);set('epm-phone', e.phone);
  set('epm-email',  e.email); set('epm-dob',   empDate(e.dob)); set('epm-join',  empDate(e.join));
  set('epm-salary', empFmt(e.salary)); set('epm-aadhaar',e.aadhaar); set('epm-pan',e.pan);
  set('epm-bank',   e.bank + ' (' + e.ifsc + ')');
  set('epm-pf',     e.pf?'Enrolled':'Not Enrolled'); set('epm-esi',e.esi?'Enrolled':'Not Enrolled');
  document.getElementById('epm-status') && (document.getElementById('epm-status').innerHTML = empBadge(e.status));
  document.getElementById('epm-avatar') && (document.getElementById('epm-avatar').textContent = e.photo);
  const att  = EMP.attendance[id] || {};
  const perf = EMP.performance[id] || {};
  set('epm-att-p',   att.P||0);  set('epm-att-a',  att.A||0);
  set('epm-att-l',   att.L||0);  set('epm-att-pct', att.P ? Math.round(att.P/(att.P+att.A+att.L)*100)+'%' : '—');
  set('epm-rating',  perf.rating||'—');
  set('epm-sales',   perf.salesAchieved ? empFmt(perf.salesAchieved) : 'N/A');
  set('epm-target',  e.target ? empFmt(e.target) : 'N/A');
  document.getElementById('epm-stars') && (document.getElementById('epm-stars').innerHTML = empStars(perf.rating||0));
}

// ---- 2. Attendance ----
function renderAttendance() {
  const tbody = document.getElementById('emp-att-tbody');
  if (!tbody) return;
  tbody.innerHTML = EMP.employees.map(e => {
    const a   = EMP.attendance[e.id] || { P:0, A:0, L:0, H:0, total:26 };
    const pct = Math.round((a.P / (a.total||26)) * 100);
    return `<tr>
      <td><strong>${e.name}</strong><div style="font-size:.72rem;color:var(--text-muted)">${e.role}</div></td>
      <td class="text-success fw-bold">${a.P}</td>
      <td class="text-danger">${a.A}</td>
      <td class="text-gold">${a.L}</td>
      <td>${a.H||0}</td>
      <td>${a.total}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="progress" style="flex:1;height:6px"><div class="progress-bar ${pct>=90?'green':pct>=75?'':'red'}" style="width:${pct}%"></div></div>
          <span style="font-size:.72rem;font-weight:700">${pct}%</span>
        </div>
      </td>
      <td>${empBadge(e.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-gold btn-xs" onclick="openModal('markAttModal');document.getElementById('ma-name').textContent='${e.name}';document.getElementById('ma-id').value='${e.id}'">📋 Mark</button>
        <button class="btn btn-outline btn-xs" onclick="showToast('Attendance report for ${e.name}','info')">📊</button>
      </td>
    </tr>`;
  }).join('');
}

function saveAttendance() {
  const id     = document.getElementById('ma-id')?.value;
  const status = document.getElementById('ma-status')?.value;
  const e      = EMP.employees.find(x=>x.id===id);
  const a      = EMP.attendance[id] || { P:0, A:0, L:0, H:0, total:0 };
  if (status==='Present')  { a.P++; if(e) e.status='Active'; }
  if (status==='Absent')   { a.A++; }
  if (status==='Leave')    { a.L++; if(e) e.status='On Leave'; }
  if (status==='Holiday')  { a.H=(a.H||0)+1; }
  a.total++;
  EMP.attendance[id] = a;
  closeModal('markAttModal');
  renderAttendance(); renderEmployeeProfiles();
  showToast(e?.name + ' marked ' + status, 'success');
}

// ---- 3. Salary ----
function renderSalary() {
  const tbody = document.getElementById('emp-sal-tbody');
  if (!tbody) return;
  tbody.innerHTML = EMP.employees.map(e => {
    const p = EMP.payroll[e.id] || {};
    return `<tr>
      <td><strong>${e.name}</strong></td>
      <td>${e.role}</td>
      <td>${empFmt(e.salary)}</td>
      <td>${empFmt(p.hra||0)}</td>
      <td>${empFmt(p.da||0)}</td>
      <td>${empFmt(p.ta||0)}</td>
      <td>${empFmt(p.gross||e.salary)}</td>
      <td class="text-danger">${empFmt((p.pf||0)+(p.esi||0)+(p.tds||0)+(p.advance||0))}</td>
      <td class="text-gold fw-bold">${empFmt(p.net||e.salary)}</td>
      <td>${empBadge(p.status||'Pending')}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-gold btn-xs" onclick="openPayslip('${e.id}')">📄 Payslip</button>
        ${p.status!=='Paid'?`<button class="btn btn-outline btn-xs" onclick="paySalary('${e.id}')">💳 Pay</button>`:''}
      </td>
    </tr>`;
  }).join('');
}

function paySalary(id) {
  const p = EMP.payroll[id];
  const e = EMP.employees.find(x=>x.id===id);
  if (!p||!e) return;
  p.status  = 'Paid';
  p.paidOn  = new Date().toISOString().slice(0,10);
  renderSalary(); renderPayroll();
  showToast('Salary paid to ' + e.name + ': ' + empFmt(p.net), 'success');
}

function openPayslip(id) {
  const e = EMP.employees.find(x=>x.id===id);
  const p = EMP.payroll[id] || {};
  if (!e) return;
  openModal('payslipModal');
  document.getElementById('ps-name').textContent    = e.name;
  document.getElementById('ps-id').textContent      = e.id;
  document.getElementById('ps-role').textContent    = e.role + ' · ' + e.dept;
  document.getElementById('ps-branch').textContent  = e.branch;
  document.getElementById('ps-pan').textContent     = e.pan;
  document.getElementById('ps-bank').textContent    = e.bank;
  document.getElementById('ps-period').textContent  = 'August 2026';
  document.getElementById('ps-basic').textContent   = empFmt(p.basic||e.salary);
  document.getElementById('ps-hra').textContent     = empFmt(p.hra||0);
  document.getElementById('ps-da').textContent      = empFmt(p.da||0);
  document.getElementById('ps-ta').textContent      = empFmt(p.ta||0);
  document.getElementById('ps-gross').textContent   = empFmt(p.gross||e.salary);
  document.getElementById('ps-pf').textContent      = empFmt(p.pf||0);
  document.getElementById('ps-esi').textContent     = empFmt(p.esi||0);
  document.getElementById('ps-tds').textContent     = empFmt(p.tds||0);
  document.getElementById('ps-advance').textContent = empFmt(p.advance||0);
  document.getElementById('ps-total-ded').textContent = empFmt((p.pf||0)+(p.esi||0)+(p.tds||0)+(p.advance||0));
  document.getElementById('ps-net').textContent     = empFmt(p.net||e.salary);
  document.getElementById('ps-status').innerHTML    = empBadge(p.status||'Pending');
  document.getElementById('ps-paid').textContent    = p.paidOn ? empDate(p.paidOn) : 'Not yet paid';
  document.getElementById('ps-avatar').textContent  = e.photo;
}

// ---- 4. Leave Management ----
function renderLeaves() {
  const tbody = document.getElementById('emp-leave-tbody');
  if (!tbody) return;
  tbody.innerHTML = EMP.leaves.map(l => `
    <tr>
      <td><span class="badge badge-grey" style="font-size:.7rem">${l.id}</span></td>
      <td><strong>${l.empName}</strong></td>
      <td><span class="badge badge-blue" style="font-size:.72rem">${l.type}</span></td>
      <td>${empDate(l.from)}</td>
      <td>${empDate(l.to)}</td>
      <td class="fw-bold">${l.days} day${l.days>1?'s':''}</td>
      <td style="font-size:.8rem;color:var(--text-muted)">${l.reason}</td>
      <td>${empBadge(l.status)}</td>
      <td style="font-size:.78rem">${l.approvedBy||'—'}</td>
      <td style="white-space:nowrap">
        ${l.status==='Pending'?`
          <button class="btn btn-gold btn-xs" onclick="approveLeave('${l.id}',true)">✅ Approve</button>
          <button class="btn btn-outline btn-xs" onclick="approveLeave('${l.id}',false)">❌ Reject</button>`:''}
      </td>
    </tr>`).join('');
}

function approveLeave(id, approve) {
  const l = EMP.leaves.find(x=>x.id===id);
  if (!l) return;
  l.status     = approve ? 'Approved' : 'Rejected';
  l.approvedBy = 'Ravi Sharma';
  if (approve) {
    const e = EMP.employees.find(x=>x.id===l.empId);
    if (e) e.status = 'On Leave';
  }
  renderLeaves(); renderEmployeeProfiles();
  showToast('Leave ' + (approve?'approved':'rejected') + ' for ' + l.empName, approve?'success':'info');
}

function saveLeaveRequest() {
  const empId  = document.getElementById('lr-emp')?.value;
  const type   = document.getElementById('lr-type')?.value;
  const from   = document.getElementById('lr-from')?.value;
  const to     = document.getElementById('lr-to')?.value;
  const reason = document.getElementById('lr-reason')?.value?.trim();
  if (!empId||!from||!to||!reason) { showToast('Fill all fields','error'); return; }
  const e    = EMP.employees.find(x=>x.id===empId);
  const days = Math.ceil((new Date(to)-new Date(from))/86400000)+1;
  EMP.leaves.unshift({ id:'LV'+Date.now(), empId, empName:e?.name||'', type, from, to, days, reason, status:'Pending', approvedBy:null });
  closeModal('leaveRequestModal');
  renderLeaves();
  showToast('Leave request submitted for ' + (e?.name||empId), 'success');
}

// ---- 5. Performance ----
function renderPerformance() {
  const grid = document.getElementById('emp-perf-grid');
  if (!grid) return;
  const sorted = [...EMP.employees].sort((a,b)=>(EMP.performance[b.id]?.rating||0)-(EMP.performance[a.id]?.rating||0));
  grid.innerHTML = sorted.map((e,i) => {
    const p     = EMP.performance[e.id] || {};
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
    const tgtPct= e.target>0 ? Math.min(100,Math.round(p.salesAchieved/e.target*100)) : null;
    return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-dark));display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;flex-shrink:0">${e.photo}</div>
        <div style="flex:1">
          <div style="font-weight:800">${medal} ${e.name}</div>
          <div style="font-size:.73rem;color:var(--text-muted)">${e.role} · ${e.branch}</div>
          <div>${empStars(p.rating||0)}</div>
        </div>
        ${empBadge(e.status)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:1rem;font-weight:800;color:var(--success)">${p.punctuality||0}%</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Punctuality</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:1rem;font-weight:800;color:var(--info)">${p.taskComp||0}%</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Task Completion</div>
        </div>
        ${p.customerScore ? `<div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:1rem;font-weight:800;color:var(--accent)">${p.customerScore}</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Customer Score</div>
        </div>` : ''}
        ${tgtPct!==null ? `<div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:1rem;font-weight:800;color:${tgtPct>=90?'var(--success)':tgtPct>=70?'var(--warning)':'var(--danger)'}">${tgtPct}%</div>
          <div style="font-size:.68rem;color:var(--text-muted)">Sales Target</div>
        </div>` : ''}
      </div>
      ${tgtPct!==null?`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:4px"><span>Sales: ${empFmt(p.salesAchieved)}</span><span>Target: ${empFmt(e.target)}</span></div><div class="progress" style="height:6px"><div class="progress-bar ${tgtPct>=90?'green':tgtPct>=70?'':'red'}" style="width:${tgtPct}%"></div></div></div>`:''}
      <div style="font-size:.78rem;color:var(--text-muted);font-style:italic;border-top:1px solid var(--border-light);padding-top:8px">${p.review||'—'}</div>
    </div>`;
  }).join('');
}

// ---- 6. Payroll ----
function renderPayroll() {
  const tbody = document.getElementById('emp-payroll-tbody');
  if (!tbody) return;
  const totalNet   = Object.values(EMP.payroll).reduce((s,p)=>s+(p.net||0),0);
  const totalPaid  = Object.values(EMP.payroll).filter(p=>p.status==='Paid').reduce((s,p)=>s+(p.net||0),0);
  const totalPend  = totalNet - totalPaid;
  document.getElementById('pr-kpi-total') && (document.getElementById('pr-kpi-total').textContent = empFmt(totalNet));
  document.getElementById('pr-kpi-paid')  && (document.getElementById('pr-kpi-paid').textContent  = empFmt(totalPaid));
  document.getElementById('pr-kpi-pend')  && (document.getElementById('pr-kpi-pend').textContent  = empFmt(totalPend));

  tbody.innerHTML = EMP.employees.map(e => {
    const p = EMP.payroll[e.id] || {};
    return `<tr>
      <td><strong>${e.name}</strong></td><td>${e.role}</td><td>${e.branch}</td>
      <td>${empFmt(p.basic||e.salary)}</td>
      <td>${empFmt((p.hra||0)+(p.da||0)+(p.ta||0))}</td>
      <td>${empFmt(p.gross||e.salary)}</td>
      <td class="text-danger">${empFmt((p.pf||0)+(p.esi||0)+(p.tds||0)+(p.advance||0))}</td>
      <td class="text-gold fw-bold">${empFmt(p.net||e.salary)}</td>
      <td>${empBadge(p.status||'Pending')}</td>
      <td>${p.paidOn?empDate(p.paidOn):'—'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="openPayslip('${e.id}')">📄 Slip</button>
        ${p.status!=='Paid'?`<button class="btn btn-gold btn-xs" onclick="paySalary('${e.id}')">💳 Pay</button>`:''}
      </td>
    </tr>`;
  }).join('');
}

function runPayroll() {
  EMP.employees.forEach(e => {
    const p = EMP.payroll[e.id];
    if (p && p.status !== 'Paid') { p.status='Paid'; p.paidOn=new Date().toISOString().slice(0,10); }
  });
  renderPayroll(); renderSalary();
  showToast('Payroll processed for all employees!', 'success');
}

function initEmployeeModule() {
  renderEmployeeProfiles();
  renderAttendance();
  renderSalary();
  renderLeaves();
  renderPerformance();
  renderPayroll();
  // populate leave emp select
  const lrSel = document.getElementById('lr-emp');
  if (lrSel) lrSel.innerHTML = '<option value="">-- Select --</option>' + EMP.employees.map(e=>`<option value="${e.id}">${e.name} (${e.role})</option>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const orig = window.showModule;
  if (typeof orig === 'function') {
    window.showModule = function(m, n) { orig(m,n); if(m==='employees') setTimeout(initEmployeeModule,60); };
  }
});

// Populate selects in modals
function populateEmpSelects() {
  const opts = '<option value="">-- Select --</option>' + EMP.employees.map(e=>`<option value="${e.id}">${e.name} (${e.role})</option>`).join('');
  // attendance modal
  const maEl = document.querySelector('#markAttModal select[onchange]');
  if (maEl) maEl.innerHTML = opts;
  // payment modal karigar sel
  const kgEl = document.querySelector('#kgPaymentModal select[onchange]');
  if (kgEl) kgEl.innerHTML = opts;
  // leave request emp select
  const lrEl = document.getElementById('lr-emp');
  if (lrEl) lrEl.innerHTML = opts;
}

// Supplier select in PO and payment modals
function populateSupSelects() {
  if (!window.SUP) return;
  const opts = '<option value="">-- Select --</option>' + SUP.suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  document.querySelectorAll('#supPaymentModal select[onchange], #sup-purchases select').forEach(el => { if(el) el.innerHTML = opts; });
  // ledger select
  const sl = document.getElementById('sup-ledger-sel');
  if (sl) sl.innerHTML = '<option value="">-- Select Supplier --</option>' + SUP.suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
}

const _empOrigInit = window.initEmployeeModule;
window.initEmployeeModule = function() {
  if (_empOrigInit) _empOrigInit();
  setTimeout(() => { populateEmpSelects(); populateSupSelects(); }, 120);
};
