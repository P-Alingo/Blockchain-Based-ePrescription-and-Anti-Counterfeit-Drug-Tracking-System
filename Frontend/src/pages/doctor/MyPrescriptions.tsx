import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  Shield,
  Activity,
  Search,
  Download,
  Eye,
  QrCode,
  Copy,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

dayjs.extend(isoWeek);

interface Prescription {
  id: string;
  patient_name: string;
  dob?: string;
  drug_name: string;
  dosage: string;
  dosage_amount?: string;
  dosage_unit?: string;
  frequency?: string;
  duration: number;
  instructions?: string;
  status: string;
  issued: string;
  valid: string;
  dispensed: boolean;
  qrcode?: string;
}

interface EditFormData {
  id: string;
  dosage_amount: string;
  dosage_unit: string;
  frequency: string;
  duration: number;
  instructions: string;
}

const MyPrescriptions: React.FC = () => {
  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/doctor/dashboard", active: false },
    { icon: FileText, label: "Create Prescription", path: "/doctor/create-prescription", active: false },
    { icon: Clock, label: "My Prescriptions", path: "/doctor/prescriptions", active: true },
    { icon: Activity, label: "Analytics", path: "/doctor/analytics", active: false },
  ];

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [editForm, setEditForm] = useState<EditFormData | null>(null);

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userName = userData.fullName || "Doctor";
  const userEmail = userData.email || "";

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<any[]>("http://localhost:4000/api/doctor/prescription", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: Prescription[] = res.data.map((p: any) => ({
        id: p.id.toString(),
        patient_name: p.patient_name || "Unknown",
        dob: p.patient_dob,
        drug_name: p.drug_name || "",
        dosage: p.dosage || "",
        dosage_amount: p.dosage_amount || "",
        dosage_unit: p.dosage_unit || "",
        frequency: p.frequency || "",
        duration: p.duration || 0,
        instructions: p.instructions || "",
        status: p.status || "",
        issued: p.issue_date || "",
        valid: p.valid_until || "",
        dispensed: p.status.toLowerCase() === "dispensed",
        qrcode: p.qrcode_path || p.qrcode || "",
      }));

      setPrescriptions(data);
      setFilteredPrescriptions(data);
    } catch (error: any) {
      console.error("Failed to fetch prescriptions:", error);
      toast.error(error.response?.data?.message || "Failed to load prescriptions");
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this prescription?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:4000/api/doctor/prescription/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Prescription deleted successfully");
      // Remove from UI
      setPrescriptions((prev) => prev.filter((p) => p.id !== id));
      setFilteredPrescriptions((prev) => prev.filter((p) => p.id !== id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete prescription");
    }
  };

  // Edit handlers
  const handleEdit = (prescription: Prescription) => {
    setEditForm({
      id: prescription.id,
      dosage_amount: prescription.dosage_amount || "",
      dosage_unit: prescription.dosage_unit || "",
      frequency: prescription.frequency || "",
      duration: prescription.duration || 0,
      instructions: prescription.instructions || "",
    });
    setEditModalOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: name === 'duration' ? Number(value) : value
      };
    });
  };

  const submitEdit = async () => {
    if (!editForm) return;
    try {
      const token = localStorage.getItem("token");
      
      // NOTE: You need to implement this endpoint in your backend
      await axios.put(`http://localhost:4000/api/doctor/prescription/${editForm.id}`, {
        dosageAmount: editForm.dosage_amount,
        dosageUnit: editForm.dosage_unit,
        frequency: editForm.frequency,
        duration: editForm.duration,
        instructions: editForm.instructions,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success("Prescription updated successfully");
      
      // Update local state
      setPrescriptions((prev) => 
        prev.map((p) => p.id === editForm.id ? { 
          ...p, 
          dosage_amount: editForm.dosage_amount,
          dosage_unit: editForm.dosage_unit,
          frequency: editForm.frequency,
          duration: editForm.duration,
          instructions: editForm.instructions
        } : p)
      );
      
      setFilteredPrescriptions((prev) => 
        prev.map((p) => p.id === editForm.id ? { 
          ...p, 
          dosage_amount: editForm.dosage_amount,
          dosage_unit: editForm.dosage_unit,
          frequency: editForm.frequency,
          duration: editForm.duration,
          instructions: editForm.instructions
        } : p)
      );
      
      setEditModalOpen(false);
    } catch (error: any) {
      console.error("Edit error:", error);
      toast.error(error.response?.data?.message || "Failed to update prescription");
    }
  };

  // Utility functions
  const calculateAge = (dob?: string) => {
    if (!dob) return "-";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("DD MMM YYYY");
  };

  // Filter logic
  useEffect(() => {
    let data = [...prescriptions];

    if (statusFilter !== "all") {
      data = data.filter((p) => p.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchQuery.trim() !== "") {
      const queryLower = searchQuery.toLowerCase();
      data = data.filter((p) => {
        const patient = (p.patient_name || "").toLowerCase();
        const drug = (p.drug_name || "").toLowerCase();
        const id = (p.id || "").toLowerCase();
        return patient.includes(queryLower) || drug.includes(queryLower) || id.includes(queryLower);
      });
    }

    if (dateFilter !== "all") {
      const today = dayjs();
      data = data.filter((p) => {
        const issuedDate = dayjs(p.issued);
        switch (dateFilter) {
          case "today":
            return issuedDate.isSame(today, "day");
          case "week":
            return issuedDate.isSame(today, "week");
          case "month":
            return issuedDate.isSame(today, "month");
          case "quarter":
            const currentQuarter = Math.floor(today.month() / 3) + 1;
            const prescriptionQuarter = Math.floor(issuedDate.month() / 3) + 1;
            return issuedDate.year() === today.year() && prescriptionQuarter === currentQuarter;
          default:
            return true;
        }
      });
    }

    setFilteredPrescriptions(data);
  }, [searchQuery, statusFilter, dateFilter, prescriptions]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "dispensed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const exportCSV = () => {
    const headers = ["Prescription ID", "Patient", "Age", "Drug", "Dosage", "Duration", "Status", "Issued", "Valid Until"];
    const rows = filteredPrescriptions.map((p) => [
      p.id,
      p.patient_name,
      calculateAge(p.dob),
      p.drug_name,
      `${p.dosage_amount} ${p.dosage_unit}`,
      p.duration,
      p.status,
      formatDate(p.issued),
      formatDate(p.valid),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `prescriptions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openQrModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setQrModalOpen(true);
  };

  const openDetailsModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDetailsModalOpen(true);
  };

  const copyQrLink = () => {
    if (selectedPrescription && selectedPrescription.qrcode) {
      navigator.clipboard.writeText(selectedPrescription.qrcode);
      toast.success("QR link copied to clipboard!");
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="doctor" userName={userName} userEmail={userEmail}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">My Prescriptions</h1>
            <p className="text-muted-foreground">Manage and track all your issued prescriptions</p>
          </div>
          <Button onClick={exportCSV} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="mr-2 w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Search & Filter */}
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by prescription ID, patient name, or drug..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="dispensed">Dispensed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Prescription List */}
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle>Prescription History</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPrescriptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No prescriptions found.</p>
            ) : (
              <div className="space-y-4">
                {filteredPrescriptions.map((p) => (
                  <div key={p.id} className="p-6 rounded-lg border bg-gray-50/50 hover:shadow-md transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-lg">#{p.id}</span>
                          {(() => {
                            const now = dayjs();
                            const validUntil = dayjs(p.valid);
                            let badgeText: string;
                            if (validUntil.isValid() && (now.isSame(validUntil, "day") || now.isAfter(validUntil, "day"))) {
                              badgeText = "Expired";
                            } else {
                              badgeText = p.status === "Pending" ? "Active" : p.status;
                            }
                            const badgeClass = getStatusColor(badgeText);
                            return <Badge className={`${badgeClass} border`}>{badgeText}</Badge>;
                          })()}
                          {p.dispensed && <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">Dispensed</Badge>}
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 text-sm">
                          <p><span className="font-medium">Patient:</span> {p.patient_name} ({calculateAge(p.dob)}y)</p>
                          <p><span className="font-medium">Drug:</span> {p.drug_name}</p>
                          <p>
                            <span className="font-medium">Dosage:</span> {p.dosage_amount || "-"} {p.dosage_unit || ""}
                          </p>
                          <p><span className="font-medium">Frequency:</span> {p.frequency || "-"}</p>
                          <p><span className="font-medium">Duration:</span> {p.duration} days</p>
                          <p><span className="font-medium">Instructions:</span> {p.instructions || "None"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => openDetailsModal(p)}>
                            <Eye className="mr-2 w-3 h-3" />View Details
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openQrModal(p)}>
                            <QrCode className="mr-2 w-3 h-3" />QR Code
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                            <Edit className="mr-2 w-3 h-3" />Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="mr-2 w-3 h-3" />Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Prescription Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[450px] bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-xl shadow-lg border border-blue-200">
            <DialogHeader>
              <DialogTitle className="text-blue-700 font-bold text-xl">Edit Prescription</DialogTitle>
            </DialogHeader>
            {editForm && (
              <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submitEdit(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-medium text-gray-700">Dosage Amount</label>
                    <Input 
                      type="text" 
                      name="dosage_amount" 
                      value={editForm.dosage_amount} 
                      onChange={handleEditChange} 
                      placeholder="e.g., 500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-medium text-gray-700">Dosage Unit</label>
                    <Input 
                      type="text" 
                      name="dosage_unit" 
                      value={editForm.dosage_unit} 
                      onChange={handleEditChange}
                      placeholder="e.g., mg" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-medium text-gray-700">Frequency</label>
                    <Input 
                      type="text" 
                      name="frequency" 
                      value={editForm.frequency} 
                      onChange={handleEditChange}
                      placeholder="e.g., Once daily" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-medium text-gray-700">Duration (days)</label>
                    <Input 
                      type="number" 
                      name="duration" 
                      value={editForm.duration} 
                      onChange={handleEditChange}
                      placeholder="e.g., 7" 
                    />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="font-medium text-gray-700">Instructions</label>
                    <textarea 
                      name="instructions" 
                      value={editForm.instructions} 
                      onChange={handleEditChange}
                      placeholder="Additional instructions for the patient"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
                  <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* QR Code Modal removed */}

        {/* Details Modal */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Prescription Details</DialogTitle>
            </DialogHeader>
            {selectedPrescription && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500">PRESCRIPTION ID</h4>
                    <p className="text-lg font-bold">#{selectedPrescription.id}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500">STATUS</h4>
                    <Badge className={getStatusColor(selectedPrescription.status)}>
                      {selectedPrescription.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">PATIENT INFORMATION</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <p><span className="font-medium">Name:</span> {selectedPrescription.patient_name}</p>
                    <p><span className="font-medium">Age:</span> {calculateAge(selectedPrescription.dob)} years</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">PRESCRIPTION DETAILS</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Drug:</span> {selectedPrescription.drug_name}</p>
                    <p><span className="font-medium">Dosage:</span> {selectedPrescription.dosage_amount} {selectedPrescription.dosage_unit}</p>
                    <p><span className="font-medium">Frequency:</span> {selectedPrescription.frequency || "Not specified"}</p>
                    <p><span className="font-medium">Duration:</span> {selectedPrescription.duration} days</p>
                    <p><span className="font-medium">Instructions:</span> {selectedPrescription.instructions || "None"}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">DATES</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <p><span className="font-medium">Issued:</span> {formatDate(selectedPrescription.issued)}</p>
                    <p><span className="font-medium">Valid Until:</span> {formatDate(selectedPrescription.valid)}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MyPrescriptions;