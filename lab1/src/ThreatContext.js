import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./auth/AuthContext";

const ThreatContext = createContext();

export function ThreatProvider({ children }) {
  const { user } = useAuth();

  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = "http://localhost:5000/threats";

  const isAdmin = user?.username === "admin";
  const isGuest = user?.username === "guest";
  const canViewAll = isAdmin || isGuest;

  const fetchThreats = async () => {
    if (!user?.id) {
      setThreats([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const url = canViewAll
        ? API_URL
        : `${API_URL}?ownerId=${encodeURIComponent(String(user.id))}`;

      const response = await axios.get(url, {
        headers: { "Content-Type": "application/json" }
      });

      setThreats(response.data);
    } catch (err) {
      console.error("Ошибка при загрузке инцидентов:", err);
      setError("Не удалось загрузить список инцидентов");
    } finally {
      setLoading(false);
    }
  };

  const getThreatById = (id) => {
    return threats.find((item) => String(item.id) === String(id));
  };

  const canEditThreat = (threat) => {
    if (!user || !threat) return false;
    if (isAdmin) return true;
    if (isGuest) return false;
    return String(threat.ownerId) === String(user.id);
  };

  const addThreat = async (threatData) => {
    if (!user?.id) {
      throw new Error("Пользователь не авторизован");
    }

    if (isGuest) {
      throw new Error("Гостевой пользователь не может создавать инциденты");
    }

    const payload = {
      ...threatData,
      ownerId: String(user.id),
      ownerUsername: user.username,
      notificationEmail: user.email || "",
      statusReminderSent: false
    };

    const response = await axios.post(API_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });

    setThreats((prev) => [...prev, response.data]);
    return response.data;
  };

  const updateThreat = async (id, threatData) => {
    const currentThreat = getThreatById(id);

    if (!currentThreat) {
      throw new Error("Инцидент не найден или недоступен");
    }

    if (!canEditThreat(currentThreat)) {
      throw new Error("Недостаточно прав для редактирования этого инцидента");
    }

    const statusChanged = String(currentThreat.status) !== String(threatData.status);

    const payload = {
      ...threatData,
      ownerId: currentThreat.ownerId,
      ownerUsername: currentThreat.ownerUsername,
      notificationEmail: currentThreat.notificationEmail || "",
      statusReminderSent: statusChanged
        ? true
        : Boolean(currentThreat.statusReminderSent)
    };

    const response = await axios.put(`${API_URL}/${id}`, payload, {
      headers: { "Content-Type": "application/json" }
    });

    setThreats((prev) =>
      prev.map((item) => (String(item.id) === String(id) ? response.data : item))
    );

    return response.data;
  };

  const deleteThreat = async (id) => {
    const currentThreat = getThreatById(id);

    if (!currentThreat) {
      throw new Error("Инцидент не найден или недоступен");
    }

    if (!isAdmin) {
      throw new Error("Удалять инциденты может только администратор");
    }

    await axios.delete(`${API_URL}/${id}`, {
      headers: { "Content-Type": "application/json" }
    });

    setThreats((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  useEffect(() => {
    fetchThreats();
  }, [user]);

  return (
    <ThreatContext.Provider
      value={{
        threats,
        loading,
        error,
        fetchThreats,
        getThreatById,
        addThreat,
        updateThreat,
        deleteThreat,
        isAdmin,
        isGuest,
        canViewAll,
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