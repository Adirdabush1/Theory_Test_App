import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Modal, ScrollView, TextInput, Button, Alert } from 'react-native';
import api, { API_ROUTES } from '../src/api/api';
import { AuthContext } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';

type AnswerForDB = {
  questionid: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

type TestHistoryItem = {
  _id: string;
  date: string;
  score: number;
  totalQuestions: number;
  wrongAnswers: number;
  passed: boolean;
  answered: AnswerForDB[];
  aiInsights?: string;
};

const TestHistoryScreen = () => {
  const router = useRouter();
  const { user, loadingAuthState } = useContext(AuthContext);

  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<TestHistoryItem[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestHistoryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); // YYYY-MM-DD
  const [userId, setUserId] = useState<string>(''); // לצפייה במבחנים של משתמש אחר

  const fetchHistory = async () => {
    try {
      // Ensure user is authenticated (server requires JWT)
      if (!user || user._id === 'guest') {
        Alert.alert('דרוש התחברות', 'התחבר או צור חשבון כדי לצפות בהיסטוריית מבחנים');
        return;
      }

      const query = userId ? `?userId=${userId}` : '';
      const res = await api.get<TestHistoryItem[]>(`${API_ROUTES.FULLTEST.HISTORY}${query}`);
      const sorted = res.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(sorted);
      setFilteredHistory(sorted);
    } catch (err: any) {
      console.error('Error fetching history:', err);
      if (err?.response?.status === 401) {
        Alert.alert('אינך מורשה', 'הגישה נדחית - אנא התחבר מחדש', [
          { text: 'OK', onPress: () => router.replace('/LoginScreen') },
        ]);
      } else {
        Alert.alert('שגיאה', 'לא ניתן לטעון את ההיסטוריה מהשרת');
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const applyFilters = () => {
    let filtered = [...history];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(test => statusFilter === 'passed' ? test.passed : !test.passed);
    }

    if (dateFilter) {
      filtered = filtered.filter(test => test.date.startsWith(dateFilter));
    }

    setFilteredHistory(filtered);
  };

  const openTestDetails = (test: TestHistoryItem) => {
    setSelectedTest(test);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>היסטוריית מבחנים</Text>

      {/* פילטרים */}
      <View style={styles.filtersContainer}>
        
        <Text style={styles.filterLabel}>סטטוס:</Text>
        <View style={styles.filterButtons}>
          <Button title="כולם" onPress={() => setStatusFilter('all')} />
          <Button title="עבר" onPress={() => setStatusFilter('passed')} />
          <Button title="נכשל" onPress={() => setStatusFilter('failed')} />
        </View>

        <Text style={styles.filterLabel}>תאריך (YYYY-MM-DD):</Text>
        <TextInput
          style={styles.input}
          placeholder="0000-00-00"
          value={dateFilter}
          onChangeText={setDateFilter}
        />

        <Button title="סנן" onPress={applyFilters} />
      </View>

      {filteredHistory.length === 0 ? (
        <Text style={styles.noData}>אין מבחנים תואמים את המסנן</Text>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.testCard} onPress={() => openTestDetails(item)}>
              <Text style={styles.testDate}>מבחן מיום: {new Date(item.date).toLocaleDateString()}</Text>
              <Text style={styles.testScore}>ניקוד: {item.score} / {item.totalQuestions}</Text>
              <Text style={styles.testScore}>טעויות: {item.wrongAnswers}</Text>
              <Text style={[styles.testStatus, item.passed ? styles.passed : styles.failed]}>
                סטטוס: {item.passed ? 'עבר' : 'נכשל'}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal להצגת פרטי מבחן */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalHeader}>פרטי מבחן</Text>
          <ScrollView style={{ flex: 1 }}>
            {selectedTest?.answered.map(answer => (
              <View key={answer.questionid} style={styles.answerItem}>
                <Text style={styles.questionText}>{answer.questionText}</Text>
                <Text style={answer.isCorrect ? styles.correctText : styles.incorrectText}>
                  תשובה שלך: {answer.userAnswer} ({answer.isCorrect ? 'נכון' : 'לא נכון'})
                </Text>
                {!answer.isCorrect && (
                  <Text style={styles.correctAnswerText}>תשובה נכונה: {answer.correctAnswer}</Text>
                )}
              </View>
            ))}

            {selectedTest?.aiInsights && (
              <View style={styles.aiInsightsContainer}>
                <Text style={styles.aiHeader}>ניתוח AI:</Text>
                <Text style={styles.aiText}>{selectedTest.aiInsights}</Text>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.closeButtonText}>סגור</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f7f7f7' },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  filtersContainer: { marginBottom: 20, backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 2 },
  filterLabel: { fontSize: 14, marginVertical: 5, fontWeight: 'bold', color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5, marginBottom: 10 },
  filterButtons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  noData: { textAlign: 'center', fontSize: 16, marginTop: 30, color: '#888' },
  testCard: { backgroundColor: '#fff', padding: 15, marginBottom: 12, borderRadius: 10, elevation: 3 },
  testDate: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  testScore: { fontSize: 14, color: '#555', marginBottom: 3 },
  testStatus: { fontSize: 14, fontWeight: 'bold' },
  passed: { color: 'green' },
  failed: { color: 'red' },
  modalContainer: { flex: 1, padding: 20, backgroundColor: '#f2f2f2' },
  modalHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
  answerItem: { marginBottom: 15, padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  questionText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  correctText: { color: 'green', fontWeight: 'bold' },
  incorrectText: { color: 'red', fontWeight: 'bold' },
  correctAnswerText: { color: 'blue' },
  aiInsightsContainer: { marginTop: 20, padding: 15, backgroundColor: '#eef', borderRadius: 8 },
  aiHeader: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  aiText: { fontSize: 14, color: '#333' },
  closeButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default TestHistoryScreen;
