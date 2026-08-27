/* ===================================================
   CERITAGE — Customer Management (All 15 Features)
   =================================================== */
const CM = {
  customers: [
    { id:'C001', name:'Priya Sharma',    phone:'9876543210', email:'priya@gmail.com',   dob:'1990-08-15', anniversary:'2015-02-14', city:'Mumbai',    state:'Maharashtra', pan:'ABCPS1234F', aadhaar:'1234 5678 9012', gst:'',            type:'Gold',     kyc:'Complete',  balance:15000,  wallet:2840, loyaltyPts:2840, totalPurchase:285000, creditLimit:50000,  membership:'Gold',    joinDate:'2022-03-10', lastVisit:'2026-08-16', notes:['Prefers kundan work','Birthday in Aug'] },
    { id:'C002', name:'Rajesh Patel',    phone:'9856231470', email:'rajesh@gmail.com',  dob:'1985-04-22', anniversary:'2010-11-05', city:'Ahmedabad', state:'Gujarat',     pan:'ABCRP5678G', aadhaar:'2345 6789 0123', gst:'',            type:'Silver',   kyc:'Complete',  balance:0,      wallet:1200, loyaltyPts:1200, totalPurchase:142000, creditLimit:20000,  membership:'Silver',  joinDate:'2023-06-15', lastVisit:'2026-08-10', notes:['Likes plain gold'] },
    { id:'C003', name:'Sunita Verma',    phone:'9934521870', email:'sunita@gmail.com',  dob:'1978-12-01', anniversary:'2002-05-20', city:'Delhi',      state:'Delhi',       pan:'ABCSV9012H', aadhaar:'3456 7890 1234', gst:'27AABCSV001', type:'Platinum', kyc:'Complete',  balance:45000,  wallet:8900, loyaltyPts:8900, totalPurchase:890000, creditLimit:200000, membership:'Platinum',joinDate:'2021-01-05', lastVisit:'2026-08-14', notes:['VIP Customer','Bridal collection buyer'] },
    { id:'C004', name:'Amit Kumar',      phone:'9712345678', email:'amit@gmail.com',    dob:'1992-07-08', anniversary:'2018-03-15', city:'Jaipur',     state:'Rajasthan',   pan:'ABCAK3456I', aadhaar:'4567 8901 2345', gst:'',            type:'Gold',     kyc:'Pending',   balance:5200,   wallet:3200, loyaltyPts:3200, totalPurchase:320000, creditLimit:50000,  membership:'Gold',    joinDate:'2022-09-20', lastVisit:'2026-07-30', notes:['Interested in diamond rings'] },
    { id:'C005', name:'Meena Singh',     phone:'9623471230', email:'meena@gmail.com',   dob:'1995-03-25', anniversary:'',           city:'Pune',       state:'Maharashtra', pan:'ABCMS7890J', aadhaar:'5678 9012 3456', gst:'',            type:'Regular',  kyc:'Complete',  balance:0,      wallet:670,  loyaltyPts:670,  totalPurchase:67000,  creditLimit:10000,  membership:'Regular', joinDate:'2024-02-14', lastVisit:'2026-06-12', notes:[] },
    { id:'C006', name:'Vikram Malhotra', phone:'9845612370', email:'vikram@company.com',dob:'1975-09-18', anniversary:'2000-12-25', city:'Surat',      state:'Gujarat',     pan:'ABCVM2345K', aadhaar:'6789 0123 4567', gst:'24AABCVM001', type:'Platinum', kyc:'Complete',  balance:120000, wallet:12500,loyaltyPts:12500,totalPurchase:1250000,creditLimit:500000, membership:'Platinum',joinDate:'2020-11-30', lastVisit:'2026-08-16', notes:['Corporate buyer','B2B'] },
    { id:'C007', name:'Deepa Nair',      phone:'9701234560', email:'deepa@gmail.com',   dob:'1988-06-14', anniversary:'2012-07-01', city:'Kochi',      state:'Kerala',      pan:'ABCDN4567L', aadhaar:'7890 1234 5678', gst:'',            type:'Silver',   kyc:'Incomplete',balance:8000,   wallet:980,  loyaltyPts:980,  totalPurchase:98000,  creditLimit:25000,  membership:'Silver',  joinDate:'2023-04-18', lastVisit:'2026-05-20', notes:['Prefers temple jewellery'] },
    { id:'C008', name:'Sanjay Gupta',    phone:'9988776655', email:'sanjay@biz.com',    dob:'1970-11-30', anniversary:'1998-06-10', city:'Mumbai',     state:'Maharashtra', pan:'ABCSG8901M', aadhaar:'8901 2345 6789', gst:'27AABCSG002', type:'Platinum', kyc:'Complete',  balance:0,      wallet:18000,loyaltyPts:18000,totalPurchase:1800000,creditLimit:1000000,membership:'Platinum',joinDate:'2019-08-05', lastVisit:'2026-08-01', notes:['Annual buyer','Festival purchases'] },
  ],
  purchases: {
    C001:[{inv:'INV-2026-8841',date:'2026-08-16',item:'Kundan Necklace Set',amt:206000,paid:206000,mode:'UPI',status:'Paid'},{inv:'INV-2026-8802',date:'2026-07-22',item:'Jhumka Earrings',amt:60800,paid:60800,mode:'Cash',status:'Paid'},{inv:'INV-2026-8741',date:'2026-06-05',item:'Gold Bangle',amt:126700,paid:126700,mode:'Card',status:'Paid'}],
    C003:[{inv:'INV-2026-8839',date:'2026-08-15',item:'Kundan Bridal Set',amt:261002,paid:21750,mode:'EMI',status:'EMI Active'},{inv:'INV-2026-8750',date:'2026-06-10',item:'Diamond Necklace',amt:480000,paid:480000,mode:'NEFT',status:'Paid'}],
    C006:[{inv:'INV-2026-8838',date:'2026-08-14',item:'Solitaire Ring',amt:1250000,paid:0,mode:'Credit',status:'Credit'},{inv:'INV-2026-8820',date:'2026-08-01',item:'Diamond Set',amt:450000,paid:450000,mode:'NEFT',status:'Paid'}],
  },
  returns: {
    C001:[{id:'RET-2026-0018',date:'2026-08-18',inv:'INV-2026-8820',item:'Gold Ring (size issue)',refund:4140,mode:'Exchange',status:'Done'}],
    C003:[{id:'RET-2026-0015',date:'2026-07-01',inv:'INV-2026-8700',item:'Silver Chain (defect)',refund:12000,mode:'Credit Note',status:'Done'}],
  },
  ledger: {
    C001:[{date:'2026-08-16',desc:'Purchase — Kundan Necklace',dr:0,cr:206000,bal:206000},{date:'2026-08-16',desc:'Payment (UPI)',dr:206000,cr:0,bal:0}],
    C003:[{date:'2026-08-15',desc:'Purchase — Bridal Set',dr:0,cr:261002,bal:261002},{date:'2026-08-15',desc:'EMI Down Payment',dr:21750,cr:0,bal:239252}],
    C006:[{date:'2026-08-14',desc:'Purchase — Solitaire Ring',dr:0,cr:1250000,bal:1250000}],
  },
  wallet: {
    C001:[{date:'2026-08-16',desc:'Points earned INV-8841',pts:+2060,bal:2840},{date:'2026-07-22',desc:'Points earned INV-8802',pts:+608,bal:780},{date:'2026-06-15',desc:'Points redeemed',pts:-200,bal:172}],
  },
  notes: {
    C001:[{id:'N001',date:'2026-08-16',by:'Karan Mehta',note:'Customer interested in bridal set for daughter Dec 2026.',tag:'Follow-up'},{id:'N002',date:'2026-07-22',by:'Ravi Sharma',note:'Prefers kundan & meenakari. Dislikes diamond.',tag:'Preference'}],
    C006:[{id:'N003',date:'2026-08-14',by:'Ravi Sharma',note:'Corporate buyer — bulk discount needed above ₹5L.',tag:'Corporate'}],
  },
  membership:[
    {name:'Regular', color:'#6b5e4e',minSpend:0,      discount:0, making:0,  birthday:2, pointsRate:1,  benefits:['Basic support','Invoice history','SMS alerts']},
    {name:'Silver',  color:'#95a5a6',minSpend:50000,  discount:2, making:5,  birthday:5, pointsRate:1.5,benefits:['2% discount','5% off making','Birthday 5%','Priority service','WhatsApp alerts']},
    {name:'Gold',    color:'#b8860b',minSpend:150000, discount:4, making:10, birthday:7, pointsRate:2,  benefits:['4% discount','10% off making','Birthday 7%','Free polishing 2x/yr','Dedicated RM']},
    {name:'Platinum',color:'#9b59b6',minSpend:500000, discount:7, making:15, birthday:10,pointsRate:3,  benefits:['7% discount','15% off making','Birthday 10%','Unlimited polishing','Free home delivery','Exclusive previews','Concierge RM']},
  ],
  emi:[
    {id:'EMI001',custId:'C003',custName:'Sunita Verma',  inv:'INV-2026-8839',item:'Kundan Bridal Set',total:261002,emiAmt:21750,months:12,paid:9, nextDue:'2026-08-16',status:'Due Today'},
    {id:'EMI002',custId:'C004',custName:'Amit Kumar',    inv:'INV-2026-8810',item:'Diamond Ring',     total:120000,emiAmt:10000,months:12,paid:5, nextDue:'2026-08-20',status:'On Track'},
    {id:'EMI003',custId:'C007',custName:'Deepa Nair',    inv:'INV-2026-8796',item:'Gold Bangles',      total:253400,emiAmt:21100,months:12,paid:2, nextDue:'2026-08-10',status:'Overdue'},
  ],
};

// ---- utils ----
function cf(n){return '₹'+(n||0).toLocaleString('en-IN');}
function cd(d){if(!d)return '—';const dt=new Date(d);return isNaN(dt)?d:dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});}
function daysUntil(s){if(!s)return 999;const n=new Date();n.setHours(0,0,0,0);const t=new Date(s);t.setFullYear(n.getFullYear());if(t<n)t.setFullYear(n.getFullYear()+1);return Math.ceil((t-n)/86400000);}
function tierBadge(t){const m={Platinum:'badge-purple',Gold:'badge-gold',Silver:'badge-blue',Regular:'badge-grey'};return `<span class="badge ${m[t]||'badge-grey'}">${t}</span>`;}
function kycBadge(k){const m={Complete:'badge-green',Pending:'badge-orange',Incomplete:'badge-red'};return `<span class="badge ${m[k]||'badge-grey'}">${k}</span>`;}
function initials(n){return (n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);}

let custFilter={search:'',type:'',city:''};
let activeProfile=null;

// ---- 1. CUSTOMER LIST ----
function renderCustomerTable(search){
  if(search!==undefined) custFilter.search=search;
  const tbody=document.getElementById('customer-tbody');if(!tbody)return;
  const lq=custFilter.search.toLowerCase();
  const data=CM.customers.filter(c=>{
    const ms=!lq||c.name.toLowerCase().includes(lq)||c.phone.includes(lq)||c.city.toLowerCase().includes(lq)||c.id.includes(lq);
    const mt=!custFilter.type||c.type===custFilter.type;
    const mc=!custFilter.city||c.city===custFilter.city;
    return ms&&mt&&mc;
  });
  // kpis
  const setK=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  setK('cm-kpi-total',CM.customers.length);
  setK('cm-kpi-plat',CM.customers.filter(c=>c.type==='Platinum').length);
  setK('cm-kpi-gold',CM.customers.filter(c=>c.type==='Gold').length);
  setK('cm-kpi-due',CM.customers.filter(c=>c.balance>0).length);
  tbody.innerHTML=data.map(c=>`
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px">
        <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-dark));display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:#fff;flex-shrink:0">${initials(c.name)}</div>
        <div><div style="font-weight:700;font-size:.85rem">${c.name}</div><div style="font-size:.72rem;color:var(--text-muted)">${c.id} · ${c.city}</div></div>
      </div></td>
      <td>${c.phone}</td>
      <td>${tierBadge(c.type)}</td>
      <td>${kycBadge(c.kyc)}</td>
      <td class="${c.balance>0?'text-danger fw-bold':''}">${cf(c.balance)}</td>
      <td class="text-gold fw-bold">${cf(c.totalPurchase)}</td>
      <td><span class="badge badge-gold" style="font-size:.7rem">🏅 ${c.loyaltyPts}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="openCustProfile('${c.id}')">👁</button>
        <button class="btn btn-gold btn-xs" onclick="openCustTab('${c.id}','purchases')">🧾</button>
        <button class="btn btn-outline btn-xs" onclick="openCustTab('${c.id}','whatsapp')">📱</button>
        <button class="btn btn-outline btn-xs" onclick="openCustTab('${c.id}','notes')">📝</button>
      </td>
    </tr>`).join('')||'<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">No customers found</td></tr>';
}

// ---- PROFILE DRAWER ----
function openCustProfile(id){
  activeProfile=id;
  const c=CM.customers.find(x=>x.id===id);if(!c)return;
  openModal('custProfileModal');
  const s=(el,v)=>{const e=document.getElementById(el);if(e)e.textContent=v||'—';};
  s('cp-name',c.name);s('cp-id',c.id);s('cp-phone',c.phone);s('cp-email',c.email);
  s('cp-city',c.city+', '+c.state);s('cp-dob',cd(c.dob));s('cp-ann',cd(c.anniversary));
  s('cp-pan',c.pan);s('cp-aadhaar',c.aadhaar);s('cp-gst',c.gst||'—');
  s('cp-join',cd(c.joinDate));s('cp-last',cd(c.lastVisit));
  s('cp-total',cf(c.totalPurchase));s('cp-wallet',c.loyaltyPts+' pts ('+cf(c.wallet)+')');
  s('cp-credit',cf(c.creditLimit-c.balance)+' available');
  document.getElementById('cp-avatar')&&(document.getElementById('cp-avatar').textContent=initials(c.name));
  document.getElementById('cp-tier')&&(document.getElementById('cp-tier').innerHTML=tierBadge(c.type)+' &bull; '+c.id);
  document.getElementById('cp-due')&&(document.getElementById('cp-due').textContent=cf(c.balance));
  document.getElementById('cp-due')&&(document.getElementById('cp-due').style.color=c.balance>0?'var(--danger)':'var(--success)');
  document.getElementById('cp-kyc')&&(document.getElementById('cp-kyc').innerHTML=kycBadge(c.kyc));
  switchCustTab('purchases');
}

function openCustTab(id,tab){openCustProfile(id);setTimeout(()=>switchCustTab(tab),100);}

function switchCustTab(tab){
  document.querySelectorAll('.cpt-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  document.querySelectorAll('.cpt-content').forEach(p=>p.classList.toggle('active',p.id==='cpt-'+tab));
  if(tab==='purchases') renderCustPurchases();
  if(tab==='returns')   renderCustReturns();
  if(tab==='ledger')    renderCustLedger();
  if(tab==='wallet')    renderCustWallet();
  if(tab==='notes')     renderCustNotes();
  if(tab==='kyc')       renderCustKyc();
  if(tab==='emi')       renderCustEmi();
  if(tab==='whatsapp')  renderCustComm();
}

function renderCustPurchases(){
  const el=document.getElementById('cpt-purchases');if(!el)return;
  const rows=CM.purchases[activeProfile]||[];
  el.innerHTML=rows.length?rows.map(p=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-light)">
      <div><div style="font-weight:700;font-size:.85rem">${p.item}</div>
      <div style="font-size:.73rem;color:var(--text-muted)">${p.inv} &bull; ${cd(p.date)} &bull; ${p.mode}</div></div>
      <div style="text-align:right"><div class="fw-bold text-gold">${cf(p.amt)}</div>
      <span class="badge badge-${p.status==='Paid'?'green':p.status==='EMI Active'?'orange':'blue'}" style="font-size:.68rem">${p.status}</span></div>
    </div>`).join(''):'<div style="padding:20px;text-align:center;color:var(--text-muted)">No purchase history</div>';
}

function renderCustReturns(){
  const el=document.getElementById('cpt-returns');if(!el)return;
  const rows=CM.returns[activeProfile]||[];
  el.innerHTML=rows.length?rows.map(r=>`
    <div style="padding:10px 0;border-bottom:1px solid var(--border-light)">
      <div style="display:flex;justify-content:space-between">
        <span class="badge badge-orange" style="font-size:.7rem">${r.id}</span>
        <span class="badge badge-green" style="font-size:.7rem">${r.status}</span>
      </div>
      <div style="margin-top:4px;font-size:.83rem;font-weight:700">${r.item}</div>
      <div style="font-size:.75rem;color:var(--text-muted)">${cd(r.date)} &bull; Against: ${r.inv} &bull; Refund: <span style="color:var(--danger);font-weight:700">${cf(r.refund)}</span> via ${r.mode}</div>
    </div>`).join(''):'<div style="padding:20px;text-align:center;color:var(--text-muted)">No return history</div>';
}

function renderCustLedger(){
  const el=document.getElementById('cpt-ledger');if(!el)return;
  const rows=CM.ledger[activeProfile]||[];
  el.innerHTML=rows.length?`<table style="width:100%;border-collapse:collapse;font-size:.8rem">
    <thead><tr style="border-bottom:1px solid var(--border)"><th style="padding:6px 0">Date</th><th>Particulars</th><th style="text-align:right">Dr</th><th style="text-align:right">Cr</th><th style="text-align:right">Balance</th></tr></thead>
    <tbody>${rows.map(r=>`<tr style="border-bottom:1px solid var(--border-light)">
      <td style="padding:7px 0">${cd(r.date)}</td><td>${r.desc}</td>
      <td style="text-align:right;color:${r.dr?'var(--success)':'var(--text-muted)'}">${r.dr?cf(r.dr):'—'}</td>
      <td style="text-align:right;color:${r.cr?'var(--danger)':'var(--text-muted)'}">${r.cr?cf(r.cr):'—'}</td>
      <td style="text-align:right;font-weight:700;color:var(--accent)">${cf(r.bal)}</td>
    </tr>`).join('')}</tbody></table>`:'<div style="padding:20px;text-align:center;color:var(--text-muted)">No ledger entries</div>';
}

function renderCustWallet(){
  const el=document.getElementById('cpt-wallet');if(!el)return;
  const c=CM.customers.find(x=>x.id===activeProfile)||{};
  const rows=CM.wallet[activeProfile]||[];
  el.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div style="background:var(--primary-glow);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:1.4rem;font-weight:800;color:var(--accent)">${c.loyaltyPts||0}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">Loyalty Points</div>
      </div>
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:1.4rem;font-weight:800;color:var(--success)">${cf(c.wallet||0)}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">Redeemable Value</div>
      </div>
    </div>
    ${rows.length?`<table style="width:100%;border-collapse:collapse;font-size:.8rem">
      <thead><tr style="border-bottom:1px solid var(--border)"><th style="padding:6px 0">Date</th><th>Description</th><th style="text-align:right">Points</th><th style="text-align:right">Balance</th></tr></thead>
      <tbody>${rows.map(r=>`<tr style="border-bottom:1px solid var(--border-light)">
        <td style="padding:7px 0">${cd(r.date)}</td><td>${r.desc}</td>
        <td style="text-align:right;color:${r.pts>0?'var(--success)':'var(--danger)'}; font-weight:700">${r.pts>0?'+':''}${r.pts}</td>
        <td style="text-align:right;font-weight:700;color:var(--accent)">${r.bal}</td>
      </tr>`).join('')}</tbody></table>`:'<div style="font-size:.83rem;color:var(--text-muted);margin-top:8px">No wallet transactions</div>'}
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn btn-gold btn-sm" onclick="showToast('Points redeemed!','success')">💳 Redeem Points</button>
      <button class="btn btn-outline btn-sm" onclick="showToast('Bonus points added!','success')">➕ Add Points</button>
    </div>`;
}

function renderCustNotes(){
  const el=document.getElementById('cpt-notes');if(!el)return;
  const rows=CM.notes[activeProfile]||[];
  el.innerHTML=rows.map(n=>`
    <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px">
        <span class="badge badge-${n.tag==='Follow-up'?'orange':n.tag==='Corporate'?'purple':'blue'}">${n.tag}</span>
        <span style="font-size:.73rem;color:var(--text-muted)">${cd(n.date)} by ${n.by}</span>
      </div>
      <div style="font-size:.83rem">${n.note}</div>
    </div>`).join('')+`
    <textarea id="new-note-txt" class="form-control" rows="2" placeholder="Add a note..." style="margin-bottom:8px"></textarea>
    <div style="display:flex;gap:8px">
      <select id="new-note-tag" class="form-control" style="width:140px"><option>Preference</option><option>Follow-up</option><option>Corporate</option><option>Issue</option><option>General</option></select>
      <button class="btn btn-gold btn-sm" onclick="saveNote('${activeProfile}')">💾 Add Note</button>
    </div>`;
}

function saveNote(id){
  const txt=document.getElementById('new-note-txt')?.value?.trim();
  const tag=document.getElementById('new-note-tag')?.value||'General';
  if(!txt){showToast('Enter note text','error');return;}
  if(!CM.notes[id])CM.notes[id]=[];
  CM.notes[id].unshift({id:'N'+Date.now(),date:new Date().toISOString().slice(0,10),by:'Ravi Sharma',note:txt,tag});
  renderCustNotes();showToast('Note saved!','success');
}

function renderCustKyc(){
  const el=document.getElementById('cpt-kyc');if(!el)return;
  const c=CM.customers.find(x=>x.id===activeProfile)||{};
  const done=c.kyc==='Complete';
  const check=v=>`<span style="color:${v?'var(--success)':'var(--danger)'}">${v?'✅ Verified':'❌ Pending'}</span>`;
  el.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:12px">
        <div style="font-size:.73rem;color:var(--text-muted);margin-bottom:4px">PAN Card</div>
        <div style="font-weight:700">${c.pan||'—'}</div>
        <div style="margin-top:4px">${check(done||c.pan)}</div>
      </div>
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:12px">
        <div style="font-size:.73rem;color:var(--text-muted);margin-bottom:4px">Aadhaar Card</div>
        <div style="font-weight:700">${c.aadhaar||'—'}</div>
        <div style="margin-top:4px">${check(done||c.aadhaar)}</div>
      </div>
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:12px">
        <div style="font-size:.73rem;color:var(--text-muted);margin-bottom:4px">Photo ID</div>
        <div style="margin-top:4px">${check(done)}</div>
      </div>
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:12px">
        <div style="font-size:.73rem;color:var(--text-muted);margin-bottom:4px">GST (B2B)</div>
        <div style="font-weight:700">${c.gst||'Not provided'}</div>
        <div style="margin-top:4px">${check(!!c.gst)}</div>
      </div>
    </div>
    <button class="btn btn-gold" style="width:100%" onclick="markKycDone('${activeProfile}')">✅ Mark KYC Complete</button>`;
}

function markKycDone(id){
  const c=CM.customers.find(x=>x.id===id);
  if(c){c.kyc='Complete';renderCustKyc();renderCustomerTable();showToast('KYC marked Complete for '+c.name,'success');}
}

function renderCustEmi(){
  const el=document.getElementById('cpt-emi');if(!el)return;
  const rows=CM.emi.filter(e=>e.custId===activeProfile);
  el.innerHTML=rows.length?rows.map(e=>{
    const rem=e.emiAmt*(e.months-e.paid);
    const pct=Math.round(e.paid/e.months*100);
    return `<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <div><span class="badge badge-blue" style="font-size:.7rem">${e.id}</span> <span style="font-weight:700;font-size:.85rem">${e.item}</span></div>
        <span class="badge badge-${e.status==='Overdue'?'red':e.status==='Due Today'?'orange':'green'}">${e.status}</span>
      </div>
      <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:8px">EMI: ${cf(e.emiAmt)}/month &bull; ${e.paid}/${e.months} paid &bull; Next: ${cd(e.nextDue)}</div>
      <div class="progress" style="height:6px;margin-bottom:8px"><div class="progress-bar green" style="width:${pct}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:.82rem">
        <span style="color:var(--text-muted)">Remaining: <span class="text-danger fw-bold">${cf(rem)}</span></span>
        <button class="btn btn-gold btn-xs" onclick="showToast('EMI collected — ${cf(e.emiAmt)}','success')">💳 Collect</button>
      </div>
    </div>`;
  }).join(''):'<div style="padding:20px;text-align:center;color:var(--text-muted)">No active EMI plans</div>';
}

function renderCustComm(){
  const el=document.getElementById('cpt-whatsapp');if(!el)return;
  const c=CM.customers.find(x=>x.id===activeProfile)||{};
  const templates=[
    {name:'Birthday Wishes 🎂', msg:`Dear ${c.name}, 🎂 Wishing you a sparkling birthday! Enjoy 5% off on your next purchase at Ceritage. Use code BDAY5. 💎`},
    {name:'Anniversary Wishes 💍', msg:`Dear ${c.name}, 💍 Happy Anniversary! Celebrate with exclusive jewelry from Ceritage. Special 3% off this week!`},
    {name:'EMI Reminder 💳', msg:`Dear ${c.name}, your EMI is due. Kindly pay at earliest. Contact: 9876543210. - Ceritage Jewelry`},
    {name:'Due Reminder ⚠️', msg:`Dear ${c.name}, you have a pending balance of ${cf(c.balance)} at Ceritage Jewelry. Please settle at your earliest. 🙏`},
    {name:'Festival Offer 🪔', msg:`Dear ${c.name}, 🪔 Navratri Special! Exclusive offers on Gold & Diamond at Ceritage. Visit us today! Contact: 9876543210`},
    {name:'Custom Message ✏️', msg:''},
  ];
  el.innerHTML=`
    <div style="margin-bottom:12px">
      <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:4px">Send to: <strong>${c.name}</strong> (${c.phone})</div>
      <select class="form-control" id="comm-tpl" onchange="(function(){const t=${JSON.stringify(templates)};const v=this.value;const m=t[v]?.msg||'';document.getElementById('comm-msg').value=m;}).call(this)" style="margin-bottom:8px">
        ${templates.map((t,i)=>`<option value="${i}">${t.name}</option>`).join('')}
      </select>
      <textarea class="form-control" id="comm-msg" rows="4" style="margin-bottom:8px">${templates[0].msg}</textarea>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-gold" onclick="sendCustMsg('${c.phone}','whatsapp')">📱 Send WhatsApp</button>
        <button class="btn btn-outline" onclick="sendCustMsg('${c.phone}','sms')">💬 Send SMS</button>
        <button class="btn btn-outline" onclick="sendCustMsg('${c.email}','email')">📧 Send Email</button>
      </div>
    </div>`;
  // fix onchange scope
  const sel=el.querySelector('#comm-tpl');
  if(sel) sel.addEventListener('change',function(){
    const msg=templates[this.value]?.msg||'';
    const ta=document.getElementById('comm-msg');if(ta)ta.value=msg;
  });
}

function sendCustMsg(to, channel){
  showToast(`${channel==='whatsapp'?'📱 WhatsApp':channel==='sms'?'💬 SMS':'📧 Email'} sent to ${to}!`,'success');
}

// ---- MEMBERSHIP TAB ----
function renderMembershipTab(){
  const grid=document.getElementById('cm-membership-grid');if(!grid)return;
  grid.innerHTML=CM.membership.map(m=>`
    <div style="background:var(--bg-card);border:2px solid ${m.color}40;border-radius:14px;padding:20px;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${m.color}"></div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <div style="width:42px;height:42px;border-radius:50%;background:${m.color}22;border:2px solid ${m.color};display:flex;align-items:center;justify-content:center;font-size:1.3rem">${m.name==='Platinum'?'💎':m.name==='Gold'?'🏅':m.name==='Silver'?'🥈':'🎖️'}</div>
        <div>
          <div style="font-weight:800;font-size:1rem;color:${m.color==='#b8860b'?'var(--accent)':m.color}">${m.name}</div>
          <div style="font-size:.73rem;color:var(--text-muted)">Min spend: ${m.minSpend?cf(m.minSpend):'Free'}</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div style="font-size:1.3rem;font-weight:800;color:var(--accent)">${m.discount}%</div>
          <div style="font-size:.68rem;color:var(--text-muted)">discount</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center"><div class="fw-bold text-gold">${m.making}%</div><div style="font-size:.68rem;color:var(--text-muted)">Making Disc</div></div>
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center"><div class="fw-bold text-gold">${m.birthday}%</div><div style="font-size:.68rem;color:var(--text-muted)">Birthday Bonus</div></div>
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center"><div class="fw-bold text-gold">${m.pointsRate}x</div><div style="font-size:.68rem;color:var(--text-muted)">Points</div></div>
        <div style="background:var(--bg-card2);border-radius:8px;padding:8px;text-align:center"><div class="fw-bold">${CM.customers.filter(c=>c.type===m.name).length}</div><div style="font-size:.68rem;color:var(--text-muted)">Members</div></div>
      </div>
      ${m.benefits.map(b=>`<div style="font-size:.78rem;padding:4px 0;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:6px"><span style="color:var(--success)">✓</span>${b}</div>`).join('')}
    </div>`).join('');
}

// ---- REMINDERS ----
function renderReminders(){
  const tbody=document.getElementById('cm-reminders-tbody');if(!tbody)return;
  const list=[];
  CM.customers.forEach(c=>{
    if(c.dob)list.push({name:c.name,phone:c.phone,type:'Birthday 🎂',date:c.dob,days:daysUntil(c.dob),tier:c.type,id:c.id});
    if(c.anniversary)list.push({name:c.name,phone:c.phone,type:'Anniversary 💍',date:c.anniversary,days:daysUntil(c.anniversary),tier:c.type,id:c.id});
  });
  list.sort((a,b)=>a.days-b.days);
  tbody.innerHTML=list.map(r=>{
    const urg=r.days===0?'badge-red':r.days<=7?'badge-orange':r.days<=30?'badge-gold':'badge-grey';
    const lbl=r.days===0?'TODAY':r.days+' days';
    return `<tr>
      <td><strong>${r.name}</strong></td>
      <td>${r.phone}</td>
      <td>${r.type}</td>
      <td style="font-size:.78rem">${r.date.slice(5).replace('-','/')}</td>
      <td><span class="badge ${urg} fw-bold">${lbl}</span></td>
      <td>${tierBadge(r.tier)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-gold btn-xs" onclick="openCustTab('${r.id}','whatsapp')">📱 WhatsApp</button>
        <button class="btn btn-outline btn-xs" onclick="showToast('SMS sent to '+r.name,'success')">💬 SMS</button>
      </td>
    </tr>`;
  }).join('');
}

// ---- DUE TRACKING ----
function renderDueTracking(){
  const tbody=document.getElementById('cm-due-tbody');if(!tbody)return;
  const due=CM.customers.filter(c=>c.balance>0);
  tbody.innerHTML=due.length?due.map(c=>`
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.phone}</td>
      <td>${tierBadge(c.type)}</td>
      <td class="text-danger fw-bold">${cf(c.balance)}</td>
      <td>${cf(c.creditLimit)}</td>
      <td>${cf(c.totalPurchase)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-gold btn-xs" onclick="showToast('Payment recorded for '+c.name,'success')">💳 Collect</button>
        <button class="btn btn-outline btn-xs" onclick="openCustTab('${c.id}','ledger')">📒 Ledger</button>
        <button class="btn btn-outline btn-xs" onclick="openCustTab('${c.id}','whatsapp')">📱 Remind</button>
      </td>
    </tr>`).join(''):'<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--success)">✅ No pending dues!</td></tr>';
}

// ---- MASTER INIT ----
function initCustomerModule(){
  renderCustomerTable();
  renderReminders();
  renderDueTracking();
  renderMembershipTab();
}

document.addEventListener('DOMContentLoaded',()=>{
  const orig=window.showModule;
  if(typeof orig==='function'){
    window.showModule=function(m,n){orig(m,n);if(m==='customers')setTimeout(initCustomerModule,60);};
  }
});

// ---- KYC TABLE ----
function renderKycTable(){
  const tbody=document.getElementById('cm-kyc-tbody');if(!tbody)return;
  tbody.innerHTML=CM.customers.map(c=>`
    <tr>
      <td><strong>${c.name}</strong><div style="font-size:.72rem;color:var(--text-muted)">${c.id}</div></td>
      <td>${c.phone}</td>
      <td>${c.pan?`<span style="font-family:monospace;font-size:.82rem">${c.pan}</span> <span style="color:var(--success)">✅</span>`:'<span style="color:var(--danger)">❌ Missing</span>'}</td>
      <td>${c.aadhaar?c.aadhaar.slice(0,4)+'XXXX'+c.aadhaar.slice(-4)+' <span style="color:var(--success)">✅</span>':'<span style="color:var(--danger)">❌ Missing</span>'}</td>
      <td>${c.gst?`<span style="font-size:.78rem;font-family:monospace">${c.gst}</span> <span style="color:var(--success)">✅</span>`:'<span style="color:var(--text-muted)">N/A</span>'}</td>
      <td>${kycBadge(c.kyc)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="openCustTab('${c.id}','kyc')">📋 Detail</button>
        ${c.kyc!=='Complete'?`<button class="btn btn-gold btn-xs" onclick="markKycDone('${c.id}')">✅ Verify</button>`:''}
      </td>
    </tr>`).join('');
}

// ---- EMI TABLE ----
function renderEmiTable(){
  const tbody=document.getElementById('cm-emi-tbody');if(!tbody)return;
  tbody.innerHTML=CM.emi.map(e=>{
    const rem=e.emiAmt*(e.months-e.paid);
    const pct=Math.round(e.paid/e.months*100);
    return `<tr>
      <td><span class="badge badge-blue" style="font-size:.7rem">${e.id}</span></td>
      <td><strong>${e.custName}</strong></td>
      <td style="font-size:.82rem">${e.item}</td>
      <td>${cf(e.emiAmt*(e.months))}</td>
      <td class="fw-bold">${cf(e.emiAmt)}</td>
      <td style="min-width:100px">
        <div style="display:flex;align-items:center;gap:6px">
          <div class="progress" style="flex:1;height:5px"><div class="progress-bar green" style="width:${pct}%"></div></div>
          <span style="font-size:.72rem">${e.paid}/${e.months}</span>
        </div>
      </td>
      <td class="text-danger fw-bold">${cf(rem)}</td>
      <td>${cd(e.nextDue)}</td>
      <td><span class="badge badge-${e.status==='Due Today'?'orange':e.status==='Overdue'?'red':'green'}">${e.status}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-gold btn-xs" onclick="showToast('EMI collected: ${cf(e.emiAmt)}','success')">💳 Collect</button>
        <button class="btn btn-outline btn-xs" onclick="openCustTab('${e.custId}','emi')">👁</button>
        <button class="btn btn-outline btn-xs" onclick="showToast('Reminder sent','success')">📱</button>
      </td>
    </tr>`;
  }).join('');
}

// Extend initCustomerModule
const _origInit=window.initCustomerModule;
window.initCustomerModule=function(){
  if(_origInit)_origInit();
  renderKycTable();
  renderEmiTable();
};

// Also wire tab switches
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('#cm-main-tabs .tab').forEach(t=>{
    const orig=t.getAttribute('onclick')||'';
    if(orig.includes('cm-kyc')) t.setAttribute('onclick',orig+';renderKycTable()');
    if(orig.includes('cm-emi')) t.setAttribute('onclick',orig+';renderEmiTable()');
  });
});

// ============================================================
// LEDGER TAB
// ============================================================
function initCustLedger(){
  const sel=document.getElementById('cust-ledger-sel');
  if(sel&&sel.options.length<=1){
    sel.innerHTML='<option value="">-- Select Customer --</option>'+CM.customers.map(c=>`<option value="${c.id}">${c.name} (${c.id})</option>`).join('');
  }
}
function loadCustLedger(){
  const id=document.getElementById('cust-ledger-sel')?.value;
  const tbody=document.getElementById('cust-ledger-tbody');
  const sumEl=document.getElementById('cust-ledger-summary');
  if(!tbody)return;
  if(!id){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Select a customer</td></tr>';return;}
  const c=CM.customers.find(x=>x.id===id);
  const rows=CM.ledger[id]||[];
  tbody.innerHTML=rows.length?rows.map((r,i)=>`
    <tr>
      <td>${i+1}</td><td>${cd(r.date)}</td><td>${r.desc}</td>
      <td class="${r.dr?'text-success fw-bold':''}">${r.dr?cf(r.dr):'—'}</td>
      <td class="${r.cr?'text-danger fw-bold':''}">${r.cr?cf(r.cr):'—'}</td>
      <td class="text-gold fw-bold">${cf(r.bal)}</td>
    </tr>`).join(''):`<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">No ledger entries for ${c?.name}</td></tr>`;
  if(sumEl&&c) sumEl.innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px">
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:.7rem;color:var(--text-muted)">Total Purchased</div>
        <div class="text-gold fw-bold">${cf(c.totalPurchase)}</div>
      </div>
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:.7rem;color:var(--text-muted)">Balance Due</div>
        <div style="font-weight:700;color:${c.balance>0?'var(--danger)':'var(--success)'}">${cf(c.balance)}</div>
      </div>
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:.7rem;color:var(--text-muted)">Credit Limit</div>
        <div class="text-gold fw-bold">${cf(c.creditLimit)}</div>
      </div>
    </div>`;
}

// ============================================================
// WALLET TAB
// ============================================================
function renderWalletTab(){
  const tbody=document.getElementById('cm-wallet-tbody');if(!tbody)return;
  const tiers=CM.membership;
  tbody.innerHTML=CM.customers.map(c=>{
    const next=tiers[tiers.findIndex(m=>m.name===c.type)+1];
    const needed=next?Math.max(0,next.minSpend-c.totalPurchase):0;
    return `<tr>
      <td><strong>${c.name}</strong><div style="font-size:.72rem;color:var(--text-muted)">${c.id}</div></td>
      <td>${tierBadge(c.type)}</td>
      <td class="fw-bold text-gold">${(c.loyaltyPts||0).toLocaleString('en-IN')}</td>
      <td>${cf(Math.floor((c.loyaltyPts||0)*0.1)*10)}</td>
      <td>${cf(c.wallet||0)}</td>
      <td>${next?cf(needed)+' → '+next.name:'<span style="color:#9b59b6">🏆 Top Tier</span>'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-xs" onclick="showToast('Points redeemed!','success')">💳 Redeem</button>
        <button class="btn btn-gold btn-xs" onclick="showToast('+200 pts added!','success')">➕ Add</button>
      </td>
    </tr>`;
  }).join('');
}

// ============================================================
// CREDIT TAB
// ============================================================
function renderCreditTab(){
  const tbody=document.getElementById('cm-credit-tbody');if(!tbody)return;
  const credits=CM.customers.filter(c=>c.creditLimit>0);
  tbody.innerHTML=credits.map(c=>{
    const util=Math.round((c.balance/c.creditLimit)*100)||0;
    return `<tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.phone}</td>
      <td>${tierBadge(c.type)}</td>
      <td class="fw-bold">${cf(c.creditLimit)}</td>
      <td class="${c.balance>0?'text-danger fw-bold':''}">${cf(c.balance)}</td>
      <td class="text-success fw-bold">${cf(c.creditLimit-c.balance)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="progress" style="flex:1;height:6px"><div class="progress-bar ${util>80?'red':util>50?'':'green'}" style="width:${util}%"></div></div>
          <span style="font-size:.72rem;font-weight:700">${util}%</span>
        </div>
      </td>
      <td class="${c.balance>0?'text-danger fw-bold':''}">${cf(c.balance)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-gold btn-xs" onclick="showToast('Payment collected from '+c.name,'success')">💳 Collect</button>
        <button class="btn btn-outline btn-xs" onclick="openCustTab('${c.id}','ledger')">📒 Ledger</button>
        <button class="btn btn-outline btn-xs" onclick="openCustTab('${c.id}','whatsapp')">📱 Remind</button>
      </td>
    </tr>`;
  }).join('');
}

// ============================================================
// PURCHASE HISTORY TAB
// ============================================================
function loadPurchaseHistory(){
  const id=document.getElementById('hist-cust-sel')?.value;
  const tbody=document.getElementById('cm-hist-tbody');if(!tbody)return;
  // Build all purchases
  const all=[];
  if(id){
    (CM.purchases[id]||[]).forEach(p=>{
      const c=CM.customers.find(x=>x.id===id);
      all.push({...p,custName:c?.name||'',custId:id});
    });
  } else {
    Object.entries(CM.purchases).forEach(([custId,rows])=>{
      const c=CM.customers.find(x=>x.id===custId);
      rows.forEach(p=>all.push({...p,custName:c?.name||'',custId}));
    });
  }
  tbody.innerHTML=all.length?all.map(p=>`
    <tr>
      <td><span class="badge badge-gold" style="font-size:.7rem">${p.inv}</span></td>
      <td><strong>${p.custName}</strong></td>
      <td>${cd(p.date)}</td>
      <td style="font-size:.82rem">${p.item}</td>
      <td class="text-gold fw-bold">${cf(p.amt)}</td>
      <td class="text-success">${cf(p.paid)}</td>
      <td><span class="badge badge-blue" style="font-size:.7rem">${p.mode}</span></td>
      <td><span class="badge badge-${p.status==='Paid'?'green':p.status==='EMI Active'?'orange':'blue'}">${p.status}</span></td>
      <td><button class="btn btn-outline btn-xs" onclick="showToast('Invoice printed','success')">🧾</button></td>
    </tr>`).join(''):'<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-muted)">No purchase history</td></tr>';
}

// ============================================================
// RETURN HISTORY TAB
// ============================================================
function loadReturnHistory(){
  const id=document.getElementById('ret-cust-sel')?.value;
  const tbody=document.getElementById('cm-ret-tbody');if(!tbody)return;
  const all=[];
  if(id){
    (CM.returns[id]||[]).forEach(r=>{
      const c=CM.customers.find(x=>x.id===id);
      all.push({...r,custName:c?.name||''});
    });
  } else {
    Object.entries(CM.returns).forEach(([custId,rows])=>{
      const c=CM.customers.find(x=>x.id===custId);
      rows.forEach(r=>all.push({...r,custName:c?.name||''}));
    });
  }
  tbody.innerHTML=all.length?all.map(r=>`
    <tr>
      <td><span class="badge badge-red" style="font-size:.7rem">${r.id}</span></td>
      <td><strong>${r.custName}</strong></td>
      <td>${cd(r.date)}</td>
      <td><span class="badge badge-grey" style="font-size:.7rem">${r.inv}</span></td>
      <td style="font-size:.82rem">${r.item}</td>
      <td class="text-danger fw-bold">${cf(r.refund)}</td>
      <td><span class="badge badge-blue" style="font-size:.7rem">${r.mode}</span></td>
      <td><span class="badge badge-green">${r.status}</span></td>
    </tr>`).join(''):'<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">No return history</td></tr>';
}

// ============================================================
// EXTEND initCustomerModule
// ============================================================
const _custInit2=window.initCustomerModule;
window.initCustomerModule=function(){
  if(_custInit2)_custInit2();
  // Populate all dropdowns
  ['cust-ledger-sel','hist-cust-sel','ret-cust-sel'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){
      const all=id==='ret-cust-sel'?'-- All Customers --':'-- Select Customer --';
      el.innerHTML=`<option value="">${all}</option>`+CM.customers.map(c=>`<option value="${c.id}">${c.name} (${c.id})</option>`).join('');
    }
  });
  renderWalletTab();
  renderCreditTab();
  loadPurchaseHistory();
  loadReturnHistory();
};
