import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, User, Calendar, CheckCircle, Package, Activity, Shield, Scan, PillBottle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const DispenseDrug = () => {
  const sidebarItems = [
  { icon: Shield, label: 'Dashboard', path: '/pharmacist/dashboard', active: false },
    { icon: Scan, label: 'Scan Prescription', path: '/pharmacist/scan', active: false },
    { icon: Shield, label: 'Verify Prescription', path: '/pharmacist/verify', active: false },
    { icon: PillBottle, label: 'Dispense Drug', path: '/pharmacist/dispense', active: true },
    { icon: Package, label: 'Inventory', path: '/pharmacist/inventory', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/pharmacist/activity-logs', active: false },
  ];
  const [prescriptionId, setPrescriptionId] = useState("");
  const [dispensingNotes, setDispensingNotes] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const handleLoadPrescription = () => {
    setSelectedPrescription({
      id: "RX-2024-001234",
      patientName: "John Doe",
      doctorName: "Dr. Sarah Wilson",
      medication: "Amoxicillin 500mg",
      quantity: "21 tablets",
      dosage: "3 times daily for 7 days",
      issueDate: "2024-01-15",
      status: "Ready for Dispensing"
    });
  };

  const handleDispense = () => {
    // Simulate dispensing process
    alert("Medication dispensed successfully!");
  };

  return (
   <DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
      <div className="space-y-8">
        <div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dispense Medication
          </h1>
          <p className="text-muted-foreground">Process prescription and dispense medication to patients</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Load Prescription
            </CardTitle>
            <CardDescription>
              Enter prescription ID to load patient details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prescriptionId">Prescription ID</Label>
              <div className="flex gap-2">
                <Input
                  id="prescriptionId"
                  placeholder="Enter prescription ID"
                  value={prescriptionId}
                  onChange={(e) => setPrescriptionId(e.target.value)}
                />
                <Button onClick={handleLoadPrescription}>Load</Button>
              </div>
            </div>

            {selectedPrescription && (
              <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Prescription Loaded</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Patient</p>
                    <p className="font-semibold">{selectedPrescription.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Doctor</p>
                    <p className="font-semibold">{selectedPrescription.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Medication</p>
                    <p className="font-semibold">{selectedPrescription.medication}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                    <p className="font-semibold">{selectedPrescription.quantity}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {selectedPrescription.status}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Dispensing Details
            </CardTitle>
            <CardDescription>
              Complete the dispensing process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch number" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="batch1">AMX-2024-001</SelectItem>
                  <SelectItem value="batch2">AMX-2024-002</SelectItem>
                  <SelectItem value="batch3">AMX-2024-003</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                defaultValue="2025-12-31"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispensedQuantity">Dispensed Quantity</Label>
              <Input
                id="dispensedQuantity"
                placeholder="Enter quantity dispensed"
                defaultValue="21 tablets"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Dispensing Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about the dispensing..."
                value={dispensingNotes}
                onChange={(e) => setDispensingNotes(e.target.value)}
              />
            </div>

            <Button
              onClick={handleDispense}
              className="w-full"
              disabled={!selectedPrescription}
            >
              Complete Dispensing
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Dispensing Activity</CardTitle>
          <CardDescription>View recently dispensed medications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Amoxicillin 500mg - 21 tablets</p>
                    <p className="text-sm text-muted-foreground">Patient: Jane Smith</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Today, 2:30 PM</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Dispensed</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
};

export default DispenseDrug;