import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings, Users, Cog, FileText, Activity, TrendingUp, Server, Database, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const sidebarItems = [
       { icon: Settings, label: 'Dashboard', path: '/admin/dashboard', active: true },
       { icon: Users, label: 'User Management', path: '/admin/users', active: false },
       { icon: Cog, label: 'System Logs', path: '/admin/system-logs', active: false },
       { icon: FileText, label: 'Blockchain', path: '/admin/blockchain', active: false },
       { icon: Activity, label: 'Analytics', path: '/admin/analytics', active: false },
     ];

  const [analyticsStats, setAnalyticsStats] = useState({
    usersByRole: [],
    activePrescriptions: 0,
    totalShipments: 0,
    flaggedShipments: 0,
    failedShipments: 0,
    counterfeitDrugs: 0
  });
  const [recentBlockchainTx, setRecentBlockchainTx] = useState([]);
  const [drugDistribution, setDrugDistribution] = useState([]);
  const [prescriptionTrend, setPrescriptionTrend] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState({
    pendingApprovals: [],
    flaggedDrugs: [],
    failedShipments: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setLoading(true);
    const API_BASE = 'http://localhost:4000';
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
      console.log('[AdminDashboard] Fetching /api/admin/analytics');
      fetch(`${API_BASE}/api/admin/analytics`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((data) => {
        console.log('[AdminDashboard] API response:', data);
        setAnalyticsStats(data.stats || {});
        setRecentBlockchainTx(data.recentBlockchainTx || []);
        setDrugDistribution(data.drugDistribution || []);
        setPrescriptionTrend(data.prescriptionTrend || []);
        setRecentActivity(data.recentActivity || []);
        setAlerts(data.alerts || { pendingApprovals: [], flaggedDrugs: [], failedShipments: [] });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="admin" userName="System Admin" userEmail="admin@eprescribe.go.ke">
      <div className="space-y-10">
        {/* Header (Unified Aesthetic) */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">System Analytics Control Center</h1>
            <p className="text-muted-foreground">Overview of operations and key metrics across all stakeholders</p>
          </div>
        </div>

        {/* User Roles Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          {(analyticsStats.usersByRole ?? []).map((role) => (
            <Card key={role.role} className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 shadow text-blue-900">
              <span className="font-semibold text-base capitalize mb-1">{role.role} Users</span>
              <span className="text-2xl font-bold">{(role.count ?? 0).toLocaleString()}</span>
            </Card>
          ))}
        </div>

        {/* KPIs Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="dashboard-card shadow-lg rounded-xl bg-gradient-to-br from-white to-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-green-700">Issued Prescriptions</p>
                  <p className="text-3xl font-extrabold mt-2 text-gray-900">{(analyticsStats.activePrescriptions ?? 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card shadow-lg rounded-xl bg-gradient-to-br from-white to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-orange-700">Total Shipments</p>
                  <p className="text-3xl font-extrabold mt-2 text-gray-900">{(analyticsStats.totalShipments ?? 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Settings className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card shadow-lg rounded-xl bg-gradient-to-br from-white to-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-red-700">Flagged Shipments</p>
                  <p className="text-3xl font-extrabold mt-2 text-gray-900">{(analyticsStats.flaggedShipments ?? 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <Activity className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card shadow-lg rounded-xl bg-gradient-to-br from-white to-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-gray-700">Counterfeit Drugs</p>
                  <p className="text-3xl font-extrabold mt-2 text-gray-900">{(analyticsStats.counterfeitDrugs ?? 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-full">
                  <Shield className="w-8 h-8 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="healthcare-card shadow rounded-xl bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="flex items-center gap-2 mb-2">
              <Server className="w-6 h-6 text-blue-700" />
              <CardTitle>Drug Distribution by Region/Facility</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(drugDistribution ?? []).map((dist, idx) => (
                  <li key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span className="font-medium text-gray-700">{dist.location} - {dist.drug_name}</span>
                    <span className="font-bold text-blue-700 text-lg">{(dist.total_quantity ?? 0).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="healthcare-card shadow rounded-xl bg-gradient-to-br from-white to-green-50">
            <CardHeader className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-6 h-6 text-green-700" />
              <CardTitle>Prescription Volume Trend (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(prescriptionTrend ?? []).map((trend, idx) => (
                  <li key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span className="font-medium text-gray-700">{new Date(trend.day).toLocaleDateString()}</span>
                    <span className="font-bold text-green-700 text-lg">{(trend.count ?? 0).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recent Blockchain Transactions & Activity Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="healthcare-card shadow rounded-xl bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="flex items-center gap-2 mb-2">
              <Database className="w-6 h-6 text-purple-700" />
              <CardTitle>Recent Blockchain Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <ul className="space-y-2">
                  {(recentBlockchainTx ?? []).map((tx) => (
                    <li key={tx.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="font-medium text-gray-700">{tx.eventname} <span className="text-xs text-gray-500">({tx.contractname})</span></span>
                      <span className="font-mono text-xs text-purple-700">{tx.transactionhash}</span>
                      <span className="text-sm text-gray-500">{new Date(tx.timestamp).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
          <Card className="healthcare-card shadow rounded-xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="flex items-center gap-2 mb-2">
              <Activity className="w-6 h-6 text-gray-700" />
              <CardTitle>Recent Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <ul className="space-y-2">
                  {(recentActivity ?? []).map((act) => (
                    <li key={act.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="font-medium text-gray-700">{act.user || 'System'}: {act.action_type} {act.entity_type} #{act.entity_id}</span>
                      <span className="text-sm text-gray-500">{new Date(act.timestamp).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Panel */}
        <Card className="healthcare-card shadow rounded-xl bg-gradient-to-br from-white to-yellow-50 mb-8">
          <CardHeader className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-yellow-700" />
            <CardTitle>Alerts Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-yellow-700 flex items-center gap-2"><Badge className="bg-yellow-100 text-yellow-700">Pending Requests</Badge></h3>
                <ul className="space-y-1">
                  {(alerts.pendingApprovals ?? []).map((req) => (
                    <li key={req.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="font-medium">Batch #{req.batch_id} requested by Pharmacist #{req.pharmacist_id}</span>
                      <span className="text-sm text-gray-500">{new Date(req.request_date).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-red-700 flex items-center gap-2"><Badge className="bg-red-100 text-red-700">Flagged Drugs</Badge></h3>
                <ul className="space-y-1">
                  {(alerts.flaggedDrugs ?? []).map((drug) => (
                    <li key={drug.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="font-medium">{drug.drug_name} (Shipment #{drug.shipmentnumber})</span>
                      <span className="text-sm text-gray-500">Shipped: {new Date(drug.departure_date).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-orange-700 flex items-center gap-2"><Badge className="bg-orange-100 text-orange-700">Failed Shipments</Badge></h3>
                <ul className="space-y-1">
                  {(alerts.failedShipments ?? []).map((ship) => (
                    <li key={ship.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="font-medium">Shipment #{ship.shipmentnumber} ({ship.drug_name})</span>
                      <span className="text-sm text-gray-500">{new Date(ship.departure_date).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;