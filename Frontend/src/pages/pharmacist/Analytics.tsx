import { useState, useEffect } from "react";
import { Dialog } from '@/components/ui/dialog';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Search, Filter, Download, Calendar, User, Pill, Package, Shield, PillBottle, FileText, CheckCircle, AlertTriangle, Clock, Eye } from "lucide-react";

const PharmacistAnalytics = () => {
const sidebarItems = [
  { icon: Shield, label: "Dashboard", path: "/pharmacist/dashboard", active: false },
  { icon: Activity, label: "Analytics", path: "/pharmacist/analytics", active: true },
  { icon: Package, label: "Inventory & Requests", path: "/pharmacist/inventory-requests", active: false },
  { icon: FileText, label: "My Prescriptions", path: "/pharmacist/myprescriptions", active: false },
  { icon: Package, label: "Shipments", path: "/pharmacist/shipments", active: false },
];

  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("today");
  const [analyticsLogs, setAnalyticsLogs] = useState({
    all: [],
    dispensed: [],
    pending: [],
    inventory: [],
  });
  const [analyticsStats, setAnalyticsStats] = useState({
    totalDispensed: 0,
    totalPending: 0,
    inventoryUpdates: 0,
    failedDispenses: 0,
    totalIssued: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Modal state for details
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    setLoading(true);
    const API_BASE = 'http://localhost:4000';
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_BASE}/api/pharmacist/analytics`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch analytics data');
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setAnalyticsLogs({ dispensed: [], inventory: [], pending: [], all: [] });
          setAnalyticsStats({ totalDispensed: 0, totalPending: 0, inventoryUpdates: 0, failedDispenses: 0, totalIssued: 0 });
        } else {
          setAnalyticsLogs({
            dispensed: data.dispensed || [],
            inventory: data.inventory || [],
            pending: data.pending || [],
            all: data.all || []
          });
          setAnalyticsStats(data.stats || {
            totalDispensed: 0,
            totalPending: 0,
            inventoryUpdates: 0,
            failedDispenses: 0,
            totalIssued: 0,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setAnalyticsLogs({ dispensed: [], inventory: [], pending: [], all: [] });
        setAnalyticsStats({ totalDispensed: 0, totalPending: 0, inventoryUpdates: 0, failedDispenses: 0, totalIssued: 0 });
        setLoading(false);
      });
  }, []);

  const getSeverityBadge = (severity) => {
    const variants = {
      critical: "bg-destructive text-destructive-foreground",
      warning: "bg-warning text-warning-foreground",
      success: "bg-success text-success-foreground",
      info: "bg-primary text-primary-foreground"
    };
    return variants[severity] || variants.info;
  };

  const getActionIcon = (action) => {
    const icons = {
      prescription_dispensed: Pill,
      prescription_verified: Activity,
      prescription_pending: Clock,
      inventory_updated: Package,
      dispense_failed: AlertTriangle
    };
    return icons[action] || Activity;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  // Helper to get display value for log fields
  const getLogField = (log, field) => {
    switch (field) {
      case 'User':
        return log.pharmacist_name || log.user_name || log.user || '-';
      case 'Role':
        return log.user_role || log.role || '-';
      case 'Target':
        return log.batch_number || log.prescription_code || log.target || '-';
      case 'IP':
        return log.ip_address || log.ipAddress || '-';
      case 'User Agent':
        return log.user_agent || log.userAgent || '-';
      case 'Description':
        return log.action_description || log.event_description || log.description || '-';
      case 'Timestamp':
        return formatTime(log.created_at || log.event_time || log.timestamp);
      case 'Success':
        return log.success ? 'Yes' : 'No';
      case 'Severity':
        return log.severity || '-';
      default:
        return log[field] || '-';
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
      <div className="space-y-8">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Analytics</h1>
            <p className="text-lg text-muted-foreground mt-2">Comprehensive pharmacy analytics and performance overview</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2"><Download className="w-4 h-4" />Export Analytics</Button>
            <Button className="medical-button gap-2"><Filter className="w-4 h-4" />Advanced Filter</Button>
          </div>
        </div>

        {/* Analytics Statistics - Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Dispensed</p>
                  <p className="text-3xl font-bold mt-2">{analyticsStats.totalDispensed}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full"><Pill className="w-8 h-8 text-green-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Issued</p>
                  <p className="text-3xl font-bold mt-2">{analyticsStats.totalIssued}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full"><Activity className="w-8 h-8 text-blue-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inventory Updates</p>
                  <p className="text-3xl font-bold mt-2">{analyticsStats.inventoryUpdates}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full"><Package className="w-8 h-8 text-orange-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed Dispenses</p>
                  <p className="text-3xl font-bold mt-2">{analyticsStats.failedDispenses}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-full"><AlertTriangle className="w-8 h-8 text-destructive" /></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="healthcare-card">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search analytics by user, action, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="dispensed">Dispensed</SelectItem>
                {/* Removed Verified filter */}
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Logs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Analytics</TabsTrigger>
          <TabsTrigger value="dispensed">Dispensed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle>Recent Analytics</CardTitle>
              <CardDescription>
                Chronological view of all pharmacy analytics events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Drug</th>
                      <th className="px-4 py-2 text-left">Patient</th>
                      <th className="px-4 py-2 text-left">Quantity</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsLogs.all && analyticsLogs.all.filter(log => {
                      return (
                        searchTerm === "" ||
                        (log.patient_name && log.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (log.drug_name && log.drug_name.toLowerCase().includes(searchTerm.toLowerCase()))
                      );
                    }).map((log) => (
                      <tr key={log.id || log.inventory_id} className="border-b">
                        <td className="px-4 py-2">{log.type.replace('prescription_', '').replace('batch_request_', '').replace('inventory_', '').replace('shipment_', '')}</td>
                        <td className="px-4 py-2">{log.drug_name || '-'}</td>
                        <td className="px-4 py-2">{log.patient_name || '-'}</td>
                        <td className="px-4 py-2">{log.quantity || log.quantity_requested || log.available_quantity || '-'}</td>
                        <td className="px-4 py-2">{log.status || '-'}</td>
                        <td className="px-4 py-2">{formatTime(log.created_at || log.request_date || log.last_updated || log.dispensed_date || log.delivered_date)}</td>
                        <td className="px-4 py-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedLog(log); setDetailsModalOpen(true); }}>Details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analytics Details</DialogTitle>
            <DialogDescription>Full details for the selected record.</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-2">
              {Object.entries(selectedLog).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{key}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="dispensed" className="space-y-4">
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle>Dispensed Prescriptions</CardTitle>
              <CardDescription>All dispensed prescriptions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Prescription Code</th>
                      <th className="px-4 py-2 text-left">Drug</th>
                      <th className="px-4 py-2 text-left">Patient</th>
                      <th className="px-4 py-2 text-left">Quantity</th>
                      <th className="px-4 py-2 text-left">Dispensed By</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsLogs.dispensed && analyticsLogs.dispensed.map((log) => (
                      <tr key={log.id} className="border-b">
                        <td className="px-4 py-2">{log.prescription_code}</td>
                        <td className="px-4 py-2">{log.drug_name || '-'}</td>
                        <td className="px-4 py-2">{log.patient_name || '-'}</td>
                        <td className="px-4 py-2">{log.quantity || '-'}</td>
                        <td className="px-4 py-2">{log.dispensed_by || '-'}</td>
                        <td className="px-4 py-2">{formatTime(log.dispensed_date)}</td>
                        <td className="px-4 py-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedLog(log); setDetailsModalOpen(true); }}>Details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle>Inventory Updates</CardTitle>
              <CardDescription>All inventory changes and current stock.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Batch</th>
                      <th className="px-4 py-2 text-left">Drug</th>
                      <th className="px-4 py-2 text-left">Available Qty</th>
                      <th className="px-4 py-2 text-left">Total Batch Qty</th>
                      <th className="px-4 py-2 text-left">Last Updated</th>
                      <th className="px-4 py-2 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsLogs.inventory && analyticsLogs.inventory.map((log) => (
                      <tr key={log.inventory_id} className="border-b">
                        <td className="px-4 py-2">{log.batch_id}</td>
                        <td className="px-4 py-2">{log.drug_name || '-'}</td>
                        <td className="px-4 py-2">{log.available_quantity || '-'}</td>
                        <td className="px-4 py-2">{log.total_batch_quantity || '-'}</td>
                        <td className="px-4 py-2">{formatTime(log.last_updated)}</td>
                        <td className="px-4 py-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedLog(log); setDetailsModalOpen(true); }}>Details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle>Pending Batch Requests</CardTitle>
              <CardDescription>All pending and flagged batch requests.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Batch</th>
                      <th className="px-4 py-2 text-left">Drug</th>
                      <th className="px-4 py-2 text-left">Requested Qty</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Distributor</th>
                      <th className="px-4 py-2 text-left">Request Date</th>
                      <th className="px-4 py-2 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsLogs.pending && analyticsLogs.pending.map((log) => (
                      <tr key={log.id} className="border-b">
                        <td className="px-4 py-2">{log.batch_id}</td>
                        <td className="px-4 py-2">{log.drug_name || '-'}</td>
                        <td className="px-4 py-2">{log.quantity_requested || '-'}</td>
                        <td className="px-4 py-2">{log.status || '-'}</td>
                        <td className="px-4 py-2">{log.distributor_id || '-'}</td>
                        <td className="px-4 py-2">{formatTime(log.request_date)}</td>
                        <td className="px-4 py-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedLog(log); setDetailsModalOpen(true); }}>Details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default PharmacistAnalytics;