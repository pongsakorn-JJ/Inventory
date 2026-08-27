import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GITHUB_PRODUCTS_URL } from "../constants/api";
import { BRAND_NAME, CardShadow, Colors, LOW_STOCK_THRESHOLD, Radius, Spacing, formatCurrency } from "../constants/brand";

type GithubProduct = {
  id: string;
  name: string;
  brand: string;
  price: number;
  old_price: number | null;
  rating: number;
  category: string;
  location: string | null;
  stock_quantity: number;
  image: string;
  created_at: string;
};

export default function GithubProducts() {
  const [products, setProducts] = useState<GithubProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${GITHUB_PRODUCTS_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`โหลดไม่สำเร็จ (${res.status})`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message ?? "โหลดข้อมูลจาก GitHub ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>{BRAND_NAME}</Text>
          <Text style={styles.title}>สินค้าจาก GitHub JSON</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={loadProducts}>
          <Ionicons name="refresh" size={20} color={Colors.onDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProducts} />}
      >
        <Text style={styles.sourceText} numberOfLines={1}>
          {GITHUB_PRODUCTS_URL}
        </Text>

        {loading && products.length === 0 ? (
          <Text style={styles.emptyText}>กำลังโหลดจาก GitHub...</Text>
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={44} color={Colors.danger} />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={44} color={Colors.inkFaint} />
            <Text style={styles.emptyText}>ไม่พบสินค้าใน products.json</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map((p) => {
              const outOfStock = p.stock_quantity === 0;
              const lowStock = !outOfStock && p.stock_quantity <= LOW_STOCK_THRESHOLD;
              return (
                <View key={p.id} style={[styles.card, CardShadow]}>
                  <View style={styles.imageBox}>
                    <Image source={{ uri: p.image }} style={styles.image} resizeMode="contain" />
                    <View style={[styles.badge, outOfStock ? styles.badgeDanger : lowStock ? styles.badgeWarning : styles.badgeActive]}>
                      <Text style={styles.badgeText}>{outOfStock ? "หมดสต็อก" : lowStock ? "ใกล้หมด" : "Active"}</Text>
                    </View>
                  </View>
                  <View style={styles.body}>
                    <Text style={styles.brand}>{p.brand}</Text>
                    <Text style={styles.name} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.meta}>
                      สต็อก {p.stock_quantity} ชิ้น • {p.category}
                    </Text>
                    <Text style={styles.meta}>{p.location || "ไม่ระบุตำแหน่ง"}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>{formatCurrency(p.price)}</Text>
                      {p.old_price ? <Text style={styles.oldPrice}>{formatCurrency(p.old_price)}</Text> : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, backgroundColor: Colors.nav },
  eyebrow: { color: Colors.accent, fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: Colors.onDark, fontSize: 18, fontWeight: "700" },
  iconButton: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.navElevated, alignItems: "center", justifyContent: "center" },

  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  sourceText: { fontSize: 11, color: Colors.inkFaint, marginTop: Spacing.md },

  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { color: Colors.inkFaint, marginTop: 10, fontSize: 14, textAlign: "center" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, marginTop: Spacing.lg },

  card: { width: 220, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: "hidden" },
  imageBox: { width: "100%", aspectRatio: 1, backgroundColor: Colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  badge: { position: "absolute", top: Spacing.sm, left: Spacing.sm, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  badgeActive: { backgroundColor: Colors.accent },
  badgeWarning: { backgroundColor: Colors.warning },
  badgeDanger: { backgroundColor: Colors.danger },
  badgeText: { color: Colors.onDark, fontSize: 10, fontWeight: "700" },

  body: { padding: Spacing.md },
  brand: { fontSize: 11, color: Colors.inkFaint, textTransform: "uppercase", letterSpacing: 0.4 },
  name: { fontSize: 15, fontWeight: "700", color: Colors.ink, marginTop: 2 },
  meta: { fontSize: 11, color: Colors.inkSoft, marginTop: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: Spacing.sm },
  price: { color: Colors.primary, fontWeight: "800", fontSize: 16 },
  oldPrice: { color: Colors.inkFaint, fontSize: 11, textDecorationLine: "line-through" },
});
