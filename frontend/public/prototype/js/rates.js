/* ===================================================
   CERITAGE JEWELRY ERP — Daily Gold & Silver Rates
   6 Features: Gold · Silver · Platinum Rate Update
                Live Rate API · Manual Update · Rate History
   =================================================== */

const RATES = {
  current: { k22:7240, k24:7890, k18:5920, k14:4610, silver:92, platinum:2850, palladium:3100, dollar:83.50, updatedAt:'2026-08-16 09:15', source:'Manual' },
  history: [
    { date:'2026-08-16', k22:7240, k24:7890, k18:5920, k14:4610, silver:92, platinum:2850, dollar:83.50, change22:+40,  changeS:+1,  by:'Ravi Sharma',  source:'Manual' },
    { date:'2026-08-15', k22:7200, k24:7850, k18:5880, k14:4590, silver:91, platinum:2820, dollar:83.40, change22:+80,  changeS:+1,  by:'Ravi Sharma',  source:'Manual' },
    { date:'2026-08-14', k22:7120, k24:7760, k18:5820, k14:4550, silver:90, platinum:2800, dollar:83.30, change22:-30,  changeS:-1,  by:'API Sync',     source:'API'    },
    { date:'2026-08-13', k22:7150, k24:7790, k18:5840, k14:4565, silver:91, platinum:2810, dollar:83.20, change22:+20,  changeS:0,   by:'Ravi Sharma',  source:'Manual' },
    { date:'2026-08-12', k22:7130, k24:7770, k18:5830, k14:4556, silver:91, platinum:2800, dollar:83.10, change22:-50,  changeS:-1,  by:'API Sync',     source:'API'    },
    { date:'2026-08-11', k22:7180, k24:7820, k18:5865, k14:4583, silver:92, platinum:2840, dollar:83.15, change22:+10,  changeS:+2,  by:'Karan Mehta',  source:'Manual' },
    { date:'2026-08-10', k22:7170, k24:7810, k18:5858, k14:4577, silver:90, platinum:2835, dollar:83.00, change22:-20,  changeS:-1,  by:'API Sync',     source:'API'    },
    { date:'2026-08-09', k22:7190, k24:7830, k18:5870, k14:4590, silver:91, platinum:2830, dollar:82.90, change22:+30,  changeS:+1,  by:'Ravi Sharma',  source:'Manual' },
    { date:'2026-08-08', k22:7160, k24:7800, k18:5850, k14:4572, silver:90, platinum:2820, dollar:82.80, change22:-40,  changeS:-2,  by:'API Sync',     source:'API'    },
    { date:'2026-08-07', k22:7200, k24:7840, k18:5880, k14:4600, silver:92, platinum:2850, dollar:82.70, change22:+60,  changeS:+2,  by:'Ravi Sharma',  source:'Manual' },
    { date:'2026-08-06', k22:7140, k24:7780, k18:5835, k14:4560, silver:90, platinum:2810, dollar:82.60, change22:-10,  changeS:0,   by:'API Sync',     source:'API'    },
    { date:'2026-08-05', k22:7150, k24:7790, k18:5843, k14:4567, silver:90, platinum:2800, dollar:82.50, change22:+50,  changeS:+1,  by:'Ravi Sharma',  source:'Manual' },
    { date:'2026-08-04', k22:7100, k24:7740, k18:5813, k14:4540, silver:89, platinum:2780, dollar:82.40, change22:-80,  changeS:-2,  by:'API Sync',     source:'API'    },
    { date:'2026-08-03', k22:7180, k24:7820, k18:5865, k14:4583, silver:91, platinum:2810, dollar:82.30, change22:+20,  changeS:+1,  by:'Ravi Sharma',  source:'Manual' },
    { date:'2026-08-02', k22:7160, k24:7800, k18:5850, k14:4572, silver:90, platinum:2790, dollar:82.20, change22:-10,  changeS:0,   by:'API Sync',     source:'API'    },
    { date:'2026-08-01', k22:7170, k24:7810, k18:5858, k14:4577, silver:90, platinum:2800, dollar:82.10, change22:0,    changeS:0,   by:'Opening Rate', source:'Manual' },
  ],
  alertSettings: { gold22Low:6800, gold22High:8000, silverLow:80, silverHigh:120, autoUpdate:true, autoTime:'09:00', notifyWhatsApp:true, notifySMS:false },
};

// ---- UTILS ----
function rFmt2(n){ return '₹'+Number(n||0).toLocaleString('en-IN'); }
function rChg(v){ if(!v&&v!==0) return '—'; return `<span style="color:${v>0?'var(--success)':v<0?'var(--danger)':'var(--text-muted)'};font-weight:700">${v>0?'▲':'▼'} ₹${Math.abs(v)}</span>`; }

// ---- 1. RENDER LIVE RATES PANEL ----
function renderLiveRates() {
  const R = RATES.current;
  const prev = RATES.history[1] || {};
  // update display cards
  const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  set('rd-k22', '₹'+R.k22+'/g');  set('rd-k24', '₹'+R.k24+'/g');
  set('rd-k18', '₹'+R.k18+'/g');  set('rd-k14', '₹'+R.k14+'/g');
  set('rd-silver','₹'+R.silver+'/g'); set('rd-platinum','₹'+R.platinum+'/g');
  set('rd-dollar','₹'+R.dollar);   set('rd-updated', R.updatedAt+' ('+R.source+')');
  const chg22 = prev.k22 ? R.k22-prev.k22 : 0;
  const chgS  = prev.silver ? R.silver-prev.silver : 0;
  const chgEl22=document.getElementById('rd-chg22'); if(chgEl22) chgEl22.innerHTML = rChg(chg22);
  const chgElS =document.getElementById('rd-chg-silver'); if(chgElS) chgElS.innerHTML = rChg(chgS);
  // topbar ticker
  const ticker=document.getElementById('gold-ticker');
  if(ticker) ticker.innerHTML=`🏅 22K: ₹${R.k22}/g &nbsp;|&nbsp; 24K: ₹${R.k24}/g &nbsp;|&nbsp; 🥈 Silver: ₹${R.silver}/g`;
  // fill update form inputs
  ['rate-gold22','rate-gold24','rate-silver'].forEach((id,i)=>{
    const el=document.getElementById(id); if(el) el.value=[R.k22,R.k24,R.silver][i];
  });
  ['rd-input-k22','rd-input-k24','rd-input-k18','rd-input-k14','rd-input-silver','rd-input-platinum','rd-input-dollar'].forEach((id,i)=>{
    const el=document.getElementById(id); if(el) el.value=[R.k22,R.k24,R.k18,R.k14,R.silver,R.platinum,R.dollar][i];
  });
}

// ---- 2. RENDER RATE HISTORY ----
function renderRateHistory(filterDays) {
  const tbody=document.getElementById('rate-history-tbody'); if(!tbody) return;
  const data = filterDays ? RATES.history.slice(0,filterDays) : RATES.history;
  const max22=Math.max(...data.map(r=>r.k22));
  const min22=Math.min(...data.map(r=>r.k22));
  tbody.innerHTML = data.map(r=>`
    <tr style="${r.k22===max22?'background:rgba(46,204,113,.05)':r.k22===min22?'background:rgba(231,76,60,.05)':''}">
      <td class="fw-bold">${new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
      <td class="${r.k22===max22?'text-success':r.k22===min22?'text-danger':''} fw-bold">₹${r.k22}</td>
      <td>₹${r.k24}</td>
      <td style="color:var(--info)">₹${r.k18}</td>
      <td>₹${r.k14}</td>
      <td style="color:var(--text-muted)">₹${r.silver}</td>
      <td>₹${r.platinum}</td>
      <td style="font-size:.8rem">₹${r.dollar}</td>
      <td>${rChg(r.change22)}</td>
      <td>${rChg(r.changeS)}</td>
      <td><span class="badge badge-${r.source==='API'?'blue':'grey'} " style="font-size:.68rem">${r.source}</span></td>
      <td style="font-size:.78rem;color:var(--text-muted)">${r.by}</td>
      ${r.k22===max22?'<td><span class="badge badge-green" style="font-size:.68rem">🏆 High</span></td>':r.k22===min22?'<td><span class="badge badge-red" style="font-size:.68rem">📉 Low</span></td>':'<td>—</td>'}
    </tr>`).join('');
  // stat cards
  const avg22=Math.round(data.reduce((s,r)=>s+r.k22,0)/data.length);
  const avgS =Math.round(data.reduce((s,r)=>s+r.silver,0)/data.length*10)/10;
  ['rh-max','rh-min','rh-avg','rh-avg-s'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=['₹'+max22+'/g','₹'+min22+'/g','₹'+avg22+'/g','₹'+avgS+'/g'][i];
  });
}

// ---- 3. SAVE MANUAL RATE UPDATE ----
function saveManualRates() {
  const fields = ['rd-input-k22','rd-input-k24','rd-input-k18','rd-input-k14','rd-input-silver','rd-input-platinum','rd-input-dollar'];
  const keys   = ['k22','k24','k18','k14','silver','platinum','dollar'];
  const prev22 = RATES.current.k22;
  const prevS  = RATES.current.silver;
  keys.forEach((k,i) => {
    const el=document.getElementById(fields[i]);
    if(el && el.value) RATES.current[k] = parseFloat(el.value);
  });
  RATES.current.updatedAt = new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  RATES.current.source = 'Manual';
  // push to history
  const chg22 = RATES.current.k22 - prev22;
  const chgS  = RATES.current.silver - prevS;
  RATES.history.unshift({ date:new Date().toISOString().slice(0,10), k22:RATES.current.k22, k24:RATES.current.k24, k18:RATES.current.k18, k14:RATES.current.k14, silver:RATES.current.silver, platinum:RATES.current.platinum, dollar:RATES.current.dollar, change22:chg22, changeS:chgS, by:'Ravi Sharma', source:'Manual' });
  renderLiveRates(); renderRateHistory();
  // also update app.js goldRates object
  if(window.goldRates){ goldRates.gold22=RATES.current.k22; goldRates.gold24=RATES.current.k24; goldRates.silver=RATES.current.silver; }
  if(typeof updateGoldTicker==='function') updateGoldTicker();
  showToast('✅ All rates updated successfully! ('+RATES.current.k22+'/g for 22K)','success');
}

// ---- 4. SIMULATE LIVE API FETCH ----
function fetchLiveRates() {
  const btn=document.getElementById('api-fetch-btn');
  if(btn){ btn.textContent='⏳ Fetching...'; btn.disabled=true; }
  const el=document.getElementById('api-status');
  if(el){ el.textContent='Connecting to MCX/IBJA API...'; el.style.color='var(--warning)'; }
  setTimeout(()=>{
    // simulate rate update
    const delta = Math.floor(Math.random()*100-50);
    RATES.current.k22 += delta;
    RATES.current.k24 = Math.round(RATES.current.k22 * (7890/7240)*100)/100;
    RATES.current.k18 = Math.round(RATES.current.k22 * 0.818);
    RATES.current.k14 = Math.round(RATES.current.k22 * 0.636);
    const dS = Math.floor(Math.random()*4-2);
    RATES.current.silver += dS;
    RATES.current.updatedAt = new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    RATES.current.source = 'API';
    RATES.history.unshift({ date:new Date().toISOString().slice(0,10), k22:RATES.current.k22, k24:RATES.current.k24, k18:RATES.current.k18, k14:RATES.current.k14, silver:RATES.current.silver, platinum:RATES.current.platinum, dollar:RATES.current.dollar, change22:delta, changeS:dS, by:'API Sync', source:'API' });
    renderLiveRates(); renderRateHistory();
    if(btn){ btn.textContent='🔄 Fetch Live Rates'; btn.disabled=false; }
    if(el){ el.textContent='✅ Live rates synced from MCX/IBJA — '+new Date().toLocaleTimeString('en-IN'); el.style.color='var(--success)'; }
    if(typeof updateGoldTicker==='function') updateGoldTicker();
    showToast(`Live rates synced! 22K: ₹${RATES.current.k22}/g (${delta>=0?'▲':'▼'} ₹${Math.abs(delta)})`,'success');
  }, 1600);
}

function initRatesModule() {
  renderLiveRates();
  renderRateHistory();
}

document.addEventListener('DOMContentLoaded', ()=>{
  const orig=window.showModule;
  if(typeof orig==='function'){
    window.showModule=function(m,n){ orig(m,n); if(m==='rates') setTimeout(initRatesModule,60); };
  }
  // also override app.js updateRates
  window.updateRates = function(){ saveManualRates(); };
});
