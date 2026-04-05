import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useThreats } from "../ThreatContext"; 
import { ClipLoader } from "react-spinners";

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getThreatById, deleteThreat, loading } = useThreats();

  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const threat = getThreatById(id);

  const handleDelete = async () => {
    try {
      setError("");
      setDeleting(true);
      await deleteThreat(id);
      navigate("/");
    } catch (err) {
      if (err.response?.status === 404) setError("Ошибка 404: запись не найдена");
      else if (err.response?.status === 500) setError("Ошибка 500: ошибка сервера");
      else setError("Не удалось удалить угрозу");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
        <ClipLoader size={40} color="#3498db" />
      </div>
    );
  }

  if (!threat) return <h2 style={{ padding: "20px" }}>Угроза не найдена</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Детали угрозы</h1>

      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
      {deleting && (
        <div style={{ display: "flex", justifyContent: "center", padding: "10px" }}>
          <ClipLoader size={30} color="#3498db" />
        </div>
      )}

      <div style={{ display: "flex", gap: "50px", marginTop: "20px" }}>
        {}
        <div style={{ flex: 1 }}>
          <p><b>ID:</b> {threat.id}</p>
          <p><b>Название:</b> {threat.title}</p>
          <p><b>Статус:</b> {threat.status}</p>
          <p><b>Тип:</b> {threat.type}</p>
          <p><b>Источник:</b> {threat.location}</p>
          <p><b>Сигнал срабатывания:</b> {threat.signal}</p>
          <p><b>Описание:</b> {threat.description}</p>
          <p><b>Рекомендации по защите:</b> {threat.protection}</p>
          <p><b>Дата последней проверки:</b> {threat.lastChecked}</p>
          <p><b>Состояние угрозы:</b> {threat.condition}</p>

          <div style={{ marginTop: "20px" }}>
            <button style={{ marginRight: "10px" }} onClick={() => navigate(`/edit/${threat.id}`)}>
              Редактировать
            </button>
            <button onClick={handleDelete} disabled={deleting}>
              {deleting ? "Удаление..." : "Удалить"}
            </button>
          </div>
        </div>

        {}
        <div style={{ flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ccc" }}>
            <thead>
              <tr>
                <th colSpan="2" style={{ textAlign: "center", borderBottom: "1px solid #ccc" }}>
                  Сводная информация
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>ID</b></td>
                <td>{threat.id}</td>
              </tr>
              <tr>
                <td><b>Название</b></td>
                <td>{threat.title}</td>
              </tr>
              <tr>
                <td><b>Статус</b></td>
                <td>{threat.status}</td>
              </tr>
              <tr>
                <td><b>Тип</b></td>
                <td>{threat.type}</td>
              </tr>
              <tr>
                <td><b>Источник</b></td>
                <td>{threat.location}</td>
              </tr>
              <tr>
                <td><b>Сигнал срабатывания</b></td>
                <td>{threat.signal}</td>
              </tr>
              <tr>
                <td><b>Описание</b></td>
                <td>{threat.description}</td>
              </tr>
              <tr>
                <td><b>Рекомендации по защите</b></td>
                <td>{threat.protection}</td>
              </tr>
              <tr>
                <td><b>Дата последней проверки</b></td>
                <td>{threat.lastChecked}</td>
              </tr>
              <tr>
                <td><b>Состояние угрозы</b></td>
                <td>{threat.condition}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Detail;