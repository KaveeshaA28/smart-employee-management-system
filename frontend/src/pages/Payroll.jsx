import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FiDownload, FiLoader, FiDollarSign, FiPlus, FiX, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Payroll = () => {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [payroll, setPayroll]           = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [month, setMonth]               = useState(new Date().toISOString().split('T')[0].slice(0, 7));
  const [showGenModal, setShowGen]      = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [downloading, setDownloading]   = useState('');

  // Generate form state
  const [genForm, setGenForm] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    allowances: { houseRent: 0, transport: 0, medical: 0, food: 0, other: 0 },
    deductions: { providentFund: 0, insurance: 0, other: 0 },
    tax: 0,
    loans: 0,
    paymentMethod: 'Bank Transfer',
  });

  useEffect(() => {
    fetchPayroll();
    fetchEmployees();
  }, [month]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const [y, m] = month.split('-');
      const res = await apiClient.get(`/payroll?month=${parseInt(m)}&year=${parseInt(y)}`);
      setPayroll(res.data.data);
    } catch {
      toast.error('Failed to load payroll');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/employees?limit=100');
      setEmployees(res.data.data || []);
    } catch {
      console.error('Failed to load employees');
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!genForm.employeeId) {
      return toast.error('Please select an employee');
    }
    setGenerating(true);
    try {
      await apiClient.post('/payroll/generate', genForm);
      toast.success('Payroll generated successfully');
      setShowGen(false);
      fetchPayroll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id, empName) => {
    setDownloading(id);
    try {
      // Correct endpoint: /payslip (not /pdf)
      const res = await apiClient.get(`/payroll/${id}/payslip`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `payslip-${empName}-${month}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Payslip downloaded');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading('');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await apiClient.patch(`/payroll/${id}/status`, { status: 'Paid', paymentMethod: 'Bank Transfer' });
      toast.success('Marked as Paid');
      fetchPayroll();
    } catch {
      toast.error('Failed to update status');
    }
  };

  // totalAllowances / totalDeductions are computed fields from model pre-save
  const total = (key) => payroll.reduce((s, p) => s + (p[key] || 0), 0);

  const getEmpName = (rec) => {
    const emp = rec.employee;
    if (!emp) return 'Unknown';
    return emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
  };

  const statusBadge = (s) => ({
    Generated: 'badge-warning',
    Paid: 'badge-success',
    Draft: 'badge-gray',
    Cancelled: 'badge-danger',
  }[s] || 'badge-gray');

  const summaryCards = [
    { label: 'Total Basic',      value: total('basicSalary'),     color: 'text-slate-800',   bg: 'bg-slate-50 border-slate-200' },
    { label: 'Total Allowances', value: total('totalAllowances'), color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Total Deductions', value: total('totalDeductions'), color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
    { label: 'Total Net Salary', value: total('netSalary'),       color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200' },
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
              <input
                type="month" value={month}
                onChange={e => setMonth(e.target.value)}
                className="input-field w-44"
              />
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
                  <p className={`text-xl font-bold ${c.color}`}>
                    Rs. {c.value.toLocaleString()}
                  </p>
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
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map(rec => (
                    <tr key={rec._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {getEmpName(rec).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{getEmpName(rec)}</p>
                            <p className="text-xs text-slate-400">{rec.employee?.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-700">
                        Rs. {rec.basicSalary?.toLocaleString()}
                      </td>
                      <td className="text-emerald-600 font-medium">
                        +Rs. {rec.totalAllowances?.toLocaleString()}
                      </td>
                      <td className="text-red-500 font-medium">
                        -Rs. {rec.totalDeductions?.toLocaleString()}
                      </td>
                      <td className="font-bold text-indigo-700 text-base">
                        Rs. {rec.netSalary?.toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${statusBadge(rec.status)}`}>{rec.status}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(rec._id, getEmpName(rec))}
                            disabled={downloading === rec._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition disabled:opacity-60"
                          >
                            {downloading === rec._id
                              ? <FiLoader size={14} className="animate-spin" />
                              : <FiDownload size={14} />}
                            PDF
                          </button>
                          {rec.status === 'Generated' && (
                            <button
                              onClick={() => handleMarkPaid(rec._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
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

      {/* Generate Payroll Modal */}
      {showGenModal && (
        <div className="modal-overlay">
          <div className="modal max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-800">Generate Payroll</h2>
              <button onClick={() => setShowGen(false)} className="btn-icon"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleGenerate} className="space-y-4">

              {/* Employee Select */}
              <div>
                <label className="label"><FiUser size={13} className="inline mr-1" />Employee</label>
                <select
                  value={genForm.employeeId}
                  onChange={e => setGenForm({ ...genForm, employeeId: e.target.value })}
                  className="input-field" required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Month & Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Month</label>
                  <select
                    value={genForm.month}
                    onChange={e => setGenForm({ ...genForm, month: parseInt(e.target.value) })}
                    className="input-field">
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <input
                    type="number" value={genForm.year}
                    onChange={e => setGenForm({ ...genForm, year: parseInt(e.target.value) })}
                    className="input-field" min={2020} max={2030} />
                </div>
              </div>

              {/* Allowances */}
              <div>
                <p className="label mb-2">Allowances (Rs.)</p>
                <div className="grid grid-cols-2 gap-3">
                  {['houseRent', 'transport', 'medical', 'food', 'other'].map(key => (
                    <div key={key}>
                      <label className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <input type="number" min={0}
                        value={genForm.allowances[key]}
                        onChange={e => setGenForm({
                          ...genForm,
                          allowances: { ...genForm.allowances, [key]: parseFloat(e.target.value) || 0 }
                        })}
                        className="input-field" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <p className="label mb-2">Deductions (Rs.)</p>
                <div className="grid grid-cols-2 gap-3">
                  {['providentFund', 'insurance', 'other'].map(key => (
                    <div key={key}>
                      <label className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <input type="number" min={0}
                        value={genForm.deductions[key]}
                        onChange={e => setGenForm({
                          ...genForm,
                          deductions: { ...genForm.deductions, [key]: parseFloat(e.target.value) || 0 }
                        })}
                        className="input-field" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax & Loans */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tax (Rs.)</label>
                  <input type="number" min={0} value={genForm.tax}
                    onChange={e => setGenForm({ ...genForm, tax: parseFloat(e.target.value) || 0 })}
                    className="input-field" />
                </div>
                <div>
                  <label className="label">Loan Deductions (Rs.)</label>
                  <input type="number" min={0} value={genForm.loans}
                    onChange={e => setGenForm({ ...genForm, loans: parseFloat(e.target.value) || 0 })}
                    className="input-field" />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="label">Payment Method</label>
                <select value={genForm.paymentMethod}
                  onChange={e => setGenForm({ ...genForm, paymentMethod: e.target.value })}
                  className="input-field">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <p className="text-xs text-slate-400">
                Absence deductions and overtime pay will be calculated automatically from attendance data.
              </p>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={generating}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {generating && <FiLoader className="animate-spin" size={16} />}
                  {generating ? 'Generating...' : 'Generate Payroll'}
                </button>
                <button type="button" onClick={() => setShowGen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;