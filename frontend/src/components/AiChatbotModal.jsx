import React, { useState, useEffect, useRef } from "react";
import { BRAND } from "../theme";
import { apiRequest } from "../lib/api";

export default function AiChatbotModal({ isOpen, onClose, onNavigate, t }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome-1",
      sender: "bot",
      text: "Namaste! How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeEngine, setActiveEngine] = useState("AI Ready");

  const messagesEndRef = useRef(null);

  // Auto scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Fetch active engine info
      apiRequest("/ai/status")
        .then(res => {
          if (res && res.success && res.data?.active_provider) {
            setActiveEngine(res.data.active_provider);
          }
        })
        .catch(() => {});
    }
  }, [messages, isOpen]);

  const handleSend = async (manualQuery = null) => {
    const query = (manualQuery || inputText).trim();
    if (!query || loading) return;

    const userMsg = {
      id: "user-" + Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const historyContext = messages
        .filter(m => m.sender === "user" || m.sender === "bot")
        .slice(-8)
        .map(m => ({ sender: m.sender, text: m.text }));

      const res = await apiRequest("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: query, history: historyContext }),
      });

      if (res && res.success) {
        const botMsg = {
          id: "bot-" + Date.now(),
          sender: "bot",
          text: res.reply || "I have processed your request.",
          action: res.action,
          source: res.source,
          tool_call: res.tool_call,
          suggestions: res.suggestions,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(res?.message || "Failed to get AI response");
      }
    } catch (err) {
      const errorMsg = {
        id: "err-" + Date.now(),
        sender: "bot",
        text: "Could not connect to AI service: " + (err.message || "Network Error"),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        padding: "20px",
        pointerEvents: "none",
      }}
    >
      {/* Backdrop for closing */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(2px)",
          pointerEvents: "auto",
        }}
      />

      {/* Main Chatbot Window */}
      <div
        style={{
          width: "420px",
          maxWidth: "calc(100vw - 32px)",
          height: "600px",
          maxHeight: "calc(100vh - 40px)",
          background: t?.card || "#16162a",
          border: `1px solid ${BRAND.purple}44`,
          borderRadius: "16px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          zIndex: 10000,
          pointerEvents: "auto",
          animation: "fadeInUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            background: t?.topbar || "#12122a",
            borderBottom: `1px solid ${t?.border || "rgba(139,59,200,0.2)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: "rgba(139,59,200,0.15)",
                border: `1px solid ${BRAND.purple}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: BRAND.purple,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t?.text || "#fff" }}>
                Ceritage Assistant
              </div>
              <div style={{ fontSize: 11, color: t?.textMuted || "#888", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: activeEngine.includes("OpenAI") || activeEngine.includes("Gemini") ? "#2ecc71" : "#f1c40f" }} />
                <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeEngine}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {onNavigate && (
              <button
                type="button"
                title="AI Settings & Model Config"
                onClick={() => {
                  onNavigate("ai");
                  onClose();
                }}
                style={{
                  background: "rgba(139,59,200,0.12)",
                  border: `1px solid ${BRAND.purple}33`,
                  borderRadius: 6,
                  height: 26,
                  padding: "0 8px",
                  color: t?.textSub || "#fff",
                  cursor: "pointer",
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                ⚙️ Config
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "none",
                borderRadius: 6,
                width: 26,
                height: 26,
                color: t?.textSub || "#fff",
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Message Container */}
        <div
          style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: m.sender === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "86%",
                  padding: "10px 14px",
                  borderRadius: m.sender === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: m.sender === "user" ? BRAND.gradBtn : (t?.card2 || "#1f1f3a"),
                  color: m.sender === "user" ? "#ffffff" : (t?.text || "#f0eeff"),
                  border: m.sender === "user" ? "none" : `1px solid ${t?.border || "rgba(139,59,200,0.15)"}`,
                  fontSize: "13px",
                  lineHeight: "1.55",
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.text}

                {/* Direct ERP Navigation Action Button inside message */}
                {m.action && m.action.type === "NAVIGATE" && (
                  <div style={{ marginTop: "10px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate(m.action.target);
                        onClose();
                      }}
                      style={{
                        background: BRAND.grad,
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 8px rgba(139,59,200,0.3)",
                      }}
                    >
                      <span>{m.action.label || `Open ${m.action.target?.toUpperCase()}`}</span>
                      <span>→</span>
                    </button>
                  </div>
                )}

                {/* Interactive Suggestion Chips */}
                {Array.isArray(m.suggestions) && m.suggestions.length > 0 && (
                  <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {m.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(s)}
                        style={{
                          background: "rgba(139,59,200,0.12)",
                          border: `1px solid ${BRAND.purple}44`,
                          borderRadius: "14px",
                          color: BRAND.purple,
                          fontSize: "11px",
                          fontWeight: "600",
                          padding: "3px 10px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        💬 {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Source & Tool Execution badge */}
                <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "10px" }}>
                  {m.source && (
                    <span style={{ color: BRAND.purple, opacity: 0.85 }}>
                      ⚡ {m.source}
                    </span>
                  )}
                  {m.tool_call && m.tool_call.name && (
                    <span style={{ color: "#2ecc71", background: "rgba(46,204,113,0.1)", padding: "1px 6px", borderRadius: "4px", border: "1px solid rgba(46,204,113,0.25)" }}>
                      🔍 Function: {m.tool_call.name}
                    </span>
                  )}
                </div>
              </div>

              <span
                style={{
                  fontSize: "10px",
                  color: t?.textMuted || "#666",
                  marginTop: "3px",
                  padding: "0 4px",
                }}
              >
                {m.timestamp}
              </span>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
              <span style={{ fontSize: 12, color: t?.textMuted || "#888" }}>
                Thinking & querying live showroom database...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && !loading && (
          <div style={{
            padding: "6px 14px 8px 14px",
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            scrollbarWidth: "none",
            borderTop: `1px solid ${t?.border || "rgba(139,59,200,0.15)"}`,
            background: t?.topbar || "#12122a",
          }}>
            {[
              "Aaj ka gold rate kya h?",
              "Showroom stock kitna h?",
              "Bill kaise banayein?",
              "Old gold exchange rule?",
              "Karigar gold balance?",
              "22-step GST validation?",
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                style={{
                  whiteSpace: "nowrap",
                  padding: "4px 10px",
                  background: "rgba(139,59,200,0.12)",
                  border: `1px solid ${BRAND.purple}33`,
                  borderRadius: "12px",
                  color: t?.text || "#fff",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: "12px 14px",
            background: t?.topbar || "#12122a",
            borderTop: `1px solid ${t?.border || "rgba(139,59,200,0.2)"}`,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* Text input */}
          <input
            type="text"
            placeholder="Poochiye (e.g. Gold rate, billing, stock, karigar, gst...)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              height: "38px",
              background: t?.inputBg || "#1e1e38",
              color: t?.inputColor || "#fff",
              border: `1px solid ${t?.inputBorder || "rgba(139,59,200,0.25)"}`,
              borderRadius: "8px",
              padding: "0 12px",
              fontSize: "13px",
              outline: "none",
            }}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            style={{
              height: "38px",
              padding: "0 16px",
              background: inputText.trim() ? BRAND.gradBtn : "rgba(255,255,255,0.06)",
              color: inputText.trim() ? "#fff" : t?.textMuted || "#666",
              border: "none",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: inputText.trim() ? "pointer" : "default",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
