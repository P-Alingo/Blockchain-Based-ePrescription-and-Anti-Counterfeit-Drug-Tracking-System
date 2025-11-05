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
    { icon: Shield, label: "Blockchain", path: "/manufacturer/blockchain", active: false},
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
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ batch_id: '', distributor_company_id: '', destination_facility_id: '', pharmacy_company_id: '', pharmacy_facility_id: '', quantity_shipped: '', vehicle_number: '', route: '', temperature: '', shipment_type: 'Manufacturer→Distributor→Pharmacist' });
  const [statusUpdate, setStatusUpdate] = useState('');

  // Fetch shipments
  const { data: shipments = [], refetch } = useQuery<any[]>({
    queryKey: ['manufacturer-shipments'],
    queryFn: async (): Promise<any[]> => {
      const res = await axios.get('/api/manufacturer/shipments');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

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
    onSuccess: () => { setShowCreate(false); refetch(); },
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
    onSuccess: () => { setShowDetails(false); refetch(); }
  });

  // Table columns: Shipment No | Batch | Drug | Distributor | Status | Departure Date | Arrival Date | Actions
  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="manufacturer" userName="Sarah Manufacturer" userEmail="sarah@pharmaceutical.co.ke">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Outgoing Shipments</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Shipment List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shipment No</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Drug</TableHead>
                <TableHead>Distributor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Departure Date</TableHead>
                <TableHead>Arrival Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.shipmentnumber}</TableCell>
                  <TableCell>{s.batchnumber}</TableCell>
                  <TableCell>{s.drug}</TableCell>
                  <TableCell>{s.distributor}</TableCell>
                  <TableCell><Badge variant={s.status === 'Delivered' ? 'secondary' : s.status === 'In Transit' ? 'outline' : 'default'}>{s.status}</Badge></TableCell>
                  <TableCell>{s.departure_date ? new Date(s.departure_date).toLocaleString() : '-'}</TableCell>
                  <TableCell>{s.arrival_date ? new Date(s.arrival_date).toLocaleString() : '-'}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedShipment(s); setShowDetails(true); }}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </DashboardLayout>
  );
};
export default Shipments;
