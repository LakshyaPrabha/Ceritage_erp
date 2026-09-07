import React, { useState, useEffect, useRef, useCallback } from "react";
import { BRAND } from "../theme";
import { apiRequest } from "../lib/api";

export default function GlobalSmartSearch({ isOpen, onClose, onNavigate, t }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  // Debounced API search
  const performSearch = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest(`/ai/smart-search?q=${encodeURIComponent(q)}`);
      if (res && res.success) {
        setResults(res.data);
      }
    } catch (err) {
      console.warn("Smart search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query, performSearch]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasAnyResults = results && (
    (results.pages?.length || 0) +
    (results.products?.length || 0) +
    (results.customers?.length || 0) +
    (results.invoices?.length || 0) +
    (results.karigars?.length || 0)
  ) > 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "80px",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "650px",
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "80vh",
          background: t?.card || "#16162a",
          border: `1.5px solid ${BRAND.purple}55`,
          borderRadius: "16px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "fadeInDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Search Header Bar */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${t?.border || "rgba(139,59,200,0.2)"}`,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: t?.topbar || "#12122a",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: BRAND.purple }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search catalog, customer phone, HUID, bill number, or module..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: t?.text || "#fff",
              fontSize: "15px",
              fontWeight: "600",
              outline: "none",
            }}
          />
          {loading && (
            <span style={{ fontSize: "12px", color: t?.textMuted }}>Searching...</span>
          )}
          <span
            style={{
              fontSize: "11px",
              padding: "2px 6px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.08)",
              color: t?.textMuted,
              fontWeight: "700",
            }}
          >
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {!query && (
            <div style={{ padding: "24px 20px", textAlign: "center", color: t?.textMuted, fontSize: "13px" }}>
              <div>Type at least 2 characters to search across products, customers, invoices, and modules.</div>
              <div style={{ marginTop: "12px", display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                {["JW-GLD", "Necklace", "98765", "INV-", "Karigar"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    style={{
                      background: "rgba(139,59,200,0.08)",
                      border: `1px solid ${BRAND.purple}33`,
                      color: BRAND.purple,
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && !loading && !hasAnyResults && (
            <div style={{ padding: "30px", textAlign: "center", color: t?.textMuted, fontSize: "13px" }}>
              No matches found for "<strong>{query}</strong>".
            </div>
          )}

          {/* Navigation Pages */}
          {results?.pages?.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: BRAND.purple, textTransform: "uppercase", letterSpacing: 1, marginBottom: "8px" }}>
                Navigation & Modules
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {results.pages.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onNavigate(p.id);
                      onClose();
                    }}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: t?.card2 || "rgba(255,255,255,0.03)",
                      border: `1px solid ${t?.border || "rgba(139,59,200,0.15)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = BRAND.purple}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = t?.border || "rgba(139,59,200,0.15)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: 4, background: "rgba(139,59,200,0.15)", color: BRAND.purple, fontWeight: 700 }}>
                        MODULE
                      </span>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: t?.text }}>{p.title}</div>
                        <div style={{ fontSize: "11px", color: t?.textMuted }}>Jump directly to {p.id}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", color: BRAND.purple, fontWeight: "700" }}>Open →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {results?.products?.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: BRAND.blue, textTransform: "uppercase", letterSpacing: 1, marginBottom: "8px" }}>
                Products & Inventory ({results.products.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {results.products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onNavigate("products");
                      onClose();
                    }}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: t?.card2 || "rgba(255,255,255,0.03)",
                      border: `1px solid ${t?.border || "rgba(139,59,200,0.15)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: t?.text }}>
                        {p.name} <span style={{ fontSize: "11px", color: BRAND.purple }}>({p.sku})</span>
                      </div>
                      <div style={{ fontSize: "11px", color: t?.textMuted, marginTop: "2px" }}>
                        {p.purity} · Wt: {p.gross_weight}g · HUID: {p.huid || "—"} · Stock: {p.stock_qty} pcs
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "13px", fontWeight: "800", color: "#2ecc71" }}>
                        ₹{Number(p.mrp || 0).toLocaleString("en-IN")}
                      </div>
                      <div style={{ fontSize: "10px", color: t?.textMuted }}>View in Catalog →</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {results?.customers?.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: BRAND.pink, textTransform: "uppercase", letterSpacing: 1, marginBottom: "8px" }}>
                Customers & Ledgers ({results.customers.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {results.customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onNavigate("customers");
                      onClose();
                    }}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: t?.card2 || "rgba(255,255,255,0.03)",
                      border: `1px solid ${t?.border || "rgba(139,59,200,0.15)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: t?.text }}>
                        {c.full_name} <span style={{ fontSize: "11px", color: BRAND.pink }}>({c.phone})</span>
                      </div>
                      <div style={{ fontSize: "11px", color: t?.textMuted }}>
                        Tier: {c.tier} · City: {c.city || "—"} · PAN: {c.pan || "—"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "12px", color: Number(c.balance_due) > 0 ? "#e74c3c" : "#2ecc71", fontWeight: "700" }}>
                        Due: ₹{Number(c.balance_due || 0).toLocaleString("en-IN")}
                      </div>
                      <div style={{ fontSize: "10px", color: t?.textMuted }}>Open Profile →</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {results?.invoices?.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#f39c12", textTransform: "uppercase", letterSpacing: 1, marginBottom: "8px" }}>
                Invoices & Billing ({results.invoices.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {results.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      onNavigate("billing");
                      onClose();
                    }}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: t?.card2 || "rgba(255,255,255,0.03)",
                      border: `1px solid ${t?.border || "rgba(139,59,200,0.15)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: t?.text }}>
                        {inv.invoice_no} — {inv.customer_name || "Walk-in"}
                      </div>
                      <div style={{ fontSize: "11px", color: t?.textMuted }}>
                        Status: {inv.status}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "13px", fontWeight: "800", color: t?.text }}>
                        ₹{Number(inv.grand_total || 0).toLocaleString("en-IN")}
                      </div>
                      <div style={{ fontSize: "10px", color: t?.textMuted }}>Open Invoice →</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Karigars & Artisans */}
          {results?.karigars?.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#00cec9", textTransform: "uppercase", letterSpacing: 1, marginBottom: "8px" }}>
                Karigars & Workshop ({results.karigars.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {results.karigars.map((k) => (
                  <div
                    key={k.id}
                    onClick={() => {
                      onNavigate("karigar");
                      onClose();
                    }}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: t?.card2 || "rgba(255,255,255,0.03)",
                      border: `1px solid ${t?.border || "rgba(139,59,200,0.15)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: t?.text }}>
                        {k.full_name} <span style={{ fontSize: "11px", color: "#00cec9" }}>({k.specialization || "Artisan"})</span>
                      </div>
                      <div style={{ fontSize: "11px", color: t?.textMuted }}>
                        Phone: {k.phone || "—"} · Pending Jobs: {k.pending_jobs || 0}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "12px", fontWeight: "800", color: "#f39c12" }}>
                        Gold: {Number(k.gold_at_hand || 0).toFixed(2)}g
                      </div>
                      <div style={{ fontSize: "10px", color: t?.textMuted }}>Open Workshop →</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
