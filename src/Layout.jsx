import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loader } from "./components/ui";
import { useAuth } from "./auth";
import { Ic } from "./lib/icons";
import { useStore } from "./store";

const NAV = [
  { to: "/", icon: "store", label: "Home", roles: ["admin", "cashier"] },
  { to: "/products", icon: "box", label: "Products", roles: ["admin", "cashier"] },
  { to: "/cashier", icon: "cart", label: "Cashier", roles: ["admin", "cashier"] },
  { to: "/analytics", icon: "chart", label: "Analytics", roles: ["admin"] },
  { to: "/admin", icon: "gear", label: "Admin", cashierLabel: "My Account", roles: ["admin", "cashier"] },
];

export default function Layout() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { cfg } = useStore();
  const [col, setCol] = useState(false);
  const [mob, setMob] = useState(false);
  const [ld, setLd] = useState(true);
  const hd = useRef(null);
  const pg = useRef(null);

  const links = NAV.filter((n) => n.roles.includes(user.role)).map((n) => ({
    ...n,
    label: user.role === "cashier" && n.cashierLabel ? n.cashierLabel : n.label,
  }));

  useEffect(() => {
    document.title = cfg.name + " - Admin Panel";
  }, [cfg.name]);

  // page load (milk and juice animation)
  useEffect(() => {
    setLd(true);
    setMob(false);
    const t = setTimeout(() => setLd(false), 1000);
    return () => clearTimeout(t);
  }, [pathname]);

  // scroll progress bar + header shadow
  useEffect(() => {
    const f = () => {
      const y = window.scrollY;
      const m = document.documentElement.scrollHeight - window.innerHeight;
      if (pg.current) pg.current.style.transform = "scaleX(" + (m > 0 ? y / m : 0) + ")";
      if (hd.current) hd.current.classList.toggle("sc", y > 8);
    };
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  const title = links.find((n) => n.to === pathname)?.label ?? "";
  const toggle = () => (window.innerWidth < 768 ? setMob(!mob) : setCol(!col));

  return (
    <div className="flex min-h-screen">
      {mob && <div className="bd" style={{ zIndex: 30 }} onClick={() => setMob(false)} />}
      <aside className={"side " + (col ? "c " : "") + (mob ? "o" : "")}>
        <div className="flex items-center gap-3 px-5 py-5">
          <span
            className="grid place-items-center w-9 h-9 rounded-md shrink-0"
            style={{ background: "var(--acc)", color: "var(--accfg)" }}
          >
            <Ic n="store" s={20} />
          </span>
          <span className="lb font-extrabold text-lg">{cfg.name}</span>
        </div>
        <nav>
          {links.map((n, k) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) => "nv up " + (isActive ? "on" : "")}
              style={{ "--i": k + 2 }}
            >
              <Ic n={n.icon} />
              <span className="lb">{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          className="nv absolute bottom-3"
          onClick={async () => {
            await logout();
            nav("/login");
          }}
        >
          <Ic n="out" />
          <span className="lb">Logout</span>
        </button>
      </aside>
      <main className={"flex-1 min-w-0 p-4 md:p-6 " + (pathname === "/cashier" ? "pb-44 md:pb-6" : "")}>
        <div className="pgb" ref={pg} />
        {ld && <div className="ldb" />}
        <div ref={hd} className="hd flex items-center gap-3">
          <button className="btn" aria-label="Menu" onClick={toggle}>
            <Ic n="menu" />
          </button>
          <h1 key={pathname} className="text-2xl font-bold">
            {title}
          </h1>
        </div>
        <div key={pathname} className="pgw">
          {ld ? (
            <div className="py-16 grid place-items-center">
              <Loader />
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}
