import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Truck, Package, RotateCcw, FileText, Activity, List, Clock, AlertCircle, RefreshCw, Loader2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// --------------------
// API Config
// --------------------
const API_BASE_URL = 'http://localhost:4000';
const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});



// --------------------
// Types
// --------------------
interface Shipment {
  id: number;
  shipmentnumber: string;
  batch_id: number;
  drug_id: number;
  manufacturer_id: number;
  distributor_id: number | null;
  quantity_shipped: number;
  temperature: string;
  status: string;
  departure_date: string;
  arrival_date: string | null;
  received_condition: string | null;
  origin_facility: string;
  destination_facility: string;
  created_at: string;
  updated_at: string;
  batchnumber: string;
  drugname: string;
  manufacturername: string;
  distributorname: string | null;
  shipment_type?: 'assigned' | 'destination' | 'assigned_no_destination' | 'other';
  manufacturer_company_name?: string;
  pharmacy_facility_name?: string;
  qrcode_path?: string;
}

// --------------------
// Custom Hook
// --------------------
const useShipments = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sidebarItems = [
    { icon: List, label: 'Dashboard', path: '/distributor/dashboard', active: false },
    { icon: Truck, label: 'Shipments', path: '/distributor/shipments', active: false },
    { icon: Package, label: 'Requests', path: '/distributor/requests', active: true },
    { icon: RotateCcw, label: 'Blockchain', path: '/distributor/blockchain', active: false },
    { icon: Activity, label: 'Analytics', path: '/distributor/analytics', active: false },
  ];

  const loadShipments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/distributor/shipments');
      const data = response.data;
      // Defensive: handle both array and object response
      const loadedShipments = Array.isArray(data) ? data : (data as { shipments?: Shipment[] }).shipments || [];
      setShipments(loadedShipments);
      toast.success(`Loaded ${loadedShipments.length} shipments`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch shipments');
      toast.error(err.response?.data?.message || 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShipments(); }, []);
  return { shipments, loading, error, refresh: loadShipments };
};

// --------------------
// Utilities
// --------------------
const getStatusDisplay = (status: string) => ({
  'pending': 'Pending',
  'in transit': 'In Transit',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled'
}[status.toLowerCase()] || status);

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending': return 'secondary';
    case 'in transit': return 'default';
    case 'delivered': return 'outline';
    case 'cancelled': return 'destructive';
    default: return 'outline';
  }
};

const getProgressValue = (shipment: Shipment) => {
  switch (shipment.status.toLowerCase()) {
    case 'pending': return 25;
    case 'in transit': return 65;
    case 'delivered': return 100;
    default: return 10;
  }
};

const formatDate = (dateString: string) => !dateString ? 'N/A' :
  new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const getShipmentTypeBadge = (shipment: Shipment) => {
  switch (shipment.shipment_type) {
    case 'assigned': return <Badge className="bg-blue-100 text-blue-800">Assigned</Badge>;
    case 'destination': return <Badge className="bg-orange-100 text-orange-800">Destination</Badge>;
    case 'assigned_no_destination': return <Badge className="bg-purple-100 text-purple-800">No Destination</Badge>;
    default: return <Badge>Other</Badge>;
  }
};

const isUnassigned = (shipment: Shipment) => !shipment.distributor_id;
const isOverdue = (shipment: Shipment) => {
  if (!shipment.arrival_date || shipment.status.toLowerCase() === 'delivered') return false;
  return new Date(shipment.arrival_date) < new Date();
};

// --------------------
// Main Component
// --------------------
const DistributorShipments = () => {
  // Placeholder handler functions
  const handleClaimShipment = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    // TODO: Implement claim shipment logic
    toast.info(`Claim shipment ${id}`);
  };

  const handleCancelShipment = (id: number) => {
    // TODO: Implement cancel shipment logic
    toast.info(`Cancel shipment ${id}`);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedShipment(null);
  };

  const handleUpdateShipment = async () => {
    if (!selectedShipment) return;
    try {
      // Prepare payload for backend
      const payload = {
        status: updateFields.status,
        arrival_date: updateFields.arrival_date,
        received_condition: updateFields.received_condition
      };
      await api.put(`/api/distributor/shipments/${selectedShipment.id}/status`, payload);
      toast.success('Shipment updated successfully');
      setModalOpen(false);
      setSelectedShipment(null);
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update shipment');
    }
  };
  // Use the correct sidebar items for distributor
  const sidebarItems = [
    { icon: List, label: 'Dashboard', path: '/distributor/dashboard', active: false },
    { icon: Truck, label: 'Shipments', path: '/distributor/shipments', active: true },
    { icon: Package, label: 'Requests', path: '/distributor/requests', active: false },
    { icon: RotateCcw, label: 'Blockchain', path: '/distributor/blockchain', active: false },
    { icon: Activity, label: 'Analytics', path: '/distributor/analytics', active: false },
  ];
  const userName = "Distributor";
  const userEmail = "distributor@example.com";
  const openModal = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setModalOpen(true);
  };
  // Removed manufacturer dropdown API call and related state
  const { shipments, loading, error, refresh } = useShipments();
  const [search, setSearch] = useState('');
  // Only show 'all' shipments
  const [tab, setTab] = useState<'all'>('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [updateFields, setUpdateFields] = useState({ status: '', temperature: '', received_condition: '', arrival_date: '', destination_facility: '' });
  // QR Code modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodePath, setQrCodePath] = useState<string | null>(null);

  // Create shipment modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createFields, setCreateFields] = useState({
    batch_id: '',
    drug_id: '',
    shipment_type: 'in_transit',
    departure_date: '',
    route: '',
    vehicle_number: '',
    quantity: '',
  });
  // Calculate stats
  const stats = {
    total: shipments.length,
    assigned: shipments.filter(s => !!s.distributor_id).length,
    unassigned: shipments.filter(s => !s.distributor_id).length,
    inTransit: shipments.filter(s => s.status && s.status.toLowerCase() === 'in transit').length,
  };

  // Filter shipments
  const filteredShipments = shipments.filter(s => {
    const matchesSearch =
      s.shipmentnumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.drugname?.toLowerCase().includes(search.toLowerCase()) ||
      s.batchnumber?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (s.status && s.status.toLowerCase() === filterStatus.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  // Render
  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName={userName} userEmail={userEmail}>
      <div className="space-y-8">
        {/* Tabs + Filters */}
        <div className="flex gap-4 items-center mb-4">
          <Button variant="default">All Shipments</Button>
          <select className="border rounded px-2 py-1 ml-4" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="text"
            placeholder="Search by shipment # or drug"
            className="border px-2 py-1 rounded-md ml-2"
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <Button onClick={refresh} variant="outline" className="ml-2"><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
        </div>
        {/* Stats and Table Wrapper */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Card><CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-600"/>
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <p className="text-sm text-muted-foreground">Assigned</p>
                  <p className="text-2xl font-bold text-green-600">{stats.assigned}</p>
                </div>
                <Package className="h-8 w-8 text-green-600"/>
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.unassigned}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600"/>
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <p className="text-sm text-muted-foreground">In Transit</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.inTransit}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600"/>
              </div>
            </CardContent></Card>
          </div>
          {/* Shipments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Shipments</CardTitle>
              <CardDescription>{filteredShipments.length ? "Click a shipment to update or claim it" : "No shipments found"}</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredShipments.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground"/>
                  <p className="text-muted-foreground">No shipments found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shipment #</TableHead>
                      <TableHead>Drug & Batch</TableHead>
                      <TableHead>Manufacturer Company</TableHead>
                      <TableHead>Pharmacy Facility</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Arrival</TableHead>
                      <TableHead>Condition/Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.map(s => (
                      <TableRow key={s.id} className={`cursor-pointer hover:bg-gray-50 transition-colors ${isUnassigned(s) ? "bg-orange-50 hover:bg-orange-100" : ""} ${isOverdue(s) ? "bg-red-50" : ""}`}>
                        <TableCell>{s.shipmentnumber || `SH-${s.id}`}{isUnassigned(s) && <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-1">Unclaimed</Badge>}</TableCell>
                        <TableCell>
                          <p className="font-medium">{s.drugname}</p>
                          <p className="text-xs text-muted-foreground">Batch: {s.batchnumber}</p>
                        </TableCell>
                        <TableCell>{s.manufacturer_company_name}</TableCell>
                        <TableCell>{s.pharmacy_facility_name || s.destination_facility}</TableCell>
                        <TableCell>{s.quantity_shipped}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(s.status)}>{getStatusDisplay(s.status)}</Badge>
                          {isOverdue(s) && <Badge className="bg-red-100 text-red-800 ml-1">Overdue</Badge>}
                        </TableCell>
                        <TableCell>{getShipmentTypeBadge(s)}</TableCell>
                        <TableCell>
                          <Progress value={getProgressValue(s)} className="h-2" />
                        </TableCell>
                        <TableCell>{formatDate(s.departure_date)}</TableCell>
                        <TableCell>{formatDate(s.arrival_date || '')}</TableCell>
                        <TableCell>{s.received_condition || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openModal(s)}>
                              <Edit className="h-4 w-4 mr-1" />Update
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => {
                              setQrCodePath(s.qrcode_path || null);
                              setQrModalOpen(true);
                            }} disabled={!s.qrcode_path}>
                              QR Code
                            </Button>
                            {isUnassigned(s) && (
                              <Button size="sm" variant="default" onClick={e => handleClaimShipment(s.id, e)}>
                                Claim
                              </Button>
                            )}
                            <Button size="sm" variant="destructive" onClick={() => handleCancelShipment(s.id)}>
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Update Modal */}
        {modalOpen && selectedShipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
              <button className="absolute top-2 right-2 text-gray-500" onClick={closeModal}>&times;</button>
              <h2 className="text-xl font-bold mb-4">Update Shipment</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select className="border rounded px-2 py-1 w-full" value={updateFields.status} onChange={e => setUpdateFields(f => ({ ...f, status: e.target.value }))}>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Arrival Date</label>
                  <input type="date" className="border rounded px-2 py-1 w-full" value={updateFields.arrival_date} onChange={e => setUpdateFields(f => ({ ...f, arrival_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Received Condition / Notes</label>
                  <textarea className="border rounded px-2 py-1 w-full" value={updateFields.received_condition} onChange={e => setUpdateFields(f => ({ ...f, received_condition: e.target.value }))} />
                </div>
                <Button className="w-full mt-4" onClick={handleUpdateShipment}>Update Shipment</Button>
              </div>
            </div>
          </div>
        )}
        {/* QR Code Modal */}
        {qrModalOpen && qrCodePath && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-gray-500" onClick={() => setQrModalOpen(false)}>&times;</button>
              <h2 className="text-xl font-bold mb-4">Shipment QR Code</h2>
              <div className="flex flex-col items-center gap-4">
                <img src={qrCodePath.startsWith('/') ? `${API_BASE_URL}${qrCodePath}` : qrCodePath} alt="Shipment QR Code" className="w-64 h-64 object-contain border" />
                <a href={qrCodePath.startsWith('/') ? `${API_BASE_URL}${qrCodePath}` : qrCodePath} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open Full Size</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DistributorShipments;
