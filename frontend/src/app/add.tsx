import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "../context/AppContext";

const CATEGORIES = ["Bags", "Shoes", "Accessories"];

export default function AddProduct() {
  const params = useLocalSearchParams<{ editId?: string; name?: string; brand?: string; price?: string; oldPrice?: string; image?: string; category?: string; rating?: string }>();
  const { user, addProduct, updateProduct } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const editingId = params.editId ? String(params.editId) : null;

  useEffect(() => {
    if (!params.editId) return;
    setName(String(params.name ?? ""));
    setBrand(String(params.brand ?? ""));
    setPrice(String(params.price ?? ""));
    setOldPrice(String(params.oldPrice ?? ""));
    setImage(String(params.image ?? ""));
    setCategory(params.category && CATEGORIES.includes(String(params.category)) ? String(params.category) : CATEGORIES[0]);
  }, [params.editId, params.name, params.brand, params.price, params.oldPrice, params.image, params.category]);

  const handlePickImage = () => {
    if (Platform.OS !== "web") {
      Alert.alert("เลือกภาพจากไฟล์", "ฟังก์ชันนี้รองรับเฉพาะบนเว็บเท่านั้น หากต้องการใช้งานบนโหมดมือถือ กรอก URL รูปภาพแทนได้");
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
    if (!name.trim() || !brand.trim() || !price.trim() || !image.trim()) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกชื่อ แบรนด์ ราคา และรูปภาพ");
      return;
    }

    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      price: Number(price),
      oldPrice: oldPrice.trim() ? Number(oldPrice) : null,
      rating: 5.0,
      category,
      image: image.trim(),
    };

    const ok = editingId ? await updateProduct(editingId, payload) : await addProduct(payload);
    if (!ok) {
      Alert.alert("ไม่สำเร็จ", editingId ? "แก้ไขสินค้าไม่สำเร็จ" : "เพิ่มสินค้าไม่สำเร็จ");
      return;
    }

    Alert.alert("สำเร็จ", editingId ? "แก้ไขสินค้าเรียบร้อยแล้ว" : "เพิ่มสินค้าเรียบร้อยแล้ว", [
      { text: "ตกลง", onPress: () => router.push("/") },
    ]);

    if (!editingId) {
      setName("");
      setBrand("");
      setPrice("");
      setOldPrice("");
      setImage("");
      setCategory(CATEGORIES[0]);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.lockedTitle}>{!user ? "เข้าสู่ระบบก่อนเพิ่มสินค้า" : "เฉพาะแอดมินเท่านั้น"}</Text>
        <Text style={styles.lockedSubtitle}>{!user ? "คุณต้องล็อกอินก่อนจึงจะเพิ่มสินค้าใหม่ได้" : "บัญชีของคุณไม่มีสิทธิ์เพิ่มสินค้า"}</Text>
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
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="เช่น Prada Bag" />

        <Text style={styles.label}>แบรนด์</Text>
        <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="เช่น Prada" />

        <Text style={styles.label}>หมวดหมู่</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catChipActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>ราคา (บาท)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="เช่น 25000" />

        <Text style={styles.label}>ราคาเดิม (ถ้ามีส่วนลด, ไม่บังคับ)</Text>
        <TextInput style={styles.input} value={oldPrice} onChangeText={setOldPrice} keyboardType="numeric" placeholder="เช่น 30000" />

        <Text style={styles.label}>ภาพสินค้า</Text>
        <View style={styles.imageRow}>
          <TextInput style={[styles.input, { flex: 1 }]} value={image} onChangeText={setImage} placeholder="https://... หรือ data:image/..." autoCapitalize="none" />
          <TouchableOpacity style={styles.pickImageButton} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {image ? (
          <View style={styles.previewBox}>
            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
          </View>
        ) : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{editingId ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: "#f5f5f5" },
  lockedTitle: { fontSize: 18, fontWeight: "700", color: "#222", marginBottom: 8 },
  lockedSubtitle: { fontSize: 13, color: "#777", textAlign: "center", marginBottom: 20 },
  lockedButton: { backgroundColor: "#000", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  lockedButtonText: { color: "#fff", fontWeight: "700" },
  form: { padding: 20 },
  headerCard: { backgroundColor: "#111", borderRadius: 18, padding: 16, marginBottom: 18 },
  headerEyebrow: { color: "#d8bf6a", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  header: { fontSize: 20, fontWeight: "700", marginTop: 6, color: "#fff" },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "#eee", fontSize: 14 },
  imageRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  pickImageButton: { backgroundColor: "#000", width: 46, height: 46, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  previewBox: { marginTop: 12, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#eee", backgroundColor: "#fff" },
  previewImage: { width: "100%", height: 180 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee" },
  catChipActive: { backgroundColor: "#000", borderColor: "#000" },
  catChipText: { fontSize: 13, color: "#555", fontWeight: "600" },
  catChipTextActive: { color: "#fff" },
  submitButton: { backgroundColor: "#bfa14a", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 28 },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
