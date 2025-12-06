import React, { useState, useEffect, createContext, useContext } from 'react';

const API_URL = '/api';



// --- Auth Context ---
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = window.localStorage.getItem('gym_app_user');
    return saved ? JSON.parse(saved) : null;
  });

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
        window.localStorage.setItem('gym_app_user', JSON.stringify(data.user));
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
        window.localStorage.setItem('gym_app_user', JSON.stringify(data.user));
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
    window.localStorage.removeItem('gym_app_user');
  };

  const updateAvatar = async (avatarUrl) => {
    // Optimistic update
    const updatedUser = { ...user, avatar: avatarUrl };
    setUser(updatedUser);
    window.localStorage.setItem('gym_app_user', JSON.stringify(updatedUser));

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
          alert("Failed to save avatar: " + data.error);
        }
      } catch (err) {
        console.error("Failed to persist avatar:", err);
        alert("Network error saving avatar.");
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
  const [history, setHistory] = useState({});
  const [weightLog, setWeightLog] = useState([]);
  const [prs, setPrs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Data on Load or User Change
  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      Promise.all([
        fetch(`${API_URL}/data/history/${user.id}`).then(res => res.json()),
        fetch(`${API_URL}/data/weight/${user.id}`).then(res => res.json()),
        fetch(`${API_URL}/data/prs/${user.id}`).then(res => res.json())
      ])
        .then(([historyData, weightData, prsData]) => {
          if (historyData.success) setHistory(historyData.history);
          if (weightData.success) setWeightLog(weightData.logs);
          if (prsData.success) setPrs(prsData.prs);
        })
        .catch(err => {
          console.error("Failed to fetch data:", err);
          setError("Failed to load data. Please check your connection.");
          setHistory({}); // Prevent undefined history
        })
        .finally(() => setIsLoading(false));
    } else {
      // If no user, reset data but stop loading
      setHistory({});
      setWeightLog([]);
      setPrs({});
      setIsLoading(false);
    }
  }, [user?.id]);

  const updateHistory = async (date, newData) => {
    // Optimistic Update
    setHistory(prev => ({ ...prev, [date]: newData }));

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
        console.error("Failed to save log:", err);
      }
    }
  };

  const addWeight = async (date, weight) => {
    const newLog = { date, weight: parseFloat(weight) };
    setWeightLog(prev => [...prev, newLog].sort((a, b) => new Date(a.date) - new Date(b.date)));

    if (user?.id) {
      try {
        await fetch(`${API_URL}/data/weight`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, date, weight })
        });
      } catch (err) {
        console.error("Failed to save weight:", err);
      }
    }
  };

  const updatePR = async (exercise, weight, reps) => {
    setPrs(prev => ({ ...prev, [exercise]: { weight, reps } }));

    if (user?.id) {
      try {
        await fetch(`${API_URL}/data/prs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, exercise, weight, reps })
        });
      } catch (err) {
        console.error("Failed to save PR:", err);
      }
    }
  };

  return (
    <DataContext.Provider value={{ history, updateHistory, weightLog, addWeight, prs, updatePR, isLoading, error }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
