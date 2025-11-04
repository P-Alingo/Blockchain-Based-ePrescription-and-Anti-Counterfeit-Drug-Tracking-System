import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, Filter, Download, Package2, Beaker, Shield, Settings, Package, Plus, List, Truck } from "lucide-react";
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const ManufacturerActivityLogs = () => {
   const sidebarItems = [
    { icon: Package, label: "Dashboard", path: "/manufacturer/dashboard", active: false },
    { icon: Plus, label: "Register Batch", path: "/manufacturer/register-batch", active: false },
    { icon: List, label: "Batches", path: "/manufacturer/batches", active: false },
    { icon: Shield, label: "Blockchain", path: "/manufacturer/blockchain", active: false},
    { icon: Activity, label: "Analytics", path: "/manufacturer/analytics", active: true},
    { icon: Truck, label: "Shipments", path: "/manufacturer/shipments", active: false},
  ];
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Define the analytics data type
  type AnalyticsData = {
    batchesByMonth: { month: string; count: number }[];
    shipmentStatus: { status: string; count: number }[];
    expiringSoon: { batchnumber: string; expirydate: string }[];
    topDrugs: { name: string; count: number }[];
    geoReach: { facility_location: string; count: number }[];
    blockchainPerf: { verified: boolean; count: number }[];
  };

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["manufacturer-analytics"],
    queryFn: async (): Promise<AnalyticsData> => {
      const res = await axios.get<AnalyticsData>("/api/manufacturer/analytics");
      return res.data;
    }
  });
 

  // Chart Data
  const batchesByMonth = analytics?.batchesByMonth || [];
  const shipmentStatus = analytics?.shipmentStatus || [];
  const expiringSoon = analytics?.expiringSoon || [];
  const topDrugs = analytics?.topDrugs || [];
  const geoReach = analytics?.geoReach || [];
  const blockchainPerf = analytics?.blockchainPerf || [];

  // ChartJS data
  const lineData = {
    labels: batchesByMonth.map(b => b.month?.slice(0, 7)),
    datasets: [{
      label: 'Batches Created',
      data: batchesByMonth.map(b => b.count),
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      fill: true,
    }]
  };
  const pieData = {
    labels: shipmentStatus.map(s => s.status),
    datasets: [{
      data: shipmentStatus.map(s => s.count),
      backgroundColor: ['#36A2EB', '#FFCE56', '#4BC0C0', '#FF6384'],
    }]
  };
  const expiringBarData = {
    labels: expiringSoon.map(e => e.batchnumber),
    datasets: [{
      label: 'Expiring Soon',
      data: expiringSoon.map(e => new Date(e.expirydate)),
      backgroundColor: '#FF6384',
    }]
  };
  const topDrugsBarData = {
    labels: topDrugs.map(d => d.name),
    datasets: [{
      label: 'Top Drugs Produced',
      data: topDrugs.map(d => d.count),
      backgroundColor: '#36A2EB',
    }]
  };
  const geoBarData = {
    labels: geoReach.map(g => g.facility_location),
    datasets: [{
      label: 'Deliveries',
      data: geoReach.map(g => g.count),
      backgroundColor: '#4BC0C0',
    }]
  };
  const blockchainPieData = {
    labels: blockchainPerf.map(b => b.verified ? 'Success' : 'Pending'),
    datasets: [{
      data: blockchainPerf.map(b => b.count),
      backgroundColor: ['#36A2EB', '#FF6384'],
    }]
  };

  const getActionIcon = (category) => {
    switch (category) {
      case "Manufacturing":
        return <Package2 className="h-4 w-4 text-blue-600" />;
      case "Quality Control":
        return <Beaker className="h-4 w-4 text-purple-600" />;
      case "Blockchain":
        return <Shield className="h-4 w-4 text-green-600" />;
      case "Equipment":
        return <Settings className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
      case "Success":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">{status}</Badge>;
      case "Failed":
        return <Badge variant="destructive">{status}</Badge>;
      case "Pending":
        return <Badge className="bg-orange-100 text-orange-800">{status}</Badge>;
      case "In Progress":
        return <Badge className="bg-blue-100 text-blue-800">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Removed filteredLogs and activityLogs, now only using analytics data from API

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="manufacturer" userName="Sarah Manufacturer" userEmail="sarah@pharmaceutical.co.ke">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Manufacturer Analytics</h1>
        <p className="text-muted-foreground">Visual insight into manufacturing performance, shipment trends, and blockchain health.</p>
      </div>

      {isLoading ? <div>Loading analytics...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Batches Created Over Time</CardTitle>
              <CardDescription>Monthly batch creation trend</CardDescription>
            </CardHeader>
            <CardContent>
              <Line data={lineData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Shipment Status Breakdown</CardTitle>
              <CardDescription>Current shipment status</CardDescription>
            </CardHeader>
            <CardContent>
              <Pie data={pieData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Expiring Soon</CardTitle>
              <CardDescription>Batches expiring in next 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              <Bar data={expiringBarData} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Expiry Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringSoon.map(e => (
                    <TableRow key={e.batchnumber}>
                      <TableCell>{e.batchnumber}</TableCell>
                      <TableCell>{e.expirydate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top Drugs Produced</CardTitle>
              <CardDescription>Most produced drugs</CardDescription>
            </CardHeader>
            <CardContent>
              <Bar data={topDrugsBarData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Geographic Reach</CardTitle>
              <CardDescription>Distribution by location</CardDescription>
            </CardHeader>
            <CardContent>
              <Bar data={geoBarData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Performance</CardTitle>
              <CardDescription>Success vs Pending transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Pie data={blockchainPieData} />
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManufacturerActivityLogs;