import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const hasToken = typeof window !== 'undefined' && !!window.localStorage.getItem('token');
  const isFlagSet = typeof window !== 'undefined' && window.localStorage.getItem('isAuthenticated') === 'true';
  const isAuthenticated = hasToken && isFlagSet;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
