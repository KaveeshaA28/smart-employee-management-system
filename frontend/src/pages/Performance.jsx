import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FiLoader, FiTrendingUp, FiAward } from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ScoreMeter = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="font-bold text-slate-700">{value}%</span>
    </div>
    <div className="progress-bar h-2">
      <div className={`progress-fill h-2 ${color}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const Performance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [chartData, setChartData]       = useState(null);

  useEffect(() => { fetchPerformance(); }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/performance');
setPerformances(res.data.data);
buildChart(res.data.data);
    } catch { toast.error('Failed to load performance data'); }
    finally { setLoading(false); }
  };

  const buildChart = (data) => {
    const top = data.slice(0, 10);
    setChartData({
      labels: top.map(p => p.employeeId?.name?.split(' ')[0] || 'Unknown'),
      datasets: [
        {
          label: 'Attendance Score',
          data: top.map(p => p.attendanceScore || 0),
          backgroundColor: 'rgba(99,102,241,0.7)',
          borderRadius: 6,
        },
        {
          label: 'Task Completion',
          data: top.map(p => p.taskCompletionRate || 0),
          backgroundColor: 'rgba(16,185,129,0.7)',
          borderRadius: 6,
        },
        {
          label: 'Quality Score',
          data: top.map(p => p.qualityScore || 0),
          backgroundColor: 'rgba(245,158,11,0.7)',
          borderRadius: 6,
        },
      ],
    });
  };

  const getLabel = (score) => {
    if (score >= 80) return { text: 'Excellent', cls: 'badge-success' };
    if (score >= 60) return { text: 'Good',      cls: 'badge-info' };
    if (score >= 40) return { text: 'Average',   cls: 'badge-warning' };
    return                  { text: 'Needs Work', cls: 'badge-danger' };
  };

  const avg = (key) => performances.length
    ? Math.round(performances.reduce((s, p) => s + (p[key] || 0), 0) / performances.length)
    : 0;

  return (
    <div className="page-layout">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Performance Management</h1>
              <p className="page-subtitle">Track employee performance metrics</p>
            </div>
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner w-10 h-10" /></div>
          ) : (
            <>
              {/* Avg summary */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Avg Attendance',   value: avg('attendanceScore'),    color: 'text-indigo-600',  bg: 'bg-indigo-50' },
                  { label: 'Avg Task Rate',     value: avg('taskCompletionRate'), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Avg Quality',       value: avg('qualityScore'),       color: 'text-amber-600',   bg: 'bg-amber-50' },
                  { label: 'Avg Overall',       value: avg('overallScore'),       color: 'text-violet-600',  bg: 'bg-violet-50' },
                ].map(c => (
                  <div key={c.label} className={`rounded-2xl ${c.bg} p-4 flex items-center gap-3`}>
                    <FiTrendingUp className={c.color} size={20} />
                    <div>
                      <p className="text-xs text-slate-500 font-medium">{c.label}</p>
                      <p className={`text-2xl font-bold ${c.color}`}>{c.value}%</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              {chartData && (
                <div className="card mb-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FiAward className="text-indigo-500" /> Performance Overview
                  </h2>
                  <div style={{ height: 300, position: 'relative' }}>
                    <Bar
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: {
                          y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' } },
                          x: { grid: { display: false } },
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Table with score meters */}
              <div className="table-container">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800">Employee Performance Details</h2>
                </div>
                <div className="divide-y divide-slate-50">
                  {performances.map(perf => {
                    const label = getLabel(perf.overallScore || 0);
                    return (
                      <div key={perf._id} className="px-6 py-4 hover:bg-slate-50/50 transition">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 flex-shrink-0 w-44">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                              {perf.employeeId?.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{perf.employeeId?.name}</p>
                              <span className={`badge ${label.cls} text-xs`}>{label.text}</span>
                            </div>
                          </div>
                          <div className="flex-1 space-y-2 min-w-0">
                            <ScoreMeter label="Attendance"      value={perf.attendanceScore    || 0} color="bg-indigo-500" />
                            <ScoreMeter label="Task Completion" value={perf.taskCompletionRate || 0} color="bg-emerald-500" />
                            <ScoreMeter label="Quality"         value={perf.qualityScore       || 0} color="bg-amber-500" />
                          </div>
                          <div className="text-right flex-shrink-0 w-20">
                            <p className="text-xs text-slate-400">Overall</p>
                            <p className="text-2xl font-bold text-slate-800">{perf.overallScore || 0}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {performances.length === 0 && (
                  <div className="empty-state">
                    <FiTrendingUp />
                    <p>No performance records found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Performance;
