import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Colors } from "../constants/brand";
import { AppProvider, useApp } from "../context/AppContext";
import { ToastProvider } from "../context/ToastContext";

function TabsNav() {
  const { user, cart } = useApp();
  const isStaff = user?.role === "admin" || user?.role === "user";
  const isAdmin = user?.role === "admin";
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.inkFaint,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={
          isStaff
            ? { title: "แดชบอร์ด", tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={color} size={size} /> }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="products"
        options={
          isStaff
            ? { title: "สินค้า", tabBarIcon: ({ color, size }) => <Ionicons name="cube" color={color} size={size} /> }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="add"
        options={
          isAdmin
            ? { title: "เพิ่มสินค้า", tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} /> }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="shop"
        options={
          isStaff
            ? { href: null }
            : { title: "ร้านค้า", tabBarIcon: ({ color, size }) => <Ionicons name="storefront" color={color} size={size} /> }
        }
      />
      <Tabs.Screen
        name="cart"
        options={
          isStaff
            ? { href: null }
            : {
                title: "ตะกร้า",
                tabBarIcon: ({ color, size }) => <Ionicons name="cart" color={color} size={size} />,
                tabBarBadge: cartCount > 0 ? cartCount : undefined,
              }
        }
      />
      <Tabs.Screen
        name="favorites"
        options={
          isStaff
            ? { href: null }
            : { title: "รายการโปรด", tabBarIcon: ({ color, size }) => <Ionicons name="heart" color={color} size={size} /> }
        }
      />
      <Tabs.Screen
        name="orders"
        options={
          isStaff
            ? { href: null }
            : { title: "คำสั่งซื้อ", tabBarIcon: ({ color, size }) => <Ionicons name="receipt" color={color} size={size} /> }
        }
      />
      <Tabs.Screen
        name="login"
        options={{
          title: user ? "บัญชี" : "เข้าสู่ระบบ",
          tabBarIcon: ({ color, size }) => <Ionicons name={user ? "person-circle" : "log-in"} color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <ToastProvider>
      <AppProvider>
        <TabsNav />
      </AppProvider>
    </ToastProvider>
  );
}
