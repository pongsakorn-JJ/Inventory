export const BRAND_NAME = "BRANDNAME.J";
export const BRAND_TAGLINE = "Inventory Control";

export const Colors = {
  bg: "#F3F5F9",
  surface: "#FFFFFF",
  surfaceAlt: "#F8FAFC",
  border: "#E4E8F0",

  ink: "#111827",
  inkSoft: "#5B6472",
  inkFaint: "#98A2B3",
  onDark: "#FFFFFF",
  onDarkSoft: "#B9C0D4",

  nav: "#141A33",
  navElevated: "#1D2547",

  primary: "#3C4FE0",
  primaryDark: "#2934A6",
  primarySoft: "#EAECFC",

  accent: "#0F9D77",
  accentSoft: "#E1F5EE",

  warning: "#D97706",
  warningSoft: "#FDF0DC",

  danger: "#DC2626",
  dangerSoft: "#FCE8E8",
} as const;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const Radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

export const CardShadow = {
  shadowColor: "#0B1030",
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

export const LOW_STOCK_THRESHOLD = 5;

export const formatCurrency = (n: number) => `฿${Math.round(n).toLocaleString("th-TH")}`;
