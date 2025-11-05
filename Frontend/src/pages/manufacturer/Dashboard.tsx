
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Package, Plus, List, Shield, Activity, TrendingUp, Factory, CheckCircle2, AlertCircle, Truck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const API_URL = 'http://localhost:4000/api/manufacturer/dashboard';

const ManufacturerDashboard = () => {
  const sidebarItems = [
    { icon: Package, label: "Dashboard", path: "/manufacturer/dashboard", active: true },
    { icon: Plus, label: "Register Batch", path: "/manufacturer/register-batch", active: false},
    { icon: List, label: "Batches", path: "/manufacturer/batches", active: false },
    { icon: Shield, label: "Blockchain", path: "/manufacturer/blockchain", active: false},
    { icon: Activity, label: "Analytics", path: "/manufacturer/analytics", active: false},
    { icon: Truck, label: "Shipments", path: "/manufacturer/shipments", active: false},
  ];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    const fetchDashboard = () => {
      axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setDashboard(res.data);
          setLoading(false);
        })
        .catch(err => {
          setError(err?.response?.data?.message || 'Failed to fetch dashboard');
          setLoading(false);
        });
    };
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <DashboardLayout sidebarItems={sidebarItems} userRole="manufacturer" userName="Loading..." userEmail=""><div className="p-8 text-center">Loading dashboard...</div></DashboardLayout>;
  if (error) return <DashboardLayout sidebarItems={sidebarItems} userRole="manufacturer" userName="Error" userEmail=""><div className="p-8 text-center text-red-600">{error}</div></DashboardLayout>;
  if (!dashboard) return null;

  const { summary, recentBatches, recentShipments, blockchainSnapshot } = dashboard;

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="manufacturer" userName="Sarah Manufacturer" userEmail="sarah@pharmaceutical.co.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Manufacturing Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor production, manage batches, and ensure drug authenticity</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Batches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{summary?.totalBatches ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{summary?.activeShipments ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Delivered Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{summary?.deliveredShipments ?? 0}</div>
            </CardContent>
          </Card>
          {/* Pending Quality Checks card removed as requested */}
        </div>

        {/* Recent Batches Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Batches</CardTitle>
            <CardDescription>Last 5 batch records</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="p-2">Batch No</th>
                  <th className="p-2">Drug</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Expiry</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Blockchain Tx</th>
                </tr>
              </thead>
              <tbody>
                {recentBatches?.length > 0 ? recentBatches.map((b: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{b.batchnumber}</td>
                    <td className="p-2">{b.drug}</td>
                    <td className="p-2">{b.quantity}</td>
                    <td className="p-2">{b.expirydate?.slice(0,10)}</td>
                    <td className="p-2">{b.status}</td>
                    <td className="p-2">{b.blockchaintx ? <span className="text-green-700">✔</span> : <span className="text-gray-400">-</span>}</td>
                  </tr>
                )) : <tr><td colSpan={6} className="p-2 text-center text-muted-foreground">No recent batches</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Recent Shipments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Shipments</CardTitle>
            <CardDescription>Last 5 shipment records</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="p-2">Shipment No</th>
                  <th className="p-2">Batch No</th>
                  <th className="p-2">Distributor</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Departure Date</th>
                </tr>
              </thead>
              <tbody>
                {recentShipments?.length > 0 ? recentShipments.map((s: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{s.shipmentnumber}</td>
                    <td className="p-2">{s.batchnumber}</td>
                    <td className="p-2">{s.distributor}</td>
                    <td className="p-2">{s.status}</td>
                    <td className="p-2">{s.departure_date?.slice(0,10)}</td>
                  </tr>
                )) : <tr><td colSpan={5} className="p-2 text-center text-muted-foreground">No recent shipments</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Blockchain Snapshot Table */}
        <Card>
          <CardHeader>
            <CardTitle>Blockchain Snapshot</CardTitle>
            <CardDescription>Recent verified transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="p-2">Batch No</th>
                  <th className="p-2">Blockchain Tx</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {blockchainSnapshot?.length > 0 ? blockchainSnapshot.map((b: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{b.batchnumber}</td>
                    <td className="p-2">{b.blockchaintx}</td>
                    <td className="p-2">{b.status}</td>
                  </tr>
                )) : <tr><td colSpan={3} className="p-2 text-center text-muted-foreground">No blockchain records</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Manufacturing Operations</CardTitle>
            <CardDescription>Quick access to common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Plus className="h-6 w-6" />
                New Batch
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <List className="h-6 w-6" />
                View Batches
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Shield className="h-6 w-6" />
                Verify Quality
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Activity className="h-6 w-6" />
                Production Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManufacturerDashboard;