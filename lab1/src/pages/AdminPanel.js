import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth/AuthContext';

const roleOptions = ['admin', 'user', 'guest'];

function AdminPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [emailDrafts, setEmailDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/users');
      const list = response.data.data || [];
      setUsers(list);
      const drafts = {};
      list.forEach((item) => {
        drafts[item.id] = item.email || '';
      });
      setEmailDrafts(drafts);
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateRole = async (userId, role) => {
    try {
      setError('');
      setInfo('');
      const response = await api.put(`/users/${userId}/role`, { role });
      const updated = response.data.user;
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setInfo('Роль успешно обновлена');
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось обновить роль');
    }
  };

  const deleteUser = async (userId) => {
    const ok = window.confirm('Удалить пользователя и все его инциденты?');
    if (!ok) return;

    try {
      setError('');
      setInfo('');
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((item) => item.id !== userId));
      setInfo('Пользователь удален');
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось удалить пользователя');
    }
  };

  const updateEmail = async (userId) => {
    try {
      setError('');
      setInfo('');
      const email = String(emailDrafts[userId] || '').trim();
      const response = await api.put(`/users/${userId}/email`, { email });
      const updated = response.data.user;
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEmailDrafts((prev) => ({ ...prev, [userId]: updated.email || '' }));
      setInfo(Number(userId) === Number(currentUser?.id) ? 'Ваш email обновлен' : 'Email пользователя обновлен');
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось обновить email');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Админ-панель</h1>
      <p><Link to='/dashboard'>Назад в дашборд</Link></p>

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      {info && <p style={{ color: 'green', fontWeight: 'bold' }}>{info}</p>}

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Логин</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Email</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Роль</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Инциденты</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.id}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.username}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type='email'
                      value={emailDrafts[user.id] || ''}
                      onChange={(e) => setEmailDrafts((prev) => ({ ...prev, [user.id]: e.target.value }))}
                      style={{ margin: 0 }}
                    />
                    <button onClick={() => updateEmail(user.id)}>Сохранить email</button>
                  </div>
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    disabled={Number(user.id) === Number(currentUser?.id)}
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.threatsCount}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  <button
                    onClick={() => deleteUser(user.id)}
                    disabled={Number(user.id) === Number(currentUser?.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminPanel;
