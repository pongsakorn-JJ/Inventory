import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { BRAND_NAME, BRAND_TAGLINE, CardShadow, Colors, Radius, Spacing } from "../constants/brand";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

type LoginMode = "customer" | "staff";

export default function Login() {
  const { user, login, register, logout, authError } = useApp();
  const { showToast } = useToast();
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<LoginMode>("customer");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  const confirmLogout = () => {
    logout();
    setLogoutConfirmVisible(false);
    showToast("ออกจากระบบแล้ว", "info");
    router.replace("/login");
  };

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.profileWrap}>
          <View style={[styles.profileCard, CardShadow]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.profileName}>{user.username}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: user.role === "admin" ? Colors.primarySoft : Colors.surfaceAlt }]}>
              <Text style={[styles.roleBadgeText, { color: user.role === "admin" ? Colors.primary : Colors.inkSoft }]}>
                {user.role === "admin" ? "ผู้ดูแลระบบ" : user.role === "user" ? "พนักงาน" : "ลูกค้า"}
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={() => setLogoutConfirmVisible(true)}>
              <Ionicons name="log-out-outline" size={16} color={Colors.danger} />
              <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ConfirmDialog
          visible={logoutConfirmVisible}
          title="ออกจากระบบ"
          message="คุณต้องการออกจากระบบใช่หรือไม่?"
          confirmLabel="ออกจากระบบ"
          destructive
          onConfirm={confirmLogout}
          onCancel={() => setLogoutConfirmVisible(false)}
        />
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === "login") {
        const result = await login(username.trim(), password);
        if (!result) {
          showToast(authError ?? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", "error");
          return;
        }
        const isStaffAccount = result.role === "admin" || result.role === "user";
        if (loginMode === "staff" && !isStaffAccount) {
          logout();
          showToast('บัญชีนี้เป็นบัญชีลูกค้า กรุณาเลือกแท็บ "ลูกค้า"', "error");
          return;
        }
        if (loginMode === "customer" && isStaffAccount) {
          logout();
          showToast('บัญชีนี้เป็นบัญชีพนักงาน/ผู้ดูแลระบบ กรุณาเลือกแท็บ "พนักงาน/ผู้ดูแลระบบ"', "error");
          return;
        }
        router.replace("/");
      } else {
        if (!username.trim() || !email.trim() || !password.trim()) {
          showToast("กรุณากรอกข้อมูลให้ครบทุกช่อง", "error");
          return;
        }
        const ok = await register(username.trim(), email.trim(), password);
        if (ok) router.replace("/");
        else showToast(authError ?? "มีชื่อผู้ใช้นี้อยู่แล้ว", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.heroCard}>
          <View style={styles.wordmarkRow}>
            <View style={styles.wordmarkDot} />
            <Text style={styles.wordmark}>{BRAND_NAME}</Text>
          </View>
          <Text style={styles.heroSubtitle}>{BRAND_TAGLINE}</Text>
          <Text style={styles.header}>{mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</Text>
        </View>

        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segment, loginMode === "customer" && styles.segmentActive]}
            onPress={() => {
              setLoginMode("customer");
            }}
          >
            <Text style={[styles.segmentText, loginMode === "customer" && styles.segmentTextActive]}>ลูกค้า</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, loginMode === "staff" && styles.segmentActive]}
            onPress={() => {
              setLoginMode("staff");
              setMode("login");
            }}
          >
            <Text style={[styles.segmentText, loginMode === "staff" && styles.segmentTextActive]}>พนักงาน/ผู้ดูแลระบบ</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>ชื่อผู้ใช้</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="username" placeholderTextColor={Colors.inkFaint} />

        {mode === "register" && (
          <>
            <Text style={styles.label}>อีเมล</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="email@example.com"
              placeholderTextColor={Colors.inkFaint}
            />
          </>
        )}

        <Text style={styles.label}>รหัสผ่าน</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••" placeholderTextColor={Colors.inkFaint} />

        <TouchableOpacity style={[styles.submitButton, submitting && styles.disabled]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitButtonText}>{submitting ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</Text>
        </TouchableOpacity>

        {loginMode === "customer" ? (
          <TouchableOpacity onPress={() => setMode(mode === "login" ? "register" : "login")}>
            <Text style={styles.switchText}>{mode === "login" ? "ยังไม่มีบัญชี? สมัครสมาชิก" : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.hint}>บัญชีพนักงาน/ผู้ดูแลระบบต้องให้ผู้ดูแลระบบสร้างให้ในฐานข้อมูลโดยตรง ไม่สามารถสมัครเองได้</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  form: { padding: Spacing.xl, paddingTop: Spacing.xxl, maxWidth: 440, width: "100%", alignSelf: "center" },

  heroCard: { backgroundColor: Colors.nav, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg },
  wordmarkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordmarkDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  wordmark: { color: Colors.onDark, fontSize: 15, fontWeight: "800", letterSpacing: 0.4 },
  heroSubtitle: { color: Colors.onDarkSoft, fontSize: 11, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 },
  header: { fontSize: 21, fontWeight: "700", color: Colors.onDark, marginTop: Spacing.md },

  segmentRow: { flexDirection: "row", backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: 4, gap: 4, marginBottom: Spacing.sm },
  segment: { flex: 1, paddingVertical: 10, borderRadius: Radius.sm, alignItems: "center" },
  segmentActive: { backgroundColor: Colors.surface, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { fontSize: 12, fontWeight: "700", color: Colors.inkFaint },
  segmentTextActive: { color: Colors.ink },

  label: { fontSize: 13, fontWeight: "600", color: Colors.inkSoft, marginBottom: 6, marginTop: Spacing.md },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, fontSize: 14, color: Colors.ink },
  submitButton: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 14, alignItems: "center", marginTop: Spacing.xl },
  disabled: { opacity: 0.6 },
  submitButtonText: { color: Colors.onDark, fontWeight: "700", fontSize: 15 },
  switchText: { color: Colors.primary, textAlign: "center", marginTop: Spacing.lg, fontWeight: "600", fontSize: 13 },
  hint: { textAlign: "center", color: Colors.inkFaint, fontSize: 11, marginTop: Spacing.lg, lineHeight: 16 },

  profileWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
  profileCard: { alignItems: "center", padding: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.xl, width: "100%", maxWidth: 360 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.nav, alignItems: "center", justifyContent: "center", marginBottom: Spacing.md },
  avatarText: { color: Colors.accent, fontSize: 32, fontWeight: "700" },
  profileName: { fontSize: 18, fontWeight: "700", color: Colors.ink },
  profileEmail: { fontSize: 13, color: Colors.inkFaint, marginTop: 4, marginBottom: Spacing.lg },
  roleBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.pill, marginBottom: Spacing.xl },
  roleBadgeText: { fontSize: 11, fontWeight: "700" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  logoutButtonText: { color: Colors.danger, fontWeight: "700" },
});
