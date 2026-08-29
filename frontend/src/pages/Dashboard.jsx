﻿import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ceritageLogoSvg from "../assets/ceritage-logo.svg";
import { BRAND } from "../theme.js";

// ── All module imports ─────────────────────────────────────
import DashboardHome  from "./modules/DashboardHome";
import Customers      from "./modules/Customers";
import Products       from "./modules/Products";
import Billing        from "./modules/Billing";
import Sales          from "./modules/Sales";
import Purchase       from "./modules/Purchase";
import GoldExchange   from "./modules/GoldExchange";
import Repair         from "./modules/Repair";
import Orders         from "./modules/Orders";
import Karigar        from "./modules/Karigar";
import Inventory      from "./modules/Inventory";
import Accounting     from "./modules/Accounting";
import Reports        from "./modules/Reports";
import Rates          from "./modules/Rates";
import Emi            from "./modules/Emi";
import Gst            from "./modules/Gst";
import Hallmark       from "./modules/Hallmark";
import Employees      from "./modules/Employees";
import Suppliers      from "./modules/Suppliers";
import Analytics      from "./modules/Analytics";
import Payments       from "./modules/Payments";
import Users          from "./modules/Users";
import Security       from "./modules/Security";
import Communication  from "./modules/Communication";
import Branch         from "./modules/Branch";
import Jangad         from "./modules/Jangad";
import Tunch          from "./modules/Tunch";
import Rfid           from "./modules/Rfid";
import Advance        from "./modules/Advance";
import Compliance     from "./modules/Compliance";
import Ai             from "./modules/Ai";

// BRAND imported from theme.js above

export function getTheme(dark) {
  return dark
    ? {
        bg:             "#0d0d18",
        sidebar:        "#12122a",
        topbar:         "#12122a",
        card:           "#16162a",
        card2:          "#1a1a32",
        border:         "rgba(139,59,200,0.22)",
        borderDash:     "rgba(139,59,200,0.18)",
        text:           "#f0eeff",
        textSub:        "#8080b8",
        textMuted:      "#5a5a8a",
        textFaint:      "#3a3a5a",
        navActive:      "rgba(59,85,230,0.14)",
        navActiveBorder:"#8B3BC8",
        navActiveColor: "#c8b8ff",
        navColor:       "#7070a8",
        sectionLabel:   "#3a3a6a",
        logoutColor:    "#E63B8A",
        logoutBorder:   "rgba(230,59,138,0.3)",
        inputBg:        "#1e1e38",
        inputBorder:    "rgba(139,59,200,0.25)",
        inputColor:     "#f0eeff",
        tickerBg:       "rgba(59,85,230,0.1)",
        tickerBorder:   "rgba(59,85,230,0.2)",
        tickerColor:    "#8080c8",
        cardShadow:     "none",
        sidebarShadow:  "none",
      }
    : {
        bg:             "#f4f3ff",
        sidebar:        "#ffffff",
        topbar:         "#ffffff",
        card:           "#ffffff",
        card2:          "#f8f7ff",
        border:         "rgba(139,59,200,0.15)",
        borderDash:     "rgba(139,59,200,0.14)",
        text:           "#1a1530",
        textSub:        "#6050a0",
        textMuted:      "#9080c0",
        textFaint:      "#c0b8e0",
        navActive:      "rgba(59,85,230,0.08)",
        navActiveBorder:"#3B55E6",
        navActiveColor: "#3B55E6",
        navColor:       "#8070b0",
        sectionLabel:   "#c0b0e0",
        logoutColor:    "#E63B8A",
        logoutBorder:   "rgba(230,59,138,0.3)",
        inputBg:        "#faf9ff",
        inputBorder:    "rgba(139,59,200,0.2)",
        inputColor:     "#1a1530",
        tickerBg:       "rgba(59,85,230,0.06)",
        tickerBorder:   "rgba(59,85,230,0.14)",
        tickerColor:    "#7060a8",
        cardShadow:     "0 1px 4px rgba(59,85,230,0.06)",
        sidebarShadow:  "2px 0 16px rgba(59,85,230,0.06)",
      };
}

const NAV = [
  { section:"Main", items:[
    { id:"dashboard",     label:"Dashboard" },
    { id:"analytics",     label:"Analytics" },
  ]},
  { section:"Operations", items:[
    { id:"customers",     label:"Customers" },
    { id:"products",      label:"Products & Inventory" },
    { id:"billing",       label:"Billing / GST Invoice" },
    { id:"sales",         label:"Sales" },
    { id:"purchase",      label:"Purchase" },
    { id:"gold-exchange", label:"Gold Exchange" },
  ]},
  { section:"Workshop", items:[
    { id:"repair",        label:"Repair Job Card" },
    { id:"orders",        label:"Order Booking" },
    { id:"karigar",       label:"Karigar Management" },
    { id:"jangad",        label:"Jangad / Approval" },
  ]},
  { section:"Finance", items:[
    { id:"accounting",    label:"Accounting" },
    { id:"payments",      label:"Payment Modes" },
    { id:"emi",           label:"EMI & Credit" },
    { id:"gst",           label:"GST & Taxation" },
    { id:"tunch",         label:"Fine Metal Ledger" },
    { id:"compliance",    label:"TCS & Compliance" },
  ]},
  { section:"Catalog & Stock", items:[
    { id:"inventory",     label:"Inventory" },
    { id:"hallmark",      label:"Hallmark & HUID" },
    { id:"rates",         label:"Gold & Silver Rates" },
    { id:"rfid",          label:"RFID & Tray Audit" },
    { id:"advance",       label:"Rate Lock / Advance" },
  ]},
  { section:"Management", items:[
    { id:"employees",     label:"Employees" },
    { id:"suppliers",     label:"Suppliers" },
    { id:"branch",        label:"Multi-Branch" },
    { id:"reports",       label:"Reports" },
  ]},
  { section:"System", items:[
    { id:"users",         label:"Users & Roles" },
    { id:"security",      label:"Security" },
    { id:"ai",            label:"AI Features" },
    { id:"communication", label:"Communication" },
  ]},
];

const TITLES = {
  dashboard:"Dashboard", analytics:"Analytics",
  customers:"Customer Management", products:"Products & Inventory",
  billing:"Billing / GST Invoice", sales:"Sales Management",
  purchase:"Purchase Management", "gold-exchange":"Gold Exchange",
  repair:"Repair Job Card", orders:"Order Booking",
  karigar:"Karigar Management", jangad:"Jangad / Approval",
  accounting:"Accounting", payments:"Payment Modes",
  emi:"EMI & Credit", gst:"GST & Taxation",
  tunch:"Fine Metal Ledger", compliance:"TCS & Compliance",
  inventory:"Inventory", hallmark:"Hallmark & HUID",
  rates:"Gold & Silver Rates", rfid:"RFID & Tray Audit",
  advance:"Rate Lock / Advance", employees:"Employees",
  suppliers:"Suppliers", branch:"Multi-Branch", reports:"Reports",
  users:"Users & Roles", security:"Security",
  ai:"AI Features", communication:"Communication",
};

const MODULE_MAP = {
  dashboard:      DashboardHome,
  analytics:      Analytics,
  customers:      Customers,
  products:       Products,
  billing:        Billing,
  sales:          Sales,
  purchase:       Purchase,
  "gold-exchange":GoldExchange,
  repair:         Repair,
  orders:         Orders,
  karigar:        Karigar,
  jangad:         Jangad,
  accounting:     Accounting,
  payments:       Payments,
  emi:            Emi,
  gst:            Gst,
  tunch:          Tunch,
  compliance:     Compliance,
  inventory:      Inventory,
  hallmark:       Hallmark,
  rates:          Rates,
  rfid:           Rfid,
  advance:        Advance,
  employees:      Employees,
  suppliers:      Suppliers,
  branch:         Branch,
  reports:        Reports,
  users:          Users,
  security:       Security,
  ai:             Ai,
  communication:  Communication,
};

function useSystemTheme() {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = (e) => setDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return dark;
}

export default function Dashboard() {
  const [active,      setActive]      = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate  = useNavigate();
  const dark      = useSystemTheme();
  const t         = getTheme(dark);
  const username  = sessionStorage.getItem("ceritage_user") || "Admin";

  useEffect(() => { document.body.style.background = t.bg; }, [dark]);

  function handleLogout() {
    sessionStorage.removeItem("ceritage_auth");
    sessionStorage.removeItem("ceritage_user");
    navigate("/");
  }

  const ActiveModule = MODULE_MAP[active] || DashboardHome;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:t.bg,
      fontFamily:"'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif",
      color:t.text }}>

      {/* ── Sidebar ── */}
      <aside style={{ position:"fixed", top:0, left:0, bottom:0,
        width: sidebarOpen  ? 260 : 0,
        background:t.sidebar, borderRight:`1px solid ${t.border}`,
        display:"flex", flexDirection:"column",
        zIndex:200, transition:"width 0.22s",
        overflowY:"auto", overflowX:"hidden",
        boxShadow:t.sidebarShadow }}>

        <div style={{ height:3, flexShrink:0, background:BRAND.grad }} />

        <div style={{ padding:"18px 20px 16px",
          borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
          <img src={ceritageLogoSvg} alt="Ceritage"
            style={{ height:36, width:"auto", maxWidth:180 }} />
        </div>

        {NAV.map((section) => (
          <div key={section.section} style={{ padding:"8px 0 2px" }}>
            <div style={{ fontSize:10, fontWeight:700, color:t.sectionLabel,
              textTransform:"uppercase", letterSpacing:"1px",
              padding:"0 18px", marginBottom:2 }}>
              {section.section}
            </div>
            {section.items.map((item) => {
              const isActive = active === item.id;
              return (
                <button key={item.id} onClick={() => setActive(item.id)}
                  style={{ display:"flex", alignItems:"center", width:"100%",
                    padding:"8px 18px",
                    background: isActive  ? t.navActive : "none",
                    border:"none",
                    borderLeft: isActive  ? `3px solid ${t.navActiveBorder}` : "3px solid transparent",
                    color: isActive  ? t.navActiveColor : t.navColor,
                    fontSize:13, textAlign:"left", cursor:"pointer",
                    transition:"all 0.15s", fontFamily:"inherit",
                    fontWeight: isActive  ? 600 : 400 }}>
                  <span style={{ flex:1, whiteSpace:"nowrap",
                    overflow:"hidden", textOverflow:"ellipsis" }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        ))}

        <div style={{ marginTop:"auto", borderTop:`1px solid ${t.border}`,
          padding:"12px 14px", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:"50%",
              background:BRAND.gradBtn,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontWeight:800, color:"#fff", flexShrink:0 }}>
              {username.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:t.text,
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {username.charAt(0).toUpperCase() + username.slice(1)}
              </div>
              <div style={{ fontSize:10, color:t.textMuted, marginTop:1 }}>Administrator</div>
            </div>
            <button onClick={handleLogout}
              style={{ background:"none", border:`1px solid ${t.logoutBorder}`,
                borderRadius:7, color:t.logoutColor, fontSize:11, fontWeight:600,
                cursor:"pointer", padding:"4px 10px", fontFamily:"inherit" }}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh",
        marginLeft: sidebarOpen  ? 260 : 0, transition:"margin-left 0.22s" }}>

        <header style={{ position:"sticky", top:0, height:60,
          background:t.topbar, borderBottom:`1px solid ${t.border}`,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 24px", zIndex:100, gap:16, flexShrink:0,
          boxShadow: dark ? "none" : "0 1px 8px rgba(59,85,230,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <button onClick={() => setSidebarOpen(v => !v)}
              style={{ background:"none", border:`1px solid ${t.border}`,
                borderRadius:7, color:t.textSub, fontSize:12, fontWeight:600,
                cursor:"pointer", padding:"5px 12px", fontFamily:"inherit" }}>
              ☰
            </button>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:t.text, lineHeight:1.2 }}>
                {TITLES[active] || active}
              </div>
              <div style={{ fontSize:11, color:t.textMuted, marginTop:1 }}>
                Ceritage ERP › {TITLES[active] || active}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
            <div style={{ fontSize:12, color:t.tickerColor,
              background:t.tickerBg, border:`1px solid ${t.tickerBorder}`,
              borderRadius:8, padding:"4px 12px", whiteSpace:"nowrap" }}>
              Live Rates: —
            </div>
            <div style={{ width:30, height:30, borderRadius:"50%",
              background:BRAND.gradBtn, display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff" }}>
              {username.slice(0,2).toUpperCase()}
            </div>
          </div>
        </header>

        <main style={{ flex:1, padding:"22px", overflowY:"auto" }}>
          <ActiveModule t={t} onNavigate={setActive} />
        </main>
      </div>
    </div>
  );
}
