import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="auth/WelcomeScreen" options={{ headerShown: false }} />
      <Stack.Screen name="auth/LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="auth/RegisterScreen" options={{ headerShown: false }} />
      <Stack.Screen name="tabs" options={{ headerShown: false }} />
    </Stack>
  );
}
