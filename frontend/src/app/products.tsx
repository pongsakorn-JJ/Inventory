import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ProductCard } from "../components/ProductCard";
import { BRAND_NAME, Colors, Radius, Spacing } from "../constants/brand";
import { Product, useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

const CATEGORY_ALL = "ทั้งหมด";
const SEARCH_DEBOUNCE_MS = 300;
const MAX_CONTENT_WIDTH = 1200;

export default function Products() {
  const { user, products, productsLoading, productsError, refreshProducts, deleteProduct, adjustStock, recordSale } = useApp();
  const { showToast } = useToast();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(CATEGORY_ALL);
  const [saleTarget, setSaleTarget] = useState<Product | null>(null);
  const [saleQty, setSaleQty] = useState("1");
  const [saleSubmitting, setSaleSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === "admin";

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

  const handleDelete = (product: Product) => {
    setDeleteTarget(product);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setBusyId(deleteTarget.id);
    const ok = await deleteProduct(deleteTarget.id);
    setBusyId(null);
    setDeleting(false);
    setDeleteTarget(null);
    showToast(ok ? "ลบสินค้าสำเร็จ" : "ลบสินค้าไม่สำเร็จ กรุณาลองใหม่", ok ? "success" : "error");
  };

  const handleEdit = (product: Product) => {
    router.push({
      pathname: "/add",
      params: {
        editId: product.id,
        name: product.name,
        brand: product.brand,
        price: String(product.price),
        oldPrice: product.oldPrice == null ? "" : String(product.oldPrice),
        description: product.description,
        image: product.image,
        category: product.category,
        location: product.location,
        stockQuantity: String(product.stockQuantity),
      },
    });
  };

  const handleAdjustStock = async (id: string, delta: number) => {
    setBusyId(id);
    await adjustStock(id, delta);
    setBusyId(null);
  };

  const openSaleModal = (product: Product) => {
    setSaleTarget(product);
    setSaleQty("1");
  };

  const confirmSale = async () => {
    if (!saleTarget) return;
    const qty = Number(saleQty);
    if (!qty || qty <= 0) {
      showToast("กรุณากรอกจำนวนที่มากกว่า 0", "error");
      return;
    }
    if (qty > saleTarget.stockQuantity) {
      showToast(`สต็อกไม่พอ คงเหลือ ${saleTarget.stockQuantity} ชิ้น`, "error");
      return;
    }
    setSaleSubmitting(true);
    const result = await recordSale(saleTarget.id, qty);
    setSaleSubmitting(false);
    if (result.ok) {
      const name = saleTarget.name;
      setSaleTarget(null);
      showToast(`บันทึกการขาย "${name}" จำนวน ${qty} ชิ้น สำเร็จ`, "success");
    } else {
      showToast(result.error ?? "บันทึกการขายไม่สำเร็จ", "error");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>{BRAND_NAME}</Text>
          <Text style={styles.title}>รายการสินค้า</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity style={styles.addTopButton} onPress={() => router.push("/add")}>
            <Ionicons name="add" size={18} color={Colors.onDark} />
            <Text style={styles.addTopButtonText}>เพิ่มสินค้า</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center", width: "100%" }]}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={Colors.inkFaint} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาสินค้า, แบรนด์, ตำแหน่งจัดเก็บ..."
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
                  mode="staff"
                  isAdmin={isAdmin}
                  busy={busyId === p.id}
                  onSell={openSaleModal}
                  onAdjustStock={handleAdjustStock}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!saleTarget} transparent animationType="fade" onRequestClose={() => setSaleTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>บันทึกการขาย</Text>
            <Text style={styles.modalSubtitle}>{saleTarget?.name}</Text>
            <Text style={styles.modalStock}>คงเหลือในสต็อก: {saleTarget?.stockQuantity} ชิ้น</Text>
            <Text style={styles.label}>จำนวนที่ขาย</Text>
            <TextInput style={styles.input} value={saleQty} onChangeText={setSaleQty} keyboardType="numeric" placeholder="1" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSaleTarget(null)}>
                <Text style={styles.modalCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, saleSubmitting && styles.disabled]} onPress={confirmSale} disabled={saleSubmitting}>
                <Text style={styles.modalConfirmText}>{saleSubmitting ? "กำลังบันทึก..." : "ยืนยันการขาย"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="ลบสินค้า"
        message={`ต้องการลบ "${deleteTarget?.name}" ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`}
        confirmLabel={deleting ? "กำลังลบ..." : "ลบ"}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, backgroundColor: Colors.nav },
  eyebrow: { color: Colors.accent, fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: Colors.onDark, fontSize: 18, fontWeight: "700" },
  addTopButton: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.md },
  addTopButtonText: { color: Colors.onDark, fontSize: 12, fontWeight: "700" },

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

  modalBackdrop: { flex: 1, backgroundColor: "rgba(17,24,39,0.55)", alignItems: "center", justifyContent: "center", padding: Spacing.xl },
  modalCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, width: "100%", maxWidth: 360 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: Colors.ink },
  modalSubtitle: { fontSize: 13, color: Colors.inkSoft, marginTop: 4 },
  modalStock: { fontSize: 12, color: Colors.inkFaint, marginTop: 4, marginBottom: Spacing.sm },
  label: { fontSize: 13, fontWeight: "600", color: Colors.inkSoft, marginBottom: 6, marginTop: 6 },
  input: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, fontSize: 14, color: Colors.ink },
  modalActions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.lg },
  modalCancel: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  modalCancelText: { color: Colors.inkSoft, fontWeight: "600" },
  modalConfirm: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: Radius.md, backgroundColor: Colors.primary },
  modalConfirmText: { color: Colors.onDark, fontWeight: "700" },
  disabled: { opacity: 0.6 },
});
