import { useState } from "react";
import Filters from "../components/Filters";
import { Ic } from "../lib/icons";
import { MUTE, money, stc } from "../lib/utils";
import { useStore } from "../store";

export default function CashierPage() {
  const { items, cart, setCart, checkout, loadError } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [inv, setInv] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const qty = (id) => cart[id] || 0;
  const chg = (i, dq) => {
    const n = Math.max(0, Math.min(i.q, qty(i.id) + dq));
    const o = { ...cart };
    if (n) o[i.id] = n;
    else delete o[i.id];
    setCart(o);
    setMsg("");
    setErr("");
  };
  const lines = items.filter((i) => qty(i.id) > 0);
  const total = lines.reduce((s, i) => s + qty(i.id) * i.p, 0);

  // Best sellers on top (the s counter comes from the server)
  const ranked = [...items].sort((a, b) => (b.s || 0) - (a.s || 0));
  const topIds = ranked
    .slice(0, 3)
    .filter((i) => i.s > 0)
    .map((i) => i.id);
  const list = ranked.filter(
    (i) => (cat === "All" || i.cat === cat) && (!q.trim() || i.n.includes(q.trim())),
  );

  const done = async () => {
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const r = await checkout();
      setMsg("Sale recorded: " + money(r.total) + " EGP");
    } catch (e) {
      // e.g. "Only 2 of X available" (409) — and the stock was updated from the server
      setErr(e.errors?.lines || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {loadError && (
        <p className="mb-4 text-sm font-semibold" style={{ color: "var(--bad)" }}>
          {loadError}
        </p>
      )}
      <Filters q={q} setQ={setQ} cat={cat} setCat={setCat} />
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 grid grid-cols-2 xl:grid-cols-3 gap-3 content-start">
          {list.length ? (
            list.map((i, k) => {
              const dis = i.q <= qty(i.id);
              return (
                <button
                  key={i.id}
                  className="card p-3 text-right rv"
                  disabled={dis}
                  style={{ "--i": k, opacity: dis ? 0.5 : 1, cursor: dis ? "not-allowed" : "pointer" }}
                  onClick={() => chg(i, 1)}
                >
                  {topIds.includes(i.id) && (
                    <div className="text-xs font-semibold mb-1" style={{ color: "var(--warn)" }}>
                      ★ Best seller
                    </div>
                  )}
                  <div className="font-semibold">{i.n}</div>
                  <div className="text-lg font-extrabold">{money(i.p)} EGP</div>
                  <span className={"tag " + stc(i)}>{i.q <= 0 ? "Out of stock" : "Available: " + i.q}</span>
                </button>
              );
            })
          ) : (
            <p className="col-span-full text-center py-10" style={MUTE}>
              No matching items.
            </p>
          )}
        </div>

        <div className="card p-4 inv md:sticky md:top-20 md:self-start">
          <button
            className="flex w-full justify-between items-center mb-2 md:cursor-default"
            onClick={() => setInv(!inv)}
          >
            <h3 className="font-bold fa text-xl">Invoice ({lines.length})</h3>
            <span className="md:hidden font-extrabold">{money(total)} EGP</span>
          </button>
          <div className={(inv ? "" : "hidden ") + "md:block max-h-[40vh] md:max-h-[50vh] overflow-auto"}>
            {lines.length ? (
              lines.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-2 py-1 text-sm rv">
                  <span>{i.n}</span>
                  <span className="whitespace-nowrap">
                    <button className="btn" aria-label="Decrease" onClick={() => chg(i, -1)}>
                      <Ic n="minus" s={14} />
                    </button>{" "}
                    <b className="inline-block w-6 text-center">{qty(i.id)}</b>{" "}
                    <button className="btn" aria-label="Increase" onClick={() => chg(i, 1)}>
                      <Ic n="plus" s={14} />
                    </button>
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm" style={MUTE}>
                Tap an item to add it to the invoice.
              </p>
            )}
          </div>
          <div
            className="flex justify-between font-extrabold text-lg pt-2 mt-2"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            <span>Total</span>
            <span key={total} className="bump">
              {money(total)} EGP
            </span>
          </div>
          <button className="btn on w-full mt-3" disabled={!lines.length || busy} onClick={done}>
            <Ic n="check" s={16} /> {busy ? "Recording..." : "Complete sale"}
          </button>
          {msg && (
            <p className="mt-2 text-sm font-semibold rv" style={{ color: "var(--ok)" }}>
              {msg}
            </p>
          )}
          {err && (
            <p className="mt-2 text-sm font-semibold" style={{ color: "var(--bad)" }}>
              {err}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
