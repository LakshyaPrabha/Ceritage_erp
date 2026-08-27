import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, FormGroup, FormGrid, Input, Select, SectionTitle } from "../../components/ui";

const TABS = [
  { id:"new",     label:"New Invoice" },
  { id:"list",    label:"All Bills" },
  { id:"receipt", label:"Receipt" },
  { id:"notes",   label:"Credit / Debit Notes" },
  { id:"returns", label:"Returns & Refunds" },
];

const INV_TYPES = [
  "Retail Invoice","Wholesale Invoice","Tax Invoice","Estimate",
  "Quotation","Credit Note","Debit Note","Exchange Billing",
  "Return Invoice","Refund Invoice",
];

const PAY_MODES = ["Cash","Card","UPI","Bank Transfer","Wallet","EMI","Cheque","Exchange+Cash","Credit"];

export default function Billing({ t }) {
  const [tab,     setTab]     = useState("new");
  const [invType, setInvType] = useState("Retail Invoice");
  const [payMode, setPayMode] = useState("Cash");

  return (
    <div>
      <PageHeader
        title="Billing & GST Invoice"
        subtitle="10 invoice types · GST calc · Split payment · EMI · Coupon · Gift Voucher"
        t={t}
        actions={<>
          <BtnOutline t={t}>Credit Note</BtnOutline>
          <BtnOutline t={t}>Debit Note</BtnOutline>
          <BtnPrimary onClick={() => setTab("new")}>+ New Invoice</BtnPrimary>
        </>}
      />

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Today's Billing"   color={BRAND.blue}   t={t} />
        <StatCard label="Bills Today"       color="#2ecc71"      t={t} />
        <StatCard label="Pending Payments"  color={BRAND.purple} t={t} />
        <StatCard label="Returns/Refunds"   color={BRAND.pink}   t={t} />
        <StatCard label="Active EMIs"       color="#3498db"      t={t} />
        <StatCard label="Coupons Used"      color="#f0c040"      t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── NEW INVOICE ── */}
      {tab === "new" && (
        <div>
          {/* Invoice type pills */}
          <Card t={t}>
            <CardHeader title="Invoice Type" t={t} />
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {INV_TYPES.map((type) => (
                <button key={type} onClick={() => setInvType(type)}
                  style={{ padding:"6px 14px", borderRadius:20, cursor:"pointer",
                    fontSize:12, fontWeight:600, fontFamily:"inherit", border:"none",
                    background: invType === type ? BRAND.gradBtn : t.card2 || t.card,
                    color: invType === type ? "#fff" : t.textSub,
                    border: invType === type ? "none" : `1px solid ${t.borderDash}`,
                    boxShadow: invType === type ? "0 2px 10px rgba(59,85,230,0.25)" : "none",
                  }}>
                  {type}
                </button>
              ))}
            </div>
          </Card>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:16 }}>
            <div>
              {/* Invoice Details */}
              <Card t={t}>
                <CardHeader title="Invoice Details" t={t} />
                <FormGrid>
                  <FormGroup label="Invoice No" t={t} half>
                    <Input t={t} placeholder="Auto-generated" readOnly style={{ opacity:0.7 }} />
                  </FormGroup>
                  <FormGroup label="Date" t={t} half>
                    <Input t={t} type="date" />
                  </FormGroup>
                  <FormGroup label="Customer *" t={t} half>
                    <Select t={t}><option>-- Select Customer --</option></Select>
                  </FormGroup>
                  <FormGroup label="Customer GSTIN" t={t} half>
                    <Input t={t} placeholder="For B2B / Wholesale" />
                  </FormGroup>
                  <FormGroup label="Salesperson" t={t} half>
                    <Select t={t}><option>-- Select --</option></Select>
                  </FormGroup>
                  <FormGroup label="HSN Code" t={t} half>
                    <Input t={t} defaultValue="7113" />
                  </FormGroup>
                </FormGrid>
              </Card>

              {/* Items */}
              <Card t={t}>
                <CardHeader title="Items" t={t}
                  actions={<BtnSm t={t} primary>+ Add Item</BtnSm>} />
                <DataTable
                  columns={["Description","HSN","Purity","Wt(g)","Rate/g","Making(₹)","Stone(₹)","GST%","Disc%","Amount",""]}
                  t={t} emptyMsg="Add an item to get started" />
                {/* Totals */}
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:14 }}>
                  <div style={{ width:280 }}>
                    {[["Subtotal","₹0"],["CGST (1.5%)","₹0"],["SGST (1.5%)","₹0"],
                      ["Discount","- ₹0"],["TCS (if >₹2L)","₹0"]].map(([k,v]) => (
                      <div key={k} style={{ display:"flex", justifyContent:"space-between",
                        padding:"4px 0", fontSize:13, color:t.textSub }}>
                        <span>{k}</span><span>{v}</span>
                      </div>
                    ))}
                    <div style={{ display:"flex", justifyContent:"space-between",
                      padding:"10px 0 4px", borderTop:`2px solid ${t.borderDash}`,
                      marginTop:6, fontSize:15, fontWeight:800, color:BRAND.purple }}>
                      <span>Grand Total</span><span>₹0</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Discount & Coupon */}
              <Card t={t}>
                <CardHeader title="Discount · Coupon · Gift Voucher" t={t} />
                <FormGrid>
                  <FormGroup label="Discount (%)" t={t} half><Input t={t} type="number" defaultValue="0" /></FormGroup>
                  <FormGroup label="Discount (₹)" t={t} half><Input t={t} type="number" defaultValue="0" /></FormGroup>
                  <FormGroup label="Coupon Code" t={t} half>
                    <div style={{ display:"flex", gap:8 }}>
                      <Input t={t} placeholder="e.g. DIWALI10" />
                      <BtnSm t={t}>Apply</BtnSm>
                    </div>
                  </FormGroup>
                  <FormGroup label="Gift Voucher No." t={t} half>
                    <div style={{ display:"flex", gap:8 }}>
                      <Input t={t} placeholder="GV-XXXX-XXXX" />
                      <BtnSm t={t}>Apply</BtnSm>
                    </div>
                  </FormGroup>
                  <FormGroup label="Old Gold Exchange (₹)" t={t} half>
                    <Input t={t} type="number" defaultValue="0" />
                  </FormGroup>
                </FormGrid>
              </Card>

              {/* Payment Mode */}
              <Card t={t}>
                <CardHeader title="Payment Mode" t={t}
                  actions={<BtnSm t={t}>Split Payment</BtnSm>} />
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
                  {PAY_MODES.map((m) => (
                    <button key={m} onClick={() => setPayMode(m)}
                      style={{ padding:"6px 14px", borderRadius:20, cursor:"pointer",
                        fontSize:12, fontWeight:600, fontFamily:"inherit",
                        background: payMode === m ? BRAND.gradBtn : "none",
                        color: payMode === m ? "#fff" : t.textSub,
                        border: payMode === m ? "none" : `1px solid ${t.borderDash}`,
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
                {payMode === "Cash" && (
                  <FormGrid>
                    <FormGroup label="Amount Received (₹)" t={t} half><Input t={t} type="number" placeholder="0.00" /></FormGroup>
                    <FormGroup label="Change / Balance (₹)" t={t} half><Input t={t} value="₹0" readOnly style={{ color:"#2ecc71", fontWeight:700 }} /></FormGroup>
                  </FormGrid>
                )}
                {payMode === "UPI" && (
                  <FormGrid>
                    <FormGroup label="UPI App" t={t} half>
                      <Select t={t}><option>Google Pay</option><option>PhonePe</option><option>Paytm</option><option>BHIM</option></Select>
                    </FormGroup>
                    <FormGroup label="UPI Transaction ID" t={t} half><Input t={t} placeholder="12-digit UTR/TXN ID" /></FormGroup>
                  </FormGrid>
                )}
                {payMode === "Card" && (
                  <FormGrid>
                    <FormGroup label="Card Type" t={t} half>
                      <Select t={t}><option>Visa</option><option>Mastercard</option><option>Rupay</option></Select>
                    </FormGroup>
                    <FormGroup label="Last 4 Digits" t={t} half><Input t={t} placeholder="XXXX" maxLength={4} /></FormGroup>
                    <FormGroup label="Bank Name" t={t} half><Input t={t} placeholder="e.g. HDFC Bank" /></FormGroup>
                    <FormGroup label="Approval Code" t={t} half><Input t={t} placeholder="Transaction ref" /></FormGroup>
                  </FormGrid>
                )}
                {payMode === "EMI" && (
                  <FormGrid>
                    <FormGroup label="Down Payment (₹)" t={t} half><Input t={t} type="number" placeholder="0.00" /></FormGroup>
                    <FormGroup label="Installments" t={t} half>
                      <Select t={t}><option>3</option><option>6</option><option>12</option><option>18</option><option>24</option></Select>
                    </FormGroup>
                    <FormGroup label="Interest Rate (%)" t={t} half><Input t={t} type="number" defaultValue="0" /></FormGroup>
                    <FormGroup label="First Due Date" t={t} half><Input t={t} type="date" /></FormGroup>
                  </FormGrid>
                )}
                <div style={{ display:"flex", gap:10, marginTop:16, justifyContent:"flex-end" }}>
                  <BtnOutline t={t}>Save Draft</BtnOutline>
                  <BtnOutline t={t}>Preview</BtnOutline>
                  <BtnPrimary>Finalize & Print</BtnPrimary>
                </div>
              </Card>
            </div>

            {/* Live Preview */}
            <div>
              <Card t={t} style={{ position:"sticky", top:80 }}>
                <CardHeader title="Live Preview" t={t} />
                <div style={{ background:"#fff", borderRadius:8, padding:16,
                  color:"#333", fontSize:12, border:`1px solid ${t.borderDash}` }}>
                  <div style={{ textAlign:"center", marginBottom:8, paddingBottom:8,
                    borderBottom:`2px solid ${BRAND.purple}` }}>
                    <div style={{ fontWeight:800, color:BRAND.purple }}>CERITAGE JEWELRY</div>
                    <div style={{ fontSize:10, color:"#777" }}>Mumbai · GSTIN: — · +91 —</div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <div><b style={{ color:BRAND.purple }}>TAX INVOICE</b></div>
                    <div style={{ fontSize:10 }}>—</div>
                  </div>
                  <div style={{ background:"#f9f6ff", padding:6, borderRadius:5,
                    marginBottom:8, fontSize:11 }}>
                    <b>Bill To:</b> —
                  </div>
                  <div style={{ textAlign:"right", borderTop:`1px solid #eee`, paddingTop:6 }}>
                    <div style={{ fontWeight:800, color:BRAND.purple }}>Total: ₹0</div>
                  </div>
                  <div style={{ textAlign:"center", marginTop:8, fontSize:10, color:"#aaa" }}>
                    Thank you for shopping at Ceritage
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <BtnSm t={t} style={{ flex:1 }}>WhatsApp</BtnSm>
                  <BtnSm t={t} style={{ flex:1 }}>Email</BtnSm>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ── ALL BILLS ── */}
      {tab === "list" && (
        <Card t={t}>
          <CardHeader title="All Invoices" t={t}
            actions={<>
              <input placeholder="Search invoice, customer..." style={{
                background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                borderRadius:8, padding:"7px 12px", fontSize:13,
                color:t.inputColor, outline:"none", fontFamily:"inherit", width:200 }} />
              <Select t={t} style={{ width:140 }}>
                <option>All Types</option>
                {INV_TYPES.map(tp => <option key={tp}>{tp}</option>)}
              </Select>
              <Select t={t} style={{ width:120 }}>
                <option>All Status</option>
                <option>Paid</option><option>Partial</option><option>Credit</option><option>Draft</option>
              </Select>
            </>} />
          <DataTable
            columns={["Invoice No","Type","Date","Customer","Subtotal","GST","Total","Payment","Status","Actions"]}
            t={t} emptyMsg="invoices will load from backend" />
        </Card>
      )}

      {/* ── RECEIPT ── */}
      {tab === "receipt" && (
        <Card t={t}>
          <CardHeader title="Invoice Receipt" t={t} />
          <div style={{ overflowX:"auto" }}>
            <div style={{ background:"#fff", color:"#333", border:`1px solid ${t.borderDash}`,
              borderRadius:10, padding:28, maxWidth:760, margin:"0 auto" }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                marginBottom:16, paddingBottom:12, borderBottom:`2px solid ${BRAND.purple}` }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:BRAND.purple }}>CERITAGE JEWELRY</div>
                  <div style={{ fontSize:11, color:"#777" }}>Mumbai · GSTIN: — · +91 —</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:700 }}>TAX INVOICE</div>
                  <div style={{ fontSize:12, color:"#777" }}>Invoice No: —</div>
                  <div style={{ fontSize:12, color:"#777" }}>Date: —</div>
                </div>
              </div>
              <div style={{ textAlign:"center", padding:"28px", color:"#aaa", fontSize:13 }}>
                Select an invoice from "All Bills" tab to view receipt
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:16 }}>
            <BtnPrimary>Print Invoice</BtnPrimary>
            <BtnOutline t={t}>Download PDF</BtnOutline>
            <BtnOutline t={t}>WhatsApp</BtnOutline>
          </div>
        </Card>
      )}

      {/* ── CREDIT / DEBIT NOTES ── */}
      {tab === "notes" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="New Credit Note" t={t} />
            <FormGrid>
              <FormGroup label="Credit Note No." t={t} half><Input t={t} placeholder="CN-2026-XXXX" /></FormGroup>
              <FormGroup label="Against Invoice" t={t} half><Input t={t} placeholder="INV-2026-XXXX" /></FormGroup>
              <FormGroup label="Customer *" t={t} half><Select t={t}><option>-- Select --</option></Select></FormGroup>
              <FormGroup label="Date" t={t} half><Input t={t} type="date" /></FormGroup>
              <FormGroup label="Reason" t={t} half>
                <Select t={t}><option>Return of Goods</option><option>Price Correction</option><option>Discount Adjustment</option></Select>
              </FormGroup>
              <FormGroup label="Credit Amount (₹)" t={t} half><Input t={t} type="number" placeholder="0.00" /></FormGroup>
            </FormGrid>
            <BtnPrimary style={{ width:"100%", marginTop:8 }}>Issue Credit Note</BtnPrimary>
          </Card>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="New Debit Note" t={t} />
            <FormGrid>
              <FormGroup label="Debit Note No." t={t} half><Input t={t} placeholder="DN-2026-XXXX" /></FormGroup>
              <FormGroup label="Against Invoice" t={t} half><Input t={t} placeholder="INV-2026-XXXX" /></FormGroup>
              <FormGroup label="Customer *" t={t} half><Select t={t}><option>-- Select --</option></Select></FormGroup>
              <FormGroup label="Date" t={t} half><Input t={t} type="date" /></FormGroup>
              <FormGroup label="Reason" t={t} half>
                <Select t={t}><option>Price Increase</option><option>Short Payment</option><option>Additional Charges</option></Select>
              </FormGroup>
              <FormGroup label="Debit Amount (₹)" t={t} half><Input t={t} type="number" placeholder="0.00" /></FormGroup>
            </FormGrid>
            <BtnPrimary style={{ width:"100%", marginTop:8 }}>Issue Debit Note</BtnPrimary>
          </Card>
        </div>
      )}

      {/* ── RETURNS ── */}
      {tab === "returns" && (
        <Card t={t}>
          <CardHeader title="Returns & Refunds" t={t}
            actions={<BtnSm t={t} primary>New Return</BtnSm>} />
          <DataTable
            columns={["Return No.","Type","Date","Customer","Orig. Invoice","Reason","Refund Amt","Mode","Status"]}
            t={t} emptyMsg="returns will load from backend" />
        </Card>
      )}
    </div>
  );
}
