import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { getDefaultRouteForRole, isAppRole } from '../lib/authRedirect';
import Preloader from './Preloader';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'doctor' | 'client')[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading: authLoading } = useAuth();
  const { currentProfile, loading: familyLoading } = useFamily();
  const location = useLocation();
  const role = profile?.role;

  if (authLoading || familyLoading) {
    return <Preloader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Any authenticated user without a valid role should be blocked from protected areas.
  if (!profile || !isAppRole(role)) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }

  if (role === 'client') {
    if (location.pathname === '/dashboard/subscriptions') {
      return <Outlet />;
    }

    const isExpired =
      profile.subscription_status === 'expired' ||
      currentProfile?.subscription_status === 'expired';

    if (isExpired) {
      return <Navigate to="/dashboard/subscriptions" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
