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
  // Edit Request Modal State
  const [editRequestModal, setEditRequestModal] = useState(false);
  const [editRequest, setEditRequest] = useState<Request | null>(null);
  const [editQuantity, setEditQuantity] = useState("");

  const handleEditRequest = (request: Request) => {
    setEditRequest(request);
    setEditQuantity(String(request.quantity));
    setEditRequestModal(true);
  };

  const closeEditRequestModal = () => {
    setEditRequestModal(false);
    setEditRequest(null);
    setEditQuantity("");
  };

  const submitEditRequest = async () => {
    if (!editRequest || !editQuantity || isNaN(Number(editQuantity)) || Number(editQuantity) <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    try {
      await api.put(`/api/pharmacist/requests/${editRequest.id}`, { quantity: Number(editQuantity) });
      toast.success("Request updated");
      closeEditRequestModal();
      // Refresh requests
      const res = await api.get("/api/pharmacist/requests");
      setRequests(res.data as Request[]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update request");
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await api.delete(`/api/pharmacist/requests/${id}`);
      toast.success("Request deleted");
      // Refresh requests
      const res = await api.get("/api/pharmacist/requests");
      setRequests(res.data as Request[]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete request");
    }
  };
  // Inventory State (single declaration)
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryData, setInventoryData] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState(null);

  // Get all drugs that are expiring soon (e.g., within 30 days)
  const expiringSoonDrugs = inventoryData.filter((item: any) => {
    if (!item.expiry_date) return false;
    const expiry = new Date(item.expiry_date);
    const now = new Date();
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 30;
  });
  // Modal state for requesting a drug
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDrugId, setSelectedDrugId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedDistributorId, setSelectedDistributorId] = useState("");
  const [modalQuantity, setModalQuantity] = useState("");
  // Get all drugs that are low/out of stock
  const lowStockDrugs = inventoryData.filter((item: any) => {
    const minStock = typeof item.minStock === 'number' ? item.minStock : 1;
    return Number(item.quantity) <= minStock;
  });
  // Open modal with drug, batch, distributor pre-filled
  const openRequestModal = (drug: any) => {
    setSelectedDrugId(String(drug.drug_id));
    let batch = null;
    if (drug.batches && drug.batches.length > 0) {
      batch = drug.batches.find((b: any) => Number(b.inventory_quantity) > 0) || drug.batches[0];
    }
    setSelectedBatchId(batch ? String(batch.batch_id) : "");
    setSelectedDistributorId(batch ? String(batch.distributorcompanyid || "") : "");
    setEditRequest({
      id: "new",
      drugId: String(drug.drug_id),
      batchId: batch ? String(batch.batch_id) : "",
      quantity: "",
      status: "pending",
      drugName: drug.drug_name
    });
    setEditQuantity("");
    setShowRequestModal(true);
  };

  const closeRequestModal = () => {
    setShowRequestModal(false);
    setSelectedDrugId("");
    setSelectedBatchId("");
    setSelectedDistributorId("");
    setModalQuantity("");
  };

  const handleModalRequest = async () => {
    if (!selectedDrugId || !modalQuantity || isNaN(Number(modalQuantity)) || Number(modalQuantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (!selectedBatchId) {
      toast.error("No batch available for this drug");
      return;
    }
    try {
      await api.post("/api/pharmacist/requests", {
        drugId: selectedDrugId,
        quantity: Number(modalQuantity),
        batchId: selectedBatchId,
        distributorId: selectedDistributorId
      });
      toast.success("Request created");
      closeRequestModal();
      // Refresh requests after creation
      const res = await api.get("/api/pharmacist/requests");
      setRequests(res.data as Request[]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create request");
    }
  };

  // Requests State
  type Request = { id: string; drugId: string; batchId?: string; quantity: number | string; status: string; drugName?: string };
  const [requests, setRequests] = useState<Request[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState(null);
  const [newRequest, setNewRequest] = useState({ drugId: "", quantity: "" });

  // Fetch functions for manual and auto refresh
  const fetchInventory = async (setInventoryLoading, setInventoryError, setInventoryData) => {
    setInventoryLoading(true);
    try {
      const res = await api.get("/api/pharmacist/inventory");
      setInventoryData(res.data);
    } catch (err) {
      setInventoryError("Failed to fetch inventory");
    } finally {
      setInventoryLoading(false);
    }
  };
  const fetchRequests = async (setRequestsLoading, setRequestsError, setRequests) => {
    setRequestsLoading(true);
    try {
      const res = await api.get("/api/pharmacist/requests");
      setRequests(res.data);
    } catch (err) {
      setRequestsError("Failed to fetch requests");
      toast.error("Failed to fetch requests");
    } finally {
      setRequestsLoading(false);
    }
  };

  // Remove auto-refresh useEffect and add manual refresh button for the whole page
  useEffect(() => {
    fetchInventory(setInventoryLoading, setInventoryError, setInventoryData);
    fetchRequests(setRequestsLoading, setRequestsError, setRequests);
  }, []);

  const handleManualRefresh = () => {
    fetchInventory(setInventoryLoading, setInventoryError, setInventoryData);
    fetchRequests(setRequestsLoading, setRequestsError, setRequests);
  };

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
        {/* Add general refresh button above Tabs */}
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={handleManualRefresh}>Refresh Page</Button>
        </div>
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
                      <p className="text-2xl font-bold">{lowStockDrugs.length}</p>
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
                      <p className="text-2xl font-bold">{expiringSoonDrugs.length}</p>
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
                    <tr>
                      <th>Medication</th>
                      <th>Batch Number</th>
                      <th>Formulation</th>
                      <th>Dosage</th>
                      <th>Batches Available</th>
                      <th>Total Batch Quantity</th>
                      <th>Inventory Quantity</th>
                      <th>Expiry Date</th>
                      <th>Distributor</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.filter((item: any) => item.drug_name.toLowerCase().includes(searchTerm.toLowerCase())).map((drug: any) => {
                      // Find the first batch with inventory_quantity > 0, sorted by expiry date
                      const availableBatches = drug.batches ? drug.batches.slice().sort((a: any, b: any) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()) : [];
                      const firstAvailableBatch = availableBatches.length > 0 ? availableBatches[0] : null;
                      const totalBatchQuantity = drug.batches ? drug.batches.reduce((sum: number, b: any) => sum + Number(b.batch_quantity || 0), 0) : 0;
                      const totalInventoryQuantity = drug.batches ? drug.batches.reduce((sum: number, b: any) => sum + Number(b.inventory_quantity || 0), 0) : 0;
                      return (
                        <tr key={drug.drug_id}>
                          <td>{drug.drug_name}</td>
                          <td>{firstAvailableBatch ? firstAvailableBatch.batch_number : "-"}</td>
                          <td>{drug.formulation}</td>
                          <td>{drug.dosageunit}</td>
                          <td>{drug.batches ? drug.batches.length : 0}</td>
                          <td>{drug.batches ? drug.batches.reduce((sum: number, b: any) => sum + Number(b.batch_quantity || 0), 0) : 0}</td>
                          <td>{totalInventoryQuantity}</td>
                          <td>{firstAvailableBatch && firstAvailableBatch.expiry_date ? new Date(firstAvailableBatch.expiry_date).toLocaleDateString() : "-"}</td>
                          <td>{firstAvailableBatch && firstAvailableBatch.distributorcompanyid ? firstAvailableBatch.distributorcompanyid : "-"}</td>
                          <td>
                            {getStatusBadge(
                              drug.batches && drug.batches.length > 0 && drug.batches.some((b: any) => {
                                const expiry = b.expiry_date ? new Date(b.expiry_date) : null;
                                const now = new Date();
                                return expiry && (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 30 && (expiry.getTime() - now.getTime()) > 0;
                              }) ? "Expiring Soon" : "Low Stock",
                              totalInventoryQuantity,
                              1 // minStock
                            )}
                          </td>
                          <td>
                            {drug.batches && drug.batches.length > 0 ? (
                              <Button size="sm" variant="outline" onClick={() => openRequestModal(drug)}>
                                Request
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled>
                                No batch available
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
                {/* Removed Refresh Now button */}
              </CardHeader>
              <CardContent>
                {/* Removed create request button and input fields from Requests tab */}
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Drug</th>
                      <th>Batch ID</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestsLoading ? (
                      <tr><td colSpan={6} className="text-center">Loading requests...</td></tr>
                    ) : requestsError ? (
                      <tr><td colSpan={6} className="text-center text-red-500">{requestsError}</td></tr>
                    ) : requests.length === 0 ? (
                      <tr><td colSpan={6} className="text-center">No requests found</td></tr>
                    ) : (
                      requests.map(r => (
                        <tr key={r.id}>
                          <td>{r.id}</td>
                          <td>{r.drugName ? r.drugName : r.drugId}</td>
                          <td>{r.batchId || '-'}</td>
                          <td>{r.quantity}</td>
                          <td>{r.status}</td>
                          <td>
                            <Button variant="outline" size="sm" onClick={() => handleEditRequest(r)}>Edit</Button>
                            <Button variant="destructive" size="sm" className="ml-2" onClick={() => handleDeleteRequest(r.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))
                    )
                  }
                  </tbody>
                </table>
                {/* Edit Request Modal */}
                {editRequestModal && editRequest && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                      <h2 className="text-xl font-bold mb-2">Edit Request</h2>
                      <p className="mb-2">Drug: <span className="font-semibold">{editRequest.drugName || editRequest.drugId}</span></p>
                      <div className="mb-4">
                        <label className="block mb-1">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          value={editQuantity}
                          onChange={e => setEditQuantity(e.target.value)}
                          className="border px-2 py-1 rounded w-full"
                          placeholder="Enter quantity"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={closeEditRequestModal}>Cancel</Button>
                        <Button variant="default" onClick={submitEditRequest} disabled={!editQuantity || isNaN(Number(editQuantity)) || Number(editQuantity) <= 0}>Save</Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Request Modal */}
                {showRequestModal && editRequest && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                      <h2 className="text-xl font-bold mb-4">Request Drug Batch</h2>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Drug</label>
                        <input type="text" value={editRequest.drugName || ""} readOnly className="w-full border rounded px-2 py-1 bg-gray-100" />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Quantity Needed</label>
                        <input type="number" min="1" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} className="w-full border rounded px-2 py-1" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => { setShowRequestModal(false); setEditRequest(null); setEditQuantity(""); }}>Cancel</Button>
                        <Button onClick={async () => {
                          if (!editQuantity || isNaN(Number(editQuantity)) || Number(editQuantity) <= 0) {
                            toast.error("Please enter a valid quantity");
                            return;
                          }
                          if (!editRequest.batchId) {
                            toast.error("No batch available for this drug");
                            return;
                          }
                          try {
                            await api.post("/api/pharmacist/requests", {
                              drugId: editRequest.drugId,
                              quantity: Number(editQuantity),
                              batchId: editRequest.batchId,
                              distributorId: selectedDistributorId
                            });
                            toast.success("Request created");
                            setShowRequestModal(false);
                            setEditRequest(null);
                            setEditQuantity("");
                            // Refresh requests after creation
                            const res = await api.get("/api/pharmacist/requests");
                            setRequests(res.data as Request[]);
                          } catch (err) {
                            toast.error(err.response?.data?.message || "Failed to create request");
                          }
                        }}>Submit Request</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
