import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, DataTable, BtnPrimary, BtnOutline,
         Modal, FormGroup, FormGrid, Input, Select } from "../../components/ui";

export default function Advance({ t }) {
  const [modal, setModal] = useState(false);
  return (
    <div>
      <PageHeader title="Gold Rate Locking Engine"
        subtitle="Lock gold rates for advance orders — protect customer & shop"
        t={t} actions={<BtnPrimary onClick={() => setModal(true)}>Lock Rate for Order</BtnPrimary>} />

      <div style={{ background:`linear-gradient(135deg,${BRAND.blue}15,${BRAND.purple}10)`,
        border:`1px solid ${t.borderDash}`, borderRadius:12, padding:"18px 20px",
        marginBottom:22, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:28, fontWeight:900, color:BRAND.purple }}>—</div>
          <div style={{ fontSize:12, color:t.textMuted, marginTop:3 }}>Current 22K Rate (Will load from backend)</div>
        </div>
        <div style={{ fontSize:12, color:t.textSub, maxWidth:300, textAlign:"right", lineHeight:1.6 }}>
          Rate locking ensures customers pay today's rate on future delivery
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="Active Rate Locks"  color={BRAND.blue}   t={t} />
        <StatCard label="Total Orders"       color={BRAND.purple} t={t} />
        <StatCard label="Locked Value"       color="#f0c040"      t={t} />
        <StatCard label="Advance Collected"  color="#2ecc71"      t={t} />
      </div>

      <Card t={t}>
        <CardHeader title="Rate Lock Register" t={t} />
        <DataTable
          columns={["Order ID","Customer","Item","Locked Rate","Current Rate","P&L for Shop","Lock Date","Delivery","Status","Actions"]}
          t={t} emptyMsg="rate lock data will load from backend" />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Lock Gold Rate" t={t}
        footer={<><BtnOutline t={t} onClick={() => setModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setModal(false)}>Lock Rate</BtnPrimary></>}>
        <FormGrid>
          <FormGroup label="Order Reference" t={t} half>
            <Select t={t}><option>-- Select Order --</option></Select>
          </FormGroup>
          <FormGroup label="Rate to Lock (₹/g)" t={t} half><Input t={t} type="number" placeholder="Market rate" /></FormGroup>
          <FormGroup label="Valid Till"          t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Advance Paid (₹)"   t={t} half><Input t={t} type="number" placeholder="Min 25%" /></FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
