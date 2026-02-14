import { useState } from 'react';
import { Button, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import api from '../src/api/api';

type Message = {
  role: 'user' | 'ai';
  content: string;
};

const AIChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/api/ai/ask', { prompt: input }); // <-- מסלול נכון

      if (response.data.answer) {
        const aiMessage: Message = { role: 'ai', content: response.data.answer };
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
          value={input}
          onChangeText={setInput}
        />
        <Button title={loading ? 'טוען...' : 'שלח'} onPress={sendMessage} disabled={loading} />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  messagesList: { padding: 10 },
  messageContainer: { padding: 10, borderRadius: 8, marginVertical: 5, maxWidth: '80%' },
  user: { backgroundColor: '#007AFF', alignSelf: 'flex-end' },
  ai: { backgroundColor: '#000000ff', alignSelf: 'flex-start' },
  messageText: { color: '#fff' },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#ccc' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginRight: 10, backgroundColor: '#fff', color: '#000' },
});

export default AIChatScreen;
