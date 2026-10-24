import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import LoadingSpinner from './LoadingSpinner.jsx';

export default function ProtectedRoute({ children }) {
  const { isLoading, isAuthenticated, login } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) login(location.pathname + location.search);
  }, [isLoading, isAuthenticated, login, location]);

  if (isLoading || !isAuthenticated) return <LoadingSpinner label="Checking your session" className="p-10" />;
  return children;
}
