import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select } from "../../components/ui";

const TABS = [
  { id:"list",      label:"Suppliers" },
  { id:"ledger",    label:"Ledger" },
  { id:"payments",  label:"Payments" },
  { id:"purchases", label:"Purchase History" },
  { id:"report",    label:"Report" },
];

export default function Suppliers({ t }) {
  const [tab,      setTab]      = useState("list");
  const [addModal, setAddModal] = useState(false);
  const [payModal, setPayModal] = useState(false);

  return (
    <div>
      <PageHeader title="Supplier Management"
        subtitle="Registration · Ledger · Payments · Purchase History · Report"
        t={t}
        actions={<>
          <BtnOutline t={t}>New PO</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(true)}>+ Add Supplier</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Total Suppliers"  color={BRAND.blue}   t={t} />
        <StatCard label="Active"           color="#2ecc71"      t={t} />
        <StatCard label="Total Outstanding" color={BRAND.pink}  t={t} />
        <StatCard label="Total Purchases"  color={BRAND.purple} t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "list" && (
        <Card t={t}>
          <CardHeader title="Supplier Directory" t={t}
            actions={<>
              <input placeholder="Search supplier, city..." style={{
                background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                borderRadius:8, padding:"7px 12px", fontSize:13,
                color:t.inputColor, outline:"none", fontFamily:"inherit", width:180 }} />
              <Select t={t} style={{ width:130 }}>
                <option>All Types</option><option>Gold</option><option>Diamond</option>
                <option>Gemstones</option><option>Silver</option>
              </Select>
            </>} />
          <DataTable
            columns={["ID","Supplier","Type","Phone","GSTIN","Total Purchased","Outstanding","Rating","Status","Actions"]}
            t={t} emptyMsg="suppliers will load from backend" />
        </Card>
      )}

      {tab === "ledger" && (
        <Card t={t}>
          <CardHeader title="Supplier Ledger" t={t}
            actions={<>
              <Select t={t} style={{ width:240 }}><option>-- Select Supplier --</option></Select>
              <BtnSm t={t} primary>Load</BtnSm>
              <BtnSm t={t}>Print</BtnSm>
            </>} />
          <DataTable
            columns={["#","Date","Particulars","Dr (₹) Paid","Cr (₹) Charged","Balance"]}
            t={t} emptyMsg="Select a supplier to view the ledger" />
        </Card>
      )}

      {tab === "payments" && (
        <div>
          <Card t={t}>
            <CardHeader title="Payment History" t={t}
              actions={<BtnSm t={t} primary onClick={() => setPayModal(true)}>New Payment</BtnSm>} />
            <DataTable
              columns={["ID","Supplier","Date","Amount","Mode","Reference","PO Ref","Remark","Balance After","Actions"]}
              t={t} emptyMsg="payments will load from backend" />
          </Card>
          <Card t={t}>
            <CardHeader title="Pending Dues" t={t} />
            <DataTable
              columns={["Supplier","Type","Outstanding","Credit Limit","Actions"]}
              t={t} emptyMsg="pending dues will load from backend" />
          </Card>
        </div>
      )}

      {tab === "purchases" && (
        <Card t={t}>
          <CardHeader title="Purchase Orders" t={t}
            actions={<Select t={t} style={{ width:200 }}><option>All Suppliers</option></Select>} />
          <DataTable
            columns={["PO No.","Supplier","Item","Qty","Rate","Amount","Date","Status","Actions"]}
            t={t} emptyMsg="purchase orders will load from backend" />
        </Card>
      )}

      {tab === "report" && (
        <Card t={t}>
          <CardHeader title="Supplier Performance Report" t={t}
            actions={<><BtnSm t={t}>Print</BtnSm><BtnSm t={t} primary>Refresh</BtnSm></>} />
          <div style={{ textAlign:"center", padding:"40px", color:t.textFaint, fontSize:13,
            border:`1px dashed ${t.borderDash}`, borderRadius:9 }}>
            supplier report cards will load from backend
          </div>
        </Card>
      )}

      {/* Add Supplier Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)}
        title="Add Supplier" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(false)}>Save</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Company Name *" t={t} half><Input t={t} placeholder="Supplier company name" /></FormGroup>
          <FormGroup label="Contact Person" t={t} half><Input t={t} placeholder="Name" /></FormGroup>
          <FormGroup label="Phone"          t={t} half><Input t={t} placeholder="Mobile/Landline" /></FormGroup>
          <FormGroup label="Email"          t={t} half><Input t={t} placeholder="Email" /></FormGroup>
          <FormGroup label="Supply Type"    t={t} half>
            <Select t={t}><option>Gold</option><option>Silver</option><option>Diamond</option><option>Gemstones</option></Select>
          </FormGroup>
          <FormGroup label="City"           t={t} half><Input t={t} placeholder="City" /></FormGroup>
          <FormGroup label="GSTIN"          t={t} half><Input t={t} placeholder="15-digit GSTIN" /></FormGroup>
          <FormGroup label="PAN"            t={t} half><Input t={t} placeholder="ABCDE1234F" /></FormGroup>
          <FormGroup label="Credit Limit (₹)" t={t} half><Input t={t} type="number" placeholder="0" /></FormGroup>
          <FormGroup label="Bank A/C"       t={t} half><Input t={t} placeholder="Account number" /></FormGroup>
          <FormGroup label="IFSC"           t={t} half><Input t={t} placeholder="SBIN0001234" /></FormGroup>
        </FormGrid>
      </Modal>

      {/* Pay Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)}
        title="Pay Supplier" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setPayModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setPayModal(false)}>Confirm Payment</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Select Supplier" t={t}><Select t={t}><option>-- Select --</option></Select></FormGroup>
          <FormGroup label="Amount (₹) *"    t={t} half><Input t={t} type="number" placeholder="0.00" /></FormGroup>
          <FormGroup label="Payment Mode *"  t={t} half>
            <Select t={t}><option>NEFT</option><option>RTGS</option><option>IMPS</option><option>Cheque</option><option>Cash</option></Select>
          </FormGroup>
          <FormGroup label="UTR / Reference" t={t} half><Input t={t} placeholder="UTR number" /></FormGroup>
          <FormGroup label="Remark"          t={t} half><Input t={t} placeholder="Payment against PO..." /></FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
