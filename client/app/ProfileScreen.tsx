import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { AuthContext } from "../src/context/AuthContext";
import api from "../src/api/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();
  const { user, login, logout } = useContext(AuthContext);

  const [username, setUsername] = useState(user?.username || "");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!username.trim() || !fullName.trim()) {
      return Alert.alert("שגיאה", "אנא מלא את כל השדות");
    }

    setLoading(true);

    try {
      const res = await api.put("/profile", {
        username,
        fullName,
        department,
        password,
      });

      // Keep existing token and update user in context
      const token = await AsyncStorage.getItem('token');
      await login(token || null, res.data);

      Alert.alert("הצלחה", "הפרופיל עודכן בהצלחה 🎉");
    } catch (err: any) {
      Alert.alert("שגיאה", err.response?.data?.message || "ניסיון עדכון נכשל");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/LoginScreen");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>הפרופיל שלי</Text>

      <View style={styles.form}>
        <Text style={styles.label}>שם משתמש</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>שם מלא</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

        <Text style={styles.label}>סיסמה חדשה</Text>
        <TextInput
          style={styles.input}
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          placeholder="לא חובה"
        />

        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.updateText}>עדכן פרופיל</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>התנתקות</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#1E293B",
  },
  form: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    marginBottom: 6,
    color: "#475569",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#F8FAFC",
  },
  updateBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  updateText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutBtn: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
