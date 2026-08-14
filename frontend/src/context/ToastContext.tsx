import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Radius, Spacing } from "../constants/brand";

type Variant = "success" | "error" | "info";
type ToastState = { id: number; message: string; variant: Variant } | null;

type ToastContextType = { showToast: (message: string, variant?: Variant) => void };

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, variant: Variant = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = ++nextId.current;
    setToast({ id, message, variant });
    timerRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={styles.root}>
        {children}
        {toast && (
          <View pointerEvents="none" style={styles.toastWrap}>
            <View
              style={[
                styles.toast,
                toast.variant === "error" ? styles.toastError : toast.variant === "info" ? styles.toastInfo : styles.toastSuccess,
              ]}
            >
              <Text style={styles.toastText}>{toast.message}</Text>
            </View>
          </View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  toastWrap: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", paddingTop: Spacing.xl, zIndex: 999 },
  toast: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    maxWidth: 420,
    marginHorizontal: Spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastSuccess: { backgroundColor: Colors.accent },
  toastError: { backgroundColor: Colors.danger },
  toastInfo: { backgroundColor: Colors.nav },
  toastText: { color: Colors.onDark, fontWeight: "700", fontSize: 13, textAlign: "center" },
});
