import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import api from "../src/api/api";

type LeaderboardUser = {
  _id: string;
  username?: string;
  fullName?: string;
  userPoints?: number;
};

export default function LeaderboardScreen() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(" calling /api/points/leaderboard");
        const res = await api.get("api/points/leaderboard");
        console.log(" leaderboard data:", res.data);

        setUsers(res.data);
      } catch (e: any) {
        console.log(" error loading leaderboard:", e?.response || e);
        setError("שגיאה בטעינת לוח הדירוגים");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>לוח דירוגים</Text>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text>טוען דירוגים...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      {!loading && !error && users.length === 0 && (
        <View style={styles.center}>
          <Text>אין עדיין נתוני דירוג</Text>
        </View>
      )}

      {!loading && !error && users.length > 0 && (
        <View style={{ marginTop: 10 }}>
          {users.map((u, i) => (
            <View
              key={u._id ?? i}
              style={styles.row}
            >
              <Text style={styles.place}>{i + 1}</Text>
              <Text style={styles.name}>{u.fullName || u.username || "Unknown"}</Text>
              <Text style={styles.points}>{u.userPoints ?? 0}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  center: {
    marginTop: 20,
    alignItems: "center",
  },
  error: {
    color: "red",
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  place: {
    width: 40,
    textAlign: "center",
    fontWeight: "700",
  },
  name: {
    flex: 1,
    textAlign: "left",
  },
  points: {
    width: 80,
    textAlign: "center",
    fontWeight: "600",
  },
});
