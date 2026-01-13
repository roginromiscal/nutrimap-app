import { useRouter } from "expo-router";
import { onAuthStateChanged, sendPasswordResetEmail, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../firebaseConfig";

export default function SettingsScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loadingReset, setLoadingReset] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email ?? '');
    });
    return unsubscribe;
  }, []);

  const tryOpenEmailInbox = async () => {
    const gmailAppURL = 'googlegmail://inbox';
    const iosMailURL = 'message://';
    const webMailURL = 'https://mail.google.com/mail/u/0/#inbox';

    try {
      if (await Linking.canOpenURL(gmailAppURL)) {
        await Linking.openURL(gmailAppURL);
        return;
      }
      if (await Linking.canOpenURL(iosMailURL)) {
        await Linking.openURL(iosMailURL);
        return;
      }
      await Linking.openURL(webMailURL);
    } catch (err) {
      Alert.alert('Could not open mail app', 'Please open your mail app to check the password reset email.');
    }
  };

  const handleChangePassword = async () => {
    if (!email) {
      Alert.alert('No account', 'No user is currently signed in.');
      return;
    }

    try {
      setLoadingReset(true);
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password reset',
        `A password reset email was sent to ${email}.`,
        [
          { text: 'Open email', onPress: tryOpenEmailInbox },
          { text: 'OK' },
        ]
      );
    } catch (err) {
      const message = err?.code === 'auth/network-request-failed'
        ? 'Internet connection is required to request a password reset.'
        : 'Could not send password reset email. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoadingReset(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoadingLogout(true);
      await signOut(auth);
      router.replace('/screens/WelcomeScreen');
      Alert.alert('Logged out', 'You have been signed out successfully.');
    } catch (err) {
      Alert.alert('Logout failed', 'Unable to sign out. Please try again.');
    } finally {
      setLoadingLogout(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/profile icon.png')}
        style={styles.avatar}
        resizeMode="cover"
      />

      <Text style={styles.emailText}>{email || 'Not signed in'}</Text>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleChangePassword}
        disabled={loadingReset || !email}
      >
        {loadingReset ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Change password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
        disabled={loadingLogout}
      >
        {loadingLogout ? (
          <ActivityIndicator color="#1D503A" />
        ) : (
          <Text style={styles.logoutText}>Logout</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  emailText: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
    fontWeight: '600',
  },
  button: {
    width: '80%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutButton: {
    backgroundColor: '#1D503A',
    marginTop: 15,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1D503A',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    color: '#1D503A',
    fontSize: 16,
    fontWeight: '600',
  },
});
