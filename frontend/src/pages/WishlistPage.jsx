import React from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { formatPrice, getFinalPrice, getPrimaryImage } from "../utils/format";
import { Trash2, ShoppingBag } from "lucide-react";

const WishlistPage = () => {
  const { items, toggleWishlist } = useWishlist();
  const { addItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-32 text-center">
        <p className="font-display text-2xl text-charcoal/40">Your wishlist is empty.</p>
        <Link to="/shop" className="btn-primary mt-6 inline-flex">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl mb-8">Wishlist</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const p = item.Product;
          if (!p) return null;
          const fp = getFinalPrice(p.price, p.discount);
          return (
            <div key={item.id} className="group relative">
              <Link to={`/product/${p.slug}`} className="block">
                <div className="aspect-[4/5] overflow-hidden bg-cream">
                  <img src={getPrimaryImage(p)} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">{p.name}</p>
                  <p className="text-sm font-medium">{formatPrice(fp)}</p>
                </div>
              </Link>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => addItem(p.id, p.sizes?.[0]?.name, p.colors?.[0]?.name, 1)}
                  className="flex flex-1 items-center justify-center gap-1.5 border border-ink/20 py-2 text-xs hover:border-ink transition-colors"
                >
                  <ShoppingBag size={12} /> Add
                </button>
                <button
                  onClick={() => toggleWishlist(p.id)}
                  className="flex items-center justify-center border border-ink/20 px-3 py-2 hover:border-ink transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WishlistPage;
