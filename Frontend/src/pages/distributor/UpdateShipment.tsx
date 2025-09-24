import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, MapPin, Clock, Package, CheckCircle, AlertTriangle, RotateCcw, FileText, Activity } from "lucide-react";

const UpdateShipment = () => {
   const sidebarItems = [
    { icon: Truck, label: 'Dashboard', path: '/distributor/dashboard', active: false },
    { icon: Package, label: 'Active Shipments', path: '/distributor/active-shipments', active: false },
    { icon: RotateCcw, label: 'Update Shipment', path: '/distributor/update-shipment', active: true },
    { icon: FileText, label: 'Shipment Logs', path: '/distributor/shipment-logs', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/distributor/activity-logs', active: false },
  ];

  const [shipmentId, setShipmentId] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [updateNotes, setUpdateNotes] = useState("");

  const handleLoadShipment = () => {
    setSelectedShipment({
      id: "SH-2024-001234",
      origin: "PharmaCorp Manufacturing - Nairobi",
      destination: "City Pharmacy - Mombasa",
      status: "In Transit",
      driver: "John Kamau",
      vehicle: "KCA 123X",
      departureTime: "2024-01-15 08:00",
      estimatedArrival: "2024-01-15 18:00",
      currentLocation: "Machakos",
      temperature: "2-8°C",
      items: [
        { name: "Amoxicillin 500mg", quantity: "1000 units", batchNumber: "AMX-2024-001" },
        { name: "Paracetamol 500mg", quantity: "2000 units", batchNumber: "PCM-2024-002" }
      ]
    });
  };

  const handleUpdateStatus = () => {
    alert("Shipment status updated successfully!");
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
            Update Shipment
          </h1>
          <p className="text-muted-foreground">Track and update pharmaceutical shipment status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Load Shipment
            </CardTitle>
            <CardDescription>
              Enter shipment ID to load tracking details
            </CardDescription>
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
                      <p className="text-sm">{selectedShipment.origin}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Destination</p>
                      <p className="text-sm">{selectedShipment.destination}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Driver</p>
                      <p className="text-sm">{selectedShipment.driver}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vehicle</p>
                      <p className="text-sm">{selectedShipment.vehicle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Current Location: {selectedShipment.currentLocation}</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {selectedShipment.status}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Update Status
            </CardTitle>
            <CardDescription>
              Update shipment location and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newStatus">New Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="arrived">Arrived at Destination</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentLocation">Current Location</Label>
              <Input
                id="currentLocation"
                placeholder="Enter current location"
                defaultValue={selectedShipment?.currentLocation}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature Reading</Label>
              <Input
                id="temperature"
                placeholder="Enter temperature"
                defaultValue={selectedShipment?.temperature}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="updateTime">Update Time</Label>
              <Input
                id="updateTime"
                type="datetime-local"
                defaultValue="2024-01-15T15:30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Update Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about the update..."
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
              />
            </div>

            <Button
              onClick={handleUpdateStatus}
              className="w-full"
              disabled={!selectedShipment}
            >
              Update Shipment Status
            </Button>
          </CardContent>
        </Card>
      </div>

      {selectedShipment && (
        <Card>
          <CardHeader>
            <CardTitle>Shipment Contents</CardTitle>
            <CardDescription>Items in this shipment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedShipment.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Batch: {item.batchNumber}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{item.quantity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
          <CardDescription>Latest shipment status updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: "15:30", location: "Machakos", status: "In Transit", temp: "4°C" },
              { time: "12:00", location: "Nairobi", status: "Dispatched", temp: "3°C" },
              { time: "08:00", location: "PharmaCorp", status: "Loaded", temp: "2°C" }
            ].map((update, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{update.time} - {update.location}</p>
                    <p className="text-sm text-muted-foreground">Temperature: {update.temp}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {update.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default UpdateShipment;