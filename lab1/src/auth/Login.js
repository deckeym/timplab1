import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Логин и пароль не должны быть пустыми');
      return;
    }

    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Сервер недоступен или заблокирован CORS. Проверьте запуск backend и URL.');
        return;
      }
      setError(err.response?.data?.message || 'Ошибка входа');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Вход</h1>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type='text' placeholder='Логин' value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
        <input type='password' placeholder='Пароль' value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
        <button type='submit'>Войти</button>
      </form>
      <p style={{ marginTop: '12px' }}>Нет аккаунта? <Link to='/register'>Регистрация</Link></p>
    </div>
  );
}

export default Login;
