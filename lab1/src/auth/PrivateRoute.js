import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '20px' }}>Проверка авторизации...</div>;
  }

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  return children;
}

export default PrivateRoute;
