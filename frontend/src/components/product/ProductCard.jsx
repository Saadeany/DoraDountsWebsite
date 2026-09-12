import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Eye, ShoppingBag, Check } from "lucide-react";
import { formatPrice, getFinalPrice, getPrimaryImage } from "../../utils/format";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";

const ProductCard = ({ product, onQuickView }) => {
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const hasDiscount = parseFloat(product.discount) > 0;
  const finalPrice = getFinalPrice(product.price, product.discount);
  const inWishlist = isInWishlist(product.id);

  const handleWishlist = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.warning("Sign in to save items to your wishlist."); return navigate("/login"); }
    try {
      await toggleWishlist(product.id);
      toast.info(inWishlist ? "Removed from wishlist." : "Added to wishlist!");
    } catch { toast.error("Could not update wishlist."); }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.warning("Please sign in to add items to your cart."); return navigate("/login"); }
    if (product.stock === 0) { toast.error("This product is out of stock."); return; }
    setBusy(true);
    try {
      const defaultSize = product.sizes?.[0]?.name;
      const defaultColor = product.colors?.[0]?.name;
      await addItem(product.id, defaultSize, defaultColor, 1);
      setJustAdded(true);
      toast.success(`${product.name} added to cart!`);
      setTimeout(() => setJustAdded(false), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add to cart.");
    } finally { setBusy(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="group relative"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-cream">
          <img src={getPrimaryImage(product)} alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
          {hasDiscount && (
            <span className="absolute left-3 top-3 bg-ink text-paper text-[11px] uppercase tracking-wide px-2.5 py-1">
              -{Math.round(product.discount)}%
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute left-3 top-3 bg-charcoal/80 text-paper text-[11px] uppercase tracking-wide px-2.5 py-1">
              Sold Out
            </span>
          )}
          <button onClick={handleWishlist} aria-label="Toggle wishlist"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 text-ink transition-transform hover:scale-110">
            <Heart size={16} className={inWishlist ? "fill-ink" : "fill-none"} />
          </button>
          <div className="absolute inset-x-0 bottom-0 flex translate-y-full gap-2 p-3 transition-transform duration-300 group-hover:translate-y-0">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView?.(product); }}
              className="flex flex-1 items-center justify-center gap-1.5 bg-paper text-ink text-xs uppercase tracking-wide py-2.5 transition-colors hover:bg-ink hover:text-paper">
              <Eye size={14} /> Quick View
            </button>
            <button onClick={handleQuickAdd} disabled={busy || product.stock === 0}
              className="flex flex-1 items-center justify-center gap-1.5 bg-ink text-paper text-xs uppercase tracking-wide py-2.5 transition-colors hover:bg-charcoal disabled:opacity-50">
              {justAdded ? <><Check size={14} /> Added</> : busy ? "Adding…" : <><ShoppingBag size={14} /> {product.stock === 0 ? "Sold Out" : "Add"}</>}
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="text-sm text-ink">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{formatPrice(finalPrice)}</span>
            {hasDiscount && <span className="text-xs text-charcoal/50 line-through">{formatPrice(product.price)}</span>}
          </div>
          {product.colors?.length > 0 && (
            <div className="flex items-center gap-1 pt-1">
              {product.colors.slice(0, 5).map((c) => (
                <span key={c.id} title={c.name} className="h-3 w-3 rounded-full border border-ink/15"
                  style={{ backgroundColor: c.hex_code || "#ccc" }} />
              ))}
              {product.colors.length > 5 && <span className="text-[10px] text-charcoal/50">+{product.colors.length - 5}</span>}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};
export default ProductCard;
