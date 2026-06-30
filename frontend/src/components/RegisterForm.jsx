import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiUser, FiAlertCircle, FiCheckCircle, FiLoader, FiZap, FiEye, FiEyeOff, FiBriefcase } from 'react-icons/fi';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'Employee',
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const roles = ['Admin', 'HR', 'Manager', 'Employee'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim())   { setError('First name is required'); return false; }
    if (!formData.lastName.trim())    { setError('Last name is required'); return false; }
    if (!formData.email.trim())       { setError('Email is required'); return false; }
    if (!formData.password)           { setError('Password is required'); return false; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-slide-up">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur rounded-2xl mb-4 shadow-lg">
          <FiZap size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Create Account</h1>
        <p className="text-white/70 mt-1 text-sm">Join SmartEMS today</p>
      </div>

      <div className="glass-card">
        {error   && <div className="alert alert-error mb-4"><FiAlertCircle size={18} className="flex-shrink-0" />{error}</div>}
        {success && <div className="alert alert-success mb-4"><FiCheckCircle size={18} className="flex-shrink-0" />{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="label">First Name</label>
              <div className="relative">
                <FiUser size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input type="text" id="firstName" name="firstName" value={formData.firstName}
                  onChange={handleChange} className="input-field pl-10"
                  placeholder="John" required disabled={loading} />
              </div>
            </div>
            <div>
              <label htmlFor="lastName" className="label">Last Name</label>
              <div className="relative">
                <FiUser size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input type="text" id="lastName" name="lastName" value={formData.lastName}
                  onChange={handleChange} className="input-field pl-10"
                  placeholder="Doe" required disabled={loading} />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="label">Email Address</label>
            <div className="relative">
              <FiMail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input type="email" id="email" name="email" value={formData.email}
                onChange={handleChange} className="input-field pl-10"
                placeholder="you@company.com" required disabled={loading} />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="label">Role</label>
            <div className="relative">
              <FiBriefcase size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <select id="role" name="role" value={formData.role}
                onChange={handleChange} className="input-field pl-10" disabled={loading}>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <FiLock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input type={showPw ? 'text' : 'password'} id="password" name="password"
                value={formData.password} onChange={handleChange}
                className="input-field pl-10 pr-10" placeholder="Min. 8 characters"
                required disabled={loading} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
                {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label">Confirm Password</label>
            <div className="relative">
              <FiLock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input type="password" id="confirmPassword" name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange}
                className="input-field pl-10" placeholder="••••••••"
                required disabled={loading} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base mt-2">
            {loading ? <><FiLoader className="animate-spin" /> Registering...</> : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
