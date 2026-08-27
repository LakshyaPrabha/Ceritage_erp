import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select } from "../../components/ui";

const TABS = [
  { id:"bis",    label:"BIS Hallmark" },
  { id:"track",  label:"HUID Tracking" },
  { id:"verify", label:"Verification" },
  { id:"cert",   label:"Certificates" },
];

export default function Hallmark({ t }) {
  const [tab,      setTab]      = useState("bis");
  const [regModal, setRegModal] = useState(false);
  const [verInput, setVerInput] = useState("");
  const [verResult, setVerResult] = useState(null);

  return (
    <div>
      <PageHeader title="Hallmark & HUID Management"
        subtitle="BIS Hallmark · HUID Registration & Tracking · Verification · Certificate Generation"
        t={t}
        actions={<>
          <BtnOutline t={t}>Quick Verify</BtnOutline>
          <BtnOutline t={t}>Send to Centre</BtnOutline>
          <BtnPrimary onClick={() => setRegModal(true)}>Register HUID</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Registered"  color="#2ecc71"      t={t} />
        <StatCard label="Pending HUID" color="#f39c12"     t={t} />
        <StatCard label="At Centre"   color={BRAND.blue}   t={t} />
        <StatCard label="Sold Items"  color={BRAND.purple} t={t} />
        <StatCard label="Certificates" color={BRAND.pink}  t={t} />
        <StatCard label="Compliance"  color="#2ecc71"      t={t} />
      </div>

      {/* BIS Centre info */}
      <div style={{ background:`linear-gradient(135deg,${BRAND.blue}12,${BRAND.purple}08)`,
        border:`1px solid ${t.borderDash}`, borderRadius:12, padding:"14px 18px",
        marginBottom:20, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:14, color:t.text }}>BIS Hallmarking Centre — HM-MUM-142</div>
          <div style={{ fontSize:12, color:t.textMuted, marginTop:2 }}>
            BIS Centre Fort, Mumbai · Licence: BIS/HMK/MUM/2019/142
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <span style={{ background:BRAND.blue+"22", color:BRAND.blue,
            border:`1px solid ${BRAND.blue}44`, borderRadius:6,
            padding:"3px 10px", fontSize:11, fontWeight:600 }}>
            Licence Valid till Mar 2027
          </span>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "bis" && (
        <Card t={t}>
          <CardHeader title="BIS Hallmark Registry" t={t}
            actions={<>
              <input placeholder="Search HUID, SKU..." style={{
                background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                borderRadius:8, padding:"7px 12px", fontSize:13,
                color:t.inputColor, outline:"none", fontFamily:"inherit", width:180 }} />
              <Select t={t} style={{ width:140 }}>
                <option>All Status</option><option>Registered</option>
                <option>Pending</option><option>Sent to Centre</option>
              </Select>
              <Select t={t} style={{ width:130 }}>
                <option>All Purity</option><option>24K</option><option>22K</option><option>18K</option>
              </Select>
            </>} />
          <DataTable
            columns={["HUID","Product","Purity","Gross / Net Wt","Hallmark Date","BIS Reg Date","Centre","Branch","Status","Actions"]}
            t={t} emptyMsg="hallmark data will load from backend" />
        </Card>
      )}

      {tab === "track" && (
        <Card t={t}>
          <CardHeader title="HUID Lifecycle Tracker" t={t}
            actions={<><BtnSm t={t}>Export</BtnSm></>} />
          <DataTable
            columns={["HUID","Product","Purity","Net Wt","Hallmark Date","BIS Reg Date","Lifecycle","Branch","Sale Info","Actions"]}
            t={t} emptyMsg="HUID tracking data will load from backend" />
        </Card>
      )}

      {tab === "verify" && (
        <div>
          <Card t={t}>
            <CardHeader title="Live HUID Verifier" t={t} />
            <p style={{ fontSize:13, color:t.textMuted, marginBottom:14 }}>
              Enter a HUID code to instantly verify if a piece of jewelry is genuine BIS hallmarked gold.
            </p>
            <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
              <div style={{ flex:1 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:600, color:t.textSub,
                  marginBottom:6, textTransform:"uppercase", letterSpacing:"0.6px" }}>
                  Enter HUID / SKU
                </label>
                <Input t={t} placeholder="e.g. HM2026A001"
                  value={verInput}
                  onChange={(e) => setVerInput(e.target.value.toUpperCase())}
                  style={{ fontFamily:"monospace", letterSpacing:"1px" }} />
              </div>
              <BtnPrimary onClick={() => setVerResult(verInput ? "pending" : null)}>
                Verify Now
              </BtnPrimary>
              <BtnOutline t={t} onClick={() => { setVerInput(""); setVerResult(null); }}>Clear</BtnOutline>
            </div>
            {verResult && (
              <div style={{ marginTop:16, padding:14, borderRadius:10,
                background:`rgba(59,85,230,0.08)`, border:`1px solid ${BRAND.blue}44`,
                fontSize:13, color:t.textSub }}>
                verification result aayega
              </div>
            )}
          </Card>
          <Card t={t}>
            <CardHeader title="Verification Log" t={t} />
            <DataTable
              columns={["Verify ID","HUID","Product","Verified By","Date","Method","Result","Remarks"]}
              t={t} emptyMsg="verification log will load from backend" />
          </Card>
        </div>
      )}

      {tab === "cert" && (
        <Card t={t}>
          <CardHeader title="Hallmark Certificate Registry" t={t}
            actions={<><BtnSm t={t}>Export</BtnSm><BtnSm t={t} primary onClick={() => setRegModal(true)}>+ New Certificate</BtnSm></>} />
          <DataTable
            columns={["Cert ID","HUID","Product","Purity","Weight","Issue Date","BIS Centre","Customer / Invoice","Status","Actions"]}
            t={t} emptyMsg="certificates will load from backend" />
        </Card>
      )}

      {/* Register HUID Modal */}
      <Modal open={regModal} onClose={() => setRegModal(false)}
        title="Register New HUID" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setRegModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setRegModal(false)}>Register HUID</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="SKU / Product Code *" t={t} half><Input t={t} placeholder="e.g. BG-GLD-005" /></FormGroup>
          <FormGroup label="HUID (6-char) *" t={t} half>
            <div style={{ display:"flex", gap:8 }}>
              <Input t={t} placeholder="e.g. HM2026X123" style={{ fontFamily:"monospace" }} />
              <BtnSm t={t}>Generate</BtnSm>
            </div>
          </FormGroup>
          <FormGroup label="Hallmark Date *" t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="BIS Centre" t={t} half>
            <Select t={t}><option>HM-MUM-142 — BIS Fort Mumbai</option><option>HM-DEL-088 — BIS Karol Bagh Delhi</option></Select>
          </FormGroup>
          <FormGroup label="Purity Mark" t={t} half>
            <Select t={t}><option>22K (916)</option><option>24K (999)</option><option>18K (750)</option></Select>
          </FormGroup>
          <FormGroup label="Net Weight (g)" t={t} half><Input t={t} type="number" step="0.001" placeholder="0.000" /></FormGroup>
          <FormGroup label="Assessor Name"  t={t} half><Input t={t} placeholder="Assessor name" /></FormGroup>
          <FormGroup label="Assessor ID"    t={t} half><Input t={t} placeholder="BIS-ASM-XXXX" /></FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
