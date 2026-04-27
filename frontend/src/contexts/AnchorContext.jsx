import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { dailyAnchorApi } from '../lib/api';
import { useAuth } from './AuthContext';

const AnchorContext = createContext(null);

const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export function AnchorProvider({ children }) {
  const { user, token } = useAuth();
  const [anchor, setAnchor] = useState(null); // { anchor_date, todo_id }
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setAnchor(null);
      setLoaded(true);
      return;
    }
    try {
      const res = await dailyAnchorApi.get();
      setAnchor(res.data);
    } catch (e) {
      setAnchor(null);
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh, user?.id]);

  const setAnchorTodo = async (todoId) => {
    await dailyAnchorApi.set(todayStr(), todoId);
    await refresh();
  };

  const clearAnchor = async () => {
    await dailyAnchorApi.clear();
    await refresh();
  };

  return (
    <AnchorContext.Provider value={{ anchor, loaded, refresh, setAnchorTodo, clearAnchor, todayStr: todayStr() }}>
      {children}
    </AnchorContext.Provider>
  );
}

export function useAnchor() {
  const ctx = useContext(AnchorContext);
  if (!ctx) throw new Error('useAnchor must be used within AnchorProvider');
  return ctx;
}
