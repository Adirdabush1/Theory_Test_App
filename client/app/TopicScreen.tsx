import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type PracticeItem = {
  id?: string;
  title2?: string;
  description4?: string;
  category?: string;
};

type ParsedQuestion = {
  question: string;
  correctAnswer: string;
  images?: string[];
};

export default function TopicScreen() {
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [practices, setPractices] = useState<PracticeItem[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<ParsedQuestion | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchPractices = async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ result: { records: PracticeItem[] } }>(
        "https://data.gov.il/api/3/action/datastore_search?resource_id=bf7cb748-f220-474b-a4d5-2d59f93db28d&limit=100"
      );
      const records: PracticeItem[] = res.data?.result?.records || [];
      const filtered = records.filter((p) => (p.category || "") === topic);
      setPractices(filtered);
    } catch (err) {
      console.error(err);
      alert("לא ניתן לטעון את השאלות עכשיו. אנא נסה שוב מאוחר יותר.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPractices();
  }, [topic]);

  const parseQuestion = (html: string): ParsedQuestion => {
    const questionMatch = html.match(/<h1.*?>(.*?)<\/h1>/) || html.match(/<p.*?>(.*?)<\/p>/);
    const questionText = questionMatch ? questionMatch[1] : "";

    const correctMatch = html.match(/<span id="correctAnswer.*?">(.*?)<\/span>/);
    const correctAnswer = correctMatch ? correctMatch[1] : "";

    const imgMatches = html.match(/<img.*?src="(.*?)".*?>/g) || [];
    const images = imgMatches.map((img) => {
      const srcMatch = img.match(/src="(.*?)"/);
      return srcMatch ? srcMatch[1] : "";
    });

    return { question: questionText, correctAnswer, images };
  };

  const handlePress = (item: PracticeItem) => {
    const parsed = parseQuestion(item.description4 || "");

    // אם אין שאלה ב-HTML אך יש כותרת, נשתמש בכותרת כתוכן
    if (!parsed.question && item.title2) {
     setSelectedQuestion({
    question: parsed.question || item.title2 || "אין שאלה",
    correctAnswer: parsed.correctAnswer || "",
    images: parsed.images?.length ? parsed.images : [require("../assets/images/logo.png")],
  });

    } else {
      // אם אין תמונה בכלל, נשים לוגו ברירת מחדל
      if (!parsed.images?.length) parsed.images = [require("../assets/images/logo.png")];
      setSelectedQuestion(parsed);
    }

    setShowModal(true);
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{topic || "תרגולות ושאלות"}</Text>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← חזרה לקטגוריות</Text>
      </TouchableOpacity>

      <FlatList
        data={practices}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        numColumns={2}
        renderItem={({ item }) => {
          const parsed = parseQuestion(item.description4 || "");
          const imgSrc = parsed.images?.[0] || require("../assets/images/logo.png");

          return (
            <TouchableOpacity
              style={styles.imageItem}
              onPress={() => handlePress(item)}
              activeOpacity={0.8}
            >
              <Image source={typeof imgSrc === "string" ? { uri: imgSrc } : imgSrc} style={styles.signImage} />
              <Text style={styles.imageText}>{item.title2 || "תמרור"}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>תמרור / שאלה:</Text>
            <Text style={styles.modalQuestion}>{selectedQuestion?.question}</Text>

            {selectedQuestion?.images?.map((src, i) => (
              <Image key={i} source={typeof src === "string" ? { uri: src } : src} style={styles.image} />
            ))}

            {selectedQuestion?.correctAnswer ? (
              <>
                <Text style={[styles.modalTitle, { marginTop: 15 }]}>תשובה:</Text>
                <Text style={styles.modalAnswer}>{selectedQuestion.correctAnswer}</Text>
              </>
            ) : null}

            <TouchableOpacity style={styles.closeButton} onPress={() => setShowModal(false)}>
              <Text style={styles.closeText}>סגור</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, textAlign: "center" },

  backButton: {
    marginBottom: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "#007bff",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  backText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  imageItem: { flex: 1, margin: 5, alignItems: "center" },
  signImage: { width: 120, height: 120, borderRadius: 10, backgroundColor: "#eaeaea", resizeMode: "contain" },
  imageText: { marginTop: 5, fontSize: 14, textAlign: "center" },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
  modalQuestion: { fontSize: 16, marginTop: 10, textAlign: "center" },
  modalAnswer: { fontSize: 16, marginTop: 5, textAlign: "center", color: "#28a745" },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: "#007bff",
    borderRadius: 8,
  },
  closeText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginVertical: 10,
    borderRadius: 5,
    backgroundColor: "#eaeaea",
  },
});
