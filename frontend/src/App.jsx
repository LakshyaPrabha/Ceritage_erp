import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login    from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

// ── Backend URL — relative /api works for both local dev and production ──────────
window.__CERITAGE_API__ = import.meta.env.VITE_API_BASE_URL || "/api";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("ceritage_token") || sessionStorage.getItem("ceritage_token");
  const auth = localStorage.getItem("ceritage_auth") || sessionStorage.getItem("ceritage_auth");
  return token || auth === "true" ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Login />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
