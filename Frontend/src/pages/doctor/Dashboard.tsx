// src/pages/doctor/DoctorDashboard.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, AlertTriangle, Users, Activity, Shield, Plus, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

// ---------------------------
// Types
// ---------------------------
interface Prescription {
  id: string;
  patient_name: string;
  drug_name: string;
  status: "Active" | "Dispensed";
  issue_date?: string;
  valid_until?: string;
  dosage?: string;
  frequency?: string;
  duration?: number;
  instructions?: string;
  qrcode?: string;
}

interface DashboardStats {
  total_prescriptions: number;
  active_prescriptions: number;
  dispensed_today: number;
  patients_served: number;
}

// ---------------------------
// Helper: Format Date
// ---------------------------
const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

// ---------------------------
// Doctor Dashboard Component
// ---------------------------
const DoctorDashboard = () => {
  const [recentPrescriptions, setRecentPrescriptions] = useState<Prescription[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_prescriptions: 0,
    active_prescriptions: 0,
    dispensed_today: 0,
    patients_served: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User info from localStorage
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userName = userData.fullName || "Doctor";
  const userEmail = userData.email || "";

  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/doctor/dashboard" },
    { icon: FileText, label: "Create Prescription", path: "/doctor/create-prescription" },
    { icon: Clock, label: "My Prescriptions", path: "/doctor/prescriptions" },
    { icon: Shield, label: "Blockchain Verification", path: "/doctor/blockchain-verification" },
    { icon: Activity, label: "Activity Logs", path: "/doctor/activity-logs" },
  ];

  // ---------------------------
  // Fetch Dashboard Data
  // ---------------------------
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token found");

      const API_BASE = "http://localhost:4000/api/auth"; // Matches backend route

      interface DashboardResponse {
        stats: DashboardStats;
        recentPrescriptions: Prescription[];
      }

      const res = await axios.get<DashboardResponse>(`${API_BASE}/doctor/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data) {
        setStats(res.data.stats ?? stats);
        setRecentPrescriptions(res.data.recentPrescriptions ?? []);
      } else {
        setError("No dashboard data available");
      }
    } catch (err: any) {
      console.error("Failed to fetch doctor dashboard:", err);
      setError(err.response?.data?.message || err.message || "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const statsData = [
    { title: "Total Prescriptions", value: stats.total_prescriptions, change: "+12%", icon: FileText, color: "text-primary" },
    { title: "Active Prescriptions", value: stats.active_prescriptions, change: "+8%", icon: Clock, color: "text-warning" },
    { title: "Dispensed Today", value: stats.dispensed_today, change: "+15%", icon: CheckCircle, color: "text-success" },
    { title: "Patients Served", value: stats.patients_served, change: "+5%", icon: Users, color: "text-accent" },
  ];

  return (
    <DashboardLayout
      sidebarItems={sidebarItems.map((item) => ({ ...item, active: item.path === "/doctor/dashboard" }))}
      userRole="doctor"
      userName={userName}
      userEmail={userEmail}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Welcome Back{userName ? `, ${userName}` : ""}!</h1>
            <p className="text-muted-foreground">Manage prescriptions and monitor blockchain verification</p>
          </div>
          <Link to="/doctor/create-prescription">
            <Button className="btn-gradient-primary flex items-center">
              <Plus className="mr-2 w-5 h-5" /> New Prescription
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, i) => (
            <Card key={i} className="card-elevated">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-success" />
                    <span className="text-xs text-success">{stat.change}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Prescriptions */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Recent Prescriptions</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading prescriptions...</p>
                ) : error ? (
                  <p className="text-destructive">{error}</p>
                ) : recentPrescriptions.length === 0 ? (
                  <p className="text-muted-foreground">No prescriptions available</p>
                ) : (
                  <div className="space-y-4">
                    {recentPrescriptions.map((rx) => (
                      <div key={rx.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                        <div className="space-y-1">
                          <p className="font-medium">#{rx.id}</p>
                          <p className="text-sm text-muted-foreground">Patient: {rx.patient_name}</p>
                          <p className="text-sm font-medium">{rx.drug_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Dosage: {rx.dosage || "-"} | Frequency: {rx.frequency || "-"} | Duration: {rx.duration ?? "-"} days
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Issued: {formatDate(rx.issue_date)} | Valid Until: {formatDate(rx.valid_until)}
                          </p>
                          {rx.instructions && <p className="text-xs text-muted-foreground">Instructions: {rx.instructions}</p>}
                          {rx.qrcode && <img src={rx.qrcode} alt={`QR for prescription ${rx.id}`} className="mt-2 w-20 h-20" />}
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={rx.status === "Active" ? "default" : "secondary"}
                            className={rx.status === "Active" ? "bg-warning text-warning-foreground" : ""}
                          >
                            {rx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-6">
                  <Link to="/doctor/prescriptions">
                    <Button variant="outline" className="w-full">View All Prescriptions</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/doctor/create-prescription">
                  <Button className="w-full btn-gradient-primary flex items-center">
                    <FileText className="mr-2 w-4 h-4" /> Create Prescription
                  </Button>
                </Link>
                <Link to="/doctor/blockchain-verification">
                  <Button variant="outline" className="w-full flex items-center">
                    <Shield className="mr-2 w-4 h-4" /> Verify on Blockchain
                  </Button>
                </Link>
                <Link to="/doctor/activity-logs">
                  <Button variant="outline" className="w-full flex items-center">
                    <Activity className="mr-2 w-4 h-4" /> View Activity Logs
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-warning/10">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Blockchain Sync</p>
                    <p className="text-xs text-muted-foreground">3 prescriptions pending blockchain confirmation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-success/10">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">System Status</p>
                    <p className="text-xs text-muted-foreground">All systems operational</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
