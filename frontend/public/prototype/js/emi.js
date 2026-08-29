/* ===================================================
   CERITAGE JEWELRY ERP — EMI & Credit Management
   6 Features: Credit Sales · EMI Plans · Installment Schedule
                Due Reminder · Payment Tracking · Outstanding Report
   =================================================== */

const EMID = {
  // ---- EMI PLANS ----
  plans: [
    { id:'EMI001', custId:'C003', custName:'Sunita Verma',   phone:'9934521870', inv:'INV-2026-8839', item:'Kundan Bridal Set',    total:261002, downPay:21750, financed:239252, emiAmt:21750,  months:12, paid:9,  interest:0,  startDate:'2025-11-16', nextDue:'2026-08-16', status:'Due Today',  finance:'In-House' },
    { id:'EMI002', custId:'C004', custName:'Amit Kumar',     phone:'9712345678', inv:'INV-2026-8810', item:'Diamond Ring 18K',     total:120000, downPay:20000, financed:100000, emiAmt:10000,  months:12, paid:5,  interest:0,  startDate:'2026-03-20', nextDue:'2026-08-20', status:'On Track',   finance:'In-House' },
    { id:'EMI003', custId:'C007', custName:'Deepa Nair',     phone:'9701234560', inv:'INV-2026-8796', item:'Gold Bangles 22K',     total:253400, downPay:50000, financed:203400, emiAmt:21100,  months:12, paid:2,  interest:0,  startDate:'2026-06-10', nextDue:'2026-08-10', status:'Overdue',    finance:'In-House' },
    { id:'EMI004', custId:'C001', custName:'Priya Sharma',   phone:'9876543210', inv:'INV-2026-8780', item:'Platinum Ring Set',    total:180000, downPay:60000, financed:120000, emiAmt:13333,  months:9,  paid:9,  interest:0,  startDate:'2025-12-01', nextDue:'—',          status:'Closed',     finance:'Bajaj Finserv' },
    { id:'EMI005', custId:'C002', custName:'Rajesh Patel',   phone:'9856231470', inv:'INV-2026-8820', item:'Necklace Set 22K',     total:95400,  downPay:25000, financed:70400,  emiAmt:7822,   months:9,  paid:3,  interest:12, startDate:'2026-05-22', nextDue:'2026-08-22', status:'On Track',   finance:'HDFC Bank' },
    { id:'EMI006', custId:'C008', custName:'Sanjay Gupta',   phone:'9988776655', inv:'INV-2026-8838', item:'Diamond Solitaire 2ct',total:1250000,downPay:250000,financed:1000000,emiAmt:83333,  months:12, paid:0,  interest:0,  startDate:'2026-08-14', nextDue:'2026-09-14', status:'Active',     finance:'In-House' },
  ],
  // ---- CREDIT SALES ----
  creditSales: [
    { id:'CR001', custId:'C006', custName:'Vikram Malhotra', inv:'INV-2026-8838', date:'2026-08-14', item:'Solitaire Ring 2ct', amount:1250000, paid:0,      balance:1250000, creditDays:30, dueDate:'2026-09-13', status:'Active'  },
    { id:'CR002', custId:'C003', custName:'Sunita Verma',    inv:'INV-2026-8839', date:'2026-08-15', item:'Kundan Bridal Set',  amount:261002,  paid:195918, balance:65084,   creditDays:60, dueDate:'2026-10-14', status:'Partial' },
    { id:'CR003', custId:'C007', custName:'Deepa Nair',      inv:'INV-2026-8796', date:'2026-06-10', item:'Gold Bangles 22K',   amount:253400,  paid:50000,  balance:203400,  creditDays:90, dueDate:'2026-09-08', status:'Overdue' },
    { id:'CR004', custId:'C004', custName:'Amit Kumar',      inv:'INV-2026-8810', date:'2026-03-20', item:'Diamond Ring 18K',   amount:120000,  paid:70000,  balance:50000,   creditDays:45, dueDate:'2026-05-04', status:'Overdue' },
    { id:'CR005', custId:'C001', custName:'Priya Sharma',    inv:'INV-2026-8741', date:'2026-06-05', item:'Gold Bangle Single',  amount:126700,  paid:126700, balance:0,       creditDays:30, dueDate:'2026-07-05', status:'Cleared' },
  ],
  // ---- PAYMENT TRACKING ----
  payments: [
    { id:'EP001', planId:'EMI001', custName:'Sunita Verma',  date:'2026-07-16', amount:21750, mode:'UPI',  ref:'GPay-9012345678', installment:9,  status:'Paid' },
    { id:'EP002', planId:'EMI001', custName:'Sunita Verma',  date:'2026-06-16', amount:21750, mode:'Cash', ref:'CASH-021',         installment:8,  status:'Paid' },
    { id:'EP003', planId:'EMI001', custName:'Sunita Verma',  date:'2026-05-16', amount:21750, mode:'UPI',  ref:'GPay-8901234567', installment:7,  status:'Paid' },
    { id:'EP004', planId:'EMI002', custName:'Amit Kumar',    date:'2026-07-20', amount:10000, mode:'UPI',  ref:'PhPe-7890123456', installment:5,  status:'Paid' },
    { id:'EP005', planId:'EMI002', custName:'Amit Kumar',    date:'2026-06-20', amount:10000, mode:'Cash', ref:'CASH-019',         installment:4,  status:'Paid' },
    { id:'EP006', planId:'EMI005', custName:'Rajesh Patel',  date:'2026-07-22', amount:7822,  mode:'NEFT', ref:'UTR-6780123456',  installment:3,  status:'Paid' },
    { id:'EP007', planId:'EMI005', custName:'Rajesh Patel',  date:'2026-06-22', amount:7822,  mode:'UPI',  ref:'GPay-5670123456', installment:2,  status:'Paid' },
    { id:'EP008', planId:'EMI003', custName:'Deepa Nair',    date:'2026-07-10', amount:21100, mode:'Cash', ref:'CASH-022',         installment:2,  status:'Paid' },
    { id:'EP009', planId:'EMI003', custName:'Deepa Nair',    date:'2026-06-10', amount:21100, mode:'UPI',  ref:'GPay-4560123456', installment:1,  status:'Paid' },
  ],
};

// ---- UTILS ----
function emFmt(n) { return '₹'+(n||0).toLocaleString('en-IN'); }
function emDate(d){ if(!d||d==='—') return '—'; const dt=new Date(d); return isNaN(dt)?d:dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function daysLeft(d){ if(!d||d==='—') return null; const diff=Math.ceil((new Date(d)-new Date())/86400000); return diff; }
function emBadge(s){ const m={'Active':'badge-blue','On Track':'badge-green','Due Today':'badge-orange','Overdue':'badge-red','Closed':'badge-grey','Cleared':'badge-green','Partial':'badge-orange'}; return `<span class="badge ${m[s]||'badge-grey'}">${s}</span>`; }

// ---- 1. CREDIT SALES ----
function renderCreditSales() {
  const tbody=document.getElementById('emi-credit-tbody'); if(!tbody) return;
  const totBal=EMID.creditSales.filter(c=>c.status!=='Cleared').reduce((s,c)=>s+c.balance,0);
  const totOver=EMID.creditSales.filter(c=>c.status==='Overdue').reduce((s,c)=>s+c.balance,0);
  ['em-cr-total','em-cr-active','em-cr-overdue','em-cr-cleared'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=[EMID.creditSales.length, EMID.creditSales.filter(c=>c.status!=='Cleared').length, emFmt(totOver), EMID.creditSales.filter(c=>c.status==='Cleared').length][i];
  });
  tbody.innerHTML = EMID.creditSales.map(c=>{
    const dl=daysLeft(c.dueDate);
    const dlStr=dl===null?'—':dl<0?`<span style="color:var(--danger);font-weight:700">${Math.abs(dl)}d overdue</span>`:dl===0?'<span style="color:var(--warning);font-weight:700">Due Today</span>':`${dl} days`;
    const pct=Math.round(c.paid/c.amount*100);
    return `<tr>
      <td><span class="badge badge-grey" style="font-size:.7rem">${c.id}</span></td>
      <td><strong>${c.custName}</strong></td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${c.inv}</span></td>
      <td style="font-size:.82rem">${c.item}</td>
      <td>${emDate(c.date)}</td>
      <td class="text-gold fw-bold">${emFmt(c.amount)}</td>
      <td class="text-success">${emFmt(c.paid)}</td>
      <td class="${c.balance>0?'text-danger fw-bold':''}">${c.balance?emFmt(c.balance):'—'}</td>
      <td>${c.creditDays}d</td>
      <td>${emDate(c.dueDate)}</td>
      <td>${dlStr}</td>
      <td>${emBadge(c.status)}</td>
      <td style="white-space:nowrap">
        ${c.status!=='Cleared'?`<button class="btn btn-gold btn-xs" onclick="collectCreditPayment('${c.id}')">💳 Collect</button>`:''}
        <button class="btn btn-outline btn-xs" onclick="sendEmiDueReminder('${c.custName}','${c.custId}','${emFmt(c.balance)}')">📱</button>
      </td>
    </tr>`;
  }).join('');
}

// ---- 2. EMI PLANS ----
function renderEmiPlans() {
  const tbody=document.getElementById('emi-plans-tbody'); if(!tbody) return;
  const totOut=EMID.plans.filter(p=>p.status!=='Closed').reduce((s,p)=>s+p.emiAmt*(p.months-p.paid),0);
  const overdue=EMID.plans.filter(p=>p.status==='Overdue').length;
  ['em-plan-active','em-plan-total','em-plan-due','em-plan-overdue'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=[EMID.plans.filter(p=>p.status!=='Closed').length, emFmt(totOut), EMID.plans.filter(p=>p.status==='Due Today').length, overdue][i];
  });
  tbody.innerHTML = EMID.plans.map(p=>{
    const remaining=p.emiAmt*(p.months-p.paid);
    const pct=Math.round(p.paid/p.months*100);
    const dl=daysLeft(p.nextDue);
    const dlStyle=dl!==null&&dl<0?'color:var(--danger);font-weight:700':dl===0?'color:var(--warning);font-weight:700':'';
    return `<tr>
      <td><span class="badge badge-blue" style="font-size:.7rem">${p.id}</span></td>
      <td><strong>${p.custName}</strong><div style="font-size:.72rem;color:var(--text-muted)">${p.phone}</div></td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${p.inv}</span></td>
      <td style="font-size:.82rem;max-width:160px">${p.item}</td>
      <td>${emFmt(p.total)}</td>
      <td>${emFmt(p.downPay)}</td>
      <td class="text-gold fw-bold">${emFmt(p.emiAmt)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="progress" style="flex:1;height:5px"><div class="progress-bar ${pct>=80?'green':''}" style="width:${pct}%"></div></div>
          <span style="font-size:.72rem;font-weight:700">${p.paid}/${p.months}</span>
        </div>
      </td>
      <td class="${remaining>0?'text-danger fw-bold':''}">${remaining?emFmt(remaining):'—'}</td>
      <td style="${dlStyle}">${emDate(p.nextDue)}</td>
      <td>${p.interest?p.interest+'%':'0%'}</td>
      <td>${p.finance}</td>
      <td>${emBadge(p.status)}</td>
      <td style="white-space:nowrap">
        ${p.status!=='Closed'?`<button class="btn btn-gold btn-xs" onclick="collectEmiInstalment('${p.id}')">💳 Pay</button>`:''}
        <button class="btn btn-outline btn-xs" onclick="viewSchedule('${p.id}')">📋 Schedule</button>
        <button class="btn btn-outline btn-xs" onclick="sendEmiDueReminder('${p.custName}','${p.custId}','${emFmt(p.emiAmt)}')">📱</button>
      </td>
    </tr>`;
  }).join('');
}

// ---- 3. INSTALLMENT SCHEDULE ----
function viewSchedule(planId) {
  const p=EMID.plans.find(x=>x.id===planId); if(!p) return;
  openModal('scheduleModal');
  document.getElementById('sch-plan-id').textContent=planId;
  document.getElementById('sch-cust').textContent=p.custName;
  document.getElementById('sch-item').textContent=p.item;
  document.getElementById('sch-total').textContent=emFmt(p.total);
  document.getElementById('sch-emi').textContent=emFmt(p.emiAmt)+' × '+p.months+' months';
  document.getElementById('sch-finance').textContent=p.finance;
  const tbody=document.getElementById('sch-tbody'); if(!tbody) return;
  const start=new Date(p.startDate);
  tbody.innerHTML = Array.from({length:p.months},(_,i)=>{
    const d=new Date(start); d.setMonth(d.getMonth()+i);
    const paid=i<p.paid;
    const due=i===p.paid&&p.status!=='Closed';
    const pymt=EMID.payments.find(x=>x.planId===planId&&x.installment===i+1);
    return `<tr style="background:${paid?'rgba(46,204,113,.04)':due?'rgba(243,156,18,.05)':''}">
      <td class="fw-bold">${i+1}</td>
      <td>${d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
      <td class="text-gold fw-bold">${emFmt(p.emiAmt)}</td>
      <td>${paid?emFmt(p.emiAmt):due?'<span style="color:var(--warning)">Upcoming</span>':'—'}</td>
      <td>${pymt?emDate(pymt.date):'—'}</td>
      <td>${pymt?`<span class="badge badge-blue" style="font-size:.68rem">${pymt.mode}</span>`:'—'}</td>
      <td>${pymt?`<code style="font-size:.7rem">${pymt.ref}</code>`:'—'}</td>
      <td>${paid?'<span class="badge badge-green">✅ Paid</span>':due?`<button class="btn btn-gold btn-xs" onclick="collectEmiInstalment('${planId}')">💳 Pay</button>`:'<span class="badge badge-grey">Upcoming</span>'}</td>
    </tr>`;
  }).join('');
}

// ---- 4. DUE REMINDERS ----
function renderDueReminders() {
  const tbody=document.getElementById('emi-due-tbody'); if(!tbody) return;
  const today=new Date(); today.setHours(0,0,0,0);
  const dueList=[
    ...EMID.plans.filter(p=>p.status!=='Closed').map(p=>({
      id:p.id, name:p.custName, phone:p.phone, type:'EMI', amount:p.emiAmt, dueDate:p.nextDue, status:p.status, ref:p.inv
    })),
    ...EMID.creditSales.filter(c=>c.status!=='Cleared').map(c=>({
      id:c.id, name:c.custName, phone:c.phone, type:'Credit', amount:c.balance, dueDate:c.dueDate, status:c.status, ref:c.inv
    })),
  ].sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));

  tbody.innerHTML = dueList.map(d=>{
    const dl=daysLeft(d.dueDate);
    const urg=dl!==null&&dl<0?'red':dl===0?'orange':dl<=7?'gold':'grey';
    const dlLabel=dl===null?'—':dl<0?Math.abs(dl)+'d overdue':dl===0?'TODAY':dl+'d left';
    return `<tr>
      <td><span class="badge badge-${d.type==='EMI'?'blue':'orange'}" style="font-size:.7rem">${d.type}</span></td>
      <td><strong>${d.name}</strong><div style="font-size:.72rem;color:var(--text-muted)">${d.phone}</div></td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${d.ref}</span></td>
      <td class="text-gold fw-bold">${emFmt(d.amount)}</td>
      <td>${emDate(d.dueDate)}</td>
      <td><span class="badge badge-${urg}" style="font-weight:700">${dlLabel}</span></td>
      <td>${emBadge(d.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-gold btn-xs" onclick="collectEmiInstalment('${d.id}')">💳 Collect</button>
        <button class="btn btn-outline btn-xs" onclick="sendEmiDueReminder('${d.name}','',emFmt(d.amount))">📱 WhatsApp</button>
        <button class="btn btn-outline btn-xs" onclick="sendEmiDueReminder('${d.name}','','SMS')">💬 SMS</button>
      </td>
    </tr>`;
  }).join('');
}

function sendEmiDueReminder(name, custId, amount) {
  showToast(`📱 Reminder sent to ${name} — Due: ${amount}`, 'success');
}

function sendBulkDueReminders() {
  const dueCount=EMID.plans.filter(p=>p.status==='Due Today'||p.status==='Overdue').length +
                 EMID.creditSales.filter(c=>c.status==='Overdue').length;
  showToast(`📱 Bulk reminders sent to ${dueCount} customers`, 'success');
}

// ---- 5. PAYMENT TRACKING ----
function renderPaymentTracking() {
  const tbody=document.getElementById('emi-payments-tbody'); if(!tbody) return;
  tbody.innerHTML = EMID.payments.map(p=>`
    <tr>
      <td><span class="badge badge-green" style="font-size:.7rem">${p.id}</span></td>
      <td><span class="badge badge-blue" style="font-size:.7rem">${p.planId}</span></td>
      <td><strong>${p.custName}</strong></td>
      <td>${emDate(p.date)}</td>
      <td class="text-success fw-bold">${emFmt(p.amount)}</td>
      <td><span class="badge badge-${p.mode==='Cash'?'grey':p.mode==='UPI'?'green':'blue'}" style="font-size:.72rem">${p.mode}</span></td>
      <td style="font-family:monospace;font-size:.75rem;color:var(--text-muted)">${p.ref}</td>
      <td class="fw-bold">${p.installment}</td>
      <td><span class="badge badge-green">✅ ${p.status}</span></td>
      <td><button class="btn btn-outline btn-xs" onclick="showToast('Receipt printed','success')">🖨️</button></td>
    </tr>`).join('');
}

function collectEmiInstalment(planId) {
  const p=EMID.plans.find(x=>x.id===planId);
  const c=EMID.creditSales.find(x=>x.id===planId);
  const item=p||c; if(!item) return;
  openModal('collectEmiModal');
  document.getElementById('cem-plan-id').value=planId;
  document.getElementById('cem-name').textContent=item.custName||item.custName;
  document.getElementById('cem-amt').value=p?p.emiAmt:c.balance;
  document.getElementById('cem-balance').textContent=p?emFmt(p.emiAmt*(p.months-p.paid)):emFmt(c.balance);
}

function saveEmiCollection() {
  const planId=document.getElementById('cem-plan-id')?.value;
  const amount=parseFloat(document.getElementById('cem-amt')?.value)||0;
  const mode=document.getElementById('cem-mode')?.value;
  const ref=document.getElementById('cem-ref')?.value?.trim()||'RCP-'+Date.now().toString().slice(-6);
  if (!planId||amount<=0) { showToast('Enter valid amount','error'); return; }
  const p=EMID.plans.find(x=>x.id===planId);
  const c=EMID.creditSales.find(x=>x.id===planId);
  if(p){ p.paid++; if(p.paid>=p.months){ p.status='Closed'; p.nextDue='—'; } else { const nd=new Date(p.nextDue); nd.setMonth(nd.getMonth()+1); p.nextDue=nd.toISOString().slice(0,10); p.status='On Track'; } }
  if(c){ c.paid+=amount; c.balance=Math.max(0,c.balance-amount); c.status=c.balance<=0?'Cleared':'Partial'; }
  EMID.payments.unshift({ id:'EP'+Date.now().toString().slice(-4), planId, custName:(p||c).custName, date:new Date().toISOString().slice(0,10), amount, mode, ref, installment:p?p.paid:0, status:'Paid' });
  closeModal('collectEmiModal');
  renderEmiPlans(); renderCreditSales(); renderDueReminders(); renderPaymentTracking(); renderOutstanding();
  showToast(`${emFmt(amount)} collected from ${(p||c).custName}!`,'success');
}

function collectCreditPayment(id) { collectEmiInstalment(id); }

// ---- 6. OUTSTANDING REPORT ----
function renderOutstanding() {
  const el=document.getElementById('emi-outstanding-content'); if(!el) return;
  const emiOut=EMID.plans.filter(p=>p.status!=='Closed').reduce((s,p)=>s+p.emiAmt*(p.months-p.paid),0);
  const creditOut=EMID.creditSales.filter(c=>c.status!=='Cleared').reduce((s,c)=>s+c.balance,0);
  const totOut=emiOut+creditOut;
  const overduePlans=EMID.plans.filter(p=>p.status==='Overdue');
  const overdueCredits=EMID.creditSales.filter(c=>c.status==='Overdue');
  const totOverdue=overduePlans.reduce((s,p)=>s+p.emiAmt*(p.months-p.paid),0)+overdueCredits.reduce((s,c)=>s+c.balance,0);
  el.innerHTML=`
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
      <div class="stat-card"><div class="stat-icon gold">💰</div><div class="stat-value">${emFmt(totOut)}</div><div class="stat-label">Total Outstanding</div></div>
      <div class="stat-card blue"><div class="stat-icon blue">🗓️</div><div class="stat-value">${emFmt(emiOut)}</div><div class="stat-label">EMI Outstanding</div></div>
      <div class="stat-card orange"><div class="stat-icon" style="background:rgba(243,156,18,.15);color:var(--warning)">📒</div><div class="stat-value">${emFmt(creditOut)}</div><div class="stat-label">Credit Outstanding</div></div>
      <div class="stat-card red"><div class="stat-icon red">⚠️</div><div class="stat-value">${emFmt(totOverdue)}</div><div class="stat-label">Overdue Amount</div></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">🗓️ EMI Outstanding by Customer</div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Plan</th><th>EMI/Month</th><th>Remaining</th><th>Status</th></tr></thead>
            <tbody>
              ${EMID.plans.filter(p=>p.status!=='Closed').map(p=>`
              <tr><td><strong>${p.custName}</strong></td>
              <td><span class="badge badge-blue" style="font-size:.68rem">${p.id}</span></td>
              <td>${emFmt(p.emiAmt)}</td>
              <td class="${p.status==='Overdue'?'text-danger':''} fw-bold">${emFmt(p.emiAmt*(p.months-p.paid))}</td>
              <td>${emBadge(p.status)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">📒 Credit Outstanding by Customer</div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Invoice</th><th>Balance</th><th>Due Date</th><th>Status</th></tr></thead>
            <tbody>
              ${EMID.creditSales.filter(c=>c.status!=='Cleared').map(c=>`
              <tr><td><strong>${c.custName}</strong></td>
              <td><span class="badge badge-grey" style="font-size:.68rem">${c.inv}</span></td>
              <td class="${c.status==='Overdue'?'text-danger':''} fw-bold">${emFmt(c.balance)}</td>
              <td>${emDate(c.dueDate)}</td>
              <td>${emBadge(c.status)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

// ---- CALC EMI ----
function calcEmiPreview() {
  const total=parseFloat(document.getElementById('new-emi-total')?.value)||0;
  const down=parseFloat(document.getElementById('new-emi-down')?.value)||0;
  const months=parseInt(document.getElementById('new-emi-months')?.value)||12;
  const int=parseFloat(document.getElementById('new-emi-int')?.value)||0;
  const financed=total-down;
  let emi;
  if(int===0){ emi=financed/months; }
  else { const r=int/100/12; emi=financed*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1); }
  const el=document.getElementById('new-emi-preview'); if(!el) return;
  el.innerHTML=`<div style="background:var(--primary-glow);border:1px solid var(--border);border-radius:8px;padding:12px;margin-top:10px">
    <div style="display:flex;justify-content:space-between;font-size:.83rem;margin-bottom:6px"><span>Financed Amount</span><span class="fw-bold">${emFmt(financed)}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:.83rem;margin-bottom:6px"><span>Monthly EMI</span><span class="fw-bold text-gold" style="font-size:1rem">${emFmt(Math.round(emi))}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:.83rem;margin-bottom:6px"><span>Total Payable</span><span class="fw-bold">${emFmt(Math.round(emi*months))}</span></div>
    ${int?`<div style="display:flex;justify-content:space-between;font-size:.83rem"><span>Total Interest</span><span class="text-danger fw-bold">${emFmt(Math.round(emi*months-financed))}</span></div>`:''}</div>`;
}

function saveEmiPlan() {
  const custEl=document.getElementById('new-emi-cust');
  const custName=custEl?.options[custEl.selectedIndex]?.text||'Customer';
  const total=parseFloat(document.getElementById('new-emi-total')?.value)||0;
  const down=parseFloat(document.getElementById('new-emi-down')?.value)||0;
  const months=parseInt(document.getElementById('new-emi-months')?.value)||12;
  const int=parseFloat(document.getElementById('new-emi-int')?.value)||0;
  const firstDue=document.getElementById('new-emi-due')?.value;
  const finance=document.getElementById('new-emi-finance')?.value||'In-House';
  if(!custName||total<=0||!firstDue) { showToast('Fill all required fields','error'); return; }
  const financed=total-down;
  const r=int/100/12;
  const emi=int===0?financed/months:financed*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1);
  const newId='EMI'+String(EMID.plans.length+1).padStart(3,'0');
  EMID.plans.unshift({ id:newId, custId:'C000', custName, phone:'—', inv:'—', item:'Custom Purchase', total, downPay:down, financed, emiAmt:Math.round(emi), months, paid:0, interest:int, startDate:new Date().toISOString().slice(0,10), nextDue:firstDue, status:'Active', finance });
  closeModal('newEmiPlanModal');
  renderEmiPlans(); renderDueReminders(); renderOutstanding();
  showToast('EMI Plan '+newId+' created — ₹'+Math.round(emi).toLocaleString('en-IN')+'/month','success');
}

function initEmiModule() {
  renderCreditSales();
  renderEmiPlans();
  renderDueReminders();
  renderPaymentTracking();
  renderOutstanding();
  // populate cust dropdown
  const sel=document.getElementById('new-emi-cust');
  if(sel&&window.CM) sel.innerHTML='<option value="">-- Select Customer --</option>'+CM.customers.map(c=>`<option value="${c.id}">${c.name} (${c.id})</option>`).join('');
}

document.addEventListener('DOMContentLoaded', ()=>{
  const orig=window.showModule;
  if(typeof orig==='function'){
    window.showModule=function(m,n){ orig(m,n); if(m==='emi') setTimeout(initEmiModule,60); };
  }
});
