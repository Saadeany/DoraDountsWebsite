import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import AdminLayout from "./pages/admin/AdminLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";

// Public pages
import HomePage         from "./pages/HomePage";
import ShopPage         from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage         from "./pages/CartPage";
import CheckoutPage     from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import WishlistPage     from "./pages/WishlistPage";
import ProfilePage      from "./pages/ProfilePage";
import LoginPage        from "./pages/LoginPage";
import AboutPage        from "./pages/AboutPage";
import ContactPage      from "./pages/ContactPage";
import FAQPage          from "./pages/FAQPage";
import PrivacyPage      from "./pages/PrivacyPage";
import SizeGuidePage from "./pages/SizeGuidePage";
import TermsPage        from "./pages/TermsPage";
import NotFoundPage     from "./pages/NotFoundPage";

// Email / auth pages
import VerifyEmailPage    from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage  from "./pages/ResetPasswordPage";

// Cancel / Return pages
import CancelOrderPage from "./pages/CancelOrderPage";
import ReturnOrderPage from "./pages/ReturnOrderPage";

// Admin pages
import AdminLoginPage      from "./pages/admin/AdminLoginPage";
import AdminDashboard      from "./pages/admin/AdminDashboard";
import AdminProductsPage   from "./pages/admin/AdminProductsPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminOrdersPage     from "./pages/admin/AdminOrdersPage";
import AdminReturnsPage    from "./pages/admin/AdminReturnsPage";
import AdminCustomersPage  from "./pages/admin/AdminCustomersPage";
import AdminCouponsPage    from "./pages/admin/AdminCouponsPage";
import AdminEmailLogsPage  from "./pages/admin/AdminEmailLogsPage";
import AdminZonesPage      from "./pages/admin/AdminZonesPage";

const App = () => (
  <Routes>
    {/* Admin */}
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
      <Route index              element={<AdminDashboard />}      />
      <Route path="products"    element={<AdminProductsPage />}   />
      <Route path="categories"  element={<AdminCategoriesPage />} />
      <Route path="orders"      element={<AdminOrdersPage />}     />
      <Route path="returns"     element={<AdminReturnsPage />}    />
      <Route path="zones"       element={<AdminZonesPage />}      />
      <Route path="customers"   element={<AdminCustomersPage />}  />
      <Route path="coupons"     element={<AdminCouponsPage />}    />
      <Route path="email-logs"  element={<AdminEmailLogsPage />}  />
    </Route>

    {/* Public */}
    <Route element={<Layout />}>
      <Route path="/"              element={<HomePage />}         />
      <Route path="/shop"          element={<ShopPage />}         />
      <Route path="/product/:slug" element={<ProductDetailPage />}/>
      <Route path="/about"         element={<AboutPage />}        />
      <Route path="/contact"       element={<ContactPage />}      />
      <Route path="/faq"           element={<FAQPage />}          />
      <Route path="/privacy"       element={<PrivacyPage />}      />
      <Route path="/size-guide" element={<SizeGuidePage />} />
      <Route path="/terms"         element={<TermsPage />}        />
      <Route path="/login"         element={<LoginPage />}        />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />}  />
      <Route path="/verify-email"    element={<VerifyEmailPage />}     />

      {/* Protected customer routes */}
      <Route path="/cart"      element={<ProtectedRoute><CartPage /></ProtectedRoute>}          />
      <Route path="/checkout"  element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>}      />
      <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
      <Route path="/wishlist"  element={<ProtectedRoute><WishlistPage /></ProtectedRoute>}      />
      <Route path="/profile"          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/orders"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/addresses" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/password"  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Cancel / Return routes */}
      <Route path="/cancel-order/:orderId" element={<ProtectedRoute><CancelOrderPage /></ProtectedRoute>} />
      <Route path="/return-order/:orderId" element={<ProtectedRoute><ReturnOrderPage /></ProtectedRoute>} />

      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

export default App;
