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
import { Truck } from "lucide-react";
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

const API_BASE = "/api/manufacturer/drugbatch";

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
  const [selectedDistributorCompanyId, setSelectedDistributorCompanyId] = useState<string>("");
  const [selectedDistributorFacilityId, setSelectedDistributorFacilityId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    drugid: "",
    manufacturedate: "",
    expirydate: "",
    quantity: "",
    storagetemperature: "",
    manufacturingfacility: "",
    distributorcompanyid: "",
    distributor_facility_id: "",
  });
  const [confirmation, setConfirmation] = useState<{ batchnumber: string; qrcode: string; blockchaintx: string } | null>(null);

  const sidebarItems = [
    { icon: Package, label: "Dashboard", path: "/manufacturer/dashboard", active: false },
    { icon: Plus, label: "Register Batch", path: "/manufacturer/register-batch", active: true},
    { icon: List, label: "Batches", path: "/manufacturer/batches", active: false },
    { icon: Shield, label: "Blockchain", path: "/manufacturer/blockchain", active: false},
    { icon: Activity, label: "Analytics", path: "/manufacturer/analytics", active: false},
    { icon: Truck, label: "Shipments", path: "/manufacturer/shipments", active: false},
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
    if (field === "distributorcompanyid") {
      setSelectedDistributorCompanyId(value);
      // Reset facility selection when company changes
      setSelectedDistributorFacilityId("");
      setFormData(prev => ({
        ...prev,
        distributor_facility_id: "",
        manufacturingfacility: ""
      }));
    }
    if (field === "distributor_facility_id") {
      setSelectedDistributorFacilityId(value);
      // Autofill manufacturingfacility with selected distributor's display_name
      const selectedDist = distributors.find(d => d.id === Number(formData.distributorcompanyid));
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
    if (!formData.drugid) {
      toast.error("Please select a drug.");
      return;
    }
    if (!formData.manufacturedate || !formData.expirydate) {
      toast.error("Enter valid manufacture and expiry dates.");
      return;
    }
    try {
      const payload = {
        drugid: formData.drugid,
        quantity: formData.quantity ? Number(formData.quantity) : null,
        manufacturedate: formData.manufacturedate,
        expirydate: formData.expirydate,
        storagetemperature: formData.storagetemperature || null,
        manufacturingfacility: formData.manufacturingfacility || null,
        distributorcompanyid: formData.distributorcompanyid ? Number(formData.distributorcompanyid) : null,
        distributor_facility_id: formData.distributor_facility_id ? Number(formData.distributor_facility_id) : null,
      };
      const res = await axios.post(API_BASE + "/create", payload, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
  const { batchnumber, qrcode, blockchaintx } = res.data as { batchnumber: string; qrcode: string; blockchaintx: string };
  setConfirmation({ batchnumber, qrcode, blockchaintx });
  toast.success(`Batch registered successfully! Batch Number: ${batchnumber}`);
      setFormData({
        drugid: "",
        manufacturedate: "",
        expirydate: "",
        quantity: "",
        storagetemperature: "",
        manufacturingfacility: "",
        distributorcompanyid: "",
        distributor_facility_id: "",
      });
    } catch (err: any) {
      console.error("Error registering batch:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Failed to register batch.");
    }
  };

  // Removed static recentBatches

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
                    {/* Batch number is auto-generated and shown in confirmation modal */}
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
                        <SelectTrigger><SelectValue placeholder="Select distributor company" /></SelectTrigger>
                        <SelectContent>
                          {distributors.length > 0 ? Array.from(new Set(distributors.map(dist => dist.display_name))).map((name, idx) => {
                            const dist = distributors.find(d => d.display_name === name);
                            return dist ? <SelectItem key={dist.id} value={dist.id.toString()}>{dist.display_name}</SelectItem> : null;
                          }) : <SelectItem value="none" disabled>No distributors available</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="distributor_facility_id">Distributor Facility</Label>
                      <Select onValueChange={(value) => handleSelectChange("distributor_facility_id", value)} value={formData.distributor_facility_id || ""} disabled={!formData.distributorcompanyid}>
                        <SelectTrigger><SelectValue placeholder="Select facility" /></SelectTrigger>
                        <SelectContent>
                          {distributors.length > 0 && formData.distributorcompanyid ?
                            distributors.filter(dist => dist.id === Number(formData.distributorcompanyid)).map(dist => (
                              <SelectItem key={dist.id} value={dist.id.toString()}>{dist.display_name} ({dist.facility_location})</SelectItem>
                            )) : <SelectItem value="none" disabled>No facilities available</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Quality officer and date checked removed for initial batch creation */}
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

          {/* Confirmation Modal */}
          {confirmation && (
            <Card className="border-2 border-green-500">
              <CardHeader>
                <CardTitle>Batch Registered!</CardTitle>
                <CardDescription>Blockchain and QR code generated.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="font-semibold">Batch Number: <span className="text-green-700">{confirmation.batchnumber}</span></div>
                <div className="font-semibold">Blockchain Tx: <span className="text-green-700">{confirmation.blockchaintx}</span></div>
                <div className="font-semibold">QR Code:</div>
                <img src={confirmation.qrcode} alt="Batch QR Code" className="w-32 h-32 border" />
                <Button variant="outline" onClick={() => setConfirmation(null)}>Close</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RegisterBatch;