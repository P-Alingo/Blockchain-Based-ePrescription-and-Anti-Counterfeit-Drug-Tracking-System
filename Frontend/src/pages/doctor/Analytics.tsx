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
import { Activity, BarChart2, PieChart, Users, FileText, Clock, Shield } from 'lucide-react';

// Define AnalyticsData type
type AnalyticsData = {
  statCards?: {
    total_prescriptions?: number;
    last_30_days?: number;
    unique_patients?: number;
    avg_per_week?: number;
    avg_per_month?: number;
  };
  monthlyTrends?: Array<{ month: string; count: number }>;
  statusBreakdown?: Array<{ status: string; count: number }>;
  topDrugs?: Array<{ drug_name: string; count: number }>;
  patientTrends?: Array<{ month: string; count: number }>;
  lastActivity?: {
    prescriptionNo: string;
    drug: string;
    date: string;
  };
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
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
      // Ensure navigation to /doctor/analytics
      if (location.pathname !== "/doctor/analytics") {
        navigate("/doctor/analytics", { replace: true });
      }
    } catch {
      navigate("/login");
    }
  }, [navigate, location.pathname]);

  const userName = userData?.fullName || "Doctor";
  const userEmail = userData?.email || "";
  const userRole = userData?.role || "doctor";

  // ✅ FIXED: Use the correct API endpoint based on user role
  useEffect(() => {
    if (!token) return;
    
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Determine the correct API endpoint based on user role
        const apiUrl = userRole === 'patient' 
          ? "http://localhost:4000/api/patient/analytics"
          : "http://localhost:4000/api/doctor/analytics";
        
        console.log(`Fetching analytics from: ${apiUrl} for role: ${userRole}`);
        
        const res = await axios.get<AnalyticsData>(
          apiUrl,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setData(res.data);
        
        // Create activity logs from prescription data
        if (res.data.lastActivity) {
          setActivityLogs([
            {
              action: "QR Code Viewed",
              prescription: res.data.lastActivity.prescriptionNo,
              timestamp: new Date().toLocaleString(),
              details: `Viewed QR code for ${res.data.lastActivity.drug} prescription`,
            },
            {
              action: "Prescription Status Update", 
              prescription: res.data.lastActivity.prescriptionNo,
              timestamp: new Date(res.data.lastActivity.date).toLocaleString(),
              details: `One prescription has expired among the active prescriptions`,
            }
          ]);
        } else {
          // Default activity logs if no lastActivity
          setActivityLogs([
            {
              action: "Analytics Viewed",
              prescription: "N/A",
              timestamp: new Date().toLocaleString(),
              details: `Viewed ${userRole} analytics dashboard`,
            }
          ]);
        }
      } catch (err: any) {
        console.error("Analytics fetch error:", err);
        setError(err?.response?.data?.message || "Failed to load analytics. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [token, userRole]);

  // Define sidebar items based on user role
  const getSidebarItems = () => {
    if (userRole === 'patient') {
      return [
        { icon: Shield, label: "Dashboard", path: "/patient/dashboard", active: location.pathname === "/patient/dashboard" },
        { icon: FileText, label: "My Prescriptions", path: "/patient/prescriptions", active: location.pathname === "/patient/prescriptions" },
        { icon: Activity, label: "Analytics", path: "/patient/analytics", active: location.pathname === "/patient/analytics" },
      ];
    } else {
      return [
        { icon: Shield, label: "Dashboard", path: "/doctor/dashboard", active: location.pathname === "/doctor/dashboard" },
        { icon: FileText, label: "Create Prescription", path: "/doctor/create-prescription", active: location.pathname === "/doctor/create-prescription" },
        { icon: Clock, label: "My Prescriptions", path: "/doctor/prescriptions", active: location.pathname === "/doctor/prescriptions" },
        { icon: Activity, label: "Analytics", path: "/doctor/analytics", active: location.pathname === "/doctor/analytics" },
      ];
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        sidebarItems={getSidebarItems()}
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
        sidebarItems={getSidebarItems()}
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
        sidebarItems={getSidebarItems()}
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

  // Stat cards (provide defaults to avoid undefined errors)
  const {
    statCards = {},
    monthlyTrends = [],
    statusBreakdown = [],
    topDrugs = [],
    patientTrends = [],
  } = data;

  // Chart data with fallbacks
  const lineData = {
    labels: monthlyTrends.map((m: any) => m.month).reverse() || ['No Data'],
    datasets: [
      {
        label: "Prescriptions Issued",
        data: monthlyTrends.map((m: any) => m.count).reverse() || [0],
        borderColor: "#166534",
        backgroundColor: "rgba(22,101,52,0.1)",
        fill: true,
      },
    ],
  };

  const pieData = {
    labels: statusBreakdown.map((s: any) => s.status) || ['No Data'],
    datasets: [
      {
        data: statusBreakdown.map((s: any) => s.count) || [1],
        backgroundColor: ["#166534", "#2563eb", "#f59e42", "#e11d48"],
      },
    ],
  };

  const barData = {
    labels: topDrugs.map((d: any) => d.drug_name) || ['No Data'],
    datasets: [
      {
        label: "Most Prescribed Drugs",
        data: topDrugs.map((d: any) => d.count) || [0],
        backgroundColor: "#2563eb",
      },
    ],
  };

  const patientLineData = {
    labels: patientTrends.map((m: any) => m.month).reverse() || ['No Data'],
    datasets: [
      {
        label: "Unique Patients",
        data: patientTrends.map((m: any) => m.count).reverse() || [0],
        borderColor: "#e11d48",
        backgroundColor: "rgba(225,29,72,0.1)",
        fill: true,
      },
    ],
  };

  return (
    <DashboardLayout
      sidebarItems={getSidebarItems()}
      userRole={userRole}
      userName={userName}
      userEmail={userEmail}
    >
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-blue-600">
            {userRole === 'doctor' ? 'Doctor' : 'Patient'} Analytics
          </h1>
          <Badge className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-semibold">
            Updated {new Date().toLocaleDateString()}
          </Badge>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="card-elevated">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="text-2xl font-bold text-green-700">{statCards.total_prescriptions ?? 0}</div>
              <div className="text-gray-600">Total Prescriptions</div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="text-2xl font-bold text-blue-700">{statCards.last_30_days ?? 0}</div>
              <div className="text-gray-600">Last 30 Days</div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="text-2xl font-bold text-pink-700">{statCards.unique_patients ?? 0}</div>
              <div className="text-gray-600">Unique Patients</div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="text-2xl font-bold text-blue-700">{statCards.avg_per_week ?? 0}</div>
              <div className="text-gray-600">Avg Prescriptions/Week</div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="text-2xl font-bold text-pink-700">{statCards.avg_per_month ?? 0}</div>
              <div className="text-gray-600">Avg Prescriptions/Month</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-green-700" /> 
                Monthly Prescription Trends
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
                Prescription Status Breakdown
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
                Top Prescribed Drugs
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
                <Users className="w-5 h-5 text-pink-700" /> 
                Unique Patients per Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Line 
                data={patientLineData} 
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
      </div>
    </DashboardLayout>
  );
}

// Add missing Button import
import { Button } from '@/components/ui/button';