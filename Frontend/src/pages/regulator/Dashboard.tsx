import DashboardLayout from '@/components/layout/DashboardLayout';
import { Shield, FileText, AlertTriangle, CheckCircle, Activity, BarChart3, TrendingUp, Users, Building, Eye, Search, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';

const RegulatorDashboard = () => {
  const sidebarItems = [
        { icon: Shield, label: 'Dashboard', path: '/regulator/dashboard', active: true },
        { icon: Search, label: 'Audits', path: '/regulator/audits', active: false },
        { icon: FileText, label: 'Traceability', path: '/regulator/traceability', active: false },
        { icon: AlertTriangle, label: 'Blockchain', path: '/regulator/blockchain', active: false },
        { icon: Activity, label: 'Analytics', path: '/regulator/analytics', active: false },
      ];
  

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ...existing code...

  useEffect(() => {
    setLoading(true);
    const API_BASE = 'http://localhost:4000';
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    console.log('[RegulatorDashboard] Fetching /api/regulator/dashboard');
    fetch(`${API_BASE}/api/regulator/dashboard`, { headers })
      .then(async (res) => {
        if (!res.ok) {
          // Try to read text for HTML error page
          const text = await res.text();
          if (text.startsWith('<!doctype') || text.startsWith('<html')) {
            throw new Error('Server returned an HTML error page. Check API endpoint and backend logs.');
          }
          throw new Error("Failed to fetch dashboard data");
        }
        // Try to parse JSON, catch HTML masquerading as JSON
        try {
          return await res.json();
        } catch (e) {
          throw new Error('Response is not valid JSON. Check API endpoint and backend.');
        }
      })
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="regulator" userName="Dr. Jane Regulator" userEmail="jane@ppb.go.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
            Regulator Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor compliance, conduct audits, and ensure pharmaceutical safety standards</p>
        </div>
        {/* Regulatory Stats - Loading/Error/Data */}
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading dashboard...</div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">{error}</div>
        ) : dashboardData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
                  <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">{dashboardData.prescriptions ?? '-'}</div>
                  <p className="text-xs text-red-600 dark:text-red-400">Total prescriptions</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Drug Batches</CardTitle>
                  <CheckSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{dashboardData.batches ?? '-'}</div>
                  <p className="text-xs text-green-600 dark:text-green-400">Total batches</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Shipments</CardTitle>
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{dashboardData.shipments ?? '-'}</div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Total shipments</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Audits</CardTitle>
                  <Eye className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{dashboardData.audits ?? '-'}</div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Total audits</p>
                </CardContent>
              </Card>
            </div>

            {/* Overview of Prescriptions and Delayed Shipments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Overview of Prescriptions</CardTitle>
                  <CardDescription>Issued, dispensed, or expired</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardData.suspiciousPrescriptions && dashboardData.suspiciousPrescriptions.length > 0 ? (
                    dashboardData.suspiciousPrescriptions.map((presc, idx) => (
                      <div key={presc.id || idx} className="space-y-1 p-2 rounded bg-muted/30">
                        <div className="flex justify-between text-sm">
                          <span>Code: {presc.prescription_code}</span>
                          <span>Status: {presc.status}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Drug ID: {presc.drug_id} | Patient ID: {presc.patient_id}</div>
                        <div className="text-xs text-muted-foreground">Issued: {presc.issue_date}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">No prescriptions found.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Delayed Shipments</CardTitle>
                  <CardDescription>Failed or flagged shipments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardData.delayedShipments && dashboardData.delayedShipments.filter(
                    ship => ship.status === 'failed' || ship.status === 'flagged' || (ship.arrival_date < new Date().toISOString() && ship.status !== 'delivered' && ship.status !== 'completed')
                  ).length > 0 ? (
                    dashboardData.delayedShipments.filter(
                      ship => ship.status === 'failed' || ship.status === 'flagged' || (ship.arrival_date < new Date().toISOString() && ship.status !== 'delivered' && ship.status !== 'completed')
                    ).map((ship, idx) => (
                      <div key={ship.id || idx} className="space-y-1 p-2 rounded bg-muted/30">
                        <div className="flex justify-between text-sm">
                          <span>Shipment #: {ship.shipmentnumber}</span>
                          <span>Status: {ship.status}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Route: {ship.route}</div>
                        <div className="text-xs text-muted-foreground">Arrival: {ship.arrival_date}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">No delayed shipments found.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Compliance Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Rate</CardTitle>
                <CardDescription>Overall system compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={dashboardData.complianceRate ?? 0} className="h-2" />
                <div className="text-xs text-muted-foreground mt-2">
                  {dashboardData.complianceRate ?? '-'}% compliance rate
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Regulatory Operations</CardTitle>
                <CardDescription>Quick access to regulatory functions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="h-20 flex-col gap-2" variant="outline">
                    <FileText className="h-6 w-6" />
                    Schedule Audit
                  </Button>
                  <Button className="h-20 flex-col gap-2" variant="outline">
                    <AlertTriangle className="h-6 w-6" />
                    Review Alerts
                  </Button>
                  <Button className="h-20 flex-col gap-2" variant="outline">
                    <CheckCircle className="h-6 w-6" />
                    Compliance Report
                  </Button>
                  <Button className="h-20 flex-col gap-2" variant="outline">
                    <Shield className="h-6 w-6" />
                    License Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default RegulatorDashboard;