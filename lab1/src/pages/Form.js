import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useThreats } from '../ThreatContext';

const initialState = {
  title: '',
  status: 'Новый',
  category: '',
  severity: '',
  source: '',
  detectedBy: '',
  affectedAsset: '',
  responsible: '',
  description: '',
  impact: '',
  response: '',
  detectedAt: '',
  resolvedAt: '',
  reporter: '',
  comment: ''
};

function Form() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { getThreatById, addThreat, updateThreat } = useThreats();

  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;

    const load = async () => {
      try {
        const response = await getThreatById(id);
        setFormData({ ...initialState, ...response });
      } catch (err) {
        setError(err.response?.data?.message || 'Не удалось загрузить инцидент');
      }
    };

    load();
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isEdit) {
        await updateThreat(id, formData);
      } else {
        await addThreat(formData);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось сохранить данные');
    }
  };

  const setField = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <div style={{ padding: '20px', maxWidth: '760px', margin: '0 auto' }}>
      <h1>{isEdit ? 'Редактирование инцидента' : 'Новый инцидент'}</h1>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '8px' }}>
        <input placeholder='Название' value={formData.title} onChange={(e) => setField('title', e.target.value)} />
        <input placeholder='Статус' value={formData.status} onChange={(e) => setField('status', e.target.value)} />
        <input placeholder='Категория' value={formData.category} onChange={(e) => setField('category', e.target.value)} />
        <input placeholder='Критичность' value={formData.severity} onChange={(e) => setField('severity', e.target.value)} />
        <input placeholder='Источник' value={formData.source} onChange={(e) => setField('source', e.target.value)} />
        <input placeholder='Обнаружен кем/чем' value={formData.detectedBy} onChange={(e) => setField('detectedBy', e.target.value)} />
        <input placeholder='Затронутый актив' value={formData.affectedAsset} onChange={(e) => setField('affectedAsset', e.target.value)} />
        <input placeholder='Ответственный' value={formData.responsible} onChange={(e) => setField('responsible', e.target.value)} />
        <textarea placeholder='Описание' value={formData.description} onChange={(e) => setField('description', e.target.value)} />
        <textarea placeholder='Последствия' value={formData.impact} onChange={(e) => setField('impact', e.target.value)} />
        <textarea placeholder='Меры реагирования' value={formData.response} onChange={(e) => setField('response', e.target.value)} />
        <input type='datetime-local' value={formData.detectedAt} onChange={(e) => setField('detectedAt', e.target.value)} />
        <input type='date' value={formData.resolvedAt || ''} onChange={(e) => setField('resolvedAt', e.target.value)} />
        <input placeholder='Кто сообщил' value={formData.reporter} onChange={(e) => setField('reporter', e.target.value)} />
        <textarea placeholder='Комментарий' value={formData.comment || ''} onChange={(e) => setField('comment', e.target.value)} />
        <button type='submit'>{isEdit ? 'Сохранить' : 'Создать'}</button>
      </form>
    </div>
  );
}

export default Form;
