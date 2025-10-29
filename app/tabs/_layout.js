import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="home"
              size={26}
              color={focused ? "#fff" : "#B7CDBF"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="details"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="search"
              size={26}
              color={focused ? "#fff" : "#B7CDBF"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="sensors"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="radio-outline"
              size={26}
              color={focused ? "#fff" : "#B7CDBF"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="settings-outline"
              size={26}
              color={focused ? "#fff" : "#B7CDBF"}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 30,
    left: 15,
    right: 15,
    backgroundColor: "#1B5333",
    borderRadius: 10,
    height: 50,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
});

  