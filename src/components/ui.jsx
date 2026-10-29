import { useEffect, useRef, useState } from "react";
import { Ic } from "../lib/icons";
import { MUTE, money, run } from "../lib/utils";

export function Num({ v }) {
  const [x, setX] = useState(0);
  useEffect(() => {
    let f;
    const s = performance.now(),
      t = (n) => {
        const p = Math.min(1, (n - s) / 800);
        setX(v * p);
        if (p < 1) f = requestAnimationFrame(t);
      };
    f = requestAnimationFrame(t);
    return () => cancelAnimationFrame(f);
  }, [v]);
  return money(x);
}

export const Stat = ({ l, v, u, k }) => (
  <div className="card px-4 py-3 rv" style={{ "--i": k }}>
    <div className="text-2xl font-extrabold" style={{ color: "var(--acc)" }}>
      <Num v={v} /> <span className="text-sm">{u}</span>
    </div>
    <div className="text-sm" style={MUTE}>
      {l}
    </div>
  </div>
);

export const Milk = () => (
  <svg className="mk" width="92" height="140" viewBox="0 0 92 140">
    <path d="M14 38L46 12L78 38Z" fill="#ddd6fe" />
    <rect x="14" y="38" width="64" height="94" rx="4" fill="#f5f3ff" />
    <path d="M78 38L92 46V124L78 132Z" fill="#c4b5fd" />
    <rect x="14" y="66" width="64" height="40" fill="#7c3aed" />
    <text
      x="46"
      y="93"
      textAnchor="middle"
      fontSize="20"
      fontWeight="700"
      fill="#fff"
      fontFamily="Cairo,sans-serif"
    >
      Milk
    </text>
    <rect x="38" y="6" width="16" height="8" rx="2" fill="#a1a1c5" />
  </svg>
);

export const Juice = ({ k, a, b }) => (
  <svg className="jc" style={{ "--k": k }} width="58" height="92" viewBox="0 0 58 92">
    <rect x="30" y="2" width="3" height="24" fill="#ddd6fe" transform="rotate(12 31 14)" />
    <rect x="6" y="24" width="46" height="64" rx="6" fill={a} />
    <rect x="6" y="24" width="46" height="14" rx="6" fill={b} opacity=".55" />
    <circle cx="29" cy="62" r="13" fill={b} />
    <path d="M29 49q6-8 10-6q-1 7-10 6z" fill="#0d9488" />
  </svg>
);

export const Loader = ({ big }) => (
  <div className={"ld " + (big ? "big" : "sm")}>
    <div className="glow flex items-end justify-center gap-3">
      <Milk />
      <Juice k={0} a="#db2777" b="#f9a8d4" />
      <Juice k={1} a="#0891b2" b="#67e8f9" />
      <Juice k={2} a="#ca8a04" b="#fde68a" />
    </div>
    <div className="shelfl"></div>
    <div className="text-sm mt-3" style={MUTE}>
      Loading
    </div>
  </div>
);

export const Splash = () => (
  <div className="sp">
    <div className="text-center">
      <Loader big={true} />
      <div className="fa text-4xl font-bold mt-4 mb-1" style={{ color: "var(--acc)" }}>
        Mini Market
      </div>
      <div className="text-sm mb-4" style={MUTE}>
        Inventory & Sales Management System
      </div>
      <div className="w-48 mx-auto overflow-hidden" style={{ background: "var(--card2)", height: 3 }}>
        <div className="bar"></div>
      </div>
    </div>
  </div>
);

export const SH = (() => {
  let x = 7;
  const r = () => (x = (x * 16807) % 2147483647) / 2147483647,
    cols = [
      "#4c1d95",
      "#312e81",
      "#1e3a8a",
      "#6d28d9",
      "#581c87",
      "#3730a3",
      "#701a75",
      "#334155",
      "#86198f",
    ];
  let o = "";
  for (let s = 0; s < 5; s++) {
    const y = 40 + s * 150;
    let px = -10;
    while (px < 1210) {
      const w = 34 + r() * 40,
        hh = 70 + r() * 60,
        c = cols[Math.floor(r() * cols.length)],
        t = Math.floor(r() * 3),
        b = y + 130;
      if (t == 0) o += `<rect x="${px}" y="${b - hh}" width="${w}" height="${hh}" rx="4" fill="${c}"/>`;
      else if (t == 1)
        o += `<rect x="${px + w * 0.28}" y="${b - hh}" width="${w * 0.44}" height="${hh * 0.3}" rx="3" fill="${c}"/><rect x="${px}" y="${b - hh * 0.74}" width="${w}" height="${hh * 0.74}" rx="10" fill="${c}"/>`;
      else
        o += `<rect x="${px}" y="${b - hh * 0.6}" width="${w * 0.8}" height="${hh * 0.6}" rx="${w * 0.14}" fill="${c}"/>`;
      px += w + 4 + r() * 8;
    }
    o += `<rect x="0" y="${y + 130}" width="1200" height="10" fill="#2a2145"/>`;
  }
  return o;
})();

export function Bg() {
  const ref = useRef(null);
  useEffect(() => {
    let q;
    const f = () => {
      cancelAnimationFrame(q);
      q = requestAnimationFrame(() => {
        if (ref.current)
          ref.current.style.transform = "translateY(-" + Math.min(70, scrollY * 0.1) + "px) scale(1.2)";
      });
    };
    addEventListener("scroll", f, { passive: true });
    return () => removeEventListener("scroll", f);
  }, []);
  return (
    <div className="bgw">
      <svg
        ref={ref}
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        dangerouslySetInnerHTML={{
          __html:
            '<defs><filter id="bl"><feGaussianBlur stdDeviation="4"/></filter></defs><g filter="url(#bl)">' +
            SH +
            "</g>",
        }}
      />
      <div className="bgo"></div>
    </div>
  );
}

export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    const scan = () => document.querySelectorAll(".rv:not(.in)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  icon,
  rules = [],
  error,
  tick = 0,
  warn,
  suffix,
  d,
  onEnter,
  autoComplete,
}) {
  const [t, setT] = useState(false),
    [pw, setPw] = useState(false);
  const v = value ?? "",
    live = t || tick > 0,
    err = error || (live ? run(rules, v) : ""),
    good = !err && live && String(v).trim() !== "",
    isPw = type == "password";
  return (
    <div>
      <div
        className={
          "fld" +
          (icon ? " ic" : "") +
          (d ? " d" : "") +
          (err ? " bad" : good ? " good" : "") +
          (err && tick > 0 ? (tick % 2 ? " shkA" : " shkB") : "")
        }
      >
        <input
          type={isPw && pw ? "text" : type}
          autoComplete={autoComplete}
          placeholder=" "
          value={v}
          aria-invalid={!!err}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setT(true)}
          onKeyDown={(e) => e.key == "Enter" && onEnter && onEnter()}
        />
        <label>{label}</label>
        {icon ? (
          <span className="ic2">
            <Ic n={icon} s={18} />
          </span>
        ) : null}
        {isPw ? (
          <button
            type="button"
            className="tg"
            aria-label="Show or hide password"
            onClick={() => setPw(!pw)}
          >
            <Ic n={pw ? "eyeoff" : "eye"} s={18} />
          </button>
        ) : suffix ? (
          <span className="sf">{suffix}</span>
        ) : good ? (
          <span className="gd">
            <Ic n="check" s={16} />
          </span>
        ) : null}
      </div>
      {err ? <div className="fe">{err}</div> : warn ? <div className="fw">{warn}</div> : null}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const f = (e) => e.key == "Escape" && onClose();
    addEventListener("keydown", f);
    return () => removeEventListener("keydown", f);
  }, []);
  return (
    <div className="bd" onClick={onClose}>
      <div
        className="card md p-5 w-full max-w-md max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button className="btn" aria-label="Close" onClick={onClose}>
            <Ic n="x" s={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
