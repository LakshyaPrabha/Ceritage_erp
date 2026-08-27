import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, FormGroup, FormGrid, Input, Select } from "../../components/ui";

const TABS = [
  { id:"live",      label:"Live Stock" },
  { id:"branch",    label:"Multi-Branch" },
  { id:"transfer",  label:"Transfer" },
  { id:"reserved",  label:"Reserved" },
  { id:"damaged",   label:"Damaged" },
  { id:"lost",      label:"Lost" },
  { id:"adj",       label:"Adjustment" },
  { id:"audit",     label:"Audit" },
  { id:"movement",  label:"Movement" },
  { id:"lowstock",  label:"Low Stock" },
  { id:"reorder",   label:"Reorder" },
  { id:"batch",     label:"Batch" },
  { id:"serial",    label:"Serial No." },
];

export default function Inventory({ t }) {
  const [tab, setTab] = useState("live");

  return (
    <div>
      <PageHeader title="Inventory Management"
        subtitle="Live Stock · Multi-Branch · Transfer · Reserved · Damaged · Audit · Low Stock · Reorder"
        t={t}
        actions={<>
          <BtnOutline t={t}>Stock Report</BtnOutline>
          <BtnOutline t={t}>Start Audit</BtnOutline>
          <BtnPrimary>Transfer Stock</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Total Items"       color={BRAND.blue}   t={t} />
        <StatCard label="Stock Valuation"   color="#2ecc71"      t={t} />
        <StatCard label="Low Stock Items"   color="#f39c12"      t={t} />
        <StatCard label="Out of Stock"      color="#e74c3c"      t={t} />
        <StatCard label="Branches"          color={BRAND.purple} t={t} />
        <StatCard label="Active Batches"    color="#3498db"      t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "live" && (
        <Card t={t}>
          <CardHeader title="Live Stock — All Items" t={t}
            actions={<>
              <input placeholder="Search SKU, name..." style={{
                background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                borderRadius:8, padding:"7px 12px", fontSize:13,
                color:t.inputColor, outline:"none", fontFamily:"inherit", width:180 }} />
              <Select t={t} style={{ width:130 }}>
                <option>All Categories</option><option>Necklace</option><option>Ring</option>
                <option>Bangles</option><option>Earrings</option>
              </Select>
              <Select t={t} style={{ width:120 }}>
                <option>All Status</option><option>In Stock</option><option>Low Stock</option><option>Out of Stock</option>
              </Select>
            </>} />
          <DataTable
            columns={["SKU","Item Name","Branch","Location","Wt (Gross/Net)","Qty","MRP","Stock Value","Status","HUID","Actions"]}
            t={t} emptyMsg="live stock will load from backend" />
        </Card>
      )}

      {tab === "branch" && (
        <Card t={t}>
          <CardHeader title="Branch-wise Stock" t={t} />
          <DataTable columns={["Branch","Total Items","Total Qty","Stock Value","Low Stock","Out of Stock"]}
            t={t} emptyMsg="branch stock will load from backend" />
        </Card>
      )}

      {tab === "transfer" && (
        <Card t={t}>
          <CardHeader title="Inter-Branch Stock Transfers" t={t}
            actions={<BtnSm t={t} primary>+ New Transfer</BtnSm>} />
          <DataTable columns={["Transfer ID","From","To","Items","Date","By","Value","Status","Actions"]}
            t={t} emptyMsg="transfers will load from backend" />
        </Card>
      )}

      {tab === "reserved" && (
        <Card t={t}>
          <CardHeader title="Reserved Stock" t={t}
            actions={<BtnSm t={t} primary>+ Reserve Item</BtnSm>} />
          <DataTable columns={["ID","Item","Qty","Reason","Reserved For","Reference","Reserved On","Expires","Branch","Actions"]}
            t={t} emptyMsg="reserved stock will load from backend" />
        </Card>
      )}

      {tab === "damaged" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
            gap:12, marginBottom:18 }}>
            <StatCard label="Damaged Items" color={BRAND.pink}   t={t} />
            <StatCard label="Under Repair"  color="#f39c12"      t={t} />
            <StatCard label="Written Off"   color="#e74c3c"      t={t} />
            <StatCard label="Repair Cost"   color={BRAND.purple} t={t} />
          </div>
          <Card t={t}>
            <CardHeader title="Damaged Stock Register" t={t}
              actions={<BtnSm t={t} primary>+ Report Damage</BtnSm>} />
            <DataTable columns={["ID","Item","Qty","Reason","Reported By","Date","Branch","Action","Repair Cost","Status","Actions"]}
              t={t} emptyMsg="damaged stock will load from backend" />
          </Card>
        </div>
      )}

      {tab === "lost" && (
        <Card t={t}>
          <CardHeader title="Lost Stock Register" t={t}
            actions={<BtnSm t={t} primary>+ Report Lost</BtnSm>} />
          <DataTable columns={["ID","Item","Qty","Reason","Reported By","Date","Branch","Value Lost","CCTV Check","Status"]}
            t={t} emptyMsg="lost stock will load from backend" />
        </Card>
      )}

      {tab === "adj" && (
        <Card t={t}>
          <CardHeader title="Stock Adjustments" t={t}
            actions={<BtnSm t={t} primary>+ New Adjustment</BtnSm>} />
          <DataTable columns={["ID","SKU","Item","Type","Qty Change","Reason","Adjusted By","Date","Branch"]}
            t={t} emptyMsg="adjustments will load from backend" />
        </Card>
      )}

      {tab === "audit" && (
        <Card t={t}>
          <CardHeader title="Stock Audit History" t={t}
            actions={<BtnPrimary>Start New Audit</BtnPrimary>} />
          <DataTable columns={["Audit ID","Date","Type","Branch","Conducted By","Total Items","Matched","Discrepancy","Status"]}
            t={t} emptyMsg="audit history will load from backend" />
        </Card>
      )}

      {tab === "movement" && (
        <Card t={t}>
          <CardHeader title="Stock Movement Log" t={t}
            actions={<Select t={t} style={{ width:130 }}>
              <option>All Types</option><option>Sale</option><option>Purchase</option>
              <option>Transfer</option><option>Return</option><option>Damage</option>
            </Select>} />
          <DataTable columns={["ID","Date","SKU","Item","Type","Qty Change","From","To","Reference","By"]}
            t={t} emptyMsg="movement log will load from backend" />
        </Card>
      )}

      {tab === "lowstock" && (
        <div>
          <div style={{ background:`rgba(230,59,138,0.08)`, border:`1px solid rgba(230,59,138,0.2)`,
            borderRadius:10, padding:14, marginBottom:16,
            display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:t.text }}>Low Stock Alerts Active</div>
              <div style={{ fontSize:12, color:t.textMuted, marginTop:3 }}>Items below minimum quantity threshold</div>
            </div>
            <BtnPrimary>Reorder All</BtnPrimary>
          </div>
          <Card t={t}>
            <CardHeader title="Low Stock Items" t={t} />
            <DataTable columns={["SKU","Item Name","Category","Branch","Current Qty","Min Qty","Reorder Level","Status","Actions"]}
              t={t} emptyMsg="low stock items will load from backend" />
          </Card>
        </div>
      )}

      {tab === "reorder" && (
        <Card t={t}>
          <CardHeader title="Reorder Level Management" t={t}
            actions={<>
              <BtnSm t={t}>Save All</BtnSm>
              <BtnSm t={t} primary>Reorder Triggered Items</BtnSm>
            </>} />
          <DataTable columns={["SKU","Item Name","Branch","Current Qty","Min Qty (Alert)","Reorder Level","Status","Action"]}
            t={t} emptyMsg="reorder levels will load from backend" />
        </Card>
      )}

      {tab === "batch" && (
        <Card t={t}>
          <CardHeader title="Batch / Lot Tracking" t={t}
            actions={<BtnSm t={t} primary>+ New Batch</BtnSm>} />
          <DataTable columns={["Batch ID","Batch Name","Purchase Date","Supplier","Items / Qty","Total Weight","Value","Status","Actions"]}
            t={t} emptyMsg="batches will load from backend" />
        </Card>
      )}

      {tab === "serial" && (
        <Card t={t}>
          <CardHeader title="Serial Number Tracking" t={t}
            actions={<input placeholder="Search serial no. or SKU..." style={{
              background:t.inputBg, border:`1px solid ${t.inputBorder}`,
              borderRadius:8, padding:"7px 12px", fontSize:13,
              color:t.inputColor, outline:"none", fontFamily:"inherit", width:220 }} />} />
          <DataTable columns={["Serial No.","SKU","Item Name","Purity","Branch","Tray / Location","HUID","Status","Actions"]}
            t={t} emptyMsg="serial numbers will load from backend" />
        </Card>
      )}
    </div>
  );
}
