import { BRAND } from "../../theme.js";
import { PageHeader, Card, CardHeader } from "../../components/ui";

const AI_FEATURES = [
  { title:"Demand Forecasting",          color:BRAND.purple,
    desc:"Predict which items will sell in upcoming festivals. Stock up before demand spikes.",
    insight:"Diwali Alert: Bangles demand +240% expected. Stock up by Oct 10." },
  { title:"Customer Segmentation",       color:BRAND.blue,
    desc:"Auto-classify customers by purchase behavior, loyalty & lifetime value.",
    insight:"Action: 23 customers eligible for upgrade to Gold tier." },
  { title:"Auto WhatsApp Messages",      color:"#2ecc71",
    desc:"AI-generated personalized messages for birthdays, anniversaries & offers.",
    insight:"Today: 12 birthday wishes, 3 anniversary wishes sent." },
  { title:"Gold Rate Predictor",         color:"#f0c040",
    desc:"ML-based gold price trend analysis to help with procurement decisions.",
    insight:"Prediction: Gold may rise +3% by next week." },
  { title:"Smart Alerts",                color:BRAND.pink,
    desc:"Auto-detect low stock, overdue EMIs, repair delays & cash anomalies.",
    insight:"4 alerts active: 2 low stock, 1 repair overdue, 1 EMI due." },
  { title:"Auto Invoice Categorization", color:"#f39c12",
    desc:"Automatically tag purchases with correct HSN codes and GST rates using AI.",
    insight:"Enable to auto-categorize all new invoices." },
];

export default function Ai({ t }) {
  return (
    <div>
      <PageHeader title="AI Features"
        subtitle="Smart recommendations · Demand forecasting · Automation"
        t={t}
        actions={
          <span style={{ background:`${BRAND.purple}22`, color:BRAND.purple,
            border:`1px solid ${BRAND.purple}44`, borderRadius:6,
            padding:"5px 14px", fontSize:12, fontWeight:600 }}>
            Beta
          </span>
        } />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
        {AI_FEATURES.map((f) => (
          <div key={f.title} style={{ background:t.card,
            border:`1px solid ${f.color}44`,
            borderRadius:12, padding:"18px 20px",
            boxShadow:t.cardShadow }}>
            <div style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:8 }}>
              {f.title}
            </div>
            <div style={{ fontSize:13, color:t.textSub, lineHeight:1.6, marginBottom:14 }}>
              {f.desc}
            </div>
            <div style={{ background:`${f.color}15`, border:`1px solid ${f.color}33`,
              borderRadius:8, padding:"10px 12px", fontSize:12, color:f.color,
              fontWeight:600, lineHeight:1.5 }}>
              {f.insight}
            </div>
            <button style={{ marginTop:12, width:"100%", padding:"8px",
              background:"none", border:`1px solid ${t.border}`,
              borderRadius:8, color:BRAND.purple, fontSize:12, fontWeight:600,
              cursor:"pointer", fontFamily:"inherit" }}>
              Configure
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
