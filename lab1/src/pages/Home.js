import { Link, useNavigate } from "react-router-dom";
import { useThreats } from "../ThreatContext";
import { useAuth } from "../auth/AuthContext";
import { ClipLoader } from "react-spinners";

function Home() {
  const navigate = useNavigate();
  const { threats, loading, error, isAdmin, isGuest } = useThreats();
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
        <h2 style={{ color: "red" }}>Ошибка</h2>
        <p>{error || "Не удалось загрузить список инцидентов"}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <p><b>Пользователь:</b> {user?.username}</p>
        <button onClick={handleLogout}>Выйти</button>
      </div>

      <h1>
        {isAdmin || isGuest
          ? "Все инциденты информационной безопасности"
          : "Мои инциденты информационной безопасности"}
      </h1>

      {!isGuest && (
        <Link to="/add">
          <button>Добавить инцидент</button>
        </Link>
      )}

      {threats.length === 0 ? (
        <p>{isAdmin || isGuest ? "Список инцидентов пуст" : "У вас пока нет инцидентов"}</p>
      ) : (
        <div style={{ marginTop: "20px" }}>
          {threats.map((threat) => (
            <div
              key={threat.id}
              style={{
                border: "1px solid #ccc",
                padding: "15px",
                marginBottom: "15px",
                borderRadius: "8px"
              }}
            >
              <h3>{threat.title}</h3>
              <p><b>Статус:</b> {threat.status}</p>
              <p><b>Категория:</b> {threat.category}</p>
              <p><b>Критичность:</b> {threat.severity}</p>
              <p><b>Дата и время обнаружения:</b> {threat.detectedAt}</p>
              <p><b>Владелец:</b> {threat.ownerUsername}</p>

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