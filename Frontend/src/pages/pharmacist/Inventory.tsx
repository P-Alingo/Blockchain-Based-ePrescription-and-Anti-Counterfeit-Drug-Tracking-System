import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Search, AlertTriangle, TrendingUp, BarChart3, Plus, PillBottle, Scan, Activity, Shield } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Inventory = () => {
   const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/pharmacist/dashboard', active: false },
    { icon: Scan, label: 'Scan Prescription', path: '/pharmacist/scan', active: false },
    { icon: Shield, label: 'Verify Prescription', path: '/pharmacist/verify', active: false },
    { icon: PillBottle, label: 'Dispense Drug', path: '/pharmacist/dispense', active: false },
    { icon: Package, label: 'Inventory', path: '/pharmacist/inventory', active: true },
    { icon: Activity, label: 'Activity Logs', path: '/pharmacist/activity-logs', active: false },
  ];

  const [searchTerm, setSearchTerm] = useState("");

  const inventoryData = [
    {
      id: 1,
      name: "Amoxicillin 500mg",
      batchNumber: "AMX-2024-001",
      quantity: 150,
      minStock: 50,
      expiryDate: "2025-12-31",
      supplier: "PharmaCorp",
      status: "In Stock"
    },
    {
      id: 2,
      name: "Paracetamol 500mg",
      batchNumber: "PCM-2024-002",
      quantity: 25,
      minStock: 50,
      expiryDate: "2025-06-15",
      supplier: "MediSupply",
      status: "Low Stock"
    },
    {
      id: 3,
      name: "Ibuprofen 400mg",
      batchNumber: "IBU-2024-003",
      quantity: 300,
      minStock: 100,
      expiryDate: "2024-03-30",
      supplier: "HealthPlus",
      status: "Expiring Soon"
    }
  ];

  const getStatusBadge = (status, quantity, minStock) => {
    if (status === "Expiring Soon") {
      return <Badge variant="destructive">Expiring Soon</Badge>;
    }
    if (quantity <= minStock) {
      return <Badge className="bg-orange-100 text-orange-800">Low Stock</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  return (
   <DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
      <div className="space-y-8">
        <div>
          <div>
           <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Inventory Management
            </h1>
            <p className="text-muted-foreground">Monitor and manage pharmacy stock levels</p>
          </div>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Item
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
                <p className="text-2xl font-bold">245</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
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
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">₦2.3M</p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Items</CardTitle>
                  <CardDescription>Manage your pharmacy inventory</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search medications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.batchNumber}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.expiryDate}</TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell>{getStatusBadge(item.status, item.quantity, item.minStock)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Inventory Analytics
              </CardTitle>
              <CardDescription>Track inventory trends and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Top Moving Items</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Paracetamol 500mg</span>
                        <span className="text-sm font-medium">156 units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Amoxicillin 500mg</span>
                        <span className="text-sm font-medium">134 units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Ibuprofen 400mg</span>
                        <span className="text-sm font-medium">98 units</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Monthly Trends</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Items Dispensed</span>
                        <span className="text-sm font-medium">1,234</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">New Stock Added</span>
                        <span className="text-sm font-medium">89 items</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Expired Items</span>
                        <span className="text-sm font-medium">3 items</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Inventory;