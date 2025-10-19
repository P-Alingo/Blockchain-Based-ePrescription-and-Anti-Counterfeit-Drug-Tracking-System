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
    { icon: Bell, label: "My Alerts", path: "/patient/alerts", active: false },
    { icon: Activity, label: "Activity Logs", path: "/patient/activity-logs", active: false },
  ];

  // ✅ Fetch patient prescriptions from backend
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const storedUserData = localStorage.getItem("userData");
        if (!storedUserData) {
          console.error("⚠️ No user data found in localStorage");
          setError("User not logged in.");
          return;
        }

        const { token } = JSON.parse(storedUserData);

        const res = await axios.get<{ prescriptions: any[] }>(
          "http://localhost:4000/api/prescriptions/patient",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = Array.isArray(res.data?.prescriptions)
          ? res.data.prescriptions
          : [];

        console.log("✅ API Response:", data);

        const mapped: Prescription[] = data.map((p: any) => ({
          id: p.id?.toString() || "",
          doctor: p.doctor_name || p.doctor || "Unknown Doctor",
          hospital: p.hospital || "N/A",
          drug: p.drug_name || p.drug || "Unknown Drug",
          dosage: p.dosage || "-",
          duration: p.duration?.toString() || "-",
          issued: p.issue_date
            ? new Date(p.issue_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-",
          expires: p.valid_until
            ? new Date(p.valid_until).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-",
          completed: p.completed || "",
          expired: p.expired || "",
          daysLeft:
            p.status === "Active" && (p.valid_until || p.expires)
              ? Math.ceil(
                  (new Date(p.valid_until || p.expires).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : undefined,
          taken: p.taken || 0,
          total: p.total || 1,
          status: p.status || "Active",
        }));

        setPrescriptions(mapped);
        setFilteredPrescriptions(mapped);
      } catch (err) {
        console.error("❌ Error fetching prescriptions:", err);
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

  const renderPrescriptionCard = (p: Prescription) => (
    <div key={p.id} className="p-6 rounded-lg border bg-muted/30 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">{p.drug}</h2>
        <Badge
          variant={
            p.status === "Active"
              ? "secondary"
              : p.status === "Completed"
              ? "default"
              : "destructive"
          }
        >
          {p.status}
        </Badge>
      </div>
      <p><strong>Doctor:</strong> {p.doctor}</p>
      <p><strong>Hospital:</strong> {p.hospital}</p>
      <p><strong>Dosage:</strong> {p.dosage}</p>
      <p><strong>Duration:</strong> {p.duration} days</p>
      <p><strong>Issued:</strong> {p.issued}</p>
      <p><strong>Expires:</strong> {p.expires || "-"}</p>
      {p.status === "Active" && (
        <div className="mt-2">
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-green-500 rounded-full"
              style={{ width: `${getProgressPercentage(p.taken, p.total)}%` }}
            ></div>
          </div>
          <p className="text-sm mt-1">{p.taken} of {p.total} taken</p>
        </div>
      )}
    </div>
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

      {/* Prescriptions Tabs */}
      <Card className="card-elevated">
        <CardContent className="p-0">
          <Tabs defaultValue="active" className="w-full">
            <div className="p-6 pb-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="active">Active ({activePrescriptions.length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({completedPrescriptions.length})</TabsTrigger>
                <TabsTrigger value="expired">Expired ({expiredPrescriptions.length})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="active" className="p-6 pt-4">
              {loading ? (
                <p>Loading prescriptions...</p>
              ) : activePrescriptions.length === 0 ? (
                <p>No active prescriptions found.</p>
              ) : (
                activePrescriptions.map(renderPrescriptionCard)
              )}
            </TabsContent>

            <TabsContent value="completed" className="p-6 pt-4">
              {completedPrescriptions.length === 0 ? (
                <p>No completed prescriptions found.</p>
              ) : (
                completedPrescriptions.map(renderPrescriptionCard)
              )}
            </TabsContent>

            <TabsContent value="expired" className="p-6 pt-4">
              {expiredPrescriptions.length === 0 ? (
                <p>No expired prescriptions found.</p>
              ) : (
                expiredPrescriptions.map(renderPrescriptionCard)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>
);
};

export default MyPrescriptions;
