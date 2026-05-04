import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useThreats } from '../ThreatContext';

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getThreatById, deleteThreat, notifyThreat, isAdmin, canEditThreat } = useThreats();

  const [threat, setThreat] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getThreatById(id);
        setThreat(response);
      } catch (err) {
        setError(err.response?.data?.message || 'Не удалось получить инцидент');
      }
    };

    load();
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteThreat(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось удалить инцидент');
    }
  };

  const handleNotify = async () => {
    try {
      setError('');
      setSuccess('');
      await notifyThreat(id);
      setSuccess('Письмо успешно отправлено');
      setThreat((prev) => (prev ? { ...prev, statusReminderSent: true } : prev));
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось отправить письмо');
    }
  };

  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  if (!threat) return <div style={{ padding: '20px' }}>Загрузка...</div>;

  const canEdit = canEditThreat(threat);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Детали инцидента ИБ</h1>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      {success && <p style={{ color: 'green', fontWeight: 'bold' }}>{success}</p>}
      <p><b>ID:</b> {threat.id}</p>
      <p><b>Название:</b> {threat.title}</p>
      <p><b>Статус:</b> {threat.status}</p>
      <p><b>Категория:</b> {threat.category}</p>
      <p><b>Критичность:</b> {threat.severity}</p>
      <p><b>Источник:</b> {threat.source}</p>
      <p><b>Обнаружен:</b> {threat.detectedBy}</p>
      <p><b>Затронутый актив:</b> {threat.affectedAsset}</p>
      <p><b>Ответственный:</b> {threat.responsible}</p>
      <p><b>Владелец:</b> {threat.ownerUsername}</p>
      <p><b>Email для уведомлений:</b> {threat.notificationEmail || '-'}</p>
      <p><b>Описание:</b> {threat.description}</p>
      <p><b>Последствия:</b> {threat.impact}</p>
      <p><b>Меры:</b> {threat.response}</p>
      <p><b>Дата и время обнаружения:</b> {threat.detectedAt}</p>
      <p><b>Дата устранения:</b> {threat.resolvedAt || 'Не устранен'}</p>
      <p><b>Кто сообщил:</b> {threat.reporter}</p>
      <p><b>Комментарий:</b> {threat.comment || '-'}</p>
      <p><b>Уведомление отправлено:</b> {threat.statusReminderSent ? 'Да' : 'Нет'}</p>

      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        {canEdit && <button onClick={() => navigate(`/edit/${threat.id}`)}>Редактировать</button>}
        {isAdmin && <button onClick={handleDelete}>Удалить</button>}
        {canEdit && <button onClick={handleNotify}>Отправить на почту</button>}
        <Link to='/dashboard'>Назад</Link>
      </div>
    </div>
  );
}

export default Detail;
