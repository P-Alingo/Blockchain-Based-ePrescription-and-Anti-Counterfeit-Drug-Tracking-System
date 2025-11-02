import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  QrCode,
  Bell,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Prescription {
  id: string;
  doctor: string;
  hospital?: string;
  drug: string;
  dosage: string;
  duration: string;
  issued: string;
  expires?: string;
  completed?: string;
  expired?: string;
  daysLeft?: number;
  taken: number;
  total: number;
  status: "Active" | "Completed" | "Expired";
}

const MyPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/patient/dashboard", active: false },
    { icon: FileText, label: "My Prescriptions", path: "/patient/prescriptions", active: true },
    { icon: QrCode, label: "QR Code Viewer", path: "/patient/qr-viewer", active: false },
    { icon: Activity, label: "Analytics", path: "/patient/analytics", active: false },
    // Removed My Alerts and Activity Logs, added Analytics
  ];

  // Fetch patient prescriptions from backend (new API)
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
        setError("Failed to load prescriptions.");
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  // ✅ Filtering logic
  useEffect(() => {
    let filtered = [...prescriptions];

    if (search.trim() !== "") {
      filtered = filtered.filter(
        (p) =>
          (p.id ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (p.drug ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (p.doctor ?? "").toLowerCase().includes(search.toLowerCase())
      );
    }

    if (doctorFilter !== "all") {
      filtered = filtered.filter((p) => p.doctor === doctorFilter);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((p) => {
        const issuedDate = new Date(p.issued);
        const diffDays = (now.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24);
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
  }, [search, doctorFilter, dateFilter, prescriptions]);

  const getProgressPercentage = (taken: number, total: number) =>
    total === 0 ? 0 : Math.round((taken / total) * 100);

  const activePrescriptions = filteredPrescriptions.filter((p) => p.status === "Active");
  const completedPrescriptions = filteredPrescriptions.filter((p) => p.status === "Completed");
  const expiredPrescriptions = filteredPrescriptions.filter((p) => p.status === "Expired");

  // ✅ Export to CSV
  const exportToCSV = () => {
    if (!filteredPrescriptions.length) {
      alert("No prescriptions to export.");
      return;
    }

    const headers = [
      "ID",
      "Doctor",
      "Hospital",
      "Drug",
      "Dosage",
      "Duration",
      "Issued",
      "Expires",
      "Status",
      "Taken",
      "Total",
    ];

    const rows = filteredPrescriptions.map((p) => [
      p.id,
      p.doctor,
      p.hospital,
      p.drug,
      p.dosage,
      p.duration,
      p.issued,
      p.expires,
      p.status,
      p.taken,
      p.total,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_prescriptions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Table row for prescription
  const renderPrescriptionRow = (p: any) => (
    <tr key={p.prescriptionNo} className="border-t">
      <td className="px-4 py-2 font-mono">{p.prescriptionNo}</td>
      <td className="px-4 py-2">{p.doctorName}</td>
      <td className="px-4 py-2">{new Date(p.date).toLocaleDateString()}</td>
      <td className="px-4 py-2">{p.drug}</td>
      <td className="px-4 py-2">
        <Badge variant={
          p.status === "Active" ? "secondary" :
          p.status === "Dispensed" ? "default" : "destructive"
        }>{p.status}</Badge>
      </td>
      <td className="px-4 py-2">
        <Button size="sm" variant="outline">
          <a href={`/patient/qr-viewer?prescription=${p.prescriptionNo}`}>View QR</a>
        </Button>
      </td>
    </tr>
  );

  // Get userName and userEmail from localStorage or set default values
  const storedUserData = localStorage.getItem("userData");
  let userName = "Patient";
  let userEmail = "";
  if (storedUserData) {
    try {
      const userData = JSON.parse(storedUserData);
      // Use fullName, name, or username if available, else fallback to email
      userName = userData.fullName || userData.name || userData.username || userData.email || "Patient";
      userEmail = userData.email || "";
    } catch (e) {
      // fallback to defaults
    }
  }

return (
  <DashboardLayout
    sidebarItems={sidebarItems.map((item) => ({
      ...item,
      active: item.path === "/patient/prescriptions",
    }))}
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by prescription ID, drug name, or doctor..."
                className="pl-10 focus:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                {Array.from(new Set(prescriptions.map((p) => p.doctor))).map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-48">
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
        </CardContent>
      </Card>

      {/* Prescription Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Prescription History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Prescription No</th>
                  <th className="px-4 py-2 text-left">Doctor</th>
                  <th className="px-4 py-2 text-left">Date Issued</th>
                  <th className="px-4 py-2 text-left">Drug</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">QR View</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.length > 0 ? (
                  filteredPrescriptions.map(renderPrescriptionRow)
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted-foreground">No prescriptions found.</td>
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
