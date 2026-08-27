import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CardShadow, Colors, LOW_STOCK_THRESHOLD, Radius, Spacing, formatCurrency } from "../constants/brand";
import { Product } from "../context/AppContext";
import { ProductImage } from "./ProductImage";

type Props = {
  product: Product;
  mode: "staff" | "shop";
  busy: boolean;
  // staff mode
  isAdmin?: boolean;
  onSell?: (product: Product) => void;
  onAdjustStock?: (id: string, delta: number) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  // shop mode
  isFavorite?: boolean;
  onToggleFavorite?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
};

export function ProductCard({
  product: p,
  mode,
  busy,
  isAdmin,
  onSell,
  onAdjustStock,
  onEdit,
  onDelete,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
}: Props) {
  const outOfStock = p.stockQuantity === 0;
  const lowStock = !outOfStock && p.stockQuantity <= LOW_STOCK_THRESHOLD;

  return (
    <View style={[styles.card, CardShadow]}>
      <View style={styles.imageBox}>
        <ProductImage uri={p.imageUrl} imageStyle={styles.image} />
        {(outOfStock || lowStock) && (
          <View style={[styles.stockTag, outOfStock ? styles.stockTagDanger : styles.stockTagWarning]}>
            <Text style={styles.stockTagText}>{outOfStock ? "หมดสต็อก" : `เหลือ ${p.stockQuantity}`}</Text>
          </View>
        )}
        {mode === "shop" && (
          <TouchableOpacity style={styles.favoriteButton} onPress={() => onToggleFavorite?.(p)}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={18} color={isFavorite ? Colors.danger : Colors.inkSoft} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.brand}>{p.brand}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {p.name}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={Colors.inkFaint} />
          <Text style={styles.metaText} numberOfLines={1}>
            {p.location || "ไม่ระบุตำแหน่ง"}
          </Text>
        </View>
        {mode === "staff" && (
          <View style={styles.metaRow}>
            <Ionicons name="layers-outline" size={12} color={Colors.inkFaint} />
            <Text style={styles.metaText}>
              สต็อก {p.stockQuantity} ชิ้น • {p.category}
            </Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(p.price)}</Text>
          {p.oldPrice ? <Text style={styles.oldPrice}>{formatCurrency(p.oldPrice)}</Text> : null}
        </View>

        {mode === "shop" ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.sellButton, outOfStock && styles.sellButtonDisabled]}
              disabled={outOfStock || busy}
              onPress={() => onAddToCart?.(p)}
            >
              <Ionicons name="cart-outline" size={14} color={Colors.onDark} />
              <Text style={styles.sellButtonText}>{outOfStock ? "หมดสต็อก" : "เพิ่มลงตะกร้า"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.sellButton, outOfStock && styles.sellButtonDisabled]}
              disabled={outOfStock || busy}
              onPress={() => onSell?.(p)}
            >
              <Ionicons name="cash-outline" size={14} color={Colors.onDark} />
              <Text style={styles.sellButtonText}>บันทึกการขาย</Text>
            </TouchableOpacity>

            {isAdmin && (
              <>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepperBtn} disabled={busy} onPress={() => onAdjustStock?.(p.id, -1)}>
                    <Ionicons name="remove" size={14} color={Colors.onDark} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.stepperBtn} disabled={busy} onPress={() => onAdjustStock?.(p.id, 1)}>
                    <Ionicons name="add" size={14} color={Colors.onDark} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.iconOnlyButton, busy && styles.disabled]} disabled={busy} onPress={() => onEdit?.(p)}>
                  <Ionicons name="create-outline" size={16} color={Colors.ink} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconOnlyButton, styles.iconOnlyButtonDanger, busy && styles.disabled]}
                  disabled={busy}
                  onPress={() => onDelete?.(p)}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: "hidden" },
  imageBox: { width: "100%", aspectRatio: 1, backgroundColor: Colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  stockTag: { position: "absolute", top: Spacing.sm, left: Spacing.sm, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  stockTagWarning: { backgroundColor: Colors.warning },
  stockTagDanger: { backgroundColor: Colors.danger },
  stockTagText: { color: Colors.onDark, fontSize: 10, fontWeight: "700" },
  favoriteButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  body: { padding: Spacing.md },
  brand: { fontSize: 11, color: Colors.inkFaint, textTransform: "uppercase", letterSpacing: 0.4 },
  name: { fontSize: 15, fontWeight: "700", color: Colors.ink, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaText: { fontSize: 11, color: Colors.inkSoft, flexShrink: 1 },

  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: Spacing.sm },
  price: { color: Colors.primary, fontWeight: "800", fontSize: 16 },
  oldPrice: { color: Colors.inkFaint, fontSize: 11, textDecorationLine: "line-through" },

  actionsRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: Spacing.md },
  sellButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flex: 1,
  },
  sellButtonDisabled: { backgroundColor: Colors.inkFaint },
  sellButtonText: { color: Colors.onDark, fontSize: 12, fontWeight: "700" },
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.nav, borderRadius: Radius.sm, padding: 4, gap: 4 },
  stepperBtn: { backgroundColor: Colors.navElevated, borderRadius: 6, padding: 5 },
  iconOnlyButton: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: 8 },
  iconOnlyButtonDanger: { borderColor: Colors.dangerSoft, backgroundColor: Colors.dangerSoft },
  disabled: { opacity: 0.4 },
});
