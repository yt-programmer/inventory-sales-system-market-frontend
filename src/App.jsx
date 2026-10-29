import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Bg, Splash, useReveal } from "./components/ui";
import Layout from "./Layout";
import { RequireAuth, RequireRole, useAuth } from "./auth";
import { Admin } from "./pages/Admin";
import { Analytics } from "./pages/Analytics";
import CashierPage from "./pages/CashierPage";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import ProductsPage from "./pages/ProductsPage";

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : <Login />;
}

export default function App() {
  const [ready, setReady] = useState(false);
  useReveal();
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Bg />
      <div className="app">
        {!ready ? (
          <Splash />
        ) : (
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Home />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="cashier" element={<CashierPage />} />
              <Route
                path="analytics"
                element={
                  <RequireRole roles={["admin"]}>
                    <Analytics />
                  </RequireRole>
                }
              />
              <Route path="admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </>
  );
}
