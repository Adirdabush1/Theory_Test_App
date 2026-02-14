import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Button, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import api from '../src/api/api';

type Message = {
  role: 'user' | 'ai';
  content: string;
};

// טיפוס לתשובה מה‑API
interface AIResponse {
  answer?: string;
}

const AIQuizScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // קבלת פרמטרים שהגיעו מהמסך של המבחן
  const { question, options } = useLocalSearchParams();

  // parsedOptions יציב בין רינדורים
  const parsedOptions = useMemo(() => {
    return options ? JSON.parse(options as string) : [];
  }, [options]);

  // Debugging
  useEffect(() => {
    console.log("Question param:", question);
    console.log("Options param:", parsedOptions);
  }, [question, parsedOptions]);

  // הודעה אוטומטית בתחילת הצ'אט
  useEffect(() => {
    if (question) {
      const intro = `זוהי השאלה שאתה עובד עליה עכשיו:\n\n"${question}"\n\nאפשרויות:\n${parsedOptions
        .map((o: string) => "- " + o)
        .join("\n")}\n\nאיך אוכל לעזור? רוצה רמז, הסבר, כיוון או דוגמה?`;

      setMessages([{ role: 'ai', content: intro }]);
    }
  }, [question, parsedOptions]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post<AIResponse>('/api/ai/ask', {
        prompt: `
        שאלה שהמשתמש עובר עליה במבחן:
        ${question}

        אפשרויות:
        ${parsedOptions.join(", ")}

        שאלה למורה הפרטי:
        ${input}

        ענה בצורה מנחה. אל תגלה פתרון מלא אלא אם המשתמש ביקש "תן תשובה".
        `
      });

      const answer = response.data.answer;

      if (answer) {
        const aiMessage: Message = { role: 'ai', content: answer };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: 'לא התקבלה תשובה מהשרת.' }]);
      }
    } catch (err) {
      console.log(err);
      setMessages(prev => [...prev, { role: 'ai', content: 'שגיאה בשרת, נסה שוב.' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.role === 'user' ? styles.user : styles.ai]}>
      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="כתוב משהו..."
          placeholderTextColor="#ccc"
          value={input}
          onChangeText={setInput}
        />
        <Button title={loading ? 'טוען...' : 'שלח'} onPress={sendMessage} disabled={loading} />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffffff' },
  messagesList: { padding: 10 },
  messageContainer: { padding: 10, borderRadius: 8, marginVertical: 5, maxWidth: '80%' },
  user: { backgroundColor: '#007AFF', alignSelf: 'flex-end' },
  ai: { backgroundColor: '#000000ff', alignSelf: 'flex-start', padding: 10 },
  messageText: { color: '#fcefefff' },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#333' },
  input: { flex: 1, borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 10, marginRight: 10, backgroundColor: '#202020', color: '#ffffff' },
});

export default AIQuizScreen;
