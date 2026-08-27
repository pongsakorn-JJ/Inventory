import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, ImageStyle, StyleProp, View } from "react-native";
import { Colors } from "../constants/brand";
import { resolveProductImageSource } from "../constants/productImages";

type Props = {
  uri: string;
  imageStyle?: StyleProp<ImageStyle>;
  iconSize?: number;
};

export function ProductImage({ uri, imageStyle, iconSize = 28 }: Props) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="image-outline" size={iconSize} color={Colors.inkFaint} />
      </View>
    );
  }

  return (
    <Image
      source={resolveProductImageSource(uri)}
      style={imageStyle}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
}
