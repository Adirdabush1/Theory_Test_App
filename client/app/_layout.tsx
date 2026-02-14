import React, { useContext, useEffect, useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthProvider, AuthContext } from '../src/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import LottieWrapper from '../src/components/LottieWrapper';

// ----------------- Custom Drawer Content -----------------
function CustomDrawerContent({ navigation }: any) {
  const { logout, user } = useContext(AuthContext);

  return (
    <View style={styles.drawerContainer}>
      {user ? (
        <>
          <Text style={styles.userName}>Welcome, {user.username}!</Text>

          {/* Home */}
          <TouchableOpacity
            style={styles.drawerButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('HomePageScreen')}
          >
            <MaterialIcons name="home" size={22} color="#007bff" />
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity
            style={styles.drawerButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ProfileScreen')}
          >
            <MaterialIcons name="person" size={22} color="#007bff" />
            <Text style={styles.buttonText}>Profile</Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutButton, { marginTop: 'auto' }]}
            activeOpacity={0.7}
            onPress={async () => {
              await logout();
              navigation.navigate('LoginScreen');
            }}
          >
            <MaterialIcons name="logout" size={22} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={[styles.drawerButton, { marginTop: 50 }]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('LoginScreen')}
        >
          <MaterialIcons name="login" size={22} color="#007bff" />
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ----------------- App Navigator -----------------
function AppNavigator() {
  const { user, loadingAuthState } = useContext(AuthContext);

  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [minimumTimePassed, setMinimumTimePassed] = useState(false);

  // זמן מינימלי — 2.5 שניות
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumTimePassed(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // קביעת מסך פתיחה
  useEffect(() => {
    if (!loadingAuthState && minimumTimePassed) {
      setInitialRoute(user ? 'HomePageScreen' : 'LoginScreen');
    }
  }, [user, loadingAuthState, minimumTimePassed]);

  // טעינה (לוטי)
  if (!minimumTimePassed || loadingAuthState || !initialRoute) {
    return (
      <View style={styles.loadingContainer}>
        <LottieWrapper
          source={require('../assets/driving.json')}
          style={{ width: 250, height: 250 }}
        />
      </View>
    );
  }

  return (
    <Drawer
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: true,
        drawerPosition: 'right',
        drawerStyle: {
          backgroundColor: '#f8f9fa',
          width: 260,
          paddingVertical: 30,
        },
        headerTitle: '',
      }}
      drawerContent={(props) => (
        <>
          <TouchableOpacity
            onPress={() => props.navigation.toggleDrawer()}
            style={{ position: 'absolute', top: 15, right: 15, zIndex: 1000 }}
          >
            <MaterialIcons name="menu" size={28} color="#212529" />
          </TouchableOpacity>

          <CustomDrawerContent {...props} />
        </>
      )}
    >
      <Drawer.Screen name="HomePageScreen" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ProfileScreen" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="LoginScreen" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="SignupScreen" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ForgotPasswordScreen" options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}

// ----------------- Root Layout -----------------
export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

// ----------------- Styles -----------------
const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
  },
  userName: {
    fontSize: 20,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 20,
  },
  drawerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#e9ecef',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 17,
    color: '#212529',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#dc3545',
  },
  logoutText: {
    color: '#fff',
    fontSize: 17,
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
