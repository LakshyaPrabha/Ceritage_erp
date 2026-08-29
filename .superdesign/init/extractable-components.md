# Extractable Components

## DashboardShell
- Source: `frontend/src/pages/Dashboard.jsx`
- Category: layout
- Description: Fixed ERP sidebar, sticky topbar, content area, module switcher, user/logout block.
- Extractable props: `activeModule` string, `sidebarOpen` boolean, `username` string.
- Hardcoded: Navigation section labels, module labels, logo asset, inline CSS, theme structure.

## DashboardSidebar
- Source: `frontend/src/pages/Dashboard.jsx`
- Category: layout
- Description: Left navigation grouped by Main, Operations, Workshop, Finance, Catalog & Stock, Management, System.
- Extractable props: `activeModule` string, `sidebarOpen` boolean.
- Hardcoded: Module labels, section names, logo asset.

## DashboardTopbar
- Source: `frontend/src/pages/Dashboard.jsx`
- Category: layout
- Description: Sticky page header with sidebar toggle, module title, breadcrumb, rates placeholder, user avatar.
- Extractable props: `title` string, `breadcrumb` string, `username` string.
- Hardcoded: Live rates placeholder, visual styles.

## LoginCard
- Source: `frontend/src/pages/Login.jsx`
- Category: basic
- Description: Standalone admin login form with logo, username/password fields, error state, loading state, and default credential hint.
- Extractable props: `loading` boolean, `error` string.
- Hardcoded: Logo asset, default credential hint, gradient styling.

## ERP Primitives
- Source: `frontend/src/components/ui.jsx`
- Category: basic
- Description: Shared inline-style primitives for dashboard forms, cards, tabs, tables, buttons, modals, and section headers.
- Extractable props: See individual component definitions in `components.md`.
- Hardcoded: Brand gradient and inline CSS patterns.

## MarketingNavbar
- Source: `frontend/src/components/Navbar.jsx`
- Category: layout
- Description: Public marketing navbar with logo area, nav links, sign-in/register actions, and mobile menu.
- Extractable props: `activeItem` string, `menuOpen` boolean.
- Hardcoded: Links to `/`, `/features`, `/about`, `/contact`, `/login`, `/register`; gem mark; tan/gold color palette.

## MarketingFooter
- Source: `frontend/src/components/Footer.jsx`
- Category: layout
- Description: Public marketing footer used by the unrouted marketing home.
- Extractable props: none obvious.
- Hardcoded: Marketing footer copy and links.
