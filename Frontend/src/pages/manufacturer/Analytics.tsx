
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Tooltip, Legend, Filler);

import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, BarChart2, PieChart, Package2, Truck, CheckCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ManufacturerAnalyticsData = {
  summary?: {
    totalBatches?: number;
    totalShipments?: number;
    qualityPassRate?: number;
  };
  batchesByMonth?: Array<{ month: string; count: number }>;
  shipmentStatus?: Array<{ status: string; count: number }>;
  topDrugs?: Array<{ name: string; count: number }>;
  geoReach?: Array<{ facility_location: string; count: number }>;
  blockchainPerf?: Array<{ verified: boolean; count: number }>;
  expiringSoon?: Array<{ batchnumber: string; expirydate: string; drug_name?: string }>;
  lastActivity?: {
    batchNo: string;
    drug: string;
    date: string;
  };
};

export default function ManufacturerAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ManufacturerAnalyticsData | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

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
      if (location.pathname !== "/manufacturer/analytics") {
        navigate("/manufacturer/analytics", { replace: true });
      }
    } catch {
      navigate("/login");
    }
  }, [navigate, location.pathname]);

  const userName = userData?.fullName || "Manufacturer";
  const userEmail = userData?.email || "";
  const userRole = userData?.role || "manufacturer";

  useEffect(() => {
    if (!token) return;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        const apiUrl = "http://localhost:4000/api/manufacturer/analytics";
        const res = await axios.get<ManufacturerAnalyticsData>(
          apiUrl,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(res.data);
        // Example activity logs
        if (res.data.lastActivity) {
          setActivityLogs([
            {
              action: "Batch Updated",
              batchNo: res.data.lastActivity.batchNo,
              timestamp: new Date().toLocaleString(),
              details: `Updated batch for ${res.data.lastActivity.drug}`,
            },
            {
              action: "Batch Status Update", 
              batchNo: res.data.lastActivity.batchNo,
              timestamp: new Date(res.data.lastActivity.date).toLocaleString(),
              details: `Batch status changed recently`,
            }
          ]);
        } else {
          setActivityLogs([
            {
              action: "Analytics Viewed",
              batchNo: "N/A",
              timestamp: new Date().toLocaleString(),
              details: `Viewed manufacturer analytics dashboard`,
            }
          ]);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load analytics. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token]);

  // Sidebar items for manufacturer
  const sidebarItems = [
    { icon: Package2, label: "Dashboard", path: "/manufacturer/dashboard", active: location.pathname === "/manufacturer/dashboard" },
    { icon: Activity, label: "Register Batch", path: "/manufacturer/register-batch", active: location.pathname === "/manufacturer/register-batch" },
    { icon: Calendar, label: "Batches", path: "/manufacturer/batches", active: location.pathname === "/manufacturer/batches" },
    { icon: CheckCircle, label: "Blockchain", path: "/manufacturer/blockchain", active: location.pathname === "/manufacturer/blockchain" },
    { icon: BarChart2, label: "Analytics", path: "/manufacturer/analytics", active: location.pathname === "/manufacturer/analytics" },
    { icon: Truck, label: "Shipments", path: "/manufacturer/shipments", active: location.pathname === "/manufacturer/shipments" },
  ];

  if (loading) {
    return (
      <DashboardLayout
        sidebarItems={sidebarItems}
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
      >
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        sidebarItems={sidebarItems}
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
      >
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500 text-lg text-center">
            {error}
            <br />
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout
        sidebarItems={sidebarItems}
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
      >
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-center">
            No analytics data available.
            <br />
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Refresh
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Chart data with fallbacks
  const {
    summary = {},
    batchesByMonth = [],
    shipmentStatus = [],
    topDrugs = [],
    geoReach = [],
    blockchainPerf = [],
    expiringSoon = [],
  } = data;

  const lineData = {
    labels: batchesByMonth.map((m: any) => m.month).reverse() || ['No Data'],
    datasets: [
      {
        label: "Batches Produced",
        data: batchesByMonth.map((m: any) => m.count).reverse() || [0],
        borderColor: "#ea580c",
        backgroundColor: "rgba(234,88,12,0.1)",
        fill: true,
      },
    ],
  };

  const pieData = {
    labels: shipmentStatus.map((s: any) => s.status) || ['No Data'],
    datasets: [
      {
        data: shipmentStatus.map((s: any) => s.count) || [1],
        backgroundColor: ["#ea580c", "#2563eb", "#f59e42", "#e11d48"],
      },
    ],
  };

  const barData = {
    labels: topDrugs.map((d: any) => d.name) || ['No Data'],
    datasets: [
      {
        label: "Top Drugs Produced",
        data: topDrugs.map((d: any) => d.count) || [0],
        backgroundColor: "#2563eb",
      },
    ],
  };

  const geoBarData = {
    labels: geoReach.map((g: any) => g.facility_location) || ['No Data'],
    datasets: [
      {
        label: "Shipments by Location",
        data: geoReach.map((g: any) => g.count) || [0],
        backgroundColor: "#4BC0C0",
      },
    ],
  };

  const blockchainPieData = {
    labels: blockchainPerf.map((b: any) => b.verified ? 'Verified' : 'Pending'),
    datasets: [
      {
        data: blockchainPerf.map((b: any) => b.count) || [0],
        backgroundColor: ["#10B981", "#F59E0B"],
      },
    ],
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole={userRole}
      userName={userName}
      userEmail={userEmail}
    >
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-orange-600">
            Manufacturer Analytics
          </h1>
          <Badge className="bg-orange-100 text-orange-800 px-3 py-2 rounded-full text-sm font-semibold">
            Updated {new Date().toLocaleDateString()}
          </Badge>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="card-elevated">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="text-2xl font-bold text-orange-700">{summary.totalBatches ?? 0}</div>
              <div className="text-gray-600">Total Batches</div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="text-2xl font-bold text-blue-700">{summary.totalShipments ?? 0}</div>
              <div className="text-gray-600">Total Shipments</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-orange-700" /> 
                Monthly Batch Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Line 
                data={lineData} 
                options={{ 
                  responsive: true, 
                  plugins: { legend: { display: false } },
                  maintainAspectRatio: false
                }} 
                height={300}
              />
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-700" /> 
                Shipment Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Pie 
                data={pieData} 
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false
                }} 
                height={300}
              />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-700" /> 
                Top Drugs Produced
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Bar 
                data={barData} 
                options={{ 
                  responsive: true, 
                  plugins: { legend: { display: false } },
                  maintainAspectRatio: false
                }} 
                height={300}
              />
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-700" /> 
                Geographic Reach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Bar 
                data={geoBarData} 
                options={{ 
                  responsive: true, 
                  plugins: { legend: { display: false } },
                  maintainAspectRatio: false
                }} 
                height={300}
              />
            </CardContent>
          </Card>
        </div>

        {/* Blockchain Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-700" /> 
                Blockchain Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Pie 
                data={blockchainPieData} 
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false
                }} 
                height={300}
              />
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-700" /> 
                Batches Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringSoon.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="p-2">Batch No</th>
                      <th className="p-2">Drug</th>
                      <th className="p-2">Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringSoon.map((b: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{b.batchnumber}</td>
                        <td className="p-2">{b.drug_name || 'Unknown Drug'}</td>
                        <td className="p-2">{b.expirydate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No batches expiring soon
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}