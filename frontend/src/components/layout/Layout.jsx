import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import VerificationBanner from "../common/VerificationBanner";
import WhatsAppButton from "../common/WhatsAppButton";

const Layout = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <VerificationBanner />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <WhatsAppButton />
  </div>
);

export default Layout;
