import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiLock, FiAlertCircle, FiCheckCircle, FiLoader, FiZap, FiEye, FiEyeOff } from 'react-icons/fi';
import apiClient from '../services/apiClient';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.put(`/auth/reset-password/${token}`, { newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link is invalid or has expired.');
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
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="text-white/70 mt-1 text-sm">Choose a new password</p>
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
              <p className="text-slate-700 font-medium mb-1">Password reset successful!</p>
              <p className="text-sm text-slate-500">Redirecting you to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="label">New Password</label>
                <div className="relative">
                  <FiLock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPw ? 'text' : 'password'} id="newPassword"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pl-10 pr-10" placeholder="••••••••"
                    required disabled={loading} minLength={8}
                  />
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
                  <input
                    type={showPw ? 'text' : 'password'} id="confirmPassword"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-10" placeholder="••••••••"
                    required disabled={loading} minLength={8}
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-3 text-base"
              >
                {loading ? <><FiLoader className="animate-spin" /> Resetting...</> : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-5 text-center text-sm text-slate-500">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;