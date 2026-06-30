import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  FiUsers, FiClock, FiCalendar, FiCheckSquare,
  FiTrendingUp, FiArrowRight, FiLoader, FiAlertCircle,
} from 'react-icons/fi';

const StatCard = ({ icon: Icon, label, value, color, bg, trend }) => (
  <div className="stat-card animate-fade-in">
    <div className={`stat-icon ${bg}`}>
      <Icon size={24} className={color} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-slate-500 text-xs font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      {trend && <p className="text-xs text-emerald-600 font-medium mt-0.5">{trend}</p>}
    </div>
  </div>
);

const QuickAction = ({ label, desc, color, onClick }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-2xl border text-left hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ${color}`}
  >
    <p className="font-semibold text-sm">{label}</p>
    <p className="text-xs mt-1 opacity-70">{desc}</p>
  </button>
);

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ totalEmployees: 0, presentToday: 0, pendingLeaves: 0, tasksPending: 0 });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      if (hasRole('Admin') || hasRole('HR')) {
        const [empRes, attRes, leaveRes, taskRes] = await Promise.allSettled([
          apiClient.get('/employees/count'),
          apiClient.get('/attendance/today-count'),
          apiClient.get('/leave/pending-count'),
          apiClient.get('/tasks/pending-count'),
        ]);
        setStats({
          totalEmployees: empRes.value?.data?.count   || 0,
          presentToday:   attRes.value?.data?.count   || 0,
          pendingLeaves:  leaveRes.value?.data?.count || 0,
          tasksPending:   taskRes.value?.data?.count  || 0,
        });
      } else {
        const [taskRes, attRes] = await Promise.allSettled([
          apiClient.get('/tasks/my-pending'),
          apiClient.get('/attendance/my-recent'),
        ]);
        setStats({
          totalEmployees: 1,
          presentToday:   attRes.value?.data?.presentDays || 0,
          pendingLeaves:  0,
          tasksPending:   taskRes.value?.data?.count || 0,
        });
      }
    } catch (err) {
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAdminOrHR = hasRole('Admin') || hasRole('HR');

  const adminStats = [
    { icon: FiUsers,       label: 'Total Employees', value: stats.totalEmployees, color: 'text-indigo-600', bg: 'bg-indigo-50',  trend: 'Active team members' },
    { icon: FiClock,       label: 'Present Today',   value: stats.presentToday,   color: 'text-emerald-600',bg: 'bg-emerald-50', trend: 'Checked in today' },
    { icon: FiCalendar,    label: 'Pending Leaves',  value: stats.pendingLeaves,  color: 'text-amber-600',  bg: 'bg-amber-50',   trend: 'Awaiting approval' },
    { icon: FiCheckSquare, label: 'Pending Tasks',   value: stats.tasksPending,   color: 'text-violet-600', bg: 'bg-violet-50',  trend: 'In progress' },
  ];

  const empStats = [
    { icon: FiClock,       label: 'Days Present',    value: stats.presentToday,  color: 'text-emerald-600',bg: 'bg-emerald-50' },
    { icon: FiCheckSquare, label: 'My Pending Tasks',value: stats.tasksPending,  color: 'text-violet-600', bg: 'bg-violet-50' },
    { icon: FiCalendar,    label: 'Leaves Balance',  value: 12,                  color: 'text-amber-600',  bg: 'bg-amber-50' },
    { icon: FiUsers,       label: 'Department',      value: user?.department || 'N/A', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const currentStats = isAdminOrHR ? adminStats : empStats;

  const adminActions = [
    { label: 'Add Employee',     desc: 'Register a new team member',  color: 'bg-indigo-50 border-indigo-100 text-indigo-800', path: '/employees' },
    { label: 'Mark Attendance',  desc: 'Record today\'s attendance',  color: 'bg-emerald-50 border-emerald-100 text-emerald-800', path: '/attendance' },
    { label: 'Review Leaves',    desc: 'Approve or reject requests',  color: 'bg-amber-50 border-amber-100 text-amber-800',   path: '/leave' },
    { label: 'Generate Reports', desc: 'Download PDF reports',        color: 'bg-violet-50 border-violet-100 text-violet-800', path: '/reports' },
  ];

  const empActions = [
    { label: 'My Tasks',        desc: 'View assigned tasks',          color: 'bg-indigo-50 border-indigo-100 text-indigo-800', path: '/tasks' },
    { label: 'Mark Attendance', desc: 'Log your attendance today',    color: 'bg-emerald-50 border-emerald-100 text-emerald-800', path: '/attendance' },
    { label: 'Apply Leave',     desc: 'Submit a leave request',       color: 'bg-amber-50 border-amber-100 text-amber-800',   path: '/leave' },
    { label: 'My Performance',  desc: 'View performance metrics',     color: 'bg-violet-50 border-violet-100 text-violet-800', path: '/performance' },
  ];

  const actions = isAdminOrHR ? adminActions : empActions;

  return (
    <div className="page-layout">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-body">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="text-indigo-600">{user?.name?.split(' ')[0]}</span>! 👋
            </h1>
            <p className="text-slate-500 mt-1">Here's what's happening in your organization today.</p>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="page-loader"><div className="spinner w-10 h-10" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {currentStats.map((s, i) => <StatCard key={i} {...s} />)}
            </div>
          )}

          {/* Quick Actions */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {actions.map((a, i) => (
                <QuickAction key={i} {...a} onClick={() => navigate(a.path)} />
              ))}
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FiTrendingUp className="text-indigo-500" /> System Overview
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Role-Based Access Control', desc: 'Secure multi-role authentication' },
                  { label: 'PDF Report Generation',     desc: 'Downloadable payslips & reports' },
                  { label: 'Real-Time Notifications',   desc: 'Instant alerts for key actions' },
                  { label: 'Performance Tracking',      desc: 'Automated KPI calculations' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{f.label}</p>
                      <p className="text-xs text-slate-400">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FiAlertCircle className="text-amber-500" /> Getting Started
              </h2>
              <div className="space-y-2">
                {[
                  { step: '1', text: 'Add employees via the Employees page', done: true },
                  { step: '2', text: 'Configure attendance tracking',         done: true },
                  { step: '3', text: 'Set up payroll for the current month',  done: false },
                  { step: '4', text: 'Assign tasks to team members',          done: false },
                  { step: '5', text: 'Review performance reports',            done: false },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${s.done ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                    <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0
                      ${s.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {s.done ? '✓' : s.step}
                    </div>
                    <p className={`text-sm ${s.done ? 'text-emerald-700 line-through opacity-70' : 'text-slate-700'}`}>{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
