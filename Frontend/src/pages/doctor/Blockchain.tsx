import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Activity, Shield, Search, FileText, AlertTriangle, Clock } from "lucide-react";

const sidebarItems = [
    { icon: Shield, label: "Dashboard", path: "/doctor/dashboard", active: false },
    { icon: FileText, label: "Create Prescription", path: "/doctor/create-prescription", active: false },
    { icon: Clock, label: "My Prescriptions", path: "/doctor/prescriptions", active: false },
    { icon: Activity, label: "Analytics", path: "/doctor/analytics", active: false },
    { icon: AlertTriangle, label: "Blockchain", path: "/doctor/blockchain", active: true },
];

const DoctorBlockchain = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        fetch("/api/doctor/blockchain")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch blockchain prescriptions");
                return res.json();
            })
            .then((data) => {
                setEvents(data);
                setFilteredEvents(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        const filtered = events.filter(
            (event) =>
                event.referenceId.toLowerCase().includes(query) ||
                (event.patientName && event.patientName.toLowerCase().includes(query))
        );
        setFilteredEvents(filtered);
    };

    return (
        <DashboardLayout
            sidebarItems={sidebarItems}
            userRole="doctor"
            userName="Dr. Jane Doe"
            userEmail="jane.doe@hospital.go.ke"
        >
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                        On-Chain Prescriptions
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                        View, verify, and track the prescriptions you’ve issued directly on the blockchain.
                    </p>
                </div>

                <Card className="healthcare-card">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>My Blockchain Prescriptions</CardTitle>
                        <div className="relative mt-2 sm:mt-0">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by Patient or Reference ID"
                                value={searchQuery}
                                onChange={handleSearch}
                                className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                    </CardHeader>

                    <CardContent>
                        {loading ? (
                            <div className="py-8 text-center text-muted-foreground">Loading blockchain data...</div>
                        ) : error ? (
                            <div className="py-8 text-center text-destructive">{error}</div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">No prescriptions found on-chain.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm border">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="px-4 py-2 text-left">Patient</th>
                                            <th className="px-4 py-2 text-left">Reference ID</th>
                                            <th className="px-4 py-2 text-left">Drug(s)</th>
                                            <th className="px-4 py-2 text-left">Status</th>
                                            <th className="px-4 py-2 text-left">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEvents.map((event) => (
                                            <tr key={event.id} className="border-b hover:bg-muted/40 transition">
                                                <td className="px-4 py-2">{event.patientName || "—"}</td>
                                                <td className="px-4 py-2 font-medium">{event.referenceId}</td>
                                                <td className="px-4 py-2">{event.drugNames || "—"}</td>
                                                <td className="px-4 py-2">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            event.status === "issued"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : event.status === "dispensed"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {event.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">{new Date(event.createdAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default DoctorBlockchain;
