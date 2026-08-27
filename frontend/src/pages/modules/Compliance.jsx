import { BRAND } from "../../theme.js";
import { PageHeader, Card, CardHeader, StatCard, DataTable, BtnPrimary } from "../../components/ui";

export default function Compliance({ t }) {
  return (
    <div>
      <PageHeader title="TCS & Compliance"
        subtitle="TCS on ₹2L+ cash · KYC tracking · Regulatory compliance"
        t={t} actions={<BtnPrimary>Export Report</BtnPrimary>} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="TCS Collected (Month)" color={BRAND.blue}   t={t} />
        <StatCard label="KYC Completed"         color="#2ecc71"      t={t} />
        <StatCard label="Pending KYC"           color="#f39c12"      t={t} />
        <StatCard label="TCS Compliance"        color={BRAND.purple} t={t} />
      </div>
      <Card t={t}>
        <CardHeader title="High-Value Transaction Log (>₹2 Lakh)" t={t} />
        <DataTable
          columns={["Invoice","Date","Customer","Amount","Payment","TCS %","TCS Collected","KYC","Status"]}
          t={t} emptyMsg="high-value transactions will load from backend" />
      </Card>
      <Card t={t}>
        <CardHeader title="TCS Rules — Jewelry" t={t} />
        {[
          ["TCS Rate on Cash Purchase >₹2L","1%"],
          ["TCS Rate on Sale of Goods >₹50L","0.1%"],
          ["PAN Mandatory for","Purchase >₹2 Lakh"],
          ["Aadhaar / PAN KYC Required","Yes — for all high-value"],
          ["PMLA Reporting Threshold","₹10 Lakh"],
        ].map(([rule, val]) => (
          <div key={rule} style={{ display:"flex", justifyContent:"space-between",
            padding:"10px 12px", background:t.card2||t.card,
            border:`1px solid ${t.borderDash}`, borderRadius:8, marginBottom:8, fontSize:13 }}>
            <span style={{ color:t.textSub }}>{rule}</span>
            <span style={{ fontWeight:700, color:BRAND.purple }}>{val}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
