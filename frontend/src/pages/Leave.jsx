import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FiPlus, FiCheck, FiX, FiLoader, FiCalendar, FiFilter } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave'];
const EMPTY_FORM  = { startDate: '', endDate: '', leaveType: 'Sick Leave', reason: '' };

const Leave = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leaves, setLeaves]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [filterStatus, setFilter]     = useState('');
  const { hasRole }                   = useAuth();

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/leave');
setLeaves(res.data.data);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      return toast.error('End date must be after start date');
    }
    setSubmitting(true);
    try {
      await apiClient.post('/leave/apply', formData);
      toast.success('Leave request submitted');
      setShowModal(false);
      setFormData(EMPTY_FORM);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave');
    } finally { setSubmitting(false); }
  };

  const handleAction = async (id, action) => {
    try {
      await apiClient.put(`/leave/${id}/${action}`, { status: action === 'approve' ? 'Approved' : 'Rejected' });
      toast.success(`Leave ${action}d`);
      fetchLeaves();
    } catch { toast.error('Action failed'); }
  };

  const statusBadge = (s) => ({ Pending: 'badge-warning', Approved: 'badge-success', Rejected: 'badge-danger' }[s] || 'badge-gray');

  const filtered = filterStatus ? leaves.filter(l => l.status === filterStatus) : leaves;

  const counts = { all: leaves.length, Pending: 0, Approved: 0, Rejected: 0 };
  leaves.forEach(l => { if (counts[l.status] !== undefined) counts[l.status]++; });

  return (
    <div className="page-layout">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Leave Management</h1>
              <p className="page-subtitle">Track and manage leave requests</p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
              <FiPlus size={16} /> Apply Leave
            </button>
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { label: `All (${counts.all})`, value: '' },
              { label: `Pending (${counts.Pending})`, value: 'Pending' },
              { label: `Approved (${counts.Approved})`, value: 'Approved' },
              { label: `Rejected (${counts.Rejected})`, value: 'Rejected' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition border
                  ${filterStatus === f.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner w-10 h-10" /></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                    {(hasRole('Admin') || hasRole('HR') || hasRole('Manager')) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(leave => {
                    const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / 86400000) + 1;
                    return (
                      <tr key={leave._id}>
                        <td className="font-semibold text-slate-800">{leave.employeeId?.name}</td>
                        <td><span className="badge badge-info">{leave.leaveType}</span></td>
                        <td>
                          <div className="text-sm">
                            <p className="text-slate-700">{new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-400">{days} day{days !== 1 ? 's' : ''}</p>
                          </div>
                        </td>
                        <td className="max-w-xs">
                          <p className="text-sm text-slate-600 truncate">{leave.reason}</p>
                        </td>
                        <td><span className={`badge ${statusBadge(leave.status)}`}>{leave.status}</span></td>
                        {(hasRole('Admin') || hasRole('HR') || hasRole('Manager')) && (
                          <td>
                            {leave.status === 'Pending' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleAction(leave._id, 'approve')}
                                  className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition"
                                >
                                  <FiCheck size={14} /> Approve
                                </button>
                                <button
                                  onClick={() => handleAction(leave._id, 'reject')}
                                  className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                                >
                                  <FiX size={14} /> Reject
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="empty-state">
                  <FiCalendar />
                  <p>No leave requests found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Apply for Leave</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="label">Leave Type</label>
                <select value={formData.leaveType}
                  onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                  className="input-field" required>
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field" required />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field" required />
                </div>
              </div>
              <div>
                <label className="label">Reason</label>
                <textarea value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  className="input-field" rows={4} placeholder="Describe the reason for leave..." required />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting && <FiLoader className="animate-spin" size={16} />} Submit Request
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
