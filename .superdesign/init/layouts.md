# Layouts

## `frontend/src/App.jsx`

Root routing layout. It uses `BrowserRouter`, exposes `/` and `/login` to `Login`, exposes `/dashboard` behind `PrivateRoute`, and redirects every other route back to `/`.

Important behavior:
- `PrivateRoute` checks `sessionStorage.getItem("ceritage_auth") === "true"`.
- Public marketing pages exist in source but are not wired here.

```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function PrivateRoute({ children }) {
  const auth = sessionStorage.getItem("ceritage_auth");
  return auth === "true" ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## `frontend/src/pages/Dashboard.jsx`

Primary app shell. Fixed left sidebar, sticky topbar, and module content area. It owns:
- light/dark theme selection from system preference
- sidebar open state
- active module state
- logout behavior
- navigation sections and module mapping

Design notes:
- Sidebar width is `260px` when open.
- Main content shifts with `marginLeft: 260`.
- Topbar height is `60px`.
- Content padding is `22px`.
- Logo asset: `frontend/src/assets/ceritage-logo.svg`.

```jsx
// Full source lives at frontend/src/pages/Dashboard.jsx.
// Include this file for any dashboard/module design task.
```

## `frontend/src/components/Navbar.jsx`

Marketing top navigation. It is not currently rendered because public marketing pages are not routed.

```jsx
// Full source lives at frontend/src/components/Navbar.jsx.
```
