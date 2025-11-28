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
	const [inventory, setInventory] = useState<any[]>([]);
	const navigate = useNavigate();

	// Fetch prescriptions function for refresh and initial load
	const fetchPrescriptions = async () => {
		setLoading(true);
		try {
			const res = await api.get<any[]>("/api/pharmacist/prescriptions");
			// For each prescription, fetch on-chain status
			const withStatus = await Promise.all(
				res.data.map(async (p) => {
					let contractPrescriptionId = p.contractPrescriptionId;
					if (!contractPrescriptionId && p.id) {
						try {
							const mapRes = await api.get(`/api/blockchain/prescription-map/${p.id}`);
							contractPrescriptionId = (mapRes.data as { contractPrescriptionId: string }).contractPrescriptionId;
						} catch {}
					}
					let onChainStatus = null;
					if (contractPrescriptionId) {
						try {
							const statusRes = await api.get(`/api/blockchain/prescription-status/${contractPrescriptionId}`);
							onChainStatus = (statusRes.data as { status: number }).status;
						} catch {}
					}
					return { ...p, contractPrescriptionId, onChainStatus };
				})
			);
			setPrescriptions(withStatus);
		} catch (err) {
			setError(err?.response?.data?.message || err.message || "Failed to fetch prescriptions");
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		fetchPrescriptions();
	}, []);

	// Fetch inventory for pharmacist
	const fetchInventory = async () => {
		try {
			const res = await api.get<any[]>('/api/pharmacist/inventory');
			setInventory(res.data);
		} catch (err) {
			setInventory([]);
		}
	};

	useEffect(() => {
		fetchInventory();
	}, []);

	// Debug: log all prescription IDs, contractPrescriptionIds, and onChainStatus

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
	// Show 'All' tab: prescriptions that are not dispensed (on-chain and DB)
	const allPrescriptions = filteredPrescriptions.filter(
		p => (p.onChainStatus === 0 && p.status !== "dispensed")
	);
	// Show 'Dispensed' tab: prescriptions that are dispensed either on-chain or in DB
	const dispensedPrescriptions = filteredPrescriptions.filter(
		p => p.status === "dispensed" || p.onChainStatus === 1
	);

	// Helper to check if prescription is expired
	const isPrescriptionExpired = (prescription) => {
		if (!prescription || !prescription.validUntil) return false;
		const now = new Date();
		const validUntilDate = new Date(prescription.validUntil);
		return validUntilDate < now || prescription.status === "expired";
	};

	// Helper to check if drug is in stock
	const isDrugInStock = (prescription) => {
		if (!inventory || inventory.length === 0) return false;
		const drugId = prescription.drug_id || prescription.drugId;
		const inv = inventory.find(item => item.drug_id === drugId);
		return inv && inv.quantity > 0;
	};

	// Dispense logic
	const handleDispense = async (prescription) => {
		if (isPrescriptionExpired(prescription) || prescription.onChainStatus !== 0) return;
		try {
			await api.post("/api/pharmacist/dispense", {
				prescriptionId: prescription.id,
				patientId: prescription.patient_id || prescription.patientId,
				drugId: prescription.drug_id || prescription.drugId,
				quantity: prescription.quantity || 1
			});
			setPrescriptions(prev => prev.map(p => p.id === prescription.id ? { ...p, onChainStatus: 1 } : p));
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
			<div className="min-h-screen bg-gray-50 py-8 px-2 md:px-8 space-y-8">
				<div className="flex items-center mb-4 gap-2">
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList className="flex w-full justify-center gap-4 bg-white rounded-xl shadow-sm p-2 mb-2">
							<TabsTrigger value="all" className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-purple-100 hover:text-purple-700">All Prescription</TabsTrigger>
							<TabsTrigger value="dispensed" className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-pink-100 hover:text-pink-700">Dispensed Prescription</TabsTrigger>
						</TabsList>
					</Tabs>
					<Button variant="outline" size="sm" className="shadow-md" onClick={fetchPrescriptions} disabled={loading}>
						Refresh
					</Button>
				</div>
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsContent value="all">
						<Card className="rounded-xl shadow-lg border border-gray-200">
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
											className="mb-4 w-64 border-gray-300 rounded-lg shadow-sm"
										/>
										<div className="overflow-x-auto">
											<table className="min-w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
												<thead>
													<tr className="bg-gradient-to-r from-purple-100 to-pink-100 text-gray-700">
														<th className="px-4 py-2 font-semibold text-left">ID</th>
														<th className="px-4 py-2 font-semibold text-left">Patient</th>
														<th className="px-4 py-2 font-semibold text-left">Doctor</th>
														<th className="px-4 py-2 font-semibold text-left">Drug</th>
														<th className="px-4 py-2 font-semibold text-left">Status</th>
														<th className="px-4 py-2 font-semibold text-left">Quantity</th>
														<th className="px-4 py-2 font-semibold text-left">Issue Date</th>
														<th className="px-4 py-2 font-semibold text-left">Expiry Date</th>
														<th className="px-4 py-2 font-semibold text-left">Action</th>
													</tr>
												</thead>
												<tbody>
													{allPrescriptions.map((p, idx) => (
														<tr key={p.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50" + " hover:bg-purple-50 transition-colors duration-150"}>
															<td className="px-4 py-2 rounded-l-xl">{p.id}</td>
															<td className="px-4 py-2">{p.patient_name || p.patientName}</td>
															<td className="px-4 py-2">{p.doctor_name || p.doctorName}</td>
															<td className="px-4 py-2">{p.drug_name || p.drug}</td>
															<td className="px-4 py-2">{p.status}</td>
															<td className="px-4 py-2">{p.quantity}</td>
															<td className="px-4 py-2">{formatDate(p.issue_date || p.issueDate)}</td>
															<td className="px-4 py-2">{formatDate(p.expiry_date || p.validUntil)}</td>
															<td className="px-4 py-2 rounded-r-xl space-x-2">
																{p.onChainStatus !== 0 ? (
																	<Button variant="outline" size="sm" className="rounded-lg shadow-sm" disabled>
																		{p.onChainStatus === 1
																			? "Already dispensed"
																			: "Not eligible for dispensing"}
																	</Button>
																) : (
																	<Button
																		variant="default"
																		size="sm"
																		className="rounded-lg shadow-sm"
																		onClick={() => handleDispense(p)}
																		disabled={!isDrugInStock(p)}
																	>
																		Dispense
																	</Button>
																)}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</>
								)}
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="dispensed" className="space-y-4">
						<Card className="rounded-xl shadow-lg border border-gray-200">
							<CardHeader>
								<CardTitle>Dispensed Prescriptions</CardTitle>
								<CardDescription>Prescriptions that have been dispensed</CardDescription>
							</CardHeader>
							<CardContent>
								<Input
									placeholder="Search dispensed by patient, doctor, drug, status..."
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									className="mb-4 w-64 border-gray-300 rounded-lg shadow-sm"
								/>
								<div className="overflow-x-auto">
									<table className="min-w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
										<thead>
											<tr className="bg-gradient-to-r from-pink-100 to-purple-100 text-gray-700">
												<th className="px-4 py-2 font-semibold text-left">ID</th>
												<th className="px-4 py-2 font-semibold text-left">Patient</th>
												<th className="px-4 py-2 font-semibold text-left">Doctor</th>
												<th className="px-4 py-2 font-semibold text-left">Drug</th>
												<th className="px-4 py-2 font-semibold text-left">Status</th>
												<th className="px-4 py-2 font-semibold text-left">Quantity</th>
												<th className="px-4 py-2 font-semibold text-left">Issue Date</th>
												<th className="px-4 py-2 font-semibold text-left">Expiry Date</th>
											</tr>
										</thead>
										<tbody>
											{dispensedPrescriptions.filter(p =>
												(p.patient_name || p.patientName).toLowerCase().includes(searchTerm.toLowerCase()) ||
												(p.doctor_name || p.doctorName).toLowerCase().includes(searchTerm.toLowerCase()) ||
												(p.drug_name || p.drug).toLowerCase().includes(searchTerm.toLowerCase()) ||
												p.status.toLowerCase().includes(searchTerm.toLowerCase())
											).map((p, idx) => (
												<tr key={p.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50" + " hover:bg-pink-50 transition-colors duration-150"}>
													<td className="px-4 py-2 rounded-l-xl">{p.id}</td>
													<td className="px-4 py-2">{p.patient_name || p.patientName}</td>
													<td className="px-4 py-2">{p.doctor_name || p.doctorName}</td>
													<td className="px-4 py-2">{p.drug_name || p.drug}</td>
													<td className="px-4 py-2">{p.status}</td>
													<td className="px-4 py-2">{p.quantity}</td>
													<td className="px-4 py-2">{formatDate(p.issue_date || p.issueDate)}</td>
													<td className="px-4 py-2 rounded-r-xl">{formatDate(p.expiry_date || p.validUntil)}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</DashboardLayout>
	);
};

export default MyPrescriptions;
