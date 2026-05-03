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
  const [status, setStatus] = useState("Новый");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [source, setSource] = useState("");
  const [detectedBy, setDetectedBy] = useState("");
  const [affectedAsset, setAffectedAsset] = useState("");
  const [responsible, setResponsible] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [response, setResponse] = useState("");
  const [detectedAt, setDetectedAt] = useState("");
  const [resolvedAt, setResolvedAt] = useState("");
  const [reporter, setReporter] = useState("");
  const [comment, setComment] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const threat = getThreatById(id);

      if (threat) {
        setTitle(threat.title || "");
        setStatus(threat.status || "Новый");
        setCategory(threat.category || "");
        setSeverity(threat.severity || "");
        setSource(threat.source || "");
        setDetectedBy(threat.detectedBy || "");
        setAffectedAsset(threat.affectedAsset || "");
        setResponsible(threat.responsible || "");
        setDescription(threat.description || "");
        setImpact(threat.impact || "");
        setResponse(threat.response || "");
        setDetectedAt(threat.detectedAt || "");
        setResolvedAt(threat.resolvedAt || "");
        setReporter(threat.reporter || "");
        setComment(threat.comment || "");
      }
    }
  }, [id, isEdit, getThreatById]);

  const validateForm = () => {
    if (!title.trim()) return "Введите название инцидента";
    if (!status.trim()) return "Введите статус";
    if (!category.trim()) return "Введите категорию";
    if (!severity.trim()) return "Введите критичность";
    if (!source.trim()) return "Введите источник";
    if (!detectedBy.trim()) return "Введите способ обнаружения";
    if (!affectedAsset.trim()) return "Введите затронутый актив";
    if (!responsible.trim()) return "Введите ответственного";
    if (!description.trim()) return "Введите описание";
    if (!impact.trim()) return "Введите последствия";
    if (!response.trim()) return "Введите меры реагирования";
    if (!detectedAt.trim()) return "Укажите дату и время обнаружения";
    if (!reporter.trim()) return "Укажите, кто сообщил об инциденте";

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const threatData = {
      title,
      status,
      category,
      severity,
      source,
      detectedBy,
      affectedAsset,
      responsible,
      description,
      impact,
      response,
      detectedAt,
      resolvedAt,
      reporter,
      comment
    };

    try {
      setSaving(true);

      if (isEdit) {
        await updateThreat(id, threatData);
      } else {
        await addThreat(threatData);
      }

      navigate("/");
    } catch (err) {
      if (err.response?.status === 400) setError("Ошибка 400: данные некорректны");
      else if (err.response?.status === 404) setError("Ошибка 404: запись не найдена");
      else if (err.response?.status === 500) setError("Ошибка 500: внутренняя ошибка сервера");
      else setError(err.message || "Не удалось выполнить операцию. Проверьте сервер.");
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
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>{isEdit ? "Редактировать инцидент ИБ" : "Добавить инцидент ИБ"}</h1>

      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
      {saving && (
        <div style={{ display: "flex", justifyContent: "center", padding: "10px" }}>
          <ClipLoader size={30} color="#3498db" />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="text"
          placeholder="Название инцидента"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Новый">Новый</option>
          <option value="В работе">В работе</option>
          <option value="Локализован">Локализован</option>
          <option value="Закрыт">Закрыт</option>
        </select>

        <input
          type="text"
          placeholder="Категория"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          type="text"
          placeholder="Критичность"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        />

        <input
          type="text"
          placeholder="Источник"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />

        <input
          type="text"
          placeholder="Обнаружен кем/чем"
          value={detectedBy}
          onChange={(e) => setDetectedBy(e.target.value)}
        />

        <input
          type="text"
          placeholder="Затронутый актив"
          value={affectedAsset}
          onChange={(e) => setAffectedAsset(e.target.value)}
        />

        <input
          type="text"
          placeholder="Ответственный"
          value={responsible}
          onChange={(e) => setResponsible(e.target.value)}
        />

        <textarea
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <textarea
          placeholder="Последствия"
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
        />

        <textarea
          placeholder="Меры реагирования"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
        />

        <label>
          Дата и время обнаружения:
          <input
            type="datetime-local"
            value={detectedAt}
            onChange={(e) => setDetectedAt(e.target.value)}
            style={{ display: "block", marginTop: "5px", width: "100%" }}
          />
        </label>

        <label>
          Дата устранения:
          <input
            type="date"
            value={resolvedAt}
            onChange={(e) => setResolvedAt(e.target.value)}
            style={{ display: "block", marginTop: "5px", width: "100%" }}
          />
        </label>

        <input
          type="text"
          placeholder="Кто сообщил"
          value={reporter}
          onChange={(e) => setReporter(e.target.value)}
        />

        <textarea
          placeholder="Комментарий"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button type="submit" disabled={saving}>
          {saving ? "Сохранение..." : isEdit ? "Сохранить изменения" : "Сохранить"}
        </button>
      </form>
    </div>
  );
}

export default Form;