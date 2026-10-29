import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth";
import { api } from "./lib/api";
import { settings } from "./lib/utils";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

const DEFAULT_CFG = { name: "Mini Market", low: 5 };

// All operations here talk to the API and throw ApiError if the server rejects (forms show errors under each field)
export function StoreProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [cart, setCart] = useState({});
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  settings.low = cfg.low;

  const refresh = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([api("/products"), api("/settings")]);
      setItems(p);
      setCfg(s);
      setLoadError("");
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
    else {
      setItems([]);
      setCart({});
      setCfg(DEFAULT_CFG);
      setReady(false);
    }
  }, [user, refresh]);

  const replace = (p) => setItems((a) => a.map((x) => (x.id === p.id ? p : x)));

  const create = async (o) => {
    const p = await api("/products", { method: "POST", body: o });
    setItems((a) => [...a, p]);
    return p;
  };
  const update = async (o) => {
    const p = await api(`/products/${o.id}`, { method: "PUT", body: o });
    replace(p);
    return p;
  };
  const remove = async (id) => {
    await api(`/products/${id}`, { method: "DELETE" });
    setItems((a) => a.filter((x) => x.id !== id));
  };
  const addStock = async (id, q) => {
    const r = await api(`/products/${id}/stock`, { method: "POST", body: { q } });
    replace(r.product);
    return r;
  };
  const saveSettings = async (o) => {
    const s = await api("/settings", { method: "PUT", body: o });
    setCfg(s);
    return s;
  };
  // Sells the invoice and returns { total, profit?, items }
  const checkout = async () => {
    const lines = items.filter((i) => cart[i.id] > 0).map((i) => ({ id: i.id, q: cart[i.id] }));
    try {
      const r = await api("/sales", { method: "POST", body: { lines } });
      setCart({});
      return r;
    } finally {
      await refresh(); // refresh stock in both cases (success or insufficient quantity)
    }
  };

  return (
    <Ctx.Provider
      value={{
        items,
        cfg,
        cart,
        setCart,
        ready,
        loadError,
        refresh,
        create,
        update,
        remove,
        addStock,
        saveSettings,
        checkout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
