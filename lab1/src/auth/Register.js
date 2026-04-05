import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateForm = () => {
    if (!username.trim()) {
      return "Введите имя пользователя";
    }

    if (username.includes(" ")) {
      return "Имя пользователя не должно содержать пробелы";
    }

    if (!email.trim()) {
      return "Введите электронную почту";
    }

    if (email.includes(" ")) {
      return "Электронная почта не должна содержать пробелы";
    }

    if (!email.includes("@")) {
      return "Электронная почта должна содержать символ @";
    }

    const parts = email.split("@");

    if (!parts[1]) {
      return "После символа @ должна быть доменная часть";
    }

    if (!parts[1].includes(".")) {
      return "Доменная часть электронной почты должна содержать точку";
    }

    if (!password.trim()) {
      return "Введите пароль";
    }

    if (password.includes(" ")) {
      return "Пароль не должен содержать пробелы";
    }

    if (password.length < 4) {
      return "Пароль должен содержать не менее 4 символов";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await register({ username, email, password });
      setSuccess("Регистрация прошла успешно");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err.message || "Не удалось зарегистрировать пользователя");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Регистрация</h1>

      {error && (
        <p style={{ color: "red", marginBottom: "15px", fontWeight: "bold" }}>
          {error}
        </p>
      )}

      {success && (
        <p style={{ color: "green", marginBottom: "15px", fontWeight: "bold" }}>
          {success}
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
            type="text"
            placeholder="Электронная почта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

        <button type="submit">Зарегистрироваться</button>
      </form>

      <p style={{ marginTop: "15px" }}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}

export default Register;