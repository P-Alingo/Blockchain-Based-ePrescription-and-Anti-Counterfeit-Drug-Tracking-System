import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Package2,
  Search,
  Filter,
  Download,
  Calendar,
  Shield,
  Beaker,
  Activity,
  Plus,
  Package,
  List,
  Loader2,
  QrCode,
  RefreshCw,
  Edit,
  Trash2,
} from "lucide-react";

// TypeScript interfaces for better type safety
interface Batch {
  id: number;
  batchnumber: string;
  shipment_number?: string;
  drugid: number;
  drugname: string;
  manufacturedate: string;
  expirydate: string;
  quantity: number;
  status: string;
  qrcode: string;
  manufacturername: string;
  qualitycontrolofficerid?: number;
  qualityofficer: string;
  storagetemperature?: number;
  manufacturingfacility?: string;
  datechecked?: string;
  blockchaintx?: string;
  distributorcompanyid?: number;
  distributorcompany?: string;
  distributorfacility?: string;
}

interface EditBatchForm {
  drugid: number;
  manufacturedate: string;
  expirydate: string;
  quantity: number;
  storagetemperature?: number;
  manufacturingfacility?: string;
  qualitycontrolofficerid?: number;
  datechecked?: string;
  status: string;
  distributorcompanyid?: number;
}

interface Drug {
  id: number;
  name: string;
}

interface QualityOfficer {
  id: number;
  fullname: string;
}

interface Distributor {
  id: number;
  display_name: string;
  name: string;
  facility: string;
}

const BatchList = () => {
  const sidebarItems = [
    { icon: Package, label: "Dashboard", path: "/manufacturer/dashboard", active: false },
    { icon: Plus, label: "Register Batch", path: "/manufacturer/register-batch", active: false },
    { icon: List, label: "Batch List", path: "/manufacturer/batch-list", active: true },
    { icon: Shield, label: "Blockchain Verification", path: "/manufacturer/blockchain-verification", active: false },
    { icon: Activity, label: "Activity Logs", path: "/manufacturer/activity-logs", active: false },
  ];

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [qualityOfficers, setQualityOfficers] = useState<QualityOfficer[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);

  // Initialize edit form with default values
  const defaultEditForm: EditBatchForm = {
    drugid: 0,
    manufacturedate: "",
    expirydate: "",
    quantity: 0,
    storagetemperature: undefined,
    manufacturingfacility: "",
    qualitycontrolofficerid: undefined,
    datechecked: "",
    status: "pending",
    distributorcompanyid: undefined
  };

  const [editForm, setEditForm] = useState<EditBatchForm>(defaultEditForm);

  // Date formatting utility
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Fetch batches from backend with authentication
  const fetchBatches = async () => {
    try {
      console.log("🔄 Starting batch refresh...");
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("❌ No token found");
        toast.error("No authentication token found. Please log in again.");
        setError("Authentication required");
        return;
      }

      const res = await axios.get<Batch[]>("http://localhost:4000/api/drugbatch", {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`✅ Received ${res.data.length} batches`);
      
      setBatches([...res.data]);
      setRefreshCount(prev => prev + 1);
      
      toast.success(`Refreshed ${res.data.length} batches`);
    } catch (error: any) {
      console.error("❌ Error fetching batches:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch batches";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log("🔄 Batch refresh completed");
    }
  };

  // Fetch dropdown data for edit form
  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get<{ 
        drugs: Drug[]; 
        qualityOfficers: QualityOfficer[];
        distributors: Distributor[];
      }>("http://localhost:4000/api/drugbatch/form/dropdowns", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDrugs(res.data.drugs || []);
      setQualityOfficers(res.data.qualityOfficers || []);
      setDistributors(res.data.distributors || []);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchDropdownData();
  }, []);

  // Status badge with proper configuration
  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline"; className: string; label: string } } = {
      pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-800", label: "Pending" },
      "under review": { variant: "secondary", className: "bg-blue-100 text-blue-800", label: "Under Review" },
      approved: { variant: "default", className: "bg-green-100 text-green-800", label: "Approved" },
      rejected: { variant: "destructive", className: "", label: "Rejected" },
      active: { variant: "default", className: "bg-green-100 text-green-800", label: "Active" },
      expired: { variant: "destructive", className: "", label: "Expired" },
      completed: { variant: "default", className: "bg-green-100 text-green-800", label: "Completed" },
      "in production": { variant: "secondary", className: "bg-blue-100 text-blue-800", label: "In Production" },
    };

    const config = statusConfig[status?.toLowerCase()] || { 
      variant: "outline" as const, 
      className: "", 
      label: status || "Unknown" 
    };

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Handle Edit Button Click
  const handleEditClick = (batch: Batch) => {
    setSelectedBatch(batch);
    setEditForm({
      drugid: batch.drugid || 0,
      manufacturedate: formatDate(batch.manufacturedate),
      expirydate: formatDate(batch.expirydate),
      quantity: batch.quantity || 0,
      storagetemperature: batch.storagetemperature,
      manufacturingfacility: batch.manufacturingfacility || "",
      qualitycontrolofficerid: batch.qualitycontrolofficerid,
      datechecked: batch.datechecked ? formatDate(batch.datechecked) : "",
      status: batch.status?.toLowerCase() || "pending",
      distributorcompanyid: batch.distributorcompanyid
    });
    setShowEditDialog(true);
  };

  // Handle Edit Form Submit
  const handleEditSubmit = async () => {
    if (!selectedBatch) return;

    try {
      setEditLoading(true);
      const token = localStorage.getItem("token");
      
      // Prepare payload with only changed fields
      const payload: any = {};
      
      if (editForm.drugid && editForm.drugid !== selectedBatch.drugid) payload.drugid = editForm.drugid;
      if (editForm.manufacturedate && editForm.manufacturedate !== formatDate(selectedBatch.manufacturedate)) 
        payload.manufacturedate = editForm.manufacturedate;
      if (editForm.expirydate && editForm.expirydate !== formatDate(selectedBatch.expirydate)) 
        payload.expirydate = editForm.expirydate;
      if (editForm.quantity !== selectedBatch.quantity) payload.quantity = editForm.quantity;
      if (editForm.storagetemperature !== selectedBatch.storagetemperature) 
        payload.storagetemperature = editForm.storagetemperature;
      if (editForm.manufacturingfacility !== selectedBatch.manufacturingfacility) 
        payload.manufacturingfacility = editForm.manufacturingfacility;
      
      // Handle quality control officer - properly handle "not-assigned" value
      if (editForm.qualitycontrolofficerid !== selectedBatch.qualitycontrolofficerid) {
        payload.qualitycontrolofficerid = editForm.qualitycontrolofficerid === -1 ? null : editForm.qualitycontrolofficerid;
      }
      
      // Handle distributor company - properly handle "not-assigned" value
      if (editForm.distributorcompanyid !== selectedBatch.distributorcompanyid) {
        payload.distributorcompanyid = editForm.distributorcompanyid === -1 ? null : editForm.distributorcompanyid;
      }
      
      if (editForm.datechecked !== (selectedBatch.datechecked ? formatDate(selectedBatch.datechecked) : "")) 
        payload.datechecked = editForm.datechecked;
      if (editForm.status !== selectedBatch.status?.toLowerCase()) 
        payload.status = editForm.status;

      // Only send request if there are changes
      if (Object.keys(payload).length === 0) {
        toast.info("No changes detected");
        setShowEditDialog(false);
        return;
      }

      const response = await axios.put(
        `http://localhost:4000/api/drugbatch/${selectedBatch.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Batch updated successfully!");
      setShowEditDialog(false);
      
      // Refresh the batches list to show updated data
      setTimeout(() => {
        fetchBatches();
      }, 500);
    } catch (error: any) {
      console.error("Error updating batch:", error);
      const errorMessage = error.response?.data?.message || "Failed to update batch";
      toast.error(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Delete Batch
  const handleDeleteBatch = async () => {
    if (!selectedBatch) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("token");
      
      await axios.delete(
        `http://localhost:4000/api/drugbatch/${selectedBatch.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Batch deleted successfully!");
      setShowDeleteDialog(false);
      
      // Force immediate refresh
      fetchBatches();
    } catch (error: any) {
      console.error("Error deleting batch:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete batch";
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Delete Button Click
  const handleDeleteClick = (batch: Batch) => {
    setSelectedBatch(batch);
    setShowDeleteDialog(true);
  };

  // Search + Filter logic
  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batchnumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.drugname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.manufacturername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.shipment_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      batch.status?.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  // Handle QR code modal
  const handleViewQRCode = (batch: Batch) => {
    setSelectedBatch(batch);
    setShowQrDialog(true);
  };

  // Export to CSV
  const handleExport = () => {
    if (filteredBatches.length === 0) {
      toast.error("No batches available to export.");
      return;
    }

    const headers = ["Batch Number", "Shipment Number", "Drug Name", "Manufacturer", "Manufacture Date", "Expiry Date", "Quantity", "Status", "Quality Officer", "Distributor"];
    const rows = filteredBatches.map((batch) => [
      batch.batchnumber || "N/A",
      batch.shipment_number || "N/A",
      batch.drugname || "Unknown",
      batch.manufacturername || "N/A",
      formatDate(batch.manufacturedate),
      formatDate(batch.expirydate),
      batch.quantity || "",
      batch.status || "",
      batch.qualityofficer || "Not Assigned",
      batch.distributorcompany || "Not Assigned",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `batches_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filteredBatches.length} batches successfully`);
  };

  // Get status counts for statistics
  const statusCounts = {
    total: batches.length,
    pending: batches.filter(b => b.status?.toLowerCase() === "pending").length,
    approved: batches.filter(b => b.status?.toLowerCase() === "approved").length,
    active: batches.filter(b => b.status?.toLowerCase() === "active").length,
    rejected: batches.filter(b => b.status?.toLowerCase() === "rejected").length,
    underReview: batches.filter(b => b.status?.toLowerCase() === "under review").length,
    completed: batches.filter(b => b.status?.toLowerCase() === "completed").length,
    inProduction: batches.filter(b => b.status?.toLowerCase() === "in production").length,
  };

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userName = userData.fullName || "Manufacturer";
  const userEmail = userData.email || "manufacturer@pharma.co.ke";

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="manufacturer"
      userName={userName}
      userEmail={userEmail}
    >
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Batch Management
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage all pharmaceutical production batches
          </p>
          <div className="text-xs text-gray-500 mt-1">
            Last refreshed: {new Date().toLocaleTimeString()} | Refresh count: {refreshCount}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button className="flex items-center gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export Batches
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={fetchBatches}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-primary/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
                <p className="text-sm text-muted-foreground">Total Batches</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.approved + statusCounts.active + statusCounts.completed}</p>
                <p className="text-sm text-muted-foreground">Approved/Active</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.pending + statusCounts.underReview + statusCounts.inProduction}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Beaker className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Section */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle>Production Batches</CardTitle>
                <CardDescription>Comprehensive view of all manufactured pharmaceutical batches</CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Batches</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under review">Under Review</SelectItem>
                      <SelectItem value="in production">In Production</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
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
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading batches...</span>
              </div>
            ) : error ? (
              <div className="text-center py-6">
                <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-red-500 mb-2">{error}</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={fetchBatches} variant="outline">
                    Try Again
                  </Button>
                  <Button onClick={() => {
                    setError(null);
                    fetchBatches();
                  }} variant="default">
                    Retry
                  </Button>
                </div>
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="text-center py-6">
                <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No batches found</p>
                {searchTerm || filterStatus !== "all" ? (
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Get started by creating your first batch
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Shipment Number</TableHead>
                      <TableHead>Drug Name</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Manufacture Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quality Officer</TableHead>
                      <TableHead>Distributor</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredBatches.map((batch) => (
                      <TableRow key={batch.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-medium">
                          {batch.batchnumber || "N/A"}
                        </TableCell>
                        <TableCell className="font-mono">
                          {batch.shipment_number || "N/A"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {batch.drugname || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {batch.manufacturername || "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatDate(batch.manufacturedate)}
                        </TableCell>
                        <TableCell>
                          {formatDate(batch.expirydate)}
                        </TableCell>
                        <TableCell>
                          {batch.quantity ? `${batch.quantity.toLocaleString()} units` : "N/A"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(batch.status)}
                        </TableCell>
                        <TableCell>
                          {batch.qualityofficer || "Not Assigned"}
                        </TableCell>
                        <TableCell>
                          {batch.distributorcompany || "Not Assigned"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewQRCode(batch)}
                              disabled={!batch.qrcode}
                              title="View QR Code"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(batch)}
                              title="Edit Batch"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(batch)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete Batch"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Dialog */}
        <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
          <DialogContent className="max-w-md text-center">
            <DialogHeader>
              <DialogTitle>Batch QR Code</DialogTitle>
              <DialogDescription>
                Scan or save this QR code for tracking and verification purposes.
              </DialogDescription>
            </DialogHeader>

            {selectedBatch && selectedBatch.qrcode ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <img
                  src={selectedBatch.qrcode}
                  alt={`QR Code for ${selectedBatch.batchnumber}`}
                  className="w-48 h-48 border rounded-lg shadow-md"
                />
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Batch Number:</strong> {selectedBatch.batchnumber}</p>
                  <p><strong>Shipment Number:</strong> {selectedBatch.shipment_number}</p>
                  <p><strong>Drug Name:</strong> {selectedBatch.drugname}</p>
                  <p><strong>Manufacturer:</strong> {selectedBatch.manufacturername}</p>
                  <p><strong>Status:</strong> {selectedBatch.status}</p>
                  {selectedBatch.qualityofficer && (
                    <p><strong>Quality Officer:</strong> {selectedBatch.qualityofficer}</p>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedBatch.qrcode;
                    link.download = `qr_code_${selectedBatch.batchnumber}.png`;
                    link.click();
                  }}
                >
                  Download QR Code
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No QR code available for this batch.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Batch Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Batch - {selectedBatch?.batchnumber}</DialogTitle>
              <DialogDescription>
                Update the batch information. Only changed fields will be updated.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {/* Drug Selection */}
              <div className="space-y-2">
                <Label htmlFor="drugid">Drug</Label>
                <Select 
                  value={editForm.drugid?.toString() || ""} 
                  onValueChange={(value) => setEditForm({...editForm, drugid: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select drug" />
                  </SelectTrigger>
                  <SelectContent>
                    {drugs.map((drug) => (
                      <SelectItem key={drug.id} value={drug.id.toString()}>
                        {drug.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={editForm.quantity || ""}
                  onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 0})}
                  placeholder="Enter quantity"
                />
              </div>

              {/* Manufacture Date */}
              <div className="space-y-2">
                <Label htmlFor="manufacturedate">Manufacture Date</Label>
                <Input
                  id="manufacturedate"
                  type="date"
                  value={editForm.manufacturedate || ""}
                  onChange={(e) => setEditForm({...editForm, manufacturedate: e.target.value})}
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="expirydate">Expiry Date</Label>
                <Input
                  id="expirydate"
                  type="date"
                  value={editForm.expirydate || ""}
                  onChange={(e) => setEditForm({...editForm, expirydate: e.target.value})}
                />
              </div>

              {/* Storage Temperature */}
              <div className="space-y-2">
                <Label htmlFor="storagetemperature">Storage Temperature (°C)</Label>
                <Input
                  id="storagetemperature"
                  type="number"
                  value={editForm.storagetemperature || ""}
                  onChange={(e) => setEditForm({...editForm, storagetemperature: e.target.value ? parseFloat(e.target.value) : undefined})}
                  placeholder="e.g., 20"
                />
              </div>

              {/* Manufacturing Facility */}
              <div className="space-y-2">
                <Label htmlFor="manufacturingfacility">Manufacturing Facility</Label>
                <Input
                  id="manufacturingfacility"
                  value={editForm.manufacturingfacility || ""}
                  onChange={(e) => setEditForm({...editForm, manufacturingfacility: e.target.value})}
                  placeholder="Enter facility name"
                />
              </div>

              {/* Quality Control Officer */}
              <div className="space-y-2">
                <Label htmlFor="qualitycontrolofficerid">Quality Control Officer</Label>
                <Select 
                  value={editForm.qualitycontrolofficerid?.toString() || "not-assigned"} 
                  onValueChange={(value) => setEditForm({
                    ...editForm, 
                    qualitycontrolofficerid: value === "not-assigned" ? -1 : parseInt(value)
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality officer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-assigned">Not Assigned</SelectItem>
                    {qualityOfficers.map((officer) => (
                      <SelectItem key={officer.id} value={officer.id.toString()}>
                        {officer.fullname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Distributor Company */}
              <div className="space-y-2">
                <Label htmlFor="distributorcompanyid">Distributor Company</Label>
                <Select 
                  value={editForm.distributorcompanyid?.toString() || "not-assigned"} 
                  onValueChange={(value) => setEditForm({
                    ...editForm, 
                    distributorcompanyid: value === "not-assigned" ? -1 : parseInt(value)
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select distributor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-assigned">Not Assigned</SelectItem>
                    {distributors.map((distributor) => (
                      <SelectItem key={distributor.id} value={distributor.id.toString()}>
                        {distributor.display_name || distributor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Checked */}
              <div className="space-y-2">
                <Label htmlFor="datechecked">Date Checked</Label>
                <Input
                  id="datechecked"
                  type="date"
                  value={editForm.datechecked || ""}
                  onChange={(e) => setEditForm({...editForm, datechecked: e.target.value})}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={editForm.status || "pending"} 
                  onValueChange={(value) => setEditForm({...editForm, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under review">Under Review</SelectItem>
                    <SelectItem value="in production">In Production</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={editLoading}
              >
                {editLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Batch"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the batch{" "}
                <strong>{selectedBatch?.batchnumber}</strong> and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteBatch}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete Batch"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default BatchList;