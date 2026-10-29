import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Field } from "../components/ui";
import { api } from "../lib/api";
import { Ic } from "../lib/icons";
import { MUTE, R, focusBad } from "../lib/utils";

const FEATURES = ["Track stock moment by moment", "Fast cashier with a clear invoice", "Smart reports and purchase recommendations"];

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [shop, setShop] = useState(null); // null = still loading
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [srv, setSrv] = useState("");
  const [tk, setTk] = useState(0);
  const [busy, setBusy] = useState(false);

  // Shop name from the server (public route) so it updates when changed in settings
  useEffect(() => {
    let alive = true;
    api("/public/shop")
      .then((d) => alive && setShop(d.name))
      .catch(() => alive && setShop("Admin Panel"));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    document.title = (shop || "") + " - Sign in";
  }, [shop]);

  const go = async () => {
    if (busy) return;
    if (!pw.trim() || !username.trim()) {
      setTk(tk + 1);
      focusBad();
      return;
    }
    setBusy(true);
    try {
      await login(pw, username.trim());
      nav("/", { replace: true });
    } catch (e) {
      // Server message (wrong password / account locked / no connection) shown under the field
      setSrv(e.errors?.password || e.errors?.username || e.message);
      setTk((t) => t + 1);
      focusBad();
    } finally {
      setBusy(false);
    }
  };

  const Brand = ({ big }) => (
    <div className={big ? "text-center" : "flex items-center gap-3"}>
      <div className={"mono " + (big ? "" : "!m-0 !w-12 !h-12 !text-3xl shrink-0")} aria-hidden="true">
        {shop ? shop.trim().charAt(0) : ""}
      </div>
      {shop === null ? (
        <div className={"skl h-8 " + (big ? "w-48 mx-auto" : "w-32")} />
      ) : (
        <div className={"fa font-bold " + (big ? "text-4xl" : "text-2xl")} style={{ color: "var(--acc)" }}>
          {shop}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen grid place-items-center p-4 sm:p-6">
      <div
        className="card rv grid md:grid-cols-[1.05fr_1fr] w-full max-w-4xl overflow-hidden"
        style={{
          background: "rgba(23,18,38,.8)",
          backdropFilter: "blur(10px)",
          borderTop: "2px solid var(--acc)",
        }}
      >
        <div
          className="hidden md:flex flex-col justify-between p-10"
          style={{
            background: "linear-gradient(160deg, rgba(167,139,250,.18), rgba(15,11,26,.55))",
            borderInlineEnd: "1px solid var(--line)",
          }}
        >
          <Brand big />
          <div>
            <div className="h-px w-16 mb-5 mx-auto" style={{ background: "var(--acc)" }} />
            <p className="text-center mb-6" style={MUTE}>
              Inventory & Sales Management System
            </p>
            <ul className="space-y-3">
              {FEATURES.map((f, k) => (
                <li key={f} className="flex items-center gap-3 rv" style={{ "--i": k + 1 }}>
                  <span
                    className="grid place-items-center w-7 h-7 rounded-md shrink-0"
                    style={{ background: "rgba(167,139,250,.16)", color: "var(--acc)" }}
                  >
                    <Ic n="check" s={16} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-center" style={MUTE}>
            {shop ? "© " + shop : ""}
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="md:hidden mb-6">
            <Brand />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Sign in</h1>
          <p className="mb-6" style={MUTE}>
            Enter your details to continue
          </p>
          <div className="space-y-4">
            <Field
              label="Username"
              icon="store"
              autoComplete="username"
              value={username}
              tick={tk}
              rules={[R.req("Enter the username")]}
              onChange={(v) => {
                setUsername(v);
                setSrv("");
              }}
              onEnter={go}
            />
            <Field
              label="Password"
              type="password"
              icon="lock"
              autoComplete="current-password"
              value={pw}
              tick={tk}
              error={srv}
              rules={[R.req("Enter your password")]}
              onChange={(v) => {
                setPw(v);
                setSrv("");
              }}
              onEnter={go}
            />
          </div>
          <button className="btn on w-full mt-6 !py-3 text-base" disabled={busy} onClick={go}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
