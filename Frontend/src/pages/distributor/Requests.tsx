import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';

const API_BASE_URL = 'http://localhost:4000';
const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

import { Truck, Package, List, RotateCcw, FileText, Activity } from 'lucide-react';

const sidebarItems = [
	{ icon: List, label: 'Dashboard', path: '/distributor/dashboard', active: false },
	{ icon: Truck, label: 'Shipments', path: '/distributor/shipments', active: false },
	{ icon: Package, label: 'Requests', path: '/distributor/requests', active: true },
	{ icon: RotateCcw, label: 'Blockchain', path: '/distributor/blockchain', active: false },
	{ icon: Activity, label: 'Analytics', path: '/distributor/analytics', active: false },
];

const DistributorRequests: React.FC = () => {
  const navigate = useNavigate();
  const [drugRequests, setDrugRequests] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [shipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [shipmentFields, setShipmentFields] = useState({
    departure_date: '',
    route: '',
    vehicle_number: '',
    quantity: '',
    temperature: '',
  });
  const [shipmentLoading, setShipmentLoading] = useState(false);

  // Load all drugs, batches, requests, and shipments
  const loadDrugRequests = async () => {
    try {
      setLoading(true);
      const [drugRes, shipmentRes] = await Promise.all([
        api.get('/api/distributor/drug-requests'),
        api.get('/api/distributor/shipments'),
      ]);
      setDrugRequests(drugRes.data as any[]);
      setShipments(Array.isArray(shipmentRes.data) ? shipmentRes.data : (shipmentRes.data as { shipments?: any[] }).shipments || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch drug requests');
      toast.error(err.response?.data?.message || 'Failed to fetch drug requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDrugRequests(); }, []);

  // Check if requested batch and quantity are available (use batch quantity from drugRequests)
  const isAvailable = (batchId: number, quantity: number) => {
    // Find batch in drugRequests
    for (const drugRow of drugRequests) {
      const batch = drugRow.batches.find(b => b.batch_id === batchId);
      if (batch) return Number(batch.quantity) >= Number(quantity);
    }
    return false;
  };

  // Accept request: open modal if available
  const handleAccept = (request: any) => {
    if (!isAvailable(request.batchnumber, request.quantity)) {
      toast.error('Requested batch/quantity not available in inventory');
      return;
    }
    setSelectedRequest(request);
    setShipmentFields({ departure_date: '', route: '', vehicle_number: '', quantity: String(request.quantity), temperature: '' });
    setAcceptModalOpen(true);
  };

  // Handler for Accept button
  const handleAcceptClick = (request: any) => {
    setSelectedRequest(request);
    setShipmentFields({
      quantity: request.quantity_requested || '',
      temperature: '',
      route: '',
      vehicle_number: '',
      departure_date: '',
    });
    setShipmentModalOpen(true);
  };

  // Submit shipment info and approve request
  const handleSubmitShipment = async () => {
    if (!selectedRequest) return;
    setShipmentLoading(true);
    try {
      // Ensure drug_id is present: try selectedRequest.drug_id, selectedRequest.drugid, or find from batch
      let drug_id = selectedRequest.drug_id || selectedRequest.drugid;
      if (!drug_id && selectedRequest.batch_id) {
        // Find drug_id from drugRequests
        for (const drugRow of drugRequests) {
          if (drugRow.batches.some(b => b.batch_id === selectedRequest.batch_id)) {
            drug_id = drugRow.drug.id;
            break;
          }
        }
      }
      await api.post('/api/distributor/shipments', {
  batch_id: selectedRequest.batch_id,
  drug_id,
  manufacturer_id: selectedRequest.manufacturer_id,
  pharmacist_id: selectedRequest.pharmacist_id,
  quantity_shipped: shipmentFields.quantity,
  temperature: shipmentFields.temperature,
  route: shipmentFields.route,
  vehicle_number: shipmentFields.vehicle_number,
  departure_date: shipmentFields.departure_date,
  origin_facility_id: selectedRequest.manufacturer_facility_id,
  destination_facility_id: selectedRequest.pharmacist_facility_id,
      });
      await api.put(`/api/distributor/requests/${selectedRequest.id}/approve`);
  toast.success('Request accepted and shipment created');
  setAcceptModalOpen(false);
  setSelectedRequest(null);
  setShipmentFields({ departure_date: '', route: '', vehicle_number: '', quantity: '', temperature: '' });
  // Auto-refresh after request is created
  setTimeout(() => { loadDrugRequests(); }, 500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create shipment');
    } finally {
      setShipmentLoading(false);
    }
  };

  // Reject request
  const handleReject = async (id: number) => {
    try {
      await api.put(`/api/distributor/requests/${id}/reject`);
      toast.success('Request rejected');
  loadDrugRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    }
  };

  // Handler for shipment creation
  const handleCreateShipment = async () => {
    if (!selectedRequest) return;
    try {
      // Ensure drug_id is present: try selectedRequest.drug_id, selectedRequest.drugid, or find from batch
      let drug_id = selectedRequest.drug_id || selectedRequest.drugid;
      if (!drug_id && selectedRequest.batch_id) {
        for (const drugRow of drugRequests) {
          if (drugRow.batches.some(b => b.batch_id === selectedRequest.batch_id)) {
            drug_id = drugRow.drug.id;
            break;
          }
        }
      }
      // Create shipment in backend
      await api.post('/api/distributor/shipments', {
        batch_id: selectedRequest.batch_id,
        drug_id,
        manufacturer_id: selectedRequest.manufacturer_id,
        pharmacist_id: selectedRequest.pharmacist_id,
        quantity_shipped: shipmentFields.quantity,
        temperature: shipmentFields.temperature,
        route: shipmentFields.route,
        vehicle_number: shipmentFields.vehicle_number,
        departure_date: shipmentFields.departure_date,
        origin_facility_id: selectedRequest.manufacturer_facility_id,
        destination_facility_id: selectedRequest.pharmacist_facility_id,
      });
      // Automatically trigger blockchain batch transfer
      try {
        const transferRes = await api.post('/api/distributor/batches/transfer', {
          batchId: selectedRequest.batch_id,
          toAddress: selectedRequest.pharmacist_wallet_address || '',
          status: 'in transit', // or use shipmentFields.status if available
        });
        toast.success(`Blockchain transfer successful! Tx: ${(transferRes.data as { blockchain?: { txHash?: string } })?.blockchain?.txHash || 'N/A'}`);
      } catch (blockchainErr: any) {
        toast.error(blockchainErr.response?.data?.message || 'Blockchain transfer failed');
      }
      toast.success('Shipment created');
      setShipmentModalOpen(false);
      setSelectedRequest(null);
      setShipmentFields({ quantity: '', temperature: '', route: '', vehicle_number: '', departure_date: '' });
      // Auto-refresh after shipment is created
      setTimeout(() => { loadDrugRequests(); }, 500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create shipment');
    }
  };

  if (loading || error) {
    return (
      <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
        {loading && <div className="p-8 text-center">Loading drug requests...</div>}
        {error && <div className="p-8 text-center text-red-500">{error}</div>}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
      <div className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Distributor Drug Requests</CardTitle></CardHeader>
          <CardContent>
            {drugRequests.length === 0 ? (
              <div className="text-center py-8">No drugs or requests found</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Drug</th>
                    <th>Batch</th>
                    <th>Batch Quantity</th>
                    <th>Expiry</th>
                    <th>Pharmacist Request</th>
                    <th>Requested Qty</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drugRequests.map(drugRow => (
                    drugRow.batches.length === 0 && drugRow.requests.length === 0 ? (
                      <tr key={drugRow.drug.id}>
                        <td>{drugRow.drug.name}</td>
                        <td colSpan={7} className="text-center text-muted-foreground">No batches or requests</td>
                      </tr>
                    ) : (
                      drugRow.batches.map(batch => (
                        <React.Fragment key={batch.batch_id}>
                          {drugRow.requests.filter(r => r.batch_id === batch.batch_id).length === 0 ? (
                            <tr>
                              <td>{drugRow.drug.name}</td>
                              <td>{batch.batchnumber}</td>
                              <td>{batch.quantity}</td>
                              <td>{batch.expirydate}</td>
                              <td colSpan={4} className="text-center text-muted-foreground">No requests for this batch</td>
                            </tr>
                          ) : (
                            drugRow.requests.filter(r => r.batch_id === batch.batch_id).map(request => (
                              <tr key={request.request_id}>
                                <td>{drugRow.drug.name}</td>
                                <td>{batch.batchnumber}</td>
                                <td>{batch.quantity}</td>
                                <td>{batch.expirydate}</td>
                                <td>{request.pharmacist_name}</td>
                                <td>{request.quantity_requested}</td>
                                <td>{request.status}</td>
                                <td>
                                  {/* Show Accept button only if batch exists for the requested drug */}
                                  {/* Check if shipment exists for this request (by batch_id and pharmacist_id) */}
                                  {(() => {
                                    // Only disable Accept if a shipment exists for THIS request (by request_id)
                                    const shipmentForRequest = shipments.find(s => s.request_id === request.request_id);
                                    if (shipmentForRequest) {
                                      if (shipmentForRequest.status === 'cancelled') {
                                        return (
                                          <Button variant="destructive" size="sm" disabled>
                                            Cancelled
                                          </Button>
                                        );
                                      }
                                      return (
                                        <Button variant="default" size="sm" disabled>
                                          Accepted
                                        </Button>
                                      );
                                    }
                                    // Only show Accept if status is pending
                                    if (request.status === 'pending') {
                                      return (
                                        <Button variant="default" size="sm" onClick={() => handleAcceptClick(request)}>
                                          Accept
                                        </Button>
                                      );
                                    }
                                    // Disable Accept for approved/in_transit/delivered/cancelled/other statuses
                                    if (request.status !== 'pending') {
                                      return (
                                        <Button variant="default" size="sm" disabled>
                                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                        </Button>
                                      );
                                    }
                                    return null;
                                  })()}
                                </td>
                              </tr>
                            ))
                          )}
                        </React.Fragment>
                      ))
                    )
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        {acceptModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
              <button className="absolute top-2 right-2 text-gray-500" onClick={() => setAcceptModalOpen(false)}>&times;</button>
              <h2 className="text-xl font-bold mb-4">Accept Request & Create Shipment</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Departure Date</label>
                  <input type="datetime-local" className="border rounded px-2 py-1 w-full" value={shipmentFields.departure_date} onChange={e => setShipmentFields(f => ({ ...f, departure_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Route</label>
                  <input className="border rounded px-2 py-1 w-full" value={shipmentFields.route} onChange={e => setShipmentFields(f => ({ ...f, route: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vehicle Number</label>
                  <input className="border rounded px-2 py-1 w-full" value={shipmentFields.vehicle_number} onChange={e => setShipmentFields(f => ({ ...f, vehicle_number: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input className="border rounded px-2 py-1 w-full" value={shipmentFields.quantity} onChange={e => setShipmentFields(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <Button className="w-full mt-4" onClick={handleSubmitShipment} disabled={shipmentLoading}>{shipmentLoading ? 'Processing...' : 'Create Shipment & Accept'}</Button>
              </div>
            </div>
          </div>
        )}
        {/* Shipment Modal */}
        {shipmentModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create Shipment</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Pharmacist Facility</label>
                <input type="text" value={selectedRequest.pharmacist_facility || ''} readOnly className="w-full border rounded px-2 py-1 bg-gray-100" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Manufacturer</label>
                <input type="text" value={selectedRequest.manufacturer_name || ''} readOnly className="w-full border rounded px-2 py-1 bg-gray-100" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input type="number" min="1" value={shipmentFields.quantity} onChange={e => setShipmentFields(f => ({ ...f, quantity: e.target.value }))} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Temperature</label>
                <input type="text" value={shipmentFields.temperature} onChange={e => setShipmentFields(f => ({ ...f, temperature: e.target.value }))} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Route</label>
                <input type="text" value={shipmentFields.route} onChange={e => setShipmentFields(f => ({ ...f, route: e.target.value }))} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Vehicle Number</label>
                <input type="text" value={shipmentFields.vehicle_number} onChange={e => setShipmentFields(f => ({ ...f, vehicle_number: e.target.value }))} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Departure Date</label>
                <input type="date" value={shipmentFields.departure_date} onChange={e => setShipmentFields(f => ({ ...f, departure_date: e.target.value }))} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShipmentModalOpen(false); setSelectedRequest(null); }}>Cancel</Button>
                <Button onClick={handleCreateShipment}>Create Shipment</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DistributorRequests;
