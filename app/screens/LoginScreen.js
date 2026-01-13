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

import {
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // 🔒 Auto-login ONLY if verified
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.emailVerified) {
          router.replace('/tabs');
        } else {
          await signOut(auth);
        }
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

      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = userCredential.user;

      // 🔒 Block unverified users
      if (!user.emailVerified) {
        await signOut(auth);

        Alert.alert(
          "Email Not Verified",
          "Please verify your Gmail first. You can resend the verification email below."
        );
        return;
      }

      // 🔁 Sync verification status (optional but good practice)
      await updateDoc(doc(db, "users", user.uid), {
        emailVerified: true
      });

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
        message = "Internet connection required.";
      }

      Alert.alert("Login Error", message);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Resend Verification Email
const handleResendVerification = async () => {
  const cleanEmail = email.replace(/\s+/g, '');

  if (!cleanEmail) {
    Alert.alert(
      "Email Required",
      "Please enter your Gmail address first."
    );
    return;
  }

  try {
    // 🔐 Firebase requires a signed-in user to resend verification
    if (!password) {
      Alert.alert(
        "Verification Email",
        "To resend the verification email, please log in once or reset your password."
      );
      return;
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );

    const user = userCredential.user;

    if (user.emailVerified) {
      Alert.alert(
        "Already Verified",
        "This email is already verified. You can log in."
      );
      await signOut(auth);
      return;
    }

    await sendEmailVerification(user);
    await signOut(auth);

    Alert.alert(
      "Verification Sent",
      "A new verification email has been sent. Please check your inbox or spam folder."
    );

  } catch (error) {
    let message = "Unable to resend verification email.";

    if (error.code === "auth/user-not-found") {
      message = "No account found with this email.";
    } else if (error.code === "auth/wrong-password") {
      message =
        "Incorrect password. You may reset your password to regain access.";
    } else if (error.code === "auth/invalid-email") {
      message = "Invalid email format.";
    } else if (error.code === "auth/network-request-failed") {
      message = "Internet connection required.";
    }

    Alert.alert("Resend Error", message);
  }
};

  // 🔑 Forgot Password
  const handleForgotPassword = async () => {
    const cleanEmail = email.replace(/\s+/g, '');

    if (!cleanEmail) {
      Alert.alert("Email Required", "Please enter your email address first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);

      Alert.alert(
        "Password Reset Sent",
        "A password reset link has been sent to your email."
      );
    } catch (error) {
      let message = "Unable to send reset email.";

      if (error.code === "auth/user-not-found") {
        message = "No account found with this email.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email format.";
      } else if (error.code === "auth/network-request-failed") {
        message = "Internet connection required.";
      }

      Alert.alert("Reset Error", message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

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

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Log in</Text>

        {/* Email */}
        <Text style={styles.label}>Gmail Address</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          placeholder="Enter your Gmail address"
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => setEmail(text.replace(/\s+/g, ''))}
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            secureTextEntry={!passwordVisible}
            placeholder="Enter password"
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
        <TouchableOpacity onPress={handleForgotPassword}>
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

        {/* Footer */}
        <Text style={styles.footerText}>
          Don't have an account?{' '}
          <Text
            style={styles.signUpLink}
            onPress={() => router.push('/screens/RegisterScreen')}
          >
            Sign up
          </Text>
        </Text>

        <Text style={styles.footerText}>
          Didn’t receive the verification email?{' '}
          <Text
            style={styles.signUpLink}
            onPress={handleResendVerification}
          >
            Resend
          </Text>
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

// ✅ STYLES (ONLY ONE SMALL ADDITION)
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
    marginBottom: 15,
  },
  signUpLink: {
    color: '#000000',
    fontWeight: '700',
  },
  resendLink: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    color: '#1D503A',
    fontWeight: '600',
  },
});
