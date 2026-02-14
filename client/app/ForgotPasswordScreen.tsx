import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/api/api'; 

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // פונקציה לטיפול באיפוס הסיסמה
  // שולחת בקשה לשרת ליצירת טוקן איפוס
  // ואז שולחת מייל עם הקישור לאיפוס דרך Formspree
  // מציגה התראה למשתמש על הצלחה או כישלון
  const handleReset = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    try {
      // שליחת בקשה לשרת שלך ליצירת טוקן איפוס סיסמה
      const res = await api.post('/forgot-password', { email });
      const resetLink = res.data.resetUrl;

      //  שליחת המייל דרך Formspree
      await fetch("https://formspree.io/f/xkgkqqzg", {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          message: `Click this link to reset your password: ${resetLink}`
        })
      });

      Alert.alert("Success", "Reset link sent to your email!");
      router.push('/LoginScreen');

    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Button title="Send Reset Link" onPress={handleReset} />

      <Text style={styles.link} onPress={() => router.push('/LoginScreen')}>
        Back to Login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 26, textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 16 },
  link: { color: 'blue', textAlign: 'center', marginTop: 10 },
});
