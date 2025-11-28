import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Clock, Shield, Activity, AlertTriangle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const CreatePrescription = () => {
  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/doctor/dashboard", active: false },
    { icon: FileText, label: "Create Prescription", path: "/doctor/create-prescription", active: true },
    { icon: Clock, label: "My Prescriptions", path: "/doctor/prescriptions", active: false },
    { icon: Activity, label: "Analytics", path: "/doctor/analytics", active: false },
       
];
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    drugId: "",
    drugName: "",
    dosageAmount: "",
    dosageUnit: "",
    frequency: "",
    duration: "",
    instructions: "",
    issueDate: "",
    validUntil: "",
    quantity: "" // New field for quantity
  });

  const [patientSearch, setPatientSearch] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [drugSearch, setDrugSearch] = useState("");
  const [filteredDrugs, setFilteredDrugs] = useState<any[]>([]);
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userName = userData.fullName || "Doctor";
  const userEmail = userData.email || "";

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Generic search function
  const fetchSearchResults = async (url: string, queryValue: string) => {
    if (!queryValue.trim()) return [];
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${url}?q=${encodeURIComponent(queryValue.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error(`Error fetching from ${url}:`, err);
      toast.error(`Failed to fetch results`);
      return [];
    }
  };

  // Patient search
  useEffect(() => {
    if (!patientSearch.trim()) {
      setFilteredPatients([]);
      setShowPatientDropdown(false);
      return;
    }

    const fetchPatients = async () => {
      const results = await fetchSearchResults(
        "http://localhost:4000/api/doctor/search/patient",
        patientSearch
      );
      setFilteredPatients(results);
      setShowPatientDropdown(results.length > 0);
    };

    fetchPatients();
  }, [patientSearch]);

  const selectPatient = (patient: any) => {
    handleChange("patientId", patient.patient_id);
    handleChange("patientName", patient.full_name);
    setPatientSearch(patient.full_name);
    setShowPatientDropdown(false);
  };

  // Drug search
  useEffect(() => {
    if (!drugSearch.trim()) {
      setFilteredDrugs([]);
      setShowDrugDropdown(false);
      return;
    }

    const fetchDrugs = async () => {
      const results = await fetchSearchResults(
        "http://localhost:4000/api/doctor/search/drug",
        drugSearch
      );
      setFilteredDrugs(results);
      setShowDrugDropdown(results.length > 0);
    };

    fetchDrugs();
  }, [drugSearch]);

  const selectDrug = (drug: any) => {
    handleChange("drugId", drug.id);
    handleChange("drugName", drug.name);
    setDrugSearch(drug.name);
    setShowDrugDropdown(false);
  };

  // Submit prescription
  const handleSubmit = async () => {
    if (!formData.patientId || !formData.drugId) return toast.error("Patient and Drug are required.");
    if (!formData.dosageAmount || !formData.dosageUnit || !formData.frequency || !formData.duration)
      return toast.error("Complete all prescription details.");
    if (new Date(formData.issueDate) > new Date(formData.validUntil))
      return toast.error("Valid Until cannot be before Issue Date.");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:4000/api/doctor/prescription",
        {
          patientId: formData.patientId,
          drugId: formData.drugId,
          dosageAmount: formData.dosageAmount.trim(),
          dosageUnit: formData.dosageUnit.trim(),
          frequency: formData.frequency.trim(),
          duration: Number(formData.duration),
          instructions: formData.instructions.trim(),
          issueDate: formData.issueDate,
          validUntil: formData.validUntil,
          quantity: Number(formData.quantity)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Prescription successfully created!");

      // Automatically sync to blockchain
      const data = res.data as { id?: string; prescriptionId?: string };
      const newId = data.id || data.prescriptionId || null;
      if (newId) {
        try {
          await axios.post(`http://localhost:4000/api/doctor/prescription/${newId}/sync-blockchain`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Prescription synced to blockchain");
        } catch (syncErr: any) {
          toast.error(syncErr.response?.data?.message || "Failed to sync prescription to blockchain");
        }
      }

      // Reset form
      setFormData({
        patientId: "",
        patientName: "",
        drugId: "",
        drugName: "",
        dosageAmount: "",
        dosageUnit: "",
        frequency: "",
        duration: "",
        instructions: "",
        issueDate: "",
        validUntil: "",
        quantity: ""
      });
      setPatientSearch("");
      setDrugSearch("");
      setFilteredPatients([]);
      setFilteredDrugs([]);
      setShowPatientDropdown(false);
      setShowDrugDropdown(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error creating prescription");
    }
  };

  const allRequiredFilled =
  formData.patientId &&
  formData.drugId &&
  formData.dosageAmount.trim() &&
  formData.dosageUnit.trim() &&
  formData.frequency.trim() &&
  formData.duration;

  return (
    <DashboardLayout
      sidebarItems={sidebarItems.map((item) => ({ ...item, active: item.path === "/doctor/create-prescription" }))}
      userRole="doctor"
      userName={userName}
      userEmail={userEmail}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Create New Prescription</h1>
          <p className="text-muted-foreground">Create a secure, blockchain-verified prescription</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Info */}
            <Card className="card-elevated relative">
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="patientSearch">Patient Name</Label>
                <Input
                  id="patientSearch"
                  placeholder="Search patient"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
                {showPatientDropdown && filteredPatients.length > 0 && (
                  <div className="absolute z-10 bg-white border rounded-md mt-1 w-full shadow-lg max-h-40 overflow-y-auto">
                    {filteredPatients.map((p) => (
                      <div
                        key={p.patient_id}
                        onClick={() => selectPatient(p)}
                        className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                      >
                        ID: {p.patient_id} — {p.full_name}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prescription Details */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Prescription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Drug search */}
                <Label htmlFor="drugSearch">Drug Name</Label>
                <Input
                  id="drugSearch"
                  placeholder="Search and select drug"
                  value={drugSearch}
                  onChange={(e) => setDrugSearch(e.target.value)}
                />
                {showDrugDropdown && filteredDrugs.length > 0 && (
                  <div className="absolute z-10 bg-white border rounded-md mt-1 w-full shadow-lg max-h-40 overflow-y-auto">
                    {filteredDrugs.map((drug) => (
                      <div
                        key={drug.id}
                        onClick={() => selectDrug(drug)}
                        className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                      >
                        {drug.name} {drug.dosageunit} ({drug.formulation})
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="dosageAmount">Dosage Amount</Label>
                    <Input
                      id="dosageAmount"
                      placeholder="e.g., 500"
                      value={formData.dosageAmount}
                      onChange={(e) => handleChange("dosageAmount", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dosageUnit">Dosage Unit</Label>
                    <Input
                      id="dosageUnit"
                      placeholder="e.g., mg"
                      value={formData.dosageUnit}
                      onChange={(e) => handleChange("dosageUnit", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => handleChange("frequency", e.target.value)}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="">Select frequency</option>
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="Three times daily">Three times daily</option>
                      <option value="Four times daily">Four times daily</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (Days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="e.g., 7"
                      value={formData.duration}
                      onChange={(e) => handleChange("duration", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="e.g., 5"
                      value={formData.quantity}
                      onChange={(e) => handleChange("quantity", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="instructions">Special Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Take with food, avoid alcohol, etc."
                    value={formData.instructions}
                    onChange={(e) => handleChange("instructions", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => handleChange("issueDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => handleChange("validUntil", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right panel */}
          <div className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Prescription Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                  <p className="text-sm font-medium">
                    Patient: <span className="text-muted-foreground">{formData.patientName || "Not selected"}</span>
                  </p>
                  <p className="text-sm font-medium">
                    Drug: <span className="text-muted-foreground">{formData.drugName || "Not selected"}</span>
                  </p>
                  <p className="text-sm font-medium">
                    Dosage Amount: <span className="text-muted-foreground">{formData.dosageAmount || "-"}</span>
                  </p>
                  <p className="text-sm font-medium">
                    Dosage Unit: <span className="text-muted-foreground">{formData.dosageUnit || "-"}</span>
                  </p>
                  <p className="text-sm font-medium">
                    Frequency: <span className="text-muted-foreground">{formData.frequency || "-"}</span>
                  </p>
                  <p className="text-sm font-medium">
                    Duration: <span className="text-muted-foreground">{formData.duration || "-"}</span> days
                  </p>
                  <p className="text-sm font-medium">
                    Quantity: <span className="text-muted-foreground">{formData.quantity || "-"}</span>
                  </p>
                  <p className="text-sm font-medium">
                    Instructions: <span className="text-muted-foreground">{formData.instructions || "-"}</span>
                  </p>
                  <p className="text-sm font-medium">
                    Issue Date: <span className="text-muted-foreground">{formData.issueDate || "-"}</span>
                  </p>
                  <p className="text-sm font-medium">
                    Valid Until: <span className="text-muted-foreground">{formData.validUntil || "-"}</span>
                  </p>
                </div>

                <Button onClick={handleSubmit} disabled={!allRequiredFilled} className="mt-4">
                  Create Prescription
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatePrescription;
