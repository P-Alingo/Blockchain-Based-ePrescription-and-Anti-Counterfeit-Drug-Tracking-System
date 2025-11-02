import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Package, Plus, List, Shield, Activity, Factory } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = "http://localhost:4000/api/drugbatch";

interface User {
  userId: number;
  fullName: string;
  role: string;
  token: string;
}

interface Distributor {
  id: number;
  display_name: string; // Company Name - Facility
  facility_address?: string;
  facility_phone?: string;
  facility_location?: string;
}

const RegisterBatch = () => {
  const [drugs, setDrugs] = useState<{ id: number; name: string }[]>([]);
  const [officers, setOfficers] = useState<{ id: number; fullname: string; organization?: string }[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    manufacturerid: "",
    drugid: "",
    batchnumber: "",
    manufacturedate: "",
    expirydate: "",
    quantity: "",
    storagetemperature: "",
    manufacturingfacility: "",
    qualitycontrolofficerid: "",
    distributorcompanyid: "",
    datechecked: "",
  });

  const sidebarItems = [
    { icon: Package, label: "Dashboard", path: "/manufacturer/dashboard", active: false },
    { icon: Plus, label: "Register Batch", path: "/manufacturer/register-batch", active: true },
    { icon: List, label: "Batch List", path: "/manufacturer/batch-list", active: false },
    { icon: Shield, label: "Blockchain Verification", path: "/manufacturer/blockchain-verification", active: false },
    { icon: Activity, label: "Activity Logs", path: "/manufacturer/activity-logs", active: false },
  ];

  const fetchDropdowns = async (token: string) => {
    try {
      const res = await axios.get(`${API_BASE}/form/dropdowns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data as {
        drugs: { id: number; name: string }[];
        qualityOfficers: { id: number; fullname: string; organization?: string }[];
        distributors: Distributor[];
      };

      setDrugs(data.drugs || []);
      setOfficers(data.qualityOfficers || []);
      setDistributors(data.distributors || []);
    } catch (err: any) {
      console.error("Dropdown fetch error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch dropdown data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    const storedToken = localStorage.getItem("token");

    if (!storedUser || !storedToken) {
      toast.error("Please log in to continue.");
      setLoading(false);
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    const userData: User = {
      userId: parsedUser.userId || parsedUser.id, // Try both possible fields
      fullName: parsedUser.fullName || parsedUser.name,
      role: parsedUser.role,
      token: storedToken,
    };
    
    setCurrentUser(userData);

    // Set manufacturerid in form data - FIXED: Check if userId exists
    if (userData.userId) {
      setFormData((prev) => ({ ...prev, manufacturerid: userData.userId.toString() }));
    }

    fetchDropdowns(storedToken);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // If distributor selected, automatically set manufacturingfacility to its display_name
    if (field === "distributorcompanyid") {
      const selectedDist = distributors.find(d => d.id === Number(value));
      setFormData(prev => ({
        ...prev,
        manufacturingfacility: selectedDist ? selectedDist.display_name : ""
      }));
    }
  };

  const handleSubmit = async () => {
    if (!currentUser?.token) {
      toast.error("Unauthorized. Please log in.");
      return;
    }
    
    // FIXED: Check if currentUser.userId exists
    if (!currentUser.userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    if (!formData.drugid) {
      toast.error("Please select a drug.");
      return;
    }
    if (!formData.qualitycontrolofficerid) {
      toast.error("Please select a quality officer.");
      return;
    }
    if (!formData.manufacturedate || !formData.expirydate) {
      toast.error("Enter valid manufacture and expiry dates.");
      return;
    }

    try {
      const payload = {
        ...formData,
        // FIXED: Remove manufacturerid from payload since backend gets it from token
        manufacturerid: null, // Backend gets this from the user token
        drugid: formData.drugid,
        quantity: formData.quantity ? Number(formData.quantity) : null,
        storagetemperature: formData.storagetemperature || null,
        manufacturingfacility: formData.manufacturingfacility || null,
        distributorcompanyid: formData.distributorcompanyid ? Number(formData.distributorcompanyid) : null,
        qualitycontrolofficerid: formData.qualitycontrolofficerid ? Number(formData.qualitycontrolofficerid) : null,
        datechecked: formData.datechecked || null,
      };

      console.log("Submitting payload:", payload); // Debug log

      const res = await axios.post<{ data: { batchnumber: string } }>(API_BASE, payload, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });

      toast.success(`Batch registered successfully! Batch Number: ${res.data.data.batchnumber}`);

      // Reset form but keep user ID
      setFormData({
        manufacturerid: currentUser.userId.toString(),
        drugid: "",
        batchnumber: "",
        manufacturedate: "",
        expirydate: "",
        quantity: "",
        storagetemperature: "",
        manufacturingfacility: "",
        qualitycontrolofficerid: "",
        distributorcompanyid: "",
        datechecked: "",
      });
    } catch (err: any) {
      console.error("Error registering batch:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Failed to register batch.");
    }
  };

  const recentBatches = [
    { id: "BN001", product: "Paracetamol 500mg", quantity: 12000, date: "2025-10-15", status: "verified" },
    { id: "BN002", product: "Ceftriaxone 1g", quantity: 8000, date: "2025-10-10", status: "pending" },
  ];

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems} userRole="manufacturer" userName="Loading..." userEmail="">
        <div className="text-center py-20 text-lg font-semibold text-muted-foreground">
          Loading form data...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="manufacturer" userName={currentUser?.fullName || ""} userEmail="">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Register New Batch
          </h1>
          <p className="text-muted-foreground">
            Register a new drug batch with complete manufacturing details and blockchain verification.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" /> Batch Registration Form
                </CardTitle>
                <CardDescription>
                  Enter essential manufacturing details for blockchain registration.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="batchnumber">Batch Number</Label>
                      <Input
                        id="batchnumber"
                        value={formData.batchnumber || "Will be auto-generated"}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="drugid">Product Name</Label>
                      <Select onValueChange={(value) => handleSelectChange("drugid", value)} value={formData.drugid || ""}>
                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {drugs.length > 0 ? drugs.map(drug => (
                            <SelectItem key={drug.id} value={drug.id.toString()}>{drug.name}</SelectItem>
                          )) : <SelectItem value="none" disabled>No drugs available</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input id="quantity" type="number" value={formData.quantity} onChange={handleChange} />
                    </div>
                    <div>
                      <Label htmlFor="manufacturedate">Manufacture Date</Label>
                      <Input id="manufacturedate" type="date" value={formData.manufacturedate} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expirydate">Expiry Date</Label>
                      <Input id="expirydate" type="date" value={formData.expirydate} onChange={handleChange} />
                    </div>
                    <div>
                      <Label htmlFor="storagetemperature">Storage Temperature (°C)</Label>
                      <Input id="storagetemperature" value={formData.storagetemperature} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Manufacturing Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="distributorcompanyid">Distributor Company</Label>
                      <Select onValueChange={(value) => handleSelectChange("distributorcompanyid", value)} value={formData.distributorcompanyid || ""}>
                        <SelectTrigger><SelectValue placeholder="Select distributor" /></SelectTrigger>
                        <SelectContent>
                          {distributors.length > 0 ? distributors.map(dist => (
                            <SelectItem key={dist.id} value={dist.id.toString()}>{dist.display_name}</SelectItem>
                          )) : <SelectItem value="none" disabled>No distributors available</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="qualitycontrolofficerid">Quality Officer</Label>
                      <Select onValueChange={(value) => handleSelectChange("qualitycontrolofficerid", value)} value={formData.qualitycontrolofficerid || ""}>
                        <SelectTrigger><SelectValue placeholder="Select officer" /></SelectTrigger>
                        <SelectContent>
                          {officers.length > 0 ? officers.map(officer => (
                            <SelectItem key={officer.id} value={officer.id.toString()}>{officer.fullname}{officer.organization ? ` (${officer.organization})` : ""}</SelectItem>
                          )) : <SelectItem value="none" disabled>No officers available</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="datechecked">Date Checked</Label>
                      <Input id="datechecked" type="date" value={formData.datechecked} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <Button className="flex-1" size="lg" onClick={handleSubmit}>
                    <Shield className="mr-2 h-4 w-4" /> Register Batch
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Batches</CardTitle>
                <CardDescription>Recently registered batches</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentBatches.map(batch => (
                  <div key={batch.id} className="p-3 rounded-lg bg-muted/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{batch.id}</p>
                      <Badge variant={batch.status === "verified" ? "default" : "secondary"}>{batch.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{batch.product}</p>
                    <p className="text-xs text-muted-foreground">{batch.quantity.toLocaleString()} units</p>
                    <p className="text-xs text-muted-foreground">{batch.date}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RegisterBatch;