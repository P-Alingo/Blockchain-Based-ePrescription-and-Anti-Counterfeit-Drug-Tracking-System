import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, Filter, Download, Truck, Package, MapPin, User, RotateCcw, FileText } from "lucide-react";

const DistributorActivityLogs = () => {
   const sidebarItems = [
    { icon: Truck, label: 'Dashboard', path: '/distributor/dashboard', active: false },
    { icon: Package, label: 'Active Shipments', path: '/distributor/active-shipments', active: false },
    { icon: RotateCcw, label: 'Update Shipment', path: '/distributor/update-shipment', active: false },
    { icon: FileText, label: 'Shipment Logs', path: '/distributor/shipment-logs', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/distributor/activity-logs', active: true },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const activityLogs = [
    {
      id: 1,
      timestamp: "2024-01-15 16:45:30",
      action: "Shipment Delivered",
      details: "Delivered 15 items to City Pharmacy - Mombasa",
      shipmentId: "SH-2024-001234",
      location: "Mombasa",
      status: "Completed",
      user: "John Kamau"
    },
    {
      id: 2,
      timestamp: "2024-01-15 15:30:15",
      action: "Location Updated",
      details: "Updated shipment location to Machakos",
      shipmentId: "SH-2024-001234",
      location: "Machakos",
      status: "Success",
      user: "John Kamau"
    },
    {
      id: 3,
      timestamp: "2024-01-15 12:00:45",
      action: "Shipment Dispatched",
      details: "Dispatched shipment from PharmaCorp - Nairobi",
      shipmentId: "SH-2024-001234",
      location: "Nairobi",
      status: "Completed",
      user: "Distribution Center"
    },
    {
      id: 4,
      timestamp: "2024-01-15 11:30:20",
      action: "Temperature Alert",
      details: "Temperature exceeded safe range (10°C)",
      shipmentId: "SH-2024-001233",
      location: "Nakuru",
      status: "Alert",
      user: "System"
    },
    {
      id: 5,
      timestamp: "2024-01-15 10:15:55",
      action: "Route Updated",
      details: "Route changed due to road closure",
      shipmentId: "SH-2024-001232",
      location: "Eldoret",
      status: "Updated",
      user: "Peter Ochieng"
    },
    {
      id: 6,
      timestamp: "2024-01-15 09:45:10",
      action: "Shipment Loaded",
      details: "22 items loaded for transport to Kitale",
      shipmentId: "SH-2024-001232",
      location: "Eldoret",
      status: "Completed",
      user: "Loading Team"
    },
    {
      id: 7,
      timestamp: "2024-01-15 08:30:35",
      action: "Driver Check-in",
      details: "Driver Peter Ochieng checked in for duty",
      shipmentId: "-",
      location: "Eldoret",
      status: "Success",
      user: "Peter Ochieng"
    }
  ];

  const getActionIcon = (action) => {
    switch (action) {
      case "Shipment Delivered":
        return <Package className="h-4 w-4 text-green-600" />;
      case "Shipment Dispatched":
        return <Truck className="h-4 w-4 text-blue-600" />;
      case "Location Updated":
        return <MapPin className="h-4 w-4 text-purple-600" />;
      case "Temperature Alert":
        return <Activity className="h-4 w-4 text-red-600" />;
      case "Route Updated":
        return <MapPin className="h-4 w-4 text-orange-600" />;
      case "Shipment Loaded":
        return <Package className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
      case "Success":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">{status}</Badge>;
      case "Alert":
        return <Badge variant="destructive">{status}</Badge>;
      case "Updated":
        return <Badge className="bg-blue-100 text-blue-800">{status}</Badge>;
      case "Pending":
        return <Badge className="bg-orange-100 text-orange-800">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.shipmentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || 
                         (filterType === "shipment" && log.action.includes("Shipment")) ||
                         (filterType === "location" && log.action.includes("Location")) ||
                         (filterType === "temperature" && log.action.includes("Temperature")) ||
                         (filterType === "system" && log.user === "System");
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
      <div className="space-y-8">
        <div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              Distribution Activity Logs
            </h1>
            <p className="text-muted-foreground">Monitor all distribution activities and shipment events</p>
          </div>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">234</p>
                <p className="text-sm text-muted-foreground">Total Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Shipments Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">89</p>
                <p className="text-sm text-muted-foreground">Location Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Activity className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Alerts Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 shadow-lg">
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
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="shipment">Shipment</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="temperature">Temperature</SelectItem>
                    <SelectItem value="system">System</SelectItem>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Shipment ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="font-medium">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">{log.details}</TableCell>
                  <TableCell>
                    {log.shipmentId !== "-" ? (
                      <Badge variant="outline">{log.shipmentId}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{log.location}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{log.user}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </DashboardLayout>
  );
};

export default DistributorActivityLogs;