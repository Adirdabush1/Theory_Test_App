import { FontAwesome5, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../src/context/AuthContext';

export default function HomePageScreen() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome */}
        <Text style={styles.title}>Welcome, {user?.username || 'User'}!</Text>

        {/* Points */}
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>Your Points:</Text>
          <Text style={styles.pointsValue}>{user?.userPoints || 0}</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Practice List */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/PracticeListScreen')}
            activeOpacity={0.7}>
            <MaterialIcons name="question-answer" size={50} color="#007bff" />
            <Text style={styles.buttonText}>תרגילים</Text>
          </TouchableOpacity>

          {/* Question Bank */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/SelectTopic')}
            activeOpacity={0.7}>
            <MaterialIcons name="category" size={50} color="#007bff" />
            <Text style={styles.buttonText}>מאגר שאלות</Text>
          </TouchableOpacity>

          {/* Full Test */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/SelectTestTypeScreen')}
            activeOpacity={0.7}>
            <FontAwesome5 name="file-alt" size={50} color="#28a745" />
            <Text style={styles.buttonText}>מבחן מלא</Text>
          </TouchableOpacity>

          {/* Test History */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/TestHistoryScreen')}
            activeOpacity={0.7}>
            <MaterialCommunityIcons name="history" size={50} color="#ff8800" />
            <Text style={styles.buttonText}>היסטוריית מבחנים</Text>
          </TouchableOpacity>

          {/* Leaderboard */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/LeaderboardScreen')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="leaderboard" size={50} color="#6f42c1" />
            <Text style={styles.buttonText}>לוח דירוגים</Text>
          </TouchableOpacity>


          {/* Learn from Mistakes */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/LearnFromMistakesScreen')}
            activeOpacity={0.7}>
            <MaterialCommunityIcons name="school" size={50} color="#dc3545" />
            <Text style={styles.buttonText}>למידה בעזרת AI</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* AI Button */}
      <TouchableOpacity
        style={styles.aiButton}
        activeOpacity={0.7}
        onPress={() => router.push('/AIChatScreen')}
      >
        <MaterialCommunityIcons name="robot" size={28} color="#fff" />
        <Text style={styles.aiButtonText}>AI Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {  
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  pointsContainer: {
    marginBottom: 40,
    alignSelf: 'flex-start',
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
  },
  pointsLabel: {
    fontSize: 18,
    color: '#fff',
  },
  pointsValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    padding: 20,
    borderRadius: 12,
    width: '47%',
    marginBottom: 20,
  },
  buttonText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  aiButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6f42c1',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 25,
    elevation: 5,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});
