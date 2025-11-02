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

const API_URL = "/api/doctor/analytics";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [userData, setUserData] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
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

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err?.response?.data?.message || "Failed to fetch analytics");
        setLoading(false);
      });
  }, [token]);

  // Define sidebar items with correct active states
  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/doctor/dashboard", active: location.pathname === "/doctor/dashboard" },
    { icon: FileText, label: "Create Prescription", path: "/doctor/create-prescription", active: location.pathname === "/doctor/create-prescription" },
    { icon: Clock, label: "My Prescriptions", path: "/doctor/prescriptions", active: location.pathname === "/doctor/prescriptions" },
    { icon: Activity, label: "Analytics", path: "/doctor/analytics", active: location.pathname === "/doctor/analytics" },
  ];

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!data) return null;

  // Stat cards (provide defaults to avoid undefined errors)
  const {
    statCards = {},
    monthlyTrends = [],
    statusBreakdown = [],
    topDrugs = [],
    patientTrends = [],
  } = data || {};

  // Chart data
  const lineData = {
    labels: monthlyTrends.map((m: any) => m.month).reverse(),
    datasets: [
      {
        label: "Prescriptions Issued",
        data: monthlyTrends.map((m: any) => m.count).reverse(),
        borderColor: "#166534",
        backgroundColor: "rgba(22,101,52,0.1)",
        fill: true,
      },
    ],
  };

  const pieData = {
    labels: statusBreakdown.map((s: any) => s.status),
    datasets: [
      {
        data: statusBreakdown.map((s: any) => s.count),
        backgroundColor: ["#166534", "#2563eb", "#f59e42", "#e11d48"],
      },
    ],
  };

  const barData = {
    labels: topDrugs.map((d: any) => d.drug_name),
    datasets: [
      {
        label: "Most Prescribed Drugs",
        data: topDrugs.map((d: any) => d.count),
        backgroundColor: "#2563eb",
      },
    ],
  };

  const patientLineData = {
    labels: patientTrends.map((m: any) => m.month).reverse(),
    datasets: [
      {
        label: "Unique Patients",
        data: patientTrends.map((m: any) => m.count).reverse(),
        borderColor: "#e11d48",
        backgroundColor: "rgba(225,29,72,0.1)",
        fill: true,
      },
    ],
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="doctor"
      userName={userName}
      userEmail={userEmail}
    >
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-blue-600">Doctor Analytics</h1>
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