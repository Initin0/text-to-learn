import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

// /login and /signup hand off to Auth0's hosted page (redirect flow).
export default function AuthRedirect({ signup = false }) {
  const { isLoading, isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) login('/', signup);
  }, [isLoading, isAuthenticated, login, signup]);

  if (isAuthenticated) return <Navigate to="/" replace />;
  return <LoadingSpinner label={signup ? 'Opening sign up' : 'Opening log in'} className="min-h-screen justify-center" />;
}
