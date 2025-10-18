import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Clock, Shield, Activity } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const CreatePrescription = () => {
  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/doctor/dashboard", active: false },
    { icon: FileText, label: "Create Prescription", path: "/doctor/create-prescription", active: true },
    { icon: Clock, label: "My Prescriptions", path: "/doctor/prescriptions", active: false },
    { icon: Shield, label: "Blockchain Verification", path: "/doctor/blockchain-verification", active: false },
    { icon: Activity, label: "Activity Logs", path: "/doctor/activity-logs", active: false },
  ];

  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    drugId: "",
    drugName: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
    issueDate: "",
    validUntil: "",
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

  // --- Patient search ---
  useEffect(() => {
    if (!patientSearch) {
      setFilteredPatients([]);
      setShowPatientDropdown(false);
      return;
    }

    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:4000/api/auth/search?query=${encodeURIComponent(patientSearch)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFilteredPatients(Array.isArray(res.data) ? res.data : []);
        setShowPatientDropdown(Array.isArray(res.data) && res.data.length > 0);
      } catch (err) {
        console.error("Error searching patients:", err);
      }
    };

    fetchPatients();
  }, [patientSearch]);

  const selectPatient = (patient: any) => {
    handleChange("patientId", patient.id);
    handleChange("patientName", patient.full_name || patient.fullName);
    setPatientSearch(`ID: ${patient.id} — ${patient.full_name || patient.fullName}`);
    setShowPatientDropdown(false);
  };

  // --- Drug search ---
  useEffect(() => {
    if (!drugSearch) {
      setFilteredDrugs([]);
      setShowDrugDropdown(false);
      return;
    }

    const fetchDrugs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:4000/api/prescriptions/search/drug?q=${encodeURIComponent(drugSearch)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFilteredDrugs(Array.isArray(res.data) ? res.data : []);
        setShowDrugDropdown(Array.isArray(res.data) && res.data.length > 0);
      } catch (err) {
        console.error("Error searching drugs:", err);
        toast.error("Failed to load drugs");
      }
    };

    fetchDrugs();
  }, [drugSearch]);

  const selectDrug = (drug: any) => {
    handleChange("drugId", drug.id);
    handleChange("drugName", drug.name);
    setDrugSearch(drug.name);
    setShowDrugDropdown(false);
  };

  // --- Submit prescription ---
  const handleSubmit = async () => {
    if (!formData.patientId || !formData.drugId) return toast.error("Patient and Drug are required.");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:4000/api/prescriptions",
        {
          patientId: formData.patientId,
          drugId: formData.drugId,
          dosage: formData.dosage,
          frequency: formData.frequency,
          duration: formData.duration,
          instructions: formData.instructions,
          issueDate: formData.issueDate,
          validUntil: formData.validUntil,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Prescription successfully created!");

      setFormData({
        patientId: "",
        patientName: "",
        drugId: "",
        drugName: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
        issueDate: "",
        validUntil: "",
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
    formData.patientId && formData.drugId && formData.dosage && formData.frequency && formData.duration;

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
          {/* Left panel: Patient + Prescription */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Info */}
            <Card className="card-elevated relative">
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Label htmlFor="patientSearch">Patient ID / Name</Label>
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
                          key={p.id}
                          onClick={() => selectPatient(p)}
                          className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                        >
                          ID: {p.id} — {p.full_name || p.fullName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prescription Details */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Prescription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Drug Search */}
                <div className="relative">
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
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input
                      id="dosage"
                      placeholder="e.g., 500mg"
                      value={formData.dosage}
                      onChange={(e) => handleChange("dosage", e.target.value)}
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

          {/* Right panel: Summary & submit */}
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
                    Dosage: <span className="text-muted-foreground">{formData.dosage || "-"}</span>
                  </p>
                  <p className="text-sm font-medium">
                    Frequency: <span className="text-muted-foreground">{formData.frequency || "-"}</span>
                  </p>
                  <p className="text-sm font-medium">
                    Duration: <span className="text-muted-foreground">{formData.duration || "-"}</span> days
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
