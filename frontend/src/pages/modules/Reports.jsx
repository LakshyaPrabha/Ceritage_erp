﻿import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable, BtnPrimary, BtnOutline, BtnSm, Select, Input } from "../../components/ui";

const TABS = [
  { id:"sales",      label:"Sales" },
  { id:"purchase",   label:"Purchase" },
  { id:"inventory",  label:"Inventory" },
  { id:"stock",      label:"Stock" },
  { id:"customer",   label:"Customer" },
  { id:"supplier",   label:"Supplier" },
  { id:"employee",   label:"Employee" },
  { id:"karigar",    label:"Karigar" },
  { id:"profit",     label:"Profit" },
  { id:"gst",        label:"GST" },
  { id:"financial",  label:"Financial" },
  { id:"gold",       label:"Gold Rates" },
  { id:"daily",      label:"Daily" },
  { id:"monthly",    label:"Monthly" },
  { id:"yearly",     label:"Yearly" },
];

export default function Reports({ t }) {
  const [tab, setTab] = useState("sales");

  const tableMap = {
    sales:     { title:"Daily Sales — Last 7 Days", cols:["Date","Bills","Gross Sales","Discount","Returns","Net Sales","Cash","UPI","Card","Credit","Share"] },
    purchase:  { title:"Purchase Orders", cols:["PO No.","Date","Supplier","Item","Qty","Rate","Amount","GST","Total","Paid","Balance","Status"] },
    inventory: { title:"Inventory by Category", cols:["Category","SKUs","Qty","Total Weight","Valuation","Value Share","Low Stock","Out of Stock"] },
    stock:     { title:"Stock Report — All Items", cols:["SKU","Name","Category","Purity","Weight","Qty","MRP","Stock Value","Branch","Status"] },
    customer:  { title:"Customer Report", cols:["ID","Name","Phone","City","Tier","Total Purchase","Balance Due","Loyalty Pts","KYC","Last Visit"] },
    supplier:  { title:"Supplier Report", cols:["ID","Supplier","Type","City","Total Purchased","Outstanding","Credit Limit","Rating","Status"] },
    employee:  { title:"Employee Report", cols:["Name","Role","Branch","Gross Salary","Net Pay","Attendance","Att%","Rating","Sales vs Target"] },
    karigar:   { title:"Karigar Report", cols:["Karigar","Skill","Jobs","Gold Issued","Gold Received","Wastage","Wastage%","Labour","Paid","Pending"] },
    profit:    { title:"Monthly Profit Report", cols:["Month","Sales","Purchase","OpEx","Net Profit","Margin","MoM Growth"] },
    gst:       { title:"GST Returns Summary", cols:["Period","Taxable Value","CGST","SGST","IGST","Total GST","ITC","Net Payable","Status"] },
    financial: { title:"Financial Report", cols:["Month","Revenue","Expenses","Profit","Assets","Liabilities","Net Worth"] },
    gold:      { title:"Gold Rate Report — Last 10 Days", cols:["Date","22K ₹/g","24K ₹/g","18K ₹/g","Silver ₹/g","Platinum","USD/INR","Day Change"] },
    daily:     { title:"Daily Business Report", cols:["Date","Sales","Bills","Returns","Net Sales","Cash","UPI","Card","Credit"] },
    monthly:   { title:"Monthly Performance", cols:["Month","Sales","Purchase","Expenses","Profit","Margin","Bills","New Customers"] },
    yearly:    { title:"Yearly Business Report", cols:["Year","Total Sales","Purchase","Expenses","Net Profit","Margin","Customers","YoY Growth"] },
  };

  const current = tableMap[tab];

  return (
    <div>
      <PageHeader title="Reports"
        subtitle="Sales · Purchase · Inventory · Customer · Profit · GST · Daily · Monthly · Yearly"
        t={t}
        actions={<>
          <Select t={t} style={{ width:150 }}>
            <option>Current Month</option><option>Last Month</option><option>FY 2025-26</option>
          </Select>
          <BtnOutline t={t}>Export Excel</BtnOutline>
          <BtnPrimary>Print All</BtnPrimary>
        </>} />

      {/* Quick access cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",
        gap:10, marginBottom:22 }}>
        {[["Sales","sales"],["Purchase","purchase"],["Inventory","inventory"],
          ["GST","gst"],["Profit","profit"],["Daily","daily"],
          ["Gold Rates","gold"],["Yearly","yearly"]].map(([label, id]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ background: tab === id  ? BRAND.gradBtn : t.card,
              border:`1px solid ${t.borderDash}`,
              borderRadius:10, padding:"14px 10px", textAlign:"center",
              cursor:"pointer", fontFamily:"inherit",
              boxShadow: tab === id ? "0 3px 14px rgba(59,85,230,0.25)" : t.cardShadow }}>
            <div style={{ fontSize:20, fontWeight:800, marginBottom:6,
              color: tab === id ? "#fff" : BRAND.purple }}>
              {label.charAt(0)}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color: tab === id ? "#fff" : t.text }}>
              {label}
            </div>
          </button>
        ))}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* KPI row for sales */}
      {tab === "sales" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
          gap:12, marginBottom:18 }}>
          <StatCard label="Total Bills (7 days)" color={BRAND.blue}   t={t} />
          <StatCard label="Net Sales"            color="#2ecc71"      t={t} />
          <StatCard label="Returns"              color={BRAND.pink}   t={t} />
          <StatCard label="Daily Average"        color={BRAND.purple} t={t} />
        </div>
      )}

      <Card t={t}>
        <CardHeader title={current?.title || tab} t={t}
          actions={<>
            <Input t={t} type="date" style={{ width:140 }} />
            <Input t={t} type="date" style={{ width:140 }} />
            <BtnSm t={t}>Excel</BtnSm>
            <BtnSm t={t} primary>PDF</BtnSm>
          </>} />
        <DataTable columns={current?.cols || []} t={t} emptyMsg="report data will load from backend" />
      </Card>
    </div>
  );
}
