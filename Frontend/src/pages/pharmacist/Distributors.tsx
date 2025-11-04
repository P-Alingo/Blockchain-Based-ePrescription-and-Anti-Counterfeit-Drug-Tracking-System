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

const Distributors = () => {
			const sidebarItems = [
				{ icon: Shield, label: 'Dashboard', path: '/pharmacist/dashboard', active: false },
				{ icon: Activity, label: 'Blockchain', path: '/pharmacist/blockchain', active: false },
				{ icon: Activity, label: 'Analytics', path: '/pharmacist/analytics', active: false },
				{ icon: PillBottle, label: 'Dispense Drug', path: '/pharmacist/dispense', active: false },
				{ icon: Package, label: 'Distributors', path: '/pharmacist/distributors', active: true },
				{ icon: Package, label: 'Inventory', path: '/pharmacist/inventory', active: false },
				{ icon: FileText, label: 'My Prescriptions', path: '/pharmacist/myprescriptions', active: false },
				{ icon: Activity, label: 'Requests', path: '/pharmacist/requests', active: false },
				{ icon: Package, label: 'Shipments', path: '/pharmacist/shipments', active: false },
			];

		type Distributor = {
			id: number;
			name: string;
			facility: string;
			location: string;
		};

		const [distributors, setDistributors] = useState<Distributor[]>([]);
		const [loading, setLoading] = useState(true);
		const [error, setError] = useState<string | null>(null);

		useEffect(() => {
			const fetchDistributors = async () => {
				setLoading(true);
				try {
					const res = await api.get<Distributor[]>('/api/pharmacist/distributors');
					setDistributors(res.data as Distributor[]);
				} catch (err) {
					setError('Failed to fetch distributors');
					toast.error('Failed to fetch distributors');
				} finally {
					setLoading(false);
				}
			};
			fetchDistributors();
		}, []);

	return (
		<DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
			<div className="space-y-8">
				<div>
					<h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
						Registered Distributors
					</h1>
					<p className="text-muted-foreground">View and manage all registered distributors</p>
				</div>
				{loading ? (
					<div className="p-8 text-center">Loading distributors...</div>
				) : error ? (
					<div className="p-8 text-center text-red-500">{error}</div>
				) : (
					<Card>
						<CardHeader>
							<CardTitle>Registered Distributors</CardTitle>
						</CardHeader>
						<CardContent>
							{distributors.length === 0 ? (
								<div className="text-center py-8">No distributors found</div>
							) : (
								<table className="w-full">
									<thead>
										<tr>
											<th>ID</th>
											<th>Name</th>
											<th>Facility</th>
											<th>Location</th>
										</tr>
									</thead>
									<tbody>
										{distributors.map(d => (
											<tr key={d.id}>
												<td>{d.id}</td>
												<td>{d.name}</td>
												<td>{d.facility}</td>
												<td>{d.location}</td>
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
export default Distributors;
