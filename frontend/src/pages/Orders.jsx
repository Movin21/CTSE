import { useState, useEffect } from 'react';
import { ShoppingCart, Clock, CheckCircle2, Bell, Loader2, RefreshCw, Package, Receipt } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    color: '#f59e0b',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    icon: Clock,
  },
  PROCESSING: {
    label: 'Processing',
    color: '#38bdf8',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/20',
    text: 'text-sky-400',
    icon: Loader2,
  },
  NOTIFIED: {
    label: 'Notified',
    color: '#10b981',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    icon: CheckCircle2,
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <Icon size={11} className={status === 'PROCESSING' ? 'animate-spin' : ''} />
      {cfg.label}
    </span>
  );
}

function TimelineItem({ order, index }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const isLast = false;
  
  return (
    <div className="flex gap-5 animate-[fadeIn_0.3s_ease-in-out]" style={{ animationDelay: `${index * 60}ms` }}>
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-offset-2 ring-offset-[#0a0b0f]"
          style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}`, ringColor: cfg.color }}
        />
        <div className="w-px flex-1 mt-1 mb-0 min-h-4" style={{ background: 'rgba(99,102,241,0.15)' }} />
      </div>

      {/* Card */}
      <div className="card flex-1 mb-4">
        <div className="flex items-start justify-between mb-2.5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package size={14} className="text-indigo-400" />
              <span className="font-bold text-slate-100 text-sm">{order.productName || 'Product'}</span>
            </div>
            <p className="text-xs text-slate-500 font-mono">#{order.id?.substring(0, 16)}...</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-2.5 border-t border-[rgba(99,102,241,0.08)]">
          <span className="flex items-center gap-1.5">
            <Receipt size={11} />
            Qty: <span className="text-slate-300 font-medium">{order.quantity}</span>
          </span>
          {order.totalPrice > 0 && (
            <span className="flex items-center gap-1.5">
              Total: <span className="text-slate-300 font-medium">${Number(order.totalPrice).toFixed(2)}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock size={11} />
            {new Date(order.createdAt).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuthStore();

  const fetchOrders = async () => {
    try {
      const url = user?.id ? `/api/orders?userId=${user.id}` : '/api/orders';
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll every 8 seconds to show status progression
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3 mb-1.5">
            <ShoppingCart size={24} className="text-pink-400" />
            Order History
          </h1>
          <p className="text-slate-500 text-sm">Timeline of your orders · auto-refreshes every 8s</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary text-sm">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={status} className="card text-center">
              <Icon size={20} className={`mx-auto mb-2 ${cfg.text}`} />
              <p className="text-2xl font-bold text-slate-100">{statusCounts[status] || 0}</p>
              <p className={`text-xs font-semibold mt-0.5 ${cfg.text}`}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-500">
          <Loader2 size={22} className="animate-spin mr-2" /> Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-3">
          <ShoppingCart size={40} className="opacity-30" />
          <p>No orders yet — head to the Marketplace!</p>
        </div>
      ) : (
        <div className="max-w-2xl">
          {orders.map((order, i) => (
            <TimelineItem key={order.id} order={order} index={i} />
          ))}
        </div>
      )}

      {/* Flow explanation */}
      <div className="card mt-8 max-w-2xl">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-3">
          <Bell size={14} className="text-indigo-400" /> Order Flow
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {['Order POSTed', '→', 'Saved (PENDING)', '→', 'RabbitMQ EVENT', '→', 'Notification consumed', '→', 'Socket.io push (NOTIFIED)'].map((step, i) => (
            <span key={i} className={step === '→' ? 'text-indigo-600' : 'text-slate-400'}>{step}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
