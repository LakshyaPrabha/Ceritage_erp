﻿import { BRAND } from "../../theme.js";
import { StatCard, Card, CardHeader, BtnPrimary, BtnOutline, DataTable } from "../../components/ui";

const KPI_LABELS = [
  { key:"todaySales",     label:"Today's Sales",   color:BRAND.blue },
  { key:"billsToday",     label:"Bills Today",     color:"#2ecc71" },
  { key:"totalCustomers", label:"Total Customers", color:BRAND.purple },
  { key:"pendingRepairs", label:"Pending Repairs", color:BRAND.pink },
  { key:"stockItems",     label:"Stock Items",     color:"#3498db" },
  { key:"goldInStock",    label:"Gold in Stock",   color:BRAND.blue },
];

const QUICK_ACTIONS = [
  { label:"New Bill",         module:"billing",       primary:true },
  { label:"Add Customer",     module:"customers" },
  { label:"New Repair",       module:"repair" },
  { label:"New Order",        module:"orders" },
  { label:"Purchase Entry",   module:"purchase" },
  { label:"Gold Exchange",    module:"gold-exchange" },
  { label:"Issue to Karigar", module:"karigar" },
  { label:"Update Rates",     module:"rates" },
];

export default function DashboardHome({ t, onNavigate }) {
  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", marginBottom:24,
        flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontSize:21, fontWeight:700, margin:0,
            background:BRAND.grad, WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            Dashboard
          </h2>
          <p style={{ fontSize:12, color:t.textMuted, margin:"5px 0 0" }}>
            Ceritage Jewelry ERP — Admin Panel
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <BtnOutline t={t} onClick={() => onNavigate("rates")}>Update Rates</BtnOutline>
          <BtnPrimary onClick={() => onNavigate("billing")}>New Invoice</BtnPrimary>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",
        gap:14, marginBottom:24 }}>
        {KPI_LABELS.map((k) => (
          <StatCard key={k.key} label={k.label} color={k.color} t={t} />
        ))}
      </div>

      {/* Two col */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:16, marginBottom:18 }}>
        {/* Quick Actions */}
        <Card t={t}>
          <CardHeader title="Quick Actions" t={t} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {QUICK_ACTIONS.map((a) => (
              a.primary
                 ? <BtnPrimary key={a.module} onClick={() => onNavigate(a.module)}>{a.label}</BtnPrimary>
                : <BtnOutline key={a.module} t={t} onClick={() => onNavigate(a.module)}>{a.label}</BtnOutline>
            ))}
          </div>
        </Card>

        {/* Alerts */}
        <Card t={t}>
          <CardHeader title="Alerts & Notifications" t={t} />
          <div style={{ textAlign:"center", padding:"28px 16px",
            color:t.textFaint, fontSize:13, lineHeight:1.7,
            border:`1px dashed ${t.borderDash}`, borderRadius:9 }}>
            Alerts will appear after backend is connected.
          </div>
        </Card>
      </div>

      {/* Recent Bills */}
      <Card t={t}>
        <CardHeader title="Recent Bills"
          actions={<BtnOutline t={t} onClick={() => onNavigate("billing")} style={{padding:"5px 12px",fontSize:12}}>View All</BtnOutline>}
          t={t} />
        <DataTable
          columns={["Bill No","Customer","Amount","Payment Mode","Status"]}
          t={t}
          emptyMsg="recent bills will load from backend" />
      </Card>
    </div>
  );
}
