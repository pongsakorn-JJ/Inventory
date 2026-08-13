import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { AppProvider, useApp } from "../context/AppContext";

function TabsNav() {
  const { user } = useApp();
  const isAdmin = user?.role === "admin";

  return (
    <Tabs
      initialRouteName="login"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee", height: 60, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="login" options={{ title: user ? "Account" : "Login", tabBarIcon: ({ color, size }) => <Ionicons name={user ? "person-circle" : "log-in"} color={color} size={size} /> }} />
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="favorites" options={{ title: "Favorites", tabBarIcon: ({ color, size }) => <Ionicons name="heart" color={color} size={size} /> }} />
      <Tabs.Screen name="cart" options={{ title: "Cart", tabBarIcon: ({ color, size }) => <Ionicons name="cart" color={color} size={size} /> }} />
      <Tabs.Screen
        name="add"
        options={
          isAdmin
            ? { title: "Add", tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} /> }
            : { href: null }
        }
      />
      <Tabs.Screen name="brand" options={{ title: "Brand", tabBarIcon: ({ color, size }) => <Ionicons name="diamond" color={color} size={size} /> }} />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <TabsNav />
    </AppProvider>
  );
}