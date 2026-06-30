import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FiDownload, FiLoader, FiDollarSign, FiPlus, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Payroll = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [payroll, setPayroll]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [month, setMonth]             = useState(new Date().toISOString().split('T')[0].slice(0, 7));
  const [showGenModal, setShowGen]    = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [genMonth, setGenMonth]       = useState(month);
  const [downloading, setDownloading] = useState('');

  useEffect(() => { fetchPayroll(); }, [month]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/payroll?month=${month}`);
setPayroll(res.data.data);
    } catch { toast.error('Failed to load payroll'); }
    finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await apiClient.post('/payroll/generate', { month: genMonth });
      toast.success('Payroll generated successfully');
      setShowGen(false);
      setMonth(genMonth);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payroll');
    } finally { setGenerating(false); }
  };

  const handleDownload = async (id, name) => {
    setDownloading(id);
    try {
      const res = await apiClient.get(`/payroll/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `payslip-${name}-${month}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Payslip downloaded');
    } catch { toast.error('Download failed'); }
    finally { setDownloading(''); }
  };

  const total = (key) => payroll.reduce((s, p) => s + (p[key] || 0), 0);

  const summaryCards = [
    { label: 'Total Basic',       value: total('basicSalary'),  color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200' },
    { label: 'Total Allowances',  value: total('allowances'),   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Total Deductions',  value: total('deductions'),   color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    { label: 'Total Net Salary',  value: total('netSalary'),    color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  ];

  return (
    <div className="page-layout">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Payroll Management</h1>
              <p className="page-subtitle">Manage and download employee payslips</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input-field w-44" />
              <button onClick={() => setShowGen(true)} className="btn-primary flex items-center gap-2">
                <FiPlus size={16} /> Generate Payroll
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          {payroll.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {summaryCards.map(c => (
                <div key={c.label} className={`rounded-2xl border p-4 ${c.bg}`}>
                  <p className="text-xs font-medium text-slate-500 mb-1">{c.label}</p>
                  <p className={`text-xl font-bold ${c.color}`}>₹{c.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="page-loader"><div className="spinner w-10 h-10" /></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Basic Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Payslip</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map(rec => (
                    <tr key={rec._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {rec.employeeId?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{rec.employeeId?.name}</p>
                            <p className="text-xs text-slate-400">{rec.employeeId?.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-700">₹{rec.basicSalary?.toLocaleString()}</td>
                      <td className="text-emerald-600 font-medium">+₹{rec.allowances?.toLocaleString()}</td>
                      <td className="text-red-500 font-medium">-₹{rec.deductions?.toLocaleString()}</td>
                      <td className="font-bold text-indigo-700 text-base">₹{rec.netSalary?.toLocaleString()}</td>
                      <td>
                        <button
                          onClick={() => handleDownload(rec._id, rec.employeeId?.name)}
                          disabled={downloading === rec._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition disabled:opacity-60"
                        >
                          {downloading === rec._id
                            ? <FiLoader size={14} className="animate-spin" />
                            : <FiDownload size={14} />}
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payroll.length === 0 && (
                <div className="empty-state">
                  <FiDollarSign />
                  <p>No payroll records for {month}</p>
                  <button onClick={() => setShowGen(true)} className="btn-primary mt-4 text-sm">
                    Generate Payroll
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {showGenModal && (
        <div className="modal-overlay">
          <div className="modal max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-800">Generate Payroll</h2>
              <button onClick={() => setShowGen(false)} className="btn-icon"><FiX size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Select Month</label>
                <input type="month" value={genMonth} onChange={e => setGenMonth(e.target.value)} className="input-field" />
              </div>
              <p className="text-sm text-slate-500">This will automatically calculate salaries, allowances and deductions based on attendance data.</p>
              <div className="flex gap-3">
                <button onClick={handleGenerate} disabled={generating} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {generating && <FiLoader className="animate-spin" size={16} />}
                  {generating ? 'Generating...' : 'Generate'}
                </button>
                <button onClick={() => setShowGen(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
