import React, { useState } from 'react';
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
  const [createData, setCreateData] = useState({ batch_id: '', distributor_company_id: '', destination_facility_id: '', quantity_shipped: '', vehicle_number: '', route: '', temperature: '', shipment_type: 'Manufacturer→Distributor' });
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

  // Fetch batches for create modal
  const { data: batchesRaw } = useQuery({
    queryKey: ['manufacturer-batches'],
    queryFn: async () => (await axios.get('/api/manufacturer/batches')).data
  });
  const batches = Array.isArray(batchesRaw) ? batchesRaw : [];

  // Fetch distributor companies for create modal
  const { data: distributors = [] } = useQuery<any[]>({
    queryKey: ['distributor-companies'],
    queryFn: async (): Promise<any[]> => (await axios.get<any[]>('/api/distributor/companies')).data
  });

  // Fetch facilities for selected distributor
  const distributorList = Array.isArray(distributors) ? distributors : [];
  const facilities = distributorList.find(d => d.id === Number(createData.distributor_company_id))?.facilities || [];

  // Create shipment mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof createData) => (await axios.post('/api/manufacturer/shipment/create', data)).data,
    onSuccess: () => { setShowCreate(false); refetch(); }
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
        <Button onClick={() => setShowCreate(true)} className="flex gap-2"><Plus className="h-4 w-4" />Create Shipment</Button>
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

      {/* Create Shipment Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shipment</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(createData); }} className="space-y-4">
            <div>
              <label>Batch</label>
              <Select value={createData.batch_id} onValueChange={v => setCreateData(d => ({ ...d, batch_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select Batch" /></SelectTrigger>
                <SelectContent>
                  {batches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.batchnumber} ({b.drugname})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label>Distributor Company</label>
              <Select value={createData.distributor_company_id} onValueChange={v => setCreateData(d => ({ ...d, distributor_company_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select Distributor" /></SelectTrigger>
                <SelectContent>
                  {distributorList.map(dc => <SelectItem key={dc.id} value={String(dc.id)}>{dc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label>Facility</label>
              <Select value={createData.destination_facility_id} onValueChange={v => setCreateData(d => ({ ...d, destination_facility_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select Facility" /></SelectTrigger>
                <SelectContent>
                  {facilities.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.facility}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label>Quantity</label>
              <Input type="number" value={createData.quantity_shipped} onChange={e => setCreateData(d => ({ ...d, quantity_shipped: e.target.value }))} required />
            </div>
            <div>
              <label>Vehicle Number</label>
              <Input value={createData.vehicle_number} onChange={e => setCreateData(d => ({ ...d, vehicle_number: e.target.value }))} />
            </div>
            <div>
              <label>Route</label>
              <Input value={createData.route} onChange={e => setCreateData(d => ({ ...d, route: e.target.value }))} />
            </div>
            <div>
              <label>Temperature</label>
              <Input value={createData.temperature} onChange={e => setCreateData(d => ({ ...d, temperature: e.target.value }))} />
            </div>
            <div>
              <label>Shipment Type</label>
              <Select value={createData.shipment_type} onValueChange={v => setCreateData(d => ({ ...d, shipment_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manufacturer→Distributor">Manufacturer→Distributor</SelectItem>
                  <SelectItem value="Distributor→Pharmacist">Distributor→Pharmacist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>Save Shipment</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};
export default Shipments;
