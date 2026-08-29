import { BRAND } from "../../theme.js";
import { PageHeader, Card, CardHeader, DataTable, BtnPrimary, BtnOutline } from "../../components/ui";

export default function Branch({ t }) {
  return (
    <div>
      <PageHeader title="Multi-Branch Management"
        subtitle="Manage multiple store branches, transfers & consolidated reports"
        t={t}
        actions={<BtnPrimary>+ Add Branch</BtnPrimary>} />

      {/* Branch cards — aayenge */}
      <div style={{ background:t.card, border:`1px dashed ${t.borderDash}`,
        borderRadius:12, padding:"28px 20px", marginBottom:22,
        textAlign:"center", color:t.textFaint, fontSize:13 }}>
        branches will load from backend — — branch cards will appear here
      </div>

      {/* Branch KPI summary */}
      <Card t={t}>
        <CardHeader title="Branch Performance Summary" t={t}
          actions={<BtnOutline t={t} style={{ padding:"5px 12px", fontSize:12 }}>Export</BtnOutline>} />
        <DataTable
          columns={["Branch","City","Manager","Total Sales","Total Items","Stock Value","Staff","Status"]}
          t={t}
          emptyMsg="branch data will load from backend" />
      </Card>

      {/* Inter-branch transfers */}
      <Card t={t}>
        <CardHeader title="Inter-Branch Stock Transfers" t={t}
          actions={<BtnPrimary style={{ padding:"6px 14px", fontSize:12 }}>+ New Transfer</BtnPrimary>} />
        <DataTable
          columns={["Transfer ID","From","To","Items","Date","By","Value","Status","Actions"]}
          t={t}
          emptyMsg="transfers will load from backend" />
      </Card>
    </div>
  );
}
