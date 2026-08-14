import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BRAND_NAME, CardShadow, Colors, Radius, Spacing, formatCurrency } from "../constants/brand";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

export default function Cart() {
  const { user, cart, cartLoading, products, updateCartQty, removeFromCart, checkout } = useApp();
  const { showToast } = useToast();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const lines = useMemo(
    () =>
      cart
        .map((c) => {
          const product = products.find((p) => p.id === c.productId);
          return product ? { ...c, product } : null;
        })
        .filter((l): l is { productId: string; quantity: number; product: (typeof products)[number] } => l !== null),
    [cart, products]
  );

  const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="cart-outline" size={40} color={Colors.inkFaint} />
        <Text style={styles.lockedTitle}>เข้าสู่ระบบเพื่อดูตะกร้าสินค้า</Text>
        <TouchableOpacity style={styles.lockedButton} onPress={() => router.push("/login")}>
          <Text style={styles.lockedButtonText}>ไปหน้าล็อกอิน</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleQtyChange = async (productId: string, quantity: number) => {
    setBusyId(productId);
    await updateCartQty(productId, quantity);
    setBusyId(null);
  };

  const handleRemove = async (productId: string) => {
    setBusyId(productId);
    await removeFromCart(productId);
    setBusyId(null);
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    const result = await checkout();
    setCheckingOut(false);
    if (result.ok) {
      showToast(`สั่งซื้อสำเร็จ ยอดรวม ${formatCurrency(result.order?.total ?? total)}`, "success");
    } else {
      showToast(result.error ?? "ชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", "error");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.eyebrow}>{BRAND_NAME}</Text>
        <Text style={styles.title}>ตะกร้าสินค้า</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {cartLoading && lines.length === 0 ? (
          <Text style={styles.emptyText}>กำลังโหลดตะกร้า...</Text>
        ) : lines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={44} color={Colors.inkFaint} />
            <Text style={styles.emptyText}>ตะกร้าว่างเปล่า</Text>
            <TouchableOpacity style={styles.shopButton} onPress={() => router.push("/shop")}>
              <Text style={styles.shopButtonText}>ไปเลือกซื้อสินค้า</Text>
            </TouchableOpacity>
          </View>
        ) : (
          lines.map((line) => (
            <View key={line.productId} style={[styles.line, CardShadow]}>
              <View style={styles.thumbBox}>
                <Image source={{ uri: line.product.image }} style={styles.thumb} resizeMode="contain" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineName} numberOfLines={1}>
                  {line.product.name}
                </Text>
                <Text style={styles.linePrice}>{formatCurrency(line.product.price)}</Text>
                <View style={styles.lineActions}>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      disabled={busyId === line.productId}
                      onPress={() => handleQtyChange(line.productId, line.quantity - 1)}
                    >
                      <Ionicons name="remove" size={14} color={Colors.onDark} />
                    </TouchableOpacity>
                    <Text style={styles.stepperLabel}>{line.quantity}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      disabled={busyId === line.productId || line.quantity >= line.product.stockQuantity}
                      onPress={() => handleQtyChange(line.productId, line.quantity + 1)}
                    >
                      <Ionicons name="add" size={14} color={Colors.onDark} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity disabled={busyId === line.productId} onPress={() => handleRemove(line.productId)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {lines.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ยอดรวม</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
          <TouchableOpacity style={[styles.checkoutButton, checkingOut && styles.disabled]} disabled={checkingOut} onPress={handleCheckout}>
            <Text style={styles.checkoutButtonText}>{checkingOut ? "กำลังดำเนินการ..." : "ยืนยันคำสั่งซื้อ"}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  emptyState: { alignItems: "center", marginTop: 60, gap: Spacing.md },
  emptyText: { color: Colors.inkFaint, marginTop: 10, fontSize: 14, textAlign: "center" },
  shopButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: Radius.md },
  shopButtonText: { color: Colors.onDark, fontWeight: "700" },

  line: { flexDirection: "row", gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md },
  thumbBox: { width: 72, height: 72, borderRadius: Radius.md, backgroundColor: Colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  thumb: { width: "100%", height: "100%" },
  lineName: { fontSize: 14, fontWeight: "700", color: Colors.ink },
  linePrice: { fontSize: 13, color: Colors.primary, fontWeight: "700", marginTop: 2 },
  lineActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Spacing.sm },
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.nav, borderRadius: Radius.sm, padding: 4, gap: Spacing.sm },
  stepperBtn: { backgroundColor: Colors.navElevated, borderRadius: 6, padding: 5 },
  stepperLabel: { color: Colors.onDark, fontSize: 13, fontWeight: "700", minWidth: 18, textAlign: "center" },

  footer: { padding: Spacing.lg, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.md, maxWidth: 640, width: "100%", alignSelf: "center" },
  totalLabel: { fontSize: 14, color: Colors.inkSoft, fontWeight: "600" },
  totalValue: { fontSize: 18, color: Colors.ink, fontWeight: "800" },
  checkoutButton: { backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: 14, alignItems: "center", maxWidth: 640, width: "100%", alignSelf: "center" },
  disabled: { opacity: 0.6 },
  checkoutButtonText: { color: Colors.onDark, fontWeight: "700", fontSize: 15 },
});
