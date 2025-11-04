import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Truck, Package, List, RotateCcw, FileText, Activity } from 'lucide-react';
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
	{ icon: List, label: 'Inventory', path: '/distributor/inventory', active: true },
	{ icon: RotateCcw, label: 'Requests', path: '/distributor/requests', active: false },
	{ icon: FileText, label: 'Blockchain', path: '/distributor/blockchain', active: false },
	{ icon: Activity, label: 'Analytics', path: '/distributor/analytics', active: false },
];

const DistributorInventory = () => {
	const [inventory, setInventory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const loadInventory = async () => {
		try {
			setLoading(true);
			const res = await api.get('/api/distributor/inventory');
			setInventory(res.data as any[]);
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to fetch inventory');
			toast.error(err.response?.data?.message || 'Failed to fetch inventory');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { loadInventory(); }, []);

	if (loading || error) {
		return (
			<DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
				{loading && <div className="p-8 text-center">Loading inventory...</div>}
				{error && <div className="p-8 text-center text-red-500">{error}</div>}
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
			<div className="space-y-8">
				<Card>
					<CardHeader><CardTitle>Distributor Inventory</CardTitle></CardHeader>
					<CardContent>
						{inventory.length === 0 ? (
							<div className="text-center py-8">No inventory found</div>
						) : (
							<table className="w-full">
								<thead>
									<tr>
										<th>ID</th>
										<th>Batch</th>
										<th>Drug</th>
										<th>Quantity</th>
									</tr>
								</thead>
								<tbody>
									{inventory.map(i => (
										<tr key={i.id}>
											<td>{i.id}</td>
											<td>{i.batchnumber}</td>
											<td>{i.drugid}</td>
											<td>{i.quantity}</td>
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

export default DistributorInventory;
