import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, FormGroup, FormGrid, Input, Select } from "../../components/ui";

const TABS = [
  { id:"calc",    label:"Exchange Calculator" },
  { id:"list",    label:"Exchange Register" },
  { id:"purity",  label:"Purity Calculator" },
  { id:"melt",    label:"Melting Calculator" },
];

const PURITY_CHART = [
  { karat:"24K", fineness:"999", pct:"99.9%", use:"Coins, Bullion, Investment" },
  { karat:"22K", fineness:"916", pct:"91.6%", use:"Indian Jewelry (most common)" },
  { karat:"18K", fineness:"750", pct:"75.0%", use:"Diamond Jewelry, Western" },
  { karat:"14K", fineness:"583", pct:"58.3%", use:"Export Jewelry" },
  { karat:"10K", fineness:"417", pct:"41.7%", use:"Fashion Jewelry" },
  { karat:"Silver 925", fineness:"925", pct:"92.5%", use:"Sterling Silver" },
];

export default function GoldExchange({ t }) {
  const [tab, setTab] = useState("calc");

  return (
    <div>
      <PageHeader title="Gold & Silver Exchange"
        subtitle="Old Gold · Silver · Melting Calculation · Purity · Exchange Billing"
        t={t}
        actions={<>
          <BtnOutline t={t}>Export</BtnOutline>
          <BtnPrimary>New Exchange</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Total Exchanges"     color={BRAND.blue}   t={t} />
        <StatCard label="Fine Gold Received"  color="#f0c040"      t={t} />
        <StatCard label="Fine Silver Received" color="#95a5a6"     t={t} />
        <StatCard label="Total Value Given"   color="#2ecc71"      t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "calc" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Exchange Entry" t={t} />
            <FormGrid>
              <FormGroup label="Customer" t={t}>
                <Select t={t}><option>Walk-in Customer</option></Select>
              </FormGroup>
              <FormGroup label="Metal Type" t={t} half>
                <Select t={t}><option>Gold</option><option>Silver</option></Select>
              </FormGroup>
              <FormGroup label="Item Description *" t={t}>
                <Input t={t} placeholder="e.g. Old gold bangle, broken chain..." />
              </FormGroup>
              <FormGroup label="Gross Weight (g) *" t={t} half><Input t={t} type="number" step="0.001" placeholder="0.000" /></FormGroup>
              <FormGroup label="Stone / Deduction Wt (g)" t={t} half><Input t={t} type="number" step="0.001" defaultValue="0" /></FormGroup>
              <FormGroup label="Declared Purity" t={t} half>
                <Select t={t}>
                  <option value="0.9167">22K (91.67%)</option>
                  <option value="0.75">18K (75%)</option>
                  <option value="0.583">14K (58.3%)</option>
                  <option value="0.999">24K (99.9%)</option>
                  <option value="0.925">Silver 925 (92.5%)</option>
                </Select>
              </FormGroup>
              <FormGroup label="Current Rate (₹/g)" t={t} half><Input t={t} type="number" placeholder="Market rate" /></FormGroup>
              <FormGroup label="Wastage / Deduction (%)" t={t} half><Input t={t} type="number" defaultValue="0" step="0.1" /></FormGroup>
              <FormGroup label="Exchange For" t={t} half>
                <Select t={t}><option>New Purchase</option><option>Cash Payout</option><option>Store Credit</option></Select>
              </FormGroup>
            </FormGrid>
            <div style={{ display:"flex", gap:10, marginTop:8 }}>
              <BtnOutline t={t}>Calculate</BtnOutline>
              <BtnPrimary style={{ flex:1 }}>Confirm Exchange</BtnPrimary>
              <BtnOutline t={t}>Print Slip</BtnOutline>
            </div>
          </Card>

          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Valuation Result" t={t} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              {[["Net Weight","—"],["Purity %","—"],["Fine Metal Weight","—"],["Base Value","—"]].map(([l,v]) => (
                <div key={l} style={{ background:t.card2||t.card,
                  border:`1px solid ${t.borderDash}`, borderRadius:9,
                  padding:12, textAlign:"center" }}>
                  <div style={{ fontSize:10, color:t.textFaint, marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:16, fontWeight:800, color:BRAND.purple }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:`linear-gradient(135deg,${BRAND.blue}22,${BRAND.purple}11)`,
              border:`1px solid ${t.borderDash}`, borderRadius:12,
              padding:20, textAlign:"center" }}>
              <div style={{ fontSize:11, color:t.textFaint, marginBottom:6 }}>EXCHANGE VALUE</div>
              <div style={{ fontSize:32, fontWeight:900, color:BRAND.purple }}>₹0</div>
              <div style={{ fontSize:11, color:t.textFaint, marginTop:4 }}>Amount to be given to customer</div>
            </div>
            <div style={{ marginTop:12, background:t.card2||t.card,
              border:`1px solid ${t.borderDash}`, borderRadius:9, padding:12 }}>
              <div style={{ fontSize:11, color:t.textMuted }}>
                Gold Members get <strong style={{ color:"#2ecc71" }}>₹200/g bonus</strong>
                &nbsp;· Platinum: <strong style={{ color:BRAND.purple }}>₹400/g bonus</strong>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "list" && (
        <Card t={t}>
          <CardHeader title="Exchange Register" t={t}
            actions={<BtnSm t={t}>Export</BtnSm>} />
          <DataTable
            columns={["ID","Date","Customer","Item","Metal","Gross Wt","Fine Wt","Rate","Value","Exchange For","Status","Actions"]}
            t={t} emptyMsg="exchange data will load from backend" />
        </Card>
      )}

      {tab === "purity" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Purity Calculator" t={t} />
            <FormGrid>
              <FormGroup label="Karat / Fineness" t={t}>
                <Select t={t}>
                  <option value="24">24K (999)</option><option value="22">22K (916)</option>
                  <option value="18">18K (750)</option><option value="14">14K (583)</option>
                </Select>
              </FormGroup>
              <FormGroup label="Gross Weight (g)" t={t}>
                <Input t={t} type="number" step="0.001" placeholder="0.000" />
              </FormGroup>
            </FormGrid>
            <BtnPrimary style={{ width:"100%", marginBottom:14 }}>Calculate Purity</BtnPrimary>
            {[["Purity %","—"],["Fine Gold Weight","—"],["Alloy Weight","—"],["Approx Value","—"]].map(([l,v]) => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between",
                padding:"9px 12px", background:t.card2||t.card,
                border:`1px solid ${t.borderDash}`, borderRadius:8, marginBottom:8 }}>
                <span style={{ color:t.textMuted, fontSize:13 }}>{l}</span>
                <span style={{ fontWeight:700, color:BRAND.purple }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Purity Reference Chart" t={t} />
            <DataTable
              columns={["Karat","Fineness","Purity %","Applications"]}
              rows={PURITY_CHART.map(p => ({
                "Karat":p.karat, "Fineness":p.fineness,
                "Purity %":p.pct, "Applications":p.use
              }))}
              t={t} />
          </Card>
        </div>
      )}

      {tab === "melt" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Melting Calculation" t={t} />
            <FormGrid>
              <FormGroup label="Input Metal Purity" t={t}>
                <Select t={t}><option>22K (91.67%)</option><option>18K (75%)</option><option>24K (99.9%)</option></Select>
              </FormGroup>
              <FormGroup label="Input Weight (g)" t={t}>
                <Input t={t} type="number" step="0.001" placeholder="0.000" />
              </FormGroup>
              <FormGroup label="Target Purity (Output)" t={t}>
                <Select t={t}><option>22K (91.67%)</option><option>18K (75%)</option><option>24K (99.9%)</option></Select>
              </FormGroup>
              <FormGroup label="Melting Loss % (Wastage)" t={t}>
                <Input t={t} type="number" defaultValue="1.5" step="0.1" />
              </FormGroup>
            </FormGrid>
            <BtnPrimary style={{ width:"100%" }}>Calculate Melting</BtnPrimary>
          </Card>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Melting Reference" t={t} />
            {[["Plain Gold Items","0.5% – 1.0%"],["Hallmarked Gold","0.3% – 0.8%"],
              ["Stone-set Items","1.5% – 3.0%"],["Old / Unknown Purity","2.0% – 5.0%"],
              ["Silver Items","0.5% – 1.5%"]].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between",
                padding:"9px 12px", background:t.card2||t.card,
                border:`1px solid ${t.borderDash}`, borderRadius:8, marginBottom:8, fontSize:13 }}>
                <span style={{ color:t.textSub }}>{k}</span>
                <span style={{ fontWeight:700, color:BRAND.purple }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
