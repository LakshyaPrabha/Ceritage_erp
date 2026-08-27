import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, FormGroup, FormGrid, Input, Select } from "../../components/ui";

const TABS = [
  { id:"overview",  label:"Overview" },
  { id:"billing",   label:"GST Billing" },
  { id:"returns",   label:"GST Returns" },
  { id:"hsn",       label:"HSN Codes" },
  { id:"calc",      label:"Tax Calculation" },
  { id:"einvoice",  label:"E-Invoice" },
  { id:"eway",      label:"E-Way Bill" },
];

export default function Gst({ t }) {
  const [tab, setTab] = useState("overview");

  return (
    <div>
      <PageHeader title="GST & Taxation"
        subtitle="GST Billing · Returns · HSN Codes · Tax Calculation · E-Invoice · E-Way Bill"
        t={t}
        actions={<>
          <BtnOutline t={t}>Export</BtnOutline>
          <BtnPrimary>File GSTR</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="GST Collected"   color={BRAND.blue}   t={t} />
        <StatCard label="Input Tax Credit" color="#2ecc71"     t={t} />
        <StatCard label="Net Tax Payable" color={BRAND.pink}   t={t} />
        <StatCard label="Last Filed"      color={BRAND.purple} t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "overview" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="GST Filing Calendar" t={t} />
            <DataTable
              columns={["Return","Period","Due Date","Status","Action"]}
              t={t} emptyMsg="filing calendar will load from backend" />
          </Card>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="HSN Summary (Jewelry)" t={t} />
            <DataTable
              columns={["HSN","Description","GST %","Sales (₹)"]}
              t={t} emptyMsg="HSN summary will load from backend" />
          </Card>
        </div>
      )}

      {tab === "returns" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Card t={t} style={{ marginBottom:0 }}>
              <CardHeader title="GSTR-1 — Outward Supplies" t={t}
                actions={<BtnSm t={t}>Export</BtnSm>} />
              <DataTable
                columns={["Invoice No","Date","Customer GSTIN","Taxable (₹)","CGST","SGST","Total"]}
                t={t} emptyMsg="GSTR-1 data will load from backend" />
            </Card>
            <Card t={t} style={{ marginBottom:0 }}>
              <CardHeader title="GSTR-3B — Summary" t={t} />
              <div style={{ padding:"16px" }}>
                {[["(3.1) Outward taxable supplies","—"],["(4) Inward supplies (ITC eligible)","—"],
                  ["(5) ITC Available","—"],["Net Tax Payable","—"]].map(([k,v]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between",
                    padding:"9px 0", borderBottom:`1px solid ${t.borderDash}`, fontSize:13 }}>
                    <span style={{ color:t.textSub }}>{k}</span>
                    <span style={{ fontWeight:700, color:BRAND.purple }}>{v}</span>
                  </div>
                ))}
                <div style={{ display:"flex", gap:10, marginTop:16 }}>
                  <BtnPrimary style={{ flex:1 }}>File GSTR-3B</BtnPrimary>
                  <BtnOutline t={t}>Print 3B</BtnOutline>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "hsn" && (
        <Card t={t}>
          <CardHeader title="HSN Code Management" t={t}
            actions={<BtnSm t={t} primary>+ Add HSN Code</BtnSm>} />
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
            {["All","Jewelry","Diamond","Gemstone","Service"].map((c) => (
              <button key={c} style={{ padding:"5px 12px", borderRadius:20, cursor:"pointer",
                fontSize:12, fontFamily:"inherit", background: c==="All" ? BRAND.gradBtn : "none",
                color: c==="All" ? "#fff" : t.textSub,
                border: c==="All" ? "none" : `1px solid ${t.borderDash}` }}>{c}</button>
            ))}
          </div>
          <DataTable
            columns={["HSN Code","Description","Category","GST Rate","CGST","SGST","Products","Status","Actions"]}
            t={t} emptyMsg="HSN codes will load from backend" />
        </Card>
      )}

      {tab === "calc" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="GST Tax Calculator" t={t} />
            <FormGrid>
              <FormGroup label="Item Type" t={t}>
                <Select t={t}>
                  <option>Gold / Silver Jewelry (7113) — 3%</option>
                  <option>Diamond — Unset (7102) — 0.25%</option>
                  <option>Gemstone — Unset (7103) — 0.25%</option>
                  <option>Repair / Making Charges — 18%</option>
                </Select>
              </FormGroup>
              <FormGroup label="Transaction Type" t={t}>
                <Select t={t}><option>Intra-State (CGST + SGST)</option><option>Inter-State (IGST)</option></Select>
              </FormGroup>
              <FormGroup label="Taxable Value (₹)" t={t}>
                <Input t={t} type="number" placeholder="Enter amount before tax" />
              </FormGroup>
            </FormGrid>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:14 }}>
              {[["Taxable Value","—"],["CGST","—"],["SGST / IGST","—"],["Total (incl. tax)","—"]].map(([l,v]) => (
                <div key={l} style={{ background:t.card2||t.card, border:`1px solid ${t.borderDash}`,
                  borderRadius:9, padding:10, textAlign:"center" }}>
                  <div style={{ fontSize:10, color:t.textFaint, marginBottom:4 }}>{l}</div>
                  <div style={{ fontWeight:800, color:BRAND.purple }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Jewelry GST Rates" t={t} />
            {[["Gold/Silver Jewelry (7113)","3% GST"],
              ["Diamonds unset (7102)","0.25% GST"],
              ["Gemstones unset (7103)","0.25% GST"],
              ["Imitation jewelry (7116)","3% GST"],
              ["Repair services","18% GST"]].map(([item, rate]) => (
              <div key={item} style={{ display:"flex", justifyContent:"space-between",
                padding:"10px 12px", background:t.card2||t.card,
                border:`1px solid ${t.borderDash}`, borderRadius:8, marginBottom:8, fontSize:13 }}>
                <span style={{ color:t.textSub }}>{item}</span>
                <span style={{ fontWeight:700, color:BRAND.purple }}>{rate}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "einvoice" && (
        <Card t={t}>
          <CardHeader title="E-Invoice (IRN) — B2B Invoices" t={t}
            actions={<BtnSm t={t} primary>Generate IRN</BtnSm>} />
          <div style={{ fontSize:12, color:t.textMuted, marginBottom:14 }}>
            E-Invoice mandatory for businesses with turnover &gt; ₹5 Cr (B2B). Generates IRN via GSTN/NIC portal.
          </div>
          <DataTable
            columns={["Invoice No","Date","Customer","GSTIN","Amount","IRN","Status","Actions"]}
            t={t} emptyMsg="E-Invoice data will load from backend" />
        </Card>
      )}

      {tab === "eway" && (
        <Card t={t}>
          <CardHeader title="E-Way Bill — Goods movement >₹50,000" t={t}
            actions={<BtnPrimary>Generate E-Way Bill</BtnPrimary>} />
          <div style={{ fontSize:12, color:t.textMuted, marginBottom:14 }}>
            E-Way Bill required when goods value exceeds ₹50,000 for inter-state or intra-state movement.
          </div>
          <DataTable
            columns={["E-Way Bill No","Date","Invoice","From → To","Goods Value","Vehicle No","Valid Till","Status","Actions"]}
            t={t} emptyMsg="E-Way Bills will load from backend" />
        </Card>
      )}

      {tab === "billing" && (
        <Card t={t}>
          <CardHeader title="GST Tax Invoice" t={t}
            actions={<><BtnSm t={t} primary>+ Add Item</BtnSm><BtnSm t={t}>Save Invoice</BtnSm></>} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
            <FormGroup label="Invoice No" t={t}><Input t={t} placeholder="Auto-generated" readOnly style={{ opacity:0.7 }} /></FormGroup>
            <FormGroup label="Date"       t={t}><Input t={t} type="date" /></FormGroup>
            <FormGroup label="Customer *" t={t}><Select t={t}><option>-- Select Customer --</option></Select></FormGroup>
            <FormGroup label="Transaction Type" t={t}>
              <Select t={t}><option>Intra-State (CGST + SGST)</option><option>Inter-State (IGST)</option></Select>
            </FormGroup>
          </div>
          <DataTable
            columns={["Item","HSN","Wt (g)","Rate","Making","GST %","Taxable","CGST","SGST/IGST","Amount",""]}
            t={t} emptyMsg="Items add karo" />
        </Card>
      )}
    </div>
  );
}
