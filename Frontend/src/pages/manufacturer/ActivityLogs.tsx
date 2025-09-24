import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, Filter, Download, Package2, Beaker, Shield, Settings, Package, Plus, List } from "lucide-react";

const ManufacturerActivityLogs = () => {
   const sidebarItems = [
    { icon: Package, label: 'Dashboard', path: '/manufacturer/dashboard', active: false },
    { icon: Plus, label: 'Register Batch', path: '/manufacturer/register-batch', active: false },
    { icon: List, label: 'Batch List', path: '/manufacturer/batch-list', active: false },
    { icon: Shield, label: 'Blockchain Verification', path: '/manufacturer/blockchain-verification', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/manufacturer/activity-logs', active: true },
  ];
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const activityLogs = [
    {
      id: 1,
      timestamp: "2024-01-15 16:30:25",
      action: "Batch Production Completed",
      details: "Completed manufacturing of Amoxicillin 500mg batch AMX-2024-001",
      batchId: "AMX-2024-001",
      status: "Completed",
      user: "Production Team A",
      category: "Manufacturing"
    },
    {
      id: 2,
      timestamp: "2024-01-15 15:45:10",
      action: "Quality Control Passed",
      details: "QC tests passed for Paracetamol 500mg batch PCM-2024-002",
      batchId: "PCM-2024-002",
      status: "Success",
      user: "QC Inspector Jane",
      category: "Quality Control"
    },
    {
      id: 3,
      timestamp: "2024-01-15 14:20:55",
      action: "Blockchain Record Created",
      details: "Created blockchain record for batch IBU-2024-003",
      batchId: "IBU-2024-003",
      status: "Success",
      user: "System",
      category: "Blockchain"
    },
    {
      id: 4,
      timestamp: "2024-01-15 13:15:30",
      action: "Raw Material Received",
      details: "Received pharmaceutical grade materials for production",
      batchId: "-",
      status: "Completed",
      user: "Warehouse Team",
      category: "Inventory"
    },
    {
      id: 5,
      timestamp: "2024-01-15 12:00:45",
      action: "Equipment Maintenance",
      details: "Completed scheduled maintenance on Manufacturing Line 2",
      batchId: "-",
      status: "Completed",
      user: "Maintenance Team",
      category: "Equipment"
    },
    {
      id: 6,
      timestamp: "2024-01-15 11:30:15",
      action: "Quality Control Failed",
      details: "QC tests failed for batch ASP-2024-004 - contamination detected",
      batchId: "ASP-2024-004",
      status: "Failed",
      user: "QC Inspector John",
      category: "Quality Control"
    },
    {
      id: 7,
      timestamp: "2024-01-15 10:45:20",
      action: "Batch Registration",
      details: "Registered new batch MET-2024-005 for production",
      batchId: "MET-2024-005",
      status: "Success",
      user: "Production Manager",
      category: "Registration"
    }
  ];

  const getActionIcon = (category) => {
    switch (category) {
      case "Manufacturing":
        return <Package2 className="h-4 w-4 text-blue-600" />;
      case "Quality Control":
        return <Beaker className="h-4 w-4 text-purple-600" />;
      case "Blockchain":
        return <Shield className="h-4 w-4 text-green-600" />;
      case "Equipment":
        return <Settings className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
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
      case "In Progress":
        return <Badge className="bg-blue-100 text-blue-800">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.batchId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || log.category.toLowerCase().replace(" ", "") === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="manufacturer" userName="Sarah Manufacturer" userEmail="sarah@pharmaceutical.co.ke">
      <div className="space-y-8">
        <div>
          <div>
           <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Manufacturing Activity Logs
            </h1>
            <p className="text-muted-foreground">Monitor all manufacturing and production activities</p>
          </div>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">342</p>
                <p className="text-sm text-muted-foreground">Total Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Productions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Beaker className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">89</p>
                <p className="text-sm text-muted-foreground">QC Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">67</p>
                <p className="text-sm text-muted-foreground">Blockchain Records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Settings className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Maintenance</p>
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
              <CardDescription>Detailed log of all manufacturing system activities</CardDescription>
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
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="qualitycontrol">Quality Control</SelectItem>
                    <SelectItem value="blockchain">Blockchain</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
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
                <TableHead>Batch ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.category)}
                      <span className="font-medium">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">{log.details}</TableCell>
                  <TableCell>
                    {log.batchId !== "-" ? (
                      <Badge variant="outline">{log.batchId}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {log.category}
                    </Badge>
                  </TableCell>
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

export default ManufacturerActivityLogs;