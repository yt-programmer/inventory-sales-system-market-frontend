import { useEffect, useState } from "react";
import { Forecast } from "../components/Forecast";
import { Field, Stat } from "../components/ui";
import { api } from "../lib/api";
import { MUTE, R, dk, money, run } from "../lib/utils";

const fmtDay = (k) =>
  new Date(k + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

export function Analytics() {
  const [from, setFrom] = useState(() => dk(Date.now() - 6 * 864e5));
  const [to, setTo] = useState(() => dk(Date.now()));
  const [data, setData] = useState(null);
  const [serr, setSerr] = useState({});
  const [err, setErr] = useState("");
  const [hv, setHv] = useState(null);

  const fromRules = [R.req("Pick a start date"), (v) => (v > to ? "Start is after the end date" : "")];
  const toRules = [
    R.req("Pick an end date"),
    (v) => (v < from ? "End is before the start date" : ""),
    (v) =>
      v && from && Math.round((new Date(v) - new Date(from)) / 864e5) + 1 > 31 ? "Period is longer than 31 days" : "",
  ];
  const rangeBad = run(fromRules, from) || run(toRules, to);

  // Reports are calculated on the server (same validation: date errors come back under the field)
  useEffect(() => {
    if (rangeBad) return;
    let alive = true;
    api(`/analytics?from=${from}&to=${to}`)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setSerr({});
        setErr("");
      })
      .catch((e) => {
        if (!alive) return;
        setSerr(e.errors || {});
        setErr(Object.keys(e.errors || {}).length ? "" : e.message);
      });
    return () => {
      alive = false;
    };
  }, [from, to, rangeBad]);

  const T = (t) => <h2 className="text-lg font-extrabold mb-2 mt-5">{t}</h2>;
  const pd = data?.period.days || [];
  const top = data?.period.top || [];
  const mx = Math.max(1, ...pd.map((x) => x.s));
  const w = 550 / Math.max(1, pd.length);
  const bw = Math.min(24, w / 2.5);
  const has = pd.some((x) => x.s > 0);
  const hx = hv != null ? pd[hv] : null;

  return (
    <div>
      {err && (
        <p className="mb-3 text-sm font-semibold" style={{ color: "var(--bad)" }}>
          {err}
        </p>
      )}
      {!data && !err && <p style={MUTE}>Loading reports...</p>}

      {data && (
        <>
          {T("Today")}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat k={0} l="Today's sales" v={data.today.sales} u="EGP" />
            <Stat k={1} l="Today's profit" v={data.today.profit} u="EGP" />
            <Stat k={2} l="Sold today" v={data.today.sold} u="units" />
            <Stat k={3} l="Received today" v={data.today.received} u="units" />
          </div>
          {T("Total")}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat k={0} l="Total sales" v={data.total.sales} u="EGP" />
            <Stat k={1} l="Total profit" v={data.total.profit} u="EGP" />
            <Stat k={2} l="Current stock value" v={data.total.stockValue} u="EGP" />
            <Stat k={3} l="Total sold" v={data.total.sold} u="units" />
          </div>
        </>
      )}

      {T("What to buy next month?")}
      <Forecast />

      {T("Custom period")}
      <div className="card p-4 rv">
        <div className="flex flex-wrap gap-3 items-start mb-4">
          <div className="w-full min-[420px]:w-44">
            <Field
              d
              label="From"
              type="date"
              value={from}
              tick={1}
              error={serr.from}
              rules={fromRules}
              onChange={setFrom}
            />
          </div>
          <div className="w-full min-[420px]:w-44">
            <Field
              d
              label="To"
              type="date"
              value={to}
              tick={1}
              error={serr.to}
              rules={toRules}
              onChange={setTo}
            />
          </div>
        </div>

        {data && (
          <>
            <div className="grid grid-cols-1 min-[460px]:grid-cols-3 gap-3 mb-4">
              <Stat k={0} l="Period revenue (sales)" v={data.period.sales} u="EGP" />
              <Stat k={1} l="Period profit" v={data.period.profit} u="EGP" />
              <Stat k={2} l="Units sold" v={data.period.sold} u="units" />
            </div>
            {has ? (
              <div className="relative" onMouseLeave={() => setHv(null)}>
                <svg viewBox="0 0 600 240" className="w-full" role="img" aria-label="Period sales and profits">
                  {[0, 0.5, 1].map((f) => (
                    <line
                      key={f}
                      x1="40"
                      x2="590"
                      y1={200 - f * 170}
                      y2={200 - f * 170}
                      stroke="var(--line)"
                    />
                  ))}
                  <text x="36" y="204" textAnchor="end" fontSize="11" fill="var(--mute)">
                    0
                  </text>
                  <text x="36" y="34" textAnchor="end" fontSize="11" fill="var(--mute)">
                    {money(mx)}
                  </text>
                  {pd.map((x, k) => {
                    const cx = 40 + w * k + w / 2;
                    const hs = (x.s / mx) * 170;
                    const hp = (Math.max(0, x.p) / mx) * 170;
                    return (
                      <g key={x.k}>
                        <rect
                          className="gr"
                          style={{ animationDelay: k * 40 + "ms" }}
                          x={cx - bw}
                          y={200 - hs}
                          width={bw}
                          height={hs}
                          rx="3"
                          fill="var(--acc)"
                        />
                        <rect
                          className="gr"
                          style={{ animationDelay: k * 40 + "ms" }}
                          x={cx}
                          y={200 - hp}
                          width={bw}
                          height={hp}
                          rx="3"
                          fill="var(--ok)"
                        />
                        <text x={cx} y="218" textAnchor="middle" fontSize="11" fill="var(--mute)">
                          {x.k.slice(8)}
                        </text>
                        <rect
                          x={40 + w * k}
                          y="8"
                          width={w}
                          height="212"
                          fill={hv === k ? "rgba(167,139,250,.14)" : "transparent"}
                          style={{ cursor: "pointer" }}
                          onMouseEnter={() => setHv(k)}
                          onClick={() => setHv(k)}
                        />
                      </g>
                    );
                  })}
                </svg>
                {hx && (
                  <div
                    className="tip"
                    key={hv}
                    style={{ left: Math.min(86, Math.max(14, (40 + w * hv + w / 2) / 6)) + "%" }}
                  >
                    <div className="font-bold mb-1" style={{ color: "var(--acc)" }}>
                      {fmtDay(hx.k)}
                    </div>
                    {hx.s > 0 ? (
                      <>
                        <div>
                          Sales: <b>{money(hx.s)} EGP</b>
                        </div>
                        <div>
                          Profit: <b>{money(hx.p)} EGP</b>
                        </div>
                        <div>
                          Units: <b>{hx.q}</b>
                        </div>
                      </>
                    ) : (
                      <div style={MUTE}>No sales on this day</div>
                    )}
                  </div>
                )}
                <div className="flex gap-4 text-sm justify-center" style={MUTE}>
                  <span>
                    <b style={{ color: "var(--acc)" }}>■</b> Sales
                  </span>
                  <span>
                    <b style={{ color: "var(--ok)" }}>■</b> Profit
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-center py-8" style={MUTE}>
                No sales in this period.
              </p>
            )}
          </>
        )}
      </div>

      {top.length > 0 && (
        <div className="card p-4 mt-4 rv">
          <h3 className="font-extrabold mb-3">Best sellers in the period</h3>
          {top.map((x, k) => (
            <div key={x.n} className="rv mb-2" style={{ "--i": k }}>
              <div className="flex justify-between text-sm">
                <span>{x.n}</span>
                <b>{x.q}</b>
              </div>
              <div className="h-2 rounded-full" style={{ background: "var(--card2)" }}>
                <div className="bar2" style={{ width: (x.q / top[0].q) * 100 + "%" }}></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
