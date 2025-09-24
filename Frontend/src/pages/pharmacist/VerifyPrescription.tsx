import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, FileText, Clock, User, AlertTriangle, CheckCircle, Activity, Package, Shield, Scan, PillBottle } from "lucide-react";
  
const VerifyPrescription = () => {
  const sidebarItems = [
  { icon: Shield, label: 'Dashboard', path: '/pharmacist/dashboard', active: false },
    { icon: Scan, label: 'Scan Prescription', path: '/pharmacist/scan', active: false },
    { icon: Shield, label: 'Verify Prescription', path: '/pharmacist/verify', active: true },
    { icon: PillBottle, label: 'Dispense Drug', path: '/pharmacist/dispense', active: false },
    { icon: Package, label: 'Inventory', path: '/pharmacist/inventory', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/pharmacist/activity-logs', active: false },
  ];

  const [verificationCode, setVerificationCode] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerify = () => {
    // Simulate verification
    setVerificationResult({
      isValid: true,
      prescription: {
        id: "RX-2024-001234",
        patientName: "John Doe",
        doctorName: "Dr. Sarah Wilson",
        medication: "Amoxicillin 500mg",
        dosage: "3 times daily for 7 days",
        issueDate: "2024-01-15",
        expiryDate: "2024-01-22",
        status: "Valid"
      }
    });
  };

  return (
   <DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
         <div className="space-y-8">
           <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Verify Prescription
          </h1>
          <p className="text-muted-foreground">Validate prescription authenticity using blockchain verification</p>
        </div>
      </div>

      <Tabs defaultValue="verify" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="verify">Verify Prescription</TabsTrigger>
          <TabsTrigger value="history">Verification History</TabsTrigger>
        </TabsList>

        <TabsContent value="verify" className="space-y-6">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Prescription Verification
              </CardTitle>
              <CardDescription>
                Enter the prescription code or scan QR code to verify authenticity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter prescription code (e.g., RX-2024-001234)"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleVerify} className="px-8">
                  Verify
                </Button>
              </div>

              {verificationResult && (
                <Card className={`border-2 ${verificationResult.isValid ? 'border-green-500/50 bg-green-50/50' : 'border-red-500/50 bg-red-50/50'}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      {verificationResult.isValid ? (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">
                          {verificationResult.isValid ? 'Prescription Valid' : 'Prescription Invalid'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Blockchain verification completed
                        </p>
                      </div>
                    </div>

                    {verificationResult.isValid && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Patient</p>
                          <p className="font-semibold">{verificationResult.prescription.patientName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Doctor</p>
                          <p className="font-semibold">{verificationResult.prescription.doctorName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Medication</p>
                          <p className="font-semibold">{verificationResult.prescription.medication}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Status</p>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {verificationResult.prescription.status}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Verifications</CardTitle>
              <CardDescription>View recently verified prescriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">RX-2024-00123{i}</p>
                        <p className="text-sm text-muted-foreground">Patient: John Doe</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">2 hours ago</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Valid</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </DashboardLayout>
  );
};


export default VerifyPrescription;