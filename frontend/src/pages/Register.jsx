import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const API = "http://localhost:5000/api";

function useSystemTheme() {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = e => setDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return dark;
}

export default function Register() {
  const navigate  = useNavigate();
  const dark      = useSystemTheme();

  const [form, setForm] = useState({
    full_name:    "",
    username:     "",
    email:        "",
    password:     "",
    confirm:      "",
    business_name:"",
    phone:        "",
    city:         "",
  });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [step,        setStep]        = useState(1); // 1=account, 2=business, 3=done

  const t = dark
    ? {
        page:        "#0d0d18",
        card:        "#16162a",
        cardShadow:  "0 8px 40px rgba(0,0,0,0.5)",
        border:      "rgba(139,59,200,0.3)",
        text:        "#f0eeff",
        sub:         "#7070a8",
        label:       "#9090c0",
        inputBg:     "#1e1e38",
        inputBorder: "rgba(139,59,200,0.25)",
        inputColor:  "#f0eeff",
        divider:     "rgba(139,59,200,0.2)",
        hintText:    "#4a4a6a",
        hintCode:    "#8B7BE8",
        hintCodeBg:  "rgba(59,85,230,0.12)",
        linkColor:   "#8B7BE8",
        bgGlow:
          "radial-gradient(ellipse at 20% 20%,rgba(59,85,230,0.12) 0%,transparent 60%)," +
          "radial-gradient(ellipse at 80% 80%,rgba(230,59,138,0.1) 0%,transparent 55%)",
      }
    : {
        page:        "#f4f3ff",
        card:        "#ffffff",
        cardShadow:  "0 4px 24px rgba(59,85,230,0.1)",
        border:      "rgba(139,59,200,0.25)",
        text:        "#1a1530",
        sub:         "#7060a0",
        label:       "#6a5a3e",
        inputBg:     "#faf9ff",
        inputBorder: "rgba(139,59,200,0.2)",
        inputColor:  "#1a1530",
        divider:     "rgba(139,59,200,0.15)",
        hintText:    "#b0a8d0",
        hintCode:    "#5a4ec8",
        hintCodeBg:  "rgba(59,85,230,0.08)",
        linkColor:   "#5a4ec8",
        bgGlow:
          "radial-gradient(ellipse at 20% 20%,rgba(59,85,230,0.07) 0%,transparent 60%)," +
          "radial-gradient(ellipse at 80% 80%,rgba(230,59,138,0.05) 0%,transparent 55%)",
      };

  function set(key) {
    return e => {
      setForm(f => ({ ...f, [key]: e.target.value }));
      setError("");
    };
  }

  function validateStep1() {
    if (!form.full_name.trim())  return "Full name is required.";
    if (!form.username.trim())   return "Username is required.";
    if (form.username.includes(" ")) return "Username cannot contain spaces.";
    if (!form.email.trim())      return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email address.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return null;
  }

  function validateStep2() {
    if (!form.business_name.trim()) return "Business name is required.";
    if (!form.phone.trim())         return "Phone number is required.";
    return null;
  }

  function handleNext() {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:     form.full_name.trim(),
          username:      form.username.trim().toLowerCase(),
          email:         form.email.trim().toLowerCase(),
          password:      form.password,
          business_name: form.business_name.trim(),
          phone:         form.phone.trim(),
          city:          form.city.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Registration successful — go to step 3 (success)
      setStep(3);
    } catch (err) {
      setError("Cannot connect to server. Make sure the backend is running on port 5000.");
      setLoading(false);
    }
  }

  const inputStyle = {
    width:"100%", background:t.inputBg,
    border:`1.5px solid ${t.inputBorder}`,
    borderRadius:11, padding:"12px 15px",
    fontSize:14, color:t.inputColor,
    outline:"none", boxSizing:"border-box",
    fontFamily:"inherit",
  };

  const labelStyle = {
    display:"block", fontSize:11, fontWeight:600,
    color:t.label, marginBottom:7,
    textTransform:"uppercase", letterSpacing:"0.7px",
  };

  return (
    <div style={{
      minHeight:"100vh", background:t.page,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"24px 16px", position:"relative", overflow:"hidden",
      fontFamily:"'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif",
    }}>
      {/* Background blobs */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none",
        background:t.bgGlow }} />

      <div style={{
        position:"relative", width:"100%", maxWidth:"460px",
        background:t.card, border:`1px solid ${t.border}`,
        borderRadius:20, padding:"40px 44px 36px",
        boxShadow:t.cardShadow,
      }}>
        {/* Top gradient bar */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:4,
          borderRadius:"20px 20px 0 0",
          background:"linear-gradient(135deg,#3B55E6 0%,#8B3BC8 50%,#E63B8A 100%)",
        }} />

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:12,
          }}>
            <div style={{
              width:42, height:42, borderRadius:11,
              background:"linear-gradient(135deg,#3B55E6,#8B3BC8)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, fontWeight:800, color:"#fff",
            }}>C</div>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:18, fontWeight:700, color:t.text, lineHeight:1.2 }}>
                Ceritage
              </div>
              <div style={{ fontSize:10, color:t.sub, textTransform:"uppercase", letterSpacing:"0.8px" }}>
                Jewellery ERP
              </div>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24 }}>
            {[1,2].map((s) => (
              <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{
                  width:28, height:28, borderRadius:"50%",
                  background: step >= s
                    ? "linear-gradient(135deg,#3B55E6,#8B3BC8)"
                    : t.inputBg,
                  border: step >= s
                    ? "none"
                    : `1px solid ${t.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, fontWeight:700,
                  color: step >= s ? "#fff" : t.sub,
                }}>
                  {s}
                </div>
                <span style={{ fontSize:12, color: step >= s ? "#8B3BC8" : t.sub, fontWeight: step === s ? 600 : 400 }}>
                  {s === 1 ? "Account" : "Business"}
                </span>
                {s === 1 && (
                  <div style={{ flex:1, height:1, width:32, background:t.border }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 3 — SUCCESS ── */}
        {step === 3 && (
          <div style={{ textAlign:"center", padding:"10px 0 20px" }}>
            <div style={{
              width:64, height:64, borderRadius:"50%",
              background:"linear-gradient(135deg,#3B55E6,#8B3BC8)",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 20px", fontSize:28, color:"#fff",
            }}>
              ✓
            </div>
            <h2 style={{ fontSize:22, fontWeight:700, color:t.text, margin:"0 0 8px" }}>
              Account Created!
            </h2>
            <p style={{ fontSize:13, color:t.sub, marginBottom:28, lineHeight:1.6 }}>
              Your admin account has been set up successfully.
              You can now log in with your credentials.
            </p>
            <div style={{
              background:t.inputBg, border:`1px solid ${t.border}`,
              borderRadius:10, padding:"12px 16px", marginBottom:24,
              fontSize:13, color:t.sub, textAlign:"left",
            }}>
              <div style={{ marginBottom:6 }}>
                Username: <span style={{ fontFamily:"monospace", color:"#8B3BC8", fontWeight:700 }}>
                  {form.username}
                </span>
              </div>
              <div>
                Password: <span style={{ fontFamily:"monospace", color:"#8B3BC8", fontWeight:700 }}>
                  {"•".repeat(form.password.length)}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/")}
              style={{
                display:"block", width:"100%", padding:13,
                background:"linear-gradient(135deg,#3B55E6,#8B3BC8)",
                border:"none", borderRadius:11, color:"#fff",
                fontSize:15, fontWeight:700, cursor:"pointer",
                fontFamily:"inherit",
                boxShadow:"0 4px 20px rgba(59,85,230,0.3)",
              }}>
              Go to Login
            </button>
          </div>
        )}

        {/* ── STEP 1 — Account Details ── */}
        {step === 1 && (
          <>
            <h1 style={{ fontSize:20, fontWeight:700, color:t.text, margin:"0 0 4px" }}>
              Create Admin Account
            </h1>
            <p style={{ fontSize:13, color:t.sub, margin:"0 0 24px", lineHeight:1.5 }}>
              Set up your login credentials for the ERP system.
            </p>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} placeholder="Your full name"
                value={form.full_name} onChange={set("full_name")} />
            </div>

            <div style={{ display:"flex", gap:12, marginBottom:16 }}>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>Username *</label>
                <input style={inputStyle} placeholder="e.g. admin"
                  value={form.username} onChange={set("username")}
                  autoComplete="username" />
              </div>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" placeholder="you@example.com"
                  value={form.email} onChange={set("email")} />
              </div>
            </div>

            <div style={{ display:"flex", gap:12, marginBottom:0 }}>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>Password *</label>
                <div style={{ position:"relative" }}>
                  <input
                    style={{ ...inputStyle, paddingRight:60 }}
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={form.password} onChange={set("password")}
                    autoComplete="new-password" />
                  <button type="button"
                    onClick={() => setShowPass(v => !v)}
                    style={{ position:"absolute", right:12, top:"50%",
                      transform:"translateY(-50%)", background:"none", border:"none",
                      color:t.sub, fontSize:11, fontWeight:600,
                      cursor:"pointer", fontFamily:"inherit" }}>
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>Confirm Password *</label>
                <div style={{ position:"relative" }}>
                  <input
                    style={{
                      ...inputStyle,
                      paddingRight:60,
                      borderColor: form.confirm && form.confirm !== form.password
                        ? "rgba(230,59,138,0.5)"
                        : t.inputBorder,
                    }}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    value={form.confirm} onChange={set("confirm")}
                    autoComplete="new-password" />
                  <button type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    style={{ position:"absolute", right:12, top:"50%",
                      transform:"translateY(-50%)", background:"none", border:"none",
                      color:t.sub, fontSize:11, fontWeight:600,
                      cursor:"pointer", fontFamily:"inherit" }}>
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p style={{
                margin:"14px 0 0", padding:"10px 14px",
                background:"rgba(230,59,138,0.1)",
                border:"1px solid rgba(230,59,138,0.3)",
                borderRadius:9, color:"#E63B8A", fontSize:13,
              }}>
                {error}
              </p>
            )}

            <button onClick={handleNext} style={{
              display:"block", width:"100%", marginTop:22, padding:13,
              background:"linear-gradient(135deg,#3B55E6,#8B3BC8)",
              border:"none", borderRadius:11, color:"#fff",
              fontSize:15, fontWeight:700, cursor:"pointer",
              fontFamily:"inherit",
              boxShadow:"0 4px 20px rgba(59,85,230,0.3)",
            }}>
              Continue to Business Details
            </button>
          </>
        )}

        {/* ── STEP 2 — Business Details ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} noValidate>
            <h1 style={{ fontSize:20, fontWeight:700, color:t.text, margin:"0 0 4px" }}>
              Business Information
            </h1>
            <p style={{ fontSize:13, color:t.sub, margin:"0 0 24px", lineHeight:1.5 }}>
              Tell us about your jewelry business.
            </p>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Business Name *</label>
              <input style={inputStyle} placeholder="e.g. Ceritage Jewellers"
                value={form.business_name} onChange={set("business_name")} />
            </div>

            <div style={{ display:"flex", gap:12, marginBottom:16 }}>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>Phone *</label>
                <input style={inputStyle} placeholder="10-digit mobile number"
                  value={form.phone} onChange={set("phone")} />
              </div>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} placeholder="e.g. Mumbai"
                  value={form.city} onChange={set("city")} />
              </div>
            </div>

            {error && (
              <p style={{
                margin:"0 0 14px", padding:"10px 14px",
                background:"rgba(230,59,138,0.1)",
                border:"1px solid rgba(230,59,138,0.3)",
                borderRadius:9, color:"#E63B8A", fontSize:13,
              }}>
                {error}
              </p>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button
                type="button"
                onClick={() => { setStep(1); setError(""); }}
                style={{
                  flex:1, padding:13,
                  background:"none",
                  border:`1px solid ${t.border}`,
                  borderRadius:11, color:"#8B3BC8",
                  fontSize:15, fontWeight:600, cursor:"pointer",
                  fontFamily:"inherit",
                }}>
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex:2, padding:13,
                  background: loading
                    ? "rgba(139,59,200,0.4)"
                    : "linear-gradient(135deg,#3B55E6,#8B3BC8)",
                  border:"none", borderRadius:11, color:"#fff",
                  fontSize:15, fontWeight:700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily:"inherit",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(59,85,230,0.3)",
                }}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>
        )}

        {/* Login link */}
        {step < 3 && (
          <p style={{ marginTop:20, fontSize:12, color:t.hintText, textAlign:"center" }}>
            Already have an account?{" "}
            <Link to="/" style={{
              color:t.linkColor, fontWeight:600, textDecoration:"none",
            }}>
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
