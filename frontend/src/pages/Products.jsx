import { useState, useEffect } from "react";
import {
  Package,
  ShoppingCart,
  Search,
  Tag,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";

const API_URL = import.meta.env.VITE_API_URL || "";

const CATEGORY_COLORS = {
  Electronics: "#6366f1",
  Peripherals: "#8b5cf6",
  Audio: "#ec4899",
  Furniture: "#f59e0b",
  Computers: "#06b6d4",
  Mobile: "#10b981",
  "Smart Home": "#f97316",
  Storage: "#a78bfa",
  Power: "#facc15",
};

function ProductCard({ product, onBuy, buying }) {
  const color = CATEGORY_COLORS[product.category] || "#6366f1";
  return (
    <div
      className="card group hover:scale-[1.01] transition-transform duration-200 overflow-hidden flex flex-col"
      style={{ borderTopColor: color, borderTopWidth: 2 }}
    >
      {/* Product Image */}
      {product.imageUrl && (
        <div
          className="w-full h-40 -mt-2 mb-4 rounded-lg overflow-hidden relative"
          style={{ backgroundColor: `${color}10` }}
        >
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161820] to-transparent opacity-60"></div>
          <div
            className="absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded shadow-lg backdrop-blur-md"
            style={{ background: `${color}40`, color: "#fff" }}
          >
            {product.category}
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20` }}
        >
          <Package size={18} style={{ color }} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xl font-bold text-slate-100">
            ${product.price}
          </span>
        </div>
      </div>

      <h3 className="font-bold text-slate-100 mb-1.5 leading-tight">
        {product.name}
      </h3>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed line-clamp-2">
        {product.description}
      </p>

      <div className="mt-auto pt-4 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Tag size={11} />
          <span>{product.stockQuantity} in stock</span>
        </div>
        <button
          onClick={() => onBuy(product)}
          disabled={buying === product.id || product.stockQuantity === 0}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200"
          style={{
            background:
              product.stockQuantity === 0
                ? "rgba(71,85,105,0.3)"
                : `${color}20`,
            color: product.stockQuantity === 0 ? "#475569" : color,
            border: `1px solid ${product.stockQuantity === 0 ? "#334155" : `${color}40`}`,
          }}
        >
          {buying === product.id ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <ShoppingCart size={11} />
          )}
          {product.stockQuantity === 0
            ? "Out of Stock"
            : buying === product.id
              ? "Ordering..."
              : "Buy Now"}
        </button>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [buying, setBuying] = useState(null);
  const [toast, setToast] = useState(null);
  const { user, token } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const fetchProducts = async (query = "", cat = "") => {
    try {
      let url = `${API_URL}/api/products`;
      if (query) {
        url = `${API_URL}/api/products?search=${encodeURIComponent(query)}`;
      } else if (cat) {
        url = `${API_URL}/api/products?category=${encodeURIComponent(cat)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => fetchProducts(search, selectedCategory),
      300,
    );
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const handleBuy = async (product) => {
    setBuying(product.id);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          quantity: 1,
          totalPrice: product.price,
          userId: user?.id || "anonymous",
          customerEmail: user?.email || "",
        }),
      });
      if (res.ok) {
        const order = await res.json();
        setToast({
          type: "success",
          message: `Order placed! #${order.id.substring(0, 8)}`,
        });
        addNotification({
          message: `Ordered: ${product.name}`,
          timestamp: new Date().toISOString(),
        });
      } else {
        setToast({ type: "error", message: "Failed to place order" });
      }
    } catch {
      setToast({
        type: "error",
        message: "Network error — is the gateway running?",
      });
    } finally {
      setBuying(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const categories = Object.keys(CATEGORY_COLORS);

  return (
    <div className="page-container">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-card animate-[fadeIn_0.3s_ease-in-out] ${toast.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"}`}
        >
          {toast.type === "success" ? (
            <ShoppingCart size={15} />
          ) : (
            <AlertCircle size={15} />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3 mb-1.5">
            <Package size={24} className="text-amber-400" />
            Product Marketplace
          </h1>
          <p className="text-slate-500 text-sm">
            {products.length} products available · powered by Product Service
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          className="input pl-10"
          type="text"
          placeholder="Search products by name or description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value) setSelectedCategory("");
          }}
        />
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("");
            }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!selectedCategory && !search ? "bg-indigo-600/20 text-indigo-400 border-indigo-600/40" : "bg-[#1e2130] text-slate-400 border-[rgba(99,102,241,0.15)] hover:text-slate-200"}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSearch("");
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedCategory === cat ? "bg-indigo-600/20 text-indigo-400 border-indigo-600/40" : "bg-[#1e2130] text-slate-400 border-[rgba(99,102,241,0.15)] hover:text-slate-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading
          products...
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-500">
          <Package size={40} className="mb-3 opacity-30" />
          <p>No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onBuy={handleBuy}
              buying={buying}
            />
          ))}
        </div>
      )}
    </div>
  );
}
