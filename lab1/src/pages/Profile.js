import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function Profile() {
  const { user } = useAuth();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Профиль</h1>
      <p><b>ID:</b> {user?.id}</p>
      <p><b>Логин:</b> {user?.username}</p>
      <p><b>Email:</b> {user?.email}</p>
      <p><b>Роль:</b> {user?.role}</p>
      <Link to='/dashboard'>Назад к списку</Link>
    </div>
  );
}

export default Profile;
