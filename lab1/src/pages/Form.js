import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useThreats } from "../ThreatContext";
import { ClipLoader } from "react-spinners";

function Form() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { getThreatById, addThreat, updateThreat, loading } = useThreats();

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [signal, setSignal] = useState("");
  const [description, setDescription] = useState("");
  const [protection, setProtection] = useState("");
  const [lastChecked, setLastChecked] = useState("");
  const [condition, setCondition] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const threat = getThreatById(id);
      if (threat) {
        setTitle(threat.title || "");
        setStatus(threat.status || "");
        setType(threat.type || "");
        setLocation(threat.location || "");
        setSignal(threat.signal || "");
        setDescription(threat.description || "");
        setProtection(threat.protection || "");
        setLastChecked(threat.lastChecked || "");
        setCondition(threat.condition || "");
      }
    }
  }, [id, isEdit, getThreatById]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const threatData = { title, status, type, location, signal, description, protection, lastChecked, condition };

    try {
      setSaving(true);
      if (isEdit) await updateThreat(id, threatData);
      else await addThreat(threatData);
      navigate("/");
    } catch (err) {
      if (err.response?.status === 400) setError("Ошибка 400: данные некорректны");
      else if (err.response?.status === 404) setError("Ошибка 404: запись не найдена");
      else if (err.response?.status === 500) setError("Ошибка 500: внутренняя ошибка сервера");
      else setError("Не удалось выполнить операцию. Проверьте сервер.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
        <ClipLoader size={40} color="#3498db" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>{isEdit ? "Редактировать угрозу" : "Добавить угрозу"}</h1>

      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
      {saving && (
        <div style={{ display: "flex", justifyContent: "center", padding: "10px" }}>
          <ClipLoader size={30} color="#3498db" />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input type="text" placeholder="Название угрозы" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="text" placeholder="Статус" value={status} onChange={(e) => setStatus(e.target.value)} />
        <input type="text" placeholder="Тип угрозы" value={type} onChange={(e) => setType(e.target.value)} />
        <input type="text" placeholder="Источник угрозы" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input type="text" placeholder="Сигнал срабатывания" value={signal} onChange={(e) => setSignal(e.target.value)} />
        <textarea placeholder="Описание" value={description} onChange={(e) => setDescription(e.target.value)} />
        <textarea placeholder="Рекомендации по защите" value={protection} onChange={(e) => setProtection(e.target.value)} />
        <input type="date" value={lastChecked} onChange={(e) => setLastChecked(e.target.value)} />
        <input type="text" placeholder="Состояние угрозы" value={condition} onChange={(e) => setCondition(e.target.value)} />

        <button type="submit" disabled={saving}>{isEdit ? "Сохранить изменения" : "Сохранить"}</button>
      </form>
    </div>
  );
}

export default Form;