import React, { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Search, AlertTriangle, TrendingUp, BarChart3, Plus, PillBottle, Scan, Activity, Shield, FileText } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API_BASE_URL = "http://localhost:4000";
const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const sidebarItems = [
  { icon: Shield, label: "Dashboard", path: "/pharmacist/dashboard", active: false },
  { icon: Activity, label: "Blockchain", path: "/pharmacist/blockchain", active: false },
  { icon: Activity, label: "Analytics", path: "/pharmacist/analytics", active: false },
  { icon: PillBottle, label: "Dispense Drug", path: "/pharmacist/dispense", active: false },
  { icon: Package, label: "Inventory & Requests", path: "/pharmacist/inventory-requests", active: true },
  { icon: FileText, label: "My Prescriptions", path: "/pharmacist/myprescriptions", active: false },
  { icon: Package, label: "Shipments", path: "/pharmacist/shipments", active: false },
];

export default function InventoryAndRequests() {
  // Modal state for requesting a drug
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [modalDrug, setModalDrug] = useState<any>(null);
  const [modalQuantity, setModalQuantity] = useState("");
  const openRequestModal = (drug: any) => {
    setModalDrug(drug);
    setModalQuantity("");
    setShowRequestModal(true);
  };
  const closeRequestModal = () => {
    setShowRequestModal(false);
    setModalDrug(null);
    setModalQuantity("");
  };
  const handleModalRequest = async () => {
    if (!modalDrug || !modalQuantity) return;
    try {
      await api.post("/api/pharmacist/requests", { drugId: modalDrug.id, quantity: modalQuantity });
      toast.success("Request created");
      closeRequestModal();
      // Refresh requests after creation
      const res = await api.get("/api/pharmacist/requests");
      setRequests(res.data as Request[]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create request");
    }
  };
  // Inventory State
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryData, setInventoryData] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState(null);

  // Requests State
  type Request = { id: string; drugId: string; quantity: number | string; status: string };
  const [requests, setRequests] = useState<Request[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState(null);
  const [newRequest, setNewRequest] = useState({ drugId: "", quantity: "" });

  useEffect(() => {
    // Fetch Inventory
    const fetchInventory = async () => {
      setInventoryLoading(true);
      try {
        const res = await api.get("/api/pharmacist/inventory");
        setInventoryData(res.data as any[]);
      } catch (err) {
        setInventoryError("Failed to fetch inventory");
      } finally {
        setInventoryLoading(false);
      }
    };
    fetchInventory();
    // Fetch Requests
    const fetchRequests = async () => {
      setRequestsLoading(true);
      try {
        const res = await api.get("/api/pharmacist/requests");
        setRequests(res.data as Request[]);
      } catch (err) {
        setRequestsError("Failed to fetch requests");
        toast.error("Failed to fetch requests");
      } finally {
        setRequestsLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleCreateRequest = async () => {
    try {
      await api.post("/api/pharmacist/requests", newRequest);
      toast.success("Request created");
      setNewRequest({ drugId: "", quantity: "" });
      // Refresh requests after creation
      const res = await api.get("/api/pharmacist/requests");
      setRequests(res.data as Request[]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create request");
    }
  };

  const getStatusBadge = (status: string, quantity: number, minStock: number) => {
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Inventory & Requests</h1>
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>
          <TabsContent value="inventory" className="space-y-4">
            {/* Inventory Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{inventoryData.length}</p>
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
                      <p className="text-2xl font-bold">{
                        inventoryData.filter((item: any) => item.quantity <= item.minStock).length
                      }</p>
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
                      <p className="text-2xl font-bold">{
                        inventoryData.filter((item: any) => item.status === "Expiring Soon").length
                      }</p>
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
                      <p className="text-2xl font-bold">{
                        inventoryData.reduce((acc: number, item: any) => acc + (item.value || 0), 0).toLocaleString()
                      }</p>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                      onChange={e => setSearchTerm(e.target.value)}
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
                    {inventoryLoading ? (
                      <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
                    ) : inventoryError ? (
                      <TableRow><TableCell colSpan={7}>{inventoryError}</TableCell></TableRow>
                    ) : inventoryData.length === 0 ? (
                      <TableRow><TableCell colSpan={7}>No inventory found</TableCell></TableRow>
                    ) : (
                      inventoryData.filter((item: any) => item.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.batchNumber}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.expiryDate}</TableCell>
                          <TableCell>{item.supplier}</TableCell>
                          <TableCell>{getStatusBadge(item.status, item.quantity, item.minStock)}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">Edit</Button>
                            {item.quantity <= item.minStock && (
                              <Button variant="default" size="sm" className="ml-2" onClick={() => openRequestModal(item)}>
                                Request
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
      {/* Request Modal */}
      {showRequestModal && modalDrug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Request Drug</h2>
            <p className="mb-2">Drug: <span className="font-semibold">{modalDrug.name}</span></p>
            <p className="mb-2">Batch Number: <span className="font-semibold">{modalDrug.batchNumber}</span></p>
            <div className="mb-4">
              <label className="block mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={modalQuantity}
                onChange={e => setModalQuantity(e.target.value)}
                className="border px-2 py-1 rounded w-full"
                placeholder="Enter quantity"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeRequestModal}>Cancel</Button>
              <Button variant="default" onClick={handleModalRequest}>Submit Request</Button>
            </div>
          </div>
        </div>
      )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="requests" className="space-y-4">
            {/* Requests Section */}
            <Card>
              <CardHeader>
                <CardTitle>Pharmacist Batch Requests</CardTitle>
                <CardDescription>Request new drug batches from distributors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Drug ID"
                    value={newRequest.drugId}
                    onChange={e => setNewRequest(r => ({ ...r, drugId: e.target.value }))}
                    className="border px-2 py-1 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={newRequest.quantity}
                    onChange={e => setNewRequest(r => ({ ...r, quantity: e.target.value }))}
                    className="border px-2 py-1 rounded"
                  />
                  <Button onClick={handleCreateRequest}>Create Request</Button>
                </div>
                {requestsLoading ? (
                  <div className="p-8 text-center">Loading requests...</div>
                ) : requestsError ? (
                  <div className="p-8 text-center text-red-500">{requestsError}</div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8">No requests found</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Drug</th>
                        <th>Quantity</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map(r => (
                        <tr key={r.id}>
                          <td>{r.id}</td>
                          <td>{r.drugId}</td>
                          <td>{r.quantity}</td>
                          <td>{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
