export const settings = { low: 5 };

export const CATS = ["Dairy & Eggs", "Snacks", "Drinks", "Bakery", "Grocery"],
  MUTE = { color: "var(--mute)" };

export const money = (n) => (Math.round(n * 100) / 100).toLocaleString("en-US");

export const stc = (i) => (i.q <= 0 ? "out" : i.q <= settings.low ? "low" : "ok");

export const dk = (t) => {
  const x = new Date(t);
  return (
    x.getFullYear() +
    "-" +
    String(x.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(x.getDate()).padStart(2, "0")
  );
};

export const R = {
  req: (m) => (v) => (String(v ?? "").trim() ? "" : m),
  min: (n, m) => (v) => (String(v ?? "").trim().length >= n ? "" : m),
  int: (lo, m) => (v) => {
    const x = Number(v);
    return String(v ?? "").trim() !== "" && Number.isInteger(x) && x >= lo ? "" : m;
  },
  num: (lo, m, strict) => (v) => {
    const x = Number(v);
    return String(v ?? "").trim() !== "" && !isNaN(x) && (strict ? x > lo : x >= lo) ? "" : m;
  },
};

export const run = (rules, v) => {
  for (const r of rules) {
    const e = r(v);
    if (e) return e;
  }
  return "";
};

export const focusBad = () =>
  setTimeout(() => {
    const el = document.querySelector(".fld.bad input");
    el && el.focus();
  }, 40);
