import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Scan, Shield, Package, Activity, TrendingUp, AlertTriangle, CheckCircle, Clock, PillBottle, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PharmacistDashboard = () => {
  const sidebarItems = [
  { icon: Shield, label: "Dashboard", path: "/pharmacist/dashboard", active: true },
  { icon: Activity, label: "Blockchain", path: "/pharmacist/blockchain", active: false },
  { icon: Activity, label: "Analytics", path: "/pharmacist/analytics", active: false },
  { icon: Package, label: "Inventory & Requests", path: "/pharmacist/inventory-requests", active: false },
  { icon: FileText, label: "My Prescriptions", path: "/pharmacist/myprescriptions", active: false },
  { icon: Package, label: "Shipments", path: "/pharmacist/shipments", active: false },
];

  const [stats, setStats] = useState({
    prescriptions: 0,
    inventory: 0,
    requests: 0,
    shipments: 0,
  });
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [inventoryStatus, setInventoryStatus] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(true);
  const [prescriptionsError, setPrescriptionsError] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const API_BASE = 'http://localhost:4000';
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Dashboard stats
      setDashboardLoading(true);
      setDashboardError(null);
      try {
        console.log('[Dashboard] Fetching /api/pharmacist/dashboard');
        const statsRes = await fetch(`${API_BASE}/api/pharmacist/dashboard`, { headers });
        console.log('[Dashboard] Response:', statsRes);
        if (!statsRes.ok) throw new Error('Failed to fetch dashboard stats');
        const statsData = await statsRes.json();
        console.log('[Dashboard] Data:', statsData);
        setStats(statsData);
      } catch (err) {
        console.error('[Dashboard] Error:', err);
        setDashboardError('Failed to fetch dashboard data');
      } finally {
        setDashboardLoading(false);
      }

      // Recent prescriptions
      setPrescriptionsLoading(true);
      setPrescriptionsError(null);
      try {
        console.log('[Dashboard] Fetching /api/pharmacist/prescriptions');
        const recentRes = await fetch(`${API_BASE}/api/pharmacist/prescriptions`, { headers });
        console.log('[Dashboard] Response:', recentRes);
        if (!recentRes.ok) throw new Error('Failed to fetch prescriptions');
        const recentData = await recentRes.json();
        console.log('[Dashboard] Data:', recentData);
        setRecentPrescriptions(recentData.slice(0, 5).map(p => ({
          id: p.id,
          patient: p.patientName,
          medication: p.drug,
          time: p.issueDate,
          status: p.status
        })));
      } catch (err) {
        console.error('[Dashboard] Error:', err);
        setPrescriptionsError('Failed to fetch prescriptions');
      } finally {
        setPrescriptionsLoading(false);
      }

      // Inventory status
      setInventoryLoading(true);
      setInventoryError(null);
      try {
        console.log('[Dashboard] Fetching /api/pharmacist/inventory');
        const invRes = await fetch(`${API_BASE}/api/pharmacist/inventory`, { headers });
        console.log('[Dashboard] Response:', invRes);
        if (!invRes.ok) throw new Error('Failed to fetch inventory');
        const invData = await invRes.json();
        console.log('[Dashboard] Data:', invData);
        setInventoryStatus(invData
          .filter(drug => {
            // Only show drugs where total available quantity > 0 for the logged-in pharmacist's facility
            const available = drug.batches.reduce((sum, b) => sum + (b.available_quantity || 0), 0);
            return available > 0;
          })
          .map(drug => ({
            id: drug.drug_id || drug.id,
            name: drug.drug_name || drug.name
          }))
        );
      } catch (err) {
        console.error('[Dashboard] Error:', err);
        setInventoryError('Failed to fetch inventory');
      } finally {
        setInventoryLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Pharmacist Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor prescriptions, verify authenticity, and manage inventory</p>
        </div>

        {/* Stats Cards - match backend fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
              <Scan className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.prescriptions}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Total dispensed</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
              <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.inventory}</div>
              <p className="text-xs text-green-600 dark:text-green-400">Stocked batches</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requests</CardTitle>
              <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.requests}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Batch requests</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipments</CardTitle>
              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.shipments}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Received shipments</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Prescriptions</CardTitle>
              <CardDescription>Latest prescription activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {prescriptionsLoading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : prescriptionsError ? (
                <div className="p-4 text-center text-red-500">{prescriptionsError}</div>
              ) : recentPrescriptions.length === 0 ? (
                <div className="p-4 text-center">No recent prescriptions</div>
              ) : (
                recentPrescriptions.map((prescription) => (
                  <div key={`prescription-${prescription.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{prescription.patient}</p>
                      <p className="text-xs text-muted-foreground">{prescription.medication}</p>
                      <p className="text-xs text-muted-foreground">{prescription.time}</p>
                    </div>
                    <Badge
                      variant={
                        prescription.status === 'verified' ? 'default' :
                        prescription.status === 'dispensed' ? 'secondary' : 'outline'
                      }
                    >
                      {prescription.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>Current stock levels</CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                {inventoryLoading ? (
                  <div className="p-4 text-center">Loading...</div>
                ) : inventoryError ? (
                  <div className="p-4 text-center text-red-500">{inventoryError}</div>
                ) : inventoryStatus.length === 0 ? (
                  <div className="p-4 text-center">No inventory data</div>
                ) : (
                  inventoryStatus.map((item) => (
                    <div
                      key={item.id ? `inventory-${item.id}` : `inventory-idx-${inventoryStatus.indexOf(item)}`}
                      className="rounded-lg border bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-4 shadow-sm flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PillBottle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="font-semibold text-base text-green-800 dark:text-green-200">{item.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          In Stock
                        </Badge>
                      </div>
                      {/* Show batch details if available */}
                      {item.batches && item.batches.length > 0 && (
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.batches.map((batch) => (
                            <div
                              key={batch.batch_id || batch.id}
                              className="flex flex-col border rounded-md p-2 bg-white dark:bg-gray-900"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Batch #{batch.batchnumber || batch.batch_id}</span>
                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                  Qty: {batch.available_quantity}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Exp: {batch.expirydate ? new Date(batch.expirydate).toLocaleDateString() : 'N/A'}</span>
                                {batch.available_quantity > 0 ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common pharmacy operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Scan className="h-6 w-6" />
                Scan QR Code
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Shield className="h-6 w-6" />
                Verify Prescription
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Package className="h-6 w-6" />
                Check Inventory
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Activity className="h-6 w-6" />
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PharmacistDashboard;