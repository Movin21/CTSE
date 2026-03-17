import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Activity, Shield, Package, ShoppingCart, Bell, 
  LayoutDashboard, LogOut, Server, ChevronRight, Wifi 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Marketplace', icon: Package },
  { to: '/orders', label: 'My Orders', icon: ShoppingCart },
  { to: '/admin/logs', label: 'Admin Logs', icon: Server },
];

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#0a0b0f]">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-[#0f1117] border-r border-[rgba(99,102,241,0.12)]">
        {/* Logo */}
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

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={16} />
              {label}
              <ChevronRight size={13} className="ml-auto opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* User panel */}
        <div className="px-3 pb-4 border-t border-[rgba(99,102,241,0.12)] pt-4">
          {user && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-[#1e2130]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center">
                  <Shield size={13} className="text-indigo-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-200 truncate">{user.username}</p>
                  <p className="text-[10px] text-indigo-400 font-medium">{user.role}</p>
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
        {/* Top header */}
        <header className="h-14 bg-[#0f1117] border-b border-[rgba(99,102,241,0.12)] flex items-center px-6 gap-4">
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <Wifi size={13} />
            <span>Live</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e2130] text-xs text-slate-400">
            <Bell size={12} />
            <span>Notifications</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
