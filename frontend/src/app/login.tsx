import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "../context/AppContext";

type RoleChoice = "admin" | "customer" | null;

export default function Login() {
  const { user, login, register, logout, authError } = useApp();
  const router = useRouter();
  const [roleChoice, setRoleChoice] = useState<RoleChoice>(null);
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = () => {
    Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ออกจากระบบ",
        style: "destructive",
        onPress: () => {
          logout();
          setRoleChoice(null);
          router.replace("/login");
        },
      },
    ]);
  };

  // ========== หน้าโปรไฟล์ (login แล้ว) ==========
  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text></View>
          <Text style={styles.profileName}>{user.username}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <View style={{ backgroundColor: user.role === "admin" ? "#bfa14a" : "#e0e0e0", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 20 }}>
            <Text style={{ color: user.role === "admin" ? "#fff" : "#555", fontSize: 11, fontWeight: "700" }}>
              {user.role === "admin" ? "ADMIN" : "USER"}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ========== ขั้นที่ 1: เลือกบทบาท ==========
  if (roleChoice === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.roleWrap}>
          <Text style={styles.roleTitle}>เข้าสู่ระบบในฐานะ</Text>
          <Text style={styles.roleSubtitle}>เลือกประเภทบัญชีที่ต้องการเข้าใช้งาน</Text>

          <TouchableOpacity style={styles.roleCard} onPress={() => setRoleChoice("admin")}>
            <View style={[styles.roleIconWrap, { backgroundColor: "#bfa14a" }]}>
              <Ionicons name="shield-checkmark" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleCardTitle}>ผู้ดูแลระบบ (Admin)</Text>
              <Text style={styles.roleCardDesc}>จัดการสินค้า เพิ่ม/ลบ และดูแลระบบร้านค้า</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.roleCard} onPress={() => setRoleChoice("customer")}>
            <View style={[styles.roleIconWrap, { backgroundColor: "#000" }]}>
              <Ionicons name="person" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleCardTitle}>ลูกค้า (Customer)</Text>
              <Text style={styles.roleCardDesc}>เลือกซื้อสินค้า ใส่ตะกร้า และชำระเงิน</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ========== ขั้นที่ 2: ฟอร์ม login/register ==========
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === "login") {
        const ok = await login(username.trim(), password);
        if (!ok) Alert.alert("เข้าสู่ระบบไม่สำเร็จ", authError ?? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      } else {
        if (!username.trim() || !email.trim() || !password.trim()) {
          Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
          return;
        }
        const ok = await register(username.trim(), email.trim(), password);
        if (!ok) Alert.alert("สมัครไม่สำเร็จ", authError ?? "มีชื่อผู้ใช้นี้อยู่แล้ว");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isAdminFlow = roleChoice === "admin";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.brandTopBar}>
          <Text style={styles.brandName}>BRAND NAME.J</Text>
          <View style={[styles.roleBadge, { backgroundColor: isAdminFlow ? "#bfa14a" : "#000" }]}>
            <Ionicons name={isAdminFlow ? "shield-checkmark" : "person"} size={14} color="#fff" />
            <Text style={styles.roleBadgeText}>{isAdminFlow ? "ผู้ดูแลระบบ" : "ลูกค้า"}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.backRow} onPress={() => setRoleChoice(null)}>
          <Ionicons name="arrow-back" size={18} color="#555" />
          <Text style={styles.backText}>เปลี่ยนประเภทบัญชี</Text>
        </TouchableOpacity>

        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Premium retail access</Text>
          <Text style={styles.header}>
            {mode === "login"
              ? (isAdminFlow ? "เข้าสู่ระบบผู้ดูแลระบบ" : "เข้าสู่ระบบลูกค้า")
              : "สมัครสมาชิก"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isAdminFlow
              ? "จัดการสินค้าและสต็อกอย่างมีประสิทธิภาพ"
              : "เลือกซื้อสินค้าที่ตรงกับสไตล์คุณได้ทันที"}
          </Text>
        </View>

        <Text style={styles.label}>ชื่อผู้ใช้</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="username" />
        {mode === "register" && (
          <>
            <Text style={styles.label}>อีเมล</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="email@example.com" />
          </>
        )}
        <Text style={styles.label}>รหัสผ่าน</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••" />
        <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitButtonText}>
            {submitting ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode(mode === "login" ? "register" : "login")}>
          <Text style={styles.switchText}>{mode === "login" ? "ยังไม่มีบัญชี? สมัครสมาชิก" : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"}</Text>
        </TouchableOpacity>
        {isAdminFlow && mode === "login" && (
          <Text style={styles.hint}>ทดลองใช้: username "admin" / password "1234"</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  form: { padding: 24, paddingTop: 30 },

  // Role selection screen
  roleWrap: { flex: 1, padding: 24, paddingTop: 60, justifyContent: "flex-start" },
  roleTitle: { fontSize: 24, fontWeight: "800", color: "#222", textAlign: "center" },
  roleSubtitle: { fontSize: 13, color: "#999", textAlign: "center", marginTop: 6, marginBottom: 36 },
  roleCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, gap: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  roleIconWrap: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  roleCardTitle: { fontSize: 15, fontWeight: "700", color: "#222" },
  roleCardDesc: { fontSize: 12, color: "#999", marginTop: 2 },

  brandTopBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  brandName: { fontSize: 18, fontWeight: "800", letterSpacing: 1.2, color: "#111" },
  heroCard: { backgroundColor: "#111", borderRadius: 20, padding: 18, marginBottom: 18 },
  heroEyebrow: { color: "#d8bf6a", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 8 },
  heroSubtitle: { color: "#ddd", fontSize: 12, marginTop: 6 },

  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backText: { color: "#555", fontSize: 13, fontWeight: "600" },
  roleBadge: { flexDirection: "row", alignItems: "center", alignSelf: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 14 },
  roleBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  header: { fontSize: 22, fontWeight: "700", marginBottom: 0, color: "#fff", textAlign: "left" },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "#eee", fontSize: 14 },
  submitButton: { backgroundColor: "#000", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 26 },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  switchText: { color: "#bfa14a", textAlign: "center", marginTop: 18, fontWeight: "600", fontSize: 13 },
  hint: { textAlign: "center", color: "#aaa", fontSize: 11, marginTop: 30 },

  profileCard: { alignItems: "center", padding: 40 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#000", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  avatarText: { color: "#bfa14a", fontSize: 32, fontWeight: "700" },
  profileName: { fontSize: 18, fontWeight: "700", color: "#222" },
  profileEmail: { fontSize: 13, color: "#999", marginTop: 4, marginBottom: 24 },
  logoutButton: { borderWidth: 1, borderColor: "#e63946", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  logoutButtonText: { color: "#e63946", fontWeight: "700" },
});