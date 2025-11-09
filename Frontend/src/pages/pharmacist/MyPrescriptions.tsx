import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, Activity, PillBottle, Package, FileText } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE_URL = "http://localhost:4000";
const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use(config => {
	const token = localStorage.getItem("token");
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

const sidebarItems = [
	{ icon: Shield, label: "Dashboard", path: "/pharmacist/dashboard", active: false },
	{ icon: Activity, label: "Blockchain", path: "/pharmacist/blockchain", active: false },
	{ icon: Activity, label: "Analytics", path: "/pharmacist/analytics", active: false },
	{ icon: Package, label: "Inventory & Requests", path: "/pharmacist/inventory-requests", active: false },
	{ icon: FileText, label: "My Prescriptions", path: "/pharmacist/myprescriptions", active: true },
	{ icon: Package, label: "Shipments", path: "/pharmacist/shipments", active: false },
];

const MyPrescriptions: React.FC = () => {
	// Format date helper
	const formatDate = (dateStr) => {
		if (!dateStr) return "";
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	};
	const [prescriptions, setPrescriptions] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	const navigate = useNavigate();

	// Fetch prescriptions function for refresh and initial load
	const fetchPrescriptions = async () => {
		setLoading(true);
		try {
			const res = await api.get<any[]>("/api/pharmacist/prescriptions");
			setPrescriptions(res.data as any[]);
		} catch (err) {
			setError(err?.response?.data?.message || err.message || "Failed to fetch prescriptions");
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		fetchPrescriptions();
	}, []);

	// Search and filter logic
	const filteredPrescriptions = prescriptions.filter(p => {
		const term = searchTerm.toLowerCase();
		return (
			(p.patient_name || p.patientName || "").toLowerCase().includes(term) ||
			(p.doctor_name || p.doctorName || "").toLowerCase().includes(term) ||
			(p.prescription_code || p.prescriptionCode || "").toLowerCase().includes(term) ||
			(p.drug_name || p.drug || "").toLowerCase().includes(term)
		);
	});
	const allPrescriptions = filteredPrescriptions.filter(p => p.status !== "dispensed");
	const dispensedPrescriptions = filteredPrescriptions.filter(p => p.status === "dispensed");

	// Helper to check if prescription is expired
	const isPrescriptionExpired = (prescription) => {
		if (!prescription || !prescription.validUntil) return false;
		const now = new Date();
		const validUntilDate = new Date(prescription.validUntil);
		return validUntilDate < now || prescription.status === "expired";
	};

	// Dispense logic
	const handleDispense = async (prescription) => {
		if (isPrescriptionExpired(prescription) || prescription.status === "dispensed") return;
		try {
			await api.post("/api/pharmacist/dispense", {
				prescriptionId: prescription.id,
				patientId: prescription.patient_id || prescription.patientId,
				drugId: prescription.drug_id || prescription.drugId,
				quantity: prescription.quantity || 1
			});
			setPrescriptions(prev => prev.map(p => p.id === prescription.id ? { ...p, status: "dispensed" } : p));
		} catch (err) {
			setError(err?.response?.data?.message || err.message || "Failed to dispense");
		}
	};

	// Expire logic
	const handleExpire = async (prescription) => {
		if (prescription.status === "expired") return;
		try {
			await api.put(`/api/pharmacist/prescriptions/${prescription.id}/expire`);
			setPrescriptions(prev => prev.map(p => p.id === prescription.id ? { ...p, status: "expired" } : p));
		} catch (err) {
			setError(err?.response?.data?.message || err.message || "Failed to expire");
		}
	};

	return (
		<DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist">
			<div className="p-6">
				<div className="flex items-center mb-4 gap-2">
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList>
							<TabsTrigger value="all">All Prescription</TabsTrigger>
							<TabsTrigger value="dispensed">Dispensed Prescription</TabsTrigger>
						</TabsList>
					</Tabs>
					<Button variant="outline" size="sm" onClick={fetchPrescriptions} disabled={loading}>
						Refresh
					</Button>
				</div>
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsContent value="all">
						<Card>
							<CardHeader>
								<CardTitle>All Prescriptions</CardTitle>
							</CardHeader>
							<CardContent>
								{loading ? (
									<div>Loading...</div>
								) : error ? (
									<div className="text-red-500">{error}</div>
								) : (
									<>
										<Input
											placeholder="Search by patient, doctor, prescription code, drug..."
											value={searchTerm}
											onChange={e => setSearchTerm(e.target.value)}
											className="mb-4 w-64"
										/>
										<table className="w-full">
											<thead>
												<tr>
													<th>ID</th>
													<th>Patient</th>
													<th>Doctor</th>
													<th>Drug</th>
													<th>Status</th>
                                                <th>Quantity</th>
													<th>Issue Date</th>
													<th>Expiry Date</th>
													<th>Action</th>
												</tr>
											</thead>
											<tbody>
												{allPrescriptions.map((p) => (
													<tr key={p.id}>
														<td>{p.id}</td>
														<td>{p.patient_name || p.patientName}</td>
														<td>{p.doctor_name || p.doctorName}</td>
														<td>{p.drug_name || p.drug}</td>
														<td>{p.status}</td>
                                                    <td>{p.quantity}</td>
														<td>{formatDate(p.issue_date || p.issueDate)}</td>
														<td>{formatDate(p.expiry_date || p.validUntil)}</td>
														<td className="space-x-2">
															{p.status === "expired" ? (
																<Button variant="outline" size="sm" disabled>
																	Expired
																</Button>
															) : (
																<Button
																	variant="default"
																	size="sm"
																	disabled={isPrescriptionExpired(p) || p.status === "dispensed"}
																	onClick={() => handleDispense(p)}
																>
																	Dispense
																</Button>
															)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</>
								)}
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="dispensed" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Dispensed Prescriptions</CardTitle>
								<CardDescription>Prescriptions that have been dispensed</CardDescription>
							</CardHeader>
							<CardContent>
								<Input
									placeholder="Search dispensed by patient, doctor, drug, status..."
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									className="mb-4 w-64"
								/>
								<table className="w-full">
									<thead>
										<tr>
											<th>ID</th>
											<th>Patient</th>
											<th>Doctor</th>
											<th>Drug</th>
											<th>Status</th>
                                        <th>Quantity</th>
											<th>Issue Date</th>
											<th>Expiry Date</th>
										</tr>
									</thead>
									<tbody>
										{dispensedPrescriptions.filter(p =>
											(p.patient_name || p.patientName).toLowerCase().includes(searchTerm.toLowerCase()) ||
											(p.doctor_name || p.doctorName).toLowerCase().includes(searchTerm.toLowerCase()) ||
											(p.drug_name || p.drug).toLowerCase().includes(searchTerm.toLowerCase()) ||
											p.status.toLowerCase().includes(searchTerm.toLowerCase())
										).map((p) => (
											<tr key={p.id}>
												<td>{p.id}</td>
												<td>{p.patient_name || p.patientName}</td>
												<td>{p.doctor_name || p.doctorName}</td>
												<td>{p.drug_name || p.drug}</td>
												<td>{p.status}</td>
                                            <td>{p.quantity}</td>
												<td>{formatDate(p.issue_date || p.issueDate)}</td>
												<td>{formatDate(p.expiry_date || p.validUntil)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</DashboardLayout>
	);
};

export default MyPrescriptions;
