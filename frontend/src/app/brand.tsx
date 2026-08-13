import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "../context/AppContext";

const STORES = [
  { name: "BRAND NAME.J - สาขาสยามพารากอน", address: "991 ถ.พระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330", hours: "10:00 - 22:00 น. ทุกวัน", phone: "02-123-4567" },
  { name: "BRAND NAME.J - สาขาเซ็นทรัลเวิลด์", address: "4 ถ.ราชดำริ แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330", hours: "10:00 - 22:00 น. ทุกวัน", phone: "02-234-5678" },
];

export default function Brand() {
  const { products } = useApp();

  const stockSummary = useMemo(() => {
    const map: Record<string, { brand: string; total: number; categories: Record<string, number> }> = {};

    products.forEach((p) => {
      if (!map[p.brand]) {
        map[p.brand] = { brand: p.brand, total: 0, categories: {} };
      }

      map[p.brand].total += 1;
      map[p.brand].categories[p.category] = (map[p.brand].categories[p.category] || 0) + 1;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [products]);

  const overallStock = products.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.sectionTitle}>สรุปสต็อกสินค้า</Text>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>สินค้าทั้งหมด</Text>
          <Text style={styles.overviewValue}>{overallStock} รายการ</Text>
        </View>

        <View style={styles.tableWrap}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableCell, styles.tableHeader, { flex: 2 }]}>แบรนด์</Text>
            <Text style={[styles.tableCell, styles.tableHeader, { flex: 1, textAlign: "center" }]}>จำนวน</Text>
            <Text style={[styles.tableCell, styles.tableHeader, { flex: 2, textAlign: "center" }]}>ประเภท</Text>
          </View>

          {stockSummary.map((brandRow) => (
            <View key={brandRow.brand} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2, fontWeight: "700" }]}>{brandRow.brand}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "center", fontWeight: "600" }]}>{brandRow.total}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: "center" }]}>{Object.entries(brandRow.categories).map(([cat, count]) => `${cat} ${count}`).join(" / ")}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>สาขาร้านค้า</Text>
        {STORES.map((store) => (
          <View key={store.name} style={styles.storeCard}>
            <View style={styles.storeIconWrap}><Ionicons name="storefront" size={20} color="#bfa14a" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeName}>{store.name}</Text>
              <Text style={styles.storeDetail}>{store.address}</Text>
              <Text style={styles.storeDetail}>เวลาเปิด: {store.hours}</Text>
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${store.phone}`)}>
                <Text style={styles.storePhone}>โทร {store.phone}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#222", marginBottom: 12 },
  overviewCard: { backgroundColor: "#111", borderRadius: 16, padding: 16, marginBottom: 16 },
  overviewLabel: { color: "#ddd", fontSize: 12, marginBottom: 6 },
  overviewValue: { color: "#fff", fontSize: 24, fontWeight: "800" },
  tableWrap: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#eee" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f3efe7", paddingVertical: 10, paddingHorizontal: 12 },
  tableRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f1f1f1", paddingVertical: 10, paddingHorizontal: 12 },
  tableCell: { fontSize: 12, color: "#333" },
  tableHeader: { fontWeight: "700", color: "#222" },
  storeCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, gap: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  storeIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f8f3e7", alignItems: "center", justifyContent: "center" },
  storeName: { fontWeight: "700", fontSize: 14, color: "#222", marginBottom: 4 },
  storeDetail: { fontSize: 12, color: "#777", marginBottom: 2 },
  storePhone: { fontSize: 12, color: "#bfa14a", fontWeight: "700", marginTop: 4 },
});