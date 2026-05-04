import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useThreats } from '../ThreatContext';
import { useAuth } from '../auth/AuthContext';
import { ClipLoader } from 'react-spinners';

function Home() {
  const navigate = useNavigate();
  const { threats, pagination, loading, error, fetchThreats, isAdmin, isGuest } = useThreats();
  const { user, logout } = useAuth();

  const [filters, setFilters] = useState({ page: 1, limit: 5, status: '', category: '', search: '' });

  useEffect(() => {
    fetchThreats(filters);
  }, [filters]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const changeFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <p><b>Пользователь:</b> {user?.username} ({user?.role})</p>
        <Link to='/profile'>Профиль</Link>
        <Link to='/dns'>DNS-записи</Link>
        {isAdmin && <Link to='/admin'>Админ-панель</Link>}
        <button onClick={handleLogout}>Выйти</button>
      </div>

      <h1>{isAdmin || isGuest ? 'Все инциденты ИБ' : 'Мои инциденты ИБ'}</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <input placeholder='Поиск по названию/описанию' value={filters.search} onChange={(e) => changeFilter('search', e.target.value)} />
        <input placeholder='Статус' value={filters.status} onChange={(e) => changeFilter('status', e.target.value)} />
        <input placeholder='Категория' value={filters.category} onChange={(e) => changeFilter('category', e.target.value)} />
      </div>

      {!isGuest && <Link to='/add'><button>Добавить инцидент</button></Link>}

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
          <ClipLoader size={18} color='#c1121f' />
          <span>Загрузка...</span>
        </div>
      )}

      {threats.length === 0 ? <p>Список пуст</p> : (
        <div style={{ marginTop: '16px' }}>
          {threats.map((threat) => (
            <div key={threat.id} style={{ border: '1px solid #ccc', padding: '12px', marginBottom: '10px', borderRadius: '8px' }}>
              <h3>{threat.title}</h3>
              <p><b>Статус:</b> {threat.status}</p>
              <p><b>Категория:</b> {threat.category}</p>
              <p><b>Владелец:</b> {threat.ownerUsername}</p>
              <Link to={`/detail/${threat.id}`}><button>Подробнее</button></Link>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button disabled={pagination.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}>Назад</button>
        <span>Страница {pagination.page} из {pagination.totalPages}</span>
        <button disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}>Вперёд</button>
      </div>
    </div>
  );
}

export default Home;
