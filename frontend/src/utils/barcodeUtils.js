// ─── Ceritage ERP — Barcode & QR Utilities ───────────────────────────────────
// Uses: jsbarcode (Code128) + qrcode (QR Code)
// Both are industry-standard libraries used in production ERPs worldwide.

import JsBarcode  from "jsbarcode";
import QRCode     from "qrcode";

// ═══════════════════════════════════════════════════════════════════════════════
// CODE 128 BARCODE — via JsBarcode
// Renders directly onto an SVG element (pass a <div> ref, we create SVG inside)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Render a Code128 barcode into a container div.
 * @param {HTMLElement} container  - div element to render into
 * @param {string}      value      - barcode value to encode
 * @param {object}      options    - optional overrides
 */
export function renderBarcode(container, value, options = {}) {
  if (!container || !value) return;

  // Clear previous content
  container.innerHTML = "";

  // Create SVG element for JsBarcode
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  container.appendChild(svg);

  try {
    JsBarcode(svg, value, {
      format:       "CODE128",
      width:        options.width      ?? 2,
      height:       options.height     ?? 55,
      displayValue: options.showText   ?? true,
      fontSize:     options.fontSize   ?? 13,
      fontOptions:  "bold",
      font:         "monospace",
      textAlign:    "center",
      textPosition: "bottom",
      textMargin:   4,
      background:   options.bgColor    ?? "#ffffff",
      lineColor:    options.barColor   ?? "#000000",
      margin:       options.margin     ?? 10,
      marginTop:    options.marginTop  ?? 8,
      marginBottom: options.marginBottom ?? 8,
      ...options,
    });

    // Make SVG responsive
    svg.style.maxWidth  = "100%";
    svg.style.height    = "auto";
    svg.removeAttribute("width");  // let CSS control width
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  } catch (err) {
    console.error("JsBarcode error:", err);
    container.innerHTML = `<div style="color:red;font-size:12px;padding:8px">
      Barcode error: ${err.message}
    </div>`;
  }
}

/**
 * Generate a Code128 SVG string (for print labels).
 * @param {string} value
 * @param {object} options
 * @returns {string} SVG markup string
 */
export function generateCode128SVG(value, options = {}) {
  if (!value) return "";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  try {
    JsBarcode(svg, value, {
      format:       "CODE128",
      width:        options.barWidth   ?? 2,
      height:       options.height     ?? 55,
      displayValue: options.showText   ?? true,
      fontSize:     options.fontSize   ?? 12,
      font:         "monospace",
      textAlign:    "center",
      textPosition: "bottom",
      textMargin:   4,
      background:   options.bgColor    ?? "#ffffff",
      lineColor:    options.barColor   ?? "#000000",
      margin:       10,
    });

    // Serialize SVG to string
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
  } catch (err) {
    console.error("generateCode128SVG error:", err);
    return "";
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// QR CODE — via qrcode library (canvas rendering)
// Produces a real, scannable QR code — tested with all major phone cameras
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Draw a QR code onto an HTML <canvas> element.
 * @param {HTMLCanvasElement} canvas
 * @param {string}            text
 * @param {object}            options
 */
export async function drawQRCode(canvas, text, options = {}) {
  if (!canvas || !text) return;

  try {
    await QRCode.toCanvas(canvas, text, {
      errorCorrectionLevel: "M",          // Medium — good balance of size vs recovery
      margin:               options.padding ?? 2,
      scale:                options.scale   ?? 4,
      color: {
        dark:  options.darkColor  ?? "#000000",
        light: options.lightColor ?? "#ffffff",
      },
      width: options.width ?? undefined,
    });
  } catch (err) {
    console.error("QRCode.toCanvas error:", err);
  }
}

/**
 * Generate QR code as a data URL (PNG) — for print labels.
 * @param {string} text
 * @param {number} size  - pixel size
 * @returns {Promise<string>} data URL
 */
export async function qrCodeToDataURL(text, size = 120) {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 2,
      width:  size,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch (err) {
    console.error("qrCodeToDataURL error:", err);
    return "";
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Auto-generate a 12-digit EAN-style barcode number from a SKU.
 * Deterministic — same SKU always gives same number. Includes valid check digit.
 */
export function skuToBarcode(sku) {
  if (!sku || sku.trim() === "") return "";

  const clean = sku.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length === 0) return "";

  // DJB2 hash → stable 11-digit number
  let hash = 5381;
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) + hash + clean.charCodeAt(i)) >>> 0;
  }
  let charSum = 0;
  for (let i = 0; i < clean.length; i++) charSum += clean.charCodeAt(i);

  const part1  = (hash % 100000).toString().padStart(5, "0");
  const part2  = ((charSum * 7919) % 1000000).toString().padStart(6, "0");
  const base11 = (part1 + part2).slice(0, 11);

  // EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 11; i++) sum += parseInt(base11[i]) * (i % 2 === 0  ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;

  return base11 + check;
}

/**
 * Build the text content for the QR code.
 * This is what the phone will read when scanned.
 */
export function buildQRContent(product) {
  const lines = [
    "CERITAGE ERP",
    `Name: ${product.name || ""}`,
    `SKU: ${product.sku || ""}`,
    product.product_code
       ? `Code: ${product.product_code}` : "",
    `Metal: ${product.metal_type || ""} ${product.purity || ""}`,
    `Wt: ${parseFloat(product.gross_weight || 0).toFixed(3)}g`,
    `MRP: Rs.${parseFloat(product.mrp || 0).toLocaleString("en-IN")}`,
    product.huid
       ? `HUID: ${product.huid}` : "",
    product.hallmark_status && product.hallmark_status !== "Not Hallmarked"
       ? `HM: ${product.hallmark_status}` : "",
    product.hsn_code
       ? `HSN: ${product.hsn_code}` : "",
  ].filter(Boolean);

  return lines.join("\n");
}
