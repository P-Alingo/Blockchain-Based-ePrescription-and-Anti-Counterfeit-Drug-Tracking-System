import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, Activity, PillBottle, Package, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:4000';
const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use(config => {
	const token = localStorage.getItem('token');
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

import DashboardLayout from '@/components/layout/DashboardLayout';

const Requests = () => {
			const sidebarItems = [
				{ icon: Shield, label: 'Dashboard', path: '/pharmacist/dashboard', active: false },
				{ icon: Activity, label: 'Blockchain', path: '/pharmacist/blockchain', active: false },
				{ icon: Activity, label: 'Analytics', path: '/pharmacist/analytics', active: false },
				{ icon: PillBottle, label: 'Dispense Drug', path: '/pharmacist/dispense', active: false },
				{ icon: Package, label: 'Distributors', path: '/pharmacist/distributors', active: false },
				{ icon: Package, label: 'Inventory', path: '/pharmacist/inventory', active: false },
				{ icon: FileText, label: 'My Prescriptions', path: '/pharmacist/myprescriptions', active: false },
				{ icon: Activity, label: 'Requests', path: '/pharmacist/requests', active: true },
				{ icon: Package, label: 'Shipments', path: '/pharmacist/shipments', active: false },
			];

		type Request = {
			id: string;
			drugId: string;
			quantity: number | string;
			status: string;
		};
		const [requests, setRequests] = useState<Request[]>([]);
		const [loading, setLoading] = useState(true);
		const [error, setError] = useState(null);
		const [newRequest, setNewRequest] = useState({ drugId: '', quantity: '' });
		useEffect(() => {
			const fetchRequests = async () => {
				setLoading(true);
				try {
					const res = await api.get('/api/pharmacist/requests');
					setRequests(res.data as Request[]);
				} catch (err) {
					setError('Failed to fetch requests');
					toast.error('Failed to fetch requests');
				} finally {
					setLoading(false);
				}
			};
			fetchRequests();
		}, []);

		const handleCreateRequest = async () => {
			try {
				await api.post('/api/pharmacist/requests', newRequest);
				toast.success('Request created');
				setNewRequest({ drugId: '', quantity: '' });
				// Refresh requests after creation
				const res = await api.get('/api/pharmacist/requests');
				setRequests(res.data as Request[]);
			} catch (err) {
				toast.error(err.response?.data?.message || 'Failed to create request');
			}
		};

	return (
		<DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
			<div className="space-y-8">
				<div>
					<h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
						Batch Requests
					</h1>
					<p className="text-muted-foreground">Request new drug batches from distributors</p>
				</div>
				{loading ? (
					<div className="p-8 text-center">Loading requests...</div>
				) : error ? (
					<div className="p-8 text-center text-red-500">{error}</div>
				) : (
					<Card>
						<CardHeader>
							<CardTitle>Pharmacist Batch Requests</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="mb-4 flex gap-2">
								<input
									type="text"
									placeholder="Drug ID"
									value={newRequest.drugId}
									onChange={e => setNewRequest(r => ({ ...r, drugId: e.target.value }))}
									className="border px-2 py-1 rounded"
								/>
								<input
									type="number"
									placeholder="Quantity"
									value={newRequest.quantity}
									onChange={e => setNewRequest(r => ({ ...r, quantity: e.target.value }))}
									className="border px-2 py-1 rounded"
								/>
								<Button onClick={handleCreateRequest}>Create Request</Button>
							</div>
							{requests.length === 0 ? (
								<div className="text-center py-8">No requests found</div>
							) : (
								<table className="w-full">
									<thead>
										<tr>
											<th>ID</th>
											<th>Drug</th>
											<th>Quantity</th>
											<th>Status</th>
										</tr>
									</thead>
									<tbody>
										{requests.map(r => (
											<tr key={r.id}>
												<td>{r.id}</td>
												<td>{r.drugId}</td>
												<td>{r.quantity}</td>
												<td>{r.status}</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</CardContent>
					</Card>
				)}
			</div>
		</DashboardLayout>
	);
};
export default Requests;
