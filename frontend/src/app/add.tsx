import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Colors, Radius, Spacing } from "../constants/brand";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

const DEFAULT_CATEGORY = "ทั่วไป";

export default function AddProduct() {
  const params = useLocalSearchParams<{
    editId?: string;
    name?: string;
    brand?: string;
    price?: string;
    oldPrice?: string;
    image?: string;
    category?: string;
    location?: string;
    stockQuantity?: string;
  }>();
  const { user, products, addProduct, updateProduct } = useApp();
  const { showToast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [location, setLocation] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const editingId = params.editId ? String(params.editId) : null;

  const existingCategories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort(), [products]);

  useEffect(() => {
    if (!params.editId) return;
    setName(String(params.name ?? ""));
    setBrand(String(params.brand ?? ""));
    setPrice(String(params.price ?? ""));
    setOldPrice(String(params.oldPrice ?? ""));
    setImage(String(params.image ?? ""));
    setCategory(String(params.category ?? DEFAULT_CATEGORY));
    setLocation(String(params.location ?? ""));
    setStockQuantity(String(params.stockQuantity ?? "0"));
  }, [params.editId]);

  const handlePickImage = () => {
    if (Platform.OS !== "web") {
      showToast("ฟังก์ชันนี้รองรับเฉพาะบนเว็บเท่านั้น หากต้องการใช้งานบนโหมดมือถือ กรอก URL รูปภาพแทนได้", "info");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        setImage(result);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (!name.trim() || !brand.trim() || !price.trim() || !image.trim() || !location.trim()) {
      showToast("กรุณากรอกชื่อ แบรนด์ ราคา ตำแหน่งจัดเก็บ และรูปภาพให้ครบ", "error");
      return;
    }

    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      price: Number(price),
      oldPrice: oldPrice.trim() ? Number(oldPrice) : null,
      rating: 5.0,
      category: category.trim() || DEFAULT_CATEGORY,
      image: image.trim(),
      location: location.trim(),
      stockQuantity: Math.max(0, Number(stockQuantity) || 0),
    };

    setSubmitting(true);
    const ok = editingId ? await updateProduct(editingId, payload) : await addProduct(payload);
    setSubmitting(false);

    if (!ok) {
      showToast(editingId ? "แก้ไขสินค้าไม่สำเร็จ" : "เพิ่มสินค้าไม่สำเร็จ", "error");
      return;
    }

    showToast(editingId ? "แก้ไขสินค้าสำเร็จ" : "เพิ่มสินค้าสำเร็จ", "success");
    router.push("/products");
  };

  if (!user || user.role !== "admin") {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.lockedTitle}>{!user ? "เข้าสู่ระบบก่อนเพิ่มสินค้า" : "เฉพาะผู้ดูแลระบบเท่านั้น"}</Text>
        <Text style={styles.lockedSubtitle}>{!user ? "คุณต้องล็อกอินก่อนจึงจะเพิ่มสินค้าใหม่ได้" : "บัญชีของคุณไม่มีสิทธิ์เพิ่มหรือแก้ไขสินค้า"}</Text>
        <TouchableOpacity style={styles.lockedButton} onPress={() => router.push("/login")}>
          <Text style={styles.lockedButtonText}>ไปหน้าล็อกอิน</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.headerCard}>
          <Text style={styles.headerEyebrow}>Admin control</Text>
          <Text style={styles.header}>{editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</Text>
        </View>

        <Text style={styles.label}>ชื่อสินค้า</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="เช่น เมาส์ไร้สาย" placeholderTextColor={Colors.inkFaint} />

        <Text style={styles.label}>แบรนด์</Text>
        <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="เช่น Logitech" placeholderTextColor={Colors.inkFaint} />

        <Text style={styles.label}>หมวดหมู่</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder={DEFAULT_CATEGORY} placeholderTextColor={Colors.inkFaint} />
        {existingCategories.length > 0 && (
          <View style={styles.categoryRow}>
            {existingCategories.map((c) => (
              <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catChipActive]} onPress={() => setCategory(c)}>
                <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>ราคา (บาท)</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="เช่น 590" placeholderTextColor={Colors.inkFaint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>ราคาเดิม (ไม่บังคับ)</Text>
            <TextInput style={styles.input} value={oldPrice} onChangeText={setOldPrice} keyboardType="numeric" placeholder="เช่น 790" placeholderTextColor={Colors.inkFaint} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>ตำแหน่งจัดเก็บ</Text>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="เช่น คลัง A ชั้น 2" placeholderTextColor={Colors.inkFaint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>จำนวนสต็อก</Text>
            <TextInput style={styles.input} value={stockQuantity} onChangeText={setStockQuantity} keyboardType="numeric" placeholder="0" placeholderTextColor={Colors.inkFaint} />
          </View>
        </View>

        <Text style={styles.label}>ภาพสินค้า</Text>
        <View style={styles.imageRow}>
          <TextInput style={[styles.input, { flex: 1 }]} value={image} onChangeText={setImage} placeholder="https://... หรือ data:image/..." placeholderTextColor={Colors.inkFaint} autoCapitalize="none" />
          <TouchableOpacity style={styles.pickImageButton} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={18} color={Colors.onDark} />
          </TouchableOpacity>
        </View>

        {image ? (
          <View style={styles.previewBox}>
            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />
          </View>
        ) : null}

        <TouchableOpacity style={[styles.submitButton, submitting && styles.disabled]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitButtonText}>{submitting ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl, backgroundColor: Colors.bg },
  lockedTitle: { fontSize: 18, fontWeight: "700", color: Colors.ink, marginBottom: Spacing.sm },
  lockedSubtitle: { fontSize: 13, color: Colors.inkSoft, textAlign: "center", marginBottom: Spacing.xl },
  lockedButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: Radius.md },
  lockedButtonText: { color: Colors.onDark, fontWeight: "700" },

  form: { padding: Spacing.xl, maxWidth: 560, width: "100%", alignSelf: "center" },
  headerCard: { backgroundColor: Colors.nav, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.lg },
  headerEyebrow: { color: Colors.accent, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  header: { fontSize: 20, fontWeight: "700", marginTop: 6, color: Colors.onDark },
  label: { fontSize: 13, fontWeight: "600", color: Colors.inkSoft, marginBottom: 6, marginTop: Spacing.md },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, fontSize: 14, color: Colors.ink },
  row: { flexDirection: "row", gap: Spacing.md },
  imageRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  pickImageButton: { backgroundColor: Colors.nav, width: 46, height: 46, borderRadius: Radius.md, justifyContent: "center", alignItems: "center" },
  previewBox: { marginTop: Spacing.md, borderRadius: Radius.md, overflow: "hidden", borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceAlt, aspectRatio: 1, width: 180, alignSelf: "flex-start", alignItems: "center", justifyContent: "center" },
  previewImage: { width: "100%", height: "100%" },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginTop: Spacing.sm },
  catChip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.nav, borderColor: Colors.nav },
  catChipText: { fontSize: 12, color: Colors.inkSoft, fontWeight: "600" },
  catChipTextActive: { color: Colors.onDark },
  submitButton: { backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: 14, alignItems: "center", marginTop: Spacing.xxl },
  disabled: { opacity: 0.6 },
  submitButtonText: { color: Colors.onDark, fontWeight: "700", fontSize: 15 },
});
