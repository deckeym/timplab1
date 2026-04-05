import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const validateForm = () => {
    if (!username.trim()) {
      return "Введите имя пользователя";
    }

    if (username.includes(" ")) {
      return "Имя пользователя не должно содержать пробелы";
    }

    if (!password.trim()) {
      return "Введите пароль";
    }

    if (password.includes(" ")) {
      return "Пароль не должен содержать пробелы";
    }

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

    try {
      await login({ username, password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Ошибка входа");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Вход</h1>

      {error && (
        <p style={{ color: "red", marginBottom: "15px", fontWeight: "bold" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <button type="submit">Войти</button>
      </form>

      <p style={{ marginTop: "15px" }}>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}

export default Login;