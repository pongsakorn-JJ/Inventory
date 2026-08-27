// Optional bundled sample/seed product images (for demo data only —
// admin-added products go through the real GitHub upload flow in
// AppContext.uploadProductImage, unrelated to this).
//
// Currently unused — no assets/images/products/ folder exists in this
// project. To use it: create that folder yourself, drop a .jpg into it,
// register it below with a slug, then reference it from seed data as
// `local:<slug>`, e.g. "local:mini-crossbody-bag" instead of a real URL.

export const LOCAL_PRODUCT_IMAGES: Record<string, number> = {
  // "mini-crossbody-bag": require("../../assets/images/products/mini-crossbody-bag.jpg"),
};

const LOCAL_IMAGE_PREFIX = "local:";

export function resolveProductImageSource(image: string): number | { uri: string } {
  if (image.startsWith(LOCAL_IMAGE_PREFIX)) {
    const slug = image.slice(LOCAL_IMAGE_PREFIX.length);
    const source = LOCAL_PRODUCT_IMAGES[slug];
    if (source) return source;
  }
  return { uri: image };
}
