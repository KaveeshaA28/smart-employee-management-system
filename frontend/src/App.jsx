import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

// Pages
import Login        from './pages/Login';
import Register     from './pages/Register';
import Dashboard    from './pages/Dashboard';
import Employees    from './pages/Employees';
import Attendance   from './pages/Attendance';
import Leave        from './pages/Leave';
import Payroll      from './pages/Payroll';
import Tasks        from './pages/Tasks';
import Performance  from './pages/Performance';
import Reports      from './pages/Reports';
import Notifications from './pages/Notifications';
import Profile      from './pages/Profile';

function App() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-medium">Loading SmartEMS...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />

          {/* Protected – all roles */}
          <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/attendance"   element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/leave"        element={<ProtectedRoute><Leave /></ProtectedRoute>} />
          <Route path="/tasks"        element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/performance"  element={<ProtectedRoute><Performance /></ProtectedRoute>} />
          <Route path="/profile"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          {/* Protected – Admin/HR only */}
          <Route path="/employees" element={<ProtectedRoute requiredRole="Admin|HR"><Employees /></ProtectedRoute>} />
          <Route path="/payroll"   element={<ProtectedRoute requiredRole="Admin|HR"><Payroll /></ProtectedRoute>} />
          <Route path="/reports"   element={<ProtectedRoute requiredRole="Admin|HR"><Reports /></ProtectedRoute>} />

          {/* Redirects */}
          <Route path="/"  element={<Navigate to="/dashboard" />} />
          <Route path="*"  element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
