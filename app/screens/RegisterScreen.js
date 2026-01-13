import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Email FORMAT validation only (existence is verified via email link)
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value) {
      setEmailError('');
      return;
    }

    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email format.');
      return;
    }

    if (!value.endsWith('@gmail.com')) {
      setEmailError('Only Gmail accounts are allowed.');
      return;
    }

    setEmailError('');
  };

  const handleRegister = async () => {
    setError('');

    const cleanEmail = email.replace(/\s+/g, '');

    if (!cleanEmail || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (emailError) {
      setError('Please fix the email address.');
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

      // 2️⃣ Send verification email (THIS proves Gmail exists)
      await sendEmailVerification(user);

      // 3️⃣ Save user profile (pending verification)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: cleanEmail,
        role: "farmer",
        emailVerified: false,
        createdAt: new Date()
      });

      // 4️⃣ Force logout until email is verified
      await signOut(auth);

      // 5️⃣ Inform user clearly
      Alert.alert(
        "Verify Your Email",
        "A verification link has been sent to your Gmail account. Please verify your email before logging in.",
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
        message = 'This Gmail account is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid Gmail format.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Internet connection is required.';
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* Logo → Welcome */}
      <TouchableOpacity
        style={styles.logoTouchable}
        onPress={() => router.replace('/screens/WelcomeScreen')}
      >
        <Image
          source={require('../../assets/images/nutrimap-logo.png')}
          style={styles.logo}
        />
      </TouchableOpacity>

      <Text style={styles.title}>Sign up</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Email */}
      <Text style={styles.label}>Gmail Address</Text>
      <TextInput
        style={[
          styles.input,
          emailError ? { borderColor: '#DC2626' } : null
        ]}
        placeholder="Enter your Gmail address"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={(text) => {
          const cleaned = text.replace(/\s+/g, '');
          setEmail(cleaned);
          setError('');
          validateEmail(cleaned);
        }}
      />

      {emailError ? (
        <Text style={styles.inlineErrorText}>{emailError}</Text>
      ) : (
        <Text style={styles.helperText}>
          You must verify your Gmail before logging in.
        </Text>
      )}

      {/* Password */}
      <Text style={styles.label}>Create a password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="At least 8 characters"
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

      {/* Footer */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text
            style={styles.loginLink}
            onPress={() => router.push('/screens/LoginScreen')}
          >
            Log in
          </Text>
        </Text>

        <Text style={styles.footerText}>
          Don't have a Gmail account?{' '}
          <Text
            style={styles.loginLink}
            onPress={() => Linking.openURL('https://accounts.google.com/signup')}
          >
            Create one
          </Text>
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'center',
  },
  logoTouchable: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
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
  inlineErrorText: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 15,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 15,
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
    marginBottom: 6,
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
  footerContainer: {
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 15,
    marginBottom: 15,
  },
  loginLink: {
    color: '#000000',
    fontWeight: '700',
  },
  createGmailLink: {
    marginTop: 8,
    marginBottom: 15,
    fontSize: 13,
    color: '#1D503A',
    fontWeight: '600',
  },
});
