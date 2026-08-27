import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "../constants/api";

const SESSION_KEY = "inventory_session";

type StoredSession = {
  token: string | null;
  user: User | null;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  rating: number;
  category: string;
  description: string;
  imageUrl: string;
  location: string;
  stockQuantity: number;
};

export type Role = "admin" | "user" | "customer";
export type User = { username: string; email: string; role: Role };

export type CartLine = { productId: string; quantity: number };
export type OrderItem = { name: string; price: number; quantity: number };
export type Order = { id: string; date: string; items: OrderItem[]; total: number };

export type LowStockItem = { id: string; name: string; brand: string; location: string | null; stockQuantity: number };
export type LocationSummary = { location: string; productCount: number; stockUnits: number };
export type SalesByProduct = { name: string; quantitySold: number; revenue: number };
export type RecentSale = { id: string; date: string; total: number; username: string | null };

export type Dashboard = {
  stock: {
    totalProducts: number;
    totalStockUnits: number;
    stockValue: number;
    lowStockThreshold: number;
    lowStockItems: LowStockItem[];
    byLocation: LocationSummary[];
  };
  sales: {
    totalOrders: number;
    totalRevenue: number;
    byProduct: SalesByProduct[];
    recent: RecentSale[];
  };
};

type AppContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  authError: string | null;
  productsLoading: boolean;
  productsError: string | null;
  products: Product[];
  refreshProducts: (query?: string) => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<boolean>;
  uploadProductImage: (params: { base64: string; mimeType: string; name?: string; fileName?: string }) => Promise<string | null>;
  updateProduct: (id: string, product: Omit<Product, "id">) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  adjustStock: (id: string, delta: number) => Promise<boolean>;
  recordSale: (productId: string, quantity: number) => Promise<{ ok: boolean; error?: string }>;
  dashboard: Dashboard | null;
  dashboardLoading: boolean;
  refreshDashboard: () => Promise<void>;
  cart: CartLine[];
  cartLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string) => Promise<boolean>;
  updateCartQty: (productId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  favorites: string[];
  refreshFavorites: () => Promise<void>;
  toggleFavorite: (productId: string) => Promise<boolean>;
  orders: Order[];
  ordersLoading: boolean;
  refreshOrders: () => Promise<void>;
  checkout: () => Promise<{ ok: boolean; error?: string; order?: Order }>;
  lastError: string | null;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const persistSession = (nextUser: User | null, nextToken: string | null) => {
    setUser(nextUser);
    setToken(nextToken);

    if (typeof window !== "undefined" && window.localStorage) {
      const payload: StoredSession = { user: nextUser, token: nextToken };
      if (nextUser && nextToken) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
      } else {
        window.localStorage.removeItem(SESSION_KEY);
      }
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;

    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const session = JSON.parse(raw) as StoredSession;
      if (session.user && session.token) {
        setUser(session.user);
        setToken(session.token);
      }
    } catch (error) {
      console.warn("Unable to restore session:", error);
    }
  }, []);

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  };

  const mapProduct = (row: any): Product => ({
    id: String(row.id),
    name: row.name,
    brand: row.brand,
    price: Number(row.price),
    oldPrice: row.old_price != null ? Number(row.old_price) : null,
    rating: Number(row.rating),
    category: row.category,
    description: row.description ?? "",
    imageUrl: row.image_url,
    location: row.location ?? "",
    stockQuantity: row.total_stock != null ? Number(row.total_stock) : 0,
  });

  const refreshProducts = async (query?: string) => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const q = query ? `?q=${encodeURIComponent(query)}` : "";
      const data = await apiCall(`/products${q}`);
      const rows = Array.isArray(data) ? data : data.items;
      setProducts(rows.map(mapProduct));
    } catch (err: any) {
      console.error("โหลดข้อมูลสินค้าไม่สำเร็จ:", err.message);
      setProductsError(err.message);
      setLastError(err.message);
    } finally {
      setProductsLoading(false);
    }
  };

  const refreshDashboard = async () => {
    if (!user || !token || user.role === "customer") return;
    setDashboardLoading(true);
    try {
      const data = await apiCall("/dashboard");
      setDashboard(data);
    } catch (err: any) {
      console.error("โหลดแดชบอร์ดไม่สำเร็จ:", err.message);
      setLastError(err.message);
    } finally {
      setDashboardLoading(false);
    }
  };

  const refreshCart = async () => {
    if (!user || !token) return;
    setCartLoading(true);
    try {
      const data = await apiCall("/cart");
      setCart(data);
    } catch (err: any) {
      console.error("โหลดตะกร้าไม่สำเร็จ:", err.message);
      setLastError(err.message);
    } finally {
      setCartLoading(false);
    }
  };

  const refreshFavorites = async () => {
    if (!user || !token) return;
    try {
      const data = await apiCall("/favorites");
      setFavorites(data);
    } catch (err: any) {
      console.error("โหลดรายการโปรดไม่สำเร็จ:", err.message);
      setLastError(err.message);
    }
  };

  const refreshOrders = async () => {
    if (!user || !token) return;
    setOrdersLoading(true);
    try {
      const data = await apiCall("/orders");
      setOrders(data);
    } catch (err: any) {
      console.error("โหลดประวัติการสั่งซื้อไม่สำเร็จ:", err.message);
      setLastError(err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  useEffect(() => {
    if (!user || !token) {
      setDashboard(null);
      setCart([]);
      setFavorites([]);
      setOrders([]);
      return;
    }
    refreshDashboard();
    refreshCart();
    refreshFavorites();
    refreshOrders();
  }, [user, token]);

  const login = async (username: string, password: string): Promise<User | null> => {
    setAuthError(null);
    try {
      const data = await apiCall("/login", { method: "POST", body: JSON.stringify({ username, password }) });
      const nextUser: User = { username: data.user.username, email: data.user.email, role: data.user.role };
      persistSession(nextUser, data.token);
      return nextUser;
    } catch (err: any) {
      setAuthError(err.message);
      return null;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const data = await apiCall("/register", { method: "POST", body: JSON.stringify({ username, email, password }) });
      persistSession({ username: data.user.username, email: data.user.email, role: data.user.role }, data.token);
      return true;
    } catch (err: any) {
      setAuthError(err.message);
      return false;
    }
  };

  const logout = () => {
    persistSession(null, null);
    setDashboard(null);
  };

  const toApiPayload = (product: Omit<Product, "id">) => ({
    name: product.name,
    brand: product.brand,
    price: product.price,
    oldPrice: product.oldPrice,
    rating: product.rating,
    category: product.category,
    description: product.description || null,
    imageUrl: product.imageUrl,
    location: product.location || null,
    stockQuantity: product.stockQuantity,
  });

  const uploadProductImage = async ({
    base64,
    mimeType,
    name,
    fileName,
  }: {
    base64: string;
    mimeType: string;
    name?: string;
    fileName?: string;
  }): Promise<string | null> => {
    try {
      const data = await apiCall("/products/upload-image", {
        method: "POST",
        body: JSON.stringify({ image: base64, mimeType, name, fileName }),
      });
      return data.imageUrl as string;
    } catch (err: any) {
      console.error("อัปโหลดรูปไม่สำเร็จ:", err.message);
      setLastError(err.message);
      return null;
    }
  };

  const addProduct = async (product: Omit<Product, "id">): Promise<boolean> => {
    try {
      const created = await apiCall("/products", { method: "POST", body: JSON.stringify(toApiPayload(product)) });
      setProducts((prev) => [{ ...product, id: String(created.id) }, ...prev]);
      refreshDashboard();
      return true;
    } catch (err: any) {
      console.error("เพิ่มสินค้าไม่สำเร็จ:", err.message);
      setLastError(err.message);
      return false;
    }
  };

  const updateProduct = async (id: string, product: Omit<Product, "id">): Promise<boolean> => {
    try {
      await apiCall(`/products/${id}`, { method: "PUT", body: JSON.stringify(toApiPayload(product)) });
      setProducts((prev) => prev.map((item) => (item.id === id ? { id, ...product } : item)));
      refreshDashboard();
      return true;
    } catch (err: any) {
      console.error("แก้ไขสินค้าไม่สำเร็จ:", err.message);
      setLastError(err.message);
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      await apiCall(`/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      refreshDashboard();
      return true;
    } catch (err: any) {
      console.error("ลบสินค้าไม่สำเร็จ:", err.message);
      setLastError(err.message);
      return false;
    }
  };

  const adjustStock = async (id: string, delta: number): Promise<boolean> => {
    try {
      const data = await apiCall(`/products/${id}/stock`, { method: "PATCH", body: JSON.stringify({ delta }) });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stockQuantity: data.stockQuantity } : p)));
      refreshDashboard();
      return true;
    } catch (err: any) {
      console.error("ปรับสต็อกไม่สำเร็จ:", err.message);
      setLastError(err.message);
      return false;
    }
  };

  const recordSale = async (productId: string, quantity: number): Promise<{ ok: boolean; error?: string }> => {
    try {
      const data = await apiCall("/sales", { method: "POST", body: JSON.stringify({ productId, quantity }) });
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stockQuantity: data.stockQuantity } : p)));
      refreshDashboard();
      return { ok: true };
    } catch (err: any) {
      console.error("บันทึกการขายไม่สำเร็จ:", err.message);
      return { ok: false, error: err.message };
    }
  };

  const addToCart = async (productId: string): Promise<boolean> => {
    try {
      await apiCall("/cart", { method: "POST", body: JSON.stringify({ productId }) });
      await refreshCart();
      return true;
    } catch (err: any) {
      console.error("เพิ่มลงตะกร้าไม่สำเร็จ:", err.message);
      setLastError(err.message);
      return false;
    }
  };

  const updateCartQty = async (productId: string, quantity: number): Promise<boolean> => {
    try {
      await apiCall(`/cart/${productId}`, { method: "PUT", body: JSON.stringify({ quantity }) });
      await refreshCart();
      return true;
    } catch (err: any) {
      console.error("อัปเดตตะกร้าไม่สำเร็จ:", err.message);
      setLastError(err.message);
      return false;
    }
  };

  const removeFromCart = async (productId: string): Promise<boolean> => {
    try {
      await apiCall(`/cart/${productId}`, { method: "DELETE" });
      setCart((prev) => prev.filter((c) => c.productId !== productId));
      return true;
    } catch (err: any) {
      console.error("ลบออกจากตะกร้าไม่สำเร็จ:", err.message);
      setLastError(err.message);
      return false;
    }
  };

  const toggleFavorite = async (productId: string): Promise<boolean> => {
    try {
      const data = await apiCall(`/favorites/${productId}`, { method: "POST" });
      setFavorites((prev) => (data.favorited ? [...prev, productId] : prev.filter((id) => id !== productId)));
      return true;
    } catch (err: any) {
      console.error("อัปเดตรายการโปรดไม่สำเร็จ:", err.message);
      setLastError(err.message);
      return false;
    }
  };

  const checkout = async (): Promise<{ ok: boolean; error?: string; order?: Order }> => {
    try {
      const data = await apiCall("/checkout", { method: "POST" });
      setCart([]);
      await refreshProducts();
      await refreshOrders();
      return { ok: true, order: data };
    } catch (err: any) {
      console.error("ชำระเงินไม่สำเร็จ:", err.message);
      return { ok: false, error: err.message };
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        authError,
        productsLoading,
        productsError,
        products,
        refreshProducts,
        addProduct,
        uploadProductImage,
        updateProduct,
        deleteProduct,
        adjustStock,
        recordSale,
        dashboard,
        dashboardLoading,
        refreshDashboard,
        cart,
        cartLoading,
        refreshCart,
        addToCart,
        updateCartQty,
        removeFromCart,
        favorites,
        refreshFavorites,
        toggleFavorite,
        orders,
        ordersLoading,
        refreshOrders,
        checkout,
        lastError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
