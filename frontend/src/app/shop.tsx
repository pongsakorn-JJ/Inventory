import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ProductCard } from "../components/ProductCard";
import { BRAND_NAME, Colors, Radius, Spacing } from "../constants/brand";
import { Product, useApp } from "../context/AppContext";

const CATEGORY_ALL = "ทั้งหมด";
const SEARCH_DEBOUNCE_MS = 300;
const MAX_CONTENT_WIDTH = 1200;

export default function Shop() {
  const { user, products, productsLoading, productsError, refreshProducts, favorites, toggleFavorite, addToCart } = useApp();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(CATEGORY_ALL);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshProducts(search.trim() || undefined);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const categories = useMemo(() => [CATEGORY_ALL, ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const filtered = products.filter((p) => category === CATEGORY_ALL || p.category === category);

  const columns = width >= 1100 ? 4 : width >= 820 ? 3 : width >= 560 ? 2 : 1;
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH) - Spacing.lg * 2;
  const cardWidth = (contentWidth - Spacing.md * (columns - 1)) / columns;

  const handleToggleFavorite = async (product: Product) => {
    if (!user) {
      setLoginPromptVisible(true);
      return;
    }
    setBusyId(product.id);
    await toggleFavorite(product.id);
    setBusyId(null);
  };

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      setLoginPromptVisible(true);
      return;
    }
    setBusyId(product.id);
    await addToCart(product.id);
    setBusyId(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.eyebrow}>{BRAND_NAME}</Text>
        <Text style={styles.title}>สินค้าทั้งหมด</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center", width: "100%" }]}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={Colors.inkFaint} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาสินค้า, แบรนด์..."
            placeholderTextColor={Colors.inkFaint}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.inkFaint} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {categories.map((c) => (
            <TouchableOpacity key={c} style={[styles.categoryChip, category === c && styles.categoryChipActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.categoryText, category === c && styles.categoryTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {productsLoading && filtered.length === 0 ? (
          <Text style={styles.emptyText}>กำลังโหลดสินค้า...</Text>
        ) : productsError ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={44} color={Colors.danger} />
            <Text style={styles.emptyText}>โหลดข้อมูลไม่สำเร็จ: {productsError}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={44} color={Colors.inkFaint} />
            <Text style={styles.emptyText}>ไม่พบสินค้าที่ค้นหา</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((p) => (
              <View key={p.id} style={{ width: cardWidth }}>
                <ProductCard
                  product={p}
                  mode="shop"
                  busy={busyId === p.id}
                  isFavorite={favorites.includes(p.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onAddToCart={handleAddToCart}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={loginPromptVisible}
        title="เข้าสู่ระบบก่อน"
        message="เข้าสู่ระบบเพื่อเพิ่มลงตะกร้าหรือถูกใจสินค้า"
        confirmLabel="ไปหน้าล็อกอิน"
        onConfirm={() => {
          setLoginPromptVisible(false);
          router.push("/login");
        }}
        onCancel={() => setLoginPromptVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, backgroundColor: Colors.nav },
  eyebrow: { color: Colors.accent, fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: Colors.onDark, fontSize: 18, fontWeight: "700" },

  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  searchWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, marginTop: Spacing.lg, paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 14, color: Colors.ink },
  categoryRow: { marginTop: Spacing.md, flexGrow: 0 },
  categoryChip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surface, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  categoryChipActive: { backgroundColor: Colors.nav, borderColor: Colors.nav },
  categoryText: { color: Colors.inkSoft, fontSize: 13, fontWeight: "600" },
  categoryTextActive: { color: Colors.onDark },

  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { color: Colors.inkFaint, marginTop: 10, fontSize: 14, textAlign: "center" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, marginTop: Spacing.lg },
});
