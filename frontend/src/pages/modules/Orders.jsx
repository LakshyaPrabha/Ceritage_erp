import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid,
         Input, Select, SectionTitle } from "../../components/ui";

const ORDER_TYPES = ["All Orders","Advance Booking","Custom Jewellery","Bridal Orders"];
const STATUS_OPTS = ["Pending","Confirmed","In Design","Manufacturing","Ready","Delivered"];

export default function Orders({ t }) {
  const [filter,   setFilter]   = useState("All Orders");
  const [addModal, setAddModal] = useState(false);

  return (
    <div>
      <PageHeader title="Order Booking"
        subtitle="Advance Booking · Custom Jewellery · Bridal Orders · Delivery Date · Advance Payment"
        t={t}
        actions={<>
          <BtnOutline t={t}>Notify All</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(true)}>+ New Order</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Active Orders"      color={BRAND.purple} t={t} />
        <StatCard label="Advance Collected"  color="#f0c040"      t={t} />
        <StatCard label="Ready to Deliver"   color="#2ecc71"      t={t} />
        <StatCard label="Overdue"            color={BRAND.pink}   t={t} />
      </div>

      {/* Type filter */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:18 }}>
        {ORDER_TYPES.map((type) => (
          <button key={type} onClick={() => setFilter(type)}
            style={{ padding:"6px 16px", borderRadius:20, cursor:"pointer",
              fontSize:12, fontWeight:600, fontFamily:"inherit",
              background: filter === type ? BRAND.gradBtn : "none",
              color: filter === type ? "#fff" : t.textSub,
              border: filter === type ? "none" : `1px solid ${t.borderDash}` }}>
            {type}
          </button>
        ))}
      </div>

      <Card t={t}>
        <CardHeader title="Order Register" t={t}
          actions={<>
            <Select t={t} style={{ width:140 }}>
              <option>All Status</option>
              {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
            </Select>
            <BtnSm t={t}>Export</BtnSm>
          </>} />
        <DataTable
          columns={["Order ID","Customer","Type","Item Description","Purity / Wt","Est. Amount","Advance","Balance","Delivery Date","Karigar","Priority","Status","Actions"]}
          t={t} emptyMsg="orders will load from backend" />
      </Card>

      {/* Add Order Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)}
        title="New Order Booking" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(false)}>Book Order</BtnPrimary>
        </>}>
        <SectionTitle t={t}>Customer</SectionTitle>
        <FormGrid>
          <FormGroup label="Customer *" t={t} half>
            <Select t={t}><option>-- Select Customer --</option></Select>
          </FormGroup>
          <FormGroup label="Order Type *" t={t} half>
            <Select t={t}><option>Custom</option><option>Bridal</option><option>Advance</option></Select>
          </FormGroup>
          <FormGroup label="Priority" t={t} half>
            <Select t={t}><option>Normal</option><option>High</option><option>Urgent</option></Select>
          </FormGroup>
        </FormGrid>
        <SectionTitle t={t}>Order Details</SectionTitle>
        <FormGrid>
          <FormGroup label="Item Description *" t={t}>
            <Input t={t} placeholder="e.g. Custom Bridal Kundan Set 22K with Earrings" />
          </FormGroup>
          <FormGroup label="Purity" t={t} half>
            <Select t={t}><option>22K</option><option>24K</option><option>18K</option><option>Silver 925</option><option>Platinum</option></Select>
          </FormGroup>
          <FormGroup label="Est. Weight (g)" t={t} half><Input t={t} type="number" step="0.1" placeholder="0.0" /></FormGroup>
          <FormGroup label="Estimated Amount (₹) *" t={t} half><Input t={t} type="number" placeholder="0.00" /></FormGroup>
          <FormGroup label="Gold Rate to Lock (₹/g)" t={t} half><Input t={t} type="number" placeholder="Market rate" /></FormGroup>
          <FormGroup label="Design Reference" t={t}><Input t={t} placeholder="Design no. / Photo ref / Inspiration" /></FormGroup>
        </FormGrid>
        <SectionTitle t={t}>Payment & Delivery</SectionTitle>
        <FormGrid>
          <FormGroup label="Advance Amount (₹) *" t={t} half><Input t={t} type="number" placeholder="Min 10%" /></FormGroup>
          <FormGroup label="Payment Mode" t={t} half>
            <Select t={t}><option>Cash</option><option>UPI</option><option>Bank Transfer</option></Select>
          </FormGroup>
          <FormGroup label="Delivery Date *" t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Assign Karigar" t={t} half>
            <Select t={t}><option>-- Select Karigar --</option></Select>
          </FormGroup>
          <FormGroup label="Special Instructions" t={t}>
            <Input t={t} placeholder="Design details, size, customer preferences..." />
          </FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
