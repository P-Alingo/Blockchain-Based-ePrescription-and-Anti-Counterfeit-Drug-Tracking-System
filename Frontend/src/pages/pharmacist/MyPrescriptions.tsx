import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, QrCode, Shield, Upload, CheckCircle, AlertTriangle, Activity, PillBottle, Package, FileText } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';
const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use(config => {
	const token = localStorage.getItem('token');
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

const MyPrescriptions = () => {
		  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/pharmacist/dashboard', active: false },
    { icon: Activity, label: 'Blockchain', path: '/pharmacist/blockchain', active: false },
    { icon: Activity, label: 'Analytics', path: '/pharmacist/analytics', active: false },
    { icon: PillBottle, label: 'Dispense Drug', path: '/pharmacist/dispense', active: false },
    { icon: Package, label: 'Distributors', path: '/pharmacist/distributors', active: false },
    { icon: Package, label: 'Inventory', path: '/pharmacist/inventory', active: false },
    { icon: FileText, label: 'My Prescriptions', path: '/pharmacist/myprescriptions', active: true },
    { icon: Activity, label: 'Requests', path: '/pharmacist/requests', active: false },
    { icon: Package, label: 'Shipments', path: '/pharmacist/shipments', active: false },
  ];

		const [qrCode, setQrCode] = useState('');
		const [prescription, setPrescription] = useState(null);
		const [loading, setLoading] = useState(false);
		const [error, setError] = useState(null);
		const [dispenseStatus, setDispenseStatus] = useState(null);
		const [prescriptions, setPrescriptions] = useState([]);

		useEffect(() => {
			const fetchPrescriptions = async () => {
				setLoading(true);
				try {
					const res = await api.get('/api/pharmacist/myprescriptions');
					setPrescriptions(res.data as any[]);
				} catch (err) {
					setError('Failed to fetch prescriptions');
				} finally {
					setLoading(false);
				}
			};
			fetchPrescriptions();
		}, []);

		const handleVerify = async () => {
			setLoading(true);
			setError(null);
			setPrescription(null);
			try {
				const res = await api.post('/api/pharmacist/verify', { qrCode });
				setPrescription(res.data);
			} catch (err) {
				setError(err.response?.data?.message || 'Verification failed');
			} finally {
				setLoading(false);
			}
		};

		const handleDispense = async () => {
			if (!prescription) return;
			setDispenseStatus('loading');
			try {
				await api.post('/api/pharmacist/dispense', {
					prescriptionId: prescription.id,
					patientId: prescription.patient_id,
					drugId: prescription.drug_id,
					quantity: prescription.quantity
				});
				setDispenseStatus('success');
			} catch (err) {
				setDispenseStatus('error');
			}
		};

	return (
		<DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
			<div className="space-y-8">
				<div>
					<h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
						Pharmacist Prescription
					</h1>
					<p className="text-muted-foreground">Scan and validate patient prescription, view details, and dispense</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Scan or Enter Prescription QR</CardTitle>
						<CardDescription>Scan QR code or enter manually to fetch prescription details</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-2">
							<Input
								placeholder="Enter or scan prescription QR code"
								value={qrCode}
								onChange={e => setQrCode(e.target.value)}
								className="flex-1"
							/>
							<Button onClick={handleVerify} disabled={loading || !qrCode}>
								<QrCode className="mr-2 h-4 w-4" />
								Verify
							</Button>
						</div>
						{error && <div className="text-red-500">{error}</div>}
					</CardContent>
				</Card>

						{prescription && (
							<Card className="border-2 border-green-500/50 bg-green-50/50">
								<CardHeader>
									<CardTitle>Prescription Details</CardTitle>
									<CardDescription>Fetched from blockchain and validated</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label>Patient</Label>
											<div>{prescription.patient_name}</div>
										</div>
										<div>
											<Label>Doctor</Label>
											<div>{prescription.doctor_name}</div>
										</div>
										<div>
											<Label>Medication</Label>
											<div>{prescription.drug_name}</div>
										</div>
										<div>
											<Label>Status</Label>
											<Badge variant="secondary" className="bg-green-100 text-green-800">{prescription.status}</Badge>
										</div>
										<div>
											<Label>Dosage</Label>
											<div>{prescription.dosage}</div>
										</div>
										<div>
											<Label>Issue Date</Label>
											<div>{prescription.issue_date}</div>
										</div>
										<div>
											<Label>Expiry Date</Label>
											<div>{prescription.expiry_date}</div>
										</div>
									</div>
									<div className="mt-4">
										<Button onClick={handleDispense} disabled={dispenseStatus === 'loading'}>
											Dispense
										</Button>
										{dispenseStatus === 'success' && (
											<span className="ml-4 text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Dispensed</span>
										)}
										{dispenseStatus === 'error' && (
											<span className="ml-4 text-red-600 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Dispense failed</span>
										)}
									</div>
								</CardContent>
							</Card>
						)}

						{/* List all prescriptions fetched from backend */}
						{prescriptions.length > 0 && (
							<Card className="mt-8">
								<CardHeader>
									<CardTitle>All My Prescriptions</CardTitle>
									<CardDescription>Fetched from backend</CardDescription>
								</CardHeader>
								<CardContent>
									<table className="w-full">
										<thead>
											<tr>
												<th>ID</th>
												<th>Patient</th>
												<th>Doctor</th>
												<th>Drug</th>
												<th>Status</th>
												<th>Issue Date</th>
												<th>Expiry Date</th>
											</tr>
										</thead>
										<tbody>
											{prescriptions.map((p) => (
												<tr key={p.id}>
													<td>{p.id}</td>
													<td>{p.patient_name}</td>
													<td>{p.doctor_name}</td>
													<td>{p.drug_name}</td>
													<td>{p.status}</td>
													<td>{p.issue_date}</td>
													<td>{p.expiry_date}</td>
												</tr>
											))}
										</tbody>
									</table>
								</CardContent>
							</Card>
						)}
			</div>
		</DashboardLayout>
	);
};

export default MyPrescriptions;
