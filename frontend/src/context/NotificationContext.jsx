import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const NotificationContext = createContext({ count: 0, refresh: () => {} });

export function NotificationProvider({ children }) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get("/clients/reminders/count");
      setCount(res.data.count);
    } catch {
      // silently fail (user might not be logged in yet)
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <NotificationContext.Provider value={{ count, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
