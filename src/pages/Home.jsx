import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Stat } from "../components/ui";
import { api } from "../lib/api";
import { Ic } from "../lib/icons";
import { MUTE, stc } from "../lib/utils";
import { useStore } from "../store";

const ACTIONS = [
  {
    to: "/cashier",
    icon: "cart",
    title: "New sale",
    desc: "Open the cashier and record a sale",
    roles: ["admin", "cashier"],
  },
  {
    to: "/products",
    icon: "box",
    title: "Products",
    desc: "Items, prices and quantities",
    roles: ["admin", "cashier"],
  },
  { to: "/analytics", icon: "chart", title: "Reports", desc: "Your sales and profits", roles: ["admin"] },
];

export function Home() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { items, addStock, loadError } = useStore();
  const isAdmin = user.role === "admin";
  const [today, setToday] = useState(null);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Today's numbers for admin only (the cashier doesn't see sales and profits)
  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    api("/analytics")
      .then((d) => alive && setToday(d.today))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isAdmin]);

  const need = items.filter((i) => stc(i) !== "ok").sort((a, b) => a.q - b.q);
  const hr = new Date().getHours();
  const greeting = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const actions = ACTIONS.filter((a) => a.roles.includes(user.role));

  const restock = async (i) => {
    setBusyId(i.id);
    setErr("");
    try {
      await addStock(i.id, 10);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="rv mb-5">
        <div className="fa text-3xl font-bold" style={{ color: "var(--acc)" }}>
          {greeting}
        </div>
        <div style={MUTE}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {loadError && (
        <p className="mb-4 text-sm font-semibold" style={{ color: "var(--bad)" }}>
          {loadError}
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        {actions.map((a, k) => (
          <button
            key={a.to}
            className="card p-5 text-right rv"
            style={{ "--i": k, color: "var(--ink)", cursor: "pointer" }}
            onClick={() => nav(a.to)}
          >
            <span className="ico mb-3" style={{ color: "var(--acc)", "--d": k * 0.4 + "s" }}>
              <Ic n={a.icon} s={30} />
            </span>
            <div className="fa text-xl font-bold">{a.title}</div>
            <div className="text-sm" style={MUTE}>
              {a.desc}
            </div>
          </button>
        ))}
      </div>

      {isAdmin && today && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <Stat k={0} l="Today's sales" v={today.sales} u="EGP" />
          <Stat k={1} l="Today's profit" v={today.profit} u="EGP" />
          <Stat k={2} l="Units sold" v={today.sold} u="units" />
        </div>
      )}

      <div className="card p-4 rv">
        <h2 className="fa text-xl font-bold mb-3" style={{ color: "var(--acc)" }}>
          Needs ordering
        </h2>
        {err && (
          <p className="mb-2 text-sm font-semibold" style={{ color: "var(--bad)" }}>
            {err}
          </p>
        )}
        {need.length ? (
          need.map((i) => (
            <div
              key={i.id}
              className="flex items-center justify-between gap-2 py-2"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <span>
                {i.n} <span className={"tag " + stc(i)}>{i.q <= 0 ? "Out of stock" : "Left: " + i.q}</span>
              </span>
              {isAdmin && (
                <button className="btn" disabled={busyId === i.id} onClick={() => restock(i)}>
                  +10 units
                </button>
              )}
            </div>
          ))
        ) : (
          <p style={MUTE}>Stock is fine, no items are running low.</p>
        )}
      </div>
    </div>
  );
}
