import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("authUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const register = async ({ username, email, password }) => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    const existingUsers = await axios.get("http://localhost:5000/users", {
      headers: {
        "Content-Type": "application/json"
      }
    });

    const userExists = existingUsers.data.find(
      (item) =>
        String(item.email).trim() === cleanEmail ||
        String(item.username).trim() === cleanUsername
    );

    if (userExists) {
      throw new Error("Пользователь с таким логином или email уже существует");
    }

    const response = await axios.post(
      "http://localhost:5000/users",
      {
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPassword
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  };

  const login = async ({ username, password }) => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    const response = await axios.get("http://localhost:5000/users", {
      headers: {
        "Content-Type": "application/json"
      }
    });

    const foundUser = response.data.find(
      (item) =>
        String(item.username).trim() === cleanUsername &&
        String(item.password).trim() === cleanPassword
    );

    if (!foundUser) {
      throw new Error("Неверный логин или пароль");
    }

    setUser(foundUser);
    localStorage.setItem("authUser", JSON.stringify(foundUser));

    return foundUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authUser");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        register,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}