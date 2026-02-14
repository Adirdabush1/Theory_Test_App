import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use the deployed server URL (Render) for all platforms
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://theory-test-app-server.onrender.com"; // override with env if needed

// יצירת Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// פונקציה להוספת/הסרת Authorization token
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Global interceptor to handle 401 (unauthorized) responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      try {
        // Clear token from axios headers and local storage
        setAuthToken(null);
        await AsyncStorage.removeItem('token');
      } catch (e) {
        // ignore errors
      }
    }
    return Promise.reject(error);
  }
);

// מסלולים מובנים ל-backend
export const API_ROUTES = {
  AUTH: "/api/auth",
  AI_ASK: "/api/ai/ask",
  // NOTE: Render deployment does not expose root `/api/questions` so use `/api/questions/all`
  QUESTIONS: "/api/questions/all",
  QUESTIONS_BY_LICENSE: (type: string) => `/api/questions/by-license/${type}`, // 🚀 חדש
  RANDOM_QUESTION: "/api/questions/random",
  FULLTEST: {
    SUBMIT: "/api/test/submit",
    HISTORY: "/api/test/history",
  },
  GET_USER_POINTS: "/api/user-points",
};

export default api;
