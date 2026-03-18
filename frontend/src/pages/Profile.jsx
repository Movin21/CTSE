import { useState, useEffect } from 'react';
import { User, Mail, Save, Loader2, AlertCircle, CheckCircle2, Bell, ShoppingCart, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Profile() {
  const { user, token, updateUser } = useAuthStore();
  const [form, setForm] = useState({ username: user?.username || '', email: user?.email || '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Fetch user's orders and notifications
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, notifsRes] = await Promise.all([
          fetch(`/api/orders?userId=${user?.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          fetch('/api/notifications'),
        ]);
        const ordersData = await ordersRes.json();
        const notifsData = await notifsRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        // Match notifications to user's orders
        const orderIds = new Set((Array.isArray(ordersData) ? ordersData : []).map(o => o.id));
        setNotifications((Array.isArray(notifsData) ? notifsData : []).filter(n => orderIds.has(n.orderId)));
      } catch { /* ignore */ }
    };
    if (user?.id) fetchData();
  }, [user?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ username: form.username, email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      updateUser({ username: data.username, email: data.email });
      setToast({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const STATUS_COLORS = {
    PENDING: 'text-amber-400',
    PROCESSING: 'text-sky-400',
    DISPATCHED: 'text-emerald-400',
    NOTIFIED: 'text-violet-400',
  };

  return (
    <div className="page-container max-w-4xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-[fadeIn_0.2s] ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3 mb-1.5">
        <User size={24} className="text-indigo-400" />My Profile
      </h1>
      <p className="text-slate-500 text-sm mb-8">Edit your account details and view order notifications</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile edit form */}
        <div className="card">
          <h2 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            <User size={14} className="text-indigo-400" />Account Details
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Username</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input pl-9" type="text" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })} required minLength={3} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input pl-9" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <span className="text-xs text-slate-600">Role: <span className="text-indigo-400 font-bold">{user?.role}</span></span>
            </div>
          </form>

          {/* Account info */}
          <div className="mt-6 pt-4 border-t border-[rgba(99,102,241,0.1)]">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-600">User ID</span>
                <p className="text-slate-400 font-mono mt-0.5 truncate">{user?.id}</p>
              </div>
              <div>
                <span className="text-slate-600">Total Orders</span>
                <p className="text-slate-200 font-bold mt-0.5">{orders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order notifications */}
        <div className="card">
          <h2 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            <Bell size={14} className="text-emerald-400" />Order Notifications
            <span className="ml-auto text-xs text-slate-600">{notifications.length} total</span>
          </h2>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-600 gap-2">
              <Bell size={30} className="opacity-30" />
              <p className="text-xs">No notifications for your orders yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map((n) => {
                const order = orders.find((o) => o.id === n.orderId);
                return (
                  <div key={n.id} className="rounded-lg bg-[#1e2130] border border-[rgba(99,102,241,0.1)] p-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bell size={11} className="text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={9} />{new Date(n.createdAt).toLocaleString()}
                          </span>
                          {order && (
                            <span className={`flex items-center gap-1 font-bold ${STATUS_COLORS[order.status] || ''}`}>
                              <ShoppingCart size={9} />{order.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
