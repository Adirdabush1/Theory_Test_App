import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useRouter } from "expo-router";
import api from "../src/api/api";

type ParsedQuestion = {
  question: string;
  correctAnswer: string;
  choices: string[];
  images?: string[];
};

export default function PracticeScreen() {
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<ParsedQuestion | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const fetchRandomQuestion = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/questions/random");
      const parsed = parseQuestion(res.data);
      setCurrentQuestion(parsed);
      setSelectedChoice(null);
      setFeedback(null);
    } catch (err) {
      console.error(err);
      alert("לא ניתן לטעון את השאלה מהשרת");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomQuestion();
  }, []);

  const parseQuestion = (item: any): ParsedQuestion => {
    const questionText = item.question || "שאלה ללא טקסט";
    const correctAnswer = item.correctAnswer || "";
    const choices = item.options || [];
    const images = item.images || [];
    return { question: questionText, correctAnswer, choices, images };
  };

  const handleChoicePress = (choice: string) => {
    if (!currentQuestion) return;
    setSelectedChoice(choice);

    if (choice === currentQuestion.correctAnswer) {
      setFeedback("תשובה נכונה!");
      setCorrectCount(prev => prev + 1);
      setTimeout(() => {
        fetchRandomQuestion();
      }, 1500);
    } else {
      setFeedback("תשובה שגויה, נסה שוב");
      setWrongCount(prev => prev + 1);
    }
  };

  if (loading || !currentQuestion) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>נכונות: {correctCount}</Text>
        <Text style={styles.statsText}>שגויות: {wrongCount}</Text>
      </View>

      {currentQuestion.images && currentQuestion.images.length > 0 && (
        <Image source={{ uri: currentQuestion.images[0] }} style={styles.image} />
      )}

      <Text style={styles.questionText}>{currentQuestion.question}</Text>

      {currentQuestion.choices.map((choice, index) => {
        const isSelected = selectedChoice === choice;
        let backgroundColor = "#e9ecef";

        if (feedback && isSelected) {
          backgroundColor =
            choice === currentQuestion.correctAnswer ? "#28a745" : "#dc3545";
        }

        return (
          <TouchableOpacity
            key={index}
            style={[styles.choiceButton, { backgroundColor }]}
            onPress={() => handleChoicePress(choice)}
          >
            <Text style={styles.choiceText}>{choice}</Text>
          </TouchableOpacity>
        );
      })}

      {feedback && <Text style={styles.feedbackText}>{feedback}</Text>}
    
      {/* AI Button */}
<TouchableOpacity
  style={styles.aiButton}
  activeOpacity={0.7}
  onPress={() =>
    router.push({
      pathname: '/AIQuizScreen',  // שם המסך שלך
      params: {
        question: currentQuestion?.question, // השאלה הנוכחית
       options: JSON.stringify(currentQuestion?.choices || []), // האפשרויות
      },
    })
  }
>
  <MaterialCommunityIcons name="robot" size={28} color="#fff" />
  <Text style={styles.aiButtonText}>AI Chat</Text>
</TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#f8f9fa", alignItems: "center" },
  questionText: { fontSize: 20, fontWeight: "bold", marginVertical: 20, textAlign: "center" },
  image: { width: "100%", height: 200, resizeMode: "contain", marginBottom: 20, borderRadius: 10 },
  choiceButton: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    width: "100%",
  },
  choiceText: { fontSize: 16, textAlign: "center" },
  feedbackText: { fontSize: 18, marginTop: 20, fontWeight: "bold", color: "#333" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15,
  },
  statsText: { fontSize: 16, fontWeight: "bold" },
  aiButton: {
  position: "absolute",
  bottom: 30,
  right: 20,
  backgroundColor: "#007AFF",
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 30,
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  elevation: 5,
},
aiButtonText: {
  color: "#fff",
  fontSize: 14,
  fontWeight: "600",
},
});
