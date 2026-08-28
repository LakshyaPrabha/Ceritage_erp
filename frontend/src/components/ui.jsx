// ─── Ceritage ERP — Shared UI Components ──────────────────
// BRAND directly defined here — no circular imports

export const BRAND = {
  blue:    "#3B55E6",
  purple:  "#8B3BC8",
  pink:    "#E63B8A",
  grad:    "linear-gradient(135deg,#3B55E6 0%,#8B3BC8 50%,#E63B8A 100%)",
  gradBtn: "linear-gradient(135deg,#3B55E6,#8B3BC8)",
};

// ── PageHeader ─────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions, t }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start",
      justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
      <div>
        <h2 style={{ fontSize:21, fontWeight:700, margin:0, letterSpacing:"-0.3px",
          background:BRAND.grad, WebkitBackgroundClip:"text",
          WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize:12, color:t.textMuted, margin:"5px 0 0", lineHeight:1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          {actions}
        </div>
      )}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────
export function Card({ children, t, style = {} }) {
  return (
    <div style={{ background:t.card, border:`1px solid ${t.borderDash}`,
      borderRadius:12, padding:"18px 20px", marginBottom:18,
      boxShadow:t.cardShadow, ...style }}>
      {children}
    </div>
  );
}

// ── CardHeader ─────────────────────────────────────────────
export function CardHeader({ title, actions, t }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${t.borderDash}` }}>
      <span style={{ fontSize:14, fontWeight:700, color:t.text }}>{title}</span>
      {actions && (
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {actions}
        </div>
      )}
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────────
export function StatCard({ label, value = "—", change, changeUp, color, t }) {
  const c = color || BRAND.blue;
  return (
    <div style={{ background:t.card, border:`1px solid ${t.borderDash}`,
      borderTop:`3px solid ${c}`, borderRadius:12, padding:"16px",
      boxShadow:t.cardShadow }}>
      <div style={{ fontSize:24, fontWeight:800, color:c, letterSpacing:"-0.5px", lineHeight:1.1 }}>
        {value}
      </div>
      <div style={{ fontSize:12, color:t.textSub, margin:"5px 0 3px" }}>{label}</div>
      {change && (
        <div style={{ fontSize:11, color:changeUp ? "#2ecc71" : "#e74c3c" }}>
          {changeUp ? "▲" : "▼"} {change}
        </div>
      )}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────
export function Badge({ children, color }) {
  const c = color || BRAND.purple;
  return (
    <span style={{ background:c+"22", color:c, border:`1px solid ${c}44`,
      borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

// ── BtnPrimary ─────────────────────────────────────────────
export function BtnPrimary({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "rgba(139,59,200,0.4)" : BRAND.gradBtn,
      border:"none", borderRadius:9, color:"#fff",
      fontSize:13, fontWeight:600, padding:"9px 18px",
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily:"inherit", whiteSpace:"nowrap",
      boxShadow: disabled ? "none" : "0 3px 14px rgba(59,85,230,0.28)",
      ...style }}>
      {children}
    </button>
  );
}

// ── BtnOutline ─────────────────────────────────────────────
export function BtnOutline({ children, onClick, t, style = {} }) {
  const borderColor = t ? t.border : "rgba(139,59,200,0.3)";
  return (
    <button onClick={onClick} style={{
      background:"none", border:`1px solid ${borderColor}`,
      borderRadius:9, color:BRAND.purple,
      fontSize:13, fontWeight:600, padding:"9px 18px",
      cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap",
      ...style }}>
      {children}
    </button>
  );
}

// ── BtnSm ──────────────────────────────────────────────────
export function BtnSm({ children, onClick, t, primary = false, style = {} }) {
  return primary
    ? <BtnPrimary onClick={onClick} style={{ padding:"6px 14px", fontSize:12, ...style }}>{children}</BtnPrimary>
    : <BtnOutline onClick={onClick} t={t} style={{ padding:"6px 14px", fontSize:12, ...style }}>{children}</BtnOutline>;
}

// ── Tabs ───────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange, t }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:2,
      borderBottom:`1px solid ${t.borderDash}`, marginBottom:18 }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            background: isActive ? t.navActive : "none",
            border:"none",
            borderBottom: isActive ? `2px solid ${BRAND.purple}` : "2px solid transparent",
            color: isActive ? BRAND.purple : t.textSub,
            fontSize:13, fontWeight: isActive ? 600 : 400,
            padding:"9px 16px", cursor:"pointer",
            fontFamily:"inherit", transition:"all 0.15s" }}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── DataTable ──────────────────────────────────────────────
export function DataTable({ columns, rows = [], emptyMsg = "Data will load from backend", t }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={{ textAlign:"left", padding:"9px 12px",
                color:t.textMuted, fontWeight:600, fontSize:11,
                textTransform:"uppercase", letterSpacing:"0.5px",
                borderBottom:`1px solid ${t.borderDash}`, whiteSpace:"nowrap" }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? (
              <tr>
                <td colSpan={columns.length} style={{ padding:"36px", textAlign:"center",
                  color:t.textFaint, fontSize:13 }}>
                  {emptyMsg}
                </td>
              </tr>
            )
            : rows.map((row, i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${t.borderDash}` }}>
                {columns.map((col) => (
                  <td key={col} style={{ padding:"10px 12px", color:t.textSub }}>
                    {row[col] !== undefined && row[col] !== null ? row[col] : "—"}
                  </td>
                ))}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

// ── EmptyState ─────────────────────────────────────────────
export function EmptyState({ message = "Koi data nahi — backend se load hoga", t }) {
  return (
    <div style={{ textAlign:"center", padding:"32px 16px",
      color:t.textFaint, fontSize:13, lineHeight:1.7,
      border:`1px dashed ${t.borderDash}`, borderRadius:10 }}>
      {message}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, t, wide = false }) {
  if (!open) return null;
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, zIndex:1000,
        background:"rgba(0,0,0,0.55)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:t.card, border:`1px solid ${t.border}`,
        borderRadius:16, width:"100%", maxWidth: wide ? 720 : 480,
        maxHeight:"90vh", overflowY:"auto",
        boxShadow:"0 20px 60px rgba(0,0,0,0.4)", position:"relative" }}>
        <div style={{ height:3, borderRadius:"16px 16px 0 0", background:BRAND.grad }} />
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"18px 22px 14px", borderBottom:`1px solid ${t.borderDash}` }}>
          <div style={{ fontSize:16, fontWeight:700, color:t.text }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none",
            color:t.textMuted, fontSize:20, cursor:"pointer",
            fontFamily:"inherit", lineHeight:1, padding:"0 4px" }}>
            ×
          </button>
        </div>
        <div style={{ padding:"20px 22px" }}>{children}</div>
        {footer && (
          <div style={{ padding:"14px 22px", borderTop:`1px solid ${t.borderDash}`,
            display:"flex", justifyContent:"flex-end", gap:10 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FormGroup ──────────────────────────────────────────────
export function FormGroup({ label, children, t, half = false }) {
  return (
    <div style={{ marginBottom:14, flex: half ? "1 1 calc(50% - 8px)" : "1 1 100%", minWidth:0 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:600, color:t.textSub,
        marginBottom:6, textTransform:"uppercase", letterSpacing:"0.6px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── FormGrid ───────────────────────────────────────────────
export function FormGrid({ children }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:14 }}>
      {children}
    </div>
  );
}

// ── Input ──────────────────────────────────────────────────
export function Input({ t, style: extraStyle = {}, ...props }) {
  return (
    <input {...props} style={{ width:"100%", background:t.inputBg,
      border:`1.5px solid ${t.inputBorder}`,
      borderRadius:9, padding:"10px 13px",
      fontSize:13, color:t.inputColor,
      outline:"none", boxSizing:"border-box", fontFamily:"inherit",
      ...extraStyle }} />
  );
}

// ── Select ─────────────────────────────────────────────────
export function Select({ t, children, style: extraStyle = {}, ...props }) {
  return (
    <select {...props} style={{ width:"100%", background:t.inputBg,
      border:`1.5px solid ${t.inputBorder}`,
      borderRadius:9, padding:"10px 13px",
      fontSize:13, color:t.inputColor,
      outline:"none", boxSizing:"border-box",
      fontFamily:"inherit", cursor:"pointer",
      ...extraStyle }}>
      {children}
    </select>
  );
}

// ── Textarea ───────────────────────────────────────────────
export function Textarea({ t, rows = 3, style: extraStyle = {}, ...props }) {
  return (
    <textarea {...props} rows={rows} style={{ width:"100%", background:t.inputBg,
      border:`1.5px solid ${t.inputBorder}`,
      borderRadius:9, padding:"10px 13px",
      fontSize:13, color:t.inputColor,
      outline:"none", boxSizing:"border-box",
      fontFamily:"inherit", resize:"vertical",
      ...extraStyle }} />
  );
}

// ── SectionTitle ───────────────────────────────────────────
export function SectionTitle({ children, t }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, color:BRAND.purple,
      textTransform:"uppercase", letterSpacing:"1px",
      margin:"18px 0 10px", paddingBottom:6,
      borderBottom:`1px solid ${t.borderDash}` }}>
      {children}
    </div>
  );
}
