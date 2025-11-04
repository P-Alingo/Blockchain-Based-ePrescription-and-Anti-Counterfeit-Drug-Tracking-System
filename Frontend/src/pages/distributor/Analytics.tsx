import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState, useEffect } from "react";
import { Truck, Package, List, RotateCcw, FileText, Activity, MapPin, Filter, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectItem, SelectContent } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const DistributorAnalytics = () => {
  const sidebarItems = [
    { icon: Truck, label: 'Dashboard', path: '/distributor/dashboard', active: false },
    { icon: Package, label: 'Shipments', path: '/distributor/shipments', active: false },
    { icon: List, label: 'Inventory', path: '/distributor/inventory', active: false },
    { icon: RotateCcw, label: 'Requests', path: '/distributor/requests', active: false },
    { icon: FileText, label: 'Blockchain', path: '/distributor/blockchain', active: false },
    { icon: Activity, label: 'Analytics', path: '/distributor/analytics', active: true },
  ];

  const [activityLogs, setActivityLogs] = useState([]);
  const [stats, setStats] = useState({ totalActivities: 0, shipmentsToday: 0, locationUpdates: 0, alertsToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch("http://localhost:4000/api/distributor/analytics", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json();
        setActivityLogs(data.logs || []);
        setStats(data.stats || {});
        setError(null);
      } catch (err) {
        setError(err.message || "Error fetching analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Filter and search logic
  const filteredLogs = activityLogs.filter((log) => {
    const matchesType = filterType === "all" || log.action === filterType;
    const matchesSearch =
      searchTerm === "" ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.shipmentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading || error) {
    return (
      <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
        {loading && <div className="p-8 text-center">Loading analytics...</div>}
        {error && <div className="p-8 text-center text-red-500">{error}</div>}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
            Distribution Activity Logs
          </h1>
          <p className="text-muted-foreground">Monitor all distribution activities and shipment events</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Activities</CardTitle>
              <CardDescription>All distribution actions</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.totalActivities}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Shipments Today</CardTitle>
              <CardDescription>New shipments created</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.shipmentsToday}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Location Updates</CardTitle>
              <CardDescription>Tracking events</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.locationUpdates}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Alerts Today</CardTitle>
              <CardDescription>System alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.alertsToday}</span>
            </CardContent>
          </Card>
        </div>
        <Card className="border-primary/20 shadow-lg mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Detailed log of all distribution activities</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="shipment_created">Shipment Created</SelectItem>
                      <SelectItem value="location_update">Location Update</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                      {/* Add more types as needed */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Shipment ID</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8">No activity logs found</td></tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.timestamp}</td>
                      <td>{log.action}</td>
                      <td>{log.details}</td>
                      <td>{log.shipmentId}</td>
                      <td>{log.location}</td>
                      <td>{log.status}</td>
                      <td>{log.user}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DistributorAnalytics;