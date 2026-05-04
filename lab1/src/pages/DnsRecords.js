import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth/AuthContext';

const initialForm = { host: '', type: 'A', value: '', ttl: 3600, comment: '' };
const dnsTypeOptions = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SRV', 'PTR'];

function DnsRecords() {
  const { user } = useAuth();
  const isGuest = user?.role === 'guest';
  const isAdmin = user?.role === 'admin';

  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [integrityMap, setIntegrityMap] = useState({});
  const [updatedRecent, setUpdatedRecent] = useState([]);
  const [deletedRecent, setDeletedRecent] = useState([]);

  const load = async () => {
    try {
      setError('');
      const response = await api.get('/dns-records', { params: search ? { search } : {} });
      setRecords(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось загрузить DNS-записи');
    }
  };

  const loadDeletedRecent = async () => {
    try {
      const response = await api.get('/dns-records/deleted-recent');
      setDeletedRecent(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось загрузить недавно удаленные записи');
    }
  };

  const loadUpdatedRecent = async () => {
    try {
      const response = await api.get('/dns-records/updated-recent');
      setUpdatedRecent(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось загрузить недавно измененные записи');
    }
  };

  useEffect(() => {
    load();
    if (isAdmin) {
      loadUpdatedRecent();
      loadDeletedRecent();
    }
  }, [search]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    try {
      if (editingId) {
        const response = await api.put(`/dns-records/${editingId}`, form);
        setRecords((prev) => prev.map((item) => (item.id === editingId ? response.data : item)));
        setInfo('Запись обновлена. Бэкап создан, админы уведомлены.');
        await loadUpdatedRecent();
      } else {
        const response = await api.post('/dns-records', form);
        setRecords((prev) => [response.data, ...prev]);
        setInfo('Запись добавлена. Админы уведомлены.');
      }

      setForm(initialForm);
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось сохранить DNS-запись');
    }
  };

  const onEdit = (row) => {
    setEditingId(row.id);
    setForm({
      host: row.host,
      type: row.type,
      value: row.value,
      ttl: row.ttl,
      comment: row.comment || ''
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm('Удалить DNS-запись? Будет создан бэкап.')) return;

    try {
      setError('');
      setInfo('');
      await api.delete(`/dns-records/${id}`);
      setRecords((prev) => prev.filter((item) => item.id !== id));
      setInfo('Запись удалена. Бэкап создан, админы уведомлены.');
      await loadDeletedRecent();
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось удалить DNS-запись');
    }
  };

  const checkIntegrity = async (id) => {
    try {
      const response = await api.get(`/dns-records/${id}/integrity`);
      setIntegrityMap((prev) => ({ ...prev, [id]: response.data }));
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось проверить целостность');
    }
  };

  const restoreDeleted = async (backupId) => {
    try {
      setError('');
      setInfo('');
      const response = await api.post(`/dns-records/deleted-recent/${backupId}/restore`);
      const restored = response.data.record;
      setRecords((prev) => [restored, ...prev]);
      setDeletedRecent((prev) => prev.filter((item) => item.id !== backupId));
      setInfo('Удаленная DNS-запись восстановлена');
      await loadUpdatedRecent();
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось восстановить удаленную запись');
    }
  };

  const restoreBackup = async (recordId, backupId) => {
    try {
      setError('');
      setInfo('');
      const response = await api.post(`/dns-records/${recordId}/backups/${backupId}/restore`);
      const restored = response.data.record;
      setRecords((prev) => prev.map((item) => (item.id === restored.id ? restored : item)));
      setInfo('Бэкап DNS-записи восстановлен');
      await loadUpdatedRecent();
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось восстановить бэкап');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>DNS-записи</h1>
      <p><Link to='/dashboard'>Назад в дашборд</Link></p>

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      {info && <p style={{ color: 'green', fontWeight: 'bold' }}>{info}</p>}

      <input
        placeholder='Поиск по host/type/value'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '12px' }}
      />

      {!isGuest && (
        <form onSubmit={submit} style={{ display: 'grid', gap: '8px', marginBottom: '18px' }}>
          <input placeholder='host' value={form.host} onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))} />
          <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
            {dnsTypeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input placeholder='value' value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} />
          <input type='number' placeholder='ttl' value={form.ttl} onChange={(e) => setForm((p) => ({ ...p, ttl: Number(e.target.value) }))} />
          <input placeholder='comment' value={form.comment} onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type='submit'>{editingId ? 'Сохранить изменения' : 'Добавить DNS-запись'}</button>
            {editingId && <button type='button' onClick={() => { setEditingId(null); setForm(initialForm); }}>Отмена</button>}
          </div>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '6px' }}>Host</th>
            <th style={{ border: '1px solid #ccc', padding: '6px' }}>Type</th>
            <th style={{ border: '1px solid #ccc', padding: '6px' }}>Value</th>
            <th style={{ border: '1px solid #ccc', padding: '6px' }}>TTL</th>
            <th style={{ border: '1px solid #ccc', padding: '6px' }}>Комментарий</th>
            <th style={{ border: '1px solid #ccc', padding: '6px' }}>Целостность</th>
            <th style={{ border: '1px solid #ccc', padding: '6px' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {records.map((row) => (
            <tr key={row.id}>
              <td style={{ border: '1px solid #ccc', padding: '6px' }}>{row.host}</td>
              <td style={{ border: '1px solid #ccc', padding: '6px' }}>{row.type}</td>
              <td style={{ border: '1px solid #ccc', padding: '6px' }}>{row.value}</td>
              <td style={{ border: '1px solid #ccc', padding: '6px' }}>{row.ttl}</td>
              <td style={{ border: '1px solid #ccc', padding: '6px' }}>{row.comment}</td>
              <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                {integrityMap[row.id] ? (integrityMap[row.id].valid ? 'OK' : 'Нарушена') : '-'}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={() => checkIntegrity(row.id)}>Проверить</button>
                {!isGuest && <button onClick={() => onEdit(row)}>Изменить</button>}
                {!isGuest && <button onClick={() => onDelete(row.id)}>Удалить</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isAdmin && <div style={{ marginTop: '20px' }}>
        <h2>Недавно измененные DNS-записи</h2>
        {updatedRecent.length === 0 ? (
          <p>Нет измененных записей</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Backup ID</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Record ID</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Host (до изменения)</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Type</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Value</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>TTL</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Изменил</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Когда</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {updatedRecent.map((item) => (
                <tr key={item.id}>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.id}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.dnsRecordId}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.snapshot.host}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.snapshot.type}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.snapshot.value}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.snapshot.ttl}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.changedByUsername || item.changedBy}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.createdAt}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                    {!isGuest && (
                      <button onClick={() => restoreBackup(item.dnsRecordId, item.id)}>
                        Восстановить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>}

      {isAdmin && <div style={{ marginTop: '20px' }}>
        <h2>Недавно удаленные DNS-записи</h2>
        {deletedRecent.length === 0 ? (
          <p>Нет удаленных записей</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Backup ID</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Host</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Type</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Value</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>TTL</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Удалил</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Когда</th>
                <th style={{ border: '1px solid #ccc', padding: '6px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {deletedRecent.map((item) => (
                <tr key={item.id}>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.id}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.snapshot.host}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.snapshot.type}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.snapshot.value}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.snapshot.ttl}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.changedByUsername || item.changedBy}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.createdAt}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                    {!isGuest && <button onClick={() => restoreDeleted(item.id)}>Восстановить</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>}
    </div>
  );
}

export default DnsRecords;
