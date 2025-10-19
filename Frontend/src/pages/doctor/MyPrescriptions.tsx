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
  duration: number;
  status: string;
  issued: string;
  valid: string;
  dispensed: boolean;
  qrcode?: string;
}

const MyPrescriptions: React.FC = () => {
  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/doctor/dashboard", active: false },
    { icon: FileText, label: "Create Prescription", path: "/doctor/create-prescription", active: false },
    { icon: Clock, label: "My Prescriptions", path: "/doctor/prescriptions", active: true },
    { icon: Shield, label: "Blockchain Verification", path: "/doctor/blockchain-verification", active: false },
    { icon: Activity, label: "Activity Logs", path: "/doctor/activity-logs", active: false },
  ];

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userName = userData.fullName || "Doctor";
  const userEmail = userData.email || "";

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<any[]>("http://localhost:4000/api/prescriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: Prescription[] = res.data.map((p: any) => ({
        id: p.id.toString(),
        patient_name: p.patient_name || "Unknown",
        dob: p.patient_dob,
        drug_name: p.drug_name || "",
        dosage: p.dosage || "",
        duration: p.duration || 0,
        status: p.status || "",
        issued: p.issue_date || "",
        valid: p.valid_until || "",
        dispensed: p.status.toLowerCase() === "dispensed",
        qrcode: p.qrcode,
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
    switch (status) {
      case "Active":
        return "bg-warning text-warning-foreground";
      case "Dispensed":
        return "bg-success text-success-foreground";
      case "Expired":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const exportCSV = () => {
    const headers = ["Prescription ID", "Patient", "Age", "Drug", "Dosage", "Duration", "Status", "Issued", "Valid Until"];
    const rows = filteredPrescriptions.map((p) => [
      p.id,
      p.patient_name,
      calculateAge(p.dob),
      p.drug_name,
      p.dosage,
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
          <Button onClick={exportCSV} className="btn-gradient-primary">
            <Download className="mr-2 w-4 h-4" />
            Export CSV
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
                  placeholder="Search by prescription ID, patient name, or drug..."
                  className="pl-10 focus:ring-primary"
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
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Prescription History</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPrescriptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No prescriptions found.</p>
            ) : (
              <div className="space-y-4">
                {filteredPrescriptions.map((p) => (
                  <div key={p.id} className="p-6 rounded-lg border bg-muted/30 hover:shadow-md transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-lg">{p.id}</span>
                          <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                          {p.dispensed && <Badge variant="outline" className="text-xs">Dispensed</Badge>}
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 text-sm">
                          <p><span className="font-medium">Patient:</span> {p.patient_name} ({calculateAge(p.dob)}y)</p>
                          <p><span className="font-medium">Drug:</span> {p.drug_name}</p>
                          <p><span className="font-medium">Dosage:</span> {p.dosage}</p>
                          <p><span className="font-medium">Duration:</span> {p.duration}</p>
                        </div>
                        <div className="flex space-x-4 text-xs text-muted-foreground">
                          <span>Issued: {formatDate(p.issued)}</span>
                          <span>Valid Until: {formatDate(p.valid)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 w-3 h-3" />View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openQrModal(p)}
                          disabled={!p.qrcode}
                        >
                          <QrCode className="mr-1 w-3 h-3" />QR Code
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                          <Shield className="mr-1 w-3 h-3" />Verify
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Modal */}
        <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Prescription QR Code</DialogTitle>
            </DialogHeader>
            {selectedPrescription ? (
              <div className="flex flex-col items-center p-4 space-y-4">
                <img src={selectedPrescription.qrcode} alt="Prescription QR Code" className="w-64 h-64 rounded-lg shadow-md" />
                <div className="text-sm text-left w-full space-y-1">
                  <p><span className="font-medium">Patient:</span> {selectedPrescription.patient_name}</p>
                  <p><span className="font-medium">Drug:</span> {selectedPrescription.drug_name}</p>
                  <p><span className="font-medium">Dosage:</span> {selectedPrescription.dosage}</p>
                  <p><span className="font-medium">Duration:</span> {selectedPrescription.duration}</p>
                  <p><span className="font-medium">Issued:</span> {formatDate(selectedPrescription.issued)}</p>
                  <p><span className="font-medium">Valid Until:</span> {formatDate(selectedPrescription.valid)}</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">QR code not available</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={copyQrLink}>
                <Copy className="mr-2 w-3 h-3" />Copy QR Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MyPrescriptions;
