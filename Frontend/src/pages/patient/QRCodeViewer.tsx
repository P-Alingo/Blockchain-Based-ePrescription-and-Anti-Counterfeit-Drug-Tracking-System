import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  QrCode,
  Bell,
  Activity,
  Download,
  Share2,
  Maximize2,
  Shield,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { saveAs } from "file-saver";
import { toast } from "@/components/ui/use-toast";
import { QRCodeCanvas } from "qrcode.react";

interface Prescription {
  id: string;
  doctor_name: string;
  drug_name: string;
  dosage: string;
  issue_date: string;
  valid_until: string;
  qr_code?: string;
  status: string;
}

const QRCodeViewer = () => {
  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/patient/dashboard", active: false },
    { icon: FileText, label: "My Prescriptions", path: "/patient/prescriptions", active: false },
    { icon: QrCode, label: "QR Code Viewer", path: "/patient/qr-viewer", active: true },
    { icon: Bell, label: "My Alerts", path: "/patient/alerts", active: false },
    { icon: Activity, label: "Activity Logs", path: "/patient/activity-logs", active: false },
  ];

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const fetchPrescriptions = async () => {
      const storedUserData = localStorage.getItem("userData");
      if (!storedUserData) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Please log in again.",
          variant: "destructive",
        });
        window.location.href = "/login";
        return;
      }

      const { token, fullName, name, username, email } = JSON.parse(storedUserData);
      setUserName(fullName || name || username || email || "Patient");
      setUserEmail(email || "");

      try {
        const res = await axios.get<{ prescriptions: Prescription[] }>(
          "http://localhost:4000/api/prescriptions/patient",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.data.prescriptions && res.data.prescriptions.length > 0) {
          setPrescriptions(res.data.prescriptions);
          setSelectedId(res.data.prescriptions[0].id);
        } else {
          setPrescriptions([]);
        }
      } catch (err: any) {
        console.error("❌ Error fetching prescriptions:", err.message);
        toast({
          title: "Error Fetching Data",
          description:
            err.code === "ERR_NETWORK"
              ? "Cannot connect to the server. Check your backend URL."
              : "Failed to load prescriptions.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const selectedPrescription = prescriptions.find((p) => p.id === selectedId);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  const exportCSV = () => {
    if (prescriptions.length === 0) {
      toast({
        title: "No Data",
        description: "No prescriptions found to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = "Prescription ID,Drug,Doctor,Dosage,Issued,Expires,Status\n";
    const rows = prescriptions
      .map(
        (p) =>
          `${p.id},"${p.drug_name}","${p.doctor_name}","${p.dosage}","${formatDate(
            p.issue_date
          )}","${formatDate(p.valid_until)}","${p.status}"`
      )
      .join("\n");

    const csvData = new Blob([headers + rows], { type: "text/csv;charset=utf-8" });
    saveAs(csvData, "prescriptions.csv");

    toast({
      title: "Export Successful",
      description: "Your prescriptions were exported successfully.",
    });
  };

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
            <h1 className="text-3xl font-bold text-green-600">QR Code Viewer</h1>
            <p className="text-muted-foreground">
              View and manage your prescription QR codes directly from your doctor.
            </p>
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 w-4 h-4" /> Export CSV
          </Button>
        </div>

        {/* Main Content */}
        {loading ? (
          <p>Loading prescriptions...</p>
        ) : prescriptions.length === 0 ? (
          <p className="text-muted-foreground">No prescriptions found.</p>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="shadow-md rounded-2xl">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Prescription QR Code</CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportCSV}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {selectedPrescription ? (
                    <div className="text-center space-y-6">
                      <div className="mx-auto w-80 h-80 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center">
                        <QRCodeCanvas
                          value={JSON.stringify({
                            PrescriptionID: selectedPrescription.id,
                            Drug: selectedPrescription.drug_name,
                            Doctor: selectedPrescription.doctor_name,
                            Dosage: selectedPrescription.dosage,
                            Issued: formatDate(selectedPrescription.issue_date),
                            Expires: formatDate(selectedPrescription.valid_until),
                            Status: selectedPrescription.status,
                          })}
                          size={230}
                          bgColor="#ffffff"
                          fgColor="#064e3b" // deep green aesthetic
                          level="H"
                          includeMargin
                        />
                      </div>

                      <div className="p-6 rounded-lg bg-muted/30 text-left space-y-3">
                        <h3 className="font-semibold text-lg mb-4">
                          Prescription Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p>
                              <span className="font-medium">Drug:</span>{" "}
                              {selectedPrescription.drug_name}
                            </p>
                            <p>
                              <span className="font-medium">Doctor:</span>{" "}
                              {selectedPrescription.doctor_name}
                            </p>
                            <p>
                              <span className="font-medium">Dosage:</span>{" "}
                              {selectedPrescription.dosage}
                            </p>
                          </div>
                          <div>
                            <p>
                              <span className="font-medium">Issued:</span>{" "}
                              {formatDate(selectedPrescription.issue_date)}
                            </p>
                            <p>
                              <span className="font-medium">Expires:</span>{" "}
                              {formatDate(selectedPrescription.valid_until)}
                            </p>
                            <p>
                              <span className="font-medium">Status:</span>{" "}
                              <Badge>{selectedPrescription.status}</Badge>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Select a prescription to view its QR code.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="shadow-md rounded-2xl">
                <CardHeader>
                  <CardTitle>Select Prescription</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose prescription" />
                    </SelectTrigger>
                    <SelectContent>
                      {prescriptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="text-left">
                            <div className="font-medium">{p.drug_name}</div>
                            <div className="text-xs text-muted-foreground">{p.id}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="shadow-md rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span>Security Notice</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>✅ Your QR codes contain signed prescription details</p>
                  <p>⚠️ Show them only to licensed pharmacists</p>
                  <p>🚨 Report any suspicious or duplicate codes immediately</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QRCodeViewer;
