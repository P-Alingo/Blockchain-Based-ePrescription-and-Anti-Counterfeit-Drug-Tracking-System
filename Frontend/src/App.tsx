import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";

// Doctor Dashboard Pages
import DoctorDashboard from "./pages/doctor/Dashboard";
import CreatePrescription from "./pages/doctor/CreatePrescription";
import MyPrescriptions from "./pages/doctor/MyPrescriptions";
import DoctorActivityLogs from "./pages/doctor/Analytics";
import DoctorAnalytics from "./pages/doctor/Analytics";

// Patient Dashboard Pages
import PatientDashboard from "./pages/patient/Dashboard";
import PatientPrescriptions from "./pages/patient/MyPrescriptions";
import QRCodeViewer from "./pages/patient/QRCodeViewer";
import PatientActivityLogs from "./pages/patient/Analytics";
import PatientAnalytics from "./pages/patient/Analytics";

// Pharmacist Dashboard Pages
import PharmacistDashboard from "./pages/pharmacist/Dashboard";
import ScanPrescription from "./pages/pharmacist/ScanPrescription";
import VerifyPrescription from "./pages/pharmacist/VerifyPrescription";
import DispenseDrug from "./pages/pharmacist/DispenseDrug";
import Inventory from "./pages/pharmacist/Inventory";
import PharmacistActivityLogs from "./pages/pharmacist/Analytics";
import PharmacistAnalytics from "./pages/pharmacist/Analytics";
import PharmacistBlockchain from "./pages/pharmacist/Blockchain";
import PharmacistDistributors from "./pages/pharmacist/Distributors";
import PharmacistRequests from "./pages/pharmacist/Requests";
import PharmacistShipments from "./pages/pharmacist/Shipments";

// Manufacturer Dashboard Pages
import ManufacturerDashboard from "./pages/manufacturer/Dashboard";
import RegisterBatch from "./pages/manufacturer/RegisterBatch";
import BatchList from "./pages/manufacturer/Batches";
import ManufacturerBlockchainVerification from "./pages/manufacturer/Blockchain";
import ManufacturerActivityLogs from "./pages/manufacturer/Analytics";
import ManufacturerAnalytics from "./pages/manufacturer/Analytics";
import ManufacturerShipments from "./pages/manufacturer/Shipments";

// Distributor Dashboard Pages
import DistributorDashboard from "./pages/distributor/Dashboard";
import ActiveShipments from "./pages/distributor/Shipments";
import UpdateShipment from "./pages/distributor/UpdateShipment";
import ShipmentLogs from "./pages/distributor/IncomingShipments";
import DistributorActivityLogs from "./pages/distributor/Analytics";
import DistributorAnalytics from "./pages/distributor/Analytics";
import DistributorBlockchain from "./pages/distributor/Blockchain";
import DistributorInventory from "./pages/distributor/Inventory";
import DistributorRequests from "./pages/distributor/Requests";
import DistributorShipments from "./pages/distributor/Shipments";

// Regulator Dashboard Pages
import RegulatorDashboard from "./pages/regulator/Dashboard";
import Audits from "./pages/regulator/Audits";
import Reports from "./pages/regulator/Reports";
import ComplianceActions from "./pages/regulator/ComplianceActions";
import RegulatorActivityLogs from "./pages/regulator/Analytics";
import RegulatorAnalytics from "./pages/regulator/Analytics";
import RegulatorBlockchain from "./pages/regulator/Blockchain";

// Admin Dashboard Pages
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import SystemSettings from "./pages/admin/Blockchain";
import AdminReports from "./pages/admin/Reports";
import AdminActivityLogs from "./pages/admin/Analytics";
import AdminAnalytics from "./pages/admin/Analytics";

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

/**
 * Decode JWT to get expiration
 */
const isTokenExpired = (token: string | null) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

/**
 * Helper function to check auth status and get user role
 */
const getAuthStatus = () => {
  const token = localStorage.getItem("token");
  const userDataString = localStorage.getItem("userData");

  if (!token || !userDataString || isTokenExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    return { isAuthenticated: false, role: null };
  }

  try {
    const userData = JSON.parse(userDataString);
    return {
      isAuthenticated: !!userData?.role,
      role: userData?.role,
    };
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    return { isAuthenticated: false, role: null };
  }
};

/* ----------------------------
 * 🔐 Protected Route
 * ---------------------------- */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = getAuthStatus();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role as string)) {
    return <Navigate to={`/${role?.toLowerCase() || ''}/dashboard`} replace />;
  }

  return <>{children}</>;
};

/* ----------------------------
 * ⚙️ Clear storage on public routes and on tab close
 * ---------------------------- */
const RouteCleanup: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    // Clear user data if user navigates to public routes
    if (["/", "/login", "/register"].includes(location.pathname)) {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
    }

    // Clear user data on page unload (refresh or close tab)
    const handleBeforeUnload = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [location]);

  return null;
};

/* ----------------------------
 * ⚙️ Main Application
 * ---------------------------- */
const App = () => {
  const { isAuthenticated, role } = getAuthStatus();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteCleanup /> {/* Auto-clear logic */}
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route
              path="/login"
              element={
                isAuthenticated
                  ? <Navigate to={`/${role?.toLowerCase() || ''}/dashboard`} replace />
                  : <Login />
              }
            />
            <Route
              path="/register"
              element={
                isAuthenticated
                  ? <Navigate to={`/${role?.toLowerCase() || ''}/dashboard`} replace />
                  : <Register />
              }
            />

            {/* Doctor Routes */}
            <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/doctor/create-prescription" element={<ProtectedRoute allowedRoles={["doctor"]}><CreatePrescription /></ProtectedRoute>} />
            <Route path="/doctor/prescriptions" element={<ProtectedRoute allowedRoles={["doctor"]}><MyPrescriptions /></ProtectedRoute>} />
            <Route path="/doctor/analytics" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorAnalytics /></ProtectedRoute>} />

            {/* Patient Routes */}
            <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={["patient"]}><PatientDashboard /></ProtectedRoute>} />
            <Route path="/patient/prescriptions" element={<ProtectedRoute allowedRoles={["patient"]}><PatientPrescriptions /></ProtectedRoute>} />
            <Route path="/patient/qr-viewer" element={<ProtectedRoute allowedRoles={["patient"]}><QRCodeViewer /></ProtectedRoute>} />
            <Route path="/patient/analytics" element={<ProtectedRoute allowedRoles={["patient"]}><PatientAnalytics /></ProtectedRoute>} />

            {/* Pharmacist Routes */}
            <Route path="/pharmacist/dashboard" element={<ProtectedRoute allowedRoles={["pharmacist"]}><PharmacistDashboard /></ProtectedRoute>} />
            <Route path="/pharmacist/scan" element={<ProtectedRoute allowedRoles={["pharmacist"]}><ScanPrescription /></ProtectedRoute>} />
            <Route path="/pharmacist/verify" element={<ProtectedRoute allowedRoles={["pharmacist"]}><VerifyPrescription /></ProtectedRoute>} />
            <Route path="/pharmacist/dispense" element={<ProtectedRoute allowedRoles={["pharmacist"]}><DispenseDrug /></ProtectedRoute>} />
            <Route path="/pharmacist/inventory" element={<ProtectedRoute allowedRoles={["pharmacist"]}><Inventory /></ProtectedRoute>} />
            <Route path="/pharmacist/analytics" element={<ProtectedRoute allowedRoles={["pharmacist"]}><PharmacistAnalytics /></ProtectedRoute>} />
            <Route path="/pharmacist/blockchain" element={<ProtectedRoute allowedRoles={["pharmacist"]}><PharmacistBlockchain /></ProtectedRoute>} />
            <Route path="/pharmacist/distributors" element={<ProtectedRoute allowedRoles={["pharmacist"]}><PharmacistDistributors /></ProtectedRoute>} />
            <Route path="/pharmacist/requests" element={<ProtectedRoute allowedRoles={["pharmacist"]}><PharmacistRequests /></ProtectedRoute>} />
            <Route path="/pharmacist/shipments" element={<ProtectedRoute allowedRoles={["pharmacist"]}><PharmacistShipments /></ProtectedRoute>} />

            {/* Manufacturer Routes */}
            <Route path="/manufacturer/dashboard" element={<ProtectedRoute allowedRoles={["manufacturer"]}><ManufacturerDashboard /></ProtectedRoute>} />
            <Route path="/manufacturer/register-batch" element={<ProtectedRoute allowedRoles={["manufacturer"]}><RegisterBatch /></ProtectedRoute>} />
            <Route path="/manufacturer/batches" element={<ProtectedRoute allowedRoles={["manufacturer"]}><BatchList /></ProtectedRoute>} />
            <Route path="/manufacturer/blockchain-verification" element={<ProtectedRoute allowedRoles={["manufacturer"]}><ManufacturerBlockchainVerification /></ProtectedRoute>} />
            <Route path="/manufacturer/analytics" element={<ProtectedRoute allowedRoles={["manufacturer"]}><ManufacturerAnalytics /></ProtectedRoute>} />
            <Route path="/manufacturer/shipments" element={<ProtectedRoute allowedRoles={["manufacturer"]}><ManufacturerShipments /></ProtectedRoute>} />

            {/* Distributor Routes */}
            <Route path="/distributor/dashboard" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorDashboard /></ProtectedRoute>} />
            <Route path="/distributor/update-shipment" element={<ProtectedRoute allowedRoles={["distributor"]}><UpdateShipment /></ProtectedRoute>} />
            <Route path="/distributor/incoming-shipments" element={<ProtectedRoute allowedRoles={["distributor"]}><ShipmentLogs /></ProtectedRoute>} />
            <Route path="/distributor/analytics" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorAnalytics /></ProtectedRoute>} />
            <Route path="/distributor/blockchain" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorBlockchain /></ProtectedRoute>} />
            <Route path="/distributor/inventory" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorInventory /></ProtectedRoute>} />
            <Route path="/distributor/requests" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorRequests /></ProtectedRoute>} />
            <Route path="/distributor/shipments" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorShipments /></ProtectedRoute>} />

            {/* Regulator Routes */}
            <Route path="/regulator/dashboard" element={<ProtectedRoute allowedRoles={["regulator"]}><RegulatorDashboard /></ProtectedRoute>} />
            <Route path="/regulator/audits" element={<ProtectedRoute allowedRoles={["regulator"]}><Audits /></ProtectedRoute>} />
            <Route path="/regulator/reports" element={<ProtectedRoute allowedRoles={["regulator"]}><Reports /></ProtectedRoute>} />
            <Route path="/regulator/compliance" element={<ProtectedRoute allowedRoles={["regulator"]}><ComplianceActions /></ProtectedRoute>} />
            <Route path="/regulator/analytics" element={<ProtectedRoute allowedRoles={["regulator"]}><RegulatorAnalytics /></ProtectedRoute>} />
            <Route path="/regulator/blockchain" element={<ProtectedRoute allowedRoles={["regulator"]}><RegulatorBlockchain /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/blockchain" element={<ProtectedRoute allowedRoles={["admin"]}><SystemSettings /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
