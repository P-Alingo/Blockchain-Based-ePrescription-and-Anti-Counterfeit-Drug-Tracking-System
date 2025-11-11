import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Activity, Shield, Search, FileText, AlertTriangle, CheckSquare } from "lucide-react";

const sidebarItems = [
  		    { icon: Shield, label: 'Dashboard', path: '/regulator/dashboard', active: false },
			{ icon: Search, label: 'Audits', path: '/regulator/audits', active: false },
			{ icon: FileText, label: 'Traceability', path: '/regulator/traceability', active: false },
			{ icon: AlertTriangle, label: 'Blockchain', path: '/regulator/blockchain', active: true },
			{ icon: Activity, label: 'Analytics', path: '/regulator/analytics', active: false },
		  ];

const RegulatorBlockchain = () => {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

		useEffect(() => {
					setLoading(true);
					const API_BASE = 'http://localhost:4000';
					const token = localStorage.getItem('token');
					const headers = token ? { Authorization: `Bearer ${token}` } : {};
					console.log('[RegulatorBlockchain] Fetching /api/regulator/blockchain');
					fetch(`${API_BASE}/api/regulator/blockchain`, { headers })
						.then(async (res) => {
							if (!res.ok) {
								const text = await res.text();
								if (text.startsWith('<!doctype') || text.startsWith('<html')) {
									throw new Error('Server returned an HTML error page. Check API endpoint and backend logs.');
								}
								throw new Error("Failed to fetch blockchain events");
							}
							try {
								return await res.json();
							} catch (e) {
								throw new Error('Response is not valid JSON. Check API endpoint and backend.');
							}
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
	       <div className="mb-6">
	         <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Blockchain Event Logs</h1>
	         <p className="text-lg text-muted-foreground mt-2">Verify authenticity and traceability directly from blockchain records</p>
	       </div>
	     </div>

			 <div className="mb-8">
				 <h2 className="text-xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-2">Recent Blockchain Events</h2>
			 </div>

	     <Card className="healthcare-card">
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
	                     <td className="px-4 py-2 font-medium">{event.eventname || event.eventType}</td>
	                     <td className="px-4 py-2">{event.entityid || event.referenceId}</td>
	                     <td className="px-4 py-2">{event.details}</td>
	                     <td className="px-4 py-2">{event.contractname || event.company || "-"}</td>
	                     <td className="px-4 py-2">{event.timestamp ? new Date(event.timestamp).toLocaleString() : '-'}</td>
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
