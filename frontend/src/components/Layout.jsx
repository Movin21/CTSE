import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  Shield,
  Package,
  ShoppingCart,
  Bell,
  User as UserIcon,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Wifi,
  X,
  Check,
  Trash2,
} from "lucide-react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";

const API_URL = import.meta.env.VITE_API_URL || "";

const userNavItems = [
  { to: "/products", label: "Marketplace", icon: Package },
  { to: "/orders", label: "My Orders", icon: ShoppingCart },
  { to: "/profile", label: "My Profile", icon: UserIcon },
];

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const {
    notifications,
    unreadCount,
    addNotification,
    markAllRead,
    removeNotification,
    clearNotifications,
  } = useNotificationStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);

  // Connect Socket.io for real-time notifications
  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["polling", "websocket"],
    });
    socketRef.current = socket;

    socket.on("notification:new", (data) => {
      addNotification({
        id: data.id || Date.now(),
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        orderId: data.orderId,
        eventType: data.eventType || "ORDER_PLACED",
      });
    });

    return () => socket.disconnect();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#0a0b0f]">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-[#0f1117] border-r border-[rgba(99,102,241,0.12)]">
        <div className="px-6 py-5 border-b border-[rgba(99,102,241,0.12)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100">CTSE Platform</p>
              <p className="text-xs text-slate-500">SE4010 Microservices</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {userNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={16} />
              {label}
              <ChevronRight size={13} className="ml-auto opacity-40" />
            </NavLink>
          ))}

          {/* Admin panel link for ADMIN users */}
          {user?.role === "ADMIN" && (
            <NavLink
              to="/admin"
              className="nav-item mt-4 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20"
            >
              <Shield size={16} />
              Admin Panel
              <ChevronRight size={13} className="ml-auto opacity-40" />
            </NavLink>
          )}
        </nav>

        <div className="px-3 pb-4 border-t border-[rgba(99,102,241,0.12)] pt-4">
          {user && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-[#1e2130]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center">
                  <Shield size={13} className="text-indigo-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {user.username}
                  </p>
                  <p className="text-[10px] text-indigo-400 font-medium">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="nav-item w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-[#0f1117] border-b border-[rgba(99,102,241,0.12)] flex items-center px-6 gap-4">
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <Wifi size={13} />
            <span>Live</span>
          </div>

          {/* ── Notification bell dropdown ── */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e2130] text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Bell size={12} />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-[#161820] border border-[rgba(99,102,241,0.2)] rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] z-50 animate-[fadeIn_0.15s_ease-in-out]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(99,102,241,0.1)]">
                  <span className="text-sm font-bold text-slate-200">
                    Notifications
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Check size={10} />
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Trash2 size={10} />
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-600 text-xs">
                      <Bell size={24} className="mx-auto mb-2 opacity-30" />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <div
                        key={i}
                        className={`px-4 py-3 border-b border-[rgba(99,102,241,0.06)] flex items-start gap-3 hover:bg-[#1e2130] transition-colors ${!n.read ? "bg-indigo-950/20" : ""}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? "bg-indigo-400" : "bg-slate-700"}`}
                          style={
                            !n.read ? { boxShadow: "0 0 6px #818cf8" } : {}
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {new Date(n.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeNotification(i)}
                          className="text-slate-600 hover:text-rose-400 flex-shrink-0 mt-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
