import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("xylo_user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem("xylo_token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    const data = response.data;

    localStorage.setItem("xylo_token", data.access_token);
    localStorage.setItem(
      "xylo_user",
      JSON.stringify({
        id: data.user_id,
        name: data.user_name,
        role: data.user_role,
      })
    );

    api.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;

    setUser({
      id: data.user_id,
      name: data.user_name,
      role: data.user_role,
    });
  }

  function logout() {
    localStorage.removeItem("xylo_token");
    localStorage.removeItem("xylo_user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}