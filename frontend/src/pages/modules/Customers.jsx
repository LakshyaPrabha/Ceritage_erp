import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid,
         Input, Select, SectionTitle } from "../../components/ui";

const TABS = [
  { id:"list",       label:"All Customers" },
  { id:"ledger",     label:"Ledger" },
  { id:"wallet",     label:"Wallet & Points" },
  { id:"membership", label:"Membership" },
  { id:"credit",     label:"Credit" },
  { id:"emi",        label:"EMI" },
  { id:"due",        label:"Due Tracking" },
  { id:"history",    label:"Purchase History" },
  { id:"returns",    label:"Return History" },
  { id:"kyc",        label:"KYC" },
  { id:"reminders",  label:"Reminders" },
  { id:"comm",       label:"Communication" },
];

export default function Customers({ t }) {
  const [tab,      setTab]      = useState("list");
  const [addModal, setAddModal] = useState(false);

  return (
    <div>
      <PageHeader
        title="Customer Management"
        subtitle="Registration · Profile · KYC · Ledger · Wallet · Loyalty · EMI · Dues · History"
        t={t}
        actions={<>
          <BtnOutline t={t}>Export</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(true)}>+ Add Customer</BtnPrimary>
        </>}
      />

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Total Customers" color={BRAND.blue}   t={t} />
        <StatCard label="Platinum"        color={BRAND.purple} t={t} />
        <StatCard label="Gold Members"    color="#f0c040"      t={t} />
        <StatCard label="Pending Dues"    color={BRAND.pink}   t={t} />
        <StatCard label="Active EMIs"     color="#3498db"      t={t} />
        <StatCard label="Birthdays"       color="#2ecc71"      t={t} />
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "list" && (
        <Card t={t}>
          <CardHeader title="Customer List"
            actions={<>
              <input placeholder="Search name, phone..." style={{
                background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                borderRadius:8, padding:"7px 12px", fontSize:13,
                color:t.inputColor, outline:"none", fontFamily:"inherit", width:220 }} />
              <Select t={t} style={{ width:130 }}>
                <option value="">All Tiers</option>
                <option>Platinum</option>
                <option>Gold</option>
                <option>Silver</option>
                <option>Regular</option>
              </Select>
            </>}
            t={t} />
          <DataTable
            columns={["Customer","Phone","Tier","KYC","Balance Due","Total Purchase","Points","Actions"]}
            t={t} emptyMsg="customers will load from backend" />
        </Card>
      )}

      {tab === "ledger" && (
        <Card t={t}>
          <CardHeader title="Customer Ledger" t={t}
            actions={<>
              <Select t={t} style={{ width:240 }}>
                <option>-- Select Customer --</option>
              </Select>
              <BtnSm t={t} primary>Load</BtnSm>
            </>} />
          <DataTable
            columns={["#","Date","Particulars","Dr (₹)","Cr (₹)","Balance (₹)"]}
            t={t} emptyMsg="Customer select karo ledger dekhne ke liye" />
        </Card>
      )}

      {tab === "wallet" && (
        <Card t={t}>
          <CardHeader title="Wallet & Loyalty Points" t={t} />
          <DataTable
            columns={["Customer","Tier","Loyalty Points","Redeemable Value","Wallet Balance","Actions"]}
            t={t} emptyMsg="wallet data will load from backend" />
        </Card>
      )}

      {tab === "membership" && (
        <Card t={t}>
          <CardHeader title="Membership Tiers" t={t} />
          <DataTable
            columns={["Customer","Tier","Join Date","Total Spend","Benefits","Status"]}
            t={t} emptyMsg="membership data will load from backend" />
        </Card>
      )}

      {tab === "credit" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
            gap:12, marginBottom:18 }}>
            <StatCard label="Credit Customers" color={BRAND.blue}   t={t} />
            <StatCard label="Total Outstanding" color={BRAND.pink}  t={t} />
            <StatCard label="Overdue"           color="#e74c3c"      t={t} />
            <StatCard label="Total Credit Limit" color="#2ecc71"    t={t} />
          </div>
          <Card t={t}>
            <CardHeader title="Credit Customer Register" t={t} />
            <DataTable
              columns={["Customer","Phone","Tier","Credit Limit","Used","Available","Balance Due","Actions"]}
              t={t} emptyMsg="credit data will load from backend" />
          </Card>
        </div>
      )}

      {tab === "emi" && (
        <Card t={t}>
          <CardHeader title="EMI Plans" t={t}
            actions={<BtnSm t={t} primary>New EMI Plan</BtnSm>} />
          <DataTable
            columns={["Plan ID","Customer","Item","Total","EMI/Month","Progress","Remaining","Next Due","Status","Actions"]}
            t={t} emptyMsg="EMI plans will load from backend" />
        </Card>
      )}

      {tab === "due" && (
        <Card t={t}>
          <CardHeader title="Pending Due Tracking" t={t}
            actions={<BtnSm t={t}>Bulk Remind</BtnSm>} />
          <DataTable
            columns={["Customer","Phone","Tier","Balance Due","Credit Limit","Total Purchase","Actions"]}
            t={t} emptyMsg="due tracking data will load from backend" />
        </Card>
      )}

      {tab === "history" && (
        <Card t={t}>
          <CardHeader title="Purchase History" t={t} />
          <DataTable
            columns={["Invoice No.","Customer","Date","Item","Amount","Paid","Mode","Status","Actions"]}
            t={t} emptyMsg="Select a customer to view history" />
        </Card>
      )}

      {tab === "returns" && (
        <Card t={t}>
          <CardHeader title="Return History" t={t} />
          <DataTable
            columns={["Return ID","Customer","Date","Invoice Ref","Item","Refund Amount","Mode","Status"]}
            t={t} emptyMsg="return history will load from backend" />
        </Card>
      )}

      {tab === "kyc" && (
        <Card t={t}>
          <CardHeader title="KYC Register" t={t} />
          <DataTable
            columns={["Customer","Phone","PAN","Aadhaar","GST","KYC Status","Actions"]}
            t={t} emptyMsg="KYC data will load from backend" />
        </Card>
      )}

      {tab === "reminders" && (
        <Card t={t}>
          <CardHeader title="Birthday & Anniversary Reminders" t={t}
            actions={<BtnSm t={t} primary>Send All</BtnSm>} />
          <DataTable
            columns={["Customer","Phone","Type","Date","Days Left","Tier","Actions"]}
            t={t} emptyMsg="reminders will load from backend" />
        </Card>
      )}

      {tab === "comm" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Bulk Message" t={t} />
            <FormGrid>
              <FormGroup label="Channel" t={t} half>
                <Select t={t}><option>WhatsApp</option><option>SMS</option><option>Email</option></Select>
              </FormGroup>
              <FormGroup label="Send To" t={t} half>
                <Select t={t}>
                  <option>All Customers</option>
                  <option>Gold Members</option>
                  <option>Platinum Members</option>
                </Select>
              </FormGroup>
              <FormGroup label="Message" t={t}>
                <textarea rows={4} placeholder="Type your message..." style={{
                  width:"100%", background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                  borderRadius:9, padding:"10px 13px", fontSize:13, color:t.inputColor,
                  outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical" }} />
              </FormGroup>
            </FormGrid>
            <BtnPrimary style={{ width:"100%", marginTop:8 }}>Send Now</BtnPrimary>
          </Card>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Message Log" t={t} />
            <DataTable
              columns={["To","Channel","Template","Date","Status"]}
              t={t} emptyMsg="message log will load from backend" />
          </Card>
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)}
        title="Add New Customer" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(false)}>Save Customer</BtnPrimary>
        </>}>
        <SectionTitle t={t}>Personal Info</SectionTitle>
        <FormGrid>
          <FormGroup label="Full Name *" t={t} half><Input t={t} placeholder="Customer name" /></FormGroup>
          <FormGroup label="Phone *"     t={t} half><Input t={t} placeholder="10-digit mobile" /></FormGroup>
          <FormGroup label="Email"       t={t} half><Input t={t} placeholder="email@example.com" /></FormGroup>
          <FormGroup label="Date of Birth" t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Anniversary"   t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Customer Tier" t={t} half>
            <Select t={t}><option>Regular</option><option>Silver</option><option>Gold</option><option>Platinum</option></Select>
          </FormGroup>
          <FormGroup label="City"  t={t} half><Input t={t} placeholder="City" /></FormGroup>
          <FormGroup label="State" t={t} half>
            <Select t={t}><option>Maharashtra</option><option>Gujarat</option><option>Rajasthan</option><option>Delhi</option></Select>
          </FormGroup>
        </FormGrid>
        <SectionTitle t={t}>KYC Details</SectionTitle>
        <FormGrid>
          <FormGroup label="PAN Number"    t={t} half><Input t={t} placeholder="ABCDE1234F" /></FormGroup>
          <FormGroup label="Aadhaar"       t={t} half><Input t={t} placeholder="XXXX XXXX XXXX" /></FormGroup>
          <FormGroup label="GST Number"    t={t} half><Input t={t} placeholder="For B2B (optional)" /></FormGroup>
          <FormGroup label="Credit Limit (₹)" t={t} half><Input t={t} type="number" placeholder="0" /></FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
