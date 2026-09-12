export const formatPrice = (value) => {
  const num = parseFloat(value) || 0;
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} EGP`;
};

export const getFinalPrice = (price, discount) => {
  const p = parseFloat(price) || 0;
  const d = parseFloat(discount) || 0;
  return p * (1 - d / 100);
};

export const getPrimaryImage = (product) => {
  if (!product?.images || product.images.length === 0) return "/placeholder.svg";
  const primary = product.images.find((img) => img.is_primary);
  return primary ? primary.image_url : product.images[0].image_url;
};
