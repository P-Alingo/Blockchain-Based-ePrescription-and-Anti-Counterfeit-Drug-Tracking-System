import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Truck,
  MapPin,
  Clock,
  Package,
  CheckCircle,
  FileText,
  Activity,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner"; // assuming you use shadcn/ui toaster

const UpdateShipment = () => {
  const sidebarItems = [
    { icon: Truck, label: "Dashboard", path: "/distributor/dashboard", active: false },
    { icon: Package, label: "Active Shipments", path: "/distributor/active-shipments", active: false },
    { icon: RotateCcw, label: "Update Shipment", path: "/distributor/update-shipment", active: true },
    { icon: FileText, label: "Shipment Logs", path: "/distributor/shipment-logs", active: false },
    { icon: Activity, label: "Activity Logs", path: "/distributor/activity-logs", active: false },
  ];

  const [shipmentId, setShipmentId] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [temperature, setTemperature] = useState("");
  const [updateTime, setUpdateTime] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Load shipment details by ID
  const handleLoadShipment = async () => {
    if (!shipmentId.trim()) {
      toast.error("Enter a shipment ID first.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/shipments/${shipmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Shipment not found.");
        return;
      }

      const data = await res.json();
      setSelectedShipment(data);
      setTemperature(data.temperature || "");
      toast.success("Shipment loaded successfully!");
    } catch (error) {
      console.error("Error loading shipment:", error);
      toast.error("Failed to load shipment.");
    }
  };

  // Update shipment status
  const handleUpdateStatus = async () => {
    if (!selectedShipment) {
      toast.error("Load a shipment first.");
      return;
    }

    const updateData = {
      status: newStatus,
      temperature,
      received_condition: updateNotes,
      arrival_date: updateTime || null,
      destination_facility: currentLocation || selectedShipment.destination_facility,
    };

    try {
      const res = await fetch(`${API_URL}/shipments/${selectedShipment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Failed to update shipment.");
        return;
      }

      setSelectedShipment(result.data);
      toast.success("Shipment updated successfully!");
    } catch (error) {
      console.error("Error updating shipment:", error);
      toast.error("Error updating shipment.");
    }
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="distributor"
      userName="Mike Distributor"
      userEmail="mike@logistics.co.ke"
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
            Update Shipment
          </h1>
          <p className="text-muted-foreground">Track and update pharmaceutical shipment status</p>
        </div>
      </div>

      {/* Load Shipment Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Load Shipment
            </CardTitle>
            <CardDescription>Enter shipment ID to load tracking details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipmentId">Shipment ID</Label>
              <div className="flex gap-2">
                <Input
                  id="shipmentId"
                  placeholder="Enter shipment ID"
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                />
                <Button onClick={handleLoadShipment}>Load</Button>
              </div>
            </div>

            {selectedShipment && (
              <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Shipment Loaded</h3>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Origin</p>
                      <p className="text-sm">{selectedShipment.origin_facility}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Destination</p>
                      <p className="text-sm">{selectedShipment.destination_facility}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                      <p className="text-sm">{selectedShipment.quantity_shipped}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Temperature</p>
                      <p className="text-sm">{selectedShipment.temperature || "N/A"}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {selectedShipment.status}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Section */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Update Status
            </CardTitle>
            <CardDescription>Update shipment location and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newStatus">New Status</Label>
              <Select onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Dispatched">Dispatched</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentLocation">Destination Facility / Location</Label>
              <Input
                id="currentLocation"
                placeholder="Enter current location"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature Reading</Label>
              <Input
                id="temperature"
                placeholder="Enter temperature"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="updateTime">Arrival / Update Time</Label>
              <Input
                id="updateTime"
                type="datetime-local"
                value={updateTime}
                onChange={(e) => setUpdateTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Received Condition / Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this update..."
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
              />
            </div>

            <Button onClick={handleUpdateStatus} className="w-full" disabled={!selectedShipment}>
              Update Shipment Status
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UpdateShipment;
