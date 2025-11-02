import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  QrCode,
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

// Updated interface to match backend response
interface Prescription {
  prescriptionNo: string;
  doctorName: string;
  date: string;
  drug: string;
  status: string;
  qrCode?: string;
  hospital?: string;
  dosage?: string;
  duration?: string;
  instructions?: string;
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
  
  const navigate = useNavigate();

  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/patient/dashboard", active: false },
    { icon: FileText, label: "My Prescriptions", path: "/patient/prescriptions", active: true },
    { icon: QrCode, label: "QR Code Viewer", path: "/patient/qr-viewer", active: false },
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
  
  // ✅ Handle QR code viewing
  const handleViewQR = (prescription: Prescription) => {
    const prescriptionData = {
      prescriptionNo: prescription.prescriptionNo,
      doctorName: prescription.doctorName,
      drug: prescription.drug,
      date: prescription.date,
      status: prescription.status,
      qrCode: prescription.qrCode
    };
    
    localStorage.setItem('selectedPrescription', JSON.stringify(prescriptionData));
    navigate('/patient/qr-viewer');
  };

  // ✅ Render prescription row
  const renderPrescriptionRow = (p: Prescription) => (
    <tr key={p.prescriptionNo} className="border-t hover:bg-gray-50">
      <td className="px-4 py-3 font-mono text-sm">{p.prescriptionNo}</td>
      <td className="px-4 py-3">{p.doctorName}</td>
      <td className="px-4 py-3">{new Date(p.date).toLocaleDateString()}</td>
      <td className="px-4 py-3">{p.drug}</td>
      <td className="px-4 py-3">
        <Badge variant={
          p.status.toLowerCase() === "active" ? "secondary" :
          p.status.toLowerCase() === "dispensed" ? "default" : "destructive"
        }>
          {p.status}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => handleViewQR(p)}
          className="flex items-center gap-1"
        >
          <QrCode className="w-4 h-4" />
          View QR
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

        {/* Search & Filter */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search prescriptions..."
                  className="pl-10 focus:ring-primary"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Doctor Filter */}
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {uniqueDoctors.map((doctor) => (
                    <SelectItem key={doctor} value={doctor}>
                      {doctor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status.toLowerCase()}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
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
              Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions
            </div>
          </CardContent>
        </Card>

        {/* Prescription Table */}
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
                    <th className="px-4 py-3 text-left font-semibold">QR Code</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrescriptions.length > 0 ? (
                    filteredPrescriptions.map(renderPrescriptionRow)
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        No prescriptions found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MyPrescriptions;