import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { Field, Modal } from "../components/ui";
import { api, splitError } from "../lib/api";
import { Ic } from "../lib/icons";
import { MUTE, R, focusBad, run, stc } from "../lib/utils";
import { useStore } from "../store";

const Card = ({ title, icon, children }) => (
  <div className="card p-4 rv">
    <h2 className="font-extrabold mb-3 flex items-center gap-2" style={{ color: "var(--acc)" }}>
      <Ic n={icon} s={18} /> {title}
    </h2>
    {children}
  </div>
);

const Msg = ({ ok, text }) =>
  text ? (
    <p className="text-sm font-semibold" style={{ color: ok ? "var(--ok)" : "var(--bad)" }}>
      {text}
    </p>
  ) : null;

function PasswordCard() {
  const empty = { a: "", b: "", c: "" };
  const [pf, setPf] = useState(empty);
  const [tk, setTk] = useState(0);
  const [rk, setRk] = useState(0);
  const [se, setSe] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const sp = (k, srvKey, v) => {
    setPf({ ...pf, [k]: v });
    setMsg(null);
    setSe((s) => ({ ...s, [srvKey]: undefined }));
  };
  const ra = [R.req("Enter your current password")];
  const rb = [
    R.min(4, "New password must be at least 4 characters"),
    (v) => (v && v === pf.a ? "New password must differ from the current one" : ""),
  ];
  const rc = [R.req("Confirm the new password"), (v) => (v !== pf.b ? "Confirmation doesn't match the new password" : "")];

  const save = async () => {
    if (busy) return;
    if (run(ra, pf.a) || run(rb, pf.b) || run(rc, pf.c)) {
      setTk(tk + 1);
      focusBad();
      return;
    }
    setBusy(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: { current: pf.a, password: pf.b, confirm: pf.c },
      });
      setPf(empty);
      setTk(0);
      setRk(rk + 1);
      setSe({});
      setMsg({ ok: true, text: "Password changed." });
    } catch (e) {
      const { fields, message } = splitError(e);
      setSe(fields);
      setMsg(message ? { ok: false, text: message } : null);
      setTk(tk + 1);
      focusBad();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Change password" icon="lock">
      <div key={rk} className="space-y-3">
        <Field
          label="Current password"
          type="password"
          icon="lock"
          value={pf.a}
          tick={tk}
          error={se.current}
          rules={ra}
          onChange={(v) => sp("a", "current", v)}
        />
        <Field
          label="New password"
          type="password"
          icon="lock"
          value={pf.b}
          tick={tk}
          error={se.password}
          rules={rb}
          onChange={(v) => sp("b", "password", v)}
        />
        <Field
          label="Confirm new password"
          type="password"
          icon="lock"
          value={pf.c}
          tick={tk}
          error={se.confirm}
          rules={rc}
          onChange={(v) => sp("c", "confirm", v)}
          onEnter={save}
        />
        <Msg ok={msg?.ok} text={msg?.text} />
        <button className="btn on" disabled={busy} onClick={save}>
          <Ic n="check" s={16} /> {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </Card>
  );
}

function SettingsCard() {
  const { cfg, saveSettings } = useStore();
  const [sd, setSd] = useState({ name: cfg.name, low: String(cfg.low) });
  const [tk, setTk] = useState(0);
  const [se, setSe] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setSd({ name: cfg.name, low: String(cfg.low) }), [cfg]);

  const rn = [R.req("Enter the shop name"), R.min(2, "Name must be at least 2 characters")];
  const rl = [R.int(0, "Alert threshold must be a whole number, zero or more")];
  const set = (k, v) => {
    setSd({ ...sd, [k]: v });
    setMsg(null);
    setSe((s) => ({ ...s, [k]: undefined }));
  };

  const save = async () => {
    if (busy) return;
    if (run(rn, sd.name) || run(rl, sd.low)) {
      setTk(tk + 1);
      focusBad();
      return;
    }
    setBusy(true);
    try {
      await saveSettings({ name: sd.name.trim(), low: +sd.low });
      setSe({});
      setMsg({ ok: true, text: "Settings saved." });
    } catch (e) {
      const { fields, message } = splitError(e);
      setSe(fields);
      setMsg(message ? { ok: false, text: message } : null);
      setTk(tk + 1);
      focusBad();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Shop settings" icon="gear">
      <div className="space-y-3">
        <Field
          label="Shop name"
          icon="store"
          value={sd.name}
          tick={tk}
          error={se.name}
          rules={rn}
          onChange={(v) => set("name", v)}
        />
        <Field
          label="Alert threshold (minimum quantity before alert)"
          type="number"
          value={sd.low}
          tick={tk}
          error={se.low}
          rules={rl}
          onChange={(v) => set("low", v)}
          onEnter={save}
        />
        <Msg ok={msg?.ok} text={msg?.text} />
        <button className="btn on" disabled={busy} onClick={save}>
          <Ic n="check" s={16} /> {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </Card>
  );
}

function MovementsCard() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api("/movements?limit=8")
      .then(setRows)
      .catch((e) => setErr(e.message));
  }, []);
  return (
    <Card title="Recent activity" icon="chart">
      {err && <Msg text={err} />}
      {!rows && !err && (
        <p className="text-sm" style={MUTE}>
          Loading...
        </p>
      )}
      <div className="space-y-1">
        {rows?.map((l) => (
          <div key={l.id} className="flex justify-between gap-2 text-sm">
            <span>{l.n}</span>
            <span className={"tag " + (l.type === "in" ? "ok" : "low")}>
              {l.type === "in" ? "In" : "Out"} {l.q}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function UsersCard() {
  const { user: me } = useAuth();
  const empty = { username: "", password: "", role: "cashier" };
  const [users, setUsers] = useState([]);
  const [f, setF] = useState(empty);
  const [tk, setTk] = useState(0);
  const [rk, setRk] = useState(0);
  const [se, setSe] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState(null);
  const [rowErr, setRowErr] = useState("");
  const [del, setDel] = useState(null);

  useEffect(() => {
    api("/users")
      .then(setUsers)
      .catch(() => {});
  }, []);

  const ru = [
    R.req("Enter the username"),
    (v) => (/^[A-Za-z0-9_.-]{3,30}$/.test(v) ? "" : "Username must be 3 to 30 English letters, numbers, or _ . -"),
  ];
  const rp = [R.min(4, "Password must be at least 4 characters")];
  const set = (k, v) => {
    setF({ ...f, [k]: v });
    setMsg(null);
    setSe((s) => ({ ...s, [k]: undefined }));
  };

  const add = async () => {
    if (busy) return;
    if (run(ru, f.username) || run(rp, f.password)) {
      setTk(tk + 1);
      focusBad();
      return;
    }
    setBusy(true);
    try {
      const u = await api("/users", { method: "POST", body: { ...f, username: f.username.trim() } });
      setUsers((a) => [...a, u]);
      setF(empty);
      setTk(0);
      setRk(rk + 1);
      setSe({});
      setMsg({ ok: true, text: "User added." });
    } catch (e) {
      const { fields, message } = splitError(e);
      setSe(fields);
      setMsg(message ? { ok: false, text: message } : null);
      setTk(tk + 1);
      focusBad();
    } finally {
      setBusy(false);
    }
  };

  // Change role (the user's open sessions are invalidated by the server)
  const changeRole = async (u, role) => {
    setRowBusy(u.id);
    setRowErr("");
    try {
      const r = await api(`/users/${u.id}`, { method: "PUT", body: { role } });
      setUsers((a) => a.map((x) => (x.id === u.id ? r : x)));
    } catch (e) {
      setRowErr(e.errors?.role || e.message);
    } finally {
      setRowBusy(null);
    }
  };

  const remove = async () => {
    const u = del;
    setRowBusy(u.id);
    setRowErr("");
    try {
      await api(`/users/${u.id}`, { method: "DELETE" });
      setUsers((a) => a.filter((x) => x.id !== u.id));
    } catch (e) {
      setRowErr(e.message);
    } finally {
      setRowBusy(null);
      setDel(null);
    }
  };

  return (
    <Card title="Users" icon="lock">
      <div className="space-y-2 mb-4">
        {users.map((u) => {
          const self = u.id === me.id;
          return (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-2 py-1"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <span className="text-sm">
                {u.username} {self && <span className="tag low">You</span>}
              </span>
              <span className="flex items-center gap-2">
                <select
                  aria-label={"Role of " + u.username}
                  className="!py-1"
                  value={u.role}
                  disabled={self || rowBusy === u.id}
                  onChange={(e) => changeRole(u, e.target.value)}
                >
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  className="btn dng !p-1.5"
                  aria-label={"Delete " + u.username}
                  disabled={self || rowBusy === u.id}
                  onClick={() => setDel(u)}
                >
                  <Ic n="trash" s={16} />
                </button>
              </span>
            </div>
          );
        })}
        <Msg text={rowErr} />
      </div>

      <div key={rk} className="space-y-3">
        <Field
          label="New username"
          icon="box"
          value={f.username}
          tick={tk}
          error={se.username}
          rules={ru}
          onChange={(v) => set("username", v)}
        />
        <Field
          label="Password"
          type="password"
          icon="lock"
          value={f.password}
          tick={tk}
          error={se.password}
          rules={rp}
          onChange={(v) => set("password", v)}
          onEnter={add}
        />
        <label className="text-sm block" style={MUTE}>
          Role
          <select className="w-full mt-1" value={f.role} onChange={(e) => set("role", e.target.value)}>
            <option value="cashier">Cashier (sells only)</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <Msg ok={msg?.ok} text={msg?.text} />
        <button className="btn on" disabled={busy} onClick={add}>
          <Ic n="plus" s={16} /> {busy ? "Adding..." : "Add user"}
        </button>
      </div>

      {del && (
        <Modal title="Confirm deletion" onClose={() => setDel(null)}>
          <p className="mb-4">
            Delete user <b>{del.username}</b>? Their open sessions will be closed immediately.
          </p>
          <div className="flex gap-2">
            <button className="btn dng flex-1" onClick={remove}>
              <Ic n="trash" s={16} /> Yes, delete
            </button>
            <button className="btn" onClick={() => setDel(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </Card>
  );
}

export function Admin() {
  const { user } = useAuth();
  const { items, cfg } = useStore();
  const isAdmin = user.role === "admin";
  const alerts = items.filter((i) => i.q <= cfg.low);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <PasswordCard />
      {isAdmin && <SettingsCard />}
      <Card title="Stock alerts" icon="box">
        {alerts.length ? (
          <div className="space-y-1">
            {alerts.map((i) => (
              <div key={i.id} className="flex justify-between text-sm">
                <span>{i.n}</span>
                <span className={"tag " + stc(i)}>{i.q <= 0 ? "Out of stock" : "Left: " + i.q}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={MUTE}>
            All good, no items are running low.
          </p>
        )}
      </Card>
      {isAdmin && <MovementsCard />}
      {isAdmin && <UsersCard />}
    </div>
  );
}
