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
  { icon: Activity, label: "Analytics", path: "/pharmacist/analytics", active: false },
  { icon: Package, label: "Inventory & Requests", path: "/pharmacist/inventory-requests", active: true },
  { icon: FileText, label: "My Prescriptions", path: "/pharmacist/myprescriptions", active: false },
  { icon: Package, label: "Shipments", path: "/pharmacist/shipments", active: false },
];

export default function InventoryAndRequests() {
  // Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDrugId, setSelectedDrugId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [availableBatches, setAvailableBatches] = useState([]);
  // Edit Request Modal State
  const [editRequestModal, setEditRequestModal] = useState(false);
  const [editRequest, setEditRequest] = useState<Request | null>(null);
  const [editQuantity, setEditQuantity] = useState("");

  // Inventory State (single declaration)
  // (Removed duplicate declaration)

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
    let toastId = toast.loading("Updating request on-chain...");
    try {
      const response = await api.put(`/api/pharmacist/requests/${editRequest.id}`, { quantity_requested: Number(editQuantity) });
      toast.success("Request updated and synced to blockchain", { id: toastId });
      // Optionally show transaction info if available
      if (response.data && typeof response.data === 'object' && 'txHash' in response.data) {
        toast.info(`Tx Hash: ${(response.data as any).txHash}`);
      }
      closeEditRequestModal();
      // Refresh requests
      const res = await api.get("/api/pharmacist/requests");
      setRequests(res.data as Request[]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update request";
      if (errorMsg.includes("does not exist on-chain")) {
        toast.error("This batch request does not exist on the blockchain and cannot be edited. It may have been deleted or never created on-chain.", { id: toastId });
      } else {
        toast.error(errorMsg, { id: toastId });
      }
    }
  };

  const handleDeleteRequest = async (id: string) => {
    let toastId = toast.loading("Deleting request on-chain...");
    try {
      const response = await api.delete(`/api/pharmacist/requests/${id}`);
      toast.success("Request deleted and removed from blockchain", { id: toastId });
      // Optionally show transaction info if available
      if (response.data && typeof response.data === 'object' && 'txHash' in response.data) {
        toast.info(`Tx Hash: ${(response.data as any).txHash}`);
      }
      // Refresh requests
      const res = await api.get("/api/pharmacist/requests");
      setRequests(res.data as Request[]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete request", { id: toastId });
    }
  };
  // Inventory State (single declaration)
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryData, setInventoryData] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState(null);

  // Get all drugs that are expiring soon (e.g., within 30 days)
  const expiringSoonDrugs = inventoryData.filter((item: any) => {
    // Check all batches for expiry
    if (!item.batches || item.batches.length === 0) return false;
    return item.batches.some((batch: any) => {
      if (!batch.expiry_date) return false;
      const expiry = new Date(batch.expiry_date);
      const now = new Date();
      const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 0 && diffDays <= 30;
    });
  });

  useEffect(() => {
    if (inventoryData && inventoryData.length > 0) {
      console.log('[DEBUG] inventoryData:', inventoryData);
      inventoryData.forEach(drug => {
        if (drug.batches) {
          drug.batches.forEach(batch => {
            console.log(`[DEBUG] Drug: ${drug.drug_name}, Batch: ${batch.batch_id}, Inventory Quantity: ${batch.inventory_quantity}`);
          });
        }
      });
    }
  }, [inventoryData]);
  const [selectedDistributorId, setSelectedDistributorId] = useState("");
  const [modalQuantity, setModalQuantity] = useState("");
  // Get all drugs that are low/out of stock
  const lowStockDrugs = inventoryData.filter((item: any) => {
    const minStock = typeof item.minStock === 'number' ? item.minStock : 1;
    return Number(item.quantity) <= minStock;
  });
  // Memoize batch selection for modal speed
  const getFirstAvailableBatch = React.useCallback((drug: any) => {
    if (drug.batches && drug.batches.length > 0) {
      return drug.batches.find((b: any) => Number(b.inventory_quantity) > 0) || drug.batches[0];
    }
    return null;
  }, []);

  // Show modal immediately, then fill fields asynchronously
  const openRequestModal = (drug: any) => {
    setShowRequestModal(true);
    setTimeout(() => {
      setSelectedDrugId(String(drug.drug_id));
      // Use availableDrugBatches for batch selection
      if (drug.availableDrugBatches && drug.availableDrugBatches.length > 0) {
        setAvailableBatches(drug.availableDrugBatches);
        setSelectedBatchId(String(drug.availableDrugBatches[0].batch_id));
        setSelectedDistributorId(String(drug.availableDrugBatches[0].distributorcompanyid || ""));
      } else {
        setAvailableBatches([]);
        setSelectedBatchId("");
        setSelectedDistributorId("");
      }
      setEditRequest({
        id: "new",
        drugId: String(drug.drug_id),
        batchId: drug.availableDrugBatches && drug.availableDrugBatches.length > 0 ? String(drug.availableDrugBatches[0].batch_id) : "",
        quantity: "",
        status: "pending",
        drugName: drug.drug_name
      });
      setEditQuantity("");
    }, 0);
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
      console.log('[DEBUG] Full inventory API response:', res.data);
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
    <>
      <DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
        <div className="min-h-screen bg-gray-50 py-8 px-2 md:px-8 space-y-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Inventory & Requests</h1>
          {/* Add general refresh button above Tabs */}
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" className="shadow-md" onClick={handleManualRefresh}>Refresh Page</Button>
          </div>
          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white rounded-xl shadow-sm mb-4">
              <TabsTrigger value="inventory" className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-purple-100 hover:text-purple-700">Inventory</TabsTrigger>
              <TabsTrigger value="requests" className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-pink-100 hover:text-pink-700">Requests</TabsTrigger>
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
              {/* Request Modal for Inventory Tab */}
              {showRequestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                    <h2 className="text-lg font-bold mb-2">Request Drug Batch</h2>
                    <div className="mb-4">
                      <label className="block text-sm font-medium">Drug</label>
                      <div>{editRequest?.drugName}</div>
                    </div>
                    {/* If availableBatches is set, show batch selection */}
                    {availableBatches.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium">Select Batch</label>
                        <select
                          value={selectedBatchId}
                          onChange={e => setSelectedBatchId(e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        >
                          {availableBatches.map(batch => (
                            <option key={batch.batch_id} value={batch.batch_id}>
                              {batch.batch_number} (Exp: {new Date(batch.expiry_date).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="mb-4">
                      <label className="block text-sm font-medium">Quantity</label>
                      <input
                        type="number"
                        value={modalQuantity}
                        onChange={e => setModalQuantity(e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        min={1}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button className="bg-gray-200 px-4 py-2 rounded" onClick={closeRequestModal}>Cancel</button>
                      <button className="bg-primary text-white px-4 py-2 rounded" onClick={handleModalRequest}>Request</button>
                    </div>
                  </div>
                </div>
              )}
              <Card className="rounded-xl shadow-lg border border-gray-200">
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
                        className="w-64 border-gray-300 rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-purple-100 to-pink-100 text-gray-700">
                          <th className="px-4 py-2 font-semibold text-left">Medication</th>
                          <th className="px-4 py-2 font-semibold text-left">Batch Number</th>
                          <th className="px-4 py-2 font-semibold text-left">Formulation</th>
                          <th className="px-4 py-2 font-semibold text-left">Dosage</th>
                          <th className="px-4 py-2 font-semibold text-left">Batches Available</th>
                          <th className="px-4 py-2 font-semibold text-left">Total Batch Quantity</th>
                          <th className="px-4 py-2 font-semibold text-left">Available Quantity</th>
                          <th className="px-4 py-2 font-semibold text-left">Expiry Date</th>
                          <th className="px-4 py-2 font-semibold text-left">Distributor</th>
                          <th className="px-4 py-2 font-semibold text-left">Status</th>
                          <th className="px-4 py-2 font-semibold text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryData.filter((item: any) => item.drug_name.toLowerCase().includes(searchTerm.toLowerCase())).map((drug: any) => {
                          const realBatches = (drug.batches || []).filter((batch: any) => batch.batch_id);
                          if (realBatches.length > 0) {
                            return realBatches.map((batch: any, idx: number) => {
                              let stockStatus = '';
                              if (Number(batch.available_quantity) === 0) {
                                stockStatus = 'Out of Stock';
                              } else if (Number(batch.available_quantity) < 10) {
                                stockStatus = 'Low Stock';
                              } else {
                                stockStatus = 'In Stock';
                              }
                              return (
                                <tr key={drug.drug_id + '-' + (batch.batch_id || idx)} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50" + " hover:bg-purple-50 transition-colors duration-150"}>
                                  <td className="px-4 py-2 rounded-l-xl">{drug.drug_name}</td>
                                  <td className="px-4 py-2">{batch.batch_number}</td>
                                  <td className="px-4 py-2">{drug.formulation}</td>
                                  <td className="px-4 py-2">{drug.dosageunit}</td>
                                  <td className="px-4 py-2">1</td>
                                  <td className="px-4 py-2">{batch.batch_quantity}</td>
                                  <td className="px-4 py-2">{batch.available_quantity}</td>
                                  <td className="px-4 py-2">{batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : '-'}</td>
                                  <td className="px-4 py-2">{batch.distributorcompanyid || '-'}</td>
                                  <td className="px-4 py-2">{stockStatus}</td>
                                  <td className="px-4 py-2 rounded-r-xl">
                                    <Button size="sm" variant="outline" className="rounded-lg shadow-sm" onClick={() => openRequestModal(drug)}>Request</Button>
                                  </td>
                                </tr>
                              );
                            });
                          } else if (drug.availableDrugBatches && drug.availableDrugBatches.length > 0) {
                            return drug.availableDrugBatches.map((batch: any, idx: number) => (
                              <tr key={drug.drug_id + '-available-' + (batch.batch_id || idx)} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50" + " hover:bg-pink-50 transition-colors duration-150"}>
                                <td className="px-4 py-2 rounded-l-xl">{drug.drug_name}</td>
                                <td className="px-4 py-2">{batch.batch_number}</td>
                                <td className="px-4 py-2">{drug.formulation}</td>
                                <td className="px-4 py-2">{drug.dosageunit}</td>
                                <td className="px-4 py-2">0</td>
                                <td className="px-4 py-2">{batch.batch_quantity}</td>
                                <td className="px-4 py-2">0</td>
                                <td className="px-4 py-2">{batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-2">{batch.distributorcompanyid || '-'}</td>
                                <td className="px-4 py-2">Available for Request</td>
                                <td className="px-4 py-2 rounded-r-xl">
                                  <Button size="sm" variant="outline" className="rounded-lg shadow-sm" onClick={() => openRequestModal(drug)}>Request</Button>
                                </td>
                              </tr>
                            ));
                          } else {
                            return (
                              <tr key={drug.drug_id + '-placeholder'} className="bg-white hover:bg-gray-100 transition-colors duration-150">
                                <td className="px-4 py-2 rounded-l-xl">{drug.drug_name}</td>
                                <td className="px-4 py-2">-</td>
                                <td className="px-4 py-2">{drug.formulation}</td>
                                <td className="px-4 py-2">{drug.dosageunit}</td>
                                <td className="px-4 py-2">0</td>
                                <td className="px-4 py-2">0</td>
                                <td className="px-4 py-2">0</td>
                                <td className="px-4 py-2">-</td>
                                <td className="px-4 py-2">-</td>
                                <td className="px-4 py-2">Out of Stock</td>
                                <td className="px-4 py-2 rounded-r-xl">
                                  <Button size="sm" variant="outline" className="rounded-lg shadow-sm" onClick={() => openRequestModal(drug)}>Request</Button>
                                </td>
                              </tr>
                            );
                          }
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="requests" className="space-y-4">
              {/* Requests Section */}
              <Card className="rounded-xl shadow-lg border border-gray-200">
                <CardHeader>
                  <CardTitle>Pharmacist Batch Requests</CardTitle>
                  <CardDescription>Request new drug batches from distributors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-pink-100 to-purple-100 text-gray-700">
                          <th className="px-4 py-2 font-semibold text-left">ID</th>
                          <th className="px-4 py-2 font-semibold text-left">Drug</th>
                          <th className="px-4 py-2 font-semibold text-left">Batch ID</th>
                          <th className="px-4 py-2 font-semibold text-left">Quantity</th>
                          <th className="px-4 py-2 font-semibold text-left">Status</th>
                          <th className="px-4 py-2 font-semibold text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requestsLoading ? (
                          <tr><td colSpan={6} className="text-center py-4">Loading requests...</td></tr>
                        ) : requestsError ? (
                          <tr><td colSpan={6} className="text-center text-red-500 py-4">{requestsError}</td></tr>
                        ) : requests.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-4">No requests found</td></tr>
                        ) : (
                          requests.map((r, idx) => (
                            <tr key={r.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50" + " hover:bg-purple-50 transition-colors duration-150"}>
                              <td className="px-4 py-2 rounded-l-xl">{r.id}</td>
                              <td className="px-4 py-2">{r.drugName ? r.drugName : r.drugId}</td>
                              <td className="px-4 py-2">{r.batchId || '-'}</td>
                              <td className="px-4 py-2">{r.quantity}</td>
                              <td className="px-4 py-2">{r.status}</td>
                              <td className="px-4 py-2 rounded-r-xl">
                                <Button variant="outline" size="sm" className="rounded-lg shadow-sm" onClick={() => handleEditRequest(r)}>Edit</Button>
                                <Button variant="destructive" size="sm" className="ml-2 rounded-lg shadow-sm" onClick={() => handleDeleteRequest(r.id)}>Delete</Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Edit Request Modal */}
                  {editRequestModal && editRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
                        <h2 className="text-xl font-bold mb-2">Edit Request</h2>
                        <p className="mb-2">Drug: <span className="font-semibold">{editRequest.drugName || editRequest.drugId}</span></p>
                        <div className="mb-4">
                          <label className="block mb-1">Quantity</label>
                          <input
                            type="number"
                            min={1}
                            value={editQuantity}
                            onChange={e => setEditQuantity(e.target.value)}
                            className="border px-2 py-1 rounded-lg w-full shadow-sm"
                            placeholder="Enter quantity"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" className="rounded-lg" onClick={closeEditRequestModal}>Cancel</Button>
                          <Button variant="default" className="rounded-lg" onClick={submitEditRequest} disabled={!editQuantity || isNaN(Number(editQuantity)) || Number(editQuantity) <= 0}>Save</Button>
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
    </>
  );
}
