import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { ProductCard } from "../components/ProductCard";
import { BRAND_NAME, Colors, Radius, Spacing } from "../constants/brand";
import { Product, useApp } from "../context/AppContext";

const MAX_CONTENT_WIDTH = 1200;

export default function Favorites() {
  const { user, products, favorites, toggleFavorite, addToCart } = useApp();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [busyId, setBusyId] = useState<string | null>(null);

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  const columns = width >= 1100 ? 4 : width >= 820 ? 3 : width >= 560 ? 2 : 1;
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH) - Spacing.lg * 2;
  const cardWidth = (contentWidth - Spacing.md * (columns - 1)) / columns;

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="heart-outline" size={40} color={Colors.inkFaint} />
        <Text style={styles.lockedTitle}>เข้าสู่ระบบเพื่อดูรายการโปรด</Text>
        <TouchableOpacity style={styles.lockedButton} onPress={() => router.push("/login")}>
          <Text style={styles.lockedButtonText}>ไปหน้าล็อกอิน</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleToggleFavorite = async (product: Product) => {
    setBusyId(product.id);
    await toggleFavorite(product.id);
    setBusyId(null);
  };

  const handleAddToCart = async (product: Product) => {
    setBusyId(product.id);
    await addToCart(product.id);
    setBusyId(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.eyebrow}>{BRAND_NAME}</Text>
        <Text style={styles.title}>รายการโปรด</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center", width: "100%" }]}>
        {favoriteProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={44} color={Colors.inkFaint} />
            <Text style={styles.emptyText}>ยังไม่มีสินค้าที่ถูกใจ</Text>
            <TouchableOpacity style={styles.shopButton} onPress={() => router.push("/shop")}>
              <Text style={styles.shopButtonText}>ไปเลือกซื้อสินค้า</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {favoriteProducts.map((p) => (
              <View key={p.id} style={{ width: cardWidth }}>
                <ProductCard
                  product={p}
                  mode="shop"
                  busy={busyId === p.id}
                  isFavorite
                  onToggleFavorite={handleToggleFavorite}
                  onAddToCart={handleAddToCart}
                />
              </View>
            ))}
          </View>
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

  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  emptyState: { alignItems: "center", marginTop: 60, gap: Spacing.md },
  emptyText: { color: Colors.inkFaint, marginTop: 10, fontSize: 14, textAlign: "center" },
  shopButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: Radius.md },
  shopButtonText: { color: Colors.onDark, fontWeight: "700" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, marginTop: Spacing.lg },
});
