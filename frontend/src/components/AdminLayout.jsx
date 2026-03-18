import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Activity, Shield, Server, ShoppingCart, LayoutDashboard, 
  LogOut, ChevronRight, ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const adminNavItems = [
  { to: '/admin', label: 'Health Dashboard', icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Order Management', icon: ShoppingCart },
  { to: '/admin/logs', label: 'RabbitMQ Logs', icon: Server },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="flex min-h-screen bg-[#0a0b0f]">
      <aside className="w-64 flex-shrink-0 flex flex-col bg-[#0f1117] border-r border-[rgba(244,63,94,0.12)]">
        {/* Admin logo */}
        <div className="px-6 py-5 border-b border-[rgba(244,63,94,0.12)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100">Admin Panel</p>
              <p className="text-xs text-rose-400/60">Elevated Access</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {adminNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/admin'}
              className={({ isActive }) => `nav-item ${isActive ? 'active !text-rose-400 !bg-rose-600/10 !border-rose-600/20' : ''}`}>
              <Icon size={16} />{label}
              <ChevronRight size={13} className="ml-auto opacity-40" />
            </NavLink>
          ))}

          {/* Back to user panel */}
          <NavLink to="/"
            className="nav-item mt-6 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/15">
            <ArrowLeft size={16} />Back to User Panel
          </NavLink>
        </nav>

        <div className="px-3 pb-4 border-t border-[rgba(244,63,94,0.12)] pt-4">
          {user && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-rose-950/30 border border-rose-600/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-rose-600/30 flex items-center justify-center">
                  <Shield size={13} className="text-rose-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-200 truncate">{user.username}</p>
                  <p className="text-[10px] text-rose-400 font-bold">ADMIN</p>
                </div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="nav-item w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
            <LogOut size={16} />Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-[#0f1117] border-b border-[rgba(244,63,94,0.12)] flex items-center px-6 gap-4">
          <div className="flex items-center gap-2 text-xs text-rose-400 font-bold uppercase tracking-wider">
            <Shield size={13} />Admin Dashboard
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <Activity size={13} /><span>System Online</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
