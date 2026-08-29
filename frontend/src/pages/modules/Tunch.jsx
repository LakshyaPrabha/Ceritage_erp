import { BRAND } from "../../theme.js";
import { PageHeader, Card, CardHeader, StatCard, DataTable, BtnPrimary } from "../../components/ui";

export default function Tunch({ t }) {
  return (
    <div>
      <PageHeader title="Fine Metal Ledger & Tunch Accounting"
        subtitle="Pure metal accounting · Tunch calculation · Bullion ledger"
        t={t} actions={<BtnPrimary>+ New Entry</BtnPrimary>} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="Fine Gold Balance"   color="#f0c040"   t={t} />
        <StatCard label="Fine Silver Balance" color="#95a5a6"   t={t} />
        <StatCard label="Issued to Karigars" color={BRAND.pink} t={t} />
        <StatCard label="Received Back"      color="#2ecc71"    t={t} />
      </div>
      <Card t={t}>
        <CardHeader title="Tunch (Purity) Ledger" t={t} />
        <DataTable
          columns={["Date","Transaction","Party","Gross Wt","Tunch %","Fine Wt","Type"]}
          t={t} emptyMsg="tunch ledger will load from backend" />
      </Card>
    </div>
  );
}
