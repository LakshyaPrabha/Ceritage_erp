import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, DataTable, BtnPrimary, BtnOutline,
         Modal, FormGroup, FormGrid, Input, Select } from "../../components/ui";

export default function Jangad({ t }) {
  const [modal, setModal] = useState(false);
  return (
    <div>
      <PageHeader title="Jangad & Approval Management"
        subtitle="Home selection / on-approval jewelry tracking"
        t={t} actions={<BtnPrimary onClick={() => setModal(true)}>+ Issue Jangad</BtnPrimary>} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="Active Jangads"  color={BRAND.blue}   t={t} />
        <StatCard label="Items Out"       color={BRAND.purple} t={t} />
        <StatCard label="Value at Risk"   color="#f0c040"      t={t} />
        <StatCard label="Overdue Returns" color={BRAND.pink}   t={t} />
      </div>
      <Card t={t}>
        <CardHeader title="Jangad Register" t={t} />
        <DataTable columns={["Jangad ID","Customer","Items","Value","Issued On","Return By","Status","Actions"]}
          t={t} emptyMsg="jangad data will load from backend" />
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="Issue Jangad" t={t}
        footer={<><BtnOutline t={t} onClick={() => setModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setModal(false)}>Issue</BtnPrimary></>}>
        <FormGrid>
          <FormGroup label="Customer *"          t={t} half><Select t={t}><option>-- Select --</option></Select></FormGroup>
          <FormGroup label="Issue Date"          t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Return By Date *"    t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Advance / Security"  t={t} half><Input t={t} type="number" placeholder="₹0" /></FormGroup>
          <FormGroup label="Items Description"   t={t}><Input t={t} placeholder="List all items with SKU codes" /></FormGroup>
          <FormGroup label="Total Value (₹)"     t={t} half><Input t={t} type="number" placeholder="0" /></FormGroup>
          <FormGroup label="Witness / Staff"     t={t} half><Select t={t}><option>-- Select --</option></Select></FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
