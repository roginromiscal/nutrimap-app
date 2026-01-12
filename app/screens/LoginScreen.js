import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig"; // adjust path if needed

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // ✅ Auto-login if user is already authenticated (works offline)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/tabs');
      }
    });

    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    const cleanEmail = email.replace(/\s+/g, '');

    if (!cleanEmail || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, cleanEmail, password);

      Alert.alert("Success", "Login successful!");
      router.replace('/tabs');

    } catch (error) {
      let message = "Login failed. Please try again.";

      if (error.code === "auth/user-not-found") {
        message = "No account found with this email.";
      } else if (error.code === "auth/wrong-password") {
        message = "Incorrect password.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email format.";
      } else if (error.code === "auth/network-request-failed") {
        message =
          "No internet connection. Please connect at least once to log in.";
      }

      Alert.alert("Login Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ✅ Clickable Logo → Welcome Screen */}
      <TouchableOpacity
        style={styles.logoTouchable}
        onPress={() => router.replace('/screens/WelcomeScreen')}
        activeOpacity={0.8}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      >
        <Image
          source={require('../../assets/images/nutrimap-logo.png')}
          style={styles.logo}
        />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Log in</Text>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => {
            const noSpaces = text.replace(/\s+/g, '');
            setEmail(noSpaces);
          }}
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            <Ionicons
              name={passwordVisible ? 'eye-off' : 'eye'}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginText}>
            {loading ? 'Logging in...' : 'Log In'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
        </View>

        {/* Register Redirect */}
        <Text style={styles.footerText}>
          Don't have an account?{' '}
          <Text
            style={styles.signUpLink}
            onPress={() => router.push('/screens/RegisterScreen')}
          >
            Sign up
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ✅ STYLES (FIXED TOUCH ISSUE)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },

  /* ✅ Touchable controls position */
  logoTouchable: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },

  /* ✅ Image is NOT absolute */
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 30,
    marginTop: 60,
  },
  label: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 14,
    color: '#111827',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  forgotPassword: {
    textAlign: 'right',
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#1D503A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  footerText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 15,
  },
  signUpLink: {
    color: '#000000',
    fontWeight: '700',
  },
});
