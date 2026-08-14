import Constants from "expo-constants";
import { Platform } from "react-native";

const getApiUrl = () => {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override.replace(/\/$/, "");

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    const normalizedHost = Platform.OS === "android" && host === "localhost" ? "10.0.2.2" : host;
    return `http://${normalizedHost}:3063`;
  }

  if (Platform.OS === "android") return "http://10.0.2.2:3063";
  if (Platform.OS === "web") return "http://119.59.102.161:3063";
  return "http://localhost:3063";
};

export const API_URL = getApiUrl();
export const API_BASE_URL = `${API_URL}/api`;
