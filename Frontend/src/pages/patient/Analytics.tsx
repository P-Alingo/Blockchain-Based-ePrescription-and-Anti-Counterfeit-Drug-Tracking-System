import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pie, Bar, Line, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
} from "chart.js";
import { FileText, QrCode, Pill, Activity, Shield } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale);

type AnalyticsData = {
  totalPrescriptions: number;
  statusBreakdown: {
    active: number;
    dispensed: number;
    expired: number;
  };
  avgPerMonth?: number;
  prescriptionsOverTime: Record<string, number>;
  doctorFrequency: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  topDrugs: { drug: string; count: number }[];
  lastActivity?: {
    prescriptionNo: string;
    date: string;
    drug: string;
  };
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const storedUserData = localStorage.getItem("userData");
        if (!storedUserData) {
          setError("User not logged in.");
          return;
        }
        const { token } = JSON.parse(storedUserData);
        // Fetch analytics
        const res = await axios.get<AnalyticsData>(
          "http://localhost:4000/api/patient/analytics",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAnalytics(res.data);
        // Fetch activity logs (stub: use analytics.lastActivity for now)
        // TODO: Replace with real activity logs endpoint if available
        if (res.data.lastActivity) {
          setActivityLogs([
            {
              action: "QR Code Viewed",
              prescription: `RX-${res.data.lastActivity.prescriptionNo}`,
              timestamp: new Date(res.data.lastActivity.date).toLocaleString(),
              details: `Viewed QR code for ${res.data.lastActivity.drug} prescription`,
            },
          ]);
        }
      } catch (err) {
        setError("Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Stat cards
  const statCards = analytics ? [
    { label: "Total Prescriptions", value: analytics.totalPrescriptions },
    { label: "Active", value: analytics.statusBreakdown.active },
    { label: "Dispensed", value: analytics.statusBreakdown.dispensed },
    { label: "Expired", value: analytics.statusBreakdown.expired },
    { label: "Avg/Month", value: analytics.avgPerMonth?.toFixed(2) },
  ] : [];

  // Pie chart for status breakdown
  const pieData = analytics ? {
    labels: ["Active", "Dispensed", "Expired"],
    datasets: [{
      data: [analytics.statusBreakdown.active, analytics.statusBreakdown.dispensed, analytics.statusBreakdown.expired],
      backgroundColor: ["#22c55e", "#3b82f6", "#ef4444"],
    }],
  } : null;

  // Line chart for prescriptions over time
  const lineData = analytics ? {
    labels: Object.keys(analytics.prescriptionsOverTime),
    datasets: [{
      label: "Prescriptions",
      data: Object.values(analytics.prescriptionsOverTime),
      borderColor: "#22c55e",
      backgroundColor: "rgba(34,197,94,0.2)",
      fill: true,
    }],
  } : null;

  // Bar chart for doctor frequency
  const barData = analytics ? {
    labels: Object.keys(analytics.doctorFrequency),
    datasets: [{
      label: "Prescriptions by Doctor",
      data: Object.values(analytics.doctorFrequency),
      backgroundColor: "#3b82f6",
    }],
  } : null;

  // Radar chart for drug category breakdown
  const radarData = analytics ? {
    labels: Object.keys(analytics.categoryBreakdown),
    datasets: [{
      label: "Drug Categories",
      data: Object.values(analytics.categoryBreakdown),
      backgroundColor: "rgba(139,92,246,0.2)",
      borderColor: "#8b5cf6",
    }],
  } : null;

  // Top drugs
  const topDrugs = analytics?.topDrugs || [];

  // Get userName and userEmail from localStorage or set default values
  const storedUserData = localStorage.getItem("userData");
  let userName = "Patient";
  let userEmail = "";
  if (storedUserData) {
    try {
      const userData = JSON.parse(storedUserData);
      userName = userData.fullName || userData.name || userData.username || userData.email || "Patient";
      userEmail = userData.email || "";
    } catch (e) {}
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "QR Code Viewed": return <QrCode className="w-4 h-4" />;
      case "Medication Taken": return <Pill className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout
      sidebarItems={[
        { icon: Shield, label: "Dashboard", path: "/patient/dashboard", active: false },
        { icon: FileText, label: "My Prescriptions", path: "/patient/prescriptions", active: false },
        { icon: QrCode, label: "QR Code Viewer", path: "/patient/qr-viewer", active: false },
        { icon: Activity, label: "Analytics", path: "/patient/analytics", active: true },
      ]}
      userRole="patient"
      userName={userName}
      userEmail={userEmail}
    >
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-green-600">Analytics</h1>
          <p className="text-muted-foreground">Visual summary of your prescription history and usage trends</p>
        </div>

        {loading ? (
          <div>Loading analytics...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {statCards.map((card) => (
                <Card key={card.label} className="text-center">
                  <CardHeader>
                    <CardTitle>{card.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold text-green-600">{card.value}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData && <Pie data={pieData} />}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Prescriptions Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {lineData && <Line data={lineData} />}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Doctor Frequency</CardTitle>
                </CardHeader>
                <CardContent>
                  {barData && <Bar data={barData} />}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Drug Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {radarData && <Radar data={radarData} />}
                </CardContent>
              </Card>
            </div>

            {/* Top Drugs */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Top Prescribed Drugs</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-6">
                  {topDrugs.length > 0 ? topDrugs.map((d) => (
                    <li key={d.drug}>
                      <span className="font-semibold">{d.drug}</span> <Badge variant="secondary">{d.count}</Badge>
                    </li>
                  )) : <li>No data</li>}
                </ul>
              </CardContent>
            </Card>

            {/* Recent Activity Logs */}
            <Card className="mt-8 card-elevated">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLogs.length > 0 ? activityLogs.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 rounded-lg border bg-muted/30">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        {getActionIcon(activity.action)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{activity.action}</h3>
                        <p className="text-sm text-muted-foreground">{activity.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  )) : <div>No recent activity found.</div>}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;