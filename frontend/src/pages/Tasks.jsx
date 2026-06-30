import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  FiPlus, FiTrash2, FiX, FiLoader, FiCheckSquare,
  FiUser, FiCalendar, FiFlag,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUSES   = ['To Do', 'In Progress', 'Review', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const EMPTY_FORM = { title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium', status: 'To Do' };

const statusStyle = {
  'To Do':      'bg-slate-100 text-slate-700',
  'In Progress':'bg-blue-100 text-blue-700',
  'Review':     'bg-amber-100 text-amber-700',
  'Completed':  'bg-emerald-100 text-emerald-700',
};
const priorityStyle = {
  Low:    'priority-low',
  Medium: 'priority-medium',
  High:   'priority-high',
};

const Tasks = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks]             = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [filterStatus, setFilter]     = useState('');
  const [filterPriority, setPriFilter]= useState('');
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const { hasRole }                   = useAuth();

  useEffect(() => { fetchTasks(); fetchEmployees(); }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/tasks');
setTasks(res.data.data);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
     const res = await apiClient.get('/employees');
setEmployees(res.data.data);
    } catch {}
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/tasks', formData);
      toast.success('Task created');
      setShowModal(false);
      setFormData(EMPTY_FORM);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally { setSubmitting(false); }
  };

  const handleStatus = async (id, status) => {
    try {
      await apiClient.put(`/tasks/${id}`, { status });
      toast.success(`Status → ${status}`);
      fetchTasks();
    } catch { toast.error('Update failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await apiClient.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      fetchTasks();
    } catch { toast.error('Delete failed'); }
  };

  const filtered = tasks.filter(t =>
    (!filterStatus   || t.status   === filterStatus) &&
    (!filterPriority || t.priority === filterPriority)
  );

  const counts = {};
  STATUSES.forEach(s => { counts[s] = tasks.filter(t => t.status === s).length; });

  return (
    <div className="page-layout">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Tasks</h1>
              <p className="page-subtitle">{tasks.length} total tasks</p>
            </div>
            {(hasRole('Admin') || hasRole('HR') || hasRole('Manager')) && (
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                <FiPlus size={16} /> Create Task
              </button>
            )}
          </div>

          {/* Kanban summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setFilter(filterStatus === s ? '' : s)}
                className={`p-4 rounded-2xl border text-left transition hover:shadow-sm
                  ${filterStatus === s ? 'border-indigo-400 bg-indigo-50' : 'bg-white border-slate-100'}`}
              >
                <p className="text-2xl font-bold text-slate-800">{counts[s] || 0}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{s}</p>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-5">
            <select value={filterPriority} onChange={e => setPriFilter(e.target.value)} className="input-field w-36 py-1.5 text-sm">
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {(filterStatus || filterPriority) && (
              <button onClick={() => { setFilter(''); setPriFilter(''); }} className="btn-ghost text-sm flex items-center gap-1">
                <FiX size={14} /> Clear filters
              </button>
            )}
          </div>

          {/* Task Cards */}
          {loading ? (
            <div className="page-loader"><div className="spinner w-10 h-10" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(task => (
                <div key={task._id} className="card-hover animate-fade-in">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-slate-800 flex-1 pr-2">{task.title}</h3>
                    {(hasRole('Admin') || hasRole('HR') || hasRole('Manager')) && (
                      <button onClick={() => handleDelete(task._id)} className="btn-icon text-red-400 hover:text-red-600 -mt-1">
                        <FiTrash2 size={15} />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{task.description}</p>

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className={`badge ${statusStyle[task.status]}`}>{task.status}</span>
                    <span className={priorityStyle[task.priority]}>{task.priority}</span>
                  </div>

                  {task.assignedTo?.name && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-slate-500">
                      <FiUser size={13} />
                      <span>{task.assignedTo.name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                    <FiCalendar size={12} />
                    <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</span>
                  </div>

                  <select
                    value={task.status}
                    onChange={e => handleStatus(task._id, e.target.value)}
                    className="input-field text-sm py-1.5 w-full"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <div className="empty-state">
              <FiCheckSquare />
              <p>No tasks found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Create New Task</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="label">Task Title</label>
                <input type="text" value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="input-field" placeholder="Enter task title" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="input-field" rows={3} placeholder="Describe the task..." required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Assign To</label>
                  <select value={formData.assignedTo}
                    onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="input-field" required>
                    <option value="">Select employee</option>
                    {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input-field" required />
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="input-field">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Initial Status</label>
                  <select value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="input-field">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting && <FiLoader className="animate-spin" size={16} />} Create Task
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

export default Tasks;
