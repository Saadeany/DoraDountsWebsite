import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, BookmarkCheck, Bookmark, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getSavedForLater } from "../api/cart";
import { validateCoupon } from "../api/orders";
import { formatPrice, getFinalPrice, getPrimaryImage } from "../utils/format";
import Loader from "../components/common/Loader";

const TAX_RATE = 0.14;

const CartPage = () => {
  const { items, subtotal, loading, updateItem, removeItem, saveForLater, isGuest } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [savedItems, setSavedItems] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      getSavedForLater().then(({ data }) => setSavedItems(data.items)).catch(() => {});
    }
  }, [isAuthenticated, items]);

  const discount = coupon ? subtotal * (coupon.discount / 100) : 0;
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * TAX_RATE;
  // Shipping now depends on the delivery area chosen at checkout (Admin >
  // Zones), so the cart shows subtotal + tax and leaves shipping for the
  // checkout page to calculate once an area is picked.
  const estimatedTotal = taxableAmount + tax;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponError("");
    try {
      const { data } = await validateCoupon(couponCode, subtotal);
      setCoupon(data.coupon);
    } catch (e) {
      setCouponError(e.response?.data?.message || "Invalid coupon."); setCoupon(null);
    } finally { setCouponLoading(false); }
  };

  if (loading) return <Loader label="Loading cart" />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl mb-2">Your Cart</h1>
      {items.length > 0 && (
        <p className="text-sm text-charcoal/60 mb-8">
          {items.length} item{items.length !== 1 ? "s" : ""}
          {isGuest && (
            <span className="ml-2 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs">
              Sign in to save your cart
            </span>
          )}
        </p>
      )}

      {items.length === 0 ? (
        <div className="py-24 text-center space-y-5">
          <ShoppingBag size={48} className="mx-auto text-charcoal/20" strokeWidth={1.5} />
          <div>
            <p className="font-display text-2xl text-charcoal/40">Your cart is empty.</p>
            <p className="text-sm text-charcoal/50 mt-1">Add some items to get started.</p>
          </div>
          <Link to="/shop" className="btn-primary inline-flex">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, idx) => {
              // Support both server cart (item.Product) and guest cart (item directly)
              const prod   = item.Product || item;
              const imgUrl = getPrimaryImage(prod);
              const slug   = prod.slug;
              const name   = prod.name   || item.product_name || "Product";
              const price  = parseFloat(prod.price  || item.price  || 0);
              const disc   = parseFloat(prod.discount || item.discount || 0);
              const fp     = price * (1 - disc / 100);

              return (
                <div key={item.id || idx} className="flex gap-4 border border-ink/10 p-4 hover:border-ink/20 transition-colors">
                  <Link to={slug ? `/product/${slug}` : "#"} className="shrink-0">
                    <img src={imgUrl} alt={name} className="h-28 w-[88px] object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col gap-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={slug ? `/product/${slug}` : "#"} className="text-sm hover:underline truncate font-medium">
                        {name}
                      </Link>
                      <button
                        onClick={() => isGuest ? removeItem(idx) : removeItem(item.id)}
                        className="text-charcoal/35 hover:text-red-500 transition-colors shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex gap-3 text-xs text-charcoal/55">
                      {item.size  && <span>Size: {item.size}</span>}
                      {item.color && <span>Color: {item.color}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      {/* Qty stepper */}
                      <div className="flex items-center border border-ink/20">
                        <button
                          onClick={() => isGuest
                            ? updateItem(idx, Math.max(1, (item.quantity || 1) - 1))
                            : updateItem(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-3 py-1.5 text-sm hover:bg-cream disabled:opacity-30 transition-colors">
                          −
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => isGuest
                            ? updateItem(idx, (item.quantity || 1) + 1)
                            : updateItem(item.id, item.quantity + 1)}
                          className="px-3 py-1.5 text-sm hover:bg-cream transition-colors">
                          +
                        </button>
                      </div>
                      {/* Price */}
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatPrice(fp * item.quantity)}</p>
                        {disc > 0 && (
                          <p className="text-xs text-charcoal/45 line-through">
                            {formatPrice(price * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Save for later (server only) */}
                    {!isGuest && (
                      <button onClick={() => saveForLater(item.id)}
                        className="flex items-center gap-1.5 text-xs text-charcoal/55 hover:text-ink self-start transition-colors">
                        <Bookmark size={12} /> Save for later
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Saved for later */}
            {savedItems.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="eyebrow text-charcoal/50">Saved for Later</p>
                {savedItems.map(item => (
                  <div key={item.id} className="flex gap-4 border border-ink/8 p-4 opacity-70">
                    <img src={getPrimaryImage(item.Product)} alt={item.Product?.name} className="h-16 w-14 object-cover" />
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <p className="text-sm truncate">{item.Product?.name}</p>
                      <button onClick={() => saveForLater(item.id)}
                        className="shrink-0 flex items-center gap-1.5 text-xs text-charcoal/55 hover:text-ink transition-colors">
                        <BookmarkCheck size={12} /> Move to cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="h-fit space-y-4 border border-ink/10 p-6">
            <h2 className="font-display text-xl">Order Summary</h2>
            <div className="stitch-rule text-ink/20" />

            {/* Coupon (server only — needs auth for validation) */}
            {isAuthenticated && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && applyCoupon()}
                    placeholder="Coupon code"
                    className="input-field flex-1 text-xs" />
                  <button onClick={applyCoupon} disabled={couponLoading}
                    className="btn-outline px-3 text-xs">Apply</button>
                </div>
                {coupon    && <p className="text-xs text-green-600">✓ {coupon.code} — {coupon.discount}% off applied</p>}
                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-charcoal/60">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({coupon?.code})</span><span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-charcoal/60">Tax (14%)</span><span>{formatPrice(tax)}</span></div>
              <div className="flex justify-between">
                <span className="text-charcoal/60">Shipping</span>
                <span className="text-charcoal/50 text-xs">Calculated at checkout by area</span>
              </div>
              <div className="stitch-rule text-ink/20 !mt-4" />
              <div className="flex justify-between font-medium text-base">
                <span>Estimated Total</span><span>{formatPrice(estimatedTotal)}</span>
              </div>
              <p className="text-[11px] text-charcoal/45">Excludes shipping — shown after you pick a delivery area at checkout.</p>
            </div>

            {/* CTA */}
            {isAuthenticated ? (
              <button onClick={() => navigate("/checkout", { state: { coupon } })}
                className="btn-primary w-full">
                Proceed to Checkout <ArrowRight size={15} />
              </button>
            ) : (
              <div className="space-y-2">
                <Link to="/login" state={{ from: { pathname: "/checkout" } }}
                  className="btn-primary w-full text-center flex items-center justify-center gap-2">
                  Sign In to Checkout <ArrowRight size={15} />
                </Link>
                <p className="text-[11px] text-center text-charcoal/50">
                  Your cart will be saved when you sign in.
                </p>
              </div>
            )}

            <Link to="/shop" className="block text-center text-xs text-charcoal/55 hover:text-ink transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
