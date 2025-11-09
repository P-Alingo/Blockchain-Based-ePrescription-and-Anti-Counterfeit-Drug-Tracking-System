import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, Activity, PillBottle, Package, FileText } from 'lucide-react';
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

const Shipments = () => {
  const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/pharmacist/dashboard", active: false },
    { icon: Activity, label: "Blockchain", path: "/pharmacist/blockchain", active: false },
    { icon: Activity, label: "Analytics", path: "/pharmacist/analytics", active: false },
    { icon: PillBottle, label: "Dispense Drug", path: "/pharmacist/dispense", active: false },
    { icon: Package, label: "Inventory & Requests", path: "/pharmacist/inventory-requests", active: false },
    { icon: FileText, label: "My Prescriptions", path: "/pharmacist/myprescriptions", active: false },
    { icon: Package, label: "Shipments", path: "/pharmacist/shipments", active: true },
  ];
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodePath, setQrCodePath] = useState(null);
  const [qrDetails, setQrDetails] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    const fetchShipments = async () => {
      setLoading(true);
      try {
        const res = await api.get<any[]>('/api/pharmacist/shipments');
        setShipments(res.data as any[]);
      } catch (err) {
        setError('Failed to fetch shipments');
        toast.error('Failed to fetch shipments');
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, []);

  const handleStatusUpdate = async () => {
    if (!selectedShipment || !selectedStatus) return;
    try {
      await api.post('/api/pharmacist/shipments/confirm-delivery', {
        shipmentId: selectedShipment.id,
        status: selectedStatus
      });
      toast.success('Status updated!');
      setStatusModalOpen(false);
      setSelectedShipment(null);
      setSelectedStatus('');
      // Refresh shipments
      const res = await api.get('/api/pharmacist/shipments');
      setShipments(res.data as any[]);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Pharmacy Shipments
          </h1>
          <p className="text-muted-foreground">Track and manage all incoming shipments</p>
        </div>
        {loading ? (
          <div className="p-8 text-center">Loading shipments...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pharmacy Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              {shipments.length === 0 ? (
                <div className="text-center py-8">No shipments found</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Batch</th>
                      <th>Drug</th>
                      <th>Status</th>
                      <th>Arrival</th>
                      <th>QR Code</th>
                      <th>Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map(s => {
                      // Only show update button if distributor set status to 'delivered' and pharmacist has not confirmed
                      // If status is 'failed' or 'flagged', pharmacist cannot change
                      // If status is 'delivered' and pharmacist has not confirmed, show button
                      // If status is 'delivered' and pharmacist has confirmed, show confirmation
                      // If you have a pharmacist_status field, use it here. Otherwise, assume status changes after pharmacist confirms.
                      // New logic for Update Status column
                      let updateStatusCell;
                      if (s.status === 'completed') {
                        updateStatusCell = <span className="font-semibold text-green-700">Completed</span>;
                      } else if (s.status === 'failed') {
                        updateStatusCell = <span className="font-semibold text-red-700">Failed</span>;
                      } else if (s.status === 'flagged') {
                        updateStatusCell = <span className="font-semibold text-yellow-700">Flagged</span>;
                      } else if (s.status === 'delivered') {
                        updateStatusCell = (
                          <button
                            className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                            onClick={() => {
                              setSelectedShipment(s);
                              setStatusModalOpen(true);
                            }}
                          >
                            Update Status
                          </button>
                        );
                      } else {
                        updateStatusCell = <span className="text-gray-500">-</span>;
                      }
                      return (
                        <tr key={s.id}>
                          <td>{s.id}</td>
                          <td>{s.batchnumber}</td>
                          <td>{s.drugname || '-'}</td>
                          <td>{s.status}</td>
                          <td>{s.arrival_date ? new Date(s.arrival_date).toLocaleString() : '-'}</td>
                          <td>
                            {s.qrcode_path ? (
                              <button
                                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={() => {
                                  setQrCodePath(s.qrcode_path);
                                  setQrDetails(s);
                                  setQrModalOpen(true);
                                }}
                              >
                                QR Code
                              </button>
                            ) : '-'}
                          </td>
                          <td>{updateStatusCell}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}
        {/* QR Code Modal */}
        {qrModalOpen && qrCodePath && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-gray-500" onClick={() => setQrModalOpen(false)}>&times;</button>
              <h2 className="text-xl font-bold mb-4">Shipment QR Code</h2>
              <div className="flex flex-col items-center gap-4">
                <img src={qrCodePath.startsWith('/') ? `${API_BASE_URL}${qrCodePath}` : qrCodePath} alt="Shipment QR Code" className="w-64 h-64 object-contain border" />
                <div className="mt-4 text-left w-full">
                  <div><strong>ID:</strong> {qrDetails?.id}</div>
                  <div><strong>Batch:</strong> {qrDetails?.batchnumber}</div>
                  <div><strong>Drug:</strong> {qrDetails?.drugname}</div>
                  <div><strong>Status:</strong> {qrDetails?.status}</div>
                  <div><strong>Arrival:</strong> {qrDetails?.arrival_date ? new Date(qrDetails.arrival_date).toLocaleString() : '-'}</div>
                </div>
                <a href={qrCodePath.startsWith('/') ? `${API_BASE_URL}${qrCodePath}` : qrCodePath} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open Full Size</a>
              </div>
            </div>
          </div>
        )}
        {/* Status Update Modal */}
        {statusModalOpen && selectedShipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-gray-500" onClick={() => setStatusModalOpen(false)}>&times;</button>
              <h2 className="text-xl font-bold mb-4">Update Shipment Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                  >
                    <option value="">Select status</option>
                    <option value="completed">Completed</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>
                {/* Note field removed as per backend update */}
                <button
                  className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Shipments;