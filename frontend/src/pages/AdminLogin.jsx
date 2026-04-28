import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      if (data.role !== "ADMIN")
        throw new Error("Access denied — admin privileges required");
      login(
        {
          id: data.userId,
          username: data.username,
          email: data.email,
          role: data.role,
        },
        data.token,
      );
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0a0b0f] flex items-center justify-center px-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 0%, rgba(244,63,94,0.1) 0%, transparent 60%)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-600/30 mb-4 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <Shield size={28} className="text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Admin Access Test</h1>
          <p className="text-slate-500 text-sm mt-1">
            Sign in with administrator credentials
          </p>
        </div>

        <div
          className="card border-[rgba(244,63,94,0.2)]"
          style={{ borderTopColor: "#f43f5e", borderTopWidth: 2 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 text-rose-400 text-sm">
                <AlertCircle size={15} />
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Username
              </label>
              <input
                className="input"
                type="text"
                placeholder="Admin username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? "text" : "password"}
                  placeholder="Admin password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full justify-center bg-rose-600 hover:bg-rose-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.25)]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? "Signing in..." : "Admin Sign In"}
            </button>
          </form>
          <div className="mt-5 pt-4 border-t border-[rgba(244,63,94,0.1)] text-center text-sm text-slate-500">
            Need an admin account?{" "}
            <Link
              to="/admin/register"
              className="text-rose-400 hover:text-rose-300 font-medium"
            >
              Register
            </Link>
            <span className="mx-2">·</span>
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
