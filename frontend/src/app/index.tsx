import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "../context/AppContext";

const CATEGORIES = ["All", "Bags", "Shoes", "Accessories"];

export default function Index() {
  const { products, cart, addToCart, updateQuantity, cartCount, favorites, toggleFavorite, user, deleteProduct } = useApp();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      [p.name, p.brand, p.category, String(p.price), p.image]
        .join(" ")
        .toLowerCase()
        .includes(q);
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (n: number) => `฿${n.toLocaleString()}`;
  const getQty = (id: string) => cart.find((c) => c.productId === id)?.quantity ?? 0;

  const handleDeleteProduct = async (id: string, name: string) => {
    Alert.alert("ลบสินค้า", `ต้องการลบ "${name}" ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`, [
      {
        text: "ยกเลิก",
        style: "cancel",
      },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          const ok = await deleteProduct(id);
          if (ok) {
            Alert.alert("สำเร็จ", "ลบสินค้าเรียบร้อยแล้ว");
          } else {
            Alert.alert("ไม่สำเร็จ", "ลบสินค้าไม่สำเร็จ กรุณาลองใหม่");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topMenu}>
        <View>
          <Text style={styles.eyebrow}>Curated essentials</Text>
          <Text style={styles.title}>BRAND NAME.J</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/cart")}>
          <Ionicons name="cart-outline" size={22} color="#fff" />
          {cartCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>}
        </TouchableOpacity>
      </View>

      <View style={styles.heroPanel}>
        <Text style={styles.heroTitle}>New season arrivals</Text>
        <Text style={styles.heroText}>Discover fashion essentials for work, travel and everyday luxury.</Text>
        <View style={styles.heroStats}>
          <View style={styles.statPill}><Text style={styles.statLabel}>Items</Text><Text style={styles.statValue}>{products.length}</Text></View>
          <View style={styles.statPill}><Text style={styles.statLabel}>Favs</Text><Text style={styles.statValue}>{favorites.length}</Text></View>
          <View style={styles.statPill}><Text style={styles.statLabel}>Cart</Text><Text style={styles.statValue}>{cartCount}</Text></View>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput style={styles.searchInput} placeholder="ค้นหาสินค้า, แบรนด์, ประเภท หรือ ราคา" placeholderTextColor="#999" value={search} onChangeText={setSearch} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow} contentContainerStyle={{ paddingHorizontal: 15 }}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat} style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]} onPress={() => setActiveCategory(cat)}>
            <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.productContainer} contentContainerStyle={styles.productGrid}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bag-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>ไม่พบสินค้าที่ค้นหา</Text>
          </View>
        ) : (
          filteredProducts.map((p) => {
            const qty = getQty(p.id);
            const isFav = favorites.includes(p.id);
            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: p.image }} style={styles.image} />
                  <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(p.id)}>
                    <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#e63946" : "#333"} />
                  </TouchableOpacity>
                  {p.oldPrice && <View style={styles.discountTag}><Text style={styles.discountText}>-{Math.round((1 - p.price / p.oldPrice) * 100)}%</Text></View>}
                </View>
                <Text style={styles.brand}>{p.brand}</Text>
                <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                <View style={styles.ratingRow}><Ionicons name="star" size={12} color="#bfa14a" /><Text style={styles.ratingText}>{p.rating}</Text></View>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{formatPrice(p.price)}</Text>
                  {p.oldPrice && <Text style={styles.oldPrice}>{formatPrice(p.oldPrice)}</Text>}
                </View>

                {qty === 0 ? (
                  <TouchableOpacity style={styles.addButton} onPress={() => addToCart(p.id)}>
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.addButtonText}>ใส่ตะกร้า</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.stepper}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQuantity(p.id, qty - 1)}>
                      <Ionicons name="remove" size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.stepperQty}>{qty}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQuantity(p.id, qty + 1)}>
                      <Ionicons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}

                {user?.role === "admin" && (
                  <View style={styles.adminActions}>
                    <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: "/add", params: { editId: p.id, name: p.name, brand: p.brand, price: String(p.price), oldPrice: p.oldPrice == null ? "" : String(p.oldPrice), image: p.image, category: p.category } })}>
                      <Ionicons name="create-outline" size={14} color="#000" />
                      <Text style={styles.editButtonText}>แก้ไข</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProduct(p.id, p.name)}>
                      <Ionicons name="trash-outline" size={14} color="#e63946" />
                      <Text style={styles.deleteButtonText}>ลบสินค้า</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  topMenu: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16, backgroundColor: "#000" },
  eyebrow: { color: "#d8bf6a", fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", letterSpacing: 1 },
  iconButton: { position: "relative", width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -6, right: -8, backgroundColor: "#e63946", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  heroPanel: { marginHorizontal: 15, marginTop: 12, backgroundColor: "#111", borderRadius: 18, padding: 16 },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  heroText: { color: "#d8d8d8", fontSize: 12, marginTop: 4 },
  heroStats: { flexDirection: "row", marginTop: 14, gap: 8 },
  statPill: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flex: 1 },
  statLabel: { color: "#b8b8b8", fontSize: 10, textTransform: "uppercase" },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 2 },
  searchWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 15, marginTop: 14, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 8, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },
  categoryRow: { marginTop: 14, flexGrow: 0 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", marginRight: 10, borderWidth: 1, borderColor: "#eee" },
  categoryChipActive: { backgroundColor: "#000", borderColor: "#000" },
  categoryText: { color: "#555", fontSize: 13, fontWeight: "600" },
  categoryTextActive: { color: "#fff" },
  productContainer: { marginTop: 10, paddingHorizontal: 10 },
  productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingBottom: 20 },
  card: { width: "48%", backgroundColor: "#fff", borderRadius: 14, padding: 10, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  imageWrapper: { position: "relative" },
  image: { width: "100%", height: 130, borderRadius: 10, marginBottom: 8 },
  favoriteButton: { position: "absolute", top: 6, right: 6, backgroundColor: "#fff", borderRadius: 14, padding: 5 },
  discountTag: { position: "absolute", top: 6, left: 6, backgroundColor: "#e63946", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  brand: { fontSize: 11, color: "#999", textTransform: "uppercase" },
  productName: { fontSize: 14, fontWeight: "700", color: "#222", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  ratingText: { fontSize: 11, color: "#777" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  price: { color: "#bfa14a", fontWeight: "bold", fontSize: 14 },
  oldPrice: { color: "#aaa", fontSize: 11, textDecorationLine: "line-through" },
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#000", borderRadius: 8, paddingVertical: 7, marginTop: 8, gap: 4 },
  addButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#000", borderRadius: 8, marginTop: 8, paddingHorizontal: 6, paddingVertical: 4 },
  stepperBtn: { padding: 4 },
  stepperQty: { color: "#fff", fontWeight: "700", fontSize: 14 },
  adminActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 },
  editButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#000", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, flex: 1, gap: 4 },
  editButtonText: { color: "#000", fontSize: 12, fontWeight: "600" },
  deleteButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e63946", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, flex: 1, gap: 4 },
  deleteButtonText: { color: "#e63946", fontSize: 12, fontWeight: "600" },
  emptyState: { width: "100%", alignItems: "center", marginTop: 60 },
  emptyText: { color: "#999", marginTop: 10, fontSize: 14 },
});