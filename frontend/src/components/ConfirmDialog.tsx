import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CardShadow, Colors, Radius, Spacing } from "../constants/brand";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, CardShadow]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, destructive && styles.confirmBtnDanger]} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(17,24,39,0.55)", alignItems: "center", justifyContent: "center", padding: Spacing.xl },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, width: "100%", maxWidth: 360 },
  title: { fontSize: 16, fontWeight: "700", color: Colors.ink },
  message: { fontSize: 13, color: Colors.inkSoft, marginTop: Spacing.sm, lineHeight: 19 },
  actions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.lg },
  cancelBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  cancelText: { color: Colors.inkSoft, fontWeight: "600" },
  confirmBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: Radius.md, backgroundColor: Colors.primary },
  confirmBtnDanger: { backgroundColor: Colors.danger },
  confirmText: { color: Colors.onDark, fontWeight: "700" },
});
