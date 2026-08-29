import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login    from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

// ── Backend URL — ek jagah define, sab jagah kaam ──────────
// WSL mein chal raha hai toh WSL IP use karo
// IP check karo: WSL terminal mein `hostname -I` run karo
window.__CERITAGE_API__ = "http://172.23.97.221:5000/api";

function PrivateRoute({ children }) {
  const auth = sessionStorage.getItem("ceritage_auth");
  return auth === "true" ? children : <Navigate to="/" replace />;
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
