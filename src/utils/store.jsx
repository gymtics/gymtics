import React, { useState, useEffect, createContext, useContext } from 'react';

// Use environment variable for API URL (Mobile support), fallback to production if missing
const API_URL = import.meta.env.VITE_API_URL || 'https://gymtics.onrender.com/api';



// --- Auth Context ---
const AuthContext = createContext(null);

import { useToast } from '../components/ToastProvider';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gym_user');
    return saved ? JSON.parse(saved) : null;
  });
  const toast = useToast();

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('gym_user', JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      console.error("Login Error:", err);
      return { success: false, error: `Server error: ${err.message}` };
    }
  };

  const register = async (username, email, phone, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, phone, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('gym_user', JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      console.error("Register Error:", err);
      return { success: false, error: `Server error: ${err.message}` };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gym_user');
  };

  const updateAvatar = async (avatarUrl) => {
    setUser(prev => {
      const updated = { ...prev, avatar: avatarUrl };
      localStorage.setItem('gym_user', JSON.stringify(updated));
      return updated;
    });

    if (user?.id) {
      try {
        console.log("Sending avatar update to server...");
        const res = await fetch(`${API_URL}/auth/update-avatar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, avatar: avatarUrl })
        });
        const data = await res.json();
        console.log("Avatar update response:", data);
        if (!data.success) {
          console.error("Server failed to update avatar:", data.error);
          toast.error("Failed to save avatar: " + data.error);
        }
      } catch (err) {
        console.error("Failed to persist avatar:", err);
        toast.error("Network error saving avatar.");
      }
    }
  };

  const sendOtp = async (method, identifier, type) => {
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, identifier, type })
      });
      const data = await res.json(); // Parse JSON response
      if (data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to send OTP' };
    } catch (err) {
      console.error("Send OTP Error:", err);
      return { success: false, error: `Failed to send OTP: ${err.message}` };
    }
  };

  const verifyOtp = async (identifier, code) => {
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code })
      });
      return await res.json();
    } catch (err) {
      console.error("Verify OTP Error:", err);
      return { success: false, error: `Failed to verify OTP: ${err.message}` };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateAvatar, sendOtp, verifyOtp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


// --- Data Context ---
const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();

  // Helper to load from storage safely
  const loadFromStorage = (key, defaultVal) => {
    if (!user?.id) return defaultVal;
    try {
      const saved = localStorage.getItem(`${key}_${user.id}`);
      return saved ? JSON.parse(saved) : defaultVal;
    } catch (e) {
      console.error(`Failed to load ${key}`, e);
      return defaultVal;
    }
  };

  const [history, setHistory] = useState({});
  const [weightLog, setWeightLog] = useState([]);
  const [prs, setPrs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from LocalStorage when user changes
  useEffect(() => {
    if (user?.id) {
      setHistory(loadFromStorage('gym_history', {}));
      setWeightLog(loadFromStorage('gym_weight', []));
      setPrs(loadFromStorage('gym_prs', {}));
    } else {
      setHistory({});
      setWeightLog([]);
      setPrs({});
    }
  }, [user?.id]);

  // Fetch Data on Load or User Change (Background Sync)
  useEffect(() => {
    if (user?.id) {
      // Don't set loading true here if we already have data, to keep UI snappy
      // But we can keep it if we want to show a spinner. 
      // Better: Only show spinner if NO local data.
      const hasLocalData = localStorage.getItem(`gym_history_${user.id}`);
      if (!hasLocalData) setIsLoading(true);

      Promise.all([
        fetch(`${API_URL}/data/history/${user.id}`).then(res => res.json()),
        fetch(`${API_URL}/data/weight/${user.id}`).then(res => res.json()),
        fetch(`${API_URL}/data/prs/${user.id}`).then(res => res.json())
      ])
        .then(([historyData, weightData, prsData]) => {
          if (historyData.success) {
            setHistory(historyData.history);
            localStorage.setItem(`gym_history_${user.id}`, JSON.stringify(historyData.history));
          }
          if (weightData.success) {
            setWeightLog(weightData.logs);
            localStorage.setItem(`gym_weight_${user.id}`, JSON.stringify(weightData.logs));
          }
          if (prsData.success) {
            setPrs(prsData.prs);
            localStorage.setItem(`gym_prs_${user.id}`, JSON.stringify(prsData.prs));
          }
        })
        .catch(err => {
          console.error("Failed to fetch data (Offline Mode):", err);
          setError("Offline Mode: Changes saved locally.");
          // CRITICAL: Do NOT wipe state here. Keep local data.
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const updateHistory = async (date, newData) => {
    // Optimistic Update & Local Persistence
    setHistory(prev => {
      const updated = { ...prev, [date]: newData };
      if (user?.id) localStorage.setItem(`gym_history_${user.id}`, JSON.stringify(updated));
      return updated;
    });

    // Sync to Server
    if (user?.id) {
      try {
        await fetch(`${API_URL}/data/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            date,
            gymVisited: newData.gymVisited,
            workouts: newData.workouts,
            meals: newData.meals
          })
        });
      } catch (err) {
        console.error("Failed to save log (saved locally):", err);
      }
    }
  };

  const addWeight = async (date, weight) => {
    setWeightLog(prev => {
      const filtered = prev.filter(log => log.date !== date);
      const updated = [...filtered, { date, weight: parseFloat(weight) }].sort((a, b) => new Date(a.date) - new Date(b.date));
      if (user?.id) localStorage.setItem(`gym_weight_${user.id}`, JSON.stringify(updated));
      return updated;
    });

    if (user?.id) {
      try {
        await fetch(`${API_URL}/data/weight`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, date, weight })
        });
      } catch (err) {
        console.error("Failed to save weight (saved locally):", err);
      }
    }
  };

  const deleteWeight = async (date) => {
    setWeightLog(prev => {
      const updated = prev.filter(log => log.date !== date);
      if (user?.id) localStorage.setItem(`gym_weight_${user.id}`, JSON.stringify(updated));
      return updated;
    });

    if (user?.id) {
      try {
        await fetch(`${API_URL}/data/weight`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, date })
        });
      } catch (err) {
        console.error("Failed to delete weight (saved locally):", err);
      }
    }
  };

  const updatePR = async (exercise, weight, reps) => {
    setPrs(prev => {
      const updated = { ...prev, [exercise]: { weight, reps } };
      if (user?.id) localStorage.setItem(`gym_prs_${user.id}`, JSON.stringify(updated));
      return updated;
    });

    if (user?.id) {
      try {
        await fetch(`${API_URL}/data/prs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, exercise, weight, reps })
        });
      } catch (err) {
        console.error("Failed to save PR (saved locally):", err);
      }
    }
  };

  const deletePR = async (exercise) => {
    setPrs(prev => {
      const newPrs = { ...prev };
      delete newPrs[exercise];
      if (user?.id) localStorage.setItem(`gym_prs_${user.id}`, JSON.stringify(newPrs));
      return newPrs;
    });

    if (user?.id) {
      try {
        await fetch(`${API_URL}/data/prs`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, exercise })
        });
      } catch (err) {
        console.error("Failed to delete PR:", err);
      }
    }
  };

  return (
    <DataContext.Provider value={{ history, updateHistory, weightLog, addWeight, deleteWeight, prs, updatePR, isLoading, error, deletePR }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
