import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Package, Plus, List, Shield, Activity, Truck, Eye, Edit, Link2, ArrowRight, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

// Add type declaration for window.toast
declare global {
  interface Window {
    toast?: {
      error: (msg: string) => void;
      [key: string]: any;
    };
  }
}

const sidebarItems = [
    { icon: Package, label: "Dashboard", path: "/manufacturer/dashboard", active: false },
    { icon: Plus, label: "Register Batch", path: "/manufacturer/register-batch", active: false},
    { icon: List, label: "Batches", path: "/manufacturer/batches", active: false },
    { icon: Activity, label: "Analytics", path: "/manufacturer/analytics", active: false},
    { icon: Truck, label: "Shipments", path: "/manufacturer/shipments", active: true},
];

const Shipments = () => {
  type ShipmentDetails = {
    id: number;
    shipmentnumber: string;
    batchnumber: string;
    drug: string;
    distributor: string;
    status: string;
    departure_date?: string;
    arrival_date?: string;
    route?: string;
    vehicle_number?: string;
    temperature?: string;
    qrcode?: string;
    shipment_type?: string;
    blockchaintx?: string;
  };

  const [showDetails, setShowDetails] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentDetails | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const API_BASE_URL = 'http://localhost:4000';
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ batch_id: '', distributor_company_id: '', destination_facility_id: '', pharmacy_company_id: '', pharmacy_facility_id: '', quantity_shipped: '', vehicle_number: '', route: '', temperature: '', shipment_type: 'Manufacturer→Distributor→Pharmacist' });
  const [statusUpdate, setStatusUpdate] = useState('');

  // Manual fetch for shipments with token and error/loading state
  const [shipments, setShipments] = useState<any[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);
  const [shipmentsError, setShipmentsError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setShipments([]);
      setShipmentsError('Not authenticated');
      setShipmentsLoading(false);
      return;
    }
    const fetchShipments = async () => {
      setShipmentsLoading(true);
      setShipmentsError(null);
      try {
        const res = await axios.get('http://localhost:4000/api/manufacturer/shipments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setShipments(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setShipmentsError(err?.response?.data?.message || 'Failed to load shipments. Please try again.');
        setShipments([]);
      } finally {
        setShipmentsLoading(false);
      }
    };
    fetchShipments();
  }, []);

  // Shipment details
  const { data: shipmentDetails } = useQuery<ShipmentDetails | null>({
    queryKey: ['manufacturer-shipment-details', selectedShipment?.id],
    queryFn: async (): Promise<ShipmentDetails | null> => {
      if (!selectedShipment) return null;
      const res = await axios.get<ShipmentDetails>(`/api/manufacturer/shipment/${selectedShipment.id}`);
      return res.data;
    },
    enabled: !!selectedShipment
  });

    // Dropdown state
    const [dropdowns, setDropdowns] = useState({ batches: [], distributors: [], facilities: [], pharmacy_companies: [], pharmacy_facilities: [] });
    const [loadingDropdowns, setLoadingDropdowns] = useState(true);

    useEffect(() => {
      async function fetchDropdowns() {
        try {
          setLoadingDropdowns(true);
          const token = localStorage.getItem('token');
        type DropdownsResponse = {
          batches: any[];
          distributors: any[];
          facilities: any[];
          pharmacy_companies: any[];
          pharmacy_facilities: any[];
        };
          const res = await axios.get<DropdownsResponse>('http://localhost:4000/api/manufacturer/shipment/form/dropdowns', {
            headers: { Authorization: `Bearer ${token}` }
          });
            setDropdowns({
              batches: res.data.batches || [],
              distributors: res.data.distributors || [],
              facilities: res.data.facilities || [],
              pharmacy_companies: res.data.pharmacy_companies || [],
              pharmacy_facilities: res.data.pharmacy_facilities || []
            });
        } catch (err) {
          // Fallback demo data
          setDropdowns({
            batches: [
              { id: 1, batchnumber: 'BATCH-001', drugname: 'Paracetamol' },
              { id: 2, batchnumber: 'BATCH-002', drugname: 'Ibuprofen' }
            ],
            distributors: [
              { id: 1, name: 'Kenya Medical Distributors', display_name: 'Kenya Medical Distributors - Kisumu' },
              { id: 2, name: 'Nairobi Medical Distributors', display_name: 'Nairobi Medical Distributors - Nairobi' }
            ],
            facilities: [
              { id: 23, distributor_id: 1, facility_name: 'Kenya Medical Distributors', facility_location: 'Kisumu' },
              { id: 24, distributor_id: 2, facility_name: 'Nairobi Medical Distributors', facility_location: 'Nairobi' }
            ],
            pharmacy_companies: [
              { id: 1, name: 'Goodlife Pharmacy' },
              { id: 2, name: 'Haltons Pharmacy' }
            ],
            pharmacy_facilities: [
              { id: 101, pharmacy_company_id: 1, name: 'Goodlife Westlands', location: 'Westlands' },
              { id: 102, pharmacy_company_id: 2, name: 'Haltons CBD', location: 'CBD' }
            ]
          });
          // Optionally show a toast if you use a toast library
          if (window.toast) window.toast.error('Using demo data. API connection issue detected.');
        } finally {
          setLoadingDropdowns(false);
        }
      }
      fetchDropdowns();
    }, []);

    // Filter facilities based on selected distributor
      const filteredFacilities = dropdowns.facilities.filter(f => f.distributor_id === Number(createData.distributor_company_id));
      const filteredPharmacyFacilities = (() => {
        const selectedCompany = dropdowns.pharmacy_companies.find(pc => pc.id === Number(createData.pharmacy_company_id));
        if (!selectedCompany) return [];
        return dropdowns.pharmacy_facilities.filter(f => f.id === selectedCompany.facility_id);
      })();

  // Create shipment mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof createData) => {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:4000/api/manufacturer/shipments', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => { setShowCreate(false); },
    onError: (error: any) => {
      if (window.toast) {
        const msg = error?.response?.data?.message || error?.message || 'Failed to create shipment';
        window.toast.error(msg);
      }
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => (await axios.put(`/api/manufacturer/shipment/${id}/status`, { status })).data,
    onSuccess: () => { setShowDetails(false); }
  });

  // Table columns: Show all shipments for manufacturer's drug batches
  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="manufacturer" userName="Sarah Manufacturer" userEmail="sarah@pharmaceutical.co.ke">
      <div className="min-h-screen bg-gray-50 py-8 px-2 md:px-8 space-y-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Outgoing Shipments</h1>
        </div>
        <Card className="rounded-xl shadow-lg border border-gray-200">
          <CardHeader>
            <CardTitle>Shipment List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-100 to-red-100 text-gray-700">
                    <th className="px-4 py-2 font-semibold text-left">Shipment No</th>
                    <th className="px-4 py-2 font-semibold text-left">Batch</th>
                    <th className="px-4 py-2 font-semibold text-left">Drug</th>
                    <th className="px-4 py-2 font-semibold text-left">Distributor</th>
                    <th className="px-4 py-2 font-semibold text-left">Status</th>
                    <th className="px-4 py-2 font-semibold text-left">Departure Date</th>
                    <th className="px-4 py-2 font-semibold text-left">Arrival Date</th>
                    <th className="px-4 py-2 font-semibold text-left">Quantity</th>
                    <th className="px-4 py-2 font-semibold text-left">Temperature</th>
                    <th className="px-4 py-2 font-semibold text-left">Route</th>
                    <th className="px-4 py-2 font-semibold text-left">Vehicle No</th>
                    <th className="px-4 py-2 font-semibold text-left">QR Code</th>
                  </tr>
                </thead>
                <tbody>
                  {shipmentsLoading ? (
                    <tr>
                      <td colSpan={12} className="text-center py-8">Loading shipments...</td>
                    </tr>
                  ) : shipmentsError ? (
                    <tr>
                      <td colSpan={12} className="text-center text-red-500 py-8">{shipmentsError}</td>
                    </tr>
                  ) : shipments.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center text-muted-foreground py-8">No shipments found.</td>
                    </tr>
                  ) : (
                    shipments.map((s, idx) => (
                      <tr key={s.id} className={idx % 2 === 0 ? "bg-white" : "bg-orange-50" + " hover:bg-orange-100 transition-colors duration-150"}>
                        <td className="px-4 py-2 rounded-l-xl">{s.shipmentnumber}</td>
                        <td className="px-4 py-2">{s.batchnumber}</td>
                        <td className="px-4 py-2">{s.drug}</td>
                        <td className="px-4 py-2">{s.distributor}</td>
                        <td className="px-4 py-2">
                          <Badge variant={s.status === 'completed' ? 'secondary' : s.status === 'in_transit' ? 'outline' : s.status === 'flagged' ? 'destructive' : 'default'}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">{s.departure_date ? new Date(s.departure_date).toLocaleString() : '-'}</td>
                        <td className="px-4 py-2">{s.arrival_date ? new Date(s.arrival_date).toLocaleString() : '-'}</td>
                        <td className="px-4 py-2">{(s.quantity_shipped !== undefined && s.quantity_shipped !== null) ? String(s.quantity_shipped) : '-'}</td>
                        <td className="px-4 py-2">{s.temperature}</td>
                        <td className="px-4 py-2">{s.route}</td>
                        <td className="px-4 py-2">{s.vehicle_number}</td>
                        <td className="px-4 py-2 rounded-r-xl">
                          {s.qrcode_path ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg shadow-sm"
                              onClick={() => {
                                let url = s.qrcode_path;
                                if (url.startsWith('/')) {
                                  setQrImageUrl(`${API_BASE_URL}${url}`);
                                } else {
                                  setQrImageUrl(url);
                                }
                                setShowQrModal(true);
                              }}
                            >
                              Show QR
                            </Button>
                          ) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* Details Modal */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Shipment Details</DialogTitle>
            </DialogHeader>
            {shipmentDetails ? (
              <div className="space-y-2">
                <div><b>Shipment No:</b> {shipmentDetails.shipmentnumber}</div>
                <div><b>Batch:</b> {shipmentDetails.batchnumber}</div>
                <div><b>Drug:</b> {shipmentDetails.drug}</div>
                <div><b>Distributor:</b> {shipmentDetails.distributor}</div>
                <div><b>Status:</b> <Badge>{shipmentDetails.status}</Badge></div>
                <div><b>Departure Date:</b> {shipmentDetails.departure_date ? new Date(shipmentDetails.departure_date).toLocaleString() : '-'}</div>
                <div><b>Arrival Date:</b> {shipmentDetails.arrival_date ? new Date(shipmentDetails.arrival_date).toLocaleString() : '-'}</div>
                <div><b>Route:</b> {shipmentDetails.route}</div>
                <div><b>Vehicle No:</b> {shipmentDetails.vehicle_number}</div>
                <div><b>Temperature:</b> {shipmentDetails.temperature}</div>
                <div><b>QR Code:</b> {shipmentDetails.qrcode ? <img src={shipmentDetails.qrcode} alt="QR" style={{ width: 80 }} /> : '-'}</div>
                <div><b>Shipment Type:</b> {shipmentDetails.shipment_type}</div>
                {shipmentDetails.blockchaintx && (
                  <div><b>Blockchain Tx:</b> <a href={`https://etherscan.io/tx/${shipmentDetails.blockchaintx}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 flex gap-1"><Link2 className="h-4 w-4" />{shipmentDetails.blockchaintx}</a></div>
                )}
                <div className="flex gap-2 mt-4">
                  <Select value={statusUpdate || shipmentDetails.status} onValueChange={setStatusUpdate}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Update Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Transit">In Transit</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => updateStatusMutation.mutate({ id: shipmentDetails.id, status: statusUpdate })} disabled={updateStatusMutation.isPending || !statusUpdate || statusUpdate === shipmentDetails.status}>Update Status</Button>
                </div>
              </div>
            ) : <div>Loading...</div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetails(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Shipment creation removed for manufacturer role. Only viewing shipments is allowed. */}
      </div>
    </DashboardLayout>
  );
}
export default Shipments;
