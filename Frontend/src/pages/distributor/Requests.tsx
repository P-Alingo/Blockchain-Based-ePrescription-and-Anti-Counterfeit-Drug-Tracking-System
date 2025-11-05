import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Truck, Package, List, RotateCcw, FileText, Activity } from 'lucide-react';
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

const sidebarItems = [
  { icon: Truck, label: 'Dashboard', path: '/distributor/dashboard', active: false },
  { icon: Package, label: 'Shipments', path: '/distributor/shipments', active: false },
  { icon: RotateCcw, label: 'Requests', path: '/distributor/requests', active: true },
  { icon: FileText, label: 'Blockchain', path: '/distributor/blockchain', active: false },
  { icon: Activity, label: 'Analytics', path: '/distributor/analytics', active: false },
];

const DistributorRequests = () => {
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const loadRequests = async () => {
		try {
			setLoading(true);
			const res = await api.get('/api/distributor/requests');
			setRequests(res.data as any[]);
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to fetch requests');
			toast.error(err.response?.data?.message || 'Failed to fetch requests');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { loadRequests(); }, []);

	const handleApprove = async (id) => {
		try {
			await api.put(`/api/distributor/requests/${id}/approve`);
			toast.success('Request approved');
			loadRequests();
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to approve request');
		}
	};
	const handleReject = async (id) => {
		try {
			await api.put(`/api/distributor/requests/${id}/reject`);
			toast.success('Request rejected');
			loadRequests();
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to reject request');
		}
	};

	if (loading || error) {
		return (
			<DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
				{loading && <div className="p-8 text-center">Loading requests...</div>}
				{error && <div className="p-8 text-center text-red-500">{error}</div>}
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
			<div className="space-y-8">
				<Card>
					<CardHeader><CardTitle>Distributor Requests</CardTitle></CardHeader>
					<CardContent>
						{requests.length === 0 ? (
							<div className="text-center py-8">No requests found</div>
						) : (
							<table className="w-full">
								<thead>
									<tr>
										<th>ID</th>
										<th>Pharmacist</th>
										<th>Drug Batch</th>
										<th>Quantity</th>
										<th>Status</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{requests.map(r => (
										<tr key={r.id}>
											<td>{r.id}</td>
											<td>{r.pharmacist}</td>
											<td>{r.batchnumber}</td>
											<td>{r.quantity}</td>
											<td>{r.status}</td>
											<td>
												{r.status === 'Pending' && (
													<>
														<Button size="sm" onClick={() => handleApprove(r.id)}>Approve</Button>
														<Button size="sm" variant="destructive" onClick={() => handleReject(r.id)} className="ml-2">Reject</Button>
													</>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
};

export default DistributorRequests;
