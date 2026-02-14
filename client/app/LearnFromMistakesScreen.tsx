// ===================================
// ייבוא ספריות (Imports)
// ===================================

// useRouter - מאפשר ניווט בין מסכים באפליקציה (מ-expo-router)
import { useRouter } from 'expo-router';

// useEffect - hook שרץ כשהקומפוננטה נטענת לראשונה
// useState - hook לניהול state (מצב) של הקומפוננטה
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../src/context/AuthContext';

// רכיבי UI מ-React Native:
// ActivityIndicator - אייקון טעינה מסתובב
// Alert - חלון קופץ להצגת הודעות למשתמש
// ScrollView - מאפשר גלילה כשהתוכן ארוך מהמסך
// StyleSheet - יוצר עיצוב (CSS) לרכיבים
// Text - מציג טקסט
// TouchableOpacity - כפתור שניתן ללחוץ עליו (עם אפקט שקיפות)
// View - מיכל לרכיבים (כמו div ב-HTML)
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// api - אובייקט axios מוגדר לתקשורת עם השרת
// API_ROUTES - ניתובים (endpoints) של ה-API בשרת
import api, { API_ROUTES } from '../src/api/api';

// ===================================
// הגדרות TypeScript Types
// ===================================

// AnswerForDB - מבנה נתונים של תשובה בודדת במבחן
type AnswerForDB = {
  questionid: number;        // מספר השאלה במבחן (1-30)
  questionText: string;      // טקסט השאלה
  userAnswer: string;        // התשובה שהמשתמש נתן
  correctAnswer: string;     // התשובה הנכונה
  isCorrect: boolean;        // האם המשתמש ענה נכון (true/false)
  aiFeedback?: string;       // משוב מה-AI (אופציונלי, לכן יש '?')
};

// TestHistoryItem - מבנה נתונים של מבחן שלם בהיסטוריה
type TestHistoryItem = {
  _id: string;               // מזהה ייחודי של המבחן במסד הנתונים (MongoDB)
  date: string;              // תאריך ביצוע המבחן
  score: number;             // כמה שאלות נענו נכון
  totalQuestions: number;    // סך הכל שאלות במבחן (30)
  wrongAnswers: number;      // כמה שאלות נענו לא נכון
  passed: boolean;           // האם המבחן עבר (true) או נכשל (false)
  answered: AnswerForDB[];   // מערך של כל התשובות במבחן
  aiInsights?: string;       // ניתוח כללי של ה-AI על המבחן (אופציונלי)
};

// ===================================
// הקומפוננטה הראשית (Main Component)
// ===================================
const LearnFromMistakesScreen = () => {
  // --- ניווט (Navigation) ---
  // router מאפשר לנווט למסכים אחרים באפליקציה
  const router = useRouter();
  const { user } = useContext(AuthContext);

  // --- State Management (ניהול מצב) ---
  // loading - האם הנתונים עדיין נטענים מהשרת (true/false)
  const [loading, setLoading] = useState(true);

  // latestTest - המבחן האחרון שהמשתמש ביצע (או null אם אין)
  const [latestTest, setLatestTest] = useState<TestHistoryItem | null>(null);

  // wrongAnswersOnly - רק התשובות השגויות מהמבחן האחרון (אחרי סינון)
  const [wrongAnswersOnly, setWrongAnswersOnly] = useState<AnswerForDB[]>([]);

  // loading!Feedback - עוקב איזה משוב AI כרגע נטען
  // מבנה: { 0: true, 1: false } - index של השאלה ← האם טוען
  // זה מונע מהמשתמש ללחוץ שוב על אותו כפתור בזמן טעינה
  const [loadingFeedback, setLoadingFeedback] = useState<{ [key: number]: boolean }>({});

  // ===================================
  // פונקציה: fetchAIFeedback
  // מטרה: לקבל משוב מותאם אישית מה-AI על שאלה שגויה ספציפית
  // ===================================
  const fetchAIFeedback = async (answer: AnswerForDB, index: number) => {
    // בדיקה: אם כבר יש משוב - אל תקרא שוב (חוסכים כסף ב-API)
    if (answer.aiFeedback) return;

    // אם אין משתמש מחובר או שהוא Guest - לא ניתן לקבל משוב
    if (!user || user._id === 'guest') {
      Alert.alert('דרוש התחברות', 'אנא היכנס כדי לקבל משוב מותאם מה‑AI');
      return;
    }

    // עדכון State: מסמן שהמשוב לשאלה הזו כרגע נטען
    setLoadingFeedback(prev => ({ ...prev, [index]: true }));

    try {
      // שליחת בקשה לשרת (POST request) ל-endpoint של משוב AI
      const res = await api.post('/api/learn/feedback', {
        question: answer.questionText,      // שולח את השאלה
        userAnswer: answer.userAnswer,      // שולח את התשובה השגויה של המשתמש
        correctAnswer: answer.correctAnswer, // שולח את התשובה הנכונה
      });

      // עדכון State: הוספת המשוב שהתקבל מה-AI לשאלה המתאימה
      setWrongAnswersOnly(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, aiFeedback: res.data.feedback } : item
        )
      );
    } catch (err: any) {
      console.error('Error fetching AI feedback:', err);
      if (err?.response?.status === 401) {
        Alert.alert('אינך מורשה', 'התחבר מחדש כדי לקבל משוב מה‑AI');
      } else {
        Alert.alert('שגיאה', 'לא ניתן לקבל משוב מה-AI');
      }
    } finally {
      setLoadingFeedback(prev => ({ ...prev, [index]: false }));
    }
  };

  // ===================================
  // פונקציה: fetchLatestTest
  // מטרה: לטעון את המבחן האחרון מהשרת ולהציג רק תשובות שגויות
  // ===================================
  const fetchLatestTest = async () => {
    // עדכון State: מתחיל טעינה
    setLoading(true);

    try {
      // Ensure user is authenticated
      if (!user || user._id === 'guest') {
        Alert.alert('דרוש התחברות', 'התחבר או צור חשבון כדי להשתמש בכלי זה');
        setLoading(false);
        return;
      }

      // GET request - מושך את כל היסטוריית המבחנים של המשתמש
      // API_ROUTES.FULLTEST.HISTORY = "/api/test/history"
      const res = await api.get<TestHistoryItem[]>(API_ROUTES.FULLTEST.HISTORY);
      
      // בדיקה: אם אין מבחנים בהיסטוריה
      if (res.data.length === 0) {
        Alert.alert("אין מבחנים", "עדיין לא ביצעת אף מבחן.");
        setLoading(false);
        return; // יציאה מהפונקציה
      }

      // מיון המבחנים לפי תאריך (מהחדש לישן)
      // a, b - שני מבחנים שמושווים
      // getTime() - הופך תאריך ל-מספר (מילישניות מ-1970)
      // b - a (ולא a - b) = מיון יורד (החדש ביותר ראשון)
      const sorted = res.data.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // לקיחת המבחן הראשון (האחרון כרונולוגית) אחרי המיון
      const latest = sorted[0];

      // עדכון State: שמירת המבחן האחרון
      setLatestTest(latest);

      // סינון: רק תשובות שגויות (isCorrect === false)
      // filter - יוצר מערך חדש רק עם פריטים שעומדים בתנאי
      const wrong = latest.answered.filter(answer => !answer.isCorrect);
      
      // הסרת כפילויות: אם טעו באותה שאלה פעמיים, להציג רק פעם אחת
      // reduce - עובר על המערך ובונה מערך חדש צעד אחר צעד
      // acc - המערך המצטבר (accumulator) שבונים
      // current - הפריט הנוכחי שבודקים
      const uniqueWrong = wrong.reduce((acc: AnswerForDB[], current) => {
        // find - מחפש אם כבר יש שאלה עם אותו questionText במערך המצטבר
        const exists = acc.find(item => item.questionText === current.questionText);
        
        // אם השאלה לא קיימת - הוסף אותה
        if (!exists) {
          acc.push(current);
        }
        
        // החזר את המערך המצטבר (חובה ב-reduce)
        return acc;
      }, []); // [] - המערך המצטבר מתחיל ריק
      
      // עדכון State: שמירת התשובות השגויות (ללא כפילויות)
      setWrongAnswersOnly(uniqueWrong);

      // בדיקה: אם אין תשובות שגויות (הצלחה מלאה!)
      if (uniqueWrong.length === 0) {
        Alert.alert("מעולה!", "במבחן האחרון לא היו תשובות שגויות!");
      }

    } catch (err) {
      // טיפול בשגיאות: אם הבקשה לשרת נכשלה
      console.error('Error fetching latest test:', err);
      Alert.alert("שגיאה", "לא ניתן לטעון את המבחן האחרון");
    } finally {
      // finally - רץ תמיד בסוף, גם אם הצליח וגם אם נכשל
      // עדכון State: סיום טעינה
      setLoading(false);
    }
  };

  // ===================================
  // useEffect Hook
  // מטרה: לרוץ פעם אחת כשהקומפוננטה נטענת לראשונה
  // ===================================
  useEffect(() => {
    // קורא לפונקציה שמושכת את המבחן האחרון
    fetchLatestTest();
  }, []); // [] - dependency array ריק = רץ רק פעם אחת בטעינה

  // ===================================
  // תצוגה מותנית #1: מסך טעינה
  // מוצג כל עוד loading === true
  // ===================================
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        {/* ActivityIndicator - אייקון מסתובב של טעינה */}
        <ActivityIndicator size="large" color="#dc3545" />
        <Text style={styles.loadingText}>טוען מבחן אחרון...</Text>
      </View>
    );
  }

  // ===================================
  // תצוגה מותנית #2: אין מבחנים
  // מוצג אם latestTest === null (אין מבחנים בהיסטוריה)
  // ===================================
  if (!latestTest) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noDataText}>לא נמצאו מבחנים</Text>
        {/* TouchableOpacity - כפתור שניתן ללחוץ עליו */}
        {/* onPress - מה קורה כשלוחצים על הכפתור */}
        {/* router.push - מנווט למסך אחר */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/HomePageScreen')}>
          <Text style={styles.backButtonText}>חזור לדף הבית</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ===================================
  // תצוגה מותנית #3: אין תשובות שגויות (הצלחה מלאה!)
  // מוצג אם wrongAnswersOnly.length === 0
  // ===================================
  if (wrongAnswersOnly.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.perfectText}>🎉 כל הכבוד!</Text>
        <Text style={styles.noDataText}>במבחן האחרון לא היו תשובות שגויות</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/HomePageScreen')}>
          <Text style={styles.backButtonText}>חזור לדף הבית</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ===================================
  // תצוגה ראשית: מסך למידה מטעויות
  // מוצג כשיש תשובות שגויות להציג
  // ===================================
  return (
    <View style={styles.container}>
      {/* --- כותרת המסך (Header) --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>למידה מטעויות עם עוזר AI 🤖</Text>
        <Text style={styles.headerSubtitle}>
          {/* toLocaleDateString('he-IL') - מציג תאריך בעברית */}
          מבחן מיום: {new Date(latestTest.date).toLocaleDateString('he-IL')}
        </Text>
        <Text style={styles.headerSubtitle}>
          {/* הצגת כמה תשובות שגויות מתוך סך הכל */}
          {wrongAnswersOnly.length} תשובות שגויות מתוך {latestTest.totalQuestions}
        </Text>
      </View>

      {/* --- אזור גלילה (ScrollView) - מאפשר לגלול אם יש הרבה שאלות --- */}
      <ScrollView style={styles.scrollContainer}>
        {/* map - עובר על כל תשובה שגויה ויוצר כרטיס (Card) לכל אחת */}
        {wrongAnswersOnly.map((answer, index) => (
          // key - מזהה ייחודי לכל פריט (חובה ב-React)
          <View key={answer.questionid} style={styles.answerCard}>
            {/* --- מספר השאלה --- */}
            <Text style={styles.questionNumber}>שאלה #{answer.questionid}</Text>
            
            {/* --- טקסט השאלה --- */}
            <Text style={styles.questionText}>{answer.questionText}</Text>

            {/* --- תשובה שגויה של המשתמש --- */}
            <View style={styles.answerSection}>
              <Text style={styles.wrongAnswerLabel}>התשובה שלך (שגויה):</Text>
              <Text style={styles.wrongAnswerText}>{answer.userAnswer}</Text>
            </View>

            {/* --- התשובה הנכונה --- */}
            <View style={styles.answerSection}>
              <Text style={styles.correctAnswerLabel}>התשובה הנכונה:</Text>
              <Text style={styles.correctAnswerText}>{answer.correctAnswer}</Text>
            </View>

            {/* --- כפתור/תיבת משוב AI --- */}
            {/* תנאי: אם אין משוב - הצג כפתור, אם יש משוב - הצג את המשוב */}
            {!answer.aiFeedback ? (
              // אין משוב - הצג כפתור לקבלת משוב
              <TouchableOpacity
                style={styles.feedbackButton}
                onPress={() => fetchAIFeedback(answer, index)} // קורא לפונקציה שמושכת משוב
                disabled={loadingFeedback[index]} // אם כרגע טוען - הכפתור מושבת
              >
                {/* תנאי: אם טוען - הצג ספינר, אחרת הצג טקסט */}
                {loadingFeedback[index] ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.feedbackButtonText}>💡 קבל משוב למידה מ-AI</Text>
                )}
              </TouchableOpacity>
            ) : (
              // יש משוב - הצג את המשוב בתיבה
              <View style={styles.aiFeedbackBox}>
                <Text style={styles.aiFeedbackHeader}>💡 משוב למידה:</Text>
                <Text style={styles.aiFeedbackText}>{answer.aiFeedback}</Text>
              </View>
            )}
          </View>
        ))}

        {/* --- ניתוח כללי של AI (אם קיים) --- */}
        {/* && - תנאי קצר: אם latestTest.aiInsights קיים, הצג את התיבה */}
        {latestTest.aiInsights && (
          <View style={styles.aiInsightsContainer}>
            <Text style={styles.aiHeader}>💡 ניתוח AI:</Text>
            <Text style={styles.aiText}>{latestTest.aiInsights}</Text>
          </View>
        )}
      </ScrollView>

      {/* --- כפתור חזרה לדף הבית (קבוע בתחתית) --- */}
      <TouchableOpacity style={styles.closeButton} onPress={() => router.push('/HomePageScreen')}>
        <Text style={styles.closeButtonText}>חזור לדף הבית</Text>
      </TouchableOpacity>
    </View>
  );
};

// ===================================
// StyleSheet - הגדרת עיצוב (Styles)
// דומה ל-CSS אבל ב-JavaScript
// ===================================
const styles = StyleSheet.create({
  // --- מיכל ראשי של כל המסך ---
  container: {
    flex: 1,                      // תופס את כל הגובה הזמין
    backgroundColor: '#f7f7f7',   // רקע אפור בהיר
  },

  // --- מיכל ממורכז (למסכי טעינה/שגיאה) ---
  centerContainer: {
    flex: 1,                      // תופס את כל המסך
    justifyContent: 'center',     // ממרכז אנכית
    alignItems: 'center',         // ממרכז אופקית
    padding: 20,                  // ריווח פנימי
    backgroundColor: '#f7f7f7',
  },

  // --- כותרת עליונה (Header) ---
  header: {
    backgroundColor: '#dc3545',   // רקע אדום
    padding: 20,                  // ריווח פנימי
    paddingTop: 40,              // ריווח נוסף מלמעלה (בגלל status bar)
  },

  // --- כותרת ראשית בכותרת ---
  headerTitle: {
    fontSize: 24,                 // גודל גופן גדול
    fontWeight: 'bold',           // טקסט מודגש
    color: '#fff',                // צבע לבן
    textAlign: 'center',          // יישור למרכז
  },

  // --- כותרת משנית בכותרת ---
  headerSubtitle: {
    fontSize: 16,                 // גודל בינוני
    color: '#fff',                // צבע לבן
    textAlign: 'center',          // יישור למרכז
    marginTop: 5,                 // ריווח מלמעלה
  },

  // --- מיכל גלילה ---
  scrollContainer: {
    flex: 1,                      // תופס את כל השטח הנותר
    padding: 15,                  // ריווח פנימי
  },

  // --- כרטיס של שאלה (Card) ---
  answerCard: {
    backgroundColor: '#fff',      // רקע לבן
    borderRadius: 10,             // פינות מעוגלות
    padding: 15,                  // ריווח פנימי
    marginBottom: 15,             // ריווח מתחת לכרטיס
    elevation: 3,                 // צל (Android)
    // הגדרות צל ל-iOS:
    shadowColor: '#000',          // צבע הצל
    shadowOffset: { width: 0, height: 2 },  // כיוון הצל
    shadowOpacity: 0.1,           // שקיפות הצל
    shadowRadius: 4,              // רדיוס הטשטוש של הצל
  },

  // --- מספר השאלה ---
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',                // אפור כהה
    marginBottom: 5,
  },

  // --- טקסט השאלה ---
  questionText: {
    fontSize: 16,
    fontWeight: '500',            // מעט מודגש
    color: '#333',                // כמעט שחור
    marginBottom: 15,
  },

  // --- מיכל של תשובה (שגויה/נכונה) ---
  answerSection: {
    marginBottom: 10,             // ריווח בין תשובות
  },

  // --- תווית של תשובה שגויה ---
  wrongAnswerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc3545',             // אדום
    marginBottom: 5,
  },

  // --- טקסט של תשובה שגויה ---
  wrongAnswerText: {
    fontSize: 15,
    color: '#dc3545',             // אדום
    backgroundColor: '#ffe6e6',   // רקע אדום בהיר
    padding: 10,
    borderRadius: 5,
  },

  // --- תווית של תשובה נכונה ---
  correctAnswerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',             // ירוק
    marginBottom: 5,
  },

  // --- טקסט של תשובה נכונה ---
  correctAnswerText: {
    fontSize: 15,
    color: '#28a745',             // ירוק
    backgroundColor: '#e6ffe6',   // רקע ירוק בהיר
    padding: 10,
    borderRadius: 5,
  },

  // --- מיכל ניתוח AI כללי ---
  aiInsightsContainer: {
    marginTop: 10,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e7f3ff',   // רקע כחול בהיר
    borderRadius: 10,
    borderWidth: 1,               // מסגרת
    borderColor: '#007bff',       // כחול
  },

  // --- כותרת ניתוח AI ---
  aiHeader: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    color: '#007bff',             // כחול
  },

  // --- טקסט ניתוח AI ---
  aiText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,               // ריווח בין שורות
  },

  // --- כפתור סגירה (חזרה לדף הבית) ---
  closeButton: {
    backgroundColor: '#007bff',   // כחול
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: 'center',         // ממרכז את הטקסט
  },

  // --- טקסט בכפתור סגירה ---
  closeButtonText: {
    color: '#fff',                // לבן
    fontSize: 16,
    fontWeight: 'bold',
  },

  // --- טקסט טעינה ---
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',                // אפור
  },

  // --- טקסט "אין נתונים" ---
  noDataText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },

  // --- טקסט "מושלם" (אימוג'י גדול) ---
  perfectText: {
    fontSize: 32,
    marginBottom: 10,
  },

  // --- כפתור חזרה ---
  backButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 30,        // ריווח אופקי
    paddingVertical: 15,          // ריווח אנכי
    borderRadius: 10,
  },

  // --- טקסט בכפתור חזרה ---
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // --- כפתור לקבלת משוב AI ---
  feedbackButton: {
    backgroundColor: '#6f42c1',   // סגול
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },

  // --- טקסט בכפתור משוב ---
  feedbackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // --- תיבת משוב AI (אחרי קבלת המשוב) ---
  aiFeedbackBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f0f8ff',   // כחול מאוד בהיר
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6f42c1',       // סגול
  },

  // --- כותרת בתיבת משוב ---
  aiFeedbackHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#6f42c1',             // סגול
    marginBottom: 8,
  },

  // --- טקסט משוב AI ---
  aiFeedbackText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,               // ריווח בין שורות
  },
});

// ייצוא הקומפוננטה כ-default export
// כך אפשר לייבא אותה בקבצים אחרים: import LearnFromMistakesScreen from './LearnFromMistakesScreen'
export default LearnFromMistakesScreen;
