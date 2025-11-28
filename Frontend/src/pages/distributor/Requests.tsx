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
        <div className="min-h-screen bg-gray-50 py-8 px-2 md:px-8 space-y-8">
          {loading && <div className="p-8 text-center">Loading drug requests...</div>}
          {error && <div className="p-8 text-center text-red-500">{error}</div>}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
      <div className="min-h-screen bg-gray-50 py-8 px-2 md:px-8 space-y-8">
        <Card className="rounded-xl shadow-lg border border-gray-200">
          <CardHeader><CardTitle>Distributor Drug Requests</CardTitle></CardHeader>
          <CardContent>
            {drugRequests.length === 0 ? (
              <div className="text-center py-8">No drugs or requests found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-100 to-pink-100 text-gray-700">
                      <th className="px-4 py-2 font-semibold text-left">Drug</th>
                      <th className="px-4 py-2 font-semibold text-left">Batch</th>
                      <th className="px-4 py-2 font-semibold text-left">Batch Quantity</th>
                      <th className="px-4 py-2 font-semibold text-left">Expiry</th>
                      <th className="px-4 py-2 font-semibold text-left">Pharmacist Request</th>
                      <th className="px-4 py-2 font-semibold text-left">Requested Qty</th>
                      <th className="px-4 py-2 font-semibold text-left">Status</th>
                      <th className="px-4 py-2 font-semibold text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drugRequests.map(drugRow => (
                      drugRow.batches.length === 0 && drugRow.requests.length === 0 ? (
                        <tr key={drugRow.drug.id} className="bg-white hover:bg-gray-100 transition-colors duration-150">
                          <td className="px-4 py-2 rounded-l-xl">{drugRow.drug.name}</td>
                          <td colSpan={7} className="text-center text-muted-foreground">No batches or requests</td>
                        </tr>
                      ) : (
                        drugRow.batches.map((batch, batchIdx) => (
                          <React.Fragment key={batch.batch_id}>
                            {drugRow.requests.filter(r => r.batch_id === batch.batch_id).length === 0 ? (
                              <tr className={batchIdx % 2 === 0 ? "bg-white" : "bg-gray-50" + " hover:bg-pink-50 transition-colors duration-150"}>
                                <td className="px-4 py-2 rounded-l-xl">{drugRow.drug.name}</td>
                                <td className="px-4 py-2">{batch.batchnumber}</td>
                                <td className="px-4 py-2">{batch.quantity}</td>
                                <td className="px-4 py-2">{batch.expirydate}</td>
                                <td colSpan={4} className="text-center text-muted-foreground">No requests for this batch</td>
                              </tr>
                            ) : (
                              drugRow.requests.filter(r => r.batch_id === batch.batch_id).map((request, reqIdx) => (
                                <tr key={request.request_id} className={reqIdx % 2 === 0 ? "bg-white" : "bg-gray-50" + " hover:bg-purple-50 transition-colors duration-150"}>
                                  <td className="px-4 py-2 rounded-l-xl">{drugRow.drug.name}</td>
                                  <td className="px-4 py-2">{batch.batchnumber}</td>
                                  <td className="px-4 py-2">{batch.quantity}</td>
                                  <td className="px-4 py-2">{batch.expirydate}</td>
                                  <td className="px-4 py-2">{request.pharmacist_name}</td>
                                  <td className="px-4 py-2">{request.quantity_requested}</td>
                                  <td className="px-4 py-2">{request.status}</td>
                                  <td className="px-4 py-2 rounded-r-xl">
                                    {(() => {
                                      const shipmentForRequest = shipments.find(s => s.request_id === request.request_id);
                                      if (shipmentForRequest) {
                                        if (shipmentForRequest.status === 'cancelled') {
                                          return (
                                            <Button variant="destructive" size="sm" className="rounded-lg shadow-sm" disabled>
                                              Cancelled
                                            </Button>
                                          );
                                        }
                                        return (
                                          <Button variant="default" size="sm" className="rounded-lg shadow-sm" disabled>
                                            Accepted
                                          </Button>
                                        );
                                      }
                                      if (request.status === 'pending') {
                                        return (
                                          <Button variant="default" size="sm" className="rounded-lg shadow-sm" onClick={() => handleAcceptClick(request)}>
                                            Accept
                                          </Button>
                                        );
                                      }
                                      if (request.status !== 'pending') {
                                        return (
                                          <Button variant="default" size="sm" className="rounded-lg shadow-sm" disabled>
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
              </div>
            )}
          </CardContent>
        </Card>
        {acceptModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative border border-gray-200">
              <button className="absolute top-2 right-2 text-gray-500" onClick={() => setAcceptModalOpen(false)}>&times;</button>
              <h2 className="text-xl font-bold mb-4">Accept Request & Create Shipment</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Departure Date</label>
                  <input type="datetime-local" className="border rounded-lg px-2 py-1 w-full shadow-sm" value={shipmentFields.departure_date} onChange={e => setShipmentFields(f => ({ ...f, departure_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Route</label>
                  <input className="border rounded-lg px-2 py-1 w-full shadow-sm" value={shipmentFields.route} onChange={e => setShipmentFields(f => ({ ...f, route: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vehicle Number</label>
                  <input className="border rounded-lg px-2 py-1 w-full shadow-sm" value={shipmentFields.vehicle_number} onChange={e => setShipmentFields(f => ({ ...f, vehicle_number: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input className="border rounded-lg px-2 py-1 w-full shadow-sm" value={shipmentFields.quantity} onChange={e => setShipmentFields(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <Button className="w-full mt-4 rounded-lg shadow-sm" onClick={handleSubmitShipment} disabled={shipmentLoading}>{shipmentLoading ? 'Processing...' : 'Create Shipment & Accept'}</Button>
              </div>
            </div>
          </div>
        )}
        {/* Shipment Modal */}
        {shipmentModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
              <h2 className="text-xl font-bold mb-4">Create Shipment</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Pharmacist Facility</label>
                <input type="text" value={selectedRequest.pharmacist_facility || ''} readOnly className="w-full border rounded-lg px-2 py-1 bg-gray-100 shadow-sm" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Manufacturer</label>
                <input type="text" value={selectedRequest.manufacturer_name || ''} readOnly className="w-full border rounded-lg px-2 py-1 bg-gray-100 shadow-sm" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input type="number" min="1" value={shipmentFields.quantity} onChange={e => setShipmentFields(f => ({ ...f, quantity: e.target.value }))} className="w-full border rounded-lg px-2 py-1 shadow-sm" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Temperature</label>
                <input type="text" value={shipmentFields.temperature} onChange={e => setShipmentFields(f => ({ ...f, temperature: e.target.value }))} className="w-full border rounded-lg px-2 py-1 shadow-sm" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Route</label>
                <input type="text" value={shipmentFields.route} onChange={e => setShipmentFields(f => ({ ...f, route: e.target.value }))} className="w-full border rounded-lg px-2 py-1 shadow-sm" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Vehicle Number</label>
                <input type="text" value={shipmentFields.vehicle_number} onChange={e => setShipmentFields(f => ({ ...f, vehicle_number: e.target.value }))} className="w-full border rounded-lg px-2 py-1 shadow-sm" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Departure Date</label>
                <input type="date" value={shipmentFields.departure_date} onChange={e => setShipmentFields(f => ({ ...f, departure_date: e.target.value }))} className="w-full border rounded-lg px-2 py-1 shadow-sm" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="rounded-lg" onClick={() => { setShipmentModalOpen(false); setSelectedRequest(null); }}>Cancel</Button>
                <Button className="rounded-lg shadow-sm" onClick={handleCreateShipment}>Create Shipment</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DistributorRequests;
