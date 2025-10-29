import { router } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/nutrimap-logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Explore Nutrimap</Text>
      <Text style={styles.subtitle}>
        Soil insights and crop tips right at your fingertips
      </Text>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => router.push('/screens/LoginScreen')}
      >
        <Text style={styles.loginText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signupButton}
        onPress={() => router.push('/screens/RegisterScreen')}
      >
        <Text style={styles.signupText}>Create account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
    borderRadius: 70,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000000ff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 100,
  },
  loginButton: {
    backgroundColor: '#1D503A',
    paddingVertical: 14,
    paddingHorizontal: 100,
    borderRadius: 10,
    marginBottom: 30,
    borderWidth: 0,
    alignItems: 'center',
  },
  signupButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 70,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1D503A',
    alignItems: 'center',
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
