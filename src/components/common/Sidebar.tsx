import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  RiDashboardLine,
  RiUserLine,
  RiRestaurantLine,
  RiCalendarLine,
  RiFileListLine,
  RiLogoutBoxLine,
  RiMenuLine,
  RiCloseLine,
  RiStore2Line,
} from "react-icons/ri";
import { useState } from "react";

const ADMIN_NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: RiDashboardLine },
  { to: "/admin/users", label: "Users", icon: RiUserLine },
  { to: "/admin/restaurants", label: "Restaurants", icon: RiStore2Line },
  { to: "/admin/bookings", label: "Bookings", icon: RiCalendarLine },
  { to: "/admin/requests", label: "Requests", icon: RiFileListLine },
];

const OWNER_NAV = [
  { to: "/owner/dashboard", label: "Dashboard", icon: RiDashboardLine },
  { to: "/owner/restaurants", label: "My Restaurants", icon: RiRestaurantLine },
  { to: "/owner/bookings", label: "Bookings", icon: RiCalendarLine },
  { to: "/owner/requests", label: "My Requests", icon: RiFileListLine },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const nav = user?.role === "admin" ? ADMIN_NAV : OWNER_NAV;

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-sidebar text-white shadow-lg"
        onClick={() => setCollapsed((v) => !v)}>
        {collapsed ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
      </button>

      {/* Overlay */}
      {collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setCollapsed(false)}
        />
      )}

      <aside
        className={`
        fixed top-0 left-0 h-full z-40 flex flex-col
        bg-sidebar text-white transition-all duration-300
        ${collapsed ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0"}
        lg:static lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-xl bg-primary-500">
            <RiRestaurantLine size={20} />
          </div>
          <div>
            <p className="font-bold text-white leading-tight">TableSite</p>
            <p className="text-xs text-slate-400 capitalize">
              {user?.role} Panel
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll py-4 px-3">
          <ul className="space-y-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setCollapsed(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${
                      isActive
                        ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                    }
                  `}>
                  <Icon size={18} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center flex-shrink-0 text-sm font-bold text-white rounded-full w-9 h-9 bg-primary-500">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs truncate text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
            <RiLogoutBoxLine size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Sign-out confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative flex flex-col items-center w-full max-w-sm gap-4 p-6 text-center bg-white shadow-2xl rounded-2xl">
            {/* Icon */}
            <div className="flex items-center justify-center rounded-full w-14 h-14 bg-red-50">
              <RiLogoutBoxLine size={26} className="text-red-500" />
            </div>

            {/* Text */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Sign out?
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                You'll be returned to the login page.
              </p>
            </div>

            {/* Actions */}
            <div className="flex w-full gap-3 mt-1">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  logout();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
