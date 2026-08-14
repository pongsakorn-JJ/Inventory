import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatCard } from "../components/StatCard";
import { BRAND_NAME, CardShadow, Colors, Radius, Spacing, formatCurrency } from "../constants/brand";
import { useApp } from "../context/AppContext";

const MAX_CONTENT_WIDTH = 900;

export default function Dashboard() {
  const { user, dashboard, dashboardLoading, refreshDashboard } = useApp();
  const router = useRouter();

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="lock-closed-outline" size={40} color={Colors.inkFaint} />
        <Text style={styles.lockedTitle}>เข้าสู่ระบบเพื่อดูแดชบอร์ด</Text>
        <TouchableOpacity style={styles.lockedButton} onPress={() => router.push("/login")}>
          <Text style={styles.lockedButtonText}>ไปหน้าล็อกอิน</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const stock = dashboard?.stock;
  const sales = dashboard?.sales;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        refreshControl={<RefreshControl refreshing={dashboardLoading} onRefresh={refreshDashboard} />}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>{BRAND_NAME}</Text>
            <Text style={styles.title}>แดชบอร์ดคลังสินค้า</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={refreshDashboard}>
            <Ionicons name="refresh" size={20} color={Colors.onDark} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.statGrid}>
            <StatCard icon="cube-outline" label="รายการสินค้า" value={stock?.totalProducts ?? "-"} tint={Colors.nav} tintText={Colors.onDarkSoft} />
            <StatCard icon="layers-outline" label="จำนวนสต็อก (ชิ้น)" value={stock?.totalStockUnits ?? "-"} tint={Colors.primaryDark} tintText="#C7CCF7" />
            <StatCard
              icon="alert-circle-outline"
              label="สต็อกใกล้หมด"
              value={stock?.lowStockItems.length ?? "-"}
              tint={Colors.danger}
              tintText="#F7C9C9"
            />
            <StatCard icon="wallet-outline" label="มูลค่าสต็อกรวม" value={stock ? formatCurrency(stock.stockValue) : "-"} tint={Colors.accent} tintText="#C6EDDF" />
            <StatCard icon="cash-outline" label="ยอดขายรวม" value={sales ? formatCurrency(sales.totalRevenue) : "-"} tint={Colors.warning} tintText="#FBE3BF" />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>สินค้าใกล้หมดสต็อก</Text>
            <Text style={styles.sectionHint}>เกณฑ์ ≤ {stock?.lowStockThreshold ?? 5} ชิ้น</Text>
          </View>
          <View style={[styles.card, CardShadow]}>
            {!stock || stock.lowStockItems.length === 0 ? (
              <Text style={styles.emptyText}>ไม่มีสินค้าใกล้หมดสต็อก</Text>
            ) : (
              stock.lowStockItems.map((item) => (
                <View key={item.id} style={styles.rowLine}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    <Text style={styles.rowSub}>
                      {item.brand} • {item.location || "ไม่ระบุตำแหน่ง"}
                    </Text>
                  </View>
                  <View style={[styles.qtyPill, item.stockQuantity === 0 && { backgroundColor: Colors.danger }]}>
                    <Text style={styles.qtyPillText}>{item.stockQuantity} ชิ้น</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>สต็อกตามตำแหน่งจัดเก็บ</Text>
          </View>
          <View style={[styles.card, CardShadow]}>
            {!stock || stock.byLocation.length === 0 ? (
              <Text style={styles.emptyText}>ยังไม่มีข้อมูลตำแหน่งจัดเก็บ</Text>
            ) : (
              stock.byLocation.map((loc) => (
                <View key={loc.location} style={styles.rowLine}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{loc.location}</Text>
                    <Text style={styles.rowSub}>{loc.productCount} รายการ</Text>
                  </View>
                  <Text style={styles.rowValue}>{loc.stockUnits} ชิ้น</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>สรุปยอดขายตามสินค้า</Text>
            <Text style={styles.sectionHint}>{sales?.totalOrders ?? 0} รายการขาย</Text>
          </View>
          <View style={[styles.card, CardShadow]}>
            {!sales || sales.byProduct.length === 0 ? (
              <Text style={styles.emptyText}>ยังไม่มีข้อมูลการขาย</Text>
            ) : (
              <>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>สินค้า</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>ขายแล้ว</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>ยอดขาย</Text>
                </View>
                {sales.byProduct.map((row) => (
                  <View key={row.name} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2, fontWeight: "600" }]} numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{row.quantitySold}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: "right", color: Colors.primary, fontWeight: "700" }]}>
                      {formatCurrency(row.revenue)}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>รายการขายล่าสุด</Text>
          </View>
          <View style={[styles.card, CardShadow]}>
            {!sales || sales.recent.length === 0 ? (
              <Text style={styles.emptyText}>ยังไม่มีประวัติการขาย</Text>
            ) : (
              sales.recent.map((r) => (
                <View key={r.id} style={styles.rowLine}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>ใบเสร็จ #{r.id}</Text>
                    <Text style={styles.rowSub}>
                      {r.date} {r.username ? `• โดย ${r.username}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.rowValue}>{formatCurrency(r.total)}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xxl, backgroundColor: Colors.bg, gap: Spacing.sm },
  lockedTitle: { fontSize: 15, fontWeight: "700", color: Colors.ink },
  lockedButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: Radius.md, marginTop: Spacing.sm },
  lockedButtonText: { color: Colors.onDark, fontWeight: "700" },

  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, backgroundColor: Colors.nav },
  eyebrow: { color: Colors.accent, fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: Colors.onDark, fontSize: 18, fontWeight: "700" },
  iconButton: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.navElevated, alignItems: "center", justifyContent: "center" },

  content: { maxWidth: MAX_CONTENT_WIDTH, width: "100%", alignSelf: "center", paddingHorizontal: Spacing.lg },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, marginTop: Spacing.lg },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.ink },
  sectionHint: { fontSize: 11, color: Colors.inkFaint },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md },
  emptyText: { color: Colors.inkFaint, fontSize: 13, textAlign: "center", paddingVertical: Spacing.sm },

  rowLine: { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceAlt },
  rowTitle: { fontSize: 13, fontWeight: "700", color: Colors.ink },
  rowSub: { fontSize: 11, color: Colors.inkFaint, marginTop: 2 },
  rowValue: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  qtyPill: { backgroundColor: Colors.warning, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  qtyPillText: { color: Colors.onDark, fontSize: 11, fontWeight: "700" },

  tableHeaderRow: { flexDirection: "row", paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableHeaderText: { fontSize: 11, color: Colors.inkFaint, fontWeight: "700", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.surfaceAlt, alignItems: "center" },
  tableCell: { fontSize: 13, color: Colors.ink },
});
