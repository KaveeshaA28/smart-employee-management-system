import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import {
  FiUser, FiMail, FiLock, FiBriefcase, FiPhone,
  FiSave, FiLoader, FiCheckCircle, FiAlertCircle,
  FiShield, FiEye, FiEyeOff,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Profile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout }              = useAuth();

  const [profileForm, setProfileForm] = useState({
    name:     user?.name     || '',
    phone:    user?.phone    || '',
    position: user?.position || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw]           = useState(false);
  const [showNewPw, setShowNewPw]         = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiClient.put('/auth/profile', profileForm);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (pwForm.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setSavingPw(true);
    try {
      await apiClient.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed! Please log in again.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(logout, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setSavingPw(false); }
  };

  const roleColors = {
    Admin: 'from-red-500 to-rose-600',
    HR: 'from-blue-500 to-indigo-600',
    Manager: 'from-amber-500 to-orange-600',
    Employee: 'from-emerald-500 to-teal-600',
  };

  return (
    <div className="page-layout">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Profile & Settings</h1>
              <p className="page-subtitle">Manage your account information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="card text-center">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${roleColors[user?.role] || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 shadow-lg`}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
                <p className="text-slate-500 text-sm mt-0.5">{user?.email}</p>
                <div className="mt-3">
                  <span className="badge badge-purple text-sm px-3 py-1">{user?.role}</span>
                </div>

                {user?.department && (
                  <p className="text-slate-500 text-sm mt-3 flex items-center justify-center gap-1.5">
                    <FiBriefcase size={14} /> {user.department}
                  </p>
                )}

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-left">
                  <div className="flex items-center gap-3 text-sm">
                    <FiMail size={15} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600 truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FiShield size={15} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600">{user?.role} Access</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Forms */}
            <div className="lg:col-span-2 space-y-5">
              {/* Profile Info */}
              <div className="card">
                <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <FiUser className="text-indigo-500" /> Personal Information
                </h2>
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Full Name</label>
                      <div className="relative">
                        <FiUser size={15} className="absolute left-3.5 top-3 text-slate-400" />
                        <input type="text" value={profileForm.name}
                          onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="input-field pl-10" placeholder="Your full name" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <div className="relative">
                        <FiPhone size={15} className="absolute left-3.5 top-3 text-slate-400" />
                        <input type="tel" value={profileForm.phone}
                          onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="input-field pl-10" placeholder="+91 98765 43210" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Email Address</label>
                      <div className="relative">
                        <FiMail size={15} className="absolute left-3.5 top-3 text-slate-400" />
                        <input type="email" value={user?.email || ''} disabled
                          className="input-field pl-10 opacity-60 cursor-not-allowed" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="label">Position / Title</label>
                      <div className="relative">
                        <FiBriefcase size={15} className="absolute left-3.5 top-3 text-slate-400" />
                        <input type="text" value={profileForm.position}
                          onChange={e => setProfileForm({ ...profileForm, position: e.target.value })}
                          className="input-field pl-10" placeholder="Software Engineer" />
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
                    {savingProfile ? <FiLoader className="animate-spin" size={16} /> : <FiSave size={16} />}
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>

              {/* Password Change */}
              <div className="card">
                <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <FiLock className="text-amber-500" /> Change Password
                </h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="label">Current Password</label>
                    <div className="relative">
                      <FiLock size={15} className="absolute left-3.5 top-3 text-slate-400" />
                      <input type="password" value={pwForm.currentPassword}
                        onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                        className="input-field pl-10" placeholder="Enter current password" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">New Password</label>
                      <div className="relative">
                        <FiLock size={15} className="absolute left-3.5 top-3 text-slate-400" />
                        <input type={showNewPw ? 'text' : 'password'} value={pwForm.newPassword}
                          onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                          className="input-field pl-10 pr-10" placeholder="Min. 6 characters" required />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600">
                          {showNewPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="label">Confirm New Password</label>
                      <div className="relative">
                        <FiLock size={15} className="absolute left-3.5 top-3 text-slate-400" />
                        <input type="password" value={pwForm.confirmPassword}
                          onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                          className="input-field pl-10" placeholder="Repeat new password" required />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    ⚠️ After changing your password, you will be logged out automatically.
                  </div>
                  <button type="submit" disabled={savingPw} className="btn-danger flex items-center gap-2">
                    {savingPw ? <FiLoader className="animate-spin" size={16} /> : <FiLock size={16} />}
                    {savingPw ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
