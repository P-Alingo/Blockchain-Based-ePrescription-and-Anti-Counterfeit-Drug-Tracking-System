import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, Eye, TrendingUp, FileText, BarChart3, Calendar, Filter, Shield, AlertTriangle, CheckSquare, Activity } from "lucide-react";

const metrics = [
  {
    title: "Total Shipments",
    value: 128,
    change: "+12%",
    color: "text-green-600",
    icon: TrendingUp,
  },
  {
    title: "Drug Batches",
    value: 54,
    change: "+8%",
    color: "text-blue-600",
    icon: BarChart3,
  },
  {
    title: "Compliance Reports",
    value: 23,
    change: "-2%",
    color: "text-yellow-600",
    icon: FileText,
  },
  {
    title: "Counterfeit Alerts",
    value: 5,
    change: "+1%",
    color: "text-red-600",
    icon: AlertTriangle,
  },
];

const Traceability = () => {
    const sidebarItems = [
             { icon: Shield, label: 'Dashboard', path: '/regulator/dashboard', active: false },
             { icon: Search, label: 'Audits', path: '/regulator/audits', active: false },
             { icon: FileText, label: 'Traceability', path: '/regulator/traceability', active: true },
             { icon: AlertTriangle, label: 'Blockchain', path: '/regulator/blockchain', active: false },
             { icon: Activity, label: 'Analytics', path: '/regulator/analytics', active: false },
           ];

  // Shipments state
  const [shipmentSearch, setShipmentSearch] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState("all");
  const [shipments, setShipments] = useState([]);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [shipmentError, setShipmentError] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showShipmentModal, setShowShipmentModal] = useState(false);

  // Drug batches state
  const [batchSearch, setBatchSearch] = useState("");
  const [batchDateRange, setBatchDateRange] = useState("all");
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [batchError, setBatchError] = useState("");
  // Drug batch modal state
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Counterfeit drugs state
  const [counterfeitDrugs, setCounterfeitDrugs] = useState([]);
  const [loadingCounterfeit, setLoadingCounterfeit] = useState(true);
  const [counterfeitError, setCounterfeitError] = useState("");
  // Fetch counterfeit drugs
  useEffect(() => {
    setLoadingCounterfeit(true);
    const API_BASE = 'http://localhost:4000';
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    console.log('[Traceability] Fetching /api/regulator/flaggeddrugs');
    fetch(`${API_BASE}/api/regulator/flaggeddrugs`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch flagged drugs");
        return res.json();
      })
      .then((data) => {
        setCounterfeitDrugs(data);
        setLoadingCounterfeit(false);
      })
      .catch((err) => {
        setCounterfeitError(err.message);
        setLoadingCounterfeit(false);
      });
  }, []);


  // Fetch shipments
  useEffect(() => {
    setLoadingShipments(true);
    const API_BASE = 'http://localhost:4000';
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    console.log('[Traceability] Fetching /api/regulator/shipments');
    fetch(`${API_BASE}/api/regulator/shipments?search=${shipmentSearch}&status=${shipmentStatus}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch shipments");
        return res.json();
      })
      .then((data) => {
        setShipments(data);
        setLoadingShipments(false);
      })
      .catch((err) => {
        setShipmentError(err.message);
        setLoadingShipments(false);
      });
  }, [shipmentSearch, shipmentStatus]);

  // Fetch drug batches
  useEffect(() => {
    setLoadingBatches(true);
    const API_BASE = 'http://localhost:4000';
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    let dateParam = '';
    switch (batchDateRange) {
      case 'today':
        dateParam = `&dateRange=today`;
        break;
      case 'week':
        dateParam = `&dateRange=week`;
        break;
      case 'month':
        dateParam = `&dateRange=month`;
        break;
      case 'year':
        dateParam = `&dateRange=year`;
        break;
      default:
        dateParam = '';
    }
    console.log('[Traceability] Fetching /api/regulator/drugbatches');
    fetch(`${API_BASE}/api/regulator/drugbatches?search=${batchSearch}${dateParam}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch drug batches");
        return res.json();
      })
      .then((data) => {
        setBatches(data);
        setLoadingBatches(false);
      })
      .catch((err) => {
        setBatchError(err.message);
        setLoadingBatches(false);
      });
  }, [batchSearch, batchDateRange]);

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="regulator" userName="Dr. Jane Regulator" userEmail="jane@ppb.go.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Regulatory Reports</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Comprehensive analysis and compliance documentation
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Schedule Report
          </Button>
          <Button className="medical-button gap-2">
            <FileText className="w-4 h-4" />
            Create Report
          </Button>
        </div>
      </div>

      {/* Shipments and Drug Batches Tabs */}
      <Tabs defaultValue="shipments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="batches">Drug Batches</TabsTrigger>
          <TabsTrigger value="counterfeit">Counterfeit Drugs</TabsTrigger>
        </TabsList>
        {/* Counterfeit Drugs Tab */}
        <TabsContent value="counterfeit" className="space-y-4">
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle>Flagged/Counterfeit Drugs</CardTitle>
              <CardDescription>All flagged or counterfeit drugs detected in shipments</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCounterfeit && (
                <div className="py-8 text-center text-muted-foreground">Loading flagged drugs...</div>
              )}
              {counterfeitError && !loadingCounterfeit && (
                <div className="py-8 text-center text-destructive">{counterfeitError}</div>
              )}
              {!loadingCounterfeit && !counterfeitError && counterfeitDrugs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="rounded-lg border border-dashed border-gray-300 bg-muted/30 px-6 py-8 shadow-sm">
                    <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
                    <div className="text-base font-semibold text-gray-700 mb-1">No flagged/counterfeit drugs found.</div>
                    <div className="text-xs text-muted-foreground">All shipments are currently clear of flagged or counterfeit drugs.</div>
                  </div>
                </div>
              )}
              {!loadingCounterfeit && !counterfeitError && counterfeitDrugs.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">Drug Name</th>
                        <th className="px-4 py-2 text-left">Batch Number</th>
                        <th className="px-4 py-2 text-left">Manufacturer</th>
                        <th className="px-4 py-2 text-left">Date Flagged</th>
                        <th className="px-4 py-2 text-left">Flag Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {counterfeitDrugs.map((drug) => (
                        <tr key={drug.id} className="border-b hover:bg-accent/50">
                          <td className="px-4 py-2">{drug.drug_name || drug.drug_id}</td>
                          <td className="px-4 py-2">{drug.batchnumber || drug.batch_id}</td>
                          <td className="px-4 py-2">{drug.manufacturer_name || drug.manufacturer_id}</td>
                          <td className="px-4 py-2">{drug.arrival_date ? new Date(drug.arrival_date).toLocaleDateString() : ''}</td>
                          <td className="px-4 py-2">{drug.received_condition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="space-y-4">
          <Card className="healthcare-card">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search shipments by number, route, or vehicle..."
                    value={shipmentSearch}
                    onChange={(e) => setShipmentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={shipmentStatus} onValueChange={setShipmentStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          {loadingShipments && (
            <div className="py-8 text-center text-muted-foreground">Loading shipments...</div>
          )}
          {shipmentError && !loadingShipments && (
            <div className="py-8 text-center text-destructive">{shipmentError}</div>
          )}
          {!loadingShipments && !shipmentError && shipments.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">No shipments found.</div>
          )}
          {!loadingShipments && !shipmentError && shipments.length > 0 && (
            <div className="grid gap-6">
              {shipments.map((shipment) => (
                <Card key={shipment.id} className="healthcare-card hover-lift border shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-blue-700">{shipment.shipmentnumber}</CardTitle>
                        <CardDescription className="text-base text-gray-600">{shipment.route}</CardDescription>
                      </div>
                      <Badge variant="outline" className={`capitalize px-3 py-1 text-xs font-semibold ${shipment.status === 'completed' ? 'bg-green-100 text-green-700 border-green-300' : shipment.status === 'failed' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}`}>{shipment.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
                      <div className="flex items-center gap-1"><span className="font-medium text-gray-700">Vehicle:</span> <span>{shipment.vehicle_number}</span></div>
                      <div className="flex items-center gap-1"><span className="font-medium text-gray-700">Quantity:</span> <span>{shipment.quantity_shipped}</span></div>
                      <div className="flex items-center gap-1"><span className="font-medium text-gray-700">Departure:</span> <span>{shipment.departure_date ? new Date(shipment.departure_date).toLocaleString() : '-'}</span></div>
                      <div className="flex items-center gap-1"><span className="font-medium text-gray-700">Arrival:</span> <span>{shipment.arrival_date ? new Date(shipment.arrival_date).toLocaleString() : '-'}</span></div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          setSelectedShipment(shipment);
                          setShowShipmentModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Shipment Details Modal */}
          {showShipmentModal && selectedShipment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowShipmentModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h2 className="text-xl font-bold mb-2 text-blue-700">Shipment Details</h2>
                <div className="space-y-2 text-sm">
                  <div><span className="font-semibold">Shipment Number:</span> {selectedShipment.shipmentnumber}</div>
                  <div><span className="font-semibold">Route:</span> {selectedShipment.route}</div>
                  <div><span className="font-semibold">Status:</span> <Badge variant="outline" className={`capitalize px-2 py-1 text-xs font-semibold ${selectedShipment.status === 'completed' ? 'bg-green-100 text-green-700 border-green-300' : selectedShipment.status === 'failed' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}`}>{selectedShipment.status}</Badge></div>
                  <div><span className="font-semibold">Vehicle:</span> {selectedShipment.vehicle_number}</div>
                  <div><span className="font-semibold">Quantity Shipped:</span> {selectedShipment.quantity_shipped}</div>
                  <div><span className="font-semibold">Departure Date:</span> {selectedShipment.departure_date ? new Date(selectedShipment.departure_date).toLocaleString() : '-'}</div>
                  <div><span className="font-semibold">Arrival Date:</span> {selectedShipment.arrival_date ? new Date(selectedShipment.arrival_date).toLocaleString() : '-'}</div>
                  {selectedShipment.driver_name && <div><span className="font-semibold">Driver Name:</span> {selectedShipment.driver_name}</div>}
                  {selectedShipment.notes && <div><span className="font-semibold">Notes:</span> {selectedShipment.notes}</div>}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Drug Batches Tab */}
        <TabsContent value="batches" className="space-y-4">
          <Card className="healthcare-card">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search drug batches by batch number, drug, or distributor..."
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          {loadingBatches && (
            <div className="py-8 text-center text-muted-foreground">Loading drug batches...</div>
          )}
          {batchError && !loadingBatches && (
            <div className="py-8 text-center text-destructive">{batchError}</div>
          )}
          {!loadingBatches && !batchError && batches.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">No drug batches found.</div>
          )}
          {!loadingBatches && !batchError && batches.length > 0 && (
            <div className="grid gap-6">
              {batches.map((batch) => (
                <Card key={batch.id} className="healthcare-card hover-lift border shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-green-700">{batch.batchnumber || batch.id}</CardTitle>
                        <CardDescription className="text-base text-gray-600">{batch.drug_name || batch.drug_id}</CardDescription>
                      </div>
                      {/* Status removed as requested */}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
                      <div className="flex items-center gap-1"><span className="font-medium text-gray-700">Distributor:</span> <span>{batch.distributor_id}</span></div>
                        <div className="flex items-center gap-1"><span className="font-medium text-gray-700">Quantity:</span> <span>{batch.quantity}</span></div>
                        <div className="flex items-center gap-1"><span className="font-medium text-gray-700">Expiry:</span> <span>{batch.expirydate ? new Date(batch.expirydate).toLocaleDateString() : '-'}</span></div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            setSelectedBatch(batch);
                            setShowBatchModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Drug Batch Details Modal */}
          {showBatchModal && selectedBatch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowBatchModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h2 className="text-xl font-bold mb-2 text-green-700">Drug Batch Details</h2>
                <div className="space-y-2 text-sm">
                  <div><span className="font-semibold">Batch Number:</span> {selectedBatch.batchnumber || selectedBatch.id}</div>
                  <div><span className="font-semibold">Drug Name:</span> {selectedBatch.drug_name || selectedBatch.drug_id || '-'}</div>
                  <div><span className="font-semibold">Distributor:</span> {selectedBatch.distributor_name || selectedBatch.distributor_id || '-'}</div>
                  <div><span className="font-semibold">Quantity:</span> {selectedBatch.quantity || selectedBatch.quantity_shipped || '-'}</div>
                  <div><span className="font-semibold">Expiry Date:</span> {selectedBatch.expirydate ? new Date(selectedBatch.expirydate).toLocaleDateString('en-GB') : '-'}</div>
                  {selectedBatch.manufacturedate && <div><span className="font-semibold">Manufacture Date:</span> {new Date(selectedBatch.manufacturedate).toLocaleDateString('en-GB')}</div>}
                  {selectedBatch.notes && <div><span className="font-semibold">Notes:</span> {selectedBatch.notes}</div>}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Traceability;