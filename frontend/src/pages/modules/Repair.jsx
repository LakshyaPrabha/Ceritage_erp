import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid,
         Input, Select, SectionTitle } from "../../components/ui";

const STATUS_PILLS = ["All","Pending","In Progress","Ready","Overdue","Delivered"];

export default function Repair({ t }) {
  const [status,   setStatus]   = useState("All");
  const [addModal, setAddModal] = useState(false);

  return (
    <div>
      <PageHeader title="Repair Job Card"
        subtitle="Repair Entry · Job Card · Status · Charges · Delivery Tracking · Customer Notification"
        t={t}
        actions={<>
          <BtnOutline t={t}>Notify All Ready</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(true)}>+ New Job Card</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Pending / In Progress" color={BRAND.pink}   t={t} />
        <StatCard label="Ready for Delivery"    color="#2ecc71"      t={t} />
        <StatCard label="Overdue"               color="#e74c3c"      t={t} />
        <StatCard label="Advance Collected"     color={BRAND.purple} t={t} />
      </div>

      {/* Status filter */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:18 }}>
        {STATUS_PILLS.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            style={{ padding:"6px 16px", borderRadius:20, cursor:"pointer",
              fontSize:12, fontWeight:600, fontFamily:"inherit",
              background: status === s ? BRAND.gradBtn : "none",
              color: status === s ? "#fff" : t.textSub,
              border: status === s ? "none" : `1px solid ${t.borderDash}` }}>
            {s}
          </button>
        ))}
        <div style={{ marginLeft:"auto" }}>
          <input placeholder="Search job ID, customer..." style={{
            background:t.inputBg, border:`1px solid ${t.inputBorder}`,
            borderRadius:8, padding:"6px 12px", fontSize:13,
            color:t.inputColor, outline:"none", fontFamily:"inherit", width:220 }} />
        </div>
      </div>

      <Card t={t}>
        <CardHeader title="Repair Job Cards" t={t}
          actions={<BtnSm t={t}>Export</BtnSm>} />
        <DataTable
          columns={["Job ID","Customer","Item / Issue","Type","Karigar","Received","Due Date","Status","Total","Advance","Balance","Actions"]}
          t={t} emptyMsg="repair jobs will load from backend" />
      </Card>

      {/* Add Repair Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)}
        title="New Repair Job Card" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(false)}>Create Job Card</BtnPrimary>
        </>}>
        <SectionTitle t={t}>Customer Info</SectionTitle>
        <FormGrid>
          <FormGroup label="Customer *" t={t} half>
            <Select t={t}><option>-- Select Customer --</option><option>Walk-in Customer</option></Select>
          </FormGroup>
          <FormGroup label="Phone" t={t} half><Input t={t} placeholder="Contact number" /></FormGroup>
        </FormGrid>
        <SectionTitle t={t}>Item Details</SectionTitle>
        <FormGrid>
          <FormGroup label="Item Description *" t={t}>
            <Input t={t} placeholder="e.g. Gold necklace, Diamond ring..." />
          </FormGroup>
          <FormGroup label="Issue / Work Required *" t={t}>
            <Input t={t} placeholder="Describe the repair needed" />
          </FormGroup>
          <FormGroup label="Item Type" t={t} half>
            <Select t={t}><option>Necklace</option><option>Ring</option><option>Bangles</option>
              <option>Earrings</option><option>Chain</option><option>Other</option></Select>
          </FormGroup>
          <FormGroup label="Metal" t={t} half>
            <Select t={t}><option>22K Gold</option><option>18K Gold</option><option>Silver</option><option>Platinum</option></Select>
          </FormGroup>
          <FormGroup label="Item Weight (g)" t={t} half><Input t={t} type="number" step="0.001" placeholder="0.000" /></FormGroup>
        </FormGrid>
        <SectionTitle t={t}>Workshop</SectionTitle>
        <FormGrid>
          <FormGroup label="Assign Karigar" t={t} half>
            <Select t={t}><option>-- Select Karigar --</option></Select>
          </FormGroup>
          <FormGroup label="Promised Delivery Date *" t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Estimate (₹)" t={t} half><Input t={t} type="number" placeholder="0" /></FormGroup>
          <FormGroup label="Advance Collected (₹)" t={t} half><Input t={t} type="number" placeholder="0" /></FormGroup>
          <FormGroup label="Special Instructions" t={t}>
            <Input t={t} placeholder="Design notes, customer preferences, stone details..." />
          </FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
