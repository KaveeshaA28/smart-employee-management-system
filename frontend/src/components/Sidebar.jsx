import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiX, FiHome, FiUsers, FiClock, FiCalendar, FiDollarSign,
  FiCheckSquare, FiTrendingUp, FiBarChart2, FiBell, FiLogOut,
  FiSettings, FiUser, FiZap,
} from 'react-icons/fi';

const Sidebar = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();

  const handleLogout = () => { logout(); navigate('/login'); };

  const allItems = [
    { icon: FiHome,        label: 'Dashboard',    path: '/dashboard',    roles: null },
    { icon: FiUsers,       label: 'Employees',    path: '/employees',    roles: ['Admin','HR'] },
    { icon: FiClock,       label: 'Attendance',   path: '/attendance',   roles: ['Admin','HR','Manager'] },
    { icon: FiCalendar,    label: 'Leave',        path: '/leave',        roles: null },
    { icon: FiDollarSign,  label: 'Payroll',      path: '/payroll',      roles: ['Admin','HR'] },
    { icon: FiCheckSquare, label: 'Tasks',        path: '/tasks',        roles: null },
    { icon: FiTrendingUp,  label: 'Performance',  path: '/performance',  roles: null },
    { icon: FiBarChart2,   label: 'Reports',      path: '/reports',      roles: ['Admin','HR'] },
    { icon: FiBell,        label: 'Notifications',path: '/notifications',roles: ['Admin','HR'] },
  ];

  const menuItems = allItems.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  const navTo = (path) => { navigate(path); setOpen(false); };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full flex flex-col z-40 transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex`}
        style={{ width: 'var(--sidebar-w)', background: 'var(--dark-bg)', flexShrink: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <FiZap size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">SmartEMS</span>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
            <FiX size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider px-3 mb-3">Menu</p>
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navTo(item.path)}
                className={`sidebar-item ${active ? 'active' : ''}`}
              >
                <item.icon size={18} className={active ? 'text-white' : 'text-slate-500'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-white/5 pt-3 space-y-1">
          <button onClick={() => navTo('/profile')} className="sidebar-item">
            <FiSettings size={18} className="text-slate-500" />
            <span>Profile & Settings</span>
          </button>
          <button onClick={handleLogout} className="sidebar-item hover:bg-red-500/20 hover:text-red-400">
            <FiLogOut size={18} className="text-slate-500" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
