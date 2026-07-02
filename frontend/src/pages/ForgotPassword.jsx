import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiAlertCircle, FiCheckCircle, FiLoader, FiZap, FiArrowLeft } from 'react-icons/fi';
import apiClient from '../services/apiClient';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur rounded-2xl mb-4 shadow-lg">
            <FiZap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Forgot Password?</h1>
          <p className="text-white/70 mt-1 text-sm">We'll send you a reset link</p>
        </div>

        <div className="glass-card">
          {error && (
            <div className="alert alert-error mb-5">
              <FiAlertCircle size={18} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-4">
              <FiCheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-slate-700 font-medium mb-1">Check your email</p>
              <p className="text-sm text-slate-500">
                If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email Address</label>
                <div className="relative">
                  <FiMail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email" id="email" name="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10" placeholder="you@company.com"
                    required disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-3 text-base"
              >
                {loading ? <><FiLoader className="animate-spin" /> Sending...</> : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="mt-5 text-center text-sm text-slate-500">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1">
              <FiArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;