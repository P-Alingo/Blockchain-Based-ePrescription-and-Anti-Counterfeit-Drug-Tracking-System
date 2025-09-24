import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package2, Search, Filter, Download, Calendar, Shield, Beaker, Activity, Plus, Package, List } from "lucide-react";

const BatchList = () => {
   const sidebarItems = [
    { icon: Package, label: 'Dashboard', path: '/manufacturer/dashboard', active: false },
    { icon: Plus, label: 'Register Batch', path: '/manufacturer/register-batch', active: false },
    { icon: List, label: 'Batch List', path: '/manufacturer/batch-list', active: true },
    { icon: Shield, label: 'Blockchain Verification', path: '/manufacturer/blockchain-verification', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/manufacturer/activity-logs', active: false },
  ];
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const batchData = [
    {
      id: "AMX-2024-001",
      productName: "Amoxicillin 500mg",
      manufacturingDate: "2024-01-10",
      expiryDate: "2025-12-31",
      quantity: 10000,
      status: "Active",
      qualityStatus: "Passed",
      blockchainHash: "0x1a2b3c4d5e6f...",
      distributionStatus: "Available"
    },
    {
      id: "PCM-2024-002",
      productName: "Paracetamol 500mg",
      manufacturingDate: "2024-01-12",
      expiryDate: "2025-06-15",
      quantity: 25000,
      status: "Active",
      qualityStatus: "Passed",
      blockchainHash: "0x2b3c4d5e6f7a...",
      distributionStatus: "Distributing"
    },
    {
      id: "IBU-2024-003",
      productName: "Ibuprofen 400mg",
      manufacturingDate: "2024-01-08",
      expiryDate: "2024-03-30",
      quantity: 5000,
      status: "Expiring Soon",
      qualityStatus: "Passed",
      blockchainHash: "0x3c4d5e6f7a8b...",
      distributionStatus: "Recall"
    },
    {
      id: "ASP-2024-004",
      productName: "Aspirin 100mg",
      manufacturingDate: "2024-01-15",
      expiryDate: "2026-01-15",
      quantity: 15000,
      status: "Active",
      qualityStatus: "Testing",
      blockchainHash: "0x4d5e6f7a8b9c...",
      distributionStatus: "Pending"
    },
    {
      id: "MET-2024-005",
      productName: "Metformin 500mg",
      manufacturingDate: "2024-01-14",
      expiryDate: "2025-09-20",
      quantity: 20000,
      status: "Active",
      qualityStatus: "Passed",
      blockchainHash: "0x5e6f7a8b9c0d...",
      distributionStatus: "Available"
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
      case "Expiring Soon":
        return <Badge className="bg-orange-100 text-orange-800">Expiring Soon</Badge>;
      case "Expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "Recalled":
        return <Badge variant="destructive">Recalled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getQualityBadge = (status) => {
    switch (status) {
      case "Passed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Passed</Badge>;
      case "Failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "Testing":
        return <Badge className="bg-blue-100 text-blue-800">Testing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDistributionBadge = (status) => {
    switch (status) {
      case "Available":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Available</Badge>;
      case "Distributing":
        return <Badge className="bg-blue-100 text-blue-800">Distributing</Badge>;
      case "Recall":
        return <Badge variant="destructive">Recall</Badge>;
      case "Pending":
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredBatches = batchData.filter(batch => {
    const matchesSearch = batch.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || batch.status.toLowerCase().replace(" ", "") === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
  <DashboardLayout sidebarItems={sidebarItems} userRole="manufacturer" userName="Sarah Manufacturer" userEmail="sarah@pharmaceutical.co.ke">
      <div className="space-y-8">
        <div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Batch Management
            </h1>
            <p className="text-muted-foreground">Monitor and manage all pharmaceutical production batches</p>
          </div>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Batches
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">75</p>
                <p className="text-sm text-muted-foreground">Total Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">68</p>
                <p className="text-sm text-muted-foreground">Active Batches</p>
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
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
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
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">In Testing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Production Batches</CardTitle>
              <CardDescription>Comprehensive view of all manufactured pharmaceutical batches</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expiringsoon">Expiring Soon</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="recalled">Recalled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search batches..."
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
                <TableHead>Batch ID</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Manufacturing Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Distribution</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.id}</TableCell>
                  <TableCell>{batch.productName}</TableCell>
                  <TableCell>{batch.manufacturingDate}</TableCell>
                  <TableCell>{batch.expiryDate}</TableCell>
                  <TableCell>{batch.quantity.toLocaleString()} units</TableCell>
                  <TableCell>{getStatusBadge(batch.status)}</TableCell>
                  <TableCell>{getQualityBadge(batch.qualityStatus)}</TableCell>
                  <TableCell>{getDistributionBadge(batch.distributionStatus)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Batch Activities</CardTitle>
            <CardDescription>Latest manufacturing and quality control activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { batch: "MET-2024-005", action: "Quality Control Passed", time: "2 hours ago" },
                { batch: "ASP-2024-004", action: "Manufacturing Completed", time: "4 hours ago" },
                { batch: "PCM-2024-002", action: "Distribution Started", time: "6 hours ago" },
                { batch: "AMX-2024-001", action: "Blockchain Hash Updated", time: "8 hours ago" }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{activity.batch}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batch Analytics</CardTitle>
            <CardDescription>Production insights and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Monthly Production</p>
                  <p className="text-2xl font-bold">75 batches</p>
                  <p className="text-sm text-green-600">+12% from last month</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Quality Pass Rate</p>
                  <p className="text-2xl font-bold">98.7%</p>
                  <p className="text-sm text-green-600">+0.3% improvement</p>
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">Total Units Produced</p>
                <p className="text-2xl font-bold">1.2M units</p>
                <p className="text-sm text-muted-foreground">Across all active batches</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BatchList;