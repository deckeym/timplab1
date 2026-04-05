import { Link, useNavigate } from "react-router-dom";
import { useThreats } from "../ThreatContext";
import { useAuth } from "../auth/AuthContext";
import { ClipLoader } from "react-spinners";

function Home() {
  const navigate = useNavigate();
  const { threats, loading, error } = useThreats();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
        <ClipLoader size={40} color="#3498db" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ color: "red" }}>Ошибка {error.status || ""}</h2>
        <p>{error.message || "Не удалось загрузить список угроз"}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <p><b>Пользователь:</b> {user?.username}</p>
        <button onClick={handleLogout}>Выйти</button>
      </div>

      <h1>Список интернет-угроз</h1>

      <Link to="/add">
        <button>Добавить угрозу</button>
      </Link>

      {threats.length === 0 ? (
        <p>Список угроз пуст</p>
      ) : (
        <div style={{ marginTop: "20px" }}>
          {threats.map((threat) => (
            <div key={threat.id} style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "15px", borderRadius: "8px" }}>
              <h3>{threat.title}</h3>
              <p><b>Статус:</b> {threat.status}</p>
              <p><b>Тип:</b> {threat.type}</p>
              <p><b>Состояние:</b> {threat.condition}</p>
              <p><b>Дата последней проверки:</b> {threat.lastChecked}</p>

              <Link to={`/detail/${threat.id}`}>
                <button>Подробнее</button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;