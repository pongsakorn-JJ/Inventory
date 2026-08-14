import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Radius, Spacing } from "../constants/brand";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  tint: string;
  tintText: string;
};

export function StatCard({ icon, label, value, tint, tintText }: Props) {
  return (
    <View style={[styles.card, { backgroundColor: tint }]}>
      <Ionicons name={icon} size={18} color={tintText} />
      <Text style={[styles.value, { color: Colors.onDark }]}>{value}</Text>
      <Text style={[styles.label, { color: tintText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: 150, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.xs },
  value: { fontSize: 22, fontWeight: "800" },
  label: { fontSize: 11, fontWeight: "600" },
});
