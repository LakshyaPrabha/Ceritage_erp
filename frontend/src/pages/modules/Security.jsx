import { BRAND } from "../../theme.js";
import { PageHeader, Card, CardHeader, DataTable, BtnPrimary } from "../../components/ui";

const SETTINGS = [
  "Two-Factor Authentication (2FA)",
  "Session Timeout (30 min)",
  "Delete Permissions for All Users",
  "IP Whitelist Enabled",
  "Biometric Login (Cashier)",
  "CCTV Integration",
];

export default function Security({ t }) {
  return (
    <div>
      <PageHeader title="Security Settings"
        subtitle="Access control · Audit logs · Session & data protection"
        t={t} actions={<BtnPrimary>Save Settings</BtnPrimary>} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card t={t} style={{ marginBottom:0 }}>
          <CardHeader title="Security Configuration" t={t} />
          {SETTINGS.map((item) => (
            <div key={item} style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:16 }}>
              <span style={{ fontSize:13, color:t.textSub }}>{item}</span>
              <div style={{ width:40, height:22, borderRadius:11, background:BRAND.gradBtn,
                cursor:"pointer", position:"relative" }}>
                <div style={{ position:"absolute", right:3, top:3, width:16, height:16,
                  borderRadius:"50%", background:"#fff" }} />
              </div>
            </div>
          ))}
        </Card>
        <Card t={t} style={{ marginBottom:0 }}>
          <CardHeader title="Audit Log" t={t} />
          <DataTable
            columns={["Time","User","Action","IP","Module"]}
            t={t} emptyMsg="audit log will load from backend" />
        </Card>
      </div>
    </div>
  );
}
