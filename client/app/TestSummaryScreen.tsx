import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams as useSearchParams } from 'expo-router';

type AnswerForDB = {
  questionid: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

const TestSummaryScreen = () => {
  const params = useSearchParams();

  // טיפול מלא בפרמטר שמגיע כמחרוזת או כ-object
  const rawAnswers = params.answers;
  const answers: AnswerForDB[] =
    typeof rawAnswers === "string" ? JSON.parse(rawAnswers) : [];

  const passed = params.passed === "true";
  const aiInsights =
    typeof params.aiInsights === "string" ? params.aiInsights : "";

  const correctCount = answers.filter(a => a.isCorrect).length;
  const wrongCount = answers.length - correctCount;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {passed ? "🎉 עברתם את המבחן!" : "❌ המבחן נכשל"}
      </Text>

      <Text style={styles.score}>
        נכון: {correctCount} מתוך {answers.length} | טעויות: {wrongCount}
      </Text>

      {answers.length === 0 && (
        <Text style={{ textAlign: "center", marginTop: 20, fontSize: 16 }}>
          אין נתוני תשובות להצגה.
        </Text>
      )}

      {answers.map((answer) => (
        <View key={answer.questionid} style={styles.answerItem}>
          <Text style={styles.questionText}>
            {answer.questionid}. {answer.questionText}
          </Text>

          <Text
            style={answer.isCorrect ? styles.correctText : styles.incorrectText}
          >
            תשובתך: {answer.userAnswer} ({answer.isCorrect ? "נכון" : "לא נכון"})
          </Text>

          {!answer.isCorrect && (
            <Text style={styles.correctAnswerText}>
              תשובה נכונה: {answer.correctAnswer}
            </Text>
          )}
        </View>
      ))}

      {aiInsights ? (
        <View style={styles.aiContainer}>
          <Text style={styles.aiHeader}>ניתוח AI:</Text>
          <Text style={styles.aiText}>{aiInsights}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.replace("/HomePageScreen")}
      >
        <Text style={styles.closeButtonText}>חזור למסך הראשי</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f7f7f7" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  score: { fontSize: 18, textAlign: "center", marginBottom: 20 },
  answerItem: {
    marginBottom: 15,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  questionText: { fontSize: 16, marginBottom: 5, fontWeight: "600" },
  correctText: { color: "green", fontWeight: "bold" },
  incorrectText: { color: "red", fontWeight: "bold" },
  correctAnswerText: { color: "blue", fontWeight: "bold", marginTop: 4 },
  aiContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#eef",
    borderRadius: 8,
  },
  aiHeader: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  aiText: { fontSize: 14, color: "#333", lineHeight: 20 },
  closeButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  closeButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default TestSummaryScreen;
