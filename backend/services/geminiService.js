/**
 * Ceritage Jewellery ERP - Google Gemini AI Service with Multi-Turn Function Calling Loop
 *
 * Architecture:
 * 1. User Message -> 2. Gemini + Tools -> 3. Function Call -> 4. Safe Tool Execution -> 5. Final Synthesis
 */

const { SYSTEM_PROMPT } = require("../ai/systemPrompt");
const { assistantTools } = require("../ai/assistantTools");
const { executeTool } = require("../ai/toolExecutor");

let cachedGeminiModels = null;
let lastModelFetchTime = 0;
let cachedWorkingModel = null;

/**
 * Format tool execution output into a natural, beautiful, human-friendly response
 * Used when Gemini returns a tool call or as an instant deterministic fallback.
 */
function formatToolResultToNaturalText(toolName, result, lang = "english") {
  if (!result || result.error) {
    return result?.error || "I could not retrieve the requested ERP data at this moment.";
  }

  if (toolName === "get_dashboard_kpis") {
    const val = Number(result.showroom_stock_valuation || 0).toLocaleString("en-IN");
    const sales = Number(result.today_sales_revenue || 0).toLocaleString("en-IN");
    if (lang === "hindi") {
      return `💎 **शोरूम स्टॉक व दैनिक डैशबोर्ड रिपोर्ट:**\n\n• **कुल उपलब्ध आभूषण**: ${result.total_inventory_items || 0} पीस\n• **कुल सोने का वजन**: ${result.gold_stock_weight || "0.000 kg"}\n• **शोरूम कुल स्टॉक मूल्यांकन**: ₹${val}\n• **आज की कुल बिक्री**: ₹${sales} (${result.today_invoices_count || 0} बिल)\n• **पंजीकृत ग्राहक**: ${result.total_customers || 0} लोग\n• **पेंडिंग रिपेयर ऑर्डर्स**: ${result.pending_repairs || 0} गहने\n\n[NAVIGATE:inventory]`;
    } else if (lang === "hinglish") {
      return `💎 **Showroom Stock & Live Dashboard Summary:**\n\n• **In-Stock Jewellery Count**: ${result.total_inventory_items || 0} pieces\n• **Total Gold Stock Weight**: ${result.gold_stock_weight || "0.000 kg"}\n• **Showroom Stock Valuation**: ₹${val}\n• **Today's Sales Revenue**: ₹${sales} (${result.today_invoices_count || 0} bills)\n• **Active Customers**: ${result.total_customers || 0} registered\n• **Pending Repair Jobs**: ${result.pending_repairs || 0} items\n\n[NAVIGATE:inventory]`;
    } else {
      return `💎 **Showroom Stock & Live Performance Overview:**\n\n• **Total Products in Stock**: ${result.total_inventory_items || 0} pieces\n• **Total Gold Weight**: ${result.gold_stock_weight || "0.000 kg"}\n• **Total Showroom Valuation**: ₹${val}\n• **Today's Sales**: ₹${sales} (${result.today_invoices_count || 0} invoices)\n• **Active Customers**: ${result.total_customers || 0}\n• **Pending Repairs**: ${result.pending_repairs || 0} orders\n\n[NAVIGATE:inventory]`;
    }
  }

  if (toolName === "get_today_sales") {
    if (lang === "hindi") {
      return `📊 **आज की बिक्री व कलेक्शन रिपोर्ट (${result.date}):**\n\n• **कुल बिक्री**: ${result.total_sales_amount}\n• **बने इनवॉइस**: ${result.invoices_generated} बिल\n• **प्राप्त राशि**: ${result.total_cash_collected}\n• **पेमेंट माध्यम**: कैश: ${result.breakdown?.cash || "₹0"} | UPI: ${result.breakdown?.upi || "₹0"} | कार्ड: ${result.breakdown?.card || "₹0"}\n\n[NAVIGATE:billing]`;
    } else {
      return `📊 **Sales & Collection Performance (${result.date}):**\n\n• **Total Sales Revenue**: ${result.total_sales_amount}\n• **Invoices Generated**: ${result.invoices_generated} bills\n• **Total Collected**: ${result.total_cash_collected}\n• **Payment Breakdown**: Cash: ${result.breakdown?.cash || "₹0"} | UPI: ${result.breakdown?.upi || "₹0"} | Card: ${result.breakdown?.card || "₹0"}\n\n[NAVIGATE:billing]`;
    }
  }

  if (toolName === "get_gold_rate") {
    const r = result.rates || {};
    if (lang === "hindi") {
      return `✨ **आज के लाइव मेटल भाव (${result.effective_date}):**\n\n• **24K शुद्ध सोना**: ${r.gold_24k_pure || "₹7,255/g"}\n• **22K (916) हॉलमार्क सोना**: ${r.gold_22k_hallmark_916 || "₹6,650/g"}\n• **18K (750) डायमंड सोना**: ${r.gold_18k_diamond_750 || "₹5,440/g"}\n• **14K (585) फैशन सोना**: ${r.gold_14k_fashion_585 || "₹4,240/g"}\n• **925 फाइन चांदी**: ${r.silver_925_fine || "₹84.50/g"}\n\n[NAVIGATE:rates]`;
    } else {
      return `✨ **Today's Live Bullion Benchmark Rates (${result.effective_date}):**\n\n• **24K Pure Gold (999.9)**: ${r.gold_24k_pure || "₹7,255/g"}\n• **22K Hallmark Gold (916)**: ${r.gold_22k_hallmark_916 || "₹6,650/g"}\n• **18K Diamond Gold (750)**: ${r.gold_18k_diamond_750 || "₹5,440/g"}\n• **14K Fashion Gold (585)**: ${r.gold_14k_fashion_585 || "₹4,240/g"}\n• **925 Fine Sterling Silver**: ${r.silver_925_fine || "₹84.50/g"}\n\n[NAVIGATE:rates]`;
    }
  }

  if (toolName === "search_customer") {
    if (!result.found || !result.customers?.length) {
      return result.message || "No customer found.";
    }
    const list = result.customers.map(c => `• **${c.name}** | Phone: ${c.phone} | Tier: ${c.tier} | Points: ${c.loyalty_points}`).join("\n");
    return `👥 **Matching Customer Records (${result.count}):**\n\n${list}\n\n[NAVIGATE:customers]`;
  }

  if (toolName === "get_product_stock") {
    if (!result.found || !result.products?.length) {
      return result.message || "No product stock found.";
    }
    const list = result.products.map(p => `• **${p.name}** [${p.sku}] - ${p.purity}, ${p.weight}, ${p.price} (Stock: ${p.stock_in_hand})`).join("\n");
    return `📦 **Live Jewellery Inventory Search (${result.matching_count}):**\n\n${list}\n\n[NAVIGATE:inventory]`;
  }

  if (toolName === "get_karigar_balance") {
    if (!result.found || !result.karigars?.length) {
      return result.message || "No karigar records found.";
    }
    const list = result.karigars.map(k => `• **${k.name}** (${k.specialization}): Gold Bal: **${k.gold_balance_at_hand}**, Pending Jobs: ${k.pending_job_orders}`).join("\n");
    return `🔨 **Workshop Karigar Gold Ledger:**\n\n${list}\n\n[NAVIGATE:karigar]`;
  }

  if (toolName === "get_low_stock_alerts") {
    if (!result.items?.length) {
      return "✅ All showroom stock levels are healthy. No items currently below reorder thresholds.\n\n[NAVIGATE:inventory]";
    }
    const list = result.items.map(i => `• **${i.name}** (${i.sku}): ${i.current_stock}`).join("\n");
    return `⚠️ **Low Stock Reorder Alerts (${result.total_low_stock_items} items):**\n\n${list}\n\n[NAVIGATE:inventory]`;
  }

  if (toolName === "get_dead_stock") {
    if (!result.items?.length) {
      return "✅ No slow-moving stock detected in the selected timeframe.\n\n[NAVIGATE:inventory]";
    }
    const list = result.items.map(i => `• **${i.name}** [${i.sku}] - ${i.purity}, In display: ${i.days_in_display}, Price: ${i.price}`).join("\n");
    return `⏳ **Dead Stock & Slow Moving Inventory:**\n• Total Locked Capital: **${result.locked_capital_valuation}**\n• Recommendation: ${result.recommendation}\n\n${list}\n\n[NAVIGATE:inventory]`;
  }

  return JSON.stringify(result, null, 2);
}

/**
 * Clean and sanitize AI response, stripping any chain-of-thought or reasoning scratchpad bullets
 */
function sanitizeAiReply(text) {
  if (!text) return "";
  let clean = text.trim();

  // Remove <think>...</think> tags if any reasoning model output them
  clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // If text contains reasoning scratchpad bullets like "* User input:", "* Intent:", "* Role:", etc.
  if (/(\*\s*User input|\*\s*Intent|\*\s*Language|\*\s*Role|\*\s*Tone|\*\s*Instructions|\*\s*The user)/i.test(clean)) {
    const quoteMatches = clean.match(/"([^"]{15,})"/g);
    if (quoteMatches && quoteMatches.length > 0) {
      const candidate = quoteMatches[quoteMatches.length - 1].replace(/^"|"$/g, "").trim();
      if (!candidate.startsWith("*") && !candidate.toLowerCase().includes("user input")) {
        return candidate;
      }
    }

    const lines = clean.split("\n");
    const filteredLines = lines.filter(line => {
      const l = line.trim();
      if (l.startsWith("*") && /(user input|language|intent|role|tone|instructions|does it need|is it robotic|the user)/i.test(l)) {
        return false;
      }
      return true;
    });

    clean = filteredLines.join("\n").replace(/^\s*[\*\-]\s*["']?(.*?)["']?\s*$/gm, "$1").trim();
  }

  if (clean.startsWith('"') && clean.endsWith('"') && clean.length > 2) {
    clean = clean.slice(1, -1).trim();
  }

  return clean;
}

/**
 * Dynamically discover available official Gemini models for the current API key
 */
async function fetchGeminiAvailableModels(apiKey) {
  if (!apiKey || apiKey.trim().length < 10) return [];
  const now = Date.now();
  if (cachedGeminiModels && (now - lastModelFetchTime < 10 * 60 * 1000)) {
    return cachedGeminiModels;
  }

  try {
    const listUrls = [
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`,
      `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey.trim())}`
    ];

    for (const url of listUrls) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data?.models)) {
          const supported = data.models
            .filter(m => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace(/^models\//, ""))
            .filter(name => name.startsWith("gemini-") && !name.includes("embedding") && !name.includes("aqa") && !name.includes("imagen"))
            .filter(Boolean);

          if (supported.length > 0) {
            cachedGeminiModels = supported;
            lastModelFetchTime = now;
            return supported;
          }
        }
      }
    }
  } catch (err) {
    console.warn("fetchGeminiAvailableModels notice:", err.message);
  }

  return [];
}

/**
 * Executes a full Gemini chat query with tool calling loop
 */
async function runGeminiWithTools(message, history = [], req = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length < 10) {
    return null; // Fall back to built-in RAG engine
  }

  const dynamicModels = await fetchGeminiAvailableModels(apiKey);

  // Fast list of official production Gemini models
  const candidateModels = [
    cachedWorkingModel,
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-pro",
    "gemini-1.5-pro",
    ...dynamicModels
  ].filter(Boolean);

  const uniqueModels = [...new Set(candidateModels)];

  for (const model of uniqueModels) {
    if (!model.startsWith("gemini-")) continue;

    for (const apiVer of ["v1beta", "v1"]) {
      try {
        const contents = [];

        // Multi-turn previous context
        if (Array.isArray(history) && history.length > 0) {
          for (const h of history.slice(-4)) {
            if (h.text && h.text.trim()) {
              contents.push({
                role: h.sender === "user" ? "user" : "model",
                parts: [{ text: h.text.trim() }],
              });
            }
          }
        }

        // Current message
        contents.push({
          role: "user",
          parts: [{ text: message }],
        });

        const url = `https://generativelanguage.googleapis.com/${apiVer}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        // First Call to Gemini (with official system_instruction parameter)
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: SYSTEM_PROMPT }]
            },
            contents,
            tools: [{ functionDeclarations: assistantTools }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 800,
            }
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!resp.ok) continue;

        const data = await resp.json();
        const candidate = data?.candidates?.[0];
        if (!candidate || !candidate.content) continue;

        cachedWorkingModel = model; // Cache working model for instant future queries

        const parts = candidate.content.parts || [];
        const functionCallPart = parts.find(p => p.functionCall);

        let finalReply = "";
        let executedToolInfo = null;

        if (functionCallPart && functionCallPart.functionCall) {
          // ── FUNCTION CALLING LOOP ──
          const { name: toolName, args: toolArgs } = functionCallPart.functionCall;
          console.log(`[AI Assistant] Gemini requested tool execution: ${toolName}`, toolArgs);

          // Execute Safe Backend Query
          const toolResult = await executeTool(toolName, toolArgs || {}, req);
          executedToolInfo = { name: toolName, args: toolArgs, result: toolResult };

          // Try synthesizing response through Gemini
          try {
            const followUpContents = [
              ...contents,
              {
                role: "model",
                parts: [{ functionCall: { name: toolName, args: toolArgs || {} } }]
              },
              {
                role: "function",
                parts: [{
                  functionResponse: {
                    name: toolName,
                    response: {
                      name: toolName,
                      content: toolResult
                    }
                  }
                }]
              }
            ];

            const controller2 = new AbortController();
            const timeout2 = setTimeout(() => controller2.abort(), 6000);

            const resp2 = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: SYSTEM_PROMPT }]
                },
                contents: followUpContents,
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 800,
                }
              }),
              signal: controller2.signal,
            });
            clearTimeout(timeout2);

            if (resp2.ok) {
              const data2 = await resp2.json();
              finalReply = data2?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            }
          } catch (e) {
            console.warn("Gemini second synthesis step error:", e.message);
          }

          // If LLM second step was empty or failed, use our deterministic rich formatter
          if (!finalReply || !finalReply.trim()) {
            finalReply = formatToolResultToNaturalText(toolName, toolResult, "hinglish");
          }
        } else {
          // Direct natural language text answer without function calling
          finalReply = parts.find(p => p.text)?.text || "";
        }

        if (!finalReply || !finalReply.trim()) continue;

        // Parse Action Tags [NAVIGATE:module_id]
        let action = null;
        let cleanReply = finalReply;
        const match = finalReply.match(/\[NAVIGATE:([a-zA-Z0-9_-]+)\]/);
        if (match) {
          const target = match[1].toLowerCase();
          cleanReply = finalReply.replace(match[0], "").trim();
          action = { type: "NAVIGATE", target, label: `Open ${target.toUpperCase()}` };
        }

        // Sanitize reply to remove any chain-of-thought scratchpad
        cleanReply = sanitizeAiReply(cleanReply);

        if (!cleanReply) {
          cleanReply = formatToolResultToNaturalText(executedToolInfo?.name, executedToolInfo?.result, "hinglish");
        }

        return {
          reply: cleanReply,
          action,
          provider: `Google Gemini (${model})`,
          toolCall: executedToolInfo,
        };
      } catch (err) {
        console.warn(`Gemini try model ${model} error:`, err.message);
      }
    }
  }

  return null;
}

module.exports = { runGeminiWithTools, fetchGeminiAvailableModels };
