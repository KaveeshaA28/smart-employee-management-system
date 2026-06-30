import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FiBell, FiTrash2, FiLoader, FiCheck, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  leave_approval: { icon: '📋', color: 'bg-amber-50 border-amber-200' },
  attendance:     { icon: '📍', color: 'bg-blue-50 border-blue-200' },
  task:           { icon: '✅', color: 'bg-emerald-50 border-emerald-200' },
  performance:    { icon: '📊', color: 'bg-violet-50 border-violet-200' },
  system:         { icon: 'ℹ️', color: 'bg-slate-50 border-slate-200' },
};

const Notifications = () => {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/notifications');
setNotifications(res.data.data);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification removed');
    } catch { toast.error('Failed to remove'); }
  };

  const handleMarkRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await Promise.all(notifications.map(n => apiClient.delete(`/notifications/${n._id}`)));
      setNotifications([]);
      toast.success('All cleared');
    } catch { toast.error('Failed to clear all'); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="page-layout">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title flex items-center gap-3">
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </h1>
              <p className="page-subtitle">{notifications.length} notifications</p>
            </div>
            {notifications.length > 0 && (
              <button onClick={handleClearAll} className="btn-secondary flex items-center gap-2 text-sm">
                <FiTrash2 size={15} /> Clear All
              </button>
            )}
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner w-10 h-10" /></div>
          ) : notifications.length === 0 ? (
            <div className="card text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiBell size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500 text-lg font-medium">You're all caught up!</p>
              <p className="text-slate-400 text-sm mt-1">No notifications at the moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notif => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                return (
                  <div
                    key={notif._id}
                    className={`rounded-2xl border p-4 flex items-start gap-4 transition-all duration-200
                      ${cfg.color} ${!notif.isRead ? 'shadow-sm' : 'opacity-75'}`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center text-xl flex-shrink-0 bg-white rounded-xl shadow-sm">
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`font-semibold text-slate-800 text-sm ${!notif.isRead ? 'font-bold' : ''}`}>
                            {notif.title}
                            {!notif.isRead && <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full ml-2 align-middle" />}
                          </h3>
                          <p className="text-slate-600 text-sm mt-0.5">{notif.message}</p>
                          <p className="text-slate-400 text-xs mt-1.5">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notif.isRead && (
                            <button
                              onClick={() => handleMarkRead(notif._id)}
                              className="btn-icon text-indigo-400 hover:text-indigo-600"
                              title="Mark as read"
                            >
                              <FiCheck size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notif._id)}
                            className="btn-icon text-slate-400 hover:text-red-500"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
