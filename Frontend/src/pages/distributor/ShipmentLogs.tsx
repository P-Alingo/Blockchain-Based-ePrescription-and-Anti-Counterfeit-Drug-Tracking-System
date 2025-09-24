import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Search, Filter, Download, MapPin, Clock, Package, RotateCcw, FileText, Activity } from "lucide-react";

const ShipmentLogs = () => {
   const sidebarItems = [
    { icon: Truck, label: 'Dashboard', path: '/distributor/dashboard', active: false },
    { icon: Package, label: 'Active Shipments', path: '/distributor/active-shipments', active: false },
    { icon: RotateCcw, label: 'Update Shipment', path: '/distributor/update-shipment', active: false },
    { icon: FileText, label: 'Shipment Logs', path: '/distributor/shipment-logs', active: true },
    { icon: Activity, label: 'Activity Logs', path: '/distributor/activity-logs', active: false },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const shipmentLogs = [
    {
      id: "SH-2024-001234",
      origin: "PharmaCorp - Nairobi",
      destination: "City Pharmacy - Mombasa",
      driver: "John Kamau",
      vehicle: "KCA 123X",
      departureTime: "2024-01-15 08:00",
      arrivalTime: "2024-01-15 18:30",
      status: "Delivered",
      items: 15,
      temperature: "2-8°C"
    },
    {
      id: "SH-2024-001233",
      origin: "MediSupply - Kisumu",
      destination: "Health Center - Nakuru",
      driver: "Mary Wanjiku",
      vehicle: "KBX 456Y",
      departureTime: "2024-01-14 09:30",
      arrivalTime: "2024-01-14 15:45",
      status: "Delivered",
      items: 8,
      temperature: "15-25°C"
    },
    {
      id: "SH-2024-001232",
      origin: "HealthPlus - Eldoret",
      destination: "District Hospital - Kitale",
      driver: "Peter Ochieng",
      vehicle: "KAA 789Z",
      departureTime: "2024-01-14 07:00",
      arrivalTime: "-",
      status: "In Transit",
      items: 22,
      temperature: "2-8°C"
    },
    {
      id: "SH-2024-001231",
      origin: "PharmaLink - Thika",
      destination: "Community Pharmacy - Muranga",
      driver: "Grace Nyambura",
      vehicle: "KCB 321W",
      departureTime: "2024-01-13 10:15",
      arrivalTime: "2024-01-13 13:20",
      status: "Delivered",
      items: 12,
      temperature: "Room Temp"
    },
    {
      id: "SH-2024-001230",
      origin: "MedCorp - Mombasa",
      destination: "Coast Pharmacy - Malindi",
      driver: "Hassan Ali",
      vehicle: "KBA 654V",
      departureTime: "2024-01-12 14:00",
      arrivalTime: "-",
      status: "Delayed",
      items: 18,
      temperature: "2-8°C"
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Delivered</Badge>;
      case "In Transit":
        return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>;
      case "Delayed":
        return <Badge variant="destructive">Delayed</Badge>;
      case "Dispatched":
        return <Badge className="bg-orange-100 text-orange-800">Dispatched</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredLogs = shipmentLogs.filter(log => {
    const matchesSearch = log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.driver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || log.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
      <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
      <div className="space-y-8">
        <div>
           <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              Shipment Logs
            </h1>
            <p className="text-muted-foreground">Track and monitor all pharmaceutical shipment activities</p>
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
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Total Shipments</p>
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
                <p className="text-2xl font-bold">142</p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <MapPin className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Delayed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shipment History</CardTitle>
              <CardDescription>Complete log of all pharmaceutical shipments</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="in transit">In Transit</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shipments..."
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
                <TableHead>Shipment ID</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Driver & Vehicle</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Arrival</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Temperature</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.id}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{log.origin}</p>
                      <p className="text-sm text-muted-foreground">→ {log.destination}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{log.driver}</p>
                      <p className="text-sm text-muted-foreground">{log.vehicle}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.departureTime}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.arrivalTime || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.items} items</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.temperature}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
      </DashboardLayout>
   
  );
};

export default ShipmentLogs;