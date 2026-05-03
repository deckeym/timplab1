import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useThreats } from "../ThreatContext";
import { ClipLoader } from "react-spinners";

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getThreatById, deleteThreat, loading, isAdmin, canEditThreat } = useThreats();

  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const threat = getThreatById(id);
  const canEdit = canEditThreat(threat);

  const handleDelete = async () => {
    try {
      setError("");
      setDeleting(true);
      await deleteThreat(id);
      navigate("/");
    } catch (err) {
      if (err.response?.status === 404) setError("Ошибка 404: запись не найдена");
      else if (err.response?.status === 500) setError("Ошибка 500: ошибка сервера");
      else setError(err.message || "Не удалось удалить инцидент");
    } finally {
      setDeleting(false);
    }
  };

  const handleSendEmail = () => {
    if (!threat) return;

    const to = threat.notificationEmail || "recipient@example.com";
    const subject = `Статус инцидента ИБ: ${threat.title}`;

    const body = `
Здравствуйте!

Направляю информацию по инциденту информационной безопасности.

ID: ${threat.id}
Название: ${threat.title}
Статус: ${threat.status}
Категория: ${threat.category}
Критичность: ${threat.severity}
Источник: ${threat.source}
Обнаружен: ${threat.detectedBy}
Затронутый актив: ${threat.affectedAsset}
Ответственный: ${threat.responsible}
Владелец инцидента: ${threat.ownerUsername}
Описание: ${threat.description}
Последствия: ${threat.impact}
Меры реагирования: ${threat.response}
Дата и время обнаружения: ${threat.detectedAt}
Дата устранения: ${threat.resolvedAt || "Не устранен"}
Кто сообщил: ${threat.reporter}
Комментарий: ${threat.comment || "Нет комментария"}

Письмо сформировано автоматически из SPA-приложения.
    `.trim();

    const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
        <ClipLoader size={40} color="#3498db" />
      </div>
    );
  }

  if (!threat) {
    return <h2 style={{ padding: "20px" }}>Инцидент не найден или недоступен</h2>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Детали инцидента ИБ</h1>

      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
      {deleting && (
        <div style={{ display: "flex", justifyContent: "center", padding: "10px" }}>
          <ClipLoader size={30} color="#3498db" />
        </div>
      )}

      <div style={{ display: "flex", gap: "50px", marginTop: "20px" }}>
        <div style={{ flex: 1 }}>
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
          <p><b>Email для уведомлений:</b> {threat.notificationEmail}</p>
          <p><b>Описание:</b> {threat.description}</p>
          <p><b>Последствия:</b> {threat.impact}</p>
          <p><b>Меры реагирования:</b> {threat.response}</p>
          <p><b>Дата и время обнаружения:</b> {threat.detectedAt}</p>
          <p><b>Дата устранения:</b> {threat.resolvedAt || "Не устранен"}</p>
          <p><b>Кто сообщил:</b> {threat.reporter}</p>
          <p><b>Комментарий:</b> {threat.comment}</p>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {canEdit && (
              <button onClick={() => navigate(`/edit/${threat.id}`)}>
                Редактировать
              </button>
            )}

            {isAdmin && (
              <button onClick={handleDelete} disabled={deleting}>
                {deleting ? "Удаление..." : "Удалить"}
              </button>
            )}

            <button onClick={handleSendEmail}>
              Отправить статус на почту
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #ccc"
            }}
          >
            <thead>
              <tr>
                <th
                  colSpan="2"
                  style={{
                    textAlign: "center",
                    borderBottom: "1px solid #ccc",
                    padding: "8px"
                  }}
                >
                  Сводная информация
                </th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>ID</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.id}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Название</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.title}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Статус</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.status}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Категория</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.category}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Критичность</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.severity}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Источник</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.source}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Обнаружен</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.detectedBy}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Актив</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.affectedAsset}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Ответственный</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.responsible}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Владелец</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.ownerUsername}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Email</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.notificationEmail}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Дата и время обнаружения</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.detectedAt}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Дата устранения</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.resolvedAt || "Не устранен"}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Кто сообщил</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.reporter}</td></tr>
              <tr><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}><b>Уведомление отправлено</b></td><td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{threat.statusReminderSent ? "Да" : "Нет"}</td></tr>
              <tr><td style={{ padding: "8px", verticalAlign: "top" }}><b>Комментарий</b></td><td style={{ padding: "8px" }}>{threat.comment}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Detail;