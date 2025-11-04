import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, Activity, PillBottle, Package, FileText } from 'lucide-react';
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

const Shipments = () => {
			const sidebarItems = [
				{ icon: Shield, label: 'Dashboard', path: '/pharmacist/dashboard', active: false },
				{ icon: Activity, label: 'Blockchain', path: '/pharmacist/blockchain', active: false },
				{ icon: Activity, label: 'Analytics', path: '/pharmacist/analytics', active: false },
				{ icon: PillBottle, label: 'Dispense Drug', path: '/pharmacist/dispense', active: false },
				{ icon: Package, label: 'Distributors', path: '/pharmacist/distributors', active: false },
				{ icon: Package, label: 'Inventory', path: '/pharmacist/inventory', active: false },
				{ icon: FileText, label: 'My Prescriptions', path: '/pharmacist/myprescriptions', active: false },
				{ icon: Activity, label: 'Requests', path: '/pharmacist/requests', active: false },
				{ icon: Package, label: 'Shipments', path: '/pharmacist/shipments', active: true },
			];
		const [shipments, setShipments] = useState([]);
		const [loading, setLoading] = useState(true);
		const [error, setError] = useState(null);

		useEffect(() => {
			const fetchShipments = async () => {
				setLoading(true);
				try {
					const res = await api.get('/api/pharmacist/shipments');
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
										</tr>
									</thead>
									<tbody>
										{shipments.map(s => (
											<tr key={s.id}>
												<td>{s.id}</td>
												<td>{s.batchnumber}</td>
												<td>{s.drugname}</td>
												<td>{s.status}</td>
												<td>{s.arrival_date}</td>
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
export default Shipments;
