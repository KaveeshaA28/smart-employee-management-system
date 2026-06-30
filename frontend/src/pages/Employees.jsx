import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiLoader,
  FiX, FiUser, FiMail, FiBriefcase, FiPhone, FiDollarSign,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', designation: '',
  department: '', basicSalary: '', phone: '', role: 'Employee',
};

// Must match the `department` enum in models/Employee.js exactly
const DEPARTMENTS = [
  'Engineering', 'Human Resources', 'Finance', 'Marketing',
  'Sales', 'Operations', 'Design', 'Legal', 'Management', 'Other',
];
const ROLES = ['Admin', 'HR', 'Manager', 'Employee'];

const Employees = () => {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [employees, setEmployees]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterDept, setFilterDept]     = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [editingEmp, setEditingEmp]     = useState(null);
  const [formData, setFormData]         = useState(EMPTY_FORM);
  const [submitting, setSubmitting]     = useState(false);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/employees');
      setEmployees(res.data.data);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditingEmp(null); setFormData(EMPTY_FORM); setShowModal(true); };
  const openEdit = (emp) => {
    setEditingEmp(emp);
    setFormData({
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      designation: emp.designation || '',
      department: emp.department || '',
      basicSalary: emp.basicSalary || '',
      phone: emp.phone || '',
      role: emp.role || 'Employee',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingEmp) {
        await apiClient.put(`/employees/${editingEmp._id}`, formData);
        toast.success('Employee updated');
      } else {
        await apiClient.post('/employees', formData);
        toast.success('Employee added');
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await apiClient.delete(`/employees/${id}`);
      toast.success('Employee removed');
      fetchEmployees();
    } catch { toast.error('Failed to delete'); }
  };

  const fullName = (emp) => emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();

  const filtered = employees.filter(emp =>
    (fullName(emp).toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!filterDept || emp.department === filterDept)
  );

  const roleColor = (role) => {
    const m = { Admin: 'badge-purple', HR: 'badge-info', Manager: 'badge-warning', Employee: 'badge-gray' };
    return m[role] || 'badge-gray';
  };

  return (
    <div className="page-layout">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Employees</h1>
              <p className="page-subtitle">{employees.length} team members</p>
            </div>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <FiPlus size={16} /> Add Employee
            </button>
          </div>

          {/* Filters */}
          <div className="card mb-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FiSearch size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text" placeholder="Search by name or email..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="input-field sm:w-48">
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="page-loader"><div className="spinner w-10 h-10" /></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => (
                    <tr key={emp._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {fullName(emp).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{fullName(emp)}</p>
                            <p className="text-xs text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-600">{emp.designation}</td>
                      <td><span className="badge badge-info">{emp.department}</span></td>
                      <td className="text-slate-600">{emp.phone}</td>
                      <td><span className={`badge ${roleColor(emp.role)}`}>{emp.role}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(emp)} className="btn-icon text-indigo-500 hover:text-indigo-700" title="Edit">
                            <FiEdit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(emp._id)} className="btn-icon text-red-400 hover:text-red-600" title="Delete">
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="empty-state">
                  <FiUser />
                  <p>{searchTerm ? 'No employees match your search' : 'No employees yet'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">{editingEmp ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label"><FiUser size={13} className="inline mr-1" />First Name</label>
                  <input type="text" value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="input-field" placeholder="John" required />
                </div>
                <div>
                  <label className="label"><FiUser size={13} className="inline mr-1" />Last Name</label>
                  <input type="text" value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="input-field" placeholder="Doe" required />
                </div>
                <div>
                  <label className="label"><FiMail size={13} className="inline mr-1" />Email</label>
                  <input type="email" value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="input-field" placeholder="john@company.com" required disabled={!!editingEmp} />
                </div>
                <div>
                  <label className="label"><FiBriefcase size={13} className="inline mr-1" />Designation</label>
                  <input type="text" value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="input-field" placeholder="Software Engineer" required />
                </div>
                <div>
                  <label className="label">Department</label>
                  <select value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="input-field" required>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label"><FiDollarSign size={13} className="inline mr-1" />Basic Salary (₹)</label>
                  <input type="number" value={formData.basicSalary}
                    onChange={e => setFormData({ ...formData, basicSalary: e.target.value })}
                    className="input-field" placeholder="50000" required />
                </div>
                <div>
                  <label className="label"><FiPhone size={13} className="inline mr-1" />Phone</label>
                  <input type="tel" value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field" placeholder="0712345678" required />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="input-field">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              {!editingEmp && (
                <p className="text-xs text-slate-400">
                  Default password will be set to <span className="font-mono font-semibold">EMS@123456</span>. The employee can change it after logging in.
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting && <FiLoader className="animate-spin" size={16} />}
                  {editingEmp ? 'Update Employee' : 'Add Employee'}
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

export default Employees;
