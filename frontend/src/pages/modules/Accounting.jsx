import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select } from "../../components/ui";

const TABS = [
  { id:"cashbook",  label:"Cash Book" },
  { id:"bankbook",  label:"Bank Book" },
  { id:"journal",   label:"Journal" },
  { id:"ledger",    label:"Ledger" },
  { id:"tb",        label:"Trial Balance" },
  { id:"pl",        label:"P&L" },
  { id:"bs",        label:"Balance Sheet" },
  { id:"daybook",   label:"Day Book" },
  { id:"vouchers",  label:"Vouchers" },
  { id:"expenses",  label:"Expenses" },
  { id:"income",    label:"Income" },
  { id:"recon",     label:"Bank Recon" },
];

export default function Accounting({ t }) {
  const [tab,          setTab]          = useState("cashbook");
  const [voucherModal, setVoucherModal] = useState(false);
  const [expModal,     setExpModal]     = useState(false);

  return (
    <div>
      <PageHeader title="Accounting"
        subtitle="Cash Book · Bank Book · Journal · Ledger · Trial Balance · P&L · Balance Sheet · Vouchers"
        t={t}
        actions={<>
          <BtnOutline t={t}>Print Books</BtnOutline>
          <BtnOutline t={t} onClick={() => setVoucherModal(true)}>Journal Entry</BtnOutline>
          <BtnPrimary onClick={() => setVoucherModal(true)}>+ New Voucher</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Cash in Hand"  color="#2ecc71"      t={t} />
        <StatCard label="Bank Balance"  color={BRAND.blue}   t={t} />
        <StatCard label="Payables"      color={BRAND.pink}   t={t} />
        <StatCard label="Receivables"   color="#f39c12"      t={t} />
        <StatCard label="Net Profit"    color="#2ecc71"      t={t} />
        <StatCard label="Total Assets"  color={BRAND.purple} t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "cashbook" && (
        <Card t={t}>
          <CardHeader title="Cash Book" t={t}
            actions={<>
              <Input t={t} type="date" style={{ width:150 }} />
              <BtnSm t={t} primary>Load</BtnSm>
              <BtnSm t={t}>Export</BtnSm>
            </>} />
          <DataTable
            columns={["Time","Particulars","Voucher No","Type","Debit (₹)","Credit (₹)","Balance (₹)"]}
            t={t}
            emptyMsg="Cash book entries will load from backend" />
        </Card>
      )}

      {tab === "bankbook" && (
        <Card t={t}>
          <CardHeader title="Bank Book" t={t}
            actions={<>
              <Select t={t} style={{ width:200 }}>
                <option>SBI Current A/C</option>
                <option>HDFC Current A/C</option>
              </Select>
              <Input t={t} type="date" style={{ width:150 }} />
              <BtnSm t={t} primary>Load</BtnSm>
            </>} />
          <DataTable
            columns={["Date","Particulars","Voucher No","Bank","Reference","Debit (₹)","Credit (₹)","Balance (₹)"]}
            t={t}
            emptyMsg="Bank book entries will load from backend" />
        </Card>
      )}

      {tab === "journal" && (
        <Card t={t}>
          <CardHeader title="Journal Entries" t={t}
            actions={<BtnSm t={t} primary onClick={() => setVoucherModal(true)}>+ New Entry</BtnSm>} />
          <DataTable
            columns={["JE ID","Date","Dr / Cr Accounts","Amount","Narration"]}
            t={t}
            emptyMsg="Journal entries will load from backend" />
        </Card>
      )}

      {tab === "ledger" && (
        <Card t={t}>
          <CardHeader title="Account Ledger" t={t}
            actions={<>
              <Select t={t} style={{ width:240 }}><option>-- Select Account --</option></Select>
              <BtnSm t={t} primary>Load</BtnSm>
            </>} />
          <DataTable
            columns={["Date","Particulars","Dr (₹)","Cr (₹)","Balance"]}
            t={t}
            emptyMsg="Select an account to view the ledger" />
        </Card>
      )}

      {tab === "tb" && (
        <Card t={t}>
          <CardHeader title="Trial Balance" t={t}
            actions={<>
              <Input t={t} type="date" style={{ width:150 }} />
              <BtnSm t={t}>Export</BtnSm>
              <BtnSm t={t} primary>Print</BtnSm>
            </>} />
          <DataTable
            columns={["A/C Code","Account Name","Group","Debit (₹)","Credit (₹)"]}
            t={t}
            emptyMsg="Trial balance will load from backend" />
        </Card>
      )}

      {tab === "pl" && (
        <Card t={t}>
          <CardHeader title="Profit & Loss Statement" t={t}
            actions={<>
              <Select t={t} style={{ width:140 }}>
                <option>Current Month</option>
                <option>Last Month</option>
                <option>FY 2025-26</option>
              </Select>
              <BtnSm t={t}>Export</BtnSm>
              <BtnSm t={t} primary>Print</BtnSm>
            </>} />
          <div style={{ textAlign:"center", padding:"40px", color:t.textFaint, fontSize:13,
            border:`1px dashed ${t.borderDash}`, borderRadius:9 }}>
            P&L data will load from backend
          </div>
        </Card>
      )}

      {tab === "bs" && (
        <Card t={t}>
          <CardHeader title="Balance Sheet" t={t}
            actions={<>
              <BtnSm t={t}>Export</BtnSm>
              <BtnSm t={t} primary>Print</BtnSm>
            </>} />
          <div style={{ textAlign:"center", padding:"40px", color:t.textFaint, fontSize:13,
            border:`1px dashed ${t.borderDash}`, borderRadius:9 }}>
            Balance sheet will load from backend
          </div>
        </Card>
      )}

      {tab === "daybook" && (
        <Card t={t}>
          <CardHeader title="Day Book — All Transactions" t={t}
            actions={<>
              <Input t={t} type="date" style={{ width:150 }} />
              <BtnSm t={t} primary>Load</BtnSm>
            </>} />
          <DataTable
            columns={["Time","Voucher No","Type","Description","Debit (₹)","Credit (₹)"]}
            t={t}
            emptyMsg="Day book entries will load from backend" />
        </Card>
      )}

      {tab === "vouchers" && (
        <Card t={t}>
          <CardHeader title="Voucher Register" t={t}
            actions={<>
              <Select t={t} style={{ width:130 }}>
                <option>All Types</option>
                <option>Payment</option>
                <option>Receipt</option>
                <option>Contra</option>
                <option>Journal</option>
              </Select>
              <BtnSm t={t} primary onClick={() => setVoucherModal(true)}>+ New Voucher</BtnSm>
            </>} />
          <DataTable
            columns={["Voucher ID","Date","Type","From","To","Amount","Narration","By","Status","Actions"]}
            t={t}
            emptyMsg="Vouchers will load from backend" />
        </Card>
      )}

      {tab === "expenses" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
            gap:12, marginBottom:18 }}>
            <StatCard label="Total Expenses (Month)" color={BRAND.pink}   t={t} />
            <StatCard label="Pending Payment"        color="#f39c12"      t={t} />
            <StatCard label="Rent & Utilities"       color={BRAND.blue}   t={t} />
            <StatCard label="Salary"                 color={BRAND.purple} t={t} />
          </div>
          <Card t={t}>
            <CardHeader title="Expense Management" t={t}
              actions={<BtnSm t={t} primary onClick={() => setExpModal(true)}>+ Add Expense</BtnSm>} />
            <DataTable
              columns={["ID","Date","Category","Description","Amount","Mode","Bill No.","By","Status","Actions"]}
              t={t}
              emptyMsg="Expenses will load from backend" />
          </Card>
        </div>
      )}

      {tab === "income" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
            gap:12, marginBottom:18 }}>
            <StatCard label="Income Received (Month)" color="#2ecc71"      t={t} />
            <StatCard label="Expected Income"         color={BRAND.blue}   t={t} />
            <StatCard label="Jewelry Sales"           color="#f0c040"      t={t} />
            <StatCard label="Repair Income"           color={BRAND.purple} t={t} />
          </div>
          <Card t={t}>
            <CardHeader title="Income Management" t={t}
              actions={<BtnSm t={t} primary>+ Add Income</BtnSm>} />
            <DataTable
              columns={["ID","Date","Category","Description","Amount","Mode","Reference","Status"]}
              t={t}
              emptyMsg="Income entries will load from backend" />
          </Card>
        </div>
      )}

      {tab === "recon" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Un-cleared Transactions" t={t} />
            <DataTable
              columns={["Date","Description","Type","Amount","Status","Actions"]}
              t={t}
              emptyMsg="Un-cleared transactions will load from backend" />
          </Card>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Bank Statement" t={t}
              actions={<BtnSm t={t} primary>Import</BtnSm>} />
            <DataTable
              columns={["Date","Description","Debit","Credit","Balance"]}
              t={t}
              emptyMsg="Import a bank statement to begin reconciliation" />
          </Card>
        </div>
      )}

      {/* Voucher Modal */}
      <Modal open={voucherModal} onClose={() => setVoucherModal(false)}
        title="New Voucher" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setVoucherModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setVoucherModal(false)}>Post Voucher</BtnPrimary>
        </>}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
          {["Payment","Receipt","Contra","Journal"].map((vt) => (
            <button key={vt} style={{ padding:"6px 14px", borderRadius:20, cursor:"pointer",
              fontSize:12, fontFamily:"inherit",
              background:BRAND.gradBtn, color:"#fff", border:"none" }}>
              {vt}
            </button>
          ))}
        </div>
        <FormGrid>
          <FormGroup label="Date *"                  t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Amount (₹) *"            t={t} half><Input t={t} type="number" placeholder="0.00" /></FormGroup>
          <FormGroup label="From Account *"          t={t} half>
            <Select t={t}>
              <option>Cash</option>
              <option>SBI Bank</option>
              <option>Customer</option>
            </Select>
          </FormGroup>
          <FormGroup label="To Account *"            t={t} half>
            <Select t={t}>
              <option>Rent Expense</option>
              <option>Salary</option>
              <option>Supplier</option>
            </Select>
          </FormGroup>
          <FormGroup label="Payment Mode"            t={t} half>
            <Select t={t}>
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>UPI</option>
              <option>Cheque</option>
            </Select>
          </FormGroup>
          <FormGroup label="Reference / Cheque No."  t={t} half>
            <Input t={t} placeholder="UTR / Cheque number" />
          </FormGroup>
          <FormGroup label="Narration *"             t={t}>
            <Input t={t} placeholder="Details of transaction" />
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* Expense Modal */}
      <Modal open={expModal} onClose={() => setExpModal(false)}
        title="Add Expense" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setExpModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setExpModal(false)}>Save Expense</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Date *"           t={t} half><Input t={t} type="date" /></FormGroup>
          <FormGroup label="Category *"       t={t} half>
            <Select t={t}>
              <option>Rent</option>
              <option>Salary</option>
              <option>Artisan Charges</option>
              <option>Electricity</option>
              <option>Insurance</option>
              <option>Marketing</option>
              <option>Maintenance</option>
              <option>Miscellaneous</option>
            </Select>
          </FormGroup>
          <FormGroup label="Description *"    t={t}><Input t={t} placeholder="Expense description" /></FormGroup>
          <FormGroup label="Amount (₹) *"     t={t} half><Input t={t} type="number" placeholder="0.00" /></FormGroup>
          <FormGroup label="Payment Mode *"   t={t} half>
            <Select t={t}>
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>UPI</option>
              <option>Cheque</option>
            </Select>
          </FormGroup>
          <FormGroup label="Bill / Receipt No." t={t} half>
            <Input t={t} placeholder="Bill number" />
          </FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
