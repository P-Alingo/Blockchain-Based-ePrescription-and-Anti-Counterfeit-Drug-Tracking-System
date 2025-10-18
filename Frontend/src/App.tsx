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
import BlockchainVerification from "./pages/doctor/BlockchainVerification";
import DoctorActivityLogs from "./pages/doctor/ActivityLogs";

// Patient Dashboard Pages
import PatientDashboard from "./pages/patient/Dashboard";
import PatientPrescriptions from "./pages/patient/MyPrescriptions";
import QRCodeViewer from "./pages/patient/QRCodeViewer";
import PatientAlerts from "./pages/patient/MyAlerts";
import PatientActivityLogs from "./pages/patient/ActivityLogs";

// Pharmacist Dashboard Pages
import PharmacistDashboard from "./pages/pharmacist/Dashboard";
import ScanPrescription from "./pages/pharmacist/ScanPrescription";
import VerifyPrescription from "./pages/pharmacist/VerifyPrescription";
import DispenseDrug from "./pages/pharmacist/DispenseDrug";
import Inventory from "./pages/pharmacist/Inventory";
import PharmacistActivityLogs from "./pages/pharmacist/ActivityLogs";

// Manufacturer Dashboard Pages
import ManufacturerDashboard from "./pages/manufacturer/Dashboard";
import RegisterBatch from "./pages/manufacturer/RegisterBatch";
import BatchList from "./pages/manufacturer/BatchList";
import ManufacturerBlockchainVerification from "./pages/manufacturer/BlockchainVerification";
import ManufacturerActivityLogs from "./pages/manufacturer/ActivityLogs";

// Distributor Dashboard Pages
import DistributorDashboard from "./pages/distributor/Dashboard";
import ActiveShipments from "./pages/distributor/ActiveShipments";
import UpdateShipment from "./pages/distributor/UpdateShipment";
import ShipmentLogs from "./pages/distributor/ShipmentLogs";
import DistributorActivityLogs from "./pages/distributor/ActivityLogs";

// Regulator Dashboard Pages
import RegulatorDashboard from "./pages/regulator/Dashboard";
import Audits from "./pages/regulator/Audits";
import Reports from "./pages/regulator/Reports";
import RegulatorAlerts from "./pages/regulator/Alerts";
import ComplianceActions from "./pages/regulator/ComplianceActions";
import RegulatorActivityLogs from "./pages/regulator/ActivityLogs";

// Admin Dashboard Pages
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import SystemSettings from "./pages/admin/SystemSettings";
import AdminReports from "./pages/admin/Reports";
import AdminActivityLogs from "./pages/admin/ActivityLogs";

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
            <Route path="/doctor/blockchain-verification" element={<ProtectedRoute allowedRoles={["doctor"]}><BlockchainVerification /></ProtectedRoute>} />
            <Route path="/doctor/activity-logs" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorActivityLogs /></ProtectedRoute>} />

            {/* Patient Routes */}
            <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={["patient"]}><PatientDashboard /></ProtectedRoute>} />
            <Route path="/patient/prescriptions" element={<ProtectedRoute allowedRoles={["patient"]}><PatientPrescriptions /></ProtectedRoute>} />
            <Route path="/patient/qr-viewer" element={<ProtectedRoute allowedRoles={["patient"]}><QRCodeViewer /></ProtectedRoute>} />
            <Route path="/patient/alerts" element={<ProtectedRoute allowedRoles={["patient"]}><PatientAlerts /></ProtectedRoute>} />
            <Route path="/patient/activity-logs" element={<ProtectedRoute allowedRoles={["patient"]}><PatientActivityLogs /></ProtectedRoute>} />

            {/* Pharmacist Routes */}
            <Route path="/pharmacist/dashboard" element={<ProtectedRoute allowedRoles={["pharmacist"]}><PharmacistDashboard /></ProtectedRoute>} />
            <Route path="/pharmacist/scan" element={<ProtectedRoute allowedRoles={["pharmacist"]}><ScanPrescription /></ProtectedRoute>} />
            <Route path="/pharmacist/verify" element={<ProtectedRoute allowedRoles={["pharmacist"]}><VerifyPrescription /></ProtectedRoute>} />
            <Route path="/pharmacist/dispense" element={<ProtectedRoute allowedRoles={["pharmacist"]}><DispenseDrug /></ProtectedRoute>} />
            <Route path="/pharmacist/inventory" element={<ProtectedRoute allowedRoles={["pharmacist"]}><Inventory /></ProtectedRoute>} />
            <Route path="/pharmacist/activity-logs" element={<ProtectedRoute allowedRoles={["pharmacist"]}><PharmacistActivityLogs /></ProtectedRoute>} />

            {/* Manufacturer Routes */}
            <Route path="/manufacturer/dashboard" element={<ProtectedRoute allowedRoles={["manufacturer"]}><ManufacturerDashboard /></ProtectedRoute>} />
            <Route path="/manufacturer/register-batch" element={<ProtectedRoute allowedRoles={["manufacturer"]}><RegisterBatch /></ProtectedRoute>} />
            <Route path="/manufacturer/batch-list" element={<ProtectedRoute allowedRoles={["manufacturer"]}><BatchList /></ProtectedRoute>} />
            <Route path="/manufacturer/blockchain-verification" element={<ProtectedRoute allowedRoles={["manufacturer"]}><ManufacturerBlockchainVerification /></ProtectedRoute>} />
            <Route path="/manufacturer/activity-logs" element={<ProtectedRoute allowedRoles={["manufacturer"]}><ManufacturerActivityLogs /></ProtectedRoute>} />

            {/* Distributor Routes */}
            <Route path="/distributor/dashboard" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorDashboard /></ProtectedRoute>} />
            <Route path="/distributor/active-shipments" element={<ProtectedRoute allowedRoles={["distributor"]}><ActiveShipments /></ProtectedRoute>} />
            <Route path="/distributor/update-shipment" element={<ProtectedRoute allowedRoles={["distributor"]}><UpdateShipment /></ProtectedRoute>} />
            <Route path="/distributor/shipment-logs" element={<ProtectedRoute allowedRoles={["distributor"]}><ShipmentLogs /></ProtectedRoute>} />
            <Route path="/distributor/activity-logs" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorActivityLogs /></ProtectedRoute>} />

            {/* Regulator Routes */}
            <Route path="/regulator/dashboard" element={<ProtectedRoute allowedRoles={["regulator"]}><RegulatorDashboard /></ProtectedRoute>} />
            <Route path="/regulator/audits" element={<ProtectedRoute allowedRoles={["regulator"]}><Audits /></ProtectedRoute>} />
            <Route path="/regulator/reports" element={<ProtectedRoute allowedRoles={["regulator"]}><Reports /></ProtectedRoute>} />
            <Route path="/regulator/alerts" element={<ProtectedRoute allowedRoles={["regulator"]}><RegulatorAlerts /></ProtectedRoute>} />
            <Route path="/regulator/compliance" element={<ProtectedRoute allowedRoles={["regulator"]}><ComplianceActions /></ProtectedRoute>} />
            <Route path="/regulator/activity-logs" element={<ProtectedRoute allowedRoles={["regulator"]}><RegulatorActivityLogs /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><SystemSettings /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/activity-logs" element={<ProtectedRoute allowedRoles={["admin"]}><AdminActivityLogs /></ProtectedRoute>} />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
