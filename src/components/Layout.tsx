import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/tropels", label: "Tropeles" },
  { to: "/signals", label: "Senales" },
  { to: "/sectors", label: "Sectores" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">TC</span>
          <div>
            <strong>TropelCare</strong>
            <small>Control Room</small>
          </div>
        </div>
        <nav className="nav-list" aria-label="Principal">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="operator-panel">
          <span>{user?.displayName ?? "Operator"}</span>
          <small>{user?.teamCode ?? "TEAM"}</small>
          <button className="btn ghost" type="button" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </aside>
      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  );
}
