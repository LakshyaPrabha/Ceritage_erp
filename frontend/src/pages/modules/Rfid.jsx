﻿import { BRAND } from "../../theme.js";
import { PageHeader, Card, CardHeader, StatCard, DataTable, BtnPrimary, BtnOutline } from "../../components/ui";

const TRAYS = [
  { name:"Tray A1", items:"—", category:"Necklaces", ok:true },
  { name:"Tray B2", items:"—", category:"Rings",     ok:true },
  { name:"Tray C3", items:"—", category:"Bangles",   ok:false },
  { name:"Tray D4", items:"—", category:"Earrings",  ok:true },
  { name:"Safe Box", items:"—", category:"Diamonds", ok:true },
];

export default function Rfid({ t }) {
  return (
    <div>
      <PageHeader title="RFID & Tray Audit"
        subtitle="Live tray tracking · Counter audit · RFID scan management"
        t={t} actions={<BtnPrimary>Start RFID Scan</BtnPrimary>} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="RFID Tagged Items" color="#2ecc71"      t={t} />
        <StatCard label="Active Trays"      color={BRAND.blue}   t={t} />
        <StatCard label="Missing Tags"      color={BRAND.pink}   t={t} />
        <StatCard label="Last Audit"        color={BRAND.purple} t={t} />
      </div>
      <Card t={t}>
        <CardHeader title="Tray Status" t={t} />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
          {TRAYS.map((tray) => (
            <div key={tray.name} style={{
              background:t.card2||t.card, border:`1px solid ${tray.ok  ? t.borderDash : "rgba(230,59,138,0.3)"}`,
              borderRadius:10, padding:"14px", textAlign:"center" }}>
              <div style={{ fontSize:14, fontWeight:700,
                color: tray.ok  ? BRAND.blue : BRAND.pink, marginBottom:4 }}>
                {tray.name}
              </div>
              <div style={{ fontSize:11, color:t.textMuted, marginBottom:8 }}>{tray.category}</div>
              <div style={{
                display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                background: tray.ok ? "rgba(46,204,113,0.15)" : "rgba(230,59,138,0.15)",
                color: tray.ok ? "#2ecc71" : BRAND.pink,
                border:`1px solid ${tray.ok ? "rgba(46,204,113,0.3)" : "rgba(230,59,138,0.3)"}`,
              }}>
                {tray.ok  ? `${tray.items} items OK` : "Missing item"}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card t={t}>
        <CardHeader title="Scanner Activity Log" t={t}
          actions={<BtnOutline t={t} style={{padding:"5px 12px",fontSize:12}}>Open Scanner</BtnOutline>} />
        <DataTable columns={["Time","Scanned Code","Product","Type","Action Taken"]}
          t={t} emptyMsg="scanner activity will load from backend" />
      </Card>
    </div>
  );
}
