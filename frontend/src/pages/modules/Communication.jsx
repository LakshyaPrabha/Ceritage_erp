import { BRAND } from "../../theme.js";
import { PageHeader, Card, CardHeader, StatCard, DataTable, BtnPrimary, BtnOutline,
         FormGroup, FormGrid, Select, Input } from "../../components/ui";

const TEMPLATES = [
  { name:"Birthday Wishes",  content:"Dear {name}, wishing you a sparkling birthday! Enjoy 5% off. - Ceritage" },
  { name:"Repair Ready",     content:"Hi {name}, your repair job {job_id} is ready for pickup." },
  { name:"EMI Reminder",     content:"Dear {name}, your EMI of ₹{amount} is due on {date}." },
  { name:"Festival Offer",   content:"Special offer at Ceritage! Visit us for exclusive deals." },
];

export default function Communication({ t }) {
  return (
    <div>
      <PageHeader title="Communication Center"
        subtitle="WhatsApp · SMS · Email campaigns & customer messaging"
        t={t} actions={<BtnPrimary>Send Message</BtnPrimary>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="WhatsApp Contacts" color={BRAND.blue}   t={t} />
        <StatCard label="Msgs Sent Today"   color="#2ecc71"      t={t} />
        <StatCard label="Open Rate"         color={BRAND.purple} t={t} />
        <StatCard label="Active Campaigns"  color={BRAND.pink}   t={t} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
        {/* Bulk message */}
        <Card t={t} style={{ marginBottom:0 }}>
          <CardHeader title="Bulk Message" t={t} />
          <FormGrid>
            <FormGroup label="Channel"  t={t} half>
              <Select t={t}><option>WhatsApp</option><option>SMS</option><option>Email</option></Select>
            </FormGroup>
            <FormGroup label="Send To"  t={t} half>
              <Select t={t}>
                <option>All Customers</option><option>Gold Members</option>
                <option>Platinum Members</option><option>Customers with Due</option>
                <option>Birthday This Month</option>
              </Select>
            </FormGroup>
            <FormGroup label="Template" t={t} half>
              <Select t={t}><option value="">Custom</option>
                {TEMPLATES.map(tp => <option key={tp.name}>{tp.name}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Message" t={t}>
              <textarea rows={4} placeholder="Type your message here..." style={{
                width:"100%", background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                borderRadius:9, padding:"10px 13px", fontSize:13, color:t.inputColor,
                outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical" }} />
            </FormGroup>
          </FormGrid>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <BtnOutline t={t}>Preview</BtnOutline>
            <BtnPrimary style={{ flex:1 }}>Send Now</BtnPrimary>
          </div>
        </Card>

        {/* Message log */}
        <Card t={t} style={{ marginBottom:0 }}>
          <CardHeader title="Message Log" t={t} />
          <DataTable
            columns={["To","Channel","Template","Date","Status"]}
            t={t} emptyMsg="message log will load from backend" />
        </Card>
      </div>

      {/* Templates */}
      <Card t={t}>
        <CardHeader title="Message Templates" t={t}
          actions={<BtnPrimary style={{ padding:"6px 14px", fontSize:12 }}>+ New Template</BtnPrimary>} />
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {TEMPLATES.map((tp) => (
            <div key={tp.name} style={{ background:t.card2||t.card,
              border:`1px solid ${t.borderDash}`, borderRadius:9, padding:"12px 14px" }}>
              <div style={{ fontWeight:700, fontSize:13, color:t.text, marginBottom:4 }}>{tp.name}</div>
              <div style={{ fontSize:12, color:t.textMuted, lineHeight:1.5 }}>{tp.content}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
