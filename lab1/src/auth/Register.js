import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!USERNAME_RE.test(cleanUsername)) {
      return 'Логин: 3-30 символов, только буквы, цифры, _, -, .';
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      return 'Некорректный email';
    }
    if (password.trim().length < 6) {
      return 'Пароль должен быть не короче 6 символов';
    }
    if (/\s/.test(password)) {
      return 'Пароль не должен содержать пробелы';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await register({ username, email, password });
      navigate('/login');
    } catch (err) {
      if (!err.response) {
        setError('Сервер недоступен или заблокирован CORS. Проверьте запуск backend и URL.');
        return;
      }
      setError(err.response?.data?.message || 'Ошибка регистрации');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Регистрация</h1>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type='text' placeholder='Логин' value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
        <input type='email' placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
        <input type='password' placeholder='Пароль' value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
        <button type='submit'>Создать аккаунт</button>
      </form>
      <p style={{ marginTop: '12px' }}>Уже есть аккаунт? <Link to='/login'>Вход</Link></p>
    </div>
  );
}

export default Register;
