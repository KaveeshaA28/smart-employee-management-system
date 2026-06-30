import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// requiredRole can be a single role string like "HR"
// or a pipe-separated string like "Admin|HR"
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading, hasRole, hasAnyRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="spinner w-10 h-10" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const roles = requiredRole.split('|').map(r => r.trim());
    if (!hasAnyRole(roles)) return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
