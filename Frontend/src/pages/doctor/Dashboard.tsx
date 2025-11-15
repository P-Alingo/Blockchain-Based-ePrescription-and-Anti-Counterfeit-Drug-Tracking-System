// src/pages/doctor/DoctorDashboard.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, AlertTriangle, Users, Activity, Shield, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const DOCTOR_API_BASE = "http://localhost:4000/api/doctor";

// ---------------------------
// Types
// ---------------------------
interface Prescription {
  id: string;
  patient_name: string;
  drug_name: string;
  status: "Active" | "Dispensed" | "Pending" | "Expired";
  issue_date?: string;
  valid_until?: string;
  dosage_amount?: string;
  dosage_unit?: string;
  frequency?: string;
  duration?: number;
  instructions?: string;
  // qrcode_path removed
  prescription_code?: string;
}

interface DashboardStats {
  total_prescriptions: number;
  active_prescriptions: number;
  dispensed_today: number;
  patients_served: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  recentPrescriptions: Prescription[];
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
  const [userData, setUserData] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserData = localStorage.getItem("userData");
    if (!storedToken || !storedUserData) {
      navigate("/login");
      return;
    }
    try {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
      setToken(storedToken);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const userName = userData?.fullName || "Doctor";
  const userEmail = userData?.email || "";

  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/doctor/dashboard", active: true },
    { icon: FileText, label: "Create Prescription", path: "/doctor/create-prescription", active: false },
    { icon: Clock, label: "My Prescriptions", path: "/doctor/prescriptions", active: false },
    { icon: Activity, label: "Analytics", path: "/doctor/analytics", active: false },
       
];

  // ---------------------------
  // Fetch Dashboard Data
  // ---------------------------
  const fetchDashboardData = async (authToken: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get<DashboardResponse>(`${DOCTOR_API_BASE}/dashboard`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.data) {
        console.log('📊 Dashboard data received:', res.data);
        setStats(res.data.stats ?? {
          total_prescriptions: 0,
          active_prescriptions: 0,
          dispensed_today: 0,
          patients_served: 0,
        });
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
    if (!token) return;
    fetchDashboardData(token);
  }, [token]);

  // Stats data configuration
  const statsData = [
    { 
      title: "Total Prescriptions", 
      value: stats.total_prescriptions, 
      change: "", // Remove hardcoded values
      icon: FileText, 
      color: "text-blue-600" 
    },
    { 
      title: "Active Prescriptions", 
      value: stats.active_prescriptions, 
      change: "", 
      icon: Clock, 
      color: "text-orange-600" 
    },
    { 
      title: "Dispensed Today", 
      value: stats.dispensed_today, 
      change: "", 
      icon: CheckCircle, 
      color: "text-green-600" 
    },
    { 
      title: "Patients Served", 
      value: stats.patients_served, 
      change: "", 
      icon: Users, 
      color: "text-purple-600" 
    },
  ];

  // Helper function to determine prescription status with expiration check
  const getPrescriptionStatus = (prescription: Prescription) => {
    if (prescription.status?.toLowerCase() === "dispensed") return "Dispensed";
    if (prescription.status?.toLowerCase() === "expired") return "Expired";
    const now = new Date();
    const validUntil = prescription.valid_until ? new Date(prescription.valid_until) : null;
    if (validUntil && now > validUntil) return "Expired";
    return prescription.status || "Pending";
  };

  // Helper function to get badge styling based on status
  const getBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { variant: "default" as const, className: "bg-green-100 text-green-800" };
      case 'dispensed':
        return { variant: "secondary" as const, className: "bg-blue-100 text-blue-800" };
      case 'expired':
        return { variant: "destructive" as const, className: "bg-red-100 text-red-800" };
      case 'pending':
        return { variant: "outline" as const, className: "bg-yellow-100 text-yellow-800" };
      default:
        return { variant: "secondary" as const, className: "bg-gray-100 text-gray-800" };
    }
  };

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
            <Card key={i} className="card-elevated hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {/* Removed hardcoded percentage changes */}
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Prescriptions</CardTitle>
                {recentPrescriptions.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {recentPrescriptions.length} total
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <p className="text-muted-foreground">Loading prescriptions...</p>
                  </div>
                ) : error ? (
                  <div className="flex justify-center items-center py-8">
                    <p className="text-destructive">{error}</p>
                  </div>
                ) : recentPrescriptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No prescriptions available</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first prescription to get started
                    </p>
                    <Link to="/doctor/create-prescription">
                      <Button className="btn-gradient-primary">
                        <Plus className="mr-2 w-4 h-4" /> Create Prescription
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentPrescriptions.map((rx) => {
                      const currentStatus = getPrescriptionStatus(rx);
                      const badgeStyle = getBadgeVariant(currentStatus);
                      
                      return (
                        <div key={rx.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">#{rx.prescription_code || rx.id}</p>
                              <Badge 
                                variant={badgeStyle.variant} 
                                className={badgeStyle.className}
                              >
                                {currentStatus}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Patient: {rx.patient_name}</p>
                            <p className="text-sm font-medium">{rx.drug_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Dosage: {rx.dosage_amount ?? "-"} {rx.dosage_unit ?? ""} | 
                              Frequency: {rx.frequency || "-"} | 
                              Duration: {rx.duration ?? "-"} days
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Issued: {formatDate(rx.issue_date)} | 
                              Valid Until: {formatDate(rx.valid_until)}
                            </p>
                            {rx.instructions && (
                              <p className="text-xs text-muted-foreground">
                                Instructions: {rx.instructions}
                              </p>
                            )}
                            {/* QR code image removed */}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {recentPrescriptions.length > 0 && (
                  <div className="mt-6">
                    <Link to="/doctor/prescriptions">
                      <Button variant="outline" className="w-full">
                        View All Prescriptions
                      </Button>
                    </Link>
                  </div>
                )}
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
                  <Button className="w-full btn-gradient-primary flex items-center justify-center">
                    <FileText className="mr-2 w-4 h-4" /> Create Prescription
                  </Button>
                </Link>
                <Link to="/doctor/prescriptions">
                  <Button variant="outline" className="w-full flex items-center justify-center">
                    <Clock className="mr-2 w-4 h-4" /> View My Prescriptions
                  </Button>
                </Link>
                <Link to="/doctor/analytics">
                  <Button variant="outline" className="w-full flex items-center justify-center">
                    <Activity className="mr-2 w-4 h-4" /> View Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Blockchain Sync</p>
                    <p className="text-xs text-muted-foreground">Prescriptions pending blockchain confirmation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-success/10 border border-success/20">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">System Status</p>
                    <p className="text-xs text-muted-foreground">All systems operational</p>
                  </div>
                </div>
                
                {/* Dynamic alerts based on actual data */}
                {stats.total_prescriptions === 0 && (
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Get Started</p>
                      <p className="text-xs text-blue-600">Create your first prescription to begin</p>
                    </div>
                  </div>
                )}
                
                {recentPrescriptions.some(rx => getPrescriptionStatus(rx) === 'Expired') && (
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Expired Prescriptions</p>
                      <p className="text-xs text-orange-600">Some prescriptions have expired</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;