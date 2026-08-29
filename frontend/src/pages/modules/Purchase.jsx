import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select } from "../../components/ui";

const TABS = [
  { id:"po",         label:"Purchase Orders" },
  { id:"return",     label:"Purchase Return" },
  { id:"grn",        label:"GRN" },
  { id:"sup-ledger", label:"Supplier Ledger" },
  { id:"sup-pay",    label:"Supplier Payment" },
  { id:"old-metal",  label:"Old Gold/Silver" },
];

export default function Purchase({ t }) {
  const [tab,      setTab]      = useState("po");
  const [addModal, setAddModal] = useState(false);

  return (
    <div>
      <PageHeader title="Purchase Management"
        subtitle="Purchase Entry · Return · Supplier Ledger · PO · GRN · Old Gold/Silver"
        t={t}
        actions={<>
          <BtnOutline t={t}>Purchase Return</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(true)}>+ New Purchase</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Total Purchase Value" color={BRAND.blue}   t={t} />
        <StatCard label="Pending Payments"     color={BRAND.pink}   t={t} />
        <StatCard label="Purchase Amount"      color={BRAND.purple} t={t} />
        <StatCard label="Total Orders"         color="#2ecc71"      t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "po" && (
        <Card t={t}>
          <CardHeader title="Purchase Orders" t={t}
            actions={<>
              <Select t={t} style={{ width:120 }}>
                <option>All Types</option><option>Gold</option><option>Diamond</option><option>Silver</option>
              </Select>
              <BtnSm t={t} primary onClick={() => setAddModal(true)}>+ New PO</BtnSm>
            </>} />
          <DataTable
            columns={["PO No.","Date","Supplier","Type","Item","Qty","Rate","Amount","GST","Total","Paid","Balance","Status","Actions"]}
            t={t} emptyMsg="purchase orders will load from backend" />
        </Card>
      )}

      {tab === "return" && (
        <Card t={t}>
          <CardHeader title="Purchase Returns" t={t}
            actions={<BtnSm t={t} primary>+ New Return</BtnSm>} />
          <DataTable
            columns={["Return ID","Date","PO Ref","Supplier","Item","Qty","Amount","Reason","Refund Mode","Status"]}
            t={t} emptyMsg="purchase returns will load from backend" />
        </Card>
      )}

      {tab === "grn" && (
        <Card t={t}>
          <CardHeader title="Goods Received Note (GRN)" t={t}
            actions={<BtnSm t={t} primary>+ New GRN</BtnSm>} />
          <DataTable
            columns={["GRN ID","Date","PO Ref","Supplier","Item","Qty","Received By","Condition","Notes","Actions"]}
            t={t} emptyMsg="GRN data will load from backend" />
        </Card>
      )}

      {tab === "sup-ledger" && (
        <Card t={t}>
          <CardHeader title="Supplier Ledger" t={t}
            actions={<>
              <Select t={t} style={{ width:240 }}><option>-- Select Supplier --</option></Select>
              <BtnSm t={t} primary>Load</BtnSm>
            </>} />
          <DataTable
            columns={["Date","PO No.","Item","Total (₹)","Paid (₹)","Balance (₹)"]}
            t={t} emptyMsg="Select a supplier to view the ledger" />
        </Card>
      )}

      {tab === "sup-pay" && (
        <Card t={t}>
          <CardHeader title="Supplier Payments" t={t}
            actions={<BtnSm t={t} primary>New Payment</BtnSm>} />
          <DataTable
            columns={["Pay ID","Supplier","Date","Amount","Mode","Reference","Balance","Actions"]}
            t={t} emptyMsg="supplier payments will load from backend" />
        </Card>
      )}

      {tab === "old-metal" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
            gap:12, marginBottom:18 }}>
            <StatCard label="Total Old Metal PO" color={BRAND.blue}   t={t} />
            <StatCard label="Fine Gold Purchased" color="#f0c040"     t={t} />
            <StatCard label="Fine Silver Purchased" color="#95a5a6"   t={t} />
            <StatCard label="Total Value Paid"    color="#2ecc71"     t={t} />
          </div>
          <Card t={t}>
            <CardHeader title="Old Gold & Silver Purchase Register" t={t}
              actions={<BtnSm t={t} primary>+ New Entry</BtnSm>} />
            <DataTable
              columns={["ID","Date","Customer","Metal","Gross Wt","Stone Wt","Fine Wt","Rate","Amount Paid","Mode","Status","Actions"]}
              t={t} emptyMsg="old metal purchases will load from backend" />
          </Card>
        </div>
      )}

      {/* Add PO Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="New Purchase Order" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(false)}>Create PO</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Supplier *" t={t} half>
            <Select t={t}><option>-- Select Supplier --</option></Select>
          </FormGroup>
          <FormGroup label="Purchase Date" t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Material Type" t={t} half>
            <Select t={t}><option>Gold</option><option>Silver</option><option>Diamond</option><option>Gemstones</option></Select>
          </FormGroup>
          <FormGroup label="Item Description *" t={t} half><Input t={t} placeholder="e.g. Gold Bar 22K 100g" /></FormGroup>
          <FormGroup label="Purity / Quality" t={t} half><Input t={t} placeholder="e.g. 22K" /></FormGroup>
          <FormGroup label="Weight / Qty"     t={t} half><Input t={t} type="number" step="0.001" placeholder="0.000" /></FormGroup>
          <FormGroup label="Rate (₹)"         t={t} half><Input t={t} type="number" placeholder="Market rate" /></FormGroup>
          <FormGroup label="GST %"            t={t} half>
            <Select t={t}><option>3%</option><option>0.25%</option><option>5%</option><option>18%</option></Select>
          </FormGroup>
          <FormGroup label="Payment Mode" t={t} half>
            <Select t={t}><option>RTGS</option><option>NEFT</option><option>Cheque</option><option>Cash</option></Select>
          </FormGroup>
          <FormGroup label="Expected Delivery" t={t} half><Input t={t} type="date" /></FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
