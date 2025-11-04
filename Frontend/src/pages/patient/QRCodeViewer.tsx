import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  QrCode,
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
  prescriptionNo: string;
  doctorName: string;
  drug: string;
  date: string;
  status: string;
  qrCode?: string;
  dosage?: string;
  duration?: string;
  instructions?: string;
  hospital?: string;
}

const QRCodeViewer = () => {
  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/patient/dashboard", active: false },
    { icon: FileText, label: "My Prescriptions", path: "/patient/prescriptions", active: false },
    { icon: QrCode, label: "QR Code Viewer", path: "/patient/qr-viewer", active: true },
    { icon: AlertCircle, label: "Analytics", path: "/patient/analytics", active: false },
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

      try {
        const { token, fullName, name, username, email } = JSON.parse(storedUserData);
        setUserName(fullName || name || username || email || "Patient");
        setUserEmail(email || "");

        console.log("🔍 Fetching prescriptions from patient API...");
        
        const res = await axios.get<Prescription[]>(
          "http://localhost:4000/api/patient/prescriptions",
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
          }
        );

        console.log("✅ Prescriptions response:", res.data);

        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setPrescriptions(res.data);
          setSelectedId(res.data[0].prescriptionNo);
          console.log(`📋 Loaded ${res.data.length} prescriptions`);
        } else {
          setPrescriptions([]);
          console.log("ℹ️ No prescriptions found");
        }
      } catch (err: any) {
        console.error("❌ Error fetching prescriptions:", err);
        console.error("Error details:", err.response?.data);
        
        let errorMessage = "Failed to load prescriptions";
        if (err.code === "ERR_NETWORK") {
          errorMessage = "Cannot connect to the server. Please check if the backend is running.";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        toast({
          title: "Error Fetching Data",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const selectedPrescription = prescriptions.find((p) => p.prescriptionNo === selectedId);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // Helper to display status
  const displayStatus = (status: string) => status.toLowerCase() === "issued" ? "Active" : status.charAt(0).toUpperCase() + status.slice(1);

  const exportCSV = () => {
    if (prescriptions.length === 0) {
      toast({
        title: "No Data",
        description: "No prescriptions found to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = "Prescription No,Drug,Doctor,Date,Status,Dosage,Duration,Instructions,Hospital\n";
    const rows = prescriptions
      .map(
        (p) =>
          `"${p.prescriptionNo}","${p.drug}","${p.doctorName}","${formatDate(
            p.date
          )}","${p.status}","${p.dosage || 'N/A'}","${p.duration || 'N/A'}","${p.instructions || 'N/A'}","${p.hospital || 'N/A'}"`
      )
      .join("\n");

    const csvData = new Blob([headers + rows], { type: "text/csv;charset=utf-8" });
    saveAs(csvData, `prescriptions_${new Date().toISOString().split('T')[0]}.csv`);

    toast({
      title: "Export Successful",
      description: `Exported ${prescriptions.length} prescriptions to CSV.`,
    });
  };

  const shareQRCode = async () => {
    if (!selectedPrescription) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Prescription QR - ${selectedPrescription.drug}`,
          text: `Prescription for ${selectedPrescription.drug} by Dr. ${selectedPrescription.doctorName}`,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        const qrText = JSON.stringify({
          PrescriptionNo: selectedPrescription.prescriptionNo,
          Drug: selectedPrescription.drug,
          Doctor: selectedPrescription.doctorName,
          Date: formatDate(selectedPrescription.date),
          Status: selectedPrescription.status,
        }, null, 2);
        
        await navigator.clipboard.writeText(qrText);
        toast({
          title: "Copied to Clipboard",
          description: "Prescription details copied to clipboard.",
        });
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const downloadQRCode = () => {
    if (!selectedPrescription) return;

    const canvas = document.querySelector("canvas");
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `prescription-${selectedPrescription.prescriptionNo}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "QR Code Downloaded",
        description: `QR code for ${selectedPrescription.prescriptionNo} saved.`,
      });
    }
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
              View and manage your prescription QR codes
            </p>
          </div>
          <Button variant="outline" onClick={exportCSV} disabled={prescriptions.length === 0}>
            <Download className="mr-2 w-4 h-4" /> Export CSV
          </Button>
        </div>

     

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your prescriptions...</p>
            </div>
          </div>
        ) : prescriptions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-12">
                <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No Prescriptions Found</h3>
                <p className="mb-4">You don't have any prescriptions yet.</p>
                <Button onClick={() => window.location.reload()}>
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* QR Code Section */}
            <div className="lg:col-span-2">
              <Card className="shadow-md rounded-2xl">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Prescription QR Code</CardTitle>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={downloadQRCode}
                        disabled={!selectedPrescription}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={shareQRCode}
                        disabled={!selectedPrescription}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {selectedPrescription ? (
                    <div className="text-center space-y-6">
                      {/* QR Code Display */}
                      <div className="mx-auto w-80 h-80 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center">
                        <QRCodeCanvas
                          value={JSON.stringify({
                            prescriptionNo: selectedPrescription.prescriptionNo,
                            drug: selectedPrescription.drug,
                            doctor: selectedPrescription.doctorName,
                            date: formatDate(selectedPrescription.date),
                            status: displayStatus(selectedPrescription.status),
                            dosage: selectedPrescription.dosage,
                            duration: selectedPrescription.duration,
                            instructions: selectedPrescription.instructions,
                            hospital: selectedPrescription.hospital,
                          })}
                          size={280}
                          bgColor="#ffffff"
                          fgColor="#064e3b"
                          level="H"
                          includeMargin
                          style={{ 
                            width: '100%', 
                            height: '100%',
                            maxWidth: '280px',
                            maxHeight: '280px'
                          }}
                        />
                      </div>

                      {/* Prescription Details */}
                      <div className="p-6 rounded-lg bg-muted/30 text-left space-y-4">
                        <h3 className="font-semibold text-lg mb-4 border-b pb-2">
                          Prescription Details
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-3">
                            <div>
                              <span className="font-medium text-muted-foreground">Prescription No:</span>
                              <p className="font-mono text-sm">{selectedPrescription.prescriptionNo}</p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Drug:</span>
                              <p className="font-semibold">{selectedPrescription.drug}</p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Doctor:</span>
                              <p>{selectedPrescription.doctorName}</p>
                            </div>
                            {selectedPrescription.hospital && (
                              <div>
                                <span className="font-medium text-muted-foreground">Hospital:</span>
                                <p>{selectedPrescription.hospital}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <span className="font-medium text-muted-foreground">Issued:</span>
                              <p>{formatDate(selectedPrescription.date)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Status:</span>
                              <div className="mt-1">
                                <Badge variant={
                                  selectedPrescription.status.toLowerCase() === "active" ? "default" :
                                  selectedPrescription.status.toLowerCase() === "dispensed" ? "secondary" : "destructive"
                                }>
                                  {selectedPrescription.status}
                                </Badge>
                              </div>
                            </div>
                            {selectedPrescription.dosage && (
                              <div>
                                <span className="font-medium text-muted-foreground">Dosage:</span>
                                <p>{selectedPrescription.dosage}</p>
                              </div>
                            )}
                            {selectedPrescription.duration && (
                              <div>
                                <span className="font-medium text-muted-foreground">Duration:</span>
                                <p>{selectedPrescription.duration}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {selectedPrescription.instructions && (
                          <div className="pt-3 border-t">
                            <span className="font-medium text-muted-foreground">Instructions:</span>
                            <p className="text-sm mt-1 bg-white p-3 rounded border">
                              {selectedPrescription.instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a prescription to view its QR code</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Prescription Selector */}
              <Card className="shadow-md rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Select Prescription</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a prescription" />
                    </SelectTrigger>
                    <SelectContent>
                      {prescriptions.map((p) => (
                        <SelectItem key={p.prescriptionNo} value={p.prescriptionNo}>
                          <div className="text-left py-1">
                            <div className="font-medium text-sm">{p.drug}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.prescriptionNo} • {formatDate(p.date)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Dr. {p.doctorName}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="mt-4 text-xs text-muted-foreground">
                    <p>Showing {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card className="shadow-md rounded-2xl border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yellow-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>Security Notice</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Your QR codes contain signed prescription details</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Show them only to licensed pharmacists</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Report any suspicious or duplicate codes immediately</p>
                  </div>
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