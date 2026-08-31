﻿import { useState, useEffect, useCallback } from "react";
import { BRAND } from "../../theme.js";

import {
  PageHeader,
  Card,
  CardHeader,
  StatCard,
  Tabs,
  BtnPrimary,
  BtnOutline,
  BtnSm,
  Modal,
  FormGroup,
  FormGrid,
  Input,
  Select,
} from "../../components/ui";

const API = "http://localhost:5000/api";

function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function fmtDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString("en-IN");
  } catch {
    return "—";
  }
}

function getStockStatus(product) {
  if (product?.stock_status) return product.stock_status;

  const qty = Number(product?.stock_qty ?? 0);
  const min = Number(product?.min_stock_qty ?? 1);

  if (qty <= 0) return "Out of Stock";
  if (qty <= min) return "Low Stock";

  return "In Stock";
}

const TABS = [
  {
    id: "overview",
    label: "Overview",
  },
  {
    id: "bis",
    label: "BIS Hallmark",
  },
  {
    id: "track",
    label: "HUID Tracking",
  },
  {
    id: "verify",
    label: "Verification",
  },
];

const EMPTY_SETUP = {
  business_name: "",
  bis_registration_no: "",
  registration_status: "Not Configured",
  registration_date: "",
  valid_until: "",
  centre_name: "",
  centre_code: "",
  centre_address: "",
};

const EMPTY_HUID = {
  product_id: "",
  huid: "",
  hallmark_date: "",
  bis_centre: "",
  purity_mark: "",
  assessor_name: "",
  assessor_id: "",
};

export default function Hallmark({ t }) {
  /* -------------------------------------------------------------------------- */
  /* STATE                                                                      */
  /* -------------------------------------------------------------------------- */

  const [tab, setTab] = useState("overview");

  // KPI
  const [kpis, setKpis] = useState({
    registered: 0,
    pending_huid: 0,
    hallmarked: 0,
    total_products: 0,
  });

  // Product list
  const [list, setList] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  // Search/filter
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("");
  const [purityF, setPurityF] = useState("");

  // HUID modal
  const [huidModal, setHuidModal] = useState(false);
  const [huidForm, setHuidForm] = useState(EMPTY_HUID);
  const [savingHuid, setSavingHuid] = useState(false);

  // HUID verification
  const [verInput, setVerInput] = useState("");
  const [verResult, setVerResult] = useState(null);
  const [verLoading, setVerLoading] = useState(false);

  // Hallmark setup
  const [setupModal, setSetupModal] = useState(false);
  const [setup, setSetup] = useState(EMPTY_SETUP);
  const [setupSaved, setSetupSaved] = useState(false);

  // Internal hallmarking request tracker
  const [requestModal, setRequestModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestForm, setRequestForm] = useState({
    request_no: "",
    request_date: "",
    centre_name: "",
    items: 1,
    declared_purity: "",
    declared_weight: "",
    status: "Draft",
    notes: "",
  });

  /* -------------------------------------------------------------------------- */
  /* LOCAL SETUP STORAGE                                                        */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    try {
      const savedSetup = localStorage.getItem("ceritage_hallmark_setup");

      if (savedSetup) {
        setSetup(JSON.parse(savedSetup));
        setSetupSaved(true);
      }

      const savedRequests = localStorage.getItem(
        "ceritage_hallmark_requests"
      );

      if (savedRequests) {
        setRequests(JSON.parse(savedRequests));
      }
    } catch {
      // Ignore malformed local storage data
    }
  }, []);

  function saveSetup() {
    if (!setup.business_name.trim()) {
      alert("Please enter the business / jeweller name.");
      return;
    }

    try {
      localStorage.setItem(
        "ceritage_hallmark_setup",
        JSON.stringify(setup)
      );

      setSetupSaved(true);
      setSetupModal(false);

      alert("Hallmarking setup saved.");
    } catch {
      alert("Unable to save setup.");
    }
  }

  function clearSetup() {
    const ok = window.confirm(
      "Are you sure you want to remove the saved hallmarking setup?"
    );

    if (!ok) return;

    localStorage.removeItem("ceritage_hallmark_setup");

    setSetup(EMPTY_SETUP);
    setSetupSaved(false);
  }

  /* -------------------------------------------------------------------------- */
  /* API LOADERS                                                                */
  /* -------------------------------------------------------------------------- */

  const loadKpis = useCallback(async () => {
    try {
      const response = await fetch(`${API}/hallmark/kpis`, {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        setKpis(data.data || {});
      }
    } catch (error) {
      console.error("Hallmark KPI error:", error);
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);

    try {
      const query = new URLSearchParams();

      if (search.trim()) {
        query.set("search", search.trim());
      }

      if (statusF) {
        query.set("status", statusF);
      }

      if (purityF) {
        query.set("purity", purityF);
      }

      const response = await fetch(
        `${API}/hallmark/list?${query.toString()}`,
        {
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (data.success) {
        setList(data.data || []);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Hallmark list error:", error);
    } finally {
      setLoading(false);
    }
  }, [search, statusF, purityF]);

  const loadTracking = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API}/hallmark/tracking`, {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        setTracking(data.data || []);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("HUID tracking error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);

    try {
      const response = await fetch(`${API}/products?limit=500`, {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("Products error:", error);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  useEffect(() => {
    if (tab === "bis" || tab === "overview") {
      loadList();
    }

    if (tab === "track") {
      loadTracking();
    }
  }, [tab, loadList, loadTracking]);

  useEffect(() => {
    if (huidModal) {
      loadProducts();
    }
  }, [huidModal, loadProducts]);

  /* -------------------------------------------------------------------------- */
  /* HUID VALIDATION                                                            */
  /* -------------------------------------------------------------------------- */

  function validateHuid(value) {
    return /^[A-Z0-9]{6}$/.test(value);
  }

  /* -------------------------------------------------------------------------- */
  /* ADD HUID TO PRODUCT                                                        */
  /* -------------------------------------------------------------------------- */

  async function submitHuid() {
    const huid = huidForm.huid.trim().toUpperCase();

    if (!huidForm.product_id) {
      alert("Please select a product.");
      return;
    }

    if (!validateHuid(huid)) {
      alert("HUID must contain exactly 6 letters/numbers.");
      return;
    }

    if (!huidForm.hallmark_date) {
      alert("Please enter the hallmark date.");
      return;
    }

    setSavingHuid(true);

    try {
      const payload = {
        ...huidForm,
        huid,
        bis_centre:
          huidForm.bis_centre ||
          setup.centre_name ||
          "",
      };

      const response = await fetch(`${API}/hallmark/register`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Unable to add HUID.");
        return;
      }

      setHuidModal(false);
      setHuidForm(EMPTY_HUID);

      await loadKpis();
      await loadList();

      if (tab === "track") {
        await loadTracking();
      }

      alert(
        "HUID added successfully and linked to the product."
      );
    } catch (error) {
      alert(error.message || "Unable to save HUID.");
    } finally {
      setSavingHuid(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* VERIFY HUID                                                                */
  /* -------------------------------------------------------------------------- */

  async function verifyHuid() {
    const huid = verInput.trim().toUpperCase();

    if (!huid) {
      alert("Please enter a HUID.");
      return;
    }

    if (!validateHuid(huid)) {
      alert("Please enter a valid 6-character HUID.");
      return;
    }

    setVerLoading(true);
    setVerResult(null);

    try {
      const response = await fetch(
        `${API}/hallmark/verify/${huid}`,
        {
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      setVerResult(data);
    } catch (error) {
      setVerResult({
        success: false,
        verified: false,
        message: error.message,
      });
    } finally {
      setVerLoading(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* OPEN HUID MODAL                                                            */
  /* -------------------------------------------------------------------------- */

  function openHuidModal(product = null) {
    const initialProduct = product || null;

    setHuidForm({
      ...EMPTY_HUID,
      product_id: initialProduct?.id
        ? String(initialProduct.id)
        : "",
      purity_mark: initialProduct?.purity || "",
      bis_centre: setup.centre_name || "",
      hallmark_date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setHuidModal(true);
  }

  /* -------------------------------------------------------------------------- */
  /* PRODUCT SELECTED IN HUID MODAL                                             */
  /* -------------------------------------------------------------------------- */

  function handleProductChange(event) {
    const productId = event.target.value;

    const selected = products.find(
      (product) => String(product.id) === String(productId)
    );

    setHuidForm((previous) => ({
      ...previous,
      product_id: productId,
      purity_mark: selected?.purity || "",
    }));
  }

  /* -------------------------------------------------------------------------- */
  /* REQUEST TRACKER                                                            */
  /* -------------------------------------------------------------------------- */

  function openRequestModal() {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    const requestNo =
      `HM-${Date.now().toString().slice(-6)}`;

    setRequestForm({
      request_no: requestNo,
      request_date: today,
      centre_name: setup.centre_name || "",
      items: 1,
      declared_purity: "",
      declared_weight: "",
      status: "Draft",
      notes: "",
    });

    setRequestModal(true);
  }

  function saveRequest() {
    if (!requestForm.centre_name.trim()) {
      alert(
        "Please configure/select your actual hallmarking centre first."
      );
      return;
    }

    if (!requestForm.items || Number(requestForm.items) <= 0) {
      alert("Please enter the number of items.");
      return;
    }

    const newRequest = {
      ...requestForm,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };

    const updated = [newRequest, ...requests];

    setRequests(updated);

    localStorage.setItem(
      "ceritage_hallmark_requests",
      JSON.stringify(updated)
    );

    setRequestModal(false);

    alert(
      "Internal hallmarking request created. This does not submit a request to BIS."
    );
  }

  function updateRequestStatus(id, status) {
    const updated = requests.map((request) =>
      request.id === id
        ? { ...request, status }
        : request
    );

    setRequests(updated);

    localStorage.setItem(
      "ceritage_hallmark_requests",
      JSON.stringify(updated)
    );
  }

  /* -------------------------------------------------------------------------- */
  /* TABLE HELPERS                                                              */
  /* -------------------------------------------------------------------------- */

  const TH = ({ children }) => (
    <th
      style={{
        textAlign: "left",
        padding: "10px 12px",
        color: t.textMuted,
        fontWeight: 700,
        fontSize: 11,
        textTransform: "uppercase",
        borderBottom: `1px solid ${t.borderDash}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );

  const TD = ({
    children,
    bold = false,
    color,
  }) => (
    <td
      style={{
        padding: "11px 12px",
        color:
          color ||
          (bold ? t.text : t.textSub),
        fontWeight: bold ? 600 : 400,
        verticalAlign: "middle",
      }}
    >
      {children ?? "—"}
    </td>
  );

  const inputStyle = {
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    borderRadius: 8,
    padding: "9px 11px",
    fontSize: 13,
    color: t.inputColor,
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  };

  /* -------------------------------------------------------------------------- */
  /* BADGES                                                                     */
  /* -------------------------------------------------------------------------- */

  function StatusBadge({ children, type = "default" }) {
    let background = "rgba(108, 92, 231, 0.10)";
    let color = BRAND.purple;

    if (type === "success") {
      background = "rgba(46, 204, 113, 0.14)";
      color = "#27ae60";
    }

    if (type === "warning") {
      background = "rgba(243, 156, 18, 0.14)";
      color = "#e67e22";
    }

    if (type === "danger") {
      background = "rgba(230, 59, 138, 0.12)";
      color = BRAND.pink;
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 9px",
          borderRadius: 6,
          background,
          color,
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
    );
  }

  function getHallmarkBadge(status) {
    if (status === "Hallmarked") {
      return (
        <StatusBadge type="success">
          ✓ Hallmarked
        </StatusBadge>
      );
    }

    return (
      <StatusBadge type="warning">
        Pending Hallmark
      </StatusBadge>
    );
  }

  function getStockBadge(status) {
    if (status === "In Stock") {
      return (
        <StatusBadge type="success">
          In Stock
        </StatusBadge>
      );
    }

    if (status === "Low Stock") {
      return (
        <StatusBadge type="warning">
          Low Stock
        </StatusBadge>
      );
    }

    return (
      <StatusBadge type="danger">
        {status || "Out of Stock"}
      </StatusBadge>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* RENDER                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div>
      <PageHeader
        title="Hallmark & HUID Management"
        subtitle="BIS setup · Hallmarking workflow · HUID tracking · Verification"
        t={t}
        actions={
          <>
            <BtnOutline
              t={t}
              onClick={() => {
                setTab("verify");
              }}
            >
              Quick Verify
            </BtnOutline>

            <BtnPrimary
              onClick={() => openHuidModal()}
            >
              + Add HUID
            </BtnPrimary>
          </>
        }
      />

      {/* ====================================================================== */}
      {/* KPI CARDS                                                              */}
      {/* ====================================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(170px,1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard
          label="Total Products"
          value={kpis.total_products || 0}
          color={BRAND.purple}
          t={t}
        />

        <StatCard
          label="Hallmarked"
          value={kpis.hallmarked || 0}
          color="#2ecc71"
          t={t}
        />

        <StatCard
          label="HUID Mapped"
          value={kpis.registered || 0}
          color={BRAND.blue}
          t={t}
        />

        <StatCard
          label="Pending HUID"
          value={kpis.pending_huid || 0}
          color="#f39c12"
          t={t}
        />
      </div>

      {/* ====================================================================== */}
      {/* SETUP BANNER                                                           */}
      {/* ====================================================================== */}

      <div
        style={{
          background: `linear-gradient(135deg,${BRAND.blue}10,${BRAND.purple}08)`,
          border: `1px solid ${t.borderDash}`,
          borderRadius: 12,
          padding: "17px 20px",
          marginBottom: 20,
        }}
      >
        {!setupSaved ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 15,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  color: t.text,
                  marginBottom: 5,
                }}
              >
                Hallmarking Setup Required
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: t.textMuted,
                  maxWidth: 700,
                  lineHeight: 1.6,
                }}
              >
                Configure your jewellery business's actual
                BIS registration and preferred hallmarking
                centre details before mapping HUIDs.
              </div>
            </div>

            <BtnPrimary
              onClick={() => setSetupModal(true)}
            >
              Complete Setup
            </BtnPrimary>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 15,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 5,
                }}
              >
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: t.text,
                  }}
                >
                  {setup.business_name}
                </span>

                <StatusBadge type="success">
                  ✓ Setup Configured
                </StatusBadge>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: t.textMuted,
                  lineHeight: 1.7,
                }}
              >
                {setup.bis_registration_no
                  ? `BIS Registration: ${setup.bis_registration_no}`
                  : "BIS Registration: Not entered"}
                {" · "}
                {setup.centre_name
                  ? `A&H Centre: ${setup.centre_name}`
                  : "Hallmarking Centre: Not entered"}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <BtnOutline
                t={t}
                onClick={() => setSetupModal(true)}
              >
                Edit Setup
              </BtnOutline>

              <BtnSm
                t={t}
                onClick={clearSetup}
              >
                Clear
              </BtnSm>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================== */}
      {/* TABS                                                                    */}
      {/* ====================================================================== */}

      <Tabs
        tabs={TABS}
        active={tab}
        onChange={setTab}
        t={t}
      />

      {/* ====================================================================== */}
      {/* OVERVIEW                                                                */}
      {/* ====================================================================== */}

      {tab === "overview" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(300px,1fr))",
              gap: 15,
              marginTop: 16,
            }}
          >
            {/* Workflow */}
            <Card t={t}>
              <CardHeader
                title="Jewellery Hallmarking Workflow"
                t={t}
              />

              <div
                style={{
                  padding: "0 4px 8px",
                }}
              >
                {[
                  [
                    "1",
                    "Create Product",
                    "Add jewellery item to Inventory.",
                  ],
                  [
                    "2",
                    "Send for Hallmarking",
                    "Use your actual A&H Centre.",
                  ],
                  [
                    "3",
                    "Receive HUID",
                    "Enter the HUID received through the actual hallmarking process.",
                  ],
                  [
                    "4",
                    "Map HUID",
                    "Link HUID with the exact Ceritage product.",
                  ],
                  [
                    "5",
                    "Sell & Track",
                    "HUID remains traceable through the sale.",
                  ],
                ].map(
                  ([number, title, description]) => (
                    <div
                      key={number}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: "11px 4px",
                        borderBottom: `1px solid ${t.borderDash}`,
                      }}
                    >
                      <div
                        style={{
                          minWidth: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: `${BRAND.purple}15`,
                          color: BRAND.purple,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        {number}
                      </div>

                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: t.text,
                          }}
                        >
                          {title}
                        </div>

                        <div
                          style={{
                            fontSize: 11,
                            color: t.textMuted,
                            marginTop: 3,
                            lineHeight: 1.5,
                          }}
                        >
                          {description}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </Card>

            {/* Requests */}
            <Card t={t}>
              <CardHeader
                title="Hallmarking Requests"
                t={t}
                action={
                  <BtnSm
                    t={t}
                    primary
                    onClick={openRequestModal}
                  >
                    + New Request
                  </BtnSm>
                }
              />

              <div
                style={{
                  fontSize: 12,
                  color: t.textMuted,
                  lineHeight: 1.7,
                  marginBottom: 12,
                }}
              >
                Track your internal hallmarking batches sent
                to your actual A&H Centre.
                <br />
                <strong style={{ color: t.text }}>
                  Ceritage does not submit these requests to
                  BIS automatically.
                </strong>
              </div>

              {requests.length === 0 ? (
                <div
                  style={{
                    padding: 28,
                    textAlign: "center",
                    color: t.textMuted,
                    border: `1px dashed ${t.borderDash}`,
                    borderRadius: 8,
                  }}
                >
                  No hallmarking requests yet.
                  <br />
                  <span style={{ fontSize: 11 }}>
                    Create one after preparing a batch for your
                    A&H Centre.
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    overflowX: "auto",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr>
                        <TH>Request</TH>
                        <TH>Date</TH>
                        <TH>Items</TH>
                        <TH>Status</TH>
                      </tr>
                    </thead>

                    <tbody>
                      {requests
                        .slice(0, 5)
                        .map((request) => (
                          <tr
                            key={request.id}
                            style={{
                              borderBottom: `1px solid ${t.borderDash}`,
                            }}
                          >
                            <TD bold>
                              {request.request_no}
                            </TD>

                            <TD>
                              {fmtDate(
                                request.request_date
                              )}
                            </TD>

                            <TD>
                              {request.items}
                            </TD>

                            <TD>
                              <select
                                value={request.status}
                                onChange={(event) =>
                                  updateRequestStatus(
                                    request.id,
                                    event.target.value
                                  )
                                }
                                style={{
                                  ...inputStyle,
                                  width: 125,
                                  padding: "5px 7px",
                                }}
                              >
                                <option>
                                  Draft
                                </option>
                                <option>
                                  Prepared
                                </option>
                                <option>
                                  Sent to A&H Centre
                                </option>
                                <option>
                                  Under Hallmarking
                                </option>
                                <option>
                                  Completed
                                </option>
                                <option>
                                  Rejected
                                </option>
                              </select>
                            </TD>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Recent products */}
          <div
            style={{
              marginTop: 16,
              background: t.card,
              border: `1px solid ${t.borderDash}`,
              borderRadius: 12,
              overflowX: "auto",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: `1px solid ${t.borderDash}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: t.text,
                }}
              >
                Jewellery Hallmark Status
              </div>

              <BtnSm
                t={t}
                onClick={() => setTab("bis")}
              >
                View Registry
              </BtnSm>
            </div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  <TH>SKU</TH>
                  <TH>Product</TH>
                  <TH>Purity</TH>
                  <TH>HUID</TH>
                  <TH>Hallmark</TH>
                  <TH>Stock</TH>
                </tr>
              </thead>

              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: 35,
                        textAlign: "center",
                        color: t.textMuted,
                      }}
                    >
                      {loading
                        ? "Loading..."
                        : "No products found"}
                    </td>
                  </tr>
                ) : (
                  list.slice(0, 8).map((product) => (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: `1px solid ${t.borderDash}`,
                      }}
                    >
                      <TD bold>{product.sku}</TD>
                      <TD>{product.name}</TD>
                      <TD>{product.purity}</TD>

                      <TD>
                        {product.huid ? (
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 800,
                              color: BRAND.blue,
                            }}
                          >
                            {product.huid}
                          </span>
                        ) : (
                          <StatusBadge type="warning">
                            Not Mapped
                          </StatusBadge>
                        )}
                      </TD>

                      <TD>
                        {getHallmarkBadge(
                          product.hallmark_status
                        )}
                      </TD>

                      <TD>
                        {getStockBadge(
                          getStockStatus(product)
                        )}
                      </TD>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* BIS HALLMARK REGISTRY                                                   */}
      {/* ====================================================================== */}

      {tab === "bis" && (
        <div style={{ marginTop: 16 }}>
          {/* Filters */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <input
              placeholder="Search SKU, product or HUID..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  loadList();
                }
              }}
              style={{
                ...inputStyle,
                width: 230,
              }}
            />

            <select
              value={statusF}
              onChange={(event) =>
                setStatusF(event.target.value)
              }
              style={{
                ...inputStyle,
                width: 165,
              }}
            >
              <option value="">
                All Status
              </option>
              <option value="Registered">
                HUID Mapped
              </option>
              <option value="Pending">
                HUID Pending
              </option>
              <option value="Hallmarked">
                Hallmarked
              </option>
              <option value="Not Hallmarked">
                Not Hallmarked
              </option>
            </select>

            <select
              value={purityF}
              onChange={(event) =>
                setPurityF(event.target.value)
              }
              style={{
                ...inputStyle,
                width: 145,
              }}
            >
              <option value="">
                All Purity
              </option>
              <option value="999">
                24K / 999
              </option>
              <option value="916">
                22K / 916
              </option>
              <option value="750">
                18K / 750
              </option>
              <option value="585">
                14K / 585
              </option>
              <option value="925">
                Silver / 925
              </option>
            </select>

            <BtnSm
              t={t}
              primary
              onClick={loadList}
            >
              Search
            </BtnSm>

            <BtnSm
              t={t}
              onClick={() => {
                setSearch("");
                setStatusF("");
                setPurityF("");
                setTimeout(loadList, 0);
              }}
            >
              Reset
            </BtnSm>
          </div>

          {/* Registry */}
          <div
            style={{
              background: t.card,
              borderRadius: 12,
              border: `1px solid ${t.borderDash}`,
              overflowX: "auto",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: `1px solid ${t.borderDash}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: t.text,
                  }}
                >
                  Jewellery Hallmark Registry
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: t.textMuted,
                    marginTop: 3,
                  }}
                >
                  {list.length} products
                </div>
              </div>

              <BtnSm
                t={t}
                primary
                onClick={() => openHuidModal()}
              >
                + Add HUID to Product
              </BtnSm>
            </div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  {[
                    "SKU",
                    "Product",
                    "Purity",
                    "Gross Wt",
                    "Net Wt",
                    "HUID",
                    "Hallmark",
                    "Stock",
                    "Action",
                  ].map((heading) => (
                    <TH key={heading}>
                      {heading}
                    </TH>
                  ))}
                </tr>
              </thead>

              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        padding: 40,
                        textAlign: "center",
                        color: t.textMuted,
                      }}
                    >
                      {loading
                        ? "Loading..."
                        : "No products found"}
                    </td>
                  </tr>
                ) : (
                  list.map((product) => (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: `1px solid ${t.borderDash}`,
                      }}
                    >
                      <TD bold>
                        {product.sku}
                      </TD>

                      <TD>
                        {product.name}
                      </TD>

                      <TD>
                        {product.purity || "—"}
                      </TD>

                      <TD>
                        {product.gross_weight != null
                          ? `${product.gross_weight} g`
                          : "—"}
                      </TD>

                      <TD>
                        {product.net_weight != null
                          ? `${product.net_weight} g`
                          : "—"}
                      </TD>

                      <TD>
                        {product.huid ? (
                          <span
                            style={{
                              fontFamily: "monospace",
                              letterSpacing: "1.5px",
                              fontWeight: 800,
                              color: BRAND.blue,
                            }}
                          >
                            {product.huid}
                          </span>
                        ) : (
                          <StatusBadge type="warning">
                            Pending
                          </StatusBadge>
                        )}
                      </TD>

                      <TD>
                        {getHallmarkBadge(
                          product.hallmark_status
                        )}
                      </TD>

                      <TD>
                        {getStockBadge(
                          getStockStatus(product)
                        )}
                      </TD>

                      <TD>
                        {!product.huid ? (
                          <BtnSm
                            t={t}
                            primary
                            onClick={() =>
                              openHuidModal(product)
                            }
                          >
                            Add HUID
                          </BtnSm>
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              color: t.textMuted,
                            }}
                          >
                            Mapped
                          </span>
                        )}
                      </TD>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* HUID TRACKING                                                           */}
      {/* ====================================================================== */}

      {tab === "track" && (
        <div
          style={{
            marginTop: 16,
            background: t.card,
            borderRadius: 12,
            border: `1px solid ${t.borderDash}`,
            overflowX: "auto",
          }}
        >
          <div
            style={{
              padding: "15px 18px",
              borderBottom: `1px solid ${t.borderDash}`,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: t.text,
              }}
            >
              HUID Lifecycle Tracker
            </div>

            <div
              style={{
                fontSize: 11,
                color: t.textMuted,
                marginTop: 4,
              }}
            >
              Product → HUID → Inventory → Sale → Customer
            </div>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                {[
                  "HUID",
                  "SKU",
                  "Product",
                  "Purity",
                  "Net Wt",
                  "Stock",
                  "Hallmark Date",
                  "Invoice",
                  "Sale Date",
                  "Sold To",
                ].map((heading) => (
                  <TH key={heading}>
                    {heading}
                  </TH>
                ))}
              </tr>
            </thead>

            <tbody>
              {tracking.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: t.textMuted,
                    }}
                  >
                    {loading
                      ? "Loading..."
                      : "No HUID-tagged items found"}
                  </td>
                </tr>
              ) : (
                tracking.map((product, index) => (
                  <tr
                    key={`${product.id}-${index}`}
                    style={{
                      borderBottom: `1px solid ${t.borderDash}`,
                    }}
                  >
                    <TD>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 800,
                          letterSpacing: "1px",
                          color: BRAND.blue,
                        }}
                      >
                        {product.huid}
                      </span>
                    </TD>

                    <TD bold>
                      {product.sku}
                    </TD>

                    <TD>
                      {product.name}
                    </TD>

                    <TD>
                      {product.purity || "—"}
                    </TD>

                    <TD>
                      {product.net_weight != null
                        ? `${product.net_weight} g`
                        : "—"}
                    </TD>

                    <TD>
                      {getStockBadge(
                        product.stock_status
                      )}
                    </TD>

                    <TD>
                      {fmtDate(product.hallmark_date)}
                    </TD>

                    <TD>
                      {product.sale_invoice || "—"}
                    </TD>

                    <TD>
                      {product.sale_date
                        ? fmtDate(product.sale_date)
                        : "—"}
                    </TD>

                    <TD>
                      {product.sold_to || "Unsold"}
                    </TD>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ====================================================================== */}
      {/* VERIFICATION                                                            */}
      {/* ====================================================================== */}

      {tab === "verify" && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              background: t.card,
              borderRadius: 12,
              border: `1px solid ${t.borderDash}`,
              padding: 24,
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: t.text,
                marginBottom: 6,
              }}
            >
              HUID Lookup
            </div>

            <div
              style={{
                fontSize: 12,
                color: t.textMuted,
                lineHeight: 1.6,
                maxWidth: 720,
                marginBottom: 18,
              }}
            >
              Search a HUID stored in your Ceritage inventory
              to find its linked jewellery item.
              This is an internal Ceritage lookup and does
              not replace official BIS verification.
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                placeholder="Enter 6-character HUID"
                value={verInput}
                maxLength={6}
                onChange={(event) =>
                  setVerInput(
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    verifyHuid();
                  }
                }}
                style={{
                  ...inputStyle,
                  width: 250,
                  fontFamily: "monospace",
                  letterSpacing: "3px",
                  fontSize: 17,
                  fontWeight: 800,
                }}
              />

              <BtnPrimary
                onClick={verifyHuid}
                disabled={verLoading}
              >
                {verLoading
                  ? "Searching..."
                  : "Search HUID"}
              </BtnPrimary>

              {verInput && (
                <BtnOutline
                  t={t}
                  onClick={() => {
                    setVerInput("");
                    setVerResult(null);
                  }}
                >
                  Clear
                </BtnOutline>
              )}
            </div>
          </div>

          {verResult && (
            <div
              style={{
                marginTop: 15,
                background: t.card,
                borderRadius: 12,
                border: `1px solid ${
                  verResult.verified
                    ? "rgba(46,204,113,.35)"
                    : t.borderDash
                }`,
                padding: 22,
              }}
            >
              {verResult.verified ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <StatusBadge type="success">
                      ✓ HUID Found
                    </StatusBadge>

                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 800,
                        color: BRAND.blue,
                      }}
                    >
                      {verResult.data?.huid}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: t.textMuted,
                      marginBottom: 14,
                    }}
                  >
                    This HUID exists in the Ceritage product
                    registry.
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(180px,1fr))",
                      gap: 10,
                    }}
                  >
                    {[
                      [
                        "SKU",
                        verResult.data?.sku,
                      ],
                      [
                        "Product",
                        verResult.data?.name,
                      ],
                      [
                        "Purity",
                        verResult.data?.purity,
                      ],
                      [
                        "Gross Weight",
                        verResult.data?.gross_weight != null
                          ? `${verResult.data.gross_weight} g`
                          : "—",
                      ],
                      [
                        "Net Weight",
                        verResult.data?.net_weight != null
                          ? `${verResult.data.net_weight} g`
                          : "—",
                      ],
                      [
                        "Hallmark",
                        verResult.data
                          ?.hallmark_status ||
                          "—",
                      ],
                      [
                        "Stock Status",
                        verResult.data
                          ?.stock_status ||
                          "—",
                      ],
                      [
                        "Supplier",
                        verResult.data
                          ?.supplier_name ||
                          "—",
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          background:
                            t.card2 || t.card,
                          border: `1px solid ${t.borderDash}`,
                          borderRadius: 8,
                          padding: "10px 12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            color: t.textMuted,
                            textTransform:
                              "uppercase",
                            marginBottom: 4,
                          }}
                        >
                          {label}
                        </div>

                        <div
                          style={{
                            fontWeight: 700,
                            color: t.text,
                            fontSize: 13,
                          }}
                        >
                          {value || "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div>
                  <StatusBadge type="danger">
                    HUID Not Found
                  </StatusBadge>

                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      color: t.text,
                    }}
                  >
                    {verResult.message ||
                      "This HUID does not exist in the Ceritage registry."}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================== */}
      {/* HUID MODAL                                                              */}
      {/* ====================================================================== */}

      <Modal
        open={huidModal}
        onClose={() => {
          if (!savingHuid) {
            setHuidModal(false);
            setHuidForm(EMPTY_HUID);
          }
        }}
        title="Add HUID to Product"
        t={t}
        wide
        footer={
          <>
            <BtnOutline
              t={t}
              onClick={() => {
                setHuidModal(false);
                setHuidForm(EMPTY_HUID);
              }}
              disabled={savingHuid}
            >
              Cancel
            </BtnOutline>

            <BtnPrimary
              onClick={submitHuid}
              disabled={savingHuid}
            >
              {savingHuid
                ? "Saving..."
                : "Save HUID"}
            </BtnPrimary>
          </>
        }
      >
        <div
          style={{
            background: `${BRAND.blue}0d`,
            border: `1px solid ${BRAND.blue}25`,
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 16,
            fontSize: 11,
            color: t.textMuted,
            lineHeight: 1.6,
          }}
        >
          Enter the <strong style={{ color: t.text }}>
            actual HUID received for the hallmarked article
          </strong>
          . Ceritage does not generate or assign HUIDs.
        </div>

        <FormGrid>
          <FormGroup
            label="Product *"
            t={t}
          >
            <Select
              t={t}
              value={huidForm.product_id}
              onChange={handleProductChange}
            >
              <option value="">
                {productsLoading
                  ? "Loading products..."
                  : "-- Select Product --"}
              </option>

              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.sku} — {product.name}
                  {product.huid
                    ? " — HUID already mapped"
                    : ""}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup
            label="HUID *"
            t={t}
            half
          >
            <Input
              t={t}
              placeholder="Enter actual 6-character HUID"
              maxLength={6}
              value={huidForm.huid}
              onChange={(event) =>
                setHuidForm((previous) => ({
                  ...previous,
                  huid: event.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, ""),
                }))
              }
              style={{
                fontFamily: "monospace",
                letterSpacing: "2px",
                fontWeight: 800,
              }}
            />
          </FormGroup>

          <FormGroup
            label="Hallmark Date *"
            t={t}
            half
          >
            <Input
              t={t}
              type="date"
              value={huidForm.hallmark_date}
              onChange={(event) =>
                setHuidForm((previous) => ({
                  ...previous,
                  hallmark_date:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="Purity / Fineness"
            t={t}
            half
          >
            <Input
              t={t}
              placeholder="e.g. 916 / 22K"
              value={huidForm.purity_mark}
              onChange={(event) =>
                setHuidForm((previous) => ({
                  ...previous,
                  purity_mark:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="Hallmarking Centre"
            t={t}
            half
          >
            <Input
              t={t}
              placeholder={
                setup.centre_name ||
                "Actual A&H Centre name"
              }
              value={huidForm.bis_centre}
              onChange={(event) =>
                setHuidForm((previous) => ({
                  ...previous,
                  bis_centre:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="Assessor Name"
            t={t}
            half
          >
            <Input
              t={t}
              placeholder="Optional"
              value={huidForm.assessor_name}
              onChange={(event) =>
                setHuidForm((previous) => ({
                  ...previous,
                  assessor_name:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="Assessor / Reference ID"
            t={t}
            half
          >
            <Input
              t={t}
              placeholder="Optional"
              value={huidForm.assessor_id}
              onChange={(event) =>
                setHuidForm((previous) => ({
                  ...previous,
                  assessor_id:
                    event.target.value,
                }))
              }
            />
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* ====================================================================== */}
      {/* HALLMARKING SETUP MODAL                                                */}
      {/* ====================================================================== */}

      <Modal
        open={setupModal}
        onClose={() => setSetupModal(false)}
        title="Hallmarking Setup"
        t={t}
        wide
        footer={
          <>
            <BtnOutline
              t={t}
              onClick={() => setSetupModal(false)}
            >
              Cancel
            </BtnOutline>

            <BtnPrimary onClick={saveSetup}>
              Save Setup
            </BtnPrimary>
          </>
        }
      >
        <div
          style={{
            background: `${BRAND.purple}0d`,
            border: `1px solid ${BRAND.purple}25`,
            borderRadius: 8,
            padding: "11px 13px",
            marginBottom: 17,
            fontSize: 11,
            color: t.textMuted,
            lineHeight: 1.7,
          }}
        >
          Enter the jeweller's actual BIS registration and
          hallmarking-centre information here. Ceritage does
          <strong style={{ color: t.text }}>
            {" "}not issue a BIS registration or create a
            hallmarking licence.
          </strong>
        </div>

        <FormGrid>
          <FormGroup
            label="Business / Jeweller Name *"
            t={t}
          >
            <Input
              t={t}
              placeholder="e.g. ABC Jewellers"
              value={setup.business_name}
              onChange={(event) =>
                setSetup((previous) => ({
                  ...previous,
                  business_name:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="BIS Registration Number"
            t={t}
          >
            <Input
              t={t}
              placeholder="Enter actual BIS registration number"
              value={setup.bis_registration_no}
              onChange={(event) =>
                setSetup((previous) => ({
                  ...previous,
                  bis_registration_no:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="Registration Status"
            t={t}
            half
          >
            <Select
              t={t}
              value={setup.registration_status}
              onChange={(event) =>
                setSetup((previous) => ({
                  ...previous,
                  registration_status:
                    event.target.value,
                }))
              }
            >
              <option>
                Not Configured
              </option>
              <option>
                Pending
              </option>
              <option>
                Active
              </option>
              <option>
                Expired
              </option>
            </Select>
          </FormGroup>

          <FormGroup
            label="Registration Date"
            t={t}
            half
          >
            <Input
              t={t}
              type="date"
              value={setup.registration_date}
              onChange={(event) =>
                setSetup((previous) => ({
                  ...previous,
                  registration_date:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="Valid Until"
            t={t}
            half
          >
            <Input
              t={t}
              type="date"
              value={setup.valid_until}
              onChange={(event) =>
                setSetup((previous) => ({
                  ...previous,
                  valid_until:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <div
            style={{
              gridColumn: "1 / -1",
              borderTop: `1px solid ${t.borderDash}`,
              paddingTop: 14,
              marginTop: 4,
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: t.text,
                marginBottom: 12,
              }}
            >
              Preferred A&H / Hallmarking Centre
            </div>
          </div>

          <FormGroup
            label="Centre Name"
            t={t}
          >
            <Input
              t={t}
              placeholder="Actual A&H Centre name"
              value={setup.centre_name}
              onChange={(event) =>
                setSetup((previous) => ({
                  ...previous,
                  centre_name:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="Centre / Recognition Code"
            t={t}
          >
            <Input
              t={t}
              placeholder="Actual centre code"
              value={setup.centre_code}
              onChange={(event) =>
                setSetup((previous) => ({
                  ...previous,
                  centre_code:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="Centre Address"
            t={t}
          >
            <Input
              t={t}
              placeholder="Full address"
              value={setup.centre_address}
              onChange={(event) =>
                setSetup((previous) => ({
                  ...previous,
                  centre_address:
                    event.target.value,
                }))
              }
            />
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* ====================================================================== */}
      {/* NEW HALLMARKING REQUEST MODAL                                          */}
      {/* ====================================================================== */}

      <Modal
        open={requestModal}
        onClose={() => setRequestModal(false)}
        title="New Hallmarking Request"
        t={t}
        wide
        footer={
          <>
            <BtnOutline
              t={t}
              onClick={() => setRequestModal(false)}
            >
              Cancel
            </BtnOutline>

            <BtnPrimary onClick={saveRequest}>
              Create Request
            </BtnPrimary>
          </>
        }
      >
        <div
          style={{
            background: `${BRAND.blue}0d`,
            border: `1px solid ${BRAND.blue}25`,
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 16,
            fontSize: 11,
            color: t.textMuted,
            lineHeight: 1.6,
          }}
        >
          This creates an internal Ceritage batch tracker.
          It does not send the request directly to BIS or an
          A&H Centre.
        </div>

        <FormGrid>
          <FormGroup
            label="Request Number"
            t={t}
            half
          >
            <Input
              t={t}
              value={requestForm.request_no}
              readOnly
            />
          </FormGroup>

          <FormGroup
            label="Request Date"
            t={t}
            half
          >
            <Input
              t={t}
              type="date"
              value={requestForm.request_date}
              onChange={(event) =>
                setRequestForm((previous) => ({
                  ...previous,
                  request_date:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="A&H Centre *"
            t={t}
          >
            <Input
              t={t}
              placeholder="Actual hallmarking centre"
              value={requestForm.centre_name}
              onChange={(event) =>
                setRequestForm((previous) => ({
                  ...previous,
                  centre_name:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="Number of Items *"
            t={t}
            half
          >
            <Input
              t={t}
              type="number"
              min="1"
              value={requestForm.items}
              onChange={(event) =>
                setRequestForm((previous) => ({
                  ...previous,
                  items:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="Declared Purity"
            t={t}
            half
          >
            <Input
              t={t}
              placeholder="e.g. 916 / 22K"
              value={requestForm.declared_purity}
              onChange={(event) =>
                setRequestForm((previous) => ({
                  ...previous,
                  declared_purity:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="Declared Weight"
            t={t}
            half
          >
            <Input
              t={t}
              placeholder="e.g. 250.500 g"
              value={requestForm.declared_weight}
              onChange={(event) =>
                setRequestForm((previous) => ({
                  ...previous,
                  declared_weight:
                    event.target.value,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label="Status"
            t={t}
            half
          >
            <Select
              t={t}
              value={requestForm.status}
              onChange={(event) =>
                setRequestForm((previous) => ({
                  ...previous,
                  status:
                    event.target.value,
                }))
              }
            >
              <option>Draft</option>
              <option>Prepared</option>
              <option>Sent to A&H Centre</option>
            </Select>
          </FormGroup>

          <FormGroup
            label="Notes"
            t={t}
          >
            <textarea
              value={requestForm.notes}
              placeholder="Internal notes..."
              onChange={(event) =>
                setRequestForm((previous) => ({
                  ...previous,
                  notes: event.target.value,
                }))
              }
              style={{
                ...inputStyle,
                minHeight: 80,
                resize: "vertical",
              }}
            />
          </FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}