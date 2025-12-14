import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#B7CDBF",
          tabBarItemStyle: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            height: 70,
            paddingBottom: 0,
          },
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
          name="scanned_area"
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

        {/* Hidden details tab - only accessible via navigation */}
        <Tabs.Screen
          name="details"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Floating Scan Button */}
      <View style={styles.scanButtonContainer}>
        <View style={styles.scanButton}>
          <Ionicons name="scan-outline" size={32} color="#1B5333" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 15,
    backgroundColor: "#1B5333",
    height: 70,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  scanButtonContainer: {
    position: "absolute",
    bottom: 45,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  scanButton: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
});

  