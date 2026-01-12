import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import {
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig"; // adjust path if needed

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');

    const cleanEmail = email.replace(/\s+/g, '');

    // Validation
    if (!cleanEmail || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (!cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = userCredential.user;

      // 2️⃣ Save user profile to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: cleanEmail,
        role: "farmer",
        createdAt: new Date()
      });

      // 3️⃣ Sign out so user must log in manually
      await signOut(auth);

      // 4️⃣ Success alert → Login screen
      Alert.alert(
        "Account Created",
        "Your account was created successfully. Please log in to continue.",
        [
          {
            text: "OK",
            onPress: () => router.replace('/screens/LoginScreen')
          }
        ]
      );

    } catch (error) {
      let message = 'Registration failed. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email format.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Internet connection is required to register.';
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

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

      <Text style={styles.title}>Sign up</Text>

      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
          setError('');
          setEmail(text.replace(/\s+/g, ''));
        }}
      />

      {/* Password */}
      <Text style={styles.label}>Create a password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Must be at least 8 characters"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!passwordVisible}
          value={password}
          onChangeText={(text) => {
            setError('');
            setPassword(text);
          }}
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
          <Ionicons
            name={passwordVisible ? 'eye-off' : 'eye'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      {/* Confirm Password */}
      <Text style={styles.label}>Confirm password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Repeat password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!confirmVisible}
          value={confirmPassword}
          onChangeText={(text) => {
            setError('');
            setConfirmPassword(text);
          }}
        />
        <TouchableOpacity onPress={() => setConfirmVisible(!confirmVisible)}>
          <Ionicons
            name={confirmVisible ? 'eye-off' : 'eye'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      {/* Register Button */}
      <TouchableOpacity
        style={styles.registerButton}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.registerText}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.line} />
      </View>

      {/* Login Redirect */}
      <Text style={styles.footerText}>
        Already have an account?{' '}
        <Text
          style={styles.loginLink}
          onPress={() => router.push('/screens/LoginScreen')}
        >
          Log in
        </Text>
      </Text>
    </View>
  );
}

// ✅ STYLES (TOUCH ISSUE FIXED)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'center',
  },

  /* Touchable controls position */
  logoTouchable: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },

  /* Image itself is NOT absolute */
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 15,
    fontWeight: '500',
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
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  registerButton: {
    backgroundColor: '#1D503A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  registerText: {
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
  loginLink: {
    color: '#000000',
    fontWeight: '700',
  },
});
