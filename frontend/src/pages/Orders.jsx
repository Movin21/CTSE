import { ShoppingCart, Clock, CheckCircle2, Bell, Loader2, RefreshCw, Package, Receipt, Truck, XCircle, AlertTriangle } from 'lucide-react';
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
  DISPATCHED: {
    label: 'Dispatched',
    color: '#10b981',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    icon: Truck,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#f43f5e',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    icon: XCircle,
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

function TimelineItem({ order, index, onCancel }) {
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
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={order.status} />
            {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
              <button 
                onClick={() => onCancel(order.id)}
                className="text-[10px] uppercase font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2 py-1 rounded transition-colors"
              >
                Cancel Order
              </button>
            )}
          </div>
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
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [cancelling, setCancelling] = useState(false);
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

  const handleCancelClick = (orderId) => {
    setShowCancelModal(orderId);
  };

  const confirmCancel = async () => {
    if (!showCancelModal) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${showCancelModal}/cancel`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setOrders((prev) => prev.map(o => o.id === showCancelModal ? { ...o, status: 'CANCELLED' } : o));
        setShowCancelModal(null);
      } else {
        alert('Failed to cancel order.');
      }
    } catch {
      alert('Network error while cancelling order.');
    } finally {
      setCancelling(false);
    }
  };

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
      <div className="grid grid-cols-4 gap-4 mb-8">
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
            <TimelineItem key={order.id} order={order} index={i} onCancel={handleCancelClick} />
          ))}
        </div>
      )}

      {/* Flow explanation */}
      <div className="card mt-8 max-w-2xl">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-3">
          <Bell size={14} className="text-indigo-400" /> Order Flow
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {['Order POSTed', '→', 'Saved (PENDING)', '→', 'Admin Update (PROCESSING/DISPATCHED)', '→', 'RabbitMQ EVENT', '→', 'Notification consumed/Socket.io push'].map((step, i) => (
            <span key={i} className={step === '→' ? 'text-indigo-600' : 'text-slate-400'}>{step}</span>
          ))}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-[#161820] border border-[rgba(244,63,94,0.2)] rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-[slideUp_0.2s_ease-out]">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <AlertTriangle size={24} className="text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Cancel Order?</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Are you sure you want to cancel order <span className="font-mono text-slate-300">#{showCancelModal.substring(0, 8)}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCancelModal(null)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  No, Keep it
                </button>
                <button 
                  onClick={confirmCancel}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.3)] disabled:opacity-50"
                >
                  {cancelling ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
