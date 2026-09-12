import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice, getFinalPrice, getPrimaryImage } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

const QuickViewModal = ({ product, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [size, setSize] = useState(product?.sizes?.[0]?.name || "");
  const [color, setColor] = useState(product?.colors?.[0]?.name || "");
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product) {
      setSize(product.sizes?.[0]?.name || "");
      setColor(product.colors?.[0]?.name || "");
      setQty(1);
      setAdded(false);
    }
  }, [product]);

  if (!product) return null;

  const handleAdd = async () => {
    if (!isAuthenticated) {
      onClose();
      return navigate("/login");
    }
    setBusy(true);
    try {
      await addItem(product.id, size, color, qty);
      setAdded(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative grid w-full max-w-3xl grid-cols-1 gap-0 bg-paper sm:grid-cols-2 max-h-[90vh] overflow-y-auto"
        >
          <button onClick={onClose} className="absolute right-4 top-4 z-10 text-ink" aria-label="Close">
            <X size={22} />
          </button>

          <div className="aspect-[4/5] bg-cream">
            <img src={getPrimaryImage(product)} alt={product.name} className="h-full w-full object-cover" />
          </div>

          <div className="flex flex-col p-6 sm:p-8">
            <h2 className="font-display text-2xl">{product.name}</h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg">{formatPrice(getFinalPrice(product.price, product.discount))}</span>
              {parseFloat(product.discount) > 0 && (
                <span className="text-sm text-charcoal/50 line-through">{formatPrice(product.price)}</span>
              )}
            </div>
            <p className="mt-3 text-sm text-charcoal/70 line-clamp-3">{product.description}</p>

            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-5">
                <p className="eyebrow mb-2">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSize(s.name)}
                      className={`border px-3 py-1.5 text-xs uppercase transition-colors ${
                        size === s.name ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-ink"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <p className="eyebrow mb-2">Color</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setColor(c.name)}
                      title={c.name}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${
                        color === c.name ? "border-ink scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.hex_code || "#ccc" }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <p className="eyebrow">Qty</p>
              <div className="flex items-center border border-ink/20">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5">
                  −
                </button>
                <span className="w-10 text-center text-sm">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="px-3 py-1.5">
                  +
                </button>
              </div>
            </div>

            <button onClick={handleAdd} disabled={busy} className="btn-primary mt-6 w-full">
              {added ? "Added to Cart ✓" : busy ? "Adding..." : "Add to Cart"}
            </button>
            <Link to={`/product/${product.slug}`} className="mt-3 text-center text-xs uppercase tracking-wide text-charcoal/70 hover:text-ink">
              View full details →
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickViewModal;
