import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const ThreatContext = createContext();

export function ThreatProvider({ children }) {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = "http://localhost:5000/threats";

  const fetchThreats = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API_URL, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      setThreats(response.data);
    } catch (err) {
      console.error("Ошибка при загрузке угроз:", err);
      setError("Не удалось загрузить список угроз");
    } finally {
      setLoading(false);
    }
  };

  const getThreatById = (id) => {
    return threats.find((item) => String(item.id) === String(id));
  };

  const addThreat = async (threatData) => {
    const response = await axios.post(API_URL, threatData, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    setThreats((prev) => [...prev, response.data]);
    return response.data;
  };

  const updateThreat = async (id, threatData) => {
    const response = await axios.put(`${API_URL}/${id}`, threatData, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    setThreats((prev) =>
      prev.map((item) => (String(item.id) === String(id) ? response.data : item))
    );

    return response.data;
  };

  const deleteThreat = async (id) => {
    await axios.delete(`${API_URL}/${id}`, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    setThreats((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  useEffect(() => {
    fetchThreats();
  }, []);

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
        deleteThreat
      }}
    >
      {children}
    </ThreatContext.Provider>
  );
}

export function useThreats() {
  return useContext(ThreatContext);
}