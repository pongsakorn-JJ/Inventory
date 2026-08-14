import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BRAND_NAME, CardShadow, Colors, Radius, Spacing, formatCurrency } from "../constants/brand";
import { useApp } from "../context/AppContext";

export default function Orders() {
  const { user, orders, ordersLoading, refreshOrders } = useApp();
  const router = useRouter();

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="receipt-outline" size={40} color={Colors.inkFaint} />
        <Text style={styles.lockedTitle}>เข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ</Text>
        <TouchableOpacity style={styles.lockedButton} onPress={() => router.push("/login")}>
          <Text style={styles.lockedButtonText}>ไปหน้าล็อกอิน</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.eyebrow}>{BRAND_NAME}</Text>
        <Text style={styles.title}>ประวัติการสั่งซื้อ</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={ordersLoading} onRefresh={refreshOrders} />}
      >
        {ordersLoading && orders.length === 0 ? (
          <Text style={styles.emptyText}>กำลังโหลด...</Text>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={44} color={Colors.inkFaint} />
            <Text style={styles.emptyText}>ยังไม่มีประวัติการสั่งซื้อ</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={[styles.card, CardShadow]}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderTitle}>ใบเสร็จ #{order.id}</Text>
                <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
              </View>
              <Text style={styles.orderDate}>{order.date}</Text>
              <View style={styles.itemsList}>
                {order.items.map((item, idx) => (
                  <View key={`${order.id}-${idx}`} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name} × {item.quantity}
                    </Text>
                    <Text style={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl, backgroundColor: Colors.bg, gap: Spacing.sm },
  lockedTitle: { fontSize: 15, fontWeight: "700", color: Colors.ink },
  lockedButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: Radius.md, marginTop: Spacing.sm },
  lockedButtonText: { color: Colors.onDark, fontWeight: "700" },

  topBar: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, backgroundColor: Colors.nav },
  eyebrow: { color: Colors.accent, fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: Colors.onDark, fontSize: 18, fontWeight: "700" },

  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md, maxWidth: 640, width: "100%", alignSelf: "center" },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { color: Colors.inkFaint, marginTop: 10, fontSize: 14, textAlign: "center" },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderTitle: { fontSize: 14, fontWeight: "700", color: Colors.ink },
  orderTotal: { fontSize: 15, fontWeight: "800", color: Colors.primary },
  orderDate: { fontSize: 11, color: Colors.inkFaint, marginTop: 2, marginBottom: Spacing.sm },
  itemsList: { borderTopWidth: 1, borderTopColor: Colors.surfaceAlt, paddingTop: Spacing.sm, gap: 4 },
  itemRow: { flexDirection: "row", justifyContent: "space-between" },
  itemName: { fontSize: 12, color: Colors.inkSoft, flex: 1, marginRight: Spacing.sm },
  itemPrice: { fontSize: 12, color: Colors.ink, fontWeight: "600" },
});
