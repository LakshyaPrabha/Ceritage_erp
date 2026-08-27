import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, FormGroup, FormGrid, Input, Select } from "../../components/ui";

const TABS = [
  { id:"manual",  label:"Manual Update" },
  { id:"api",     label:"Live API" },
  { id:"history", label:"Rate History" },
  { id:"alerts",  label:"Rate Alerts" },
];

const METALS = [
  { id:"k22", label:"22K Gold (₹/g)", color:BRAND.blue },
  { id:"k24", label:"24K Gold (₹/g)", color:BRAND.purple },
  { id:"k18", label:"18K Gold (₹/g)", color:"#3498db" },
  { id:"k14", label:"14K Gold (₹/g)", color:BRAND.pink },
  { id:"silver", label:"Silver (₹/g)", color:"#95a5a6" },
  { id:"platinum", label:"Platinum (₹/g)", color:"#bdc3c7" },
  { id:"dollar", label:"USD/INR", color:"#2ecc71" },
];

export default function Rates({ t }) {
  const [tab, setTab] = useState("manual");

  return (
    <div>
      <PageHeader title="Daily Gold & Silver Rates"
        subtitle="Live rates · Manual update · Platinum · Rate history · API sync"
        t={t}
        actions={<>
          <BtnOutline t={t}>Fetch Live Rates</BtnOutline>
          <BtnPrimary>Update All Rates</BtnPrimary>
        </>} />

      {/* Live rate cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",
        gap:12, marginBottom:22 }}>
        {METALS.map((m) => (
          <div key={m.id} style={{ background:t.card, border:`1px solid ${t.borderDash}`,
            borderRadius:12, padding:"14px 16px",
            boxShadow:t.cardShadow }}>
            <div style={{ fontSize:10, color:t.textMuted, textTransform:"uppercase",
              letterSpacing:"0.7px", marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:20, fontWeight:900, color:m.color }}>—</div>
            <div style={{ fontSize:11, color:t.textFaint, marginTop:3 }}>Will load from backend</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize:12, color:t.textMuted, marginBottom:18 }}>
        Last updated: <span style={{ color:BRAND.purple, fontWeight:600 }}>—</span>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "manual" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Gold Rate Update" t={t} />
            <FormGrid>
              <FormGroup label="22K Gold (₹/g) *" t={t} half><Input t={t} type="number" step="0.01" placeholder="0.00" /></FormGroup>
              <FormGroup label="24K Gold (₹/g) *" t={t} half><Input t={t} type="number" step="0.01" placeholder="0.00" /></FormGroup>
              <FormGroup label="18K Gold (₹/g)"   t={t} half><Input t={t} type="number" step="0.01" placeholder="0.00" /></FormGroup>
              <FormGroup label="14K Gold (₹/g)"   t={t} half><Input t={t} type="number" step="0.01" placeholder="0.00" /></FormGroup>
              <FormGroup label="Silver (₹/g) *"   t={t} half><Input t={t} type="number" step="0.01" placeholder="0.00" /></FormGroup>
              <FormGroup label="Platinum (₹/g)"   t={t} half><Input t={t} type="number" step="0.01" placeholder="0.00" /></FormGroup>
              <FormGroup label="USD/INR"           t={t} half><Input t={t} type="number" step="0.01" placeholder="0.00" /></FormGroup>
              <FormGroup label="Effective Date"    t={t} half><Input t={t} type="date" /></FormGroup>
              <FormGroup label="Remarks (optional)" t={t}><Input t={t} placeholder="Source — IBJA / MCX / Other..." /></FormGroup>
            </FormGrid>
            <div style={{ display:"flex", gap:10, marginTop:8 }}>
              <BtnOutline t={t}>Reset</BtnOutline>
              <BtnPrimary style={{ flex:1 }}>Update All Rates</BtnPrimary>
            </div>
          </Card>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Quick Rate Calculator" t={t} />
            <div style={{ background:t.card2||t.card, borderRadius:9,
              border:`1px solid ${t.borderDash}`, padding:14, marginBottom:14 }}>
              <div style={{ fontSize:12, color:t.textMuted, marginBottom:10 }}>Gold Value Calculator</div>
              <FormGrid>
                <FormGroup label="Weight (g)" t={t} half><Input t={t} type="number" step="0.001" placeholder="0.000" /></FormGroup>
                <FormGroup label="Purity" t={t} half>
                  <Select t={t}>
                    <option value="0.9167">22K</option><option value="0.999">24K</option>
                    <option value="0.75">18K</option><option value="0.583">14K</option>
                  </Select>
                </FormGroup>
              </FormGrid>
              <div style={{ background:`linear-gradient(135deg,${BRAND.blue}22,${BRAND.purple}11)`,
                borderRadius:8, padding:"12px 16px", textAlign:"center", marginTop:10 }}>
                <div style={{ fontSize:11, color:t.textFaint }}>Fine Metal Value</div>
                <div style={{ fontSize:22, fontWeight:900, color:BRAND.purple }}>—</div>
              </div>
            </div>
            <div style={{ background:t.card2||t.card, borderRadius:9,
              border:`1px solid ${t.borderDash}`, padding:14 }}>
              <div style={{ fontSize:12, color:t.textMuted, marginBottom:10 }}>Making Charges Preview</div>
              <FormGrid>
                <FormGroup label="Making ₹/g" t={t} half><Input t={t} type="number" placeholder="0" /></FormGroup>
                <FormGroup label="Weight (g)"  t={t} half><Input t={t} type="number" placeholder="0" /></FormGroup>
              </FormGrid>
              <div style={{ fontSize:13, marginTop:8, color:t.textSub }}>
                Making Charges: <span style={{ fontWeight:700, color:BRAND.purple }}>—</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "api" && (
        <Card t={t}>
          <CardHeader title="Live Rate API Integration" t={t} />
          <FormGrid>
            <FormGroup label="API Provider" t={t} half>
              <Select t={t}><option>MCX</option><option>IBJA</option><option>MMTC-PAMP</option><option>Custom API</option></Select>
            </FormGroup>
            <FormGroup label="API Key" t={t} half><Input t={t} type="password" placeholder="Enter API key" /></FormGroup>
            <FormGroup label="Auto-Update Time" t={t} half><Input t={t} type="time" defaultValue="09:00" /></FormGroup>
          </FormGrid>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <BtnOutline t={t}>Test Connection</BtnOutline>
            <BtnPrimary>Fetch Now</BtnPrimary>
            <BtnOutline t={t}>Save Settings</BtnOutline>
          </div>
        </Card>
      )}

      {tab === "history" && (
        <Card t={t}>
          <CardHeader title="Rate History — Last 30 Days" t={t}
            actions={<><BtnOutline t={t} style={{padding:"5px 12px",fontSize:12}}>7D</BtnOutline>
              <BtnOutline t={t} style={{padding:"5px 12px",fontSize:12}}>30D</BtnOutline>
              <BtnPrimary style={{padding:"5px 12px",fontSize:12}}>All</BtnPrimary>
              <BtnOutline t={t} style={{padding:"5px 12px",fontSize:12}}>Export</BtnOutline>
            </>} />
          <DataTable
            columns={["Date","22K ₹/g","24K ₹/g","18K ₹/g","Silver ₹/g","Platinum","USD/INR","Gold Chg","Source","Updated By"]}
            t={t} emptyMsg="rate history will load from backend" />
        </Card>
      )}

      {tab === "alerts" && (
        <Card t={t}>
          <CardHeader title="Rate Alert Settings" t={t} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:BRAND.purple,
                textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:12 }}>
                Gold Rate Alerts
              </div>
              <FormGrid>
                <FormGroup label="Alert if 22K falls below" t={t} half><Input t={t} type="number" placeholder="₹/g" /></FormGroup>
                <FormGroup label="Alert if 22K rises above" t={t} half><Input t={t} type="number" placeholder="₹/g" /></FormGroup>
                <FormGroup label="Alert if Silver falls below" t={t} half><Input t={t} type="number" placeholder="₹/g" /></FormGroup>
                <FormGroup label="Alert if Silver rises above" t={t} half><Input t={t} type="number" placeholder="₹/g" /></FormGroup>
              </FormGrid>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:BRAND.purple,
                textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:12 }}>
                Notification Settings
              </div>
              {["WhatsApp Alert to Owner","SMS Alert","Daily Rate Morning Update",
                "Alert Customers on Big Changes (>₹100)","Auto-update Pricing on Rate Change"].map((item) => (
                <div key={item} style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", marginBottom:14 }}>
                  <span style={{ fontSize:13, color:t.textSub }}>{item}</span>
                  <div style={{ width:40, height:22, borderRadius:11,
                    background:BRAND.gradBtn, cursor:"pointer",
                    position:"relative" }}>
                    <div style={{ position:"absolute", right:3, top:3,
                      width:16, height:16, borderRadius:"50%", background:"#fff" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <BtnPrimary style={{ marginTop:8 }}>Save Settings</BtnPrimary>
        </Card>
      )}
    </div>
  );
}
