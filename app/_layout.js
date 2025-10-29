import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="screens/WelcomeScreen" options={{ headerShown: false }} />
      <Stack.Screen name="screens/LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="screens/RegisterScreen" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
