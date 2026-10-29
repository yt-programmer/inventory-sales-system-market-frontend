import { useState } from "react";
import { splitError } from "../lib/api";
import { Ic } from "../lib/icons";
import { CATS, MUTE, R, focusBad, run } from "../lib/utils";
import { Field, Modal } from "./ui";

const EMPTY = { n: "", cat: CATS[0], q: "", c: "", p: "" };

// server errors per field + a general message (e.g. no connection)
function useServerErrors() {
  const [serr, setSerr] = useState({});
  const [formErr, setFormErr] = useState("");
  return {
    serr,
    formErr,
    fromError: (e) => {
      const { fields, message } = splitError(e);
      setSerr(fields);
      setFormErr(message);
    },
    clear: (k) => setSerr((s) => (s[k] ? { ...s, [k]: undefined } : s)),
    reset: () => {
      setSerr({});
      setFormErr("");
    },
  };
}

function FormError({ msg }) {
  return msg ? (
    <p className="mt-3 text-sm font-semibold" style={{ color: "var(--bad)" }}>
      {msg}
    </p>
  ) : null;
}

export function Fields({ f, set, sub, names = [], serr = {} }) {
  const nm = (v) => (names.includes(String(v).trim()) ? "This name already exists" : "");
  const lossy = +f.p > 0 && String(f.c) !== "" && +f.p < +f.c;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <Field
          label="Item name"
          icon="box"
          value={f.n}
          onChange={(v) => set("n", v)}
          tick={sub}
          error={serr.n}
          rules={[R.req("Enter the item name"), R.min(2, "Name must be at least 2 characters"), nm]}
        />
      </div>
      <label className="text-sm col-span-2" style={MUTE}>
        Category
        <select className="w-full mt-1" value={f.cat} onChange={(e) => set("cat", e.target.value)}>
          {CATS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <div>
        <Field
          label="Quantity"
          type="number"
          value={f.q}
          onChange={(v) => set("q", v)}
          tick={sub}
          error={serr.q}
          rules={[R.int(0, "Quantity must be a whole number, zero or more")]}
        />
      </div>
      <div>
        <Field
          label="Purchase price"
          type="number"
          suffix="EGP"
          value={f.c}
          onChange={(v) => set("c", v)}
          tick={sub}
          error={serr.c}
          rules={[R.num(0, "Purchase price must be a number, zero or more")]}
        />
      </div>
      <div className="col-span-2">
        <Field
          label="Selling price"
          type="number"
          suffix="EGP"
          value={f.p}
          onChange={(v) => set("p", v)}
          tick={sub}
          error={serr.p}
          warn={lossy ? "Warning: selling price is lower than purchase price, you will sell at a loss" : ""}
          rules={[R.num(0, "Selling price must be greater than zero", true)]}
        />
      </div>
    </div>
  );
}

export const prodErr = (f, names) =>
  run([R.req("x"), R.min(2, "x"), (v) => (names.includes(String(v).trim()) ? "x" : "")], f.n) ||
  run([R.int(0, "x")], f.q) ||
  run([R.num(0, "x")], f.c) ||
  run([R.num(0, "x", true)], f.p);

const payload = (f) => ({ n: f.n.trim(), cat: f.cat, q: +f.q, c: +f.c, p: +f.p });

export function EditModal({ item, names, onSave, onClose }) {
  const [f, setF] = useState(item);
  const [sub, setSub] = useState(0);
  const [busy, setBusy] = useState(false);
  const srv = useServerErrors();
  const set = (k, v) => {
    setF({ ...f, [k]: v });
    srv.clear(k);
  };

  const save = async () => {
    if (busy) return;
    if (prodErr(f, names)) {
      setSub(sub + 1);
      focusBad();
      return;
    }
    setBusy(true);
    try {
      await onSave({ id: item.id, ...payload(f) });
    } catch (e) {
      srv.fromError(e);
      setSub(sub + 1);
      focusBad();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Edit item" onClose={onClose}>
      <Fields f={f} set={set} sub={sub} names={names} serr={srv.serr} />
      <FormError msg={srv.formErr} />
      <div className="flex gap-2 mt-4">
        <button className="btn on flex-1" disabled={busy} onClick={save}>
          <Ic n="check" s={16} /> {busy ? "Saving..." : "Save"}
        </button>
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export function StockModal({
  item,
  onSave,
  onClose,
  title,
  initial = 10,
  submitLabel = "Add",
  busyLabel = "Adding...",
}) {
  const [n, setN] = useState(String(initial));
  const [sub, setSub] = useState(0);
  const [busy, setBusy] = useState(false);
  const srv = useServerErrors();

  const go = async () => {
    if (busy) return;
    if (run([R.int(1, "x")], n)) {
      setSub(sub + 1);
      focusBad();
      return;
    }
    setBusy(true);
    try {
      await onSave(+n);
    } catch (e) {
      srv.fromError(e);
      setSub(sub + 1);
      focusBad();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={title || "Add quantity: " + item.n} onClose={onClose}>
      <p className="mb-3 text-sm" style={MUTE}>
        Currently available: {item.q}
      </p>
      <Field
        label="Quantity"
        type="number"
        value={n}
        onChange={(v) => {
          setN(v);
          srv.clear("q");
        }}
        tick={sub}
        onEnter={go}
        error={srv.serr.q}
        rules={[R.int(1, "Quantity must be a whole number, one or more")]}
      />
      <FormError msg={srv.formErr} />
      <div className="flex gap-2 mt-4">
        <button className="btn on flex-1" disabled={busy} onClick={go}>
          <Ic n="plus" s={16} /> {busy ? busyLabel : submitLabel}
        </button>
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

// add-product bar (opens and closes)
export function Bar({ onNew, names }) {
  const [o, setO] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [sub, setSub] = useState(0);
  const [rk, setRk] = useState(0);
  const [busy, setBusy] = useState(false);
  const srv = useServerErrors();
  const set = (k, v) => {
    setF({ ...f, [k]: v });
    srv.clear(k);
  };

  const add = async () => {
    if (busy) return;
    if (prodErr(f, names)) {
      setSub(sub + 1);
      focusBad();
      return;
    }
    setBusy(true);
    try {
      await onNew(payload(f));
      setF(EMPTY);
      setSub(0);
      setRk(rk + 1);
      srv.reset();
      setO(false);
    } catch (e) {
      srv.fromError(e);
      setSub(sub + 1);
      focusBad();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card mb-4 overflow-hidden">
      <button
        className="flex w-full items-center justify-between p-4"
        style={{ color: "var(--ink)", cursor: "pointer" }}
        aria-expanded={o}
        onClick={() => setO(!o)}
      >
        <span className="fa text-xl font-bold flex items-center gap-2">
          <Ic n="plus" s={18} /> Add product
        </span>
        <span className="chev" style={{ transform: o ? "rotate(-90deg)" : "rotate(90deg)" }}>
          <Ic n="chev" s={18} />
        </span>
      </button>
      <div className={"coll " + (o ? "open" : "")}>
        <div>
          <div className="p-4 pt-0">
            <Fields key={rk} f={f} set={set} sub={sub} names={names} serr={srv.serr} />
            <FormError msg={srv.formErr} />
            <button className="btn on mt-3" disabled={busy} onClick={add}>
              <Ic n="plus" s={16} /> {busy ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
