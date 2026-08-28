import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ceritageLogoSvg from "../assets/ceritage-logo.svg";
import { BRAND } from "../theme.js";

// ── Theme tokens ───────────────────────────────────────────
function getTheme(dark) {
  return dark
    ? {
        page:       "#0d0d18",
        card:       "#16162a",
        cardBorder: "rgba(139,59,200,0.25)",
        cardShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,85,230,0.1)",
        text:       "#f0eeff",
        sub:        "#7a7aaa",
        label:      "#9090c0",
        inputBg:    "#1e1e38",
        inputBorder:"rgba(139,59,200,0.25)",
        inputColor: "#f0eeff",
        showBtn:    "#7a7aaa",
        errorBg:    "rgba(230,59,138,0.1)",
        errorBorder:"rgba(230,59,138,0.3)",
        divider:    "rgba(139,59,200,0.2)",
        hintText:   "#4a4a6a",
        hintCodeBg: "rgba(59,85,230,0.12)",
        hintCode:   "#8B7BE8",
        footer:     "#2a2a4a",
        bgBlobs:    true,
      }
    : {
        page:       "#f4f3ff",
        card:       "#ffffff",
        cardBorder: "rgba(139,59,200,0.18)",
        cardShadow: "0 8px 40px rgba(59,85,230,0.1), 0 2px 8px rgba(0,0,0,0.06)",
        text:       "#1a1530",
        sub:        "#7060a0",
        label:      "#5a509a",
        inputBg:    "#faf9ff",
        inputBorder:"rgba(139,59,200,0.2)",
        inputColor: "#1a1530",
        showBtn:    "#9080b8",
        errorBg:    "rgba(230,59,138,0.07)",
        errorBorder:"rgba(230,59,138,0.3)",
        divider:    "rgba(139,59,200,0.12)",
        hintText:   "#b0a8d0",
        hintCodeBg: "rgba(59,85,230,0.08)",
        hintCode:   "#5a4ec8",
        footer:     "#c0b8e0",
        bgBlobs:    true,
      };
}

// ── Component ──────────────────────────────────────────────
export default function Login() {
  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [dark,         setDark]         = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mq      = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const t = getTheme(dark);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setError(data.message || "Invalid username or password.");
        return;
      }

      // Save token and user info
      sessionStorage.setItem("ceritage_auth",  "true");
      sessionStorage.setItem("ceritage_user",  data.user.full_name || data.user.username);
      sessionStorage.setItem("ceritage_token", data.token);
      sessionStorage.setItem("ceritage_role",  data.user.role);

      navigate("/dashboard");

    } catch (err) {
      setLoading(false);
      setError("Cannot connect to server. Make sure the backend is running on port 5000.");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: t.page,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* Decorative background blobs */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden",
      }}>
        <div style={{
          position:"absolute", top:"-20%", left:"-15%",
          width:600, height:600, borderRadius:"50%",
          background: dark
            ? "radial-gradient(circle, rgba(59,85,230,0.12) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(59,85,230,0.07) 0%, transparent 70%)",
        }} />
        <div style={{
          position:"absolute", bottom:"-15%", right:"-10%",
          width:500, height:500, borderRadius:"50%",
          background: dark
            ? "radial-gradient(circle, rgba(230,59,138,0.1) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(230,59,138,0.06) 0%, transparent 70%)",
        }} />
        <div style={{
          position:"absolute", top:"40%", right:"20%",
          width:300, height:300, borderRadius:"50%",
          background: dark
            ? "radial-gradient(circle, rgba(139,59,200,0.08) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(139,59,200,0.05) 0%, transparent 70%)",
        }} />
      </div>

      {/* Login card */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "440px",
        background: t.card,
        border: `1px solid ${t.cardBorder}`,
        borderRadius: "20px",
        padding: "44px 44px 36px",
        boxShadow: t.cardShadow,
      }}>

        {/* Top gradient bar */}
        <div style={{
          position:"absolute", top:0, left:0, right:0,
          height:4, borderRadius:"20px 20px 0 0",
          background: BRAND.grad,
        }} />

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <img
            src={ceritageLogoSvg}
            alt="Ceritage"
            style={{ height:64, width:"auto", maxWidth:"100%" }}
          />
        </div>

        {/* Divider */}
        <div style={{
          height:1, background: t.divider,
          margin:"0 0 28px",
        }} />

        {/* Heading */}
        <h1 style={{
          fontSize:20, fontWeight:700,
          background: BRAND.grad,
          WebkitBackgroundClip:"text",
          WebkitTextFillColor:"transparent",
          backgroundClip:"text",
          margin:"0 0 6px",
          letterSpacing:"-0.3px",
        }}>
          Admin Login
        </h1>
        <p style={{ fontSize:13, color: t.sub, margin:"0 0 28px", lineHeight:1.5 }}>
          Apne credentials se ERP dashboard access karein.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div style={{ marginBottom:18 }}>
            <label htmlFor="username" style={{
              display:"block", fontSize:11, fontWeight:600,
              color: t.label, marginBottom:7,
              textTransform:"uppercase", letterSpacing:"0.7px",
            }}>
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              disabled={loading}
              style={{
                width:"100%", background: t.inputBg,
                border:`1.5px solid ${error ? "rgba(230,59,138,0.5)" : t.inputBorder}`,
                borderRadius:11, padding:"12px 15px",
                fontSize:14, color: t.inputColor,
                outline:"none", boxSizing:"border-box",
                fontFamily:"inherit", transition:"border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = BRAND.purple}
              onBlur={e => e.target.style.borderColor = error ? "rgba(230,59,138,0.5)" : t.inputBorder}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom:0 }}>
            <label htmlFor="password" style={{
              display:"block", fontSize:11, fontWeight:600,
              color: t.label, marginBottom:7,
              textTransform:"uppercase", letterSpacing:"0.7px",
            }}>
              Password
            </label>
            <div style={{ position:"relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                disabled={loading}
                style={{
                  width:"100%", background: t.inputBg,
                  border:`1.5px solid ${error ? "rgba(230,59,138,0.5)" : t.inputBorder}`,
                  borderRadius:11, padding:"12px 15px", paddingRight:72,
                  fontSize:14, color: t.inputColor,
                  outline:"none", boxSizing:"border-box",
                  fontFamily:"inherit", transition:"border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = BRAND.purple}
                onBlur={e => e.target.style.borderColor = error ? "rgba(230,59,138,0.5)" : t.inputBorder}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                style={{
                  position:"absolute", right:13, top:"50%",
                  transform:"translateY(-50%)",
                  background:"none", border:"none",
                  color: t.showBtn, fontSize:11, fontWeight:600,
                  cursor:"pointer", padding:"4px 6px",
                  fontFamily:"inherit",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p style={{
              margin:"14px 0 0", padding:"10px 14px",
              background: t.errorBg,
              border:`1px solid ${t.errorBorder}`,
              borderRadius:9, color:"#E63B8A",
              fontSize:13, lineHeight:1.5,
            }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              display:"block", width:"100%", marginTop:26,
              padding:"13px",
              background: loading ? "rgba(139,59,200,0.5)" : BRAND.gradBtn,
              border:"none", borderRadius:11,
              color:"#fff", fontSize:15, fontWeight:700,
              letterSpacing:"0.3px",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily:"inherit",
              boxShadow: loading ? "none" : "0 4px 20px rgba(59,85,230,0.35)",
              transition:"all 0.2s",
            }}
          >
            {loading ? "Verifying..." : "Login to Dashboard"}
          </button>
        </form>

        <p style={{ marginTop:14, fontSize:12, color: t.hintText, textAlign:"center" }}>
          New to Ceritage ERP?{" "}
          <Link to="/register" style={{
            color: t.hintCode, fontWeight:600, textDecoration:"none",
          }}>
            Create an account
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p style={{
        position:"absolute", bottom:20,
        fontSize:11, color: t.footer,
        textAlign:"center", width:"100%",
        letterSpacing:"0.3px",
      }}>
        Ceritage Jewellery ERP &nbsp;&bull;&nbsp; Internal Use Only
      </p>
    </div>
  );
}
