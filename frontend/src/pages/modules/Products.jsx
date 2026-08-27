import { BRAND } from "../../theme.js";
import { useState } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid,
         Input, Select, SectionTitle } from "../../components/ui";

const TABS = [
  { id:"grid",    label:"Grid View" },
  { id:"list",    label:"List View" },
  { id:"categories", label:"Categories" },
  { id:"stones",  label:"Stones" },
  { id:"barcode", label:"Barcode & QR" },
];

const CATEGORIES = ["Ring","Earrings","Bangles","Bracelet","Chain","Necklace",
  "Pendant","Mangalsutra","Nose Pin","Anklet","Toe Ring","Kada","Coin","Idol","Custom"];

export default function Products({ t }) {
  const [tab,      setTab]      = useState("grid");
  const [addModal, setAddModal] = useState(false);

  return (
    <div>
      <PageHeader title="Products & Inventory"
        subtitle="Catalog · Pricing · Stone info · Barcode & QR management"
        t={t}
        actions={<>
          <BtnOutline t={t}>Scan Barcode</BtnOutline>
          <BtnOutline t={t}>Add Stone</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(true)}>+ Add Product</BtnPrimary>
        </>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Total Products"      color={BRAND.blue}   t={t} />
        <StatCard label="In Stock"            color="#2ecc71"      t={t} />
        <StatCard label="Low Stock"           color="#f39c12"      t={t} />
        <StatCard label="Total Gold Wt."      color={BRAND.purple} t={t} />
        <StatCard label="Stone Stock (pcs)"   color={BRAND.pink}   t={t} />
        <StatCard label="Barcodes Generated"  color="#3498db"      t={t} />
      </div>

      {/* Category filter pills */}
      <Card t={t}>
        <CardHeader title="Jewellery Category Filter" t={t} />
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {["All","Gold Jewellery","Silver Jewellery","Diamond Jewellery","Platinum","Gemstone",
            "Loose Gold","Loose Silver","Loose Diamonds","Loose Gemstones"].map((c) => (
            <button key={c} style={{ padding:"5px 14px", borderRadius:20, cursor:"pointer",
              fontSize:12, fontWeight:600, fontFamily:"inherit",
              background: c === "All" ? BRAND.gradBtn : "none",
              color: c === "All" ? "#fff" : t.textSub,
              border: c === "All" ? "none" : `1px solid ${t.borderDash}` }}>
              {c}
            </button>
          ))}
        </div>
      </Card>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "grid" && (
        <Card t={t}>
          <CardHeader title="Product Grid" t={t}
            actions={<>
              <Select t={t} style={{ width:140 }}>
                <option>All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </Select>
              <Select t={t} style={{ width:120 }}>
                <option>All Purity</option>
                <option>24K</option><option>22K</option><option>18K</option>
                <option>Silver 925</option><option>Platinum</option>
              </Select>
            </>} />
          <div style={{ textAlign:"center", padding:"40px 16px",
            color:t.textFaint, fontSize:13, border:`1px dashed ${t.borderDash}`, borderRadius:9 }}>
            products will load from backend — grid view mein dikhenge
          </div>
        </Card>
      )}

      {tab === "list" && (
        <Card t={t}>
          <CardHeader title="Product List" t={t} />
          <DataTable
            columns={["Code","SKU","Name","Category","Purity","Gross Wt","Net Wt","MRP","Stock","HUID","Actions"]}
            t={t} emptyMsg="products will load from backend" />
        </Card>
      )}

      {tab === "categories" && (
        <Card t={t}>
          <CardHeader title="Product Categories" t={t} />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12 }}>
            {CATEGORIES.map((cat) => (
              <div key={cat} style={{ background:t.card2 || t.card,
                border:`1px solid ${t.borderDash}`, borderRadius:10,
                padding:"16px", textAlign:"center", cursor:"pointer" }}>
                <div style={{ fontSize:22, marginBottom:6,
                  background:BRAND.grad, WebkitBackgroundClip:"text",
                  WebkitTextFillColor:"transparent", backgroundClip:"text",
                  fontWeight:800 }}>
                  {cat.charAt(0)}
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:t.text }}>{cat}</div>
                <div style={{ fontSize:11, color:t.textFaint, marginTop:3 }}>— items</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "stones" && (
        <Card t={t}>
          <CardHeader title="Stone / Gemstone Stock" t={t}
            actions={<BtnSm t={t} primary>+ Add Stone</BtnSm>} />
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
            {["All","Diamond","Ruby","Emerald","Sapphire","Pearl","Topaz","Zircon","CZ","Moissanite"].map((s) => (
              <button key={s} style={{ padding:"5px 12px", borderRadius:20, cursor:"pointer",
                fontSize:12, fontFamily:"inherit",
                background: s === "All" ? BRAND.gradBtn : "none",
                color: s === "All" ? "#fff" : t.textSub,
                border: s === "All" ? "none" : `1px solid ${t.borderDash}` }}>{s}</button>
            ))}
          </div>
          <DataTable
            columns={["Stone Name","Type","Color","Shape","Carat","Pcs","Rate","Supplier","Actions"]}
            t={t} emptyMsg="stones will load from backend" />
        </Card>
      )}

      {tab === "barcode" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Barcode Generator" t={t} />
            <FormGroup label="Select Product / Enter SKU" t={t}>
              <Input t={t} placeholder="e.g. NK-KND-001" />
            </FormGroup>
            <div style={{ textAlign:"center", padding:"28px",
              background:t.card2 || t.card, borderRadius:9,
              border:`1px solid ${t.borderDash}`, marginBottom:14 }}>
              <div style={{ fontSize:12, color:t.textFaint }}>Barcode preview yahan dikhega</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <BtnOutline t={t} style={{ flex:1 }}>Generate</BtnOutline>
              <BtnPrimary style={{ flex:1 }}>Print Barcode</BtnPrimary>
            </div>
          </Card>
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="QR Code Generator" t={t} />
            <FormGroup label="Select Product / Enter SKU" t={t}>
              <Input t={t} placeholder="e.g. RG-DIA-001" />
            </FormGroup>
            <div style={{ textAlign:"center", padding:"28px",
              background:t.card2 || t.card, borderRadius:9,
              border:`1px solid ${t.borderDash}`, marginBottom:14 }}>
              <div style={{ fontSize:12, color:t.textFaint }}>QR Code preview yahan dikhega</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <BtnOutline t={t} style={{ flex:1 }}>Generate</BtnOutline>
              <BtnPrimary style={{ flex:1 }}>Print QR</BtnPrimary>
            </div>
          </Card>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)}
        title="Add New Product" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={() => setAddModal(false)}>Save Product</BtnPrimary>
        </>}>
        <SectionTitle t={t}>Identification</SectionTitle>
        <FormGrid>
          <FormGroup label="Product Name *" t={t} half><Input t={t} placeholder="e.g. Kundan Necklace" /></FormGroup>
          <FormGroup label="SKU *"          t={t} half><Input t={t} placeholder="e.g. NK-KND-001" /></FormGroup>
          <FormGroup label="Jewellery Category *" t={t} half>
            <Select t={t}><option>Gold Jewellery</option><option>Diamond Jewellery</option><option>Silver Jewellery</option></Select>
          </FormGroup>
          <FormGroup label="Product Category *" t={t} half>
            <Select t={t}><option>-- Select --</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</Select>
          </FormGroup>
        </FormGrid>
        <SectionTitle t={t}>Weight & Purity</SectionTitle>
        <FormGrid>
          <FormGroup label="Purity *" t={t} half>
            <Select t={t}><option>22K</option><option>24K</option><option>18K</option><option>Silver 925</option><option>Platinum</option></Select>
          </FormGroup>
          <FormGroup label="Gross Weight (g) *" t={t} half><Input t={t} type="number" step="0.001" placeholder="0.000" /></FormGroup>
          <FormGroup label="Stone Weight (g)"   t={t} half><Input t={t} type="number" step="0.001" placeholder="0.000" /></FormGroup>
          <FormGroup label="Net Weight (g)"     t={t} half><Input t={t} type="number" step="0.001" placeholder="0.000" readOnly style={{ opacity:0.7 }} /></FormGroup>
        </FormGrid>
        <SectionTitle t={t}>Pricing</SectionTitle>
        <FormGrid>
          <FormGroup label="Making Charges (₹/g)" t={t} half><Input t={t} type="number" placeholder="0" /></FormGroup>
          <FormGroup label="MRP (₹)"               t={t} half><Input t={t} type="number" placeholder="0" /></FormGroup>
          <FormGroup label="HUID Number"           t={t} half><Input t={t} placeholder="6-char alphanumeric" /></FormGroup>
          <FormGroup label="Stock Qty"             t={t} half><Input t={t} type="number" defaultValue="1" /></FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
