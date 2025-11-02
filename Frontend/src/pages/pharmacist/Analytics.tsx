import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, Filter, Download, Calendar, User, Pill, Package, Shield, Scan, PillBottle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const PharmacistActivityLogs = () => {
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/pharmacist/dashboard', active: false },
    { icon: Scan, label: 'Scan Prescription', path: '/pharmacist/scan', active: false },
    { icon: Shield, label: 'Verify Prescription', path: '/pharmacist/verify', active: false },
    { icon: PillBottle, label: 'Dispense Drug', path: '/pharmacist/dispense', active: false },
    { icon: Package, label: 'Inventory', path: '/pharmacist/inventory', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/pharmacist/activity-logs', active: true },
  ];
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const activityLogs = [
    {
      id: 1,
      timestamp: "2024-01-15 14:30:25",
      action: "Prescription Dispensed",
      details: "Dispensed Amoxicillin 500mg to John Doe",
      prescriptionId: "RX-2024-001234",
      status: "Completed",
      ipAddress: "192.168.1.100"
    },
    {
      id: 2,
      timestamp: "2024-01-15 14:15:10",
      action: "Prescription Verified",
      details: "Verified prescription authenticity via blockchain",
      prescriptionId: "RX-2024-001234",
      status: "Success",
      ipAddress: "192.168.1.100"
    },
    {
      id: 3,
      timestamp: "2024-01-15 13:45:55",
      action: "Inventory Updated",
      details: "Updated stock levels for Paracetamol 500mg",
      prescriptionId: "-",
      status: "Completed",
      ipAddress: "192.168.1.100"
    },
    {
      id: 4,
      timestamp: "2024-01-15 13:20:30",
      action: "QR Code Scanned",
      details: "Scanned prescription QR code for patient Jane Smith",
      prescriptionId: "RX-2024-001235",
      status: "Success",
      ipAddress: "192.168.1.100"
    },
    {
      id: 5,
      timestamp: "2024-01-15 12:55:15",
      action: "Login",
      details: "User logged into pharmacy system",
      prescriptionId: "-",
      status: "Success",
      ipAddress: "192.168.1.100"
    }
  ];

  const getActionIcon = (action) => {
    switch (action) {
      case "Prescription Dispensed":
        return <Pill className="h-4 w-4 text-green-600" />;
      case "Prescription Verified":
        return <Activity className="h-4 w-4 text-blue-600" />;
      case "Inventory Updated":
        return <Activity className="h-4 w-4 text-orange-600" />;
      case "QR Code Scanned":
        return <Activity className="h-4 w-4 text-purple-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
      case "Success":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">{status}</Badge>;
      case "Failed":
        return <Badge variant="destructive">{status}</Badge>;
      case "Pending":
        return <Badge className="bg-orange-100 text-orange-800">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
   <DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
      <div className="space-y-8">
        <div>
          <div>
           <h1 className="text-3xl font-bold text-purple-600">
              Activity Logs
            </h1>
            <p className="text-muted-foreground">Monitor all pharmacy system activities and transactions</p>
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
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Total Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Pill className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">89</p>
                <p className="text-sm text-muted-foreground">Dispensed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Verifications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Updates</p>
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
              <CardDescription>Detailed log of all pharmacy system activities</CardDescription>
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
                    <SelectItem value="dispensing">Dispensing</SelectItem>
                    <SelectItem value="verification">Verification</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
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
                <TableHead>Prescription ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activityLogs.map((log) => (
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
                    {log.prescriptionId !== "-" ? (
                      <Badge variant="outline">{log.prescriptionId}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default PharmacistActivityLogs;