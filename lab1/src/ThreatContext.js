import { createContext, useContext, useState } from 'react';
import api from './api';
import { useAuth } from './auth/AuthContext';

const ThreatContext = createContext();

export function ThreatProvider({ children }) {
  const { user } = useAuth();
  const [threats, setThreats] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';
  const isGuest = user?.role === 'guest';

  const fetchThreats = async (params = {}) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/threats', { params });
      setThreats(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось загрузить список инцидентов');
    } finally {
      setLoading(false);
    }
  };

  const getThreatById = async (id) => {
    const response = await api.get(`/threats/${id}`);
    return response.data;
  };

  const addThreat = async (threatData) => {
    const response = await api.post('/threats', threatData);
    return response.data;
  };

  const updateThreat = async (id, threatData) => {
    const response = await api.put(`/threats/${id}`, threatData);
    return response.data;
  };

  const deleteThreat = async (id) => {
    await api.delete(`/threats/${id}`);
  };

  const notifyThreat = async (id) => {
    const response = await api.post(`/threats/${id}/notify`);
    return response.data;
  };

  const canEditThreat = (threat) => {
    if (!user || !threat) return false;
    if (isAdmin) return true;
    if (isGuest) return false;
    return Number(threat.ownerId) === Number(user.id);
  };

  return (
    <ThreatContext.Provider
      value={{
        threats,
        pagination,
        loading,
        error,
        fetchThreats,
        getThreatById,
        addThreat,
        updateThreat,
        deleteThreat,
        notifyThreat,
        isAdmin,
        isGuest,
        canEditThreat
      }}
    >
      {children}
    </ThreatContext.Provider>
  );
}

export function useThreats() {
  return useContext(ThreatContext);
}
