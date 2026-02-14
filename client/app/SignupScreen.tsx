import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View, Dimensions } from 'react-native';
import api from '../src/api/api';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username || !email || !password) return Alert.alert('שגיאה', 'נא למלא את כל השדות');
    setLoading(true);
    try {
      await api.post('/api/auth/signup', { username, email, password, fullName, department });

      Alert.alert('הצלחה', 'החשבון נוצר בהצלחה');
      // Return to login and signal that signup finished so LoginScreen can reset its UI
      router.replace('/LoginScreen?signupDone=1');
    } catch (err: any) {
      Alert.alert('Signup Failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1503602642458-232111445657?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=bf884ad570b50659c5fa2dc2cfb20ecf&auto=format&fit=crop&w=1000&q=100' }}
        style={styles.background}
        imageStyle={{ opacity: 0.85 }}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>

          <View style={styles.formHolder}>
            <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#888" value={username} onChangeText={setUsername} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888" secureTextEntry value={password} onChangeText={setPassword} />
            <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#888" value={fullName} onChangeText={setFullName} />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSignup} disabled={loading}>
            <Text style={styles.submitText}>{loading ? 'Creating...' : 'Sign up'}</Text>
          </TouchableOpacity>

          <Text style={styles.link} onPress={() => router.replace('/LoginScreen')}>Back to Login</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E1E8EE' },
  background: { width, height, alignItems: 'center', justifyContent: 'center' },
  card: { width: width * 0.9, backgroundColor: '#fff', borderRadius: 15, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  title: { fontSize: 24, marginBottom: 12, fontWeight: '600' },
  formHolder: { width: '100%', marginTop: 10 },
  input: { height: 44, borderBottomWidth: 1, borderBottomColor: '#eee', paddingHorizontal: 12, fontSize: 15, color: '#000' },
  submitBtn: { marginTop: 18, backgroundColor: '#6B92A4', paddingVertical: 12, width: '100%', borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600' },
  link: { marginTop: 10, color: '#6B92A4' },
});
