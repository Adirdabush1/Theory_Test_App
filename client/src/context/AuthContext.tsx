import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useEffect, useState } from 'react';
import api, { API_ROUTES, setAuthToken } from '../api/api';
import { IUser } from '../types/User';


// הוספת points לשדה המשתמש
export interface IUserWithPoints extends IUser {
  userPoints?: number; // נקודות המשתמש, אופציונלי
}

// הגדרת סוגי ההקשר כולל updatePoints ו-loadingAuthState
interface AuthContextProps {
  user: IUserWithPoints | null;
  login: (token: string | null, user: IUserWithPoints) => Promise<void>;
  logout: () => Promise<void>;
  updatePoints?: (userPoints: number) => void;
  loadingAuthState: boolean; // מצב טעינה של המשתמש
}

// יצירת הקשר עם ערכי ברירת מחדל
export const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: async () => {},
  logout: async () => {},
  updatePoints: () => {},
  loadingAuthState: true,
});

// ספק ההקשר שמנהל את מצב האותנטיקציה והטוקן
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUserWithPoints | null>(null);
  const [loadingAuthState, setLoadingAuthState] = useState(true); // מצב טעינה בתחילת הריצה

  // טוען אוטומטית Token ומידע משתמש מהאחסון
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');

        if (token) setAuthToken(token);
        if (userData) {
          const parsedUser = JSON.parse(userData);
          // מיפוי userPoints ל-points
          setUser({ ...parsedUser, userPoints: parsedUser.userPoints || 0 });
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setLoadingAuthState(false);
      }
    };

    loadUser();
  }, []);
useEffect(() => {
  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) setAuthToken(token);

      const userData = await AsyncStorage.getItem("user");
      let parsedUser: IUserWithPoints | null = null;
      if (userData) parsedUser = JSON.parse(userData);

      if (parsedUser) {
        // If there is no token (e.g., Guest) don't call protected endpoints
        if (!token || parsedUser._id === 'guest') {
          setUser({ ...parsedUser, userPoints: parsedUser.userPoints || 0 });
          return;
        }

        // מושך נקודות מהשרת רק אם יש token
        try {
          const response = await api.get(`${API_ROUTES.GET_USER_POINTS}/${parsedUser._id}`);
          const userPoints = response.data.userPoints;
          const updatedUser = { ...parsedUser, userPoints };
          setUser(updatedUser);
          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (err: any) {
          console.error("Error fetching user points:", err);

          // If unauthorized, clear auth and prompt re-login
          if (err?.response?.status === 401) {
            console.warn('Token invalid or expired. Clearing saved credentials.');
            setAuthToken(null);
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setUser(null);
          } else {
            setUser({ ...parsedUser, userPoints: parsedUser.userPoints || 0 });
          }
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoadingAuthState(false);
    }
  };

  loadUser();
}, []);

  // פונקציה לטיפול בלוגין
  const login = async (token: string | null, userData: IUserWithPoints) => {
    // set or remove auth token
    if (token) {
      setAuthToken(token);
      await AsyncStorage.setItem('token', token);
    } else {
      setAuthToken(null);
      await AsyncStorage.removeItem('token');
    }

    // Prefer points returned from login response to avoid an extra protected request
    // Fall back to fetching points only if they are missing
    let updatedUser = { ...userData, userPoints: userData.userPoints ?? 0 };

    if (token && (userData.userPoints === undefined || userData.userPoints === null)) {
      try {
        const res = await api.get(`${API_ROUTES.GET_USER_POINTS}/${updatedUser._id}`);
        updatedUser = { ...updatedUser, userPoints: res.data.userPoints };
      } catch (err) {
        console.error('Error fetching user points on login (non-fatal):', err);
        // don't clear token here — keep the login state intact
      }
    }

    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // פונקציה לטיפול בלוגאוט
  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');

    setAuthToken(null);
    setUser(null);
  };

  // פונקציה לעדכון נקודות בזמן אמת
  const updatePoints = (userPoints: number) => {
    if (user) {
      const updatedUser = { ...user,  userPoints };
      setUser(updatedUser);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updatePoints, loadingAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};
