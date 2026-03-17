import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Key, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      login({ id: data.userId, username: data.username, email: data.email, role: data.role }, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = form.password.length >= 8
    ? form.password.match(/(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/)
      ? 'strong' : 'medium'
    : form.password.length > 0 ? 'weak' : '';

  const strengthColor = { strong: 'text-emerald-400', medium: 'text-amber-400', weak: 'text-rose-400' }[passwordStrength] || '';

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center px-4"
      style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 60%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-600/30 mb-4 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Key size={28} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Create Account</h1>
          <p className="text-slate-500 text-sm mt-1">Join the CTSE Platform</p>
        </div>

        <div className="card border-[rgba(99,102,241,0.2)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 text-rose-400 text-sm">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Username</label>
              <input className="input" type="text" placeholder="Choose a username" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} required minLength={3} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
              <input className="input" type="email" placeholder="your@email.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordStrength && (
                <p className={`text-xs mt-1 ${strengthColor} capitalize`}>
                  Password strength: {passwordStrength}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Confirm Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPassword ? 'text' : 'password'} placeholder="Repeat password"
                  value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
                {form.confirm && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {form.password === form.confirm
                      ? <CheckCircle2 size={15} className="text-emerald-400" />
                      : <AlertCircle size={15} className="text-rose-400" />
                    }
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                : <UserPlus size={16} />
              }
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[rgba(99,102,241,0.1)] text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
