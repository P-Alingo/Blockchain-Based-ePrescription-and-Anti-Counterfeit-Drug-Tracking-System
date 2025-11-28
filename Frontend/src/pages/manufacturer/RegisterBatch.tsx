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

// FIXED: Use full backend URL
const API_BASE = "http://localhost:4000/api/manufacturer/drugbatch";

interface User {
  userId: number;
  fullName: string;
  role: string;
  token: string;
}

interface Distributor {
  id: number;
  name: string;
  display_name: string;
  facility_id: number;
  facility_name: string;
  facility_address?: string;
  facility_phone?: string;
  facility_location?: string;
}

const RegisterBatch = () => {
  const [drugs, setDrugs] = useState<{ id: number; name: string }[]>([]);
  const [officers, setOfficers] = useState<{ id: number; fullname: string }[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [distributorFacilities, setDistributorFacilities] = useState<any[]>([]);
  const [selectedDistributorCompanyId, setSelectedDistributorCompanyId] = useState<string>("");
  const [selectedDistributorFacilityId, setSelectedDistributorFacilityId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
  drugid: "",
  manufacturedate: "",
  expirydate: "",
  total_batch_quantity: "",
  storagetemperature: "",
  manufacturingfacility: "",
  distributorcompanyid: "",
  distributor_facility_id: "",
  qualitycontrolofficerid: "",
  });
  const [confirmation, setConfirmation] = useState<{ batchnumber: string; qrcode: string; blockchaintx: string; qrCodeImageUrl?: string } | null>(null);

  const sidebarItems = [
    { icon: Package, label: "Dashboard", path: "/manufacturer/dashboard", active: false },
    { icon: Plus, label: "Register Batch", path: "/manufacturer/register-batch", active: true},
    { icon: List, label: "Batches", path: "/manufacturer/batches", active: false },
    { icon: Activity, label: "Analytics", path: "/manufacturer/analytics", active: false},
    { icon: Truck, label: "Shipments", path: "/manufacturer/shipments", active: false},
  ];

  const fetchDropdowns = async (token: string) => {
    try {
      console.log("🚀 Fetching dropdowns with token:", token ? "Token exists" : "No token");
      
      // FIXED: Use the full URL
      const url = `${API_BASE}/form/dropdowns`;
      console.log("📡 Making API call to:", url);
      
      const res = await axios.get(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log("✅ API Response Status:", res.status);
      console.log("📦 API Response Data:", res.data);
      
      // Check if we got HTML instead of JSON (router interception)
      if (typeof res.data === 'string' && res.data.includes('<!doctype html>')) {
        console.error("❌ API returned HTML instead of JSON. Check your API_BASE URL.");
        throw new Error("Frontend router intercepted the API call. Using fallback data.");
      }
      
      const data = res.data as {
        drugs: { id: number; name: string }[];
        qualityOfficers: { id: number; fullname: string }[];
        distributors: Distributor[];
        distributorFacilities: any[];
      };

      console.log("🎯 Parsed data counts:", {
        drugs: data.drugs?.length || 0,
        officers: data.qualityOfficers?.length || 0,
        distributors: data.distributors?.length || 0,
        distributorFacilities: data.distributorFacilities?.length || 0
      });

      setDrugs(data.drugs || []);
      setOfficers(data.qualityOfficers || []);
      setDistributors(data.distributors || []);
      setDistributorFacilities(data.distributorFacilities || []);
      
      // Log the actual data for debugging
      if (data.drugs && data.drugs.length > 0) {
        console.log("💊 Available drugs:", data.drugs);
      } else {
        console.warn("⚠️ No drugs found in response");
      }
      
      if (data.distributors && data.distributors.length > 0) {
        console.log("🚚 Available distributors:", data.distributors);
      } else {
        console.warn("⚠️ No distributors found in response");
      }
      
    } catch (err: any) {
      console.error("❌ Dropdown fetch error details:");
      console.error("Error message:", err.message);
      console.error("Response status:", err.response?.status);
      console.error("Response data:", err.response?.data);
      
      // Enhanced fallback data
      console.log("🔄 Using enhanced fallback data");
      const fallbackDrugs = [
        { id: 1, name: 'Paracetamol' },
        { id: 2, name: 'Amoxicillin' },
        { id: 3, name: 'Ibuprofen' },
        { id: 4, name: 'Metformin' }
      ];
      const fallbackDistributors = [
        { 
          id: 1, 
          name: 'Kenya Medical Distributors', 
          display_name: 'Kenya Medical Distributors - Kisumu',
          facility_id: 23,
          facility_name: 'Kenya Medical Distributors',
          facility_location: 'Kisumu'
        },
        { 
          id: 2, 
          name: 'Nairobi Medical Distributors', 
          display_name: 'Nairobi Medical Distributors - Nairobi',
          facility_id: 24,
          facility_name: 'Nairobi Medical Distributors', 
          facility_location: 'Nairobi'
        },
        { 
          id: 3, 
          name: 'Coast Region Distributors', 
          display_name: 'Coast Region Distributors - Mombasa',
          facility_id: 25,
          facility_name: 'Coast Region Distributors', 
          facility_location: 'Mombasa'
        }
      ];
      
      setDrugs(fallbackDrugs);
      setDistributors(fallbackDistributors);
      setOfficers([{ id: 1, fullname: 'Jane Wanjiku' }]);
      
      toast.error("Using demo data. API connection issue detected.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    const storedToken = localStorage.getItem("token");

    console.log("🔍 useEffect triggered");
    console.log("Stored user:", storedUser ? "Exists" : "Missing");
    console.log("Stored token:", storedToken ? "Exists" : "Missing");

    if (!storedUser || !storedToken) {
      console.error("❌ Missing user data or token");
      toast.error("Please log in to continue.");
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      console.log("📋 Parsed user data:", parsedUser);
      
      const userData: User = {
        userId: parsedUser.userId || parsedUser.id,
        fullName: parsedUser.fullName || parsedUser.name,
        role: parsedUser.role,
        token: storedToken,
      };
      
      setCurrentUser(userData);
      console.log("👤 Current user set:", userData);

      fetchDropdowns(storedToken);
    } catch (error) {
      console.error("❌ Error parsing user data:", error);
      toast.error("Invalid user data. Please log in again.");
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    if (field === "qualitycontrolofficerid") {
      setFormData((prev) => ({ ...prev, qualitycontrolofficerid: value }));
      return;
    }
    console.log(`🔄 Select change: ${field} = ${value}`);
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    if (field === "distributorcompanyid") {
      setSelectedDistributorCompanyId(value);
      setSelectedDistributorFacilityId("");
      setFormData(prev => ({
        ...prev,
        distributor_facility_id: "",
        manufacturingfacility: ""
      }));
    }
    
    if (field === "distributor_facility_id") {
      setSelectedDistributorFacilityId(value);
      // Find selected facility from distributorFacilities
      const selectedFacility = distributorFacilities.find(f => f.facility_id === Number(value));
      const facilityName = selectedFacility ? `${selectedFacility.facility_name} - ${selectedFacility.facility_location}` : "";
      setFormData(prev => ({
        ...prev,
        manufacturingfacility: facilityName
      }));
    }
  };

 const handleSubmit = async () => {
  console.log("🚀 Submit button clicked");
  console.log("📋 Form data:", formData);
  
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
    const payload: any = {
      drugid: formData.drugid,
      total_batch_quantity: formData.total_batch_quantity ? Number(formData.total_batch_quantity) : null,
      manufacturedate: formData.manufacturedate,
      expirydate: formData.expirydate,
      storagetemperature: formData.storagetemperature || null,
      manufacturingfacility: formData.manufacturingfacility || null,
      distributorcompanyid: formData.distributorcompanyid ? Number(formData.distributorcompanyid) : null,
      distributor_facility_id: formData.distributor_facility_id ? Number(formData.distributor_facility_id) : null,
    };
    // Add quality control officer if selected
    if (formData.qualitycontrolofficerid && formData.qualitycontrolofficerid !== "") {
      payload.qualitycontrolofficerid = Number(formData.qualitycontrolofficerid);
    }
    
    console.log("📤 Sending payload to:", `http://localhost:4000/api/manufacturer/batches`);
    
    // ✅ FIX: Use /batches instead of /drugbatch/create
    const res = await axios.post(`http://localhost:4000/api/manufacturer/batches`, payload, {
      headers: { Authorization: `Bearer ${currentUser.token}` },
    });
    
    console.log("✅ Batch creation response:", res.data);

    interface BatchResponse {
      batchnumber: string;
      qrcode: string;
      blockchaintx: string;
      qrCodeImageUrl?: string;
    }
    const { batchnumber, qrcode, blockchaintx, qrCodeImageUrl } = res.data as BatchResponse;
    setConfirmation({ batchnumber, qrcode, blockchaintx, qrCodeImageUrl });
    toast.success(`Batch registered successfully! Batch Number: ${batchnumber}`);
    
    // Reset form
    setFormData({
      drugid: "",
      manufacturedate: "",
      expirydate: "",
      total_batch_quantity: "",
      storagetemperature: "",
      manufacturingfacility: "",
      distributorcompanyid: "",
      distributor_facility_id: "",
      qualitycontrolofficerid: "",
    });
    
  } catch (err: any) {
    console.error("❌ Error registering batch:", err);
    toast.error(err.response?.data?.message || "Failed to register batch.");
  }
};

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
                  
                  <div>
                    <Label htmlFor="drugid">Product Name</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange("drugid", value)} 
                      value={formData.drugid || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {drugs.map(drug => (
                          <SelectItem key={drug.id} value={drug.id.toString()}>
                            {drug.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="total_batch_quantity">Quantity</Label>
                      <Input 
                        id="total_batch_quantity" 
                        type="number" 
                        value={formData.total_batch_quantity} 
                        onChange={handleChange} 
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manufacturedate">Manufacture Date</Label>
                      <Input 
                        id="manufacturedate" 
                        type="date" 
                        value={formData.manufacturedate} 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expirydate">Expiry Date</Label>
                      <Input 
                        id="expirydate" 
                        type="date" 
                        value={formData.expirydate} 
                        onChange={handleChange} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="storagetemperature">Storage Temperature (°C)</Label>
                      <Input 
                        id="storagetemperature" 
                        value={formData.storagetemperature} 
                        onChange={handleChange} 
                        placeholder="e.g., 2-8"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Manufacturing Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="qualitycontrolofficerid">Quality Control Officer</Label>
                      <Select
                        onValueChange={(value) => handleSelectChange("qualitycontrolofficerid", value)}
                        value={formData.qualitycontrolofficerid || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality control officer" />
                        </SelectTrigger>
                        <SelectContent>
                          {officers.length > 0 ? (
                            officers.map(officer => (
                              <SelectItem key={officer.id} value={officer.id.toString()}>
                                {officer.fullname}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No officers found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="distributorcompanyid">Distributor Company</Label>
                      <Select 
                        onValueChange={(value) => handleSelectChange("distributorcompanyid", value)} 
                        value={formData.distributorcompanyid || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select distributor company" />
                        </SelectTrigger>
                        <SelectContent>
                          {distributors.map(dist => (
                            <SelectItem key={dist.id} value={dist.id.toString()}>
                              {dist.display_name || dist.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="distributor_facility_id">Distributor Facility</Label>
                      <Select 
                        onValueChange={(value) => handleSelectChange("distributor_facility_id", value)} 
                        value={formData.distributor_facility_id || ""} 
                        disabled={!formData.distributorcompanyid}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select facility" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.distributorcompanyid ? (
                            distributorFacilities
                              .filter(f => f.distributor_company_id === Number(formData.distributorcompanyid))
                              .map(facility => (
                                <SelectItem key={facility.facility_id} value={facility.facility_id.toString()}>
                                  {facility.facility_name} ({facility.facility_location})
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="none" disabled>
                              Select distributor first
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
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

          {confirmation && (
            <Card className="border-2 border-green-500">
              <CardHeader>
                <CardTitle>Batch Registered!</CardTitle>
                <CardDescription>Blockchain and QR code generated.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="font-semibold">Batch Number: <span className="text-green-700">{confirmation.batchnumber}</span></div>
                  {/* Blockchain Tx removed as per requirements */}
                <div className="font-semibold">QR Code:</div>
                {confirmation.qrCodeImageUrl ? (
                  <img src={confirmation.qrCodeImageUrl} alt="Batch QR Code" className="w-32 h-32 border" />
                ) : (
                  <span className="text-muted-foreground">No QR code image available.</span>
                )}
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