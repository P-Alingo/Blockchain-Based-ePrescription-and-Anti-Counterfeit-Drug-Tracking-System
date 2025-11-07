import { useEffect, useState } from "react";
import dayjs from "dayjs";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Activity,
  Search,
  Download,
  Shield,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Removed qrCode from Prescription interface
interface Prescription {
  prescriptionNo: string;
  doctorName: string;
  date: string;
  drug: string;
  status: string;
  hospital?: string;
  dosage?: string;
  duration?: string;
  instructions?: string;
  validUntil?: string;
  frequency?: string;
}

const MyPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("new");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalPrescription, setModalPrescription] = useState<Prescription | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  
  const navigate = useNavigate();

  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/patient/dashboard", active: false },
    { icon: FileText, label: "My Prescriptions", path: "/patient/prescriptions", active: true },
    { icon: Activity, label: "Analytics", path: "/patient/analytics", active: false },
  ];

  // Fetch patient prescriptions from backend
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const storedUserData = localStorage.getItem("userData");
        if (!storedUserData) {
          setError("User not logged in.");
          return;
        }
        const { token } = JSON.parse(storedUserData);
        const res = await axios.get(
          "http://localhost:4000/api/patient/prescriptions",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = Array.isArray(res.data) ? res.data : [];
        setPrescriptions(data);
        setFilteredPrescriptions(data);
      } catch (err) {
        console.error("Failed to fetch prescriptions:", err);
        setError("Failed to load prescriptions.");
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  // ✅ FIXED Filtering logic
  useEffect(() => {
    let filtered = [...prescriptions];

    // Search filter
    if (search.trim() !== "") {
      filtered = filtered.filter(
        (p) =>
          (p.prescriptionNo ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (p.drug ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (p.doctorName ?? "").toLowerCase().includes(search.toLowerCase())
      );
    }

    // Doctor filter
    if (doctorFilter !== "all") {
      filtered = filtered.filter((p) => p.doctorName === doctorFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Date filter - FIXED: Now uses the actual date from the prescription
    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((p) => {
        const issuedDate = new Date(p.date);
        if (isNaN(issuedDate.getTime())) return true; // Skip invalid dates
        
        const diffDays = Math.floor((now.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case "week":
            return diffDays <= 7;
          case "month":
            return diffDays <= 30;
          case "quarter":
            return diffDays <= 90;
          case "year":
            return diffDays <= 365;
          default:
            return true;
        }
      });
    }

    setFilteredPrescriptions(filtered);
  }, [search, doctorFilter, dateFilter, statusFilter, prescriptions]);

  // ✅ Export to CSV - UPDATED to match actual data structure
  const exportToCSV = () => {
    if (!filteredPrescriptions.length) {
      alert("No prescriptions to export.");
      return;
    }

    const headers = [
      "Prescription No",
      "Doctor",
      "Date Issued",
      "Drug",
      "Status",
      "Dosage",
      "Duration",
      "Instructions"
    ];

    const rows = filteredPrescriptions.map((p) => [
      p.prescriptionNo,
      p.doctorName,
      new Date(p.date).toLocaleDateString(),
      p.drug,
      p.status,
      p.dosage || 'N/A',
      p.duration || 'N/A',
      p.instructions || 'N/A'
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map(field => `"${field}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_prescriptions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Remove QR button and its logic

  const handleShowDetails = async (prescriptionNo: string) => {
    setModalLoading(true);
    setModalError("");
    setShowDetailsModal(true);
    try {
      const storedUserData = localStorage.getItem("userData");
      if (!storedUserData) throw new Error("User not logged in.");
      const { token } = JSON.parse(storedUserData);
      // Fetch prescription details from backend
      const res = await axios.get(
        `http://localhost:4000/api/patient/prescriptions/${prescriptionNo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalPrescription(res.data as Prescription);
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Failed to fetch prescription details.");
      setModalPrescription(null);
    } finally {
      setModalLoading(false);
    }
  };
  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setModalPrescription(null);
    setModalError("");
  };

  // ✅ Render prescription row
  const renderPrescriptionRow = (p: Prescription) => (
    <tr key={p.prescriptionNo} className="border-t hover:bg-gray-50">
      <td className="px-4 py-3 font-mono text-sm">{p.prescriptionNo}</td>
      <td className="px-4 py-3">{p.doctorName}</td>
  <td className="px-4 py-3">{dayjs(p.date).isValid() ? dayjs(p.date).format("DD MMM YYYY") : "-"}</td>
      <td className="px-4 py-3">{p.drug}</td>
      <td className="px-4 py-3">
        <Badge variant={
          p.status.toLowerCase() === "issued" ? "secondary" :
          p.status.toLowerCase() === "dispensed" ? "default" : "destructive"
        }>
          {p.status.toLowerCase() === "issued" ? "Active" : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Button size="sm" variant="outline" onClick={() => handleShowDetails(p.prescriptionNo)}>
          Details
        </Button>
      </td>
    </tr>
  );

  // Get unique doctors and statuses for filters
  const uniqueDoctors = Array.from(new Set(prescriptions.map(p => p.doctorName))).filter(Boolean);
  const uniqueStatuses = Array.from(new Set(prescriptions.map(p => p.status))).filter(Boolean);

  // Get user info
  const storedUserData = localStorage.getItem("userData");
  let userName = "Patient";
  let userEmail = "";
  if (storedUserData) {
    try {
      const userData = JSON.parse(storedUserData);
      userName = userData.fullName || userData.name || userData.username || userData.email || "Patient";
      userEmail = userData.email || "";
    } catch (e) {
      // fallback to defaults
    }
  }

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout
        sidebarItems={sidebarItems}
        userRole="patient"
        userName={userName}
        userEmail={userEmail}
      >
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading prescriptions...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout
        sidebarItems={sidebarItems}
        userRole="patient"
        userName={userName}
        userEmail={userEmail}
      >
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="patient"
      userName={userName}
      userEmail={userEmail}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-green-600">My Prescriptions</h1>
            <p className="text-muted-foreground">View and manage all your prescription history</p>
          </div>
          <Button className="btn-gradient-primary" onClick={exportToCSV}>
            <Download className="mr-2 w-4 h-4" />
            Export Summary
          </Button>
        </div>
        <Tabs defaultValue="new" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="new">New Prescriptions</TabsTrigger>
            <TabsTrigger value="history">Prescription History</TabsTrigger>
          </TabsList>
          <TabsContent value="new" className="space-y-4">
            {/* Search & Filter for new prescriptions */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Search & Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search Bar */}
                  <Input
                    type="text"
                    placeholder="Search by prescription no, drug, or doctor..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full"
                  />
                  {/* Doctor Filter */}
                  <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Doctors</SelectItem>
                      {uniqueDoctors.map((doc) => (
                        <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {uniqueStatuses.map((status) => (
                        <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Date Filter */}
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Results Count */}
                <div className="mt-4 text-sm text-muted-foreground">
                  Showing {filteredPrescriptions.filter(p => p.status.toLowerCase() !== "dispensed").length} of {prescriptions.filter(p => p.status.toLowerCase() !== "dispensed").length} new prescriptions
                </div>
              </CardContent>
            </Card>
            {/* New Prescriptions Table */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>New Prescriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left font-semibold">Prescription No</th>
                        <th className="px-4 py-3 text-left font-semibold">Doctor</th>
                        <th className="px-4 py-3 text-left font-semibold">Date Issued</th>
                        <th className="px-4 py-3 text-left font-semibold">Drug</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrescriptions.filter(p => p.status.toLowerCase() !== "dispensed").length > 0 ? (
                        filteredPrescriptions.filter(p => p.status.toLowerCase() !== "dispensed").map(renderPrescriptionRow)
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground">
                            No new prescriptions found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="history" className="space-y-4">
            {/* Search & Filter for history */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Search & Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search Bar */}
                  <Input
                    type="text"
                    placeholder="Search by prescription no, drug, or doctor..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full"
                  />
                  {/* Doctor Filter */}
                  <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Doctors</SelectItem>
                      {uniqueDoctors.map((doc) => (
                        <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {uniqueStatuses.map((status) => (
                        <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Date Filter */}
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Results Count */}
                <div className="mt-4 text-sm text-muted-foreground">
                  Showing {filteredPrescriptions.filter(p => p.status.toLowerCase() === "dispensed").length} of {prescriptions.filter(p => p.status.toLowerCase() === "dispensed").length} dispensed prescriptions
                </div>
              </CardContent>
            </Card>
            {/* Prescription History Table */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Prescription History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left font-semibold">Prescription No</th>
                        <th className="px-4 py-3 text-left font-semibold">Doctor</th>
                        <th className="px-4 py-3 text-left font-semibold">Date Issued</th>
                        <th className="px-4 py-3 text-left font-semibold">Drug</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrescriptions.filter(p => p.status.toLowerCase() === "dispensed").length > 0 ? (
                        filteredPrescriptions.filter(p => p.status.toLowerCase() === "dispensed").map(renderPrescriptionRow)
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground">
                            No dispensed prescriptions found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal for prescription details */}
        {showDetailsModal && (
          <Dialog open={showDetailsModal} onOpenChange={handleCloseModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Prescription Details</DialogTitle>
              </DialogHeader>
              {modalLoading ? (
                <div>Loading...</div>
              ) : modalError ? (
                <div className="text-red-500">{modalError}</div>
              ) : modalPrescription ? (
                <div className="space-y-2">
                  <div><strong>Prescription No:</strong> {modalPrescription.prescriptionNo}</div>
                  <div><strong>Doctor:</strong> {modalPrescription.doctorName}</div>
                  <div><strong>Date Issued:</strong> {dayjs(modalPrescription.date).isValid() ? dayjs(modalPrescription.date).format("DD MMM YYYY") : "-"}</div>
                  <div><strong>Valid Until:</strong> {modalPrescription.validUntil ? dayjs(modalPrescription.validUntil).format("DD MMM YYYY") : "-"}</div>
                  <div><strong>Drug:</strong> {modalPrescription.drug}</div>
                  <div><strong>Status:</strong> {modalPrescription.status}</div>
                  <div><strong>Dosage:</strong> {modalPrescription.dosage}</div>
                  <div><strong>Frequency:</strong> {modalPrescription.frequency}</div>
                  <div><strong>Duration:</strong> {modalPrescription.duration ? `${modalPrescription.duration} days` : "-"}</div>
                  <div><strong>Instructions:</strong> {modalPrescription.instructions}</div>
                  <div><strong>Hospital:</strong> {modalPrescription.hospital}</div>
                </div>
              ) : null}
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={handleCloseModal}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyPrescriptions;