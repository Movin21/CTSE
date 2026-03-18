import { useState, useEffect } from 'react';
import { ShoppingCart, RefreshCw, Loader2, ChevronDown, CheckCircle2, Clock, Truck, Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'DISPATCHED', 'CANCELLED'];
const STATUS_CONFIG = {
  PENDING: { color: '#f59e0b', bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', icon: Clock },
  PROCESSING: { color: '#38bdf8', bg: 'bg-sky-500/15', border: 'border-sky-500/30', text: 'text-sky-400', icon: Loader2 },
  DISPATCHED: { color: '#10b981', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: Truck },
  CANCELLED: { color: '#f43f5e', bg: 'bg-rose-500/15', border: 'border-rose-500/30', text: 'text-rose-400', icon: Loader2 },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState(null);
  const { token } = useAuthStore();

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        setToast({ type: 'success', message: `Order #${orderId.substring(0, 8)} → ${newStatus}` });
      } else {
        setToast({ type: 'error', message: 'Failed to update status' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error' });
    } finally {
      setUpdating(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-container">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-[fadeIn_0.2s] ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3 mb-1.5">
            <ShoppingCart size={24} className="text-rose-400" />
            Order Management
          </h1>
          <p className="text-slate-500 text-sm">{orders.length} total orders · admin status control</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary text-sm">
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={status} className="card text-center">
              <Icon size={18} className={`mx-auto mb-1.5 ${cfg.text}`} />
              <p className="text-xl font-bold text-slate-100">{statusCounts[status] || 0}</p>
              <p className={`text-xs font-semibold ${cfg.text}`}>{status}</p>
            </div>
          );
        })}
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-500">
          <Loader2 size={22} className="animate-spin mr-2" />Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-3">
          <ShoppingCart size={40} className="opacity-30" />
          <p>No orders in the system</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f1117] text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-semibold">Order ID</th>
                <th className="text-left px-4 py-3 font-semibold">Product</th>
                <th className="text-left px-4 py-3 font-semibold">Customer</th>
                <th className="text-right px-4 py-3 font-semibold">Price</th>
                <th className="text-center px-4 py-3 font-semibold">Qty</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="text-center px-4 py-3 font-semibold">Actions</th>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                const Icon = cfg.icon;
                return (
                  <tr key={order.id} className="border-t border-[rgba(99,102,241,0.06)] hover:bg-[#1e2130]/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      #{order.id.substring(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{order.productName}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      <div>{order.customerEmail || '—'}</div>
                      <div className="text-slate-600 text-[10px]">{order.userId?.substring(0, 12)}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-200 font-medium">${Number(order.totalPrice).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{order.quantity}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                        <Icon size={10} className={order.status === 'PROCESSING' ? 'animate-spin' : ''} />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-block">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          disabled={updating === order.id}
                          className="appearance-none bg-[#1e2130] border border-[rgba(99,102,241,0.2)] rounded-lg px-3 py-1.5 pr-7 text-xs text-slate-300 cursor-pointer outline-none focus:border-rose-500 transition-colors"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
