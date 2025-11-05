// src/pages/patient/PatientDashboard.tsx
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Bell,
  Activity,
  Clock,
  CheckCircle,
  Shield,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";


const AUTH_API_BASE = "http://localhost:4000/api/auth";
const PATIENT_API_BASE = "http://localhost:4000/api/patient";

interface User {
  id: number;
  email: string;
  walletAddress: string;
  role: string;
  fullName?: string;
}

interface DashboardData {
  activePrescriptions?: any[];
  totalPrescriptions?: number;
  alerts?: any[];
  recentPrescriptions?: any[];
}

const PatientDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/patient/dashboard" },
    { icon: FileText, label: "My Prescriptions", path: "/patient/prescriptions" },
    { icon: Activity, label: "Analytics", path: "/patient/analytics" },
  ];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const storedUserData = localStorage.getItem("userData");
        if (!storedUserData) return navigate("/login");

        const { token, role } = JSON.parse(storedUserData);
        if (!token || role !== "patient") {
          localStorage.removeItem("userData");
          localStorage.removeItem("token");
          return navigate("/login");
        }

        // Fetch enhanced dashboard data
        const response = await axios.get<User & DashboardData & { [key: string]: any }>(
          `${PATIENT_API_BASE}/dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = response.data;
        setUser({
          id: data.id,
          email: data.email,
          walletAddress: data.walletAddress,
          role: data.role,
          fullName: data.fullName,
        });
        setDashboard(data);
      } catch (err: any) {
        console.error("Dashboard fetch failed:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [navigate]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          Loading dashboard...
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center text-destructive mb-4">
              <Shield className="h-12 w-12 mx-auto mb-2" />
              <h2 className="text-xl font-bold">Failed to Load Dashboard</h2>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className="flex-1"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  if (!user || !dashboard)
    return (
      <div className="flex items-center justify-center min-h-screen text-destructive">
        Failed to load user data. Please log in again.
      </div>
    );

  const stats = dashboard?.stats || {};
  const recentPrescriptions = dashboard?.recentPrescriptions || [];
  // Map statusBreakdown keys for display
  const statusBreakdown = dashboard?.statusBreakdown ? Object.fromEntries(Object.entries(dashboard.statusBreakdown).map(([k, v]) => [k === "issued" ? "Active" : k.charAt(0).toUpperCase() + k.slice(1), v])) : {};
  const drugFrequency = dashboard?.drugFrequency || {};
  const doctorFrequency = dashboard?.doctorFrequency || {};
  const topDoctor = dashboard?.topDoctor || "N/A";
  const topDrug = dashboard?.topDrug || "N/A";
  const timeline = dashboard?.timeline || [];

  return (
    <DashboardLayout
      sidebarItems={sidebarItems.map((item) => ({
        ...item,
        active: item.path === "/patient/dashboard",
      }))}
      userRole="patient"
      userName={
        user.fullName ||
        (user.walletAddress
          ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(
              -4
            )}`
          : "Patient")
      }
      userEmail={user.email}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-green-600">
              Welcome Back{user && user.fullName ? `, ${user.fullName}` : ""}!
            </h1>
            <p className="text-muted-foreground">
              Track your prescriptions and medication schedule
            </p>
          </div>
          {/* QR code button removed */}
        </div>

        {/* Statistic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-muted-foreground">Total Prescriptions</p>
              <p className="text-2xl font-bold">{stats.totalPrescriptions ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-muted-foreground">Active Prescriptions</p>
              <p className="text-2xl font-bold">{stats.activePrescriptions ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-muted-foreground">Dispensed Prescriptions</p>
              <p className="text-2xl font-bold">{stats.dispensedPrescriptions ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-muted-foreground">Expired Prescriptions</p>
              <p className="text-2xl font-bold">{stats.expiredPrescriptions ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown Chart (simple bar) */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Status Breakdown</h2>
          <div className="flex gap-4">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex flex-col items-center">
                <span className="font-bold text-xl">{String(count)}</span>
                <span className="text-xs text-muted-foreground">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Doctor & Drug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-muted-foreground">Top Doctor</p>
              <p className="text-xl font-bold">{topDoctor}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-muted-foreground">Top Drug</p>
              <p className="text-xl font-bold">{topDrug}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Table */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Recent Activity</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Prescription No</th>
                  <th className="px-4 py-2 text-left">Doctor Name</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  {/* QR View column removed */}
                </tr>
              </thead>
<tbody>
  {recentPrescriptions.length > 0 ? (
    recentPrescriptions.map((p: any) => (
      <tr key={p.prescriptionNo}>
        <td className="px-4 py-2">{p.prescriptionNo}</td>
        <td className="px-4 py-2">{p.doctorName}</td>
        <td className="px-4 py-2">{new Date(p.date).toLocaleDateString()}</td>
        <td className="px-4 py-2">
          <Badge variant={p.status === 'issued' ? 'default' : 'secondary'}>
            {p.status === 'issued' ? 'Active' : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
          </Badge>
        </td>
        {/* QR View cell removed */}
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={5} className="text-center py-4 text-muted-foreground">No recent activity found.</td>
    </tr>
  )}
</tbody>
            </table>
          </div>
        </div>

        {/* Timeline (chronological view) */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Timeline</h2>
          <div className="flex flex-col gap-2">
            {timeline.length > 0 ? (
              timeline.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-2 border rounded-lg bg-muted/30">
                  <span className="font-mono text-xs">{new Date(item.date).toLocaleDateString()}</span>
                  <span className="font-semibold">{item.drug}</span>
                  <span className="text-xs text-muted-foreground">{item.status}</span>
                  <span className="text-xs text-muted-foreground">#{item.prescriptionNo}</span>
                </div>
              ))
            ) : (
              <span className="text-muted-foreground">No timeline data.</span>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
