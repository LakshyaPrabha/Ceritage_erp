import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select } from "../../components/ui";

const TABS = [
  { id:"credit",  label:"Credit Sales" },
  { id:"plans",   label:"EMI Plans" },
  { id:"due",     label:"Due Reminders" },
  { id:"track",   label:"Payment Tracking" },
  { id:"report",  label:"Outstanding Report" },
];

export default function Emi({ t }) {
  const [tab,      setTab]      = useState("credit");
  const [planModal, setPlanModal] = useState(false);

  return (
    <div>
      <PageHeader title="EMI & Credit Management"
        subtitle="Credit Sales · EMI Plans · Installment Schedule · Due Reminders · Payment Tracking"
        t={t}
        actions={<>
          <BtnOutline t={t}>Bulk Remind</BtnOutline>
          <BtnOutline t={t}>New Credit Sale</BtnOutline>
          <BtnPrimary onClick={() => setPlanModal(true)}>+ New EMI Plan</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Active EMI Plans"   color={BRAND.blue}   t={t} />
        <StatCard label="EMI Outstanding"    color="#f0c040"      t={t} />
        <StatCard label="Due Today"          color="#f39c12"      t={t} />
        <StatCard label="Overdue Plans"      color="#e74c3c"      t={t} />
        <StatCard label="Active Credits"     color={BRAND.purple} t={t} />
        <StatCard label="Credit Overdue"     color={BRAND.pink}   t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "credit" && (
        <Card t={t}>
          <CardHeader title="Credit Sales Register" t={t}
            actions={<><BtnSm t={t}>Export</BtnSm><BtnSm t={t} primary>+ New Credit Sale</BtnSm></>} />
          <DataTable
            columns={["ID","Customer","Invoice","Item","Date","Amount","Paid","Balance","Credit Days","Due Date","Days Left","Status","Actions"]}
            t={t} emptyMsg="credit sales will load from backend" />
        </Card>
      )}

      {tab === "plans" && (
        <Card t={t}>
          <CardHeader title="Active EMI Plans" t={t}
            actions={<><BtnSm t={t}>Export</BtnSm><BtnSm t={t} primary onClick={() => setPlanModal(true)}>+ New Plan</BtnSm></>} />
          <DataTable
            columns={["Plan ID","Customer","Invoice","Item","Total","Down Pay","EMI/Month","Progress","Remaining","Next Due","Finance","Status","Actions"]}
            t={t} emptyMsg="EMI plans will load from backend" />
        </Card>
      )}

      {tab === "due" && (
        <div>
          <div style={{ background:`rgba(230,59,138,0.08)`, border:`1px solid rgba(230,59,138,0.2)`,
            borderRadius:10, padding:14, marginBottom:16,
            display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:t.text }}>Upcoming & Overdue Dues</div>
              <div style={{ fontSize:12, color:t.textMuted, marginTop:3 }}>Sorted by urgency</div>
            </div>
            <BtnPrimary>Send All Reminders</BtnPrimary>
          </div>
          <Card t={t}>
            <CardHeader title="Due Reminder List" t={t} />
            <DataTable
              columns={["Type","Customer","Reference","Amount Due","Due Date","Days","Status","Actions"]}
              t={t} emptyMsg="due reminders will load from backend" />
          </Card>
        </div>
      )}

      {tab === "track" && (
        <Card t={t}>
          <CardHeader title="Payment Collection Log" t={t}
            actions={<><BtnSm t={t}>Export</BtnSm><BtnSm t={t} primary>Collect Payment</BtnSm></>} />
          <DataTable
            columns={["Receipt ID","Plan ID","Customer","Date","Amount","Mode","Reference","Instalment #","Status","Actions"]}
            t={t} emptyMsg="payment tracking data will load from backend" />
        </Card>
      )}

      {tab === "report" && (
        <Card t={t}>
          <CardHeader title="Outstanding EMI & Credit Report" t={t}
            actions={<><BtnSm t={t}>Export</BtnSm><BtnSm t={t} primary>Print</BtnSm></>} />
          <div style={{ textAlign:"center", padding:"40px", color:t.textFaint, fontSize:13,
            border:`1px dashed ${t.borderDash}`, borderRadius:9 }}>
            outstanding report will load from backend
          </div>
        </Card>
      )}

      {/* New EMI Plan Modal */}
      <Modal open={planModal} onClose={() => setPlanModal(false)}
        title="New EMI Plan" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setPlanModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setPlanModal(false)}>Create EMI Plan</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Customer *"     t={t} half><Select t={t}><option>-- Select Customer --</option></Select></FormGroup>
          <FormGroup label="Invoice No."    t={t} half><Input t={t} placeholder="Link to invoice" /></FormGroup>
          <FormGroup label="Item Description" t={t}><Input t={t} placeholder="Item purchased" /></FormGroup>
          <FormGroup label="Total Amount (₹) *" t={t} half><Input t={t} type="number" placeholder="0.00" /></FormGroup>
          <FormGroup label="Down Payment (₹)"   t={t} half><Input t={t} type="number" defaultValue="0" /></FormGroup>
          <FormGroup label="No. of EMIs *"       t={t} half>
            <Select t={t}><option>3</option><option>6</option><option>9</option><option>12</option><option>18</option><option>24</option></Select>
          </FormGroup>
          <FormGroup label="Interest Rate (%)"  t={t} half><Input t={t} type="number" defaultValue="0" step="0.1" /></FormGroup>
          <FormGroup label="First Due Date *"   t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Finance Partner"    t={t} half>
            <Select t={t}><option>In-House</option><option>Bajaj Finserv</option><option>HDFC Bank</option><option>Tata Capital</option></Select>
          </FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
