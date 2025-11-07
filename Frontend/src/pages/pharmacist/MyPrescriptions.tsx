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
	{ icon: PillBottle, label: "Dispense Drug", path: "/pharmacist/dispense", active: false },
	{ icon: Package, label: "Inventory & Requests", path: "/pharmacist/inventory-requests", active: false },
	{ icon: FileText, label: "My Prescriptions", path: "/pharmacist/myprescriptions", active: true },
	{ icon: Package, label: "Shipments", path: "/pharmacist/shipments", active: false },
];

const MyPrescriptions: React.FC = () => {
	const [prescriptions, setPrescriptions] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
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
		fetchPrescriptions();
	}, []);

	const allPrescriptions = prescriptions.filter(p => p.status !== "dispensed");
	const dispensedPrescriptions = prescriptions.filter(p => p.status === "dispensed");

	return (
		<DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist">
			<div className="p-6">
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList>
						<TabsTrigger value="all">All Prescription</TabsTrigger>
						<TabsTrigger value="dispensed">Dispensed Prescription</TabsTrigger>
					</TabsList>
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
													<td>{p.issue_date || p.issueDate}</td>
													<td>{p.expiry_date || p.validUntil}</td>
													<td>
														<Button
															variant="default"
															size="sm"
															onClick={() => navigate(`/pharmacist/dispense?id=${p.id}`)}
														>
															Dispense
														</Button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
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
												<td>{p.issue_date || p.issueDate}</td>
												<td>{p.expiry_date || p.validUntil}</td>
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
