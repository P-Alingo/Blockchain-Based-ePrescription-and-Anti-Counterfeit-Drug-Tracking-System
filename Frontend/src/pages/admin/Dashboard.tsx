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

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((data) => {
        setAnalyticsStats(data.stats || {});
        setRecentBlockchainTx(data.recentBlockchainTx || []);
        setDrugDistribution(data.drugDistribution || []);
        setPrescriptionTrend(data.prescriptionTrend || []);
        setRecentActivity(data.recentActivity || []);
        setAlerts(data.alerts || { pendingApprovals: [], flaggedDrugs: [], failedShipments: [] });
      });
  }, []);

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="admin" userName="System Admin" userEmail="admin@eprescribe.go.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            System Analytics Control Center
          </h1>
          <p className="text-muted-foreground">Overview of operations and key metrics across all stakeholders</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="medical-grid">
          {analyticsStats.usersByRole.map((role) => (
            <Card key={role.role} className="dashboard-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{role.role} Users</p>
                    <p className="text-3xl font-bold mt-2">{role.count}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Prescriptions</p>
                  <p className="text-3xl font-bold mt-2">{analyticsStats.activePrescriptions}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Shipments</p>
                  <p className="text-3xl font-bold mt-2">{analyticsStats.totalShipments}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Settings className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Flagged Shipments</p>
                  <p className="text-3xl font-bold mt-2">{analyticsStats.flaggedShipments}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <Activity className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Counterfeit Drugs</p>
                  <p className="text-3xl font-bold mt-2">{analyticsStats.counterfeitDrugs}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-full">
                  <Shield className="w-8 h-8 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Overview Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle>Drug Distribution by Region/Facility</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {drugDistribution.map((dist, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{dist.location} - {dist.drug_name}</span>
                    <span className="font-bold">{dist.total_quantity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle>Prescription Volume Trend (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {prescriptionTrend.map((trend, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{trend.day}</span>
                    <span className="font-bold">{trend.count}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recent Blockchain Transactions */}
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle>Recent Blockchain Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentBlockchainTx.map((tx) => (
                <li key={tx.id} className="flex justify-between">
                  <span>{tx.eventname} ({tx.contractname})</span>
                  <span className="font-mono text-xs">{tx.transactionhash}</span>
                  <span>{new Date(tx.timestamp).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle>Recent Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentActivity.map((act) => (
                <li key={act.id} className="flex justify-between">
                  <span>{act.user || 'System'}: {act.action_type} {act.entity_type} #{act.entity_id}</span>
                  <span>{new Date(act.timestamp).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle>Alerts Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Pending Approvals</h3>
                <ul className="space-y-1">
                  {alerts.pendingApprovals.map((req) => (
                    <li key={req.id} className="flex justify-between text-yellow-700">
                      <span>Batch #{req.batch_id} requested by Pharmacist #{req.pharmacist_id}</span>
                      <span>{new Date(req.request_date).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Flagged Drugs</h3>
                <ul className="space-y-1">
                  {alerts.flaggedDrugs.map((drug) => (
                    <li key={drug.id} className="flex justify-between text-red-700">
                      <span>{drug.drug_name} (Batch #{drug.batchnumber})</span>
                      <span>Expires: {new Date(drug.expirydate).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Failed Shipments</h3>
                <ul className="space-y-1">
                  {alerts.failedShipments.map((ship) => (
                    <li key={ship.id} className="flex justify-between text-orange-700">
                      <span>Shipment #{ship.shipmentnumber} (Drug #{ship.drug_id})</span>
                      <span>{new Date(ship.departure_date).toLocaleString()}</span>
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