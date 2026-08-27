import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid,
         Input, Select, SectionTitle } from "../../components/ui";

const TABS = [
  { id:"profiles",    label:"Profiles" },
  { id:"workorders",  label:"Work Orders" },
  { id:"gold-issue",  label:"Gold Issue" },
  { id:"gold-receive",label:"Gold Receive" },
  { id:"stone-issue", label:"Stone Issue" },
  { id:"stone-receive",label:"Stone Receive" },
  { id:"labour",      label:"Labour Charges" },
  { id:"pending",     label:"Pending Work" },
  { id:"payments",    label:"Payments" },
  { id:"performance", label:"Performance" },
];

export default function Karigar({ t }) {
  const [tab,      setTab]      = useState("profiles");
  const [addModal, setAddModal] = useState(false);
  const [issueModal, setIssueModal] = useState(false);
  const [woModal,  setWoModal]  = useState(false);

  return (
    <div>
      <PageHeader title="Karigar (Artisan) Management"
        subtitle="Profile · Work Orders · Gold Issue/Receive · Stone Issue/Receive · Labour · Payments · Performance"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={() => setAddModal(true)}>+ Add Karigar</BtnOutline>
          <BtnOutline t={t} onClick={() => setIssueModal(true)}>Issue Gold</BtnOutline>
          <BtnPrimary onClick={() => setWoModal(true)}>New Work Order</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Total Karigars"    color={BRAND.blue}   t={t} />
        <StatCard label="Active"            color="#2ecc71"      t={t} />
        <StatCard label="Gold at Karigar"   color="#f0c040"      t={t} />
        <StatCard label="Pending Jobs"      color={BRAND.pink}   t={t} />
        <StatCard label="Overdue Jobs"      color="#e74c3c"      t={t} />
        <StatCard label="Pending Payments"  color={BRAND.purple} t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "profiles" && (
        <Card t={t}>
          <CardHeader title="All Karigars" t={t}
            actions={<>
              <input placeholder="Search name, skill..." style={{
                background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                borderRadius:8, padding:"7px 12px", fontSize:13,
                color:t.inputColor, outline:"none", fontFamily:"inherit", width:180 }} />
              <Select t={t} style={{ width:150 }}>
                <option>All Skills</option>
                <option>Kundan Work</option><option>Diamond Setting</option>
                <option>Polishing</option><option>Enamel Work</option>
                <option>Casting</option><option>Filigree Work</option>
              </Select>
            </>} />
          <DataTable
            columns={["Karigar","Skill","Experience","Rating","Status","Pending Jobs","Gold at Hand","Pending Pay","Actions"]}
            t={t} emptyMsg="karigars will load from backend" />
        </Card>
      )}

      {tab === "workorders" && (
        <Card t={t}>
          <CardHeader title="Work Orders" t={t}
            actions={<BtnSm t={t} primary onClick={() => setWoModal(true)}>+ New Order</BtnSm>} />
          <DataTable
            columns={["WO ID","Karigar","Job Ref","Item","Order Date","Due Date","Gold Issued","Stones","Labour","Balance","Status","Actions"]}
            t={t} emptyMsg="work orders will load from backend" />
        </Card>
      )}

      {tab === "gold-issue" && (
        <Card t={t}>
          <CardHeader title="Gold Issue Register" t={t}
            actions={<BtnSm t={t} primary onClick={() => setIssueModal(true)}>Issue Gold</BtnSm>} />
          <DataTable
            columns={["Issue ID","Karigar","Work Order","Metal","Gross Wt","Stone Wt","Net Wt","Issued By","Date","Status","Actions"]}
            t={t} emptyMsg="gold issues will load from backend" />
        </Card>
      )}

      {tab === "gold-receive" && (
        <Card t={t}>
          <CardHeader title="Gold Receive Register" t={t}
            actions={<BtnSm t={t} primary>Receive Gold</BtnSm>} />
          <DataTable
            columns={["Receive ID","Karigar","Work Order","Metal","Issued Wt","Received Wt","Wastage","Wastage %","Date","Remarks"]}
            t={t} emptyMsg="gold receives will load from backend" />
        </Card>
      )}

      {tab === "stone-issue" && (
        <Card t={t}>
          <CardHeader title="Stone Issue Register" t={t}
            actions={<BtnSm t={t} primary>Issue Stones</BtnSm>} />
          <DataTable
            columns={["Issue ID","Karigar","Work Order","Stone Type","Carats","Pieces","Issued By","Date","Status","Actions"]}
            t={t} emptyMsg="stone issues will load from backend" />
        </Card>
      )}

      {tab === "stone-receive" && (
        <Card t={t}>
          <CardHeader title="Stone Receive Register" t={t}
            actions={<BtnSm t={t} primary>Receive Stones</BtnSm>} />
          <DataTable
            columns={["Receive ID","Karigar","Work Order","Stone Type","Issued","Received","Damage/Loss","Date","Remarks"]}
            t={t} emptyMsg="stone receives will load from backend" />
        </Card>
      )}

      {tab === "labour" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
            gap:12, marginBottom:18 }}>
            <StatCard label="Total Labour (Month)" color={BRAND.blue}   t={t} />
            <StatCard label="Pending Payment"      color={BRAND.pink}   t={t} />
            <StatCard label="Paid This Month"      color="#2ecc71"      t={t} />
            <StatCard label="Active Vouchers"      color={BRAND.purple} t={t} />
          </div>
          <Card t={t}>
            <CardHeader title="Labour Charge Vouchers" t={t}
              actions={<BtnSm t={t} primary>+ Add Charge</BtnSm>} />
            <DataTable
              columns={["ID","Karigar","Work Order","Item","Charge Type","Rate","Qty/Wt","Amount","GST(18%)","Total","Status","Actions"]}
              t={t} emptyMsg="labour charges will load from backend" />
          </Card>
        </div>
      )}

      {tab === "pending" && (
        <Card t={t}>
          <CardHeader title="Pending Work Orders" t={t}
            actions={<BtnSm t={t}>Bulk Remind</BtnSm>} />
          <DataTable
            columns={["WO ID","Karigar","Job Ref","Item","Order Date","Due Date","Gold at Hand","Priority","Status","Actions"]}
            t={t} emptyMsg="pending work will load from backend" />
        </Card>
      )}

      {tab === "payments" && (
        <Card t={t}>
          <CardHeader title="Payment Ledger" t={t}
            actions={<BtnSm t={t} primary>Make Payment</BtnSm>} />
          <DataTable
            columns={["Pay ID","Karigar","Date","Amount Paid","Mode","Reference","Work Order","Balance","Actions"]}
            t={t} emptyMsg="payments will load from backend" />
        </Card>
      )}

      {tab === "performance" && (
        <div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14, gap:10 }}>
            <BtnOutline t={t}>Print Report</BtnOutline>
            <BtnPrimary>Refresh</BtnPrimary>
          </div>
          <Card t={t}>
            <div style={{ textAlign:"center", padding:"40px 16px",
              color:t.textFaint, fontSize:13, border:`1px dashed ${t.borderDash}`, borderRadius:9 }}>
              karigar performance data will load from backend — cards mein dikhega
            </div>
          </Card>
        </div>
      )}

      {/* Add Karigar Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)}
        title="Add New Karigar" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(false)}>Save Karigar</BtnPrimary>
        </>}>
        <SectionTitle t={t}>Personal Info</SectionTitle>
        <FormGrid>
          <FormGroup label="Full Name *"     t={t} half><Input t={t} placeholder="Karigar full name" /></FormGroup>
          <FormGroup label="Phone *"         t={t} half><Input t={t} placeholder="Mobile number" /></FormGroup>
          <FormGroup label="Aadhaar No."     t={t} half><Input t={t} placeholder="XXXX XXXX XXXX" /></FormGroup>
          <FormGroup label="PAN"             t={t} half><Input t={t} placeholder="ABCDE1234F" /></FormGroup>
        </FormGrid>
        <SectionTitle t={t}>Work Details</SectionTitle>
        <FormGrid>
          <FormGroup label="Specialization *" t={t} half>
            <Select t={t}>
              <option>Kundan Work</option><option>Diamond Setting</option>
              <option>Polishing</option><option>Enamel Work</option>
              <option>Casting</option><option>Filigree Work</option>
            </Select>
          </FormGroup>
          <FormGroup label="Experience (Years)" t={t} half><Input t={t} type="number" placeholder="0" /></FormGroup>
          <FormGroup label="Labour Rate (₹)"    t={t} half><Input t={t} type="number" placeholder="0" /></FormGroup>
          <FormGroup label="Rate Unit"           t={t} half>
            <Select t={t}><option>per gram</option><option>per piece</option><option>lump sum</option></Select>
          </FormGroup>
        </FormGrid>
        <SectionTitle t={t}>Bank Details</SectionTitle>
        <FormGrid>
          <FormGroup label="Bank Account No." t={t} half><Input t={t} placeholder="Account number" /></FormGroup>
          <FormGroup label="IFSC Code"        t={t} half><Input t={t} placeholder="SBIN0001234" /></FormGroup>
          <FormGroup label="Bank Name"        t={t} half><Input t={t} placeholder="e.g. SBI, HDFC" /></FormGroup>
        </FormGrid>
      </Modal>

      {/* Issue Gold Modal */}
      <Modal open={issueModal} onClose={() => setIssueModal(false)}
        title="Issue Gold to Karigar" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setIssueModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setIssueModal(false)}>Issue Gold</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Select Karigar *" t={t}><Select t={t}><option>-- Select --</option></Select></FormGroup>
          <FormGroup label="Work Order" t={t}><Select t={t}><option>-- Select Work Order --</option></Select></FormGroup>
          <FormGroup label="Metal Type *" t={t} half>
            <Select t={t}><option>22K Gold</option><option>18K Gold</option><option>Silver 925</option><option>Platinum</option></Select>
          </FormGroup>
          <FormGroup label="Gross Weight (g) *" t={t} half><Input t={t} type="number" step="0.001" placeholder="0.000" /></FormGroup>
          <FormGroup label="Stone Weight to Deduct (g)" t={t} half><Input t={t} type="number" step="0.001" defaultValue="0" /></FormGroup>
          <FormGroup label="Net Metal Weight" t={t} half><Input t={t} readOnly style={{ opacity:0.7 }} placeholder="Auto-calc" /></FormGroup>
        </FormGrid>
      </Modal>

      {/* Work Order Modal */}
      <Modal open={woModal} onClose={() => setWoModal(false)}
        title="New Work Order" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setWoModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setWoModal(false)}>Create Work Order</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Select Karigar *" t={t} half><Select t={t}><option>-- Select --</option></Select></FormGroup>
          <FormGroup label="Job Reference"    t={t} half><Input t={t} placeholder="RJ001 / ORD001" /></FormGroup>
          <FormGroup label="Item Description *" t={t}><Input t={t} placeholder="Detailed description of work" /></FormGroup>
          <FormGroup label="Priority" t={t} half>
            <Select t={t}><option>Normal</option><option>High</option><option>Urgent</option></Select>
          </FormGroup>
          <FormGroup label="Due Date *"           t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Est. Labour (₹)"     t={t} half><Input t={t} type="number" placeholder="0" /></FormGroup>
          <FormGroup label="Special Instructions" t={t}><Input t={t} placeholder="Design details, finish requirements..." /></FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
