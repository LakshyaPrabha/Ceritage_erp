import { BRAND } from "../../theme.js";
import { PageHeader, Card, CardHeader, StatCard, DataTable, BtnPrimary, BtnOutline } from "../../components/ui";

export default function Payments({ t }) {
  return (
    <div>
      <PageHeader title="Payment Modes"
        subtitle="Cash · UPI · Card · Cheque · NEFT/RTGS · Reconciliation"
        t={t} actions={<BtnPrimary>New Payment</BtnPrimary>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="Cash"        color="#2ecc71"      t={t} />
        <StatCard label="UPI"         color={BRAND.blue}   t={t} />
        <StatCard label="Card"        color={BRAND.purple} t={t} />
        <StatCard label="NEFT/RTGS"   color={BRAND.pink}   t={t} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card t={t} style={{ marginBottom:0 }}>
          <CardHeader title="Today's Payment Breakdown" t={t} />
          {[["Cash","—","36%",BRAND.blue],["UPI (GPay/PhonePe/Paytm)","—","46%","#2ecc71"],
            ["Card (Debit/Credit)","—","21%",BRAND.purple],["NEFT/RTGS/Cheque","—","high value","#f39c12"]].map(([label,val,pct,color]) => (
            <div key={label} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                <span style={{ color:t.textSub }}>{label}</span>
                <span style={{ fontWeight:700, color }}>{val} ({pct})</span>
              </div>
              <div style={{ height:6, borderRadius:3, background:t.borderDash, overflow:"hidden" }}>
                <div style={{ height:"100%", width:"40%", background:color, borderRadius:3 }} />
              </div>
            </div>
          ))}
        </Card>

        <Card t={t} style={{ marginBottom:0 }}>
          <CardHeader title="Payment Settings" t={t} />
          {["Accept UPI Payments","Accept Credit Card","Enable Credit Sales",
            "Auto-print Receipt","TCS on >₹2L (Cash)"].map((item) => (
            <div key={item} style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:14 }}>
              <span style={{ fontSize:13, color:t.textSub }}>{item}</span>
              <div style={{ width:40, height:22, borderRadius:11, background:BRAND.gradBtn,
                cursor:"pointer", position:"relative" }}>
                <div style={{ position:"absolute", right:3, top:3, width:16, height:16,
                  borderRadius:"50%", background:"#fff" }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
