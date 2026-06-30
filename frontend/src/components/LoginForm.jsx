import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiAlertCircle, FiLoader, FiZap, FiEye, FiEyeOff } from 'react-icons/fi';

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setDemo = (email) => setFormData({ email, password: 'password123' });

  return (
    <div className="w-full max-w-md animate-slide-up">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur rounded-2xl mb-4 shadow-lg">
          <FiZap size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Welcome back</h1>
        <p className="text-white/70 mt-1 text-sm">Sign in to SmartEMS</p>
      </div>

      <div className="glass-card">
        {error && (
          <div className="alert alert-error mb-5">
            <FiAlertCircle size={18} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email Address</label>
            <div className="relative">
              <FiMail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email" id="email" name="email"
                value={formData.email} onChange={handleChange}
                className="input-field pl-10" placeholder="you@company.com"
                required disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <FiLock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPw ? 'text' : 'password'} id="password" name="password"
                value={formData.password} onChange={handleChange}
                className="input-field pl-10 pr-10" placeholder="••••••••"
                required disabled={loading}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
                {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-3 text-base"
          >
            {loading ? <><FiLoader className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">Register here</Link>
        </div>

        {/* Demo credentials */}
        <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Demo Credentials</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Admin', email: 'admin@smartems.com' },
              { label: 'HR',    email: 'hr@smartems.com' },
              { label: 'Manager', email: 'manager@smartems.com' },
              { label: 'Employee', email: 'employee@smartems.com' },
            ].map(d => (
              <button
                key={d.email}
                onClick={() => setDemo(d.email)}
                className="text-left p-2.5 bg-white rounded-lg border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition group"
              >
                <p className="text-xs font-semibold text-indigo-600">{d.label}</p>
                <p className="text-xs text-slate-400 truncate group-hover:text-slate-600">{d.email}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">Password: <span className="font-mono font-semibold">password123</span></p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
