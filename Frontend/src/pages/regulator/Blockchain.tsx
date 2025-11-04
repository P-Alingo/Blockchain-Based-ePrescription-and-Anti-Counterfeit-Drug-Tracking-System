import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Activity, Shield, Search, FileText, AlertTriangle, CheckSquare } from "lucide-react";

const sidebarItems = [
  { icon: Shield, label: 'Dashboard', path: '/regulator/dashboard', active: false },
  { icon: Search, label: 'Audits', path: '/regulator/audits', active: false },
  { icon: FileText, label: 'Reports', path: '/regulator/reports', active: false },
  { icon: AlertTriangle, label: 'Blockchain', path: '/regulator/blockchain', active: true },
  { icon: CheckSquare, label: 'Compliance Actions', path: '/regulator/compliance', active: false },
  { icon: Activity, label: 'Analytics', path: '/regulator/analytics', active: false }
];

const RegulatorBlockchain = () => {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		setLoading(true);
		fetch("/api/regulator/blockchain")
			.then((res) => {
				if (!res.ok) throw new Error("Failed to fetch blockchain events");
				return res.json();
			})
			.then((data) => {
				setEvents(data);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, []);

	return (
		<DashboardLayout sidebarItems={sidebarItems} userRole="regulator" userName="Dr. Jane Regulator" userEmail="jane@ppb.go.ke">
			<div className="space-y-8">
				<div>
					<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Blockchain Event Logs</h1>
					<p className="text-lg text-muted-foreground mt-2">Verify authenticity and traceability directly from blockchain records</p>
				</div>
			</div>

			<Card className="healthcare-card mt-8">
				<CardHeader>
					<CardTitle>Recent Blockchain Events</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="py-8 text-center text-muted-foreground">Loading blockchain events...</div>
					) : error ? (
						<div className="py-8 text-center text-destructive">{error}</div>
					) : events.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">No blockchain events found.</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="bg-muted">
										<th className="px-4 py-2 text-left">Event Type</th>
										<th className="px-4 py-2 text-left">Reference ID</th>
										<th className="px-4 py-2 text-left">Details</th>
										<th className="px-4 py-2 text-left">Company</th>
										<th className="px-4 py-2 text-left">Timestamp</th>
									</tr>
								</thead>
								<tbody>
									{events.map((event) => (
										<tr key={event.id} className="border-b">
											<td className="px-4 py-2 font-medium">{event.eventType}</td>
											<td className="px-4 py-2">{event.referenceId}</td>
											<td className="px-4 py-2">{event.details}</td>
											<td className="px-4 py-2">{event.company || "-"}</td>
											<td className="px-4 py-2">{new Date(event.createdAt).toLocaleString()}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</DashboardLayout>
	);
};

export default RegulatorBlockchain;
