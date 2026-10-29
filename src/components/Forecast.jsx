import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Ic } from "../lib/icons";
import { MUTE, money } from "../lib/utils";
import { useStore } from "../store";
import { StockModal } from "./forms";
import { Stat } from "./ui";

const DAYS = [
  [14, "Last 2 weeks"],
  [30, "Last month"],
  [60, "Last 2 months"],
  [90, "Last 3 months"],
];
const BUFFERS = [
  [0, "None"],
  [10, "10%"],
  [20, "20%"],
  [30, "30%"],
  [50, "50%"],
];
const PRIORITY = {
  urgent: ["Urgent", "out"],
  soon: ["Soon", "low"],
  later: ["Some time left", "ok"],
  ok: ["Stock is enough", "ok"],
};

// What to buy next month? Best sellers first + suggested quantity (calculated on the server).
// The "Done" button adds the purchased quantity to stock, so the suggestion disappears on its own.
export function Forecast() {
  const { addStock } = useStore();
  const [days, setDays] = useState(30);
  const [buffer, setBuffer] = useState(20);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [all, setAll] = useState(false);
  const [showEnough, setShowEnough] = useState(false);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(null); // the item whose purchase we are confirming

  useEffect(() => {
    let alive = true;
    setErr("");
    api(`/analytics/forecast?days=${days}&buffer=${buffer}`)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [days, buffer, reload]);

  const buy = data ? data.items.filter((i) => i.suggest > 0) : [];
  const enough = data ? data.items.filter((i) => i.suggest === 0) : [];
  const rows = all ? buy : buy.slice(0, 10);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buy.map((i) => `${i.n}: ${i.suggest}`).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("Couldn't copy the list, please copy it manually from the table");
    }
  };

  const confirm = async (q) => {
    await addStock(done.id, q);
    setMsg(`Added ${q} units of ${done.n} to stock.`);
    setDone(null);
    setReload((r) => r + 1);
  };

  const DoneBtn = ({ i, full }) => (
    <button className={"btn on " + (full ? "w-full" : "")} onClick={() => setDone(i)}>
      <Ic n="check" s={16} /> Done
    </button>
  );

  return (
    <div className="card p-4 rv">
      <div className="flex flex-wrap gap-3 items-end justify-between mb-4">
        <div className="flex flex-wrap gap-3">
          <label className="text-sm" style={MUTE}>
            Based on sales of
            <select className="block mt-1" value={days} onChange={(e) => setDays(+e.target.value)}>
              {DAYS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm" style={MUTE}>
            Safety stock
            <select className="block mt-1" value={buffer} onChange={(e) => setBuffer(+e.target.value)}>
              {BUFFERS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        {buy.length > 0 && (
          <button className="btn" onClick={copy}>
            <Ic n={copied ? "check" : "edit"} s={16} /> {copied ? "Copied" : "Copy order list"}
          </button>
        )}
      </div>

      {err && (
        <p className="mb-3 text-sm font-semibold" style={{ color: "var(--bad)" }}>
          {err}
        </p>
      )}
      {msg && (
        <p className="mb-3 text-sm font-semibold" style={{ color: "var(--ok)" }}>
          {msg}
        </p>
      )}
      {!data && !err && <p style={MUTE}>Calculating recommendation...</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 min-[460px]:grid-cols-3 gap-3 mb-4">
            <Stat k={0} l="Items to buy" v={data.totals.items} u="items" />
            <Stat k={1} l="Total units" v={data.totals.units} u="units" />
            <Stat k={2} l="Estimated cost" v={data.totals.cost} u="EGP" />
          </div>

          {data.items.length === 0 && (
            <p className="text-center py-6" style={MUTE}>
              Not enough sales in this period to suggest purchases.
            </p>
          )}
          {data.items.length > 0 && buy.length === 0 && (
            <p className="text-center py-6" style={MUTE}>
              Nothing needs buying right now, all items that sell have enough stock.
            </p>
          )}

          {buy.length > 0 && (
            <>
              {/* large screens: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>Sold</th>
                      <th>Per day</th>
                      <th>Stock</th>
                      <th>Lasts</th>
                      <th>Suggested qty</th>
                      <th>Cost</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((i, k) => {
                      const [label, cls] = PRIORITY[i.priority];
                      return (
                        <tr key={i.id}>
                          <td style={MUTE}>{k + 1}</td>
                          <td>
                            <div className="font-semibold">{i.n}</div>
                            <div className="text-xs" style={MUTE}>
                              {i.cat}
                              {i.confidence === "low" && " · limited data"}
                            </div>
                          </td>
                          <td>{i.sold}</td>
                          <td>{i.rate}</td>
                          <td>{i.stock}</td>
                          <td>{i.daysLeft} days</td>
                          <td className="font-extrabold text-base" style={{ color: "var(--acc)" }}>
                            {i.suggest}
                          </td>
                          <td>{money(i.cost)} EGP</td>
                          <td>
                            <span className={"tag " + cls}>{label}</span>
                          </td>
                          <td>
                            <DoneBtn i={i} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* mobile: cards */}
              <div className="md:hidden space-y-3">
                {rows.map((i, k) => {
                  const [label, cls] = PRIORITY[i.priority];
                  return (
                    <div
                      key={i.id}
                      className="rounded-lg p-3"
                      style={{ background: "var(--card2)", border: "1px solid var(--line)" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold">
                            <span style={MUTE}>{k + 1}. </span>
                            {i.n}
                          </div>
                          <div className="text-xs" style={MUTE}>
                            {i.cat}
                            {i.confidence === "low" && " · limited data"}
                          </div>
                        </div>
                        <span className={"tag shrink-0 " + cls}>{label}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm mt-3" style={MUTE}>
                        <div>
                          Sold: <b style={{ color: "var(--ink)" }}>{i.sold}</b>
                        </div>
                        <div>
                          Per day: <b style={{ color: "var(--ink)" }}>{i.rate}</b>
                        </div>
                        <div>
                          Stock: <b style={{ color: "var(--ink)" }}>{i.stock}</b>
                        </div>
                        <div>
                          Lasts: <b style={{ color: "var(--ink)" }}>{i.daysLeft} days</b>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 mb-3">
                        <span style={MUTE}>Buy</span>
                        <span className="text-xl font-extrabold" style={{ color: "var(--acc)" }}>
                          {i.suggest}{" "}
                          <span className="text-sm font-semibold" style={MUTE}>
                            ≈ {money(i.cost)} EGP
                          </span>
                        </span>
                      </div>
                      <DoneBtn i={i} full />
                    </div>
                  );
                })}
              </div>

              {buy.length > 10 && (
                <button className="btn mt-3" onClick={() => setAll(!all)}>
                  {all ? "Show less" : `Show all (${buy.length})`}
                </button>
              )}
            </>
          )}

          {enough.length > 0 && (
            <div className="mt-4">
              <button className="btn" onClick={() => setShowEnough(!showEnough)}>
                {showEnough ? "Hide" : "Show"} items with enough stock ({enough.length})
              </button>
              {showEnough && (
                <div className="mt-3 space-y-1 text-sm">
                  {enough.map((i) => (
                    <div key={i.id} className="flex justify-between gap-2">
                      <span>{i.n}</span>
                      <span style={MUTE}>
                        Stock {i.stock} · Lasts {i.daysLeft} days
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {data.items.length > 0 && (
            <p className="text-xs mt-4" style={MUTE}>
              How it's calculated: average daily sales × {data.params.horizon} days + safety stock {data.params.buffer}%, minus
              what's in stock now. Items are sorted by best sellers, and items that didn't sell in the period aren't suggested. When you press
              "Done", the quantity is added to stock and the suggestion updates.
            </p>
          )}
        </>
      )}

      {done && (
        <StockModal
          item={{ n: done.n, q: done.stock }}
          title={"Purchased: " + done.n}
          initial={done.suggest}
          submitLabel="Confirm and add to stock"
          busyLabel="Adding..."
          onSave={confirm}
          onClose={() => setDone(null)}
        />
      )}
    </div>
  );
}
