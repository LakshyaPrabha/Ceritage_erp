﻿import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable, BtnPrimary, BtnOutline, BtnSm, Select } from "../../components/ui";

const TABS = [
  { id:"daily",     label:"Daily Sales" },
  { id:"monthly",   label:"Monthly Sales" },
  { id:"yearly",    label:"Yearly Sales" },
  { id:"best",      label:"Best Products" },
  { id:"lowstock",  label:"Low Stock" },
  { id:"customers", label:"Customer" },
  { id:"profit",    label:"Profit" },
  { id:"branch",    label:"Branch" },
  { id:"employee",  label:"Employee" },
];

export default function Analytics({ t }) {
  const [tab, setTab] = useState("daily");

  return (
    <div>
      <PageHeader title="Analytics Dashboard"
        subtitle="Daily · Monthly · Yearly Sales · Best Products · Customer · Profit · Branch · Employee"
        t={t}
        actions={<>
          <Select t={t} style={{ width:160 }}>
            <option>This Year (2026)</option><option>Last Year (2025)</option>
          </Select>
          <BtnOutline t={t}>Export</BtnOutline>
          <BtnPrimary>Refresh</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Annual Revenue"  color={BRAND.blue}   t={t} />
        <StatCard label="Profit Margin"   color="#2ecc71"      t={t} />
        <StatCard label="Today's Sales"   color={BRAND.purple} t={t} />
        <StatCard label="Total Customers" color={BRAND.blue}   t={t} />
        <StatCard label="Low/Out of Stock" color={BRAND.pink}  t={t} />
        <StatCard label="Branches Active" color="#3498db"      t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* Chart placeholder */}
      <Card t={t}>
        <CardHeader title={`${tab.charAt(0).toUpperCase()+tab.slice(1)} Analytics`} t={t}
          actions={<BtnSm t={t}>Export</BtnSm>} />
        <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center",
          background:t.card2||t.card, borderRadius:9, border:`1px dashed ${t.borderDash}`,
          marginBottom:16 }}>
          <div style={{ textAlign:"center", color:t.textFaint, fontSize:13 }}>
            Chart will appear here after backend data is connected
          </div>
        </div>
        <DataTable
          columns={tab === "daily"
             ? ["Date","Bills","Revenue","Returns","Net Sales","Cash","UPI","Card","Share"]
            : tab === "monthly"
             ? ["Month","Revenue","Cost","Profit","Margin","Bills","MoM Growth","Share"]
            : tab === "best"
             ? ["#","Product","Units Sold","Revenue","Margin","Revenue Share"]
            : tab === "customers"
             ? ["#","Customer","Tier","Total Spent","Visits","Avg/Visit"]
            : tab === "branch"
             ? ["Branch","Sales","Bills","Customers","Stock Value","Staff"]
            : tab === "employee"
             ? ["#","Employee","Sales Achieved","Target","Bills","Customers","Avg Ticket","Rating"]
            : ["Month","Revenue","COGS","Gross Profit","OpEx","Net Profit","Margin"]}
          t={t} emptyMsg="analytics data will load from backend" />
      </Card>
    </div>
  );
}
