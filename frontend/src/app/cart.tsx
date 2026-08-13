import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Receipt, useApp } from "../context/AppContext";

export default function Cart() {
  const { cart, products, updateQuantity, removeFromCart, cartTotal, checkout } = useApp();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [processing, setProcessing] = useState(false);

  const formatPrice = (n: number) => `฿${n.toLocaleString()}`;

  const handleCheckout = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const r = await checkout();
      if (r) setReceipt(r);
      else Alert.alert("ทำรายการไม่สำเร็จ", "ตะกร้าว่างเปล่า หรือเกิดข้อผิดพลาดระหว่างชำระเงิน กรุณาลองใหม่");
    } finally {
      setProcessing(false);
    }
  };

  if (receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.receiptWrap}>
          <View style={styles.receiptCard}>
            <Ionicons name="checkmark-circle" size={48} color="#2e7d32" style={{ alignSelf: "center", marginBottom: 10 }} />
            <Text style={styles.receiptTitle}>ชำระเงินสำเร็จ</Text>
            <Text style={styles.receiptSub}>ใบเสร็จ #{receipt.id.slice(-6)}</Text>
            <Text style={styles.receiptDate}>{receipt.date}</Text>
            <View style={styles.divider} />
            {receipt.items.map((item, idx) => (
              <View key={idx} style={styles.receiptRow}>
                <Text style={styles.receiptItemName}>{item.name} x{item.quantity}</Text>
                <Text style={styles.receiptItemPrice}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptTotalLabel}>ยอดรวมทั้งหมด</Text>
              <Text style={styles.receiptTotalValue}>{formatPrice(receipt.total)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.doneButton} onPress={() => setReceipt(null)}>
            <Text style={styles.doneButtonText}>กลับไปช้อปต่อ</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>ตะกร้าสินค้า</Text>
      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>ตะกร้าว่างเปล่า</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {cart.map((c) => {
              const p = products.find((p) => p.id === c.productId);
              if (!p) return null;
              return (
                <View key={c.productId} style={styles.cartItem}>
                  <Image source={{ uri: p.image }} style={styles.cartImage} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.cartName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.cartPrice}>{formatPrice(p.price)}</Text>
                    <View style={styles.stepper}>
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQuantity(c.productId, c.quantity - 1)}>
                        <Ionicons name="remove" size={14} color="#fff" />
                      </TouchableOpacity>
                      <Text style={styles.stepperQty}>{c.quantity}</Text>
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQuantity(c.productId, c.quantity + 1)}>
                        <Ionicons name="add" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeFromCart(c.productId)}>
                    <Ionicons name="trash-outline" size={20} color="#e63946" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.checkoutBar}>
            <View>
              <Text style={styles.totalLabel}>ยอดรวม</Text>
              <Text style={styles.totalValue}>{formatPrice(cartTotal)}</Text>
            </View>
            <TouchableOpacity style={[styles.checkoutButton, processing && { opacity: 0.6 }]} onPress={handleCheckout} disabled={processing}>
              <Text style={styles.checkoutButtonText}>{processing ? "กำลังทำรายการ..." : "ชำระเงิน"}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { fontSize: 20, fontWeight: "700", color: "#222", padding: 16, paddingBottom: 0 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#999", marginTop: 10, fontSize: 14 },
  cartItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 10, marginBottom: 12 },
  cartImage: { width: 60, height: 60, borderRadius: 8 },
  cartName: { fontWeight: "700", fontSize: 13, color: "#222" },
  cartPrice: { color: "#bfa14a", fontWeight: "700", fontSize: 12, marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: "#000", borderRadius: 8, alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 6, paddingVertical: 3, gap: 10 },
  stepperBtn: { padding: 2 },
  stepperQty: { color: "#fff", fontWeight: "700", fontSize: 12, minWidth: 16, textAlign: "center" },
  checkoutBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee" },
  totalLabel: { fontSize: 12, color: "#999" },
  totalValue: { fontSize: 18, fontWeight: "800", color: "#222" },
  checkoutButton: { backgroundColor: "#000", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  checkoutButtonText: { color: "#fff", fontWeight: "700" },
  receiptWrap: { padding: 20 },
  receiptCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  receiptTitle: { fontSize: 18, fontWeight: "800", textAlign: "center", color: "#222" },
  receiptSub: { textAlign: "center", color: "#999", fontSize: 12, marginTop: 4 },
  receiptDate: { textAlign: "center", color: "#bbb", fontSize: 11, marginBottom: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#eee", marginVertical: 12 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  receiptItemName: { fontSize: 13, color: "#333", flex: 1 },
  receiptItemPrice: { fontSize: 13, color: "#333", fontWeight: "600" },
  receiptTotalLabel: { fontSize: 15, fontWeight: "800", color: "#222" },
  receiptTotalValue: { fontSize: 15, fontWeight: "800", color: "#bfa14a" },
  doneButton: { backgroundColor: "#000", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  doneButtonText: { color: "#fff", fontWeight: "700" },
});