# Pages

## `/` and `/login`

Entry: `frontend/src/pages/Login.jsx`

Dependencies:
- `frontend/src/pages/Login.jsx`
- `frontend/src/assets/ceritage-logo.svg`
- `frontend/src/index.css`

Renders:
- Standalone centered admin login card.
- Uses hardcoded credentials `admin` / `ceritage123`.
- On success stores `ceritage_auth=true` and `ceritage_user=<username>` in session storage, then redirects to `/dashboard`.

## `/dashboard`

Entry: `frontend/src/pages/Dashboard.jsx`

Dependencies:
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/assets/ceritage-logo.svg`
- `frontend/src/theme.js`
- `frontend/src/components/ui.jsx`
- `frontend/src/pages/modules/DashboardHome.jsx`
- `frontend/src/pages/modules/Customers.jsx`
- `frontend/src/pages/modules/Products.jsx`
- `frontend/src/pages/modules/Billing.jsx`
- `frontend/src/pages/modules/Sales.jsx`
- `frontend/src/pages/modules/Purchase.jsx`
- `frontend/src/pages/modules/GoldExchange.jsx`
- `frontend/src/pages/modules/Repair.jsx`
- `frontend/src/pages/modules/Orders.jsx`
- `frontend/src/pages/modules/Karigar.jsx`
- `frontend/src/pages/modules/Inventory.jsx`
- `frontend/src/pages/modules/Accounting.jsx`
- `frontend/src/pages/modules/Reports.jsx`
- `frontend/src/pages/modules/Rates.jsx`
- `frontend/src/pages/modules/Emi.jsx`
- `frontend/src/pages/modules/Gst.jsx`
- `frontend/src/pages/modules/Hallmark.jsx`
- `frontend/src/pages/modules/Employees.jsx`
- `frontend/src/pages/modules/Suppliers.jsx`
- `frontend/src/pages/modules/Analytics.jsx`
- `frontend/src/pages/modules/Payments.jsx`
- `frontend/src/pages/modules/Users.jsx`
- `frontend/src/pages/modules/Security.jsx`
- `frontend/src/pages/modules/Communication.jsx`
- `frontend/src/pages/modules/Branch.jsx`
- `frontend/src/pages/modules/Jangad.jsx`
- `frontend/src/pages/modules/Tunch.jsx`
- `frontend/src/pages/modules/Rfid.jsx`
- `frontend/src/pages/modules/Advance.jsx`
- `frontend/src/pages/modules/Compliance.jsx`
- `frontend/src/pages/modules/Ai.jsx`
- `frontend/src/index.css`

Renders:
- Fixed sidebar navigation with all ERP module groups.
- Sticky topbar with current module title, breadcrumb, live rates placeholder, and user avatar.
- Content area renders the active module by state, not URL.

## Dashboard Home Module

Entry: `frontend/src/pages/modules/DashboardHome.jsx`

Dependencies:
- `frontend/src/pages/modules/DashboardHome.jsx`
- `frontend/src/theme.js`
- `frontend/src/components/ui.jsx`

Renders:
- KPI cards with placeholder values.
- Quick action buttons that switch active dashboard module.
- Alerts placeholder.
- Recent bills placeholder table.

## Customers Module

Entry: `frontend/src/pages/modules/Customers.jsx`

Dependencies:
- `frontend/src/pages/modules/Customers.jsx`
- `frontend/src/theme.js`
- `frontend/src/components/ui.jsx`

Renders:
- KPI placeholders.
- Tabs for customer list, ledger, wallet, membership, credit, EMI, dues, history, returns, KYC, reminders, communication.
- Add Customer modal with form fields.
- No backend data loading in current frontend code.

## Products Module

Entry: `frontend/src/pages/modules/Products.jsx`

Dependencies:
- `frontend/src/pages/modules/Products.jsx`
- `frontend/src/theme.js`
- `frontend/src/components/ui.jsx`

Renders:
- KPI placeholders.
- Category filters.
- Tabs for grid/list/categories/stones/barcode.
- Add Product modal.
- No backend data loading in current frontend code.

## Billing Module

Entry: `frontend/src/pages/modules/Billing.jsx`

Dependencies:
- `frontend/src/pages/modules/Billing.jsx`
- `frontend/src/theme.js`
- `frontend/src/components/ui.jsx`

Renders:
- Invoice type selector.
- Invoice details form.
- Items placeholder table.
- Discount/coupon/gift voucher fields.
- Payment mode-specific fields.
- Static live invoice preview.
- No backend data loading in current frontend code.

## Public Marketing Home

Entry: `frontend/src/pages/Home.jsx`

Dependencies:
- `frontend/src/pages/Home.jsx`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/Hero.jsx`
- `frontend/src/components/Solutions.jsx`
- `frontend/src/components/WhyCeritage.jsx`
- `frontend/src/components/CTA.jsx`
- `frontend/src/components/Footer.jsx`

Renders:
- Landing page source exists but is not routed in `App.jsx`.
