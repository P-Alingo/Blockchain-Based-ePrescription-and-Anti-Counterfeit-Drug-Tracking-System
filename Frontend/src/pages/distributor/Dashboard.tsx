import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Truck, Package, RotateCcw, FileText, List, Activity, TrendingUp, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const DistributorDashboard = () => {
    const sidebarItems = [
      { icon: Truck, label: 'Dashboard', path: '/distributor/dashboard', active: true },
      { icon: Package, label: 'Shipments', path: '/distributor/shipments', active: false },
      { icon: RotateCcw, label: 'Requests', path: '/distributor/requests', active: false },
      { icon: FileText, label: 'Blockchain', path: '/distributor/blockchain', active: false },
      { icon: Activity, label: 'Analytics', path: '/distributor/analytics', active: false },
    ];

  const [dashboardStats, setDashboardStats] = useState({
    shipmentsThisMonth: 0,
    avgDeliveryDays: 0,
    pendingRequests: 0
  });
  const [activeShipments, setActiveShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        // Fetch dashboard stats
        const statsRes = await fetch('http://localhost:4000/api/distributor/dashboard', { headers });
        if (!statsRes.ok) throw new Error('Failed to fetch dashboard stats');
        const stats = await statsRes.json();
        setDashboardStats(stats);
        // Fetch active shipments
        const shipmentsRes = await fetch('http://localhost:4000/api/distributor/shipments', { headers });
        if (!shipmentsRes.ok) throw new Error('Failed to fetch shipments');
        const shipmentsData = await shipmentsRes.json();
        setActiveShipments(Array.isArray(shipmentsData) ? shipmentsData : shipmentsData.shipments || []);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
      <div className="p-8 text-center">Loading dashboard...</div>
    </DashboardLayout>
  );
  if (error) return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
      <div className="p-8 text-center text-red-500">{error}</div>
    </DashboardLayout>
  );
  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
            Distribution Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor shipments, track deliveries, and ensure supply chain integrity</p>
        </div>

        {/* Logistics Stats - fetched from backend */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipments This Month</CardTitle>
              <Truck className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-700">{dashboardStats.shipmentsThisMonth}</div>
              <p className="text-xs text-cyan-600">Total shipments handled</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Delivery (Days)</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{dashboardStats.avgDeliveryDays}</div>
              <p className="text-xs text-green-600">Average delivery duration</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <RotateCcw className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{dashboardStats.pendingRequests}</div>
              <p className="text-xs text-orange-600">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Shipment Tracking - fetched from backend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Shipments</CardTitle>
              <CardDescription>Real-time shipment tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeShipments.length === 0 ? (
                <div className="text-center py-8">No active shipments found</div>
              ) : (
                activeShipments.map((shipment) => (
                  <div key={shipment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{shipment.shipmentnumber || shipment.id}</p>
                      <p className="text-xs text-muted-foreground">{shipment.destination_facility || shipment.destination}</p>
                      <p className="text-xs text-muted-foreground">{shipment.drugname || shipment.product}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={shipment.status === 'delivered' ? 'default' : shipment.status === 'in transit' ? 'secondary' : 'outline'}>
                        {shipment.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">ETA: {shipment.eta || 'N/A'}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution Operations</CardTitle>
            <CardDescription>Quick access to logistics management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Package className="h-6 w-6" />
                Track Shipment
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <RotateCcw className="h-6 w-6" />
                Update Status
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <MapPin className="h-6 w-6" />
                Route Planning
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <FileText className="h-6 w-6" />
                Delivery Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DistributorDashboard;