import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select } from "../../components/ui";

const TABS = [
  { id:"register", label:"Sales Register" },
  { id:"retail",   label:"Retail Sales" },
  { id:"wholesale",label:"Wholesale" },
  { id:"online",   label:"Online Sales" },
  { id:"returns",  label:"Sales Returns" },
  { id:"challan",  label:"Delivery Challan" },
  { id:"pending",  label:"Pending Orders" },
  { id:"advance",  label:"Advance Orders" },
];

export default function Sales({ t }) {
  const [tab, setTab]         = useState("register");
  const [returnModal, setReturnModal] = useState(false);
  const [challanModal, setChallanModal] = useState(false);

  return (
    <div>
      <PageHeader title="Sales Management"
        subtitle="Retail · Wholesale · Online · Returns · Delivery Challan · Pending & Advance"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={() => setReturnModal(true)}>Sales Return</BtnOutline>
          <BtnOutline t={t} onClick={() => setChallanModal(true)}>Delivery Challan</BtnOutline>
          <BtnPrimary>New Sale</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Total Net Sales"  color={BRAND.blue}   t={t} />
        <StatCard label="Total Bills"      color="#2ecc71"      t={t} />
        <StatCard label="Returns Value"    color={BRAND.pink}   t={t} />
        <StatCard label="Avg Bill Value"   color={BRAND.purple} t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {["register","retail","wholesale","online"].includes(tab) && (
        <Card t={t}>
          <CardHeader title={tab === "register" ? "All Sales" : tab.charAt(0).toUpperCase()+tab.slice(1)+" Sales"} t={t}
            actions={<>
              <input placeholder="Search invoice, customer..." style={{
                background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                borderRadius:8, padding:"7px 12px", fontSize:13,
                color:t.inputColor, outline:"none", fontFamily:"inherit", width:200 }} />
              <BtnSm t={t}>Export</BtnSm>
            </>} />
          <DataTable
            columns={["Invoice No.","Date","Customer","Type","Item","Amount","Discount","Net","GST","Mode","Status","Actions"]}
            t={t} emptyMsg="sales data will load from backend" />
        </Card>
      )}

      {tab === "returns" && (
        <Card t={t}>
          <CardHeader title="Sales Returns" t={t}
            actions={<BtnSm t={t} primary onClick={() => setReturnModal(true)}>+ New Return</BtnSm>} />
          <DataTable
            columns={["Return ID","Date","Invoice Ref","Customer","Item","Reason","Refund Amount","Mode","Status"]}
            t={t} emptyMsg="returns will load from backend" />
        </Card>
      )}

      {tab === "challan" && (
        <Card t={t}>
          <CardHeader title="Delivery Challans" t={t}
            actions={<BtnSm t={t} primary onClick={() => setChallanModal(true)}>+ New Challan</BtnSm>} />
          <DataTable
            columns={["DC No.","Date","Invoice","Customer","Address","Items","Delivered By","Status","Actions"]}
            t={t} emptyMsg="challans will load from backend" />
        </Card>
      )}

      {tab === "pending" && (
        <Card t={t}><CardHeader title="Pending Orders" t={t} />
          <DataTable columns={["Order ID","Customer","Item","Amount","Advance","Balance","Delivery Date","Status","Actions"]}
            t={t} emptyMsg="pending orders will load from backend" />
        </Card>
      )}

      {tab === "advance" && (
        <Card t={t}><CardHeader title="Advance Orders" t={t} />
          <DataTable columns={["Order ID","Customer","Item","Est. Amount","Advance Paid","Balance","Delivery Date","Status","Actions"]}
            t={t} emptyMsg="advance orders will load from backend" />
        </Card>
      )}

      {/* Return Modal */}
      <Modal open={returnModal} onClose={() => setReturnModal(false)} title="New Sales Return" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setReturnModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setReturnModal(false)}>Process Return</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Invoice No. *" t={t} half><Input t={t} placeholder="INV-2026-XXXX" /></FormGroup>
          <FormGroup label="Customer" t={t} half><Input t={t} placeholder="Customer name" /></FormGroup>
          <FormGroup label="Item *" t={t}><Input t={t} placeholder="Item description" /></FormGroup>
          <FormGroup label="Return Reason *" t={t} half>
            <Select t={t}><option>Defective Product</option><option>Size Issue</option><option>Wrong Item</option></Select>
          </FormGroup>
          <FormGroup label="Return Amount (₹) *" t={t} half><Input t={t} type="number" placeholder="0.00" /></FormGroup>
          <FormGroup label="Refund Mode" t={t} half>
            <Select t={t}><option>Cash Refund</option><option>Store Credit</option><option>UPI</option><option>Exchange</option></Select>
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* Challan Modal */}
      <Modal open={challanModal} onClose={() => setChallanModal(false)} title="New Delivery Challan" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setChallanModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setChallanModal(false)}>Generate Challan</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Invoice Reference *" t={t} half><Input t={t} placeholder="INV-2026-XXXX" /></FormGroup>
          <FormGroup label="Customer *"          t={t} half><Input t={t} placeholder="Customer name" /></FormGroup>
          <FormGroup label="Phone"               t={t} half><Input t={t} placeholder="Contact number" /></FormGroup>
          <FormGroup label="Delivery Address *"  t={t}><Input t={t} placeholder="Full delivery address" /></FormGroup>
          <FormGroup label="Items Description *" t={t}><Input t={t} placeholder="Items being delivered" /></FormGroup>
          <FormGroup label="Delivery Mode" t={t} half>
            <Select t={t}><option>Hand Delivery</option><option>Courier</option><option>BlueDart</option></Select>
          </FormGroup>
          <FormGroup label="Delivered By" t={t} half><Input t={t} placeholder="Staff name / Courier" /></FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
