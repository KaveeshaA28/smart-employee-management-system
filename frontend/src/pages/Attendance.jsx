import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FiClock, FiLoader, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  Present: 'badge-success',
  Absent:  'badge-danger',
  Late:    'badge-warning',
  Leave:   'badge-info',
};

const Attendance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendance, setAttendance]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [date, setDate]               = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary]         = useState({ Present: 0, Absent: 0, Late: 0, Leave: 0 });

  useEffect(() => { fetchAttendance(); }, [date]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/attendance?date=${date}`);
const data = res.data.data;
setAttendance(data);
      const s = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
      data.forEach(r => { if (s[r.status] !== undefined) s[r.status]++; });
      setSummary(s);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (employeeId, status) => {
    try {
      await apiClient.post('/attendance/mark', { employeeId, date, status });
      toast.success(`Marked as ${status}`);
      fetchAttendance();
    } catch { toast.error('Failed to update attendance'); }
  };

  const summaryCards = [
    { label: 'Present', value: summary.Present, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { label: 'Absent',  value: summary.Absent,  color: 'bg-red-50 border-red-200 text-red-700' },
    { label: 'Late',    value: summary.Late,     color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { label: 'Leave',   value: summary.Leave,    color: 'bg-blue-50 border-blue-200 text-blue-700' },
  ];

  return (
    <div className="page-layout">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Attendance Management</h1>
              <p className="page-subtitle">Track and manage daily attendance</p>
            </div>
          </div>

          {/* Date picker + summary */}
          <div className="card mb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div>
                <label className="label flex items-center gap-1"><FiCalendar size={13} />Select Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-52" />
              </div>
              {!loading && (
                <div className="flex flex-wrap gap-3 sm:ml-auto">
                  {summaryCards.map(c => (
                    <div key={c.label} className={`px-4 py-2 rounded-xl border text-center min-w-[80px] ${c.color}`}>
                      <p className="text-2xl font-bold">{c.value}</p>
                      <p className="text-xs font-medium">{c.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner w-10 h-10" /></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Status</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(rec => (
                    <tr key={rec._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {rec.employeeId?.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">{rec.employeeId?.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${STATUS_COLORS[rec.status] || 'badge-gray'}`}>{rec.status}</span>
                      </td>
                      <td className="text-slate-600 flex items-center gap-1.5">
                        <FiClock size={14} className="text-slate-400" />
                        {rec.timeIn ? new Date(rec.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="text-slate-600">
                        {rec.timeOut ? new Date(rec.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td>
                        <select
                          value={rec.status}
                          onChange={e => handleStatusChange(rec.employeeId._id, e.target.value)}
                          className="input-field text-sm py-1.5 w-36"
                        >
                          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attendance.length === 0 && (
                <div className="empty-state">
                  <FiClock />
                  <p>No attendance records for this date</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
