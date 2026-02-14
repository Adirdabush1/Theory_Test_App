import { useRouter, useLocalSearchParams } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { AuthContext } from '../src/context/AuthContext';
import api from '../src/api/api';

const { height, width } = Dimensions.get('window');

export default function LoginScreen() {
  const [isSignup, setIsSignup] = useState(false); // kept for tab styling only
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const params = useLocalSearchParams();

  // When coming back from signup, ensure login UI is visible
  useEffect(() => {
    if (params?.signupDone) {
      setIsSignup(false);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: false,
        damping: 12,
        stiffness: 100,
      }).start();
    }
  }, [params?.signupDone]);

  // Remove inline signup UI and navigation: navigate to full SignupScreen instead
  const toggleForm = () => {
    // keep animation for the login panel only
    setIsSignup((prev) => !prev);

    Animated.spring(slideAnim, {
      toValue: isSignup ? 0 : 1,
      useNativeDriver: false,
      damping: 12,
      stiffness: 100,
    }).start();
  };

  const showSignup = () => {
    // navigate to the dedicated Signup screen instead of showing inline overlay
    router.push('/SignupScreen');
  };

  const showLogin = () => {
    if (isSignup) {
      setIsSignup(false);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: false,
        damping: 12,
        stiffness: 100,
      }).start();
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const token = res.data.token;
      // Res.data contains user fields
      const userData = { ...res.data };
      await login(token, userData);
      router.replace('/HomePageScreen');
    } catch (err: any) {
      Alert.alert('Login failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const signupTop = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.5 - 150, height * 0.05],
  });

  const signupOpacity = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  const loginTop = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.15, height * 0.9],
  });

  const loginOpacity = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.6, 0],
  });

  const handleGuest = async () => {
    // Set a minimal guest user and navigate (no auth token)
    await login(null, { _id: 'guest', username: 'Guest', email: 'guest@local', role: 'user', userPoints: 0 });
    router.replace('/HomePageScreen');
  };



  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1503602642458-232111445657?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=bf884ad570b50659c5fa2dc2cfb20ecf&auto=format&fit=crop&w=1000&q=100',
        }}
        style={styles.background}
        imageStyle={{ opacity: 0.8 }}
      >
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, isSignup ? styles.tabActive : null]}
            onPress={showSignup}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, isSignup ? styles.tabTextActive : null]}>Sign up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, !isSignup ? styles.tabActive : null]}
            onPress={showLogin}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, !isSignup ? styles.tabTextActive : null]}>Log in</Text>
          </TouchableOpacity>
        </View>


        <Animated.View style={[styles.login, { top: loginTop, opacity: loginOpacity }]}>
          <View style={styles.loginInner}>
            <Text style={[styles.formTitle, { color: '#000' }]} onPress={toggleForm}>
              <Text style={{ opacity: isSignup ? 0.4 : 1 }}>or </Text>Log in
            </Text>
            {!isSignup ? (
              <>
                <View style={styles.formHolder}>
                  <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#888"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                <TouchableOpacity style={[styles.submitBtn, styles.loginBtn]} onPress={handleLogin} disabled={loading}>
                  <Text style={styles.submitText}>{loading ? 'Signing in...' : 'Log in'}</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </Animated.View>

      </ImageBackground>

      <TouchableOpacity style={styles.guestBottomRoot} onPress={handleGuest} activeOpacity={0.8}>
        <Text style={styles.guestText}>Continue without an account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1E8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    width: width,
    height: height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signup: {
    position: 'absolute',
    width: width * 0.65,
    backgroundColor: '#222',
    borderRadius: 15,
    zIndex: 5,
    padding: 20,
  },
  login: {
    position: 'absolute',
    width: width * 0.9,
    height: height * 0.6,
    backgroundColor: '#fff',
    zIndex: 5,
    borderRadius: 15,
    padding: 10,
  },
  loginInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%',
    alignSelf: 'center',
  },
  formTitle: {
    fontSize: 24,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 20,
  },
  formHolder: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 20,
    width: '100%',
  },
  input: {
    height: 40,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 14,
    color: '#000',
  },
  submitBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 15,
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  loginBtn: {
    backgroundColor: '#6B92A4',
  },
  guestBtn: {
    marginTop: 12,
    paddingVertical: 10,
  },
  guestText: {
    color: '#6B92A4',
    textDecorationLine: 'underline',
  },
  guestBottomRoot: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    zIndex: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  submitText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 'bold',
  },
  tabBar: {
    position: 'absolute',
    bottom: 160,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 8,
    zIndex: 999,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#6B92A4',
  },
  tabText: {
    color: '#6B92A4',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
});
