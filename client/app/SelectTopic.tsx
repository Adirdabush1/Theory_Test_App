import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";

type Topic = string;

type APIResponse = {
  result: {
    records: { category: string }[];
  };
};

export default function SelectTopic() {
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const router = useRouter();

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await axios.get<APIResponse>(
        "https://data.gov.il/api/3/action/datastore_search?resource_id=bf7cb748-f220-474b-a4d5-2d59f93db28d&limit=100"
      );

      const records = res.data.result.records;

      // חילוץ נושאים ייחודיים
      const uniqueTopics: string[] = Array.from(new Set(records.map((r) => r.category))).filter(Boolean) as string[];
      setTopics(uniqueTopics);
    } catch (err) {
      console.error(err);
      alert("לא ניתן לטעון את הנושאים מהשרת");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>בחר נושא</Text>
      {topics.map((topic) => (
        <TouchableOpacity
          key={topic}
          style={styles.topicButton}
          onPress={() => router.push(`/TopicScreen?topic=${encodeURIComponent(topic)}`)}
        >
          <Text style={styles.topicText}>{topic}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  topicButton: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    backgroundColor: "#007bff",
    borderRadius: 10,
    marginBottom: 15,
    width: "100%",
    alignItems: "center",
  },
  topicText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
