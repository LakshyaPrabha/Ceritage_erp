# Routes

Router file: `frontend/src/App.jsx`

## Active Routes

| URL | Component | Layout | Notes |
| --- | --- | --- | --- |
| `/` | `frontend/src/pages/Login.jsx` | standalone login screen | Default entry route. |
| `/login` | `frontend/src/pages/Login.jsx` | standalone login screen | Same as `/`. |
| `/dashboard` | `frontend/src/pages/Dashboard.jsx` | ERP shell | Requires `sessionStorage.ceritage_auth === "true"`. |
| `*` | redirect to `/` | n/a | Unknown routes return to login. |

## Dashboard Internal Modules

Dashboard modules are not URL routes. They are selected with React state inside `Dashboard.jsx`.

Main modules:
- `dashboard` -> `frontend/src/pages/modules/DashboardHome.jsx`
- `analytics` -> `frontend/src/pages/modules/Analytics.jsx`
- `customers` -> `frontend/src/pages/modules/Customers.jsx`
- `products` -> `frontend/src/pages/modules/Products.jsx`
- `billing` -> `frontend/src/pages/modules/Billing.jsx`
- `sales` -> `frontend/src/pages/modules/Sales.jsx`
- `purchase` -> `frontend/src/pages/modules/Purchase.jsx`
- `gold-exchange` -> `frontend/src/pages/modules/GoldExchange.jsx`
- `repair` -> `frontend/src/pages/modules/Repair.jsx`
- `orders` -> `frontend/src/pages/modules/Orders.jsx`
- `karigar` -> `frontend/src/pages/modules/Karigar.jsx`
- `jangad` -> `frontend/src/pages/modules/Jangad.jsx`
- `accounting` -> `frontend/src/pages/modules/Accounting.jsx`
- `payments` -> `frontend/src/pages/modules/Payments.jsx`
- `emi` -> `frontend/src/pages/modules/Emi.jsx`
- `gst` -> `frontend/src/pages/modules/Gst.jsx`
- `tunch` -> `frontend/src/pages/modules/Tunch.jsx`
- `compliance` -> `frontend/src/pages/modules/Compliance.jsx`
- `inventory` -> `frontend/src/pages/modules/Inventory.jsx`
- `hallmark` -> `frontend/src/pages/modules/Hallmark.jsx`
- `rates` -> `frontend/src/pages/modules/Rates.jsx`
- `rfid` -> `frontend/src/pages/modules/Rfid.jsx`
- `advance` -> `frontend/src/pages/modules/Advance.jsx`
- `employees` -> `frontend/src/pages/modules/Employees.jsx`
- `suppliers` -> `frontend/src/pages/modules/Suppliers.jsx`
- `branch` -> `frontend/src/pages/modules/Branch.jsx`
- `reports` -> `frontend/src/pages/modules/Reports.jsx`
- `users` -> `frontend/src/pages/modules/Users.jsx`
- `security` -> `frontend/src/pages/modules/Security.jsx`
- `ai` -> `frontend/src/pages/modules/Ai.jsx`
- `communication` -> `frontend/src/pages/modules/Communication.jsx`

## Unused Source Pages

These pages exist but are not connected to the active router:
- `frontend/src/pages/Home.jsx`
- `frontend/src/pages/Features.jsx`
- `frontend/src/pages/About.jsx`
- `frontend/src/pages/Contact.jsx`
- `frontend/src/pages/Register.jsx`
