// src/pages/patient/PatientDashboard.tsx
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, QrCode, Bell, Activity, Clock, CheckCircle, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:4000/api/auth";

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
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/patient/dashboard" },
    { icon: FileText, label: "My Prescriptions", path: "/patient/prescriptions" },
    { icon: QrCode, label: "QR Code Viewer", path: "/patient/qr-viewer" },
    { icon: Bell, label: "My Alerts", path: "/patient/alerts" },
    { icon: Activity, label: "Activity Logs", path: "/patient/activity-logs" },
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

        const response = await axios.get(`${API_BASE}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Dashboard response:", response.data);

        // Adjust this destructuring based on your actual API response structure
        const {
          activePrescriptions,
          totalPrescriptions,
          alerts,
          recentPrescriptions,
          walletAddress,
          email,
          id,
          fullName,
        } = (response.data as any).data || response.data;

        setUser({ id, email, walletAddress, role, fullName });
        setDashboard({ activePrescriptions, totalPrescriptions, alerts, recentPrescriptions });
      } catch (err: any) {
        console.error("Dashboard fetch failed:", err);
        setError(err.response?.data?.message || err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-muted-foreground">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        Loading dashboard...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center text-destructive mb-4">
            <Shield className="h-12 w-12 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Failed to Load Dashboard</h2>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()} className="flex-1">Try Again</Button>
            <Button onClick={() => navigate("/login")} variant="outline" className="flex-1">Back to Login</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!user || !dashboard) return (
    <div className="flex items-center justify-center min-h-screen text-destructive">
      Failed to load user data. Please log in again.
    </div>
  );

  const activePrescriptions = dashboard.activePrescriptions || [];

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
      ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
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
            <p className="text-muted-foreground">Track your prescriptions and medication schedule</p>
          </div>
          <Link to="/patient/qr-viewer">
            <Button className="btn-gradient-primary">
              <QrCode className="mr-2 w-5 h-5" />
              Show QR Code
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Prescriptions</p>
                <p className="text-2xl font-bold">{activePrescriptions.length}</p>
              </div>
              <Clock className="w-6 h-6 text-primary" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Prescriptions</p>
                <p className="text-2xl font-bold">{dashboard.totalPrescriptions || 0}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Alerts</p>
                <p className="text-2xl font-bold">{dashboard.alerts?.length || 0}</p>
              </div>
              <Bell className="w-6 h-6 text-orange-600" />
            </CardContent>
          </Card>
        </div>

        {/* Active Prescriptions List */}
        <Card className="card-elevated mt-6">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Active Prescriptions</CardTitle>
            <Badge className="bg-warning text-warning-foreground">{activePrescriptions.length} Active</Badge>
          </CardHeader>
          <CardContent>
            {activePrescriptions.length > 0 ? (
              activePrescriptions.map((p: any) => (
                <div key={p.id} className="p-4 mb-3 rounded-lg border bg-muted/30">
                  <h3 className="font-semibold">{p.drug || "Prescription"}</h3>
                  <p className="text-sm text-muted-foreground">Prescribed by {p.doctor_name || "Doctor"}</p>
                  <p className="text-sm">Status: {p.status || "active"}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active prescriptions found.</p>
                <Button variant="outline" className="mt-4">
                  <Link to="/patient/prescriptions">View All Prescriptions</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
