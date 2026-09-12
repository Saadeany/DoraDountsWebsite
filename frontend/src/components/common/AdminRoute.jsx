import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loader from "./Loader";

// Gates the admin panel: only role === "admin" gets through. Anyone else
// (including logged-out visitors) is bounced to the admin login screen.
const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();

  if (loading) return <Loader label="Checking permissions" />;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
};

export default AdminRoute;
