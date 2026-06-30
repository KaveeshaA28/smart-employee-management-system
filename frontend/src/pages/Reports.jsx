import { useState } from 'react';
import apiClient from '../services/apiClient';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FiDownload, FiLoader, FiBarChart2, FiFileText, FiUsers, FiCalendar, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { value: 'attendance',   label: 'Attendance Report',   icon: FiCalendar,   color: 'from-indigo-500 to-indigo-600',   desc: 'Present, absent, and late day records for all employees.' },
  { value: 'payroll',      label: 'Payroll Report',      icon: FiDollarSign, color: 'from-emerald-500 to-emerald-600', desc: 'Salary breakdowns with allowances and deductions.' },
  { value: 'leave',        label: 'Leave Report',        icon: FiFileText,   color: 'from-amber-500 to-amber-600',     desc: 'Leave requests, approvals, rejections and balance.' },
  { value: 'performance',  label: 'Performance Report',  icon: FiTrendingUp, color: 'from-violet-500 to-violet-600',   desc: 'Attendance, task completion and quality score metrics.' },
  { value: 'employees',    label: 'Employee Directory',  icon: FiUsers,      color: 'from-rose-500 to-rose-600',       desc: 'Complete list of employees with contact details.' },
];

const Reports = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading]         = useState('');
  const [reportType, setReportType]   = useState('attendance');
  const [month, setMonth]             = useState(new Date().toISOString().split('T')[0].slice(0, 7));

  const handleGenerate = async () => {
    setLoading(reportType);
    try {
      const res = await apiClient.get(`/reports/${reportType}`, {
        params: { month },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `${reportType}-report-${month}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Report downloaded!');
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(''); }
  };

  const handleQuickDownload = async (type) => {
    setLoading(type);
    try {
      const res = await apiClient.get(`/reports/${type}`, {
        params: { month },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `${type}-report-${month}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Report downloaded!');
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(''); }
  };

  return (
    <div className="page-layout">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Reports & Analytics</h1>
              <p className="page-subtitle">Generate and download detailed PDF reports</p>
            </div>
          </div>

          {/* Custom Report Generator */}
          <div className="card mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <FiBarChart2 className="text-indigo-500" /> Custom Report Generator
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="label">Report Type</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)} className="input-field">
                  {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Month</label>
                <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input-field" />
              </div>
              <button
                onClick={handleGenerate}
                disabled={!!loading}
                className="btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-70"
              >
                {loading === reportType
                  ? <><FiLoader className="animate-spin" size={16} /> Generating...</>
                  : <><FiDownload size={16} /> Generate & Download</>}
              </button>
            </div>
          </div>

          {/* Quick Report Cards */}
          <h2 className="text-base font-bold text-slate-700 mb-4">Quick Download — {month}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_TYPES.map(report => {
              const Icon = report.icon;
              const isLoading = loading === report.value;
              return (
                <div key={report.value} className="card group hover:shadow-md transition-all duration-200">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${report.color} flex items-center justify-center mb-4 shadow-sm`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">{report.label}</h3>
                  <p className="text-sm text-slate-500 mb-5">{report.desc}</p>
                  <button
                    onClick={() => handleQuickDownload(report.value)}
                    disabled={!!loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold
                               hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition disabled:opacity-60 w-full justify-center"
                  >
                    {isLoading
                      ? <><FiLoader className="animate-spin" size={14} /> Generating...</>
                      : <><FiDownload size={14} /> Download PDF</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
