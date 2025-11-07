import { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, User, Calendar, CheckCircle, Package, Activity, Shield, Scan, PillBottle, FileText } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const DispenseDrug = () => {
  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/pharmacist/dashboard", active: false },
    { icon: Activity, label: "Blockchain", path: "/pharmacist/blockchain", active: false },
    { icon: Activity, label: "Analytics", path: "/pharmacist/analytics", active: false },
    { icon: PillBottle, label: "Dispense Drug", path: "/pharmacist/dispense", active: true },
    { icon: Package, label: "Inventory & Requests", path: "/pharmacist/inventory-requests", active: false },
    { icon: FileText, label: "My Prescriptions", path: "/pharmacist/myprescriptions", active: false },
    { icon: Package, label: "Shipments", path: "/pharmacist/shipments", active: false },
  ];

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dispensingNotes, setDispensingNotes] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [dispensing, setDispensing] = useState(false);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = "http://localhost:4000";
        const res = await axios.get(`${API_BASE_URL}/api/pharmacist/prescriptions`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
  setPrescriptions(res.data as any[]);
      } catch (err) {
        setError("Failed to fetch prescriptions");
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  const filteredPrescriptions = prescriptions.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.patientName || "").toLowerCase().includes(term) ||
      (p.doctorName || "").toLowerCase().includes(term) ||
      (p.prescriptionCode || "").toLowerCase().includes(term)
    );
  });

  const handleSelectPrescription = (id) => {
    const presc = prescriptions.find(p => p.id === Number(id));
    setSelectedPrescription(presc || null);
  };

  const handleDispense = async () => {
    if (!selectedPrescription || selectedPrescription.status === "dispensed") return;
    setDispensing(true);
    try {
      const API_BASE_URL = "http://localhost:4000";
      // pharmacistId should come from auth context, here assumed as 39
      const pharmacistId = 39;
      // Dispense prescription and decrement inventory
      const res = await axios.post(
        `${API_BASE_URL}/api/pharmacist/dispense`,
        {
          prescriptionId: selectedPrescription.id,
          patientId: selectedPrescription.patientId || 0,
          drugId: selectedPrescription.drugId,
          quantity: selectedPrescription.quantity,
          pharmacistId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Decrement inventory for the drug
      await axios.put(
        `${API_BASE_URL}/api/pharmacist/inventory/${selectedPrescription.drugId}`,
        {
          quantity: -selectedPrescription.quantity
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Medication dispensed and inventory updated!");
      setSelectedPrescription({ ...selectedPrescription, status: "dispensed" });
      // Optionally refresh prescriptions list
      setPrescriptions(prev => prev.map(p => p.id === selectedPrescription.id ? { ...p, status: "dispensed" } : p));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispense medication");
    } finally {
      setDispensing(false);
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dispense Medication
          </h1>
          <p className="text-muted-foreground">Process prescription and dispense medication to patients</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Search & Select Prescription
              </CardTitle>
              <CardDescription>
                Search by patient, doctor, or prescription code. Select a prescription to load details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="p-4 text-center">Loading prescriptions...</div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">{error}</div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search patient, doctor, or prescription code"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prescriptionDropdown">Prescriptions</Label>
                    <Select onValueChange={handleSelectPrescription} value={selectedPrescription?.id ? String(selectedPrescription.id) : ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select prescription" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPrescriptions.map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.prescriptionCode} - {p.patientName} - {p.doctorName} - {p.drug} ({p.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                          <p className="text-sm font-medium text-muted-foreground">Drug</p>
                          <p className="font-semibold">{selectedPrescription.drug}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Dosage</p>
                          <p className="font-semibold">{selectedPrescription.dosageAmount} {selectedPrescription.dosageUnit}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Frequency</p>
                          <p className="font-semibold">{selectedPrescription.frequency}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Duration</p>
                          <p className="font-semibold">{selectedPrescription.duration} days</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Instructions</p>
                          <p className="font-semibold">{selectedPrescription.instructions}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                          <p className="font-semibold">{selectedPrescription.issueDate}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {selectedPrescription.status}
                      </Badge>
                      <div className="pt-4">
                        <Button
                          onClick={handleDispense}
                          disabled={dispensing || selectedPrescription.status === "dispensed"}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        >
                          {dispensing ? "Dispensing..." : selectedPrescription.status === "dispensed" ? "Already Dispensed" : "Dispense"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Recent Dispensing Activity (placeholder) */}
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