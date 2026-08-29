import { BRAND } from "../../theme.js";
import { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid,
         Input, Select, SectionTitle } from "../../components/ui";
import {
  renderBarcode,
  generateCode128SVG,
  drawQRCode,
  qrCodeToDataURL,
  skuToBarcode,
  buildQRContent,
} from "../../utils/barcodeUtils.js";

const API = "http://localhost:5000/api";

function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const TABS = [
  { id: "list",       label: "All Products" },
  { id: "low_stock",  label: "Low Stock" },
  { id: "stones",     label: "Stone Details" },
  { id: "barcode",    label: "Barcode & QR" },
];

const JEWELLERY_CATEGORIES = [
  "Gold Jewellery",
  "Diamond Jewellery",
  "Silver Jewellery",
  "Platinum Jewellery",
  "Gemstone Jewellery",
  "Imitation Jewellery",
];

const PRODUCT_CATEGORIES = [
  "Ring", "Earrings", "Necklace", "Pendant", "Chain",
  "Bangles", "Bracelet", "Kada", "Mangalsutra",
  "Nose Pin", "Anklet", "Toe Ring",
  "Earrings Set", "Necklace Set", "Bridal Set",
  "Coin", "Bar", "Idol", "Other",
];

const METAL_TYPES = [
  "Gold", "Silver", "Platinum", "White Gold",
  "Rose Gold", "Palladium",
];

const PURITY_OPTIONS = {
  Gold:       ["24K (999)", "22K (916)", "18K (750)", "14K (583)", "10K (417)"],
  Silver:     ["Silver 999", "Silver 925", "Silver 800"],
  Platinum:   ["Platinum 950", "Platinum 900", "Platinum 850"],
  "White Gold": ["18K", "14K"],
  "Rose Gold":  ["18K", "14K"],
  Palladium:    ["950"],
};

const HALLMARK_OPTIONS = [
  "Not Hallmarked",
  "Hallmarked (BIS)",
  "HUID Registered",
  "Hallmarked + HUID",
];

const MAKING_CHARGE_TYPES = [
  { value: "per_gram",  label: "Per Gram (₹/g)" },
  { value: "flat",      label: "Flat Amount (₹)" },
  { value: "percent",   label: "Percentage (%)" },
];

const STONE_TYPES = [
  "Diamond", "Ruby", "Emerald", "Sapphire", "Pearl",
  "Topaz", "Opal", "Garnet", "Amethyst", "Turquoise",
  "CZ (Cubic Zirconia)", "Moissanite", "Other",
];

const EMPTY_FORM = {
  name: "", sku: "", jewellery_category: "", product_category: "",
  metal_type: "Gold", purity: "22K (916)",
  gross_weight: "", stone_weight: "0", net_weight: "",
  making_charges_type: "per_gram", making_charges: "",
  stone_charges: "0", purchase_price: "", mrp: "",
  hsn_code: "7113", huid: "", hallmark_status: "Not Hallmarked",
  barcode: "", stock_qty: "1", min_stock_qty: "1",
  location: "", description: "",
};

const EMPTY_STONE = {
  stone_type: "", stone_name: "", pieces: "1",
  weight_ct: "", quality: "", color: "", shape: "", rate: "", total_value: "",
};

// Validate product form
function validateProductForm(form) {
  const errors = {};
  if (!form.name.trim())              errors.name               = "Product name is required.";
  if (!form.sku.trim())               errors.sku                = "SKU is required.";
  if (!form.jewellery_category)       errors.jewellery_category = "Jewellery category is required.";
  if (!form.product_category)         errors.product_category   = "Product category is required.";
  if (!form.metal_type)               errors.metal_type         = "Metal type is required.";
  if (!form.purity)                   errors.purity             = "Purity is required.";
  if (!form.gross_weight || parseFloat(form.gross_weight) <= 0)
                                      errors.gross_weight       = "Gross weight must be greater than 0.";
  if (!form.mrp || parseFloat(form.mrp) <= 0)
                                      errors.mrp                = "MRP must be greater than 0.";
  if (!form.making_charges && form.making_charges !== "0")
                                      errors.making_charges     = "Making charges are required.";
  if (!form.stock_qty || parseInt(form.stock_qty) < 0)
                                      errors.stock_qty          = "Stock quantity must be 0 or more.";
  return errors;
}

// Product form component — outside main component to prevent re-mount
function ProductForm({ form, onChange, errors, t }) {
  const fs = (key) => errors[key] ? { borderColor: "rgba(230,59,138,0.7)" } : {};
  const em = (key) => errors[key]
    ? <div style={{ color: BRAND.pink, fontSize: 11, marginTop: 4 }}>{errors[key]}</div>
    : null;

  const netWeight = (parseFloat(form.gross_weight) || 0) - (parseFloat(form.stone_weight) || 0);

  return (
    <>
      <SectionTitle t={t}>Basic Information</SectionTitle>
      <FormGrid>
        <FormGroup label="Product Name *" t={t} half>
          <Input t={t} placeholder="e.g. Kundan Bridal Necklace Set"
            value={form.name} onChange={onChange("name")} style={fs("name")} />
          {em("name")}
        </FormGroup>
        <FormGroup label="SKU *" t={t} half>
          <Input t={t} placeholder="e.g. NK-KND-001"
            value={form.sku}
            onChange={e => onChange("sku")({ target: { value: e.target.value.toUpperCase() } })}
            style={{ ...fs("sku"), textTransform: "uppercase", fontFamily: "monospace" }}
            maxLength={30} />
          {em("sku")}
          <div style={{ fontSize: 10, color: t.textFaint, marginTop: 3 }}>
            Unique code for this product. Auto-converts to uppercase.
          </div>
        </FormGroup>
        <FormGroup label="Jewellery Category *" t={t} half>
          <Select t={t} value={form.jewellery_category} onChange={onChange("jewellery_category")} style={fs("jewellery_category")}>
            <option value="">-- Select Category --</option>
            {JEWELLERY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </Select>
          {em("jewellery_category")}
        </FormGroup>
        <FormGroup label="Product Type *" t={t} half>
          <Select t={t} value={form.product_category} onChange={onChange("product_category")} style={fs("product_category")}>
            <option value="">-- Select Type --</option>
            {PRODUCT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </Select>
          {em("product_category")}
        </FormGroup>
        <FormGroup label="Description" t={t}>
          <textarea rows={2} placeholder="Optional product description"
            value={form.description} onChange={onChange("description")}
            style={{ width: "100%", background: t.inputBg, border: `1.5px solid ${t.inputBorder}`,
              borderRadius: 9, padding: "10px 13px", fontSize: 13, color: t.inputColor,
              outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} />
        </FormGroup>
      </FormGrid>

      <SectionTitle t={t}>Metal & Weight</SectionTitle>
      <FormGrid>
        <FormGroup label="Metal Type *" t={t} half>
          <Select t={t} value={form.metal_type} onChange={onChange("metal_type")} style={fs("metal_type")}>
            {METAL_TYPES.map(m => <option key={m}>{m}</option>)}
          </Select>
          {em("metal_type")}
        </FormGroup>
        <FormGroup label="Purity *" t={t} half>
          <Select t={t} value={form.purity} onChange={onChange("purity")} style={fs("purity")}>
            <option value="">-- Select Purity --</option>
            {(PURITY_OPTIONS[form.metal_type] || []).map(p => <option key={p}>{p}</option>)}
          </Select>
          {em("purity")}
        </FormGroup>
        <FormGroup label="Gross Weight (g) *" t={t} half>
          <Input t={t} type="number" step="0.001" placeholder="0.000"
            value={form.gross_weight} onChange={onChange("gross_weight")} style={fs("gross_weight")} />
          {em("gross_weight")}
        </FormGroup>
        <FormGroup label="Stone Weight (g)" t={t} half>
          <Input t={t} type="number" step="0.001" placeholder="0.000"
            value={form.stone_weight} onChange={onChange("stone_weight")} />
          <div style={{ fontSize: 10, color: t.textFaint, marginTop: 3 }}>
            Weight of stones to be deducted from gross weight.
          </div>
        </FormGroup>
        <FormGroup label="Net Metal Weight (g)" t={t} half>
          <Input t={t} type="number" value={netWeight.toFixed(3)} readOnly
            style={{ opacity: 0.7, background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, borderRadius: 9, padding: "10px 13px", fontSize: 13, color: t.inputColor, outline: "none", boxSizing: "border-box", fontFamily: "inherit", width: "100%" }} />
          <div style={{ fontSize: 10, color: t.textFaint, marginTop: 3 }}>
            Auto-calculated: Gross Weight - Stone Weight
          </div>
        </FormGroup>
        <FormGroup label="HSN Code" t={t} half>
          <Input t={t} placeholder="7113" value={form.hsn_code} onChange={onChange("hsn_code")} maxLength={10} />
          <div style={{ fontSize: 10, color: t.textFaint, marginTop: 3 }}>
            Default 7113 for gold/silver jewellery. 7114 for articles of precious metal.
          </div>
        </FormGroup>
      </FormGrid>

      <SectionTitle t={t}>Pricing</SectionTitle>
      <FormGrid>
        <FormGroup label="Making Charges Type *" t={t} half>
          <Select t={t} value={form.making_charges_type} onChange={onChange("making_charges_type")}>
            {MAKING_CHARGE_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label={`Making Charges (${form.making_charges_type === "per_gram" ? "₹/g" : form.making_charges_type === "percent" ? "%" : "₹"}) *`} t={t} half>
          <Input t={t} type="number" step="0.01" placeholder="0.00"
            value={form.making_charges} onChange={onChange("making_charges")} style={fs("making_charges")} />
          {em("making_charges")}
        </FormGroup>
        <FormGroup label="Stone Charges (₹)" t={t} half>
          <Input t={t} type="number" step="0.01" placeholder="0.00"
            value={form.stone_charges} onChange={onChange("stone_charges")} />
        </FormGroup>
        <FormGroup label="Purchase Price / Cost (₹)" t={t} half>
          <Input t={t} type="number" step="0.01" placeholder="0.00"
            value={form.purchase_price} onChange={onChange("purchase_price")} />
        </FormGroup>
        <FormGroup label="MRP / Selling Price (₹) *" t={t} half>
          <Input t={t} type="number" step="0.01" placeholder="0.00"
            value={form.mrp} onChange={onChange("mrp")} style={fs("mrp")} />
          {em("mrp")}
        </FormGroup>
      </FormGrid>

      <SectionTitle t={t}>Hallmark & Identification</SectionTitle>
      <FormGrid>
        <FormGroup label="Hallmark Status" t={t} half>
          <Select t={t} value={form.hallmark_status} onChange={onChange("hallmark_status")}>
            {HALLMARK_OPTIONS.map(h => <option key={h}>{h}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="HUID Number" t={t} half>
          <Input t={t} placeholder="6-character alphanumeric HUID"
            value={form.huid}
            onChange={e => onChange("huid")({ target: { value: e.target.value.toUpperCase() } })}
            style={{ textTransform: "uppercase", fontFamily: "monospace", letterSpacing: "1px" }}
            maxLength={20} />
          <div style={{ fontSize: 10, color: t.textFaint, marginTop: 3 }}>
            Hallmark Unique Identification Number from BIS.
          </div>
        </FormGroup>
        <FormGroup label="Barcode / QR Code" t={t} half>
          <div style={{ display: "flex", gap: 6 }}>
            <Input t={t} placeholder="12-digit barcode (auto-generated from SKU)"
              value={form.barcode} onChange={onChange("barcode")}
              style={{ fontFamily: "monospace", letterSpacing: "1px" }} />
            <button
              type="button"
              onClick={() => {
                if (form.sku) {
                  onChange("barcode")({ target: { value: skuToBarcode(form.sku) } });
                }
              }}
              style={{
                background: BRAND.gradBtn, border: "none", borderRadius: 9,
                color: "#fff", fontSize: 11, fontWeight: 600,
                padding: "0 12px", cursor: "pointer", whiteSpace: "nowrap",
                fontFamily: "inherit",
              }}>
              Auto
            </button>
          </div>
          <div style={{ fontSize: 10, color: t.textFaint, marginTop: 3 }}>
            Click Auto to generate from SKU, or enter a custom barcode number.
          </div>
        </FormGroup>
      </FormGrid>

      <SectionTitle t={t}>Stock & Location</SectionTitle>
      <FormGrid>
        <FormGroup label="Stock Quantity *" t={t} half>
          <Input t={t} type="number" min="0" placeholder="1"
            value={form.stock_qty} onChange={onChange("stock_qty")} style={fs("stock_qty")} />
          {em("stock_qty")}
        </FormGroup>
        <FormGroup label="Minimum Stock Alert Level" t={t} half>
          <Input t={t} type="number" min="0" placeholder="1"
            value={form.min_stock_qty} onChange={onChange("min_stock_qty")} />
          <div style={{ fontSize: 10, color: t.textFaint, marginTop: 3 }}>
            Alert will show when stock falls at or below this level.
          </div>
        </FormGroup>
        <FormGroup label="Storage Location / Tray" t={t} half>
          <Input t={t} placeholder="e.g. Tray A3, Counter 2, Vault"
            value={form.location} onChange={onChange("location")} />
        </FormGroup>
      </FormGrid>
    </>
  );
}

// Main Products component
export default function Products({ t }) {
  const [tab,         setTab]         = useState("list");
  const [addModal,    setAddModal]    = useState(false);
  const [editModal,   setEditModal]   = useState(false);
  const [stockModal,  setStockModal]  = useState(false);
  const [viewModal,   setViewModal]   = useState(false);
  const [barcodeModal,setBarcodeModal]= useState(false);
  const [selProduct,  setSelProduct]  = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editId,      setEditId]      = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError,   setFormError]   = useState("");
  const [saving,      setSaving]      = useState(false);

  const [products,    setProducts]    = useState([]);
  const [kpis,        setKpis]        = useState({});
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [metalFilter,    setMetalFilter]    = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [stockAdjust,  setStockAdjust]  = useState({ value: "", reason: "" });
  const [adjustError,  setAdjustError]  = useState("");

  // Barcode/QR tab state
  const [bcSearch,      setBcSearch]      = useState("");
  const [bcSelected,    setBcSelected]    = useState(null);
  const [bcMode,        setBcMode]        = useState("barcode"); // "barcode" | "qr"
  const [bcLabelSize,   setBcLabelSize]   = useState("medium");  // "small"|"medium"|"large"
  const [bulkSelected,  setBulkSelected]  = useState([]);        // product ids for bulk print
  const [printQty,      setPrintQty]      = useState(1);

  // Refs for rendering
  const qrCanvasRef      = useRef(null);
  const barcodeImgRef    = useRef(null);
  const modalQrRef       = useRef(null);
  const modalBcRef       = useRef(null);

  function onChange(key) {
    return e => {
      setForm(prev => ({ ...prev, [key]: e.target.value }));
      if (fieldErrors[key]) setFieldErrors(prev => ({ ...prev, [key]: undefined }));
    };
  }

  // ── Barcode/QR render helpers ──────────────────────────────────────────────
  const renderBarcodeInEl = useCallback((product, containerEl) => {
    if (!product || !containerEl) return;
    const code = product.barcode || skuToBarcode(product.sku) || product.sku || "";
    renderBarcode(containerEl, code, {
      height:    55,
      barWidth:  2,
      showText:  true,
      fontSize:  12,
      barColor:  "#000000",
      bgColor:   "#ffffff",
      margin:    10,
    });
  }, []);

  const renderQRInEl = useCallback(async (product, canvasEl) => {
    if (!product || !canvasEl) return;
    const content = buildQRContent(product);
    await drawQRCode(canvasEl, content, {
      scale:      4,
      darkColor:  "#000000",
      lightColor: "#ffffff",
      padding:    2,
    });
  }, []);

  // Render barcode when bcSelected changes (barcode tab)
  useEffect(() => {
    if (!bcSelected) return;
    if (barcodeImgRef.current) renderBarcodeInEl(bcSelected, barcodeImgRef.current);
    if (qrCanvasRef.current)   renderQRInEl(bcSelected, qrCanvasRef.current);
  }, [bcSelected, renderBarcodeInEl, renderQRInEl]);

  // Render in modal when it opens
  useEffect(() => {
    if (!barcodeModal || !selProduct) return;
    setTimeout(() => {
      if (modalBcRef.current) renderBarcodeInEl(selProduct, modalBcRef.current);
      if (modalQrRef.current) renderQRInEl(selProduct, modalQrRef.current);
    }, 80);
  }, [barcodeModal, selProduct, renderBarcodeInEl, renderQRInEl]);

  async function fetchKpis() {
    try {
      const r = await fetch(`${API}/products/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setKpis(d.data);
    } catch {}
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: 200, _t: Date.now() });
      if (debouncedSearch) p.append("search",   debouncedSearch);
      if (categoryFilter)  p.append("product_category", categoryFilter);
      if (metalFilter)     p.append("metal_type", metalFilter);
      const r = await fetch(`${API}/products?${p}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setProducts(d.data || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchKpis(); fetchProducts(); }, []); // eslint-disable-line

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchProducts(); }, [debouncedSearch, categoryFilter, metalFilter]); // eslint-disable-line

  async function handleSave() {
    const errs = validateProductForm(form);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setSaving(true);
    setFormError("");
    try {
      const url    = editId ? `${API}/products/${editId}` : `${API}/products`;
      const method = editId ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setFormError(d.message || "Failed to save product."); setSaving(false); return; }
      setAddModal(false);
      setEditModal(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      setFormError("");
      setFieldErrors({});
      fetchProducts();
      fetchKpis();
    } catch { setFormError("Cannot connect to server."); }
    setSaving(false);
  }

  function openEdit(product) {
    setEditId(product.id);
    setForm({
      name:                product.name                || "",
      sku:                 product.sku                 || "",
      jewellery_category:  product.jewellery_category  || "",
      product_category:    product.product_category    || "",
      metal_type:          product.metal_type          || "Gold",
      purity:              product.purity              || "22K (916)",
      gross_weight:        product.gross_weight        || "",
      stone_weight:        product.stone_weight        || "0",
      net_weight:          product.net_weight          || "",
      making_charges_type: product.making_charges_type || "per_gram",
      making_charges:      product.making_charges      || "",
      stone_charges:       product.stone_charges       || "0",
      purchase_price:      product.purchase_price      || "",
      mrp:                 product.mrp                 || "",
      hsn_code:            product.hsn_code            || "7113",
      huid:                product.huid                || "",
      hallmark_status:     product.hallmark_status     || "Not Hallmarked",
      barcode:             product.barcode             || "",
      stock_qty:           product.stock_qty           || "1",
      min_stock_qty:       product.min_stock_qty       || "1",
      location:            product.location            || "",
      description:         product.description         || "",
    });
    setFormError("");
    setFieldErrors({});
    setEditModal(true);
  }

  // ── Print label function ────────────────────────────────────────────────────
  async function printLabel(products, qty = 1, labelSize = "medium") {
    const sizes = {
      small:  { w: "50mm",  h: "25mm", barH: 28, fontSize: 7,  nameSize: 8 },
      medium: { w: "75mm",  h: "40mm", barH: 42, fontSize: 8,  nameSize: 9 },
      large:  { w: "100mm", h: "50mm", barH: 52, fontSize: 9,  nameSize: 11 },
    };
    const s = sizes[labelSize] || sizes.medium;

    const qrSize = labelSize === "small" ? 56 : labelSize === "large" ? 88 : 72;

    const labels = [];
    for (const product of products) {
      const barcodeVal = product.barcode || skuToBarcode(product.sku) || product.sku || "";
      const qrContent  = buildQRContent(product);

      // Generate barcode SVG string
      const barcodeSVG = generateCode128SVG(barcodeVal, {
        height:   s.barH,
        barWidth: 1.5,
        showText: true,
        fontSize: s.fontSize,
        barColor: "#000",
        bgColor:  "#fff",
        margin:   8,
      });
      const svgB64 = btoa(unescape(encodeURIComponent(barcodeSVG)));

      // Generate QR as data URL (async — proper qrcode library)
      const qrDataURL = await qrCodeToDataURL(qrContent, qrSize);

      const metal = product.metal_type || "";
      const purity = product.purity || "";
      const wt    = `${parseFloat(product.gross_weight || 0).toFixed(3)}g`;
      const mrp   = `Rs.${parseFloat(product.mrp || 0).toLocaleString("en-IN")}`;
      const huid  = product.huid ? `HUID: ${product.huid}` : "";

      for (let i = 0; i < qty; i++) {
        labels.push(`
          <div class="label">
            <div class="label-top">
              <div class="label-name">${product.name || "—"}</div>
              <img class="label-qr" src="${qrDataURL}" />
            </div>
            <div class="label-meta">
              <span>${metal} ${purity}</span>
              <span>${wt}</span>
              <span class="label-mrp">${mrp}</span>
            </div>
            ${huid ? `<div class="label-huid">${huid}</div>` : ""}
            <div class="label-sku">SKU: ${product.sku || "—"}</div>
            <div class="label-barcode">
              <img src="data:image/svg+xml;base64,${svgB64}" />
            </div>
          </div>
        `);
      }
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ceritage — Product Labels</title>
  <style>
    @page { size: auto; margin: 5mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; }
    .labels-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 3mm;
      padding: 3mm;
    }
    .label {
      width: ${s.w};
      min-height: ${s.h};
      border: 1px solid #333;
      border-radius: 2mm;
      padding: 2mm 2.5mm 1.5mm;
      display: flex;
      flex-direction: column;
      gap: 1.5mm;
      page-break-inside: avoid;
      background: #fff;
    }
    .label-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2mm;
    }
    .label-name {
      font-size: ${s.nameSize}pt;
      font-weight: bold;
      color: #000;
      flex: 1;
      line-height: 1.2;
    }
    .label-qr {
      width: ${labelSize === "small" ? "14mm" : labelSize === "large" ? "22mm" : "18mm"};
      height: auto;
      flex-shrink: 0;
    }
    .label-meta {
      display: flex;
      gap: 3mm;
      font-size: ${s.fontSize}pt;
      color: #333;
      flex-wrap: wrap;
    }
    .label-mrp { font-weight: bold; color: #000; }
    .label-huid { font-size: ${s.fontSize - 0.5}pt; color: #555; font-family: monospace; }
    .label-sku  { font-size: ${s.fontSize - 0.5}pt; color: #555; font-family: monospace; }
    .label-barcode img { width: 100%; height: auto; display: block; }
    @media print { .labels-grid { gap: 2mm; padding: 0; } }
  </style>
</head>
<body>
  <div class="labels-grid">
    ${labels.join("")}
  </div>
  <script>
    window.onload = function() {
      window.print();
      setTimeout(() => window.close(), 1200);
    };
  </script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product permanently? This cannot be undone.")) return;
    try {
      const r = await fetch(`${API}/products/${id}`, { method: "DELETE", headers: authHeaders() });
      const d = await r.json();
      if (d.success) { fetchProducts(); fetchKpis(); }
      else alert(d.message || "Delete failed.");
    } catch { alert("Cannot connect to server."); }
  }

  async function handleStockAdjust() {
    if (!stockAdjust.value || stockAdjust.value === "0") {
      setAdjustError("Enter a non-zero adjustment value.");
      return;
    }
    try {
      const r = await fetch(`${API}/products/${selProduct.id}/stock`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ adjustment: stockAdjust.value, reason: stockAdjust.reason }),
      });
      const d = await r.json();
      if (d.success) {
        setStockModal(false);
        setStockAdjust({ value: "", reason: "" });
        fetchProducts();
        fetchKpis();
      } else {
        setAdjustError(d.message || "Failed to adjust stock.");
      }
    } catch { setAdjustError("Cannot connect to server."); }
  }

  const stockStatusColor = (status) => {
    if (status === "Out of Stock") return BRAND.pink;
    if (status === "Low Stock")    return "#f39c12";
    return "#2ecc71";
  };

  const productRows = products.map(p => ({
    "Product":     p.name,
    "SKU":         p.sku,
    "Type":        p.product_category,
    "Metal":       p.metal_type,
    "Purity":      p.purity,
    "Gross Wt.":   `${parseFloat(p.gross_weight).toFixed(3)}g`,
    "Net Wt.":     `${parseFloat(p.net_weight).toFixed(3)}g`,
    "MRP":         `₹${parseFloat(p.mrp).toLocaleString()}`,
    "Stock":       (
      <span style={{
        background: p.stock_status === "Out of Stock" ? "rgba(230,59,138,0.12)" : p.stock_status === "Low Stock" ? "rgba(243,156,18,0.12)" : "rgba(46,204,113,0.12)",
        color: stockStatusColor(p.stock_status),
        border: `1px solid ${stockStatusColor(p.stock_status)}44`,
        borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600,
      }}>
        {p.stock_qty} — {p.stock_status}
      </span>
    ),
    "HUID":        p.huid || "—",
    "Actions": (
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <button onClick={() => { setSelProduct(p); setViewModal(true); }}
          style={{ background: "none", border: `1px solid ${BRAND.blue}`, borderRadius: 6, color: BRAND.blue, fontSize: 11, padding: "3px 9px", cursor: "pointer" }}>
          View
        </button>
        <button onClick={() => openEdit(p)}
          style={{ background: BRAND.gradBtn, border: "none", borderRadius: 6, color: "#fff", fontSize: 11, padding: "3px 9px", cursor: "pointer" }}>
          Edit
        </button>
        <button onClick={() => { setSelProduct(p); setBarcodeModal(true); }}
          style={{ background: "none", border: `1px solid ${BRAND.purple}`, borderRadius: 6, color: BRAND.purple, fontSize: 11, padding: "3px 9px", cursor: "pointer" }}>
          Barcode
        </button>
        <button onClick={() => { setSelProduct(p); setStockAdjust({ value: "", reason: "" }); setAdjustError(""); setStockModal(true); }}
          style={{ background: "none", border: `1px solid #2ecc71`, borderRadius: 6, color: "#2ecc71", fontSize: 11, padding: "3px 9px", cursor: "pointer" }}>
          Stock
        </button>
        <button onClick={() => handleDelete(p.id)}
          style={{ background: "none", border: `1px solid ${BRAND.pink}`, borderRadius: 6, color: BRAND.pink, fontSize: 11, padding: "3px 9px", cursor: "pointer" }}>
          Delete
        </button>
      </div>
    ),
  }));

  const lowStockRows = products
    .filter(p => p.stock_status === "Low Stock" || p.stock_status === "Out of Stock")
    .map(p => ({
      "Product":     p.name,
      "SKU":         p.sku,
      "Type":        p.product_category,
      "Current Qty": p.stock_qty,
      "Min. Level":  p.min_stock_qty,
      "Status":      (
        <span style={{ color: stockStatusColor(p.stock_status), fontWeight: 600, fontSize: 12 }}>
          {p.stock_status}
        </span>
      ),
      "Action": (
        <button onClick={() => { setSelProduct(p); setStockAdjust({ value: "", reason: "" }); setAdjustError(""); setStockModal(true); }}
          style={{ background: BRAND.gradBtn, border: "none", borderRadius: 6, color: "#fff", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>
          Add Stock
        </button>
      ),
    }));

  return (
    <div>
      <PageHeader
        title="Products & Inventory"
        subtitle="Add and manage all jewelry items — weight, pricing, hallmark, stock"
        t={t}
        actions={<>
          <BtnOutline t={t}>Export</BtnOutline>
          <BtnPrimary onClick={() => { setForm(EMPTY_FORM); setFieldErrors({}); setFormError(""); setEditId(null); setAddModal(true); }}>
            + Add Product
          </BtnPrimary>
        </>}
      />

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard label="Total Products"    value={kpis.total_products    ?? "—"} color={BRAND.blue}   t={t} />
        <StatCard label="In Stock"          value={kpis.in_stock          ?? "—"} color="#2ecc71"      t={t} />
        <StatCard label="Low Stock"         value={kpis.low_stock         ?? "—"} color="#f39c12"      t={t} />
        <StatCard label="Out of Stock"      value={kpis.out_of_stock      ?? "—"} color={BRAND.pink}   t={t} />
        <StatCard label="Total Gold Wt."    value={kpis.total_gold_weight ? `${parseFloat(kpis.total_gold_weight).toFixed(2)}g` : "—"} color="#f0c040" t={t} />
        <StatCard label="Stock Value (MRP)" value={kpis.total_stock_value ? `₹${parseFloat(kpis.total_stock_value).toLocaleString()}` : "—"} color={BRAND.purple} t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ALL PRODUCTS */}
      {tab === "list" && (
        <Card t={t}>
          <CardHeader
            title={loading ? "Products — Loading..." : `All Products ${products.length > 0 ? `(${products.length})` : ""}`}
            t={t}
            actions={<>
              <div style={{ position: "relative" }}>
                <input
                  placeholder="Search name, SKU, code, HUID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: "7px 12px 7px 32px", fontSize: 13, color: t.inputColor, outline: "none", fontFamily: "inherit", width: 220 }} />
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: t.textMuted, fontSize: 14 }}>⌕</span>
                {search && (
                  <button onClick={() => setSearch("")}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>
                    ×
                  </button>
                )}
              </div>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: "7px 12px", fontSize: 13, color: categoryFilter ? BRAND.purple : t.textSub, outline: "none", fontFamily: "inherit", width: 140, fontWeight: categoryFilter ? 600 : 400 }}>
                <option value="">All Types</option>
                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={metalFilter} onChange={e => setMetalFilter(e.target.value)}
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: "7px 12px", fontSize: 13, color: metalFilter ? BRAND.purple : t.textSub, outline: "none", fontFamily: "inherit", width: 110, fontWeight: metalFilter ? 600 : 400 }}>
                <option value="">All Metals</option>
                {METAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </>}
          />
          {loading
            ? <div style={{ textAlign: "center", padding: 32, color: t.textFaint }}>Loading products...</div>
            : <DataTable
                columns={["Product","SKU","Type","Metal","Purity","Gross Wt.","Net Wt.","MRP","Stock","HUID","Actions"]}
                rows={productRows}
                t={t}
                emptyMsg="No products yet. Click + Add Product to add your first item." />}
        </Card>
      )}

      {/* LOW STOCK */}
      {tab === "low_stock" && (
        <Card t={t}>
          <CardHeader title="Low Stock & Out of Stock Items" t={t} />
          {lowStockRows.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: t.textFaint, fontSize: 13 }}>
              All products are adequately stocked.
            </div>
          ) : (
            <>
              <div style={{ background: "rgba(243,156,18,0.08)", border: "1px solid rgba(243,156,18,0.25)", borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: t.textSub }}>
                {lowStockRows.length} product{lowStockRows.length > 1 ? "s" : ""} need restocking.
              </div>
              <DataTable columns={["Product","SKU","Type","Current Qty","Min. Level","Status","Action"]}
                rows={lowStockRows} t={t} emptyMsg="All products are adequately stocked." />
            </>
          )}
        </Card>
      )}

      {/* STONE DETAILS */}
      {tab === "stones" && (
        <Card t={t}>
          <CardHeader title="Stone Details by Product" t={t} />
          <DataTable
            columns={["Product","SKU","Stone Type","Pieces","Weight (ct)","Color","Shape","Rate","Value"]}
            rows={products
              .filter(p => p.stone_weight > 0)
              .map(p => ({
                "Product":   p.name,
                "SKU":       p.sku,
                "Stone Type": "See product",
                "Pieces":    "—",
                "Weight (ct)": `${parseFloat(p.stone_weight).toFixed(3)}g`,
                "Color":     "—",
                "Shape":     "—",
                "Rate":      "—",
                "Value":     p.stone_charges > 0 ? `₹${parseFloat(p.stone_charges).toLocaleString()}` : "—",
              }))}
            t={t}
            emptyMsg="No products with stone details added yet." />
        </Card>
      )}

      {/* ═══ BARCODE & QR CODE TAB ════════════════════════════════════════════ */}
      {tab === "barcode" && (
        <div>
          {/* Top controls */}
          <Card t={t} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {/* Search */}
              <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 320 }}>
                <input
                  placeholder="Search product, SKU..."
                  value={bcSearch}
                  onChange={e => setBcSearch(e.target.value)}
                  style={{
                    width: "100%", background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                    borderRadius: 8, padding: "8px 12px 8px 32px",
                    fontSize: 13, color: t.inputColor, outline: "none",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }} />
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: t.textMuted, fontSize: 14 }}>⌕</span>
              </div>
              {/* Mode toggle */}
              <div style={{ display: "flex", gap: 0, border: `1px solid ${t.inputBorder}`, borderRadius: 9, overflow: "hidden" }}>
                {[["barcode","Barcode"],["qr","QR Code"]].map(([id, label]) => (
                  <button key={id} onClick={() => setBcMode(id)}
                    style={{
                      background: bcMode === id ? BRAND.gradBtn : "transparent",
                      border: "none", color: bcMode === id ? "#fff" : t.textSub,
                      padding: "7px 18px", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              {/* Label size */}
              <select value={bcLabelSize} onChange={e => setBcLabelSize(e.target.value)}
                style={{
                  background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                  borderRadius: 8, padding: "7px 12px", fontSize: 12,
                  color: t.inputColor, outline: "none", fontFamily: "inherit",
                }}>
                <option value="small">Small (50×25mm)</option>
                <option value="medium">Medium (75×40mm)</option>
                <option value="large">Large (100×50mm)</option>
              </select>
              {/* Bulk print */}
              <button
                onClick={() => {
                  const selected = bulkSelected.length > 0
                    ? products.filter(p => bulkSelected.includes(p.id))
                    : (bcSelected ? [bcSelected] : []);
                  if (selected.length === 0) { alert("Select at least one product first."); return; }
                  printLabel(selected, printQty, bcLabelSize);
                }}
                style={{
                  background: BRAND.gradBtn, border: "none", borderRadius: 9,
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  padding: "8px 20px", cursor: "pointer", fontFamily: "inherit",
                }}>
                🖨 Print {bulkSelected.length > 0 ? `${bulkSelected.length} Selected` : bcSelected ? "Label" : "Labels"}
              </button>
              {/* Print qty */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: t.textSub }}>Qty/label:</span>
                <input type="number" min="1" max="100" value={printQty}
                  onChange={e => setPrintQty(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: 55, background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                    borderRadius: 7, padding: "6px 8px", fontSize: 12,
                    color: t.inputColor, outline: "none", fontFamily: "inherit",
                    textAlign: "center",
                  }} />
              </div>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, alignItems: "start" }}>
            {/* ── Left: Product list ────────────────────────────────────────── */}
            <Card t={t} style={{ maxHeight: 520, overflowY: "auto" }}>
              <CardHeader title={`Products (${products.filter(p =>
                !bcSearch || p.name?.toLowerCase().includes(bcSearch.toLowerCase()) ||
                p.sku?.toLowerCase().includes(bcSearch.toLowerCase()) ||
                (p.barcode || "").includes(bcSearch)
              ).length})`} t={t} />
              {products
                .filter(p =>
                  !bcSearch ||
                  p.name?.toLowerCase().includes(bcSearch.toLowerCase()) ||
                  p.sku?.toLowerCase().includes(bcSearch.toLowerCase()) ||
                  (p.barcode || "").includes(bcSearch)
                )
                .map(p => {
                  const isSelected  = bcSelected?.id === p.id;
                  const isBulkCheck = bulkSelected.includes(p.id);
                  return (
                    <div key={p.id}
                      onClick={() => setBcSelected(p)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 9, marginBottom: 4,
                        cursor: "pointer",
                        background: isSelected
                          ? `rgba(139,59,200,0.12)`
                          : isBulkCheck ? `rgba(59,85,230,0.07)` : "transparent",
                        border: isSelected ? `1px solid ${BRAND.purple}` : `1px solid transparent`,
                        transition: "background 0.15s",
                      }}>
                      {/* Bulk checkbox */}
                      <input
                        type="checkbox"
                        checked={isBulkCheck}
                        onChange={e => {
                          e.stopPropagation();
                          setBulkSelected(prev =>
                            e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id)
                          );
                        }}
                        style={{ accentColor: BRAND.purple, width: 15, height: 15, cursor: "pointer" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: t.text,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 11, color: t.textMuted, fontFamily: "monospace" }}>
                          {p.sku} {p.barcode && `· ${p.barcode}`}
                        </div>
                        <div style={{ fontSize: 10, color: t.textFaint }}>
                          {p.metal_type} {p.purity} · {parseFloat(p.gross_weight || 0).toFixed(2)}g
                        </div>
                      </div>
                      {/* Mini barcode preview badge */}
                      <div style={{
                        background: isSelected ? BRAND.purple : t.card2 || t.card,
                        color: isSelected ? "#fff" : t.textMuted,
                        borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 600,
                        border: `1px solid ${t.borderDash}`,
                      }}>
                        {p.barcode ? "✓" : "—"}
                      </div>
                    </div>
                  );
                })}
              {products.length === 0 && (
                <div style={{ textAlign: "center", padding: 28, color: t.textFaint, fontSize: 13 }}>
                  No products found.
                </div>
              )}
            </Card>

            {/* ── Right: Preview & Generate ─────────────────────────────────── */}
            <Card t={t}>
              {bcSelected ? (
                <div>
                  <CardHeader
                    title={bcSelected.name}
                    t={t}
                    actions={
                      <button
                        onClick={() => printLabel([bcSelected], printQty, bcLabelSize)}
                        style={{
                          background: BRAND.gradBtn, border: "none", borderRadius: 8,
                          color: "#fff", fontSize: 12, fontWeight: 700,
                          padding: "6px 18px", cursor: "pointer", fontFamily: "inherit",
                        }}>
                        🖨 Print Label
                      </button>
                    }
                  />

                  {/* Product info strip */}
                  <div style={{
                    display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18,
                    padding: "10px 12px", background: t.card2 || t.card,
                    borderRadius: 8, border: `1px solid ${t.borderDash}`,
                  }}>
                    {[
                      ["SKU",    bcSelected.sku],
                      ["Metal",  `${bcSelected.metal_type} ${bcSelected.purity}`],
                      ["Weight", `${parseFloat(bcSelected.gross_weight || 0).toFixed(3)}g`],
                      ["MRP",    `₹${parseFloat(bcSelected.mrp || 0).toLocaleString()}`],
                      bcSelected.huid ? ["HUID", bcSelected.huid] : null,
                    ].filter(Boolean).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center",
                        minWidth: 70, padding: "4px 8px", background: t.card,
                        borderRadius: 6, border: `1px solid ${t.borderDash}` }}>
                        <span style={{ fontSize: 9, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>{k}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: t.text, fontFamily: "monospace" }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Barcode preview */}
                  {bcMode === "barcode" && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.purple,
                        textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
                        Code 128 Barcode
                      </div>
                      <div style={{
                        background: "#ffffff", border: `1px solid ${t.borderDash}`,
                        borderRadius: 10, padding: "16px 12px", textAlign: "center",
                      }}>
                        {/* SVG barcode renders here */}
                        <div ref={barcodeImgRef} style={{ display: "inline-block", maxWidth: "100%" }} />
                      </div>
                      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: t.textMuted }}>Barcode value:</span>
                        <code style={{
                          fontSize: 13, fontWeight: 700, color: BRAND.purple,
                          background: t.card2 || t.card, padding: "3px 10px",
                          borderRadius: 6, fontFamily: "monospace",
                          border: `1px solid ${t.borderDash}`,
                        }}>
                          {bcSelected.barcode || skuToBarcode(bcSelected.sku)}
                        </code>
                        {!bcSelected.barcode && (
                          <span style={{ fontSize: 10, color: t.textFaint }}>
                            (auto from SKU — save product to persist)
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 11, color: t.textFaint }}>
                        Standard Code 128 format · Scannable by all laser & 2D scanners
                      </div>
                    </div>
                  )}

                  {/* QR Code preview */}
                  {bcMode === "qr" && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.purple,
                        textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
                        QR Code — Product Info
                      </div>
                      <div style={{
                        background: "#ffffff", border: `1px solid ${t.borderDash}`,
                        borderRadius: 10, padding: 16, display: "flex",
                        justifyContent: "center", alignItems: "center",
                      }}>
                        <canvas ref={qrCanvasRef} style={{ maxWidth: 180, height: "auto" }} />
                      </div>
                      <div style={{ marginTop: 10, fontSize: 11, color: t.textFaint,
                        background: t.card2 || t.card, borderRadius: 8, padding: "8px 10px",
                        border: `1px solid ${t.borderDash}`, fontFamily: "monospace",
                        lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {buildQRContent(bcSelected)}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 11, color: t.textFaint }}>
                        Scan with any smartphone camera · Opens product details instantly
                      </div>
                    </div>
                  )}

                  {/* Label size preview info */}
                  <div style={{
                    marginTop: 18, padding: "10px 12px",
                    background: `rgba(139,59,200,0.07)`, borderRadius: 8,
                    border: `1px solid rgba(139,59,200,0.2)`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.purple, marginBottom: 6 }}>
                      Label Preview
                    </div>
                    <div style={{ fontSize: 11, color: t.textSub, lineHeight: 1.7 }}>
                      Size: <strong style={{ color: t.text }}>
                        {bcLabelSize === "small" ? "50×25mm" : bcLabelSize === "large" ? "100×50mm" : "75×40mm"}
                      </strong>
                      &nbsp;·&nbsp;
                      Copies: <strong style={{ color: t.text }}>{printQty}</strong>
                      &nbsp;·&nbsp;
                      Includes: Name, SKU, Metal, Purity, Weight, MRP, Barcode, QR Code
                      {bcSelected.huid ? ", HUID" : ""}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "48px 24px" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: t.textSub, marginBottom: 6 }}>
                    Select a product
                  </div>
                  <div style={{ fontSize: 12, color: t.textFaint }}>
                    Click any product from the list to preview its barcode or QR code.
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Bulk print info bar */}
          {bulkSelected.length > 0 && (
            <div style={{
              marginTop: 14, padding: "12px 18px",
              background: `rgba(59,85,230,0.08)`,
              border: `1px solid rgba(59,85,230,0.2)`,
              borderRadius: 10, display: "flex",
              alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
            }}>
              <span style={{ fontSize: 13, color: t.textSub }}>
                <strong style={{ color: BRAND.blue }}>{bulkSelected.length}</strong> products selected for bulk print
                &nbsp;·&nbsp; <strong style={{ color: BRAND.blue }}>{bulkSelected.length * printQty}</strong> total labels
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setBulkSelected([])}
                  style={{ background: "none", border: `1px solid ${t.inputBorder}`, borderRadius: 7,
                    color: t.textSub, fontSize: 12, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}>
                  Clear Selection
                </button>
                <button onClick={() => setBulkSelected(products.map(p => p.id))}
                  style={{ background: "none", border: `1px solid ${BRAND.blue}`, borderRadius: 7,
                    color: BRAND.blue, fontSize: 12, fontWeight: 600, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}>
                  Select All ({products.length})
                </button>
                <button
                  onClick={() => printLabel(products.filter(p => bulkSelected.includes(p.id)), printQty, bcLabelSize)}
                  style={{
                    background: BRAND.gradBtn, border: "none", borderRadius: 7,
                    color: "#fff", fontSize: 12, fontWeight: 700,
                    padding: "6px 18px", cursor: "pointer", fontFamily: "inherit",
                  }}>
                  🖨 Print {bulkSelected.length * printQty} Labels
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setFieldErrors({}); setFormError(""); }}
        title="Add New Product" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => { setAddModal(false); setFieldErrors({}); }}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Product"}</BtnPrimary>
        </>}>
        <ProductForm form={form} onChange={onChange} errors={fieldErrors} t={t} />
        {formError && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(230,59,138,0.1)", border: "1px solid rgba(230,59,138,0.3)", borderRadius: 9, color: BRAND.pink, fontSize: 13 }}>
            {formError}
          </div>
        )}
      </Modal>

      {/* EDIT PRODUCT MODAL */}
      <Modal open={editModal} onClose={() => { setEditModal(false); setFieldErrors({}); setFormError(""); }}
        title="Edit Product" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => { setEditModal(false); setFieldErrors({}); }}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Update Product"}</BtnPrimary>
        </>}>
        <ProductForm form={form} onChange={onChange} errors={fieldErrors} t={t} />
        {formError && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(230,59,138,0.1)", border: "1px solid rgba(230,59,138,0.3)", borderRadius: 9, color: BRAND.pink, fontSize: 13 }}>
            {formError}
          </div>
        )}
      </Modal>

      {/* VIEW PRODUCT MODAL */}
      <Modal open={viewModal} onClose={() => setViewModal(false)}
        title={selProduct?.name || "Product Details"} t={t} wide
        footer={
          <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => { setViewModal(false); setSelProduct(selProduct); setBarcodeModal(true); }}
              style={{ background: "none", border: `1px solid ${BRAND.purple}`, borderRadius: 8,
                color: BRAND.purple, fontSize: 12, fontWeight: 600, padding: "7px 18px",
                cursor: "pointer", fontFamily: "inherit" }}>
              View Barcode & QR
            </button>
            <BtnOutline t={t} onClick={() => setViewModal(false)}>Close</BtnOutline>
          </div>
        }>
        {selProduct && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["Product Code",     selProduct.product_code],
                ["SKU",              selProduct.sku],
                ["Jewellery Cat.",   selProduct.jewellery_category],
                ["Product Type",     selProduct.product_category],
                ["Metal",            selProduct.metal_type],
                ["Purity",           selProduct.purity],
                ["Gross Weight",     `${parseFloat(selProduct.gross_weight).toFixed(3)}g`],
                ["Stone Weight",     `${parseFloat(selProduct.stone_weight).toFixed(3)}g`],
                ["Net Weight",       `${parseFloat(selProduct.net_weight).toFixed(3)}g`],
                ["Making Charges",   `₹${parseFloat(selProduct.making_charges).toLocaleString()} (${selProduct.making_charges_type})`],
                ["Stone Charges",    `₹${parseFloat(selProduct.stone_charges).toLocaleString()}`],
                ["Purchase Price",   `₹${parseFloat(selProduct.purchase_price).toLocaleString()}`],
                ["MRP",              `₹${parseFloat(selProduct.mrp).toLocaleString()}`],
                ["HSN Code",         selProduct.hsn_code],
                ["HUID",             selProduct.huid || "Not registered"],
                ["Hallmark Status",  selProduct.hallmark_status],
                ["Barcode",          selProduct.barcode || skuToBarcode(selProduct.sku) || "—"],
                ["Stock Qty",        selProduct.stock_qty],
                ["Min. Stock Level", selProduct.min_stock_qty],
                ["Location",         selProduct.location || "—"],
                ["Status",           selProduct.status],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: "10px 14px", background: t.card2 || t.card, border: `1px solid ${t.borderDash}`, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{value}</div>
                </div>
              ))}
            </div>
            {selProduct.description && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: t.card2 || t.card, border: `1px solid ${t.borderDash}`, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>Description</div>
                <div style={{ fontSize: 13, color: t.textSub, lineHeight: 1.6 }}>{selProduct.description}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* STOCK ADJUSTMENT MODAL */}
      <Modal open={stockModal} onClose={() => setStockModal(false)}
        title={`Adjust Stock — ${selProduct?.name || ""}`} t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setStockModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleStockAdjust}>Apply Adjustment</BtnPrimary>
        </>}>
        {selProduct && (
          <div>
            <div style={{ background: t.card2 || t.card, border: `1px solid ${t.borderDash}`, borderRadius: 9, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: t.textSub }}>
              Current stock: <strong style={{ color: BRAND.purple }}>{selProduct.stock_qty}</strong> units
            </div>
            <FormGrid>
              <FormGroup label="Adjustment (+/-)" t={t}>
                <Input t={t} type="number" placeholder="e.g. +5 to add, -2 to remove"
                  value={stockAdjust.value}
                  onChange={e => { setStockAdjust(s => ({ ...s, value: e.target.value })); setAdjustError(""); }} />
                <div style={{ fontSize: 10, color: t.textFaint, marginTop: 3 }}>
                  Enter a positive number to add stock, negative to reduce.
                </div>
              </FormGroup>
              <FormGroup label="Reason" t={t}>
                <Input t={t} placeholder="e.g. New stock received, Damage adjustment"
                  value={stockAdjust.reason}
                  onChange={e => setStockAdjust(s => ({ ...s, reason: e.target.value }))} />
              </FormGroup>
            </FormGrid>
            {adjustError && (
              <div style={{ color: BRAND.pink, fontSize: 13, marginTop: 8 }}>{adjustError}</div>
            )}
          </div>
        )}
      </Modal>

      {/* BARCODE QUICK-VIEW MODAL */}
      <Modal open={barcodeModal} onClose={() => setBarcodeModal(false)}
        title={`Barcode & QR — ${selProduct?.name || ""}`} t={t} wide
        footer={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: t.textSub }}>Label size:</span>
              <select value={bcLabelSize} onChange={e => setBcLabelSize(e.target.value)}
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 7, padding: "5px 10px", fontSize: 12, color: t.inputColor, outline: "none", fontFamily: "inherit" }}>
                <option value="small">Small (50×25mm)</option>
                <option value="medium">Medium (75×40mm)</option>
                <option value="large">Large (100×50mm)</option>
              </select>
              <span style={{ fontSize: 12, color: t.textSub }}>Copies:</span>
              <input type="number" min="1" max="100" value={printQty}
                onChange={e => setPrintQty(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: 50, background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 7, padding: "5px 8px", fontSize: 12, color: t.inputColor, outline: "none", fontFamily: "inherit", textAlign: "center" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <BtnOutline t={t} onClick={() => setBarcodeModal(false)}>Close</BtnOutline>
              <button
                onClick={() => selProduct && printLabel([selProduct], printQty, bcLabelSize)}
                style={{ background: BRAND.gradBtn, border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 700, padding: "8px 24px", cursor: "pointer", fontFamily: "inherit" }}>
                🖨 Print Label
              </button>
            </div>
          </div>
        }>
        {selProduct && (
          <div>
            {/* Info strip */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20,
              padding: "10px 12px", background: t.card2 || t.card, borderRadius: 8, border: `1px solid ${t.borderDash}` }}>
              {[
                ["Product Code", selProduct.product_code || "—"],
                ["SKU",          selProduct.sku],
                ["Metal",        `${selProduct.metal_type} ${selProduct.purity}`],
                ["Gross Weight", `${parseFloat(selProduct.gross_weight || 0).toFixed(3)}g`],
                ["Net Weight",   `${parseFloat(selProduct.net_weight || 0).toFixed(3)}g`],
                ["MRP",          `₹${parseFloat(selProduct.mrp || 0).toLocaleString()}`],
                ...(selProduct.huid ? [["HUID", selProduct.huid]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center",
                  minWidth: 80, padding: "5px 10px", background: t.card, borderRadius: 7, border: `1px solid ${t.borderDash}` }}>
                  <span style={{ fontSize: 9, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: t.text, fontFamily: "monospace" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Side-by-side: Barcode + QR */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Barcode */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.purple,
                  textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                  Code 128 Barcode
                </div>
                <div style={{ background: "#ffffff", border: `1px solid ${t.borderDash}`,
                  borderRadius: 10, padding: "14px 10px", textAlign: "center" }}>
                  <div ref={modalBcRef} style={{ display: "inline-block", maxWidth: "100%" }} />
                </div>
                <div style={{ marginTop: 8, textAlign: "center" }}>
                  <code style={{ fontSize: 12, fontWeight: 700, color: BRAND.purple,
                    background: t.card2 || t.card, padding: "3px 10px",
                    borderRadius: 6, border: `1px solid ${t.borderDash}`, fontFamily: "monospace" }}>
                    {selProduct.barcode || skuToBarcode(selProduct.sku)}
                  </code>
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: t.textFaint, textAlign: "center" }}>
                  Code 128 · Compatible with all standard scanners
                </div>
              </div>

              {/* QR Code */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.purple,
                  textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                  QR Code — Full Product Info
                </div>
                <div style={{ background: "#ffffff", border: `1px solid ${t.borderDash}`,
                  borderRadius: 10, padding: 14, display: "flex", justifyContent: "center" }}>
                  <canvas ref={modalQrRef} style={{ maxWidth: 160, height: "auto" }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 10, color: t.textFaint,
                  background: t.card2 || t.card, borderRadius: 7, padding: "6px 8px",
                  border: `1px solid ${t.borderDash}`, fontFamily: "monospace",
                  lineHeight: 1.6, whiteSpace: "pre-wrap", fontSize: 10 }}>
                  {buildQRContent(selProduct)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
