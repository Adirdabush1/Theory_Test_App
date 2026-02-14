import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView
} from "react-native";
import LottieWrapper from "../src/components/LottieWrapper";
import api, { API_ROUTES } from "../src/api/api";

type ParsedQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  images?: string[];
};

type AnswerForDB = {
  questionid: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

type Question = {
  _id?: string;
  title2: string;
  description4: string;
};

const TOTAL_QUESTIONS = 30;
const MAX_WRONG = 4;
const TOTAL_TIME = 40 * 60 * 1000;

/* ------------------ HELPER: ערבוב מערך ------------------ */
const shuffleArray = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ------------------ HELPER: חילוץ סוגי רישיון ------------------ */
const extractCategories = (html?: string): string[] => {
  if (!html) return [];
  const matches = html.match(/«(.*?)»/g) || [];
  return matches.map(m => m.replace(/«|»/g, ""));
};

/* ------------------ HELPER: חילוץ אופציות ותשובה נכונה ------------------ */
const parseOptions = (html?: string) => {
  if (!html) return { options: [], correctAnswer: "", images: [] };

  const liMatches = html.match(/<li><span.*?>(.*?)<\/span><\/li>/g) || [];
  const options = liMatches.map(li => {
    const textMatch = li.match(/<span.*?>(.*?)<\/span>/);
    return textMatch ? textMatch[1] : "";
  });

  const correctMatch = html.match(/<span id="correctAnswer.*?">(.*?)<\/span>/);
  const correctAnswer = correctMatch ? correctMatch[1] : options[0] || "";

  const imgMatches = html.match(/<img.*?src="(.*?)".*?>/g) || [];
  const images = imgMatches.map(img => {
    const srcMatch = img.match(/src="(.*?)"/);
    return srcMatch ? srcMatch[1] : "";
  });

  return { options, correctAnswer, images };
};

/* ------------------ MAIN SCREEN ------------------ */
const PracticeScreen = () => {
  const { licenseType } = useLocalSearchParams<{ licenseType: string }>();
  const [data, setData] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<ParsedQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [answers, setAnswers] = useState<AnswerForDB[]>([]);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [testFinished, setTestFinished] = useState(false);
  const [showLottieFinish, setShowLottieFinish] = useState(false);

  /* ------------------ שליפת שאלות מה־API ------------------ */
  const fetchData = async () => {
    if (!licenseType) {
      Alert.alert("שגיאה", "לא נבחר סוג תיאוריה");
      return;
    }

    setLoading(true);
    try {
      // Primary strategy: fetch all questions once and filter locally to avoid 404s on the by-license endpoint
      const allRes = await api.get<Question[]>(API_ROUTES.QUESTIONS);
      const allRecords = allRes.data || [];

      const filtered = allRecords.filter((rec) => {
        const categories = extractCategories(rec.description4);
        return categories.includes(licenseType);
      });

      if (filtered.length === 0) {
        // No license-specific questions — fall back to a general shuffled test
        Alert.alert('אין שאלות ספציפיות', 'טוען מבחן כללי במקום שאלות ספציפיות לרישיון');
        const general = shuffleArray(allRecords).slice(0, TOTAL_QUESTIONS);
        setData(general);
        setLoading(false);
        return;
      }

      setData(shuffleArray(filtered).slice(0, TOTAL_QUESTIONS));
    } catch (err: any) {
      // If the all-questions fetch fails, fall back to calling the by-license endpoint (older servers)
      console.warn('Primary fetch failed, trying by-license fallback:', err?.response ?? err);
      try {
        const response = await api.get(API_ROUTES.QUESTIONS_BY_LICENSE(licenseType));
        const records: Question[] = response.data || [];

        if (records.length === 0) {
          Alert.alert("אין שאלות", `לא נמצאו שאלות לסוג רישיון ${licenseType}`);
          setLoading(false);
          return;
        }

        setData(shuffleArray(records).slice(0, TOTAL_QUESTIONS));
      } catch (err2: any) {
        console.warn('Fallback by-license fetch failed:', err2?.response ?? err2);
        // Handle 404 or network errors gracefully
        if (err2?.response?.status === 404) {
          Alert.alert('אין שאלות', err2.response.data?.error || `לא נמצאו שאלות לסוג רישיון ${licenseType}`);
        } else {
          Alert.alert('שגיאה', 'לא ניתן לטעון את השאלות מהשרת');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ יצירת שאלה ------------------ */
  const generateQuestion = (index: number) => {
    if (data.length === 0 || testFinished) return;

    const record = data[index];
    const { options, correctAnswer, images } = parseOptions(record.description4);

    if (options.length === 0) return;

    // מערבב את אפשרויות התשובה
    const shuffledOptions = shuffleArray(options);

    setCurrentQuestion({
      question: record.title2 || "שאלה ללא כותרת",
      options: shuffledOptions,
      correctAnswer,
      images
    });

    const existingAnswer = answers[index];
    setSelectedAnswer(existingAnswer ? existingAnswer.userAnswer : null);
  };

  /* ------------------ ניהול תשובות ------------------ */
  const handleAnswer = (option: string) => {
    if (testFinished) return;

    setSelectedAnswer(option);

    setAnswers(prev => {
      const newArr = [...prev];
      newArr[questionIndex] = {
        questionid: questionIndex + 1,
        questionText: currentQuestion?.question || "",
        userAnswer: option,
        correctAnswer: currentQuestion?.correctAnswer || "",
        isCorrect: option === currentQuestion?.correctAnswer
      };
      return newArr;
    });

    if (option !== currentQuestion?.correctAnswer) {
      setWrongCount(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (questionIndex > 0) setQuestionIndex(prev => prev - 1);
  };

  const goToNextQuestion = () => {
    if (questionIndex < TOTAL_QUESTIONS - 1) {
      setQuestionIndex(prev => prev + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    if (testFinished) return;

    setTestFinished(true);
    setShowLottieFinish(true);

    const answered = answers.filter(a => a !== undefined);
    const passed = wrongCount <= MAX_WRONG;

    setTimeout(() => {
      router.push({
        pathname: "/TestSummaryScreen",
        params: {
          answers: JSON.stringify(answered),
          passed: passed ? "true" : "false",
        }
      });
    }, 2400);
  };

  /* ------------------ EFFECTS ------------------ */
  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (data.length > 0) generateQuestion(questionIndex); }, [questionIndex, data]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          clearInterval(interval);
          finishTest();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ------------------ RENDER ------------------ */
  if (showLottieFinish) {
    return (
      <View style={styles.lottieContainer}>
        <LottieWrapper
          source={require('../assets/driving.json')}
          style={{ width: 250, height: 250 }}
        />
        <Text style={styles.loadingText}>מעבד את התוצאות...</Text>
      </View>
    );
  }

  if (loading) return <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />;
  if (!currentQuestion) return <Text style={styles.message}>טוען שאלות...</Text>;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.questionNumber}>
        שאלה {questionIndex + 1} מתוך {TOTAL_QUESTIONS}
      </Text>

      <Text style={styles.timer}>
        זמן נותר: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      </Text>

      <Text style={styles.title}>בחר את התשובה הנכונה:</Text>
      <Text style={styles.question}>{currentQuestion.question}</Text>

      {currentQuestion.images?.map((src, i) => (
        <Image key={i} source={{ uri: src }} style={styles.image} />
      ))}

      {currentQuestion.options.map((option, idx) => (
        <TouchableOpacity
          key={`${option}-${idx}`}
          style={[styles.option, selectedAnswer === option && { backgroundColor: "#d1e7ff" }]}
          onPress={() => handleAnswer(option)}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.navButton, questionIndex === 0 && { opacity: 0.5 }]}
          disabled={questionIndex === 0}
          onPress={goToPreviousQuestion}
        >
          <Text style={styles.navButtonText}>שאלה קודמת</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={goToNextQuestion}>
          <Text style={styles.navButtonText}>
            {questionIndex === TOTAL_QUESTIONS - 1 ? "סיים" : "שאלה הבאה"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0f4f8" },

  lottieContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  loadingText: { marginTop: 20, fontSize: 20, fontWeight: "600", color: "#333" },

  title: { fontSize: 24, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  questionNumber: { fontSize: 16, textAlign: "center", marginBottom: 8 },
  timer: { fontSize: 16, textAlign: "center", color: "#e11d48", marginBottom: 15 },
  question: { fontSize: 20, fontWeight: "500", marginBottom: 20, textAlign: "center" },

  image: { width: "100%", height: 220, resizeMode: "contain", marginVertical: 15, borderRadius: 12, backgroundColor: "#e5e7eb" },

  option: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, paddingVertical: 15, paddingHorizontal: 20, marginVertical: 8 },
  optionText: { fontSize: 16, textAlign: "center" },

  navigationButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  navButton: { backgroundColor: "#007AFF", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  navButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  message: { textAlign: "center", marginTop: 50, fontSize: 16 }
});

export default PracticeScreen;
