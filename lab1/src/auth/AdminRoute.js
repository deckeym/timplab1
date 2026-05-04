import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '20px' }}>Проверка доступа...</div>;
  }

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  if (user.role !== 'admin') {
    return <div style={{ padding: '20px', color: 'red' }}>Доступ только для администраторов</div>;
  }

  return children;
}

export default AdminRoute;
