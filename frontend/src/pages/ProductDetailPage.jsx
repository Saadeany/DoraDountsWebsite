import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star, ChevronLeft, ChevronRight, ZoomIn, Share2 } from "lucide-react";
import { getProductBySlug } from "../api/products";
import { createReview } from "../api/reviews";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatPrice, getFinalPrice } from "../utils/format";
import RatingStars from "../components/common/RatingStars";
import ProductCard from "../components/product/ProductCard";
import Loader from "../components/common/Loader";
import useSEO from "../utils/useSEO";

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [localReviews, setLocalReviews] = useState([]);

  useEffect(() => {
    setLoading(true);
    setReviewSubmitted(false);
    getProductBySlug(slug)
      .then(({ data: d }) => {
        setData(d);
        setLocalReviews(d.reviews || []);
        setSelectedSize(d.product?.sizes?.[0]?.name || "");
        setSelectedColor(d.product?.colors?.[0]?.name || "");
        setSelectedImage(0);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

const product = data?.product;
const similar_products = data?.similar_products || [];

const seoImage =
  product?.images?.find(i => i.is_primary)?.image_url ||
  product?.images?.[0]?.image_url;

useSEO({
  title: product?.name,
  description: product?.description
    ? product.description.slice(0, 155) +
      (product.description.length > 155 ? "…" : "")
    : undefined,
  image: seoImage
    ? `${window.location.origin}${seoImage}`
    : undefined,
  url: window.location.href,
  type: "product",
  price: product
    ? parseFloat(product.price) *
      (1 - parseFloat(product.discount || 0) / 100)
    : undefined,
});

if (loading) return <Loader label="Loading product" />;

if (!product)
  return (
    <div className="py-32 text-center">
      <p className="font-display text-2xl">Product not found.</p>
      <Link to="/shop" className="mt-4 block text-sm underline">
        Back to shop
      </Link>
    </div>
  );


  const finalPrice = getFinalPrice(product.price, product.discount);
  const hasDiscount = parseFloat(product.discount) > 0;
  const images = product.images || [];
  const inWishlist = isInWishlist(product.id);

  // Build size → per-size stock map from Sequelize's through-table data
  const sizeStockMap = {};
  (product.sizes || []).forEach((s) => {
    const throughStock = s.ProductSize?.stock ?? s.product_size?.stock;
    if (throughStock !== null && throughStock !== undefined) sizeStockMap[s.name] = throughStock;
  });
  const isSizeOOS = (name) => (sizeStockMap[name] !== undefined ? sizeStockMap[name] <= 0 : product.stock <= 0);

  const handleAdd = async () => {
    if (!isAuthenticated) { toast.warning("Please sign in to add items to your cart."); return; }
    if (!selectedSize && product.sizes?.length > 0) { toast.warning("Please select a size."); return; }
    if (product.stock <= 0) { toast.error("This product is out of stock."); return; }
    setAdding(true);
    try {
      await addItem(product.id, selectedSize, selectedColor, qty);
      toast.success(`${product.name} added to cart!`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not add to cart.");
    } finally { setAdding(false); }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.warning("Please sign in to save items."); return; }
    await toggleWishlist(product.id);
    toast.info(inWishlist ? "Removed from wishlist." : "Added to wishlist!");
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `Check out ${product.name} — ${formatPrice(finalPrice)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.warning("Please sign in to leave a review."); return; }
    setReviewSubmitting(true);
    try {
      const { data: res } = await createReview({ product_id: product.id, rating: reviewRating, comment: reviewComment });
      setLocalReviews((prev) => [{ ...res.review, User: { first_name: "You", last_name: "" } }, ...prev]);
      setReviewSubmitted(true);
      setReviewComment("");
      toast.success("Review submitted — thank you!");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not submit review. You may need to have a delivered order first.");
    } finally { setReviewSubmitting(false); }
  };

  const prevImage = () => setSelectedImage((i) => (i === 0 ? images.length - 1 : i - 1));
  const nextImage = () => setSelectedImage((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-xs text-charcoal/50">
        <Link to="/" className="hover:text-ink">Home</Link><span>/</span>
        <Link to="/shop" className="hover:text-ink">Shop</Link><span>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex gap-4">
          {images.length > 1 && (
            <div className="flex flex-col gap-2">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setSelectedImage(i)}
                  className={`h-16 w-14 shrink-0 overflow-hidden border-2 transition-colors ${i === selectedImage ? "border-ink" : "border-transparent"}`}>
                  <img src={img.image_url} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="relative flex-1 overflow-hidden bg-cream">
            <motion.img key={selectedImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
              src={images[selectedImage]?.image_url || "/placeholder.svg"} alt={product.name}
              className={`h-full w-full object-cover transition-transform duration-500 ${zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`}
              style={{ minHeight: "500px" }} onClick={() => setZoomed((z) => !z)} />
            {!zoomed && <div className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded bg-paper/80 px-2 py-1 text-xs text-ink"><ZoomIn size={12} /> Click to zoom</div>}
            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-paper/80 hover:bg-paper"><ChevronLeft size={18} /></button>
                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-paper/80 hover:bg-paper"><ChevronRight size={18} /></button>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          {product.Category && <Link to={`/shop?category=${product.Category.slug}`} className="eyebrow text-charcoal/60 hover:text-ink">{product.Category.name}</Link>}
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display text-3xl sm:text-4xl">{product.name}</h1>
            <button onClick={handleShare} title="Share on WhatsApp" className="shrink-0 mt-1 flex items-center gap-1.5 text-xs text-charcoal/50 hover:text-green-600 transition-colors">
              <Share2 size={16} /><span className="hidden sm:block">Share</span>
            </button>
          </div>
          {localReviews.length > 0 && (
            <div className="flex items-center gap-2">
              <RatingStars rating={product.rating} />
              <span className="text-xs text-charcoal/60">{product.rating} ({localReviews.length} review{localReviews.length !== 1 ? "s" : ""})</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-medium">{formatPrice(finalPrice)}</span>
            {hasDiscount && (<><span className="text-base text-charcoal/45 line-through">{formatPrice(product.price)}</span><span className="bg-ink px-2 py-0.5 text-xs text-paper">-{Math.round(product.discount)}%</span></>)}
          </div>
          <div className="stitch-rule text-ink/20" />
          <p className="text-sm leading-relaxed text-charcoal/75">{product.description}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {product.material && <div><span className="eyebrow block mb-1">Material</span>{product.material}</div>}
            <div><span className="eyebrow block mb-1">Availability</span>
              {product.stock > 0
                ? <span className={product.stock <= 5 ? "text-amber-600 font-medium" : "text-green-700"}>{product.stock <= 5 ? `Only ${product.stock} left!` : "In Stock"}</span>
                : <span className="text-red-500 font-medium">Sold Out</span>}
            </div>
          </div>

          {/* Sizes with OOS visual */}
          {product.sizes?.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const oos = isSizeOOS(s.name);
                  return (
                    <button key={s.id} onClick={() => !oos && setSelectedSize(s.name)} disabled={oos}
                      title={oos ? "Out of stock in this size" : s.name}
                      className={`relative border px-4 py-2 text-sm uppercase transition-colors overflow-hidden
                        ${oos ? "border-ink/10 text-charcoal/25 cursor-not-allowed" : selectedSize === s.name ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-ink"}`}>
                      {s.name}
                      {oos && <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="block h-px w-[140%] bg-charcoal/20 rotate-[-25deg] origin-center" />
                      </span>}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-charcoal/50">Crossed-out sizes are currently out of stock.</p>
                <a href="/size-guide" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-charcoal/60 underline hover:text-ink transition-colors flex items-center gap-1">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 4h10M7 8h6M7 12h8"/></svg>
                  Size Guide
                </a>
              </div>
            </div>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Color — <span className="normal-case tracking-normal text-charcoal/70">{selectedColor}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button key={c.id} onClick={() => setSelectedColor(c.name)} title={c.name}
                    className={`h-9 w-9 rounded-full border-2 transition-transform ${selectedColor === c.name ? "border-ink scale-110" : "border-ink/10"}`}
                    style={{ backgroundColor: c.hex_code || "#ccc" }} />
                ))}
              </div>
            </div>
          )}

          {/* Qty + CTA */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <p className="eyebrow">Qty</p>
              <div className="flex items-center border border-ink/20">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2 hover:bg-ink hover:text-paper transition-colors">−</button>
                <span className="w-12 text-center text-sm">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="px-4 py-2 hover:bg-ink hover:text-paper transition-colors">+</button>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAdd} disabled={adding || product.stock === 0} className="btn-primary flex-1">
                <ShoppingBag size={16} />{product.stock === 0 ? "Sold Out" : adding ? "Adding…" : "Add to Cart"}
              </button>
              <button onClick={handleWishlist} aria-label="Toggle wishlist" className="btn-outline px-4">
                <Heart size={16} className={inWishlist ? "fill-ink" : "fill-none"} />
              </button>
            </div>
          </div>

          {/* WhatsApp share */}
          <button onClick={handleShare} className="flex items-center gap-2 text-xs text-charcoal/50 hover:text-green-600 transition-colors self-start mt-1">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.122 1.534 5.857L0 24l6.335-1.518A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.5-5.063-1.375L2.5 21.5l.906-4.313A9.952 9.952 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            Share on WhatsApp
          </button>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl">Customer Reviews</h2>
          <span className="text-sm text-charcoal/60">{localReviews.length} review{localReviews.length !== 1 ? "s" : ""}</span>
        </div>
        {isAuthenticated && !reviewSubmitted && (
          <div className="mb-10 border border-ink/10 p-6 bg-cream/40">
            <h3 className="font-display text-xl mb-1">Write a Review</h3>
            <p className="text-xs text-charcoal/60 mb-4">Only available after a delivered order for this product.</p>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="eyebrow mb-2 block">Your Rating</label>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <button key={star} type="button" onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110">
                      <Star size={24} className={star <= reviewRating ? "fill-ink text-ink" : "fill-none text-ink/25"} strokeWidth={1.5} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-charcoal/60">{["","Poor","Fair","Good","Very Good","Excellent"][reviewRating]}</span>
                </div>
              </div>
              <div>
                <label className="eyebrow mb-1 block">Your Review (optional)</label>
                <textarea rows={4} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell other customers about the fit, quality, and fabric…" className="input-field resize-none" />
              </div>
              <button type="submit" disabled={reviewSubmitting} className="btn-primary">{reviewSubmitting ? "Submitting…" : "Submit Review"}</button>
            </form>
          </div>
        )}
        {reviewSubmitted && <div className="mb-8 border border-green-200 bg-green-50 p-4 text-sm text-green-700">✓ Review submitted. Thank you!</div>}
        {localReviews.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-ink/15">
            <p className="text-charcoal/40 font-display text-xl">No reviews yet.</p>
            <p className="text-sm text-charcoal/40 mt-1">Be the first to review this product.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {localReviews.map((r) => (
              <div key={r.id} className="border border-ink/10 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.User?.first_name} {r.User?.last_name?.charAt(0)}.</span>
                  <RatingStars rating={r.rating} size={12} />
                </div>
                {r.comment && <p className="text-sm text-charcoal/70 leading-relaxed">{r.comment}</p>}
                <p className="text-xs text-charcoal/40">{new Date(r.createdAt).toLocaleDateString("en-EG")}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {similar_products.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl mb-8">You Might Also Like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-6">
            {similar_products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};
export default ProductDetailPage;
