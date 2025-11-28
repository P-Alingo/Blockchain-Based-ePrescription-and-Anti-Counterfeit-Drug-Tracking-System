import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Shield,
  Search,
  FileText,
  AlertTriangle,
  RefreshCw,
  CheckSquare,
  UserX,
  BookOpen,
} from "lucide-react";

const sidebarItems = [
  { icon: Shield, label: "Dashboard", path: "/regulator/dashboard", active: false },
  { icon: Search, label: "Audits", path: "/regulator/audits", active: false },
  { icon: FileText, label: "Traceability", path: "/regulator/traceability", active: false },
  { icon: AlertTriangle, label: "Blockchain", path: "/regulator/blockchain", active: true },
  { icon: Activity, label: "Analytics", path: "/regulator/analytics", active: false },
];

const API_BASE = "http://localhost:4000";

const RegulatorBlockchain = () => {
  const [data, setData] = useState({
    flaggedPrescriptions: [],
    userViolations: [],
    auditLogs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchBlockchainData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};


        // Fetch manufacturer violations
        console.log("[DEBUG] Fetching manufacturer violations from", `${API_BASE}/api/regulator/manufacturer-violations`);
        const violationsRes = await fetch(`${API_BASE}/api/regulator/manufacturer-violations`, { headers });
        console.log("[DEBUG] Manufacturer violations response status:", violationsRes.status);
        if (!violationsRes.ok) {
          const text = await violationsRes.text();
          console.error("[DEBUG] Manufacturer violations fetch error response:", text);
          throw new Error("Failed to fetch manufacturer violations");
        }
        const manufacturerViolations = await violationsRes.json();
        console.log("[DEBUG] Manufacturer violations data:", manufacturerViolations);

        // Fetch blockchain event logs
        console.log("[DEBUG] Fetching blockchain event logs from", `${API_BASE}/api/blockchain/events`);
        const eventRes = await fetch(`${API_BASE}/api/blockchain/events`, { headers });
        console.log("[DEBUG] Blockchain event logs response status:", eventRes.status);
        if (!eventRes.ok) {
          const text = await eventRes.text();
          console.error("[DEBUG] Blockchain event logs fetch error response:", text);
          if (text.startsWith("<!doctype") || text.startsWith("<html")) {
            throw new Error("Server returned HTML error page — check backend logs.");
          }
          throw new Error("Failed to fetch blockchain event logs");
        }
        const eventLogs = await eventRes.json();
        console.log("[DEBUG] Blockchain event logs data:", eventLogs);

        setData((prev) => ({
          flaggedPrescriptions: prev.flaggedPrescriptions,
          userViolations: manufacturerViolations,
          auditLogs: eventLogs
        }));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockchainData();
  }, []);

  const filtered = (items: any[]) =>
    items.filter((item) =>
      Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="regulator"
      userName="Dr. Jane Regulator"
      userEmail="jane@ppb.go.ke"
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">
            Blockchain Oversight
          </h1>
          <p className="text-muted-foreground text-lg mt-1">View and verify flagged batches, user violations, and audit logs from the blockchain network.</p>
        </div>

        {/* Search & Refresh */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all records..."
              className="w-96 rounded-lg shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="rounded-lg shadow-sm" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* TABS */}
        <Tabs defaultValue="userViolations" className="w-full">
          <TabsList className="rounded-xl bg-gradient-to-r from-pink-100 to-red-100 p-1 shadow-md mb-4 flex gap-2">
            <TabsTrigger value="userViolations" className="rounded-lg px-6 py-2 font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-red-400 data-[state=active]:text-white data-[state=active]:shadow-lg transition-colors">User Violations</TabsTrigger>
            <TabsTrigger value="auditLogs" className="rounded-lg px-6 py-2 font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-red-400 data-[state=active]:text-white data-[state=active]:shadow-lg transition-colors">Blockchain Event Logs</TabsTrigger>
          </TabsList>


          {/* USER VIOLATIONS */}
          <TabsContent value="userViolations">
            <Card className="rounded-xl shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="text-red-500" /> User Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading user violations...</div>
                ) : filtered(data.userViolations).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No violations found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-pink-100 to-red-100 text-gray-700">
                          <th className="px-4 py-2 text-left font-semibold">Shipment ID</th>
                          <th className="px-4 py-2 text-left font-semibold">Violator Role</th>
                          <th className="px-4 py-2 text-left font-semibold">Violator Name</th>
                          <th className="px-4 py-2 text-left font-semibold">Flagged By Role</th>
                          <th className="px-4 py-2 text-left font-semibold">Flagged By Name</th>
                          <th className="px-4 py-2 text-left font-semibold">Reason</th>
                          <th className="px-4 py-2 text-left font-semibold">Timestamp</th>
                          <th className="px-4 py-2 text-left font-semibold">Status</th>
                          <th className="px-4 py-2 text-left font-semibold">Violator Status</th>
                          <th className="px-4 py-2 text-left font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered(data.userViolations).map((u: any, idx: number) => (
                          <tr key={u.shipment_id} className={idx % 2 === 0 ? "bg-white" : "bg-pink-50" + " hover:bg-pink-100 transition-colors duration-150"}>
                            <td className="px-4 py-2 font-medium rounded-l-xl">{u.shipment_id}</td>
                            <td className="px-4 py-2">{u.violator_role}</td>
                            <td className="px-4 py-2">{u.violator_name}</td>
                            <td className="px-4 py-2">{u.flagged_by_role}</td>
                            <td className="px-4 py-2">{u.flagged_by_name}</td>
                            <td className="px-4 py-2">{u.reason}</td>
                            <td className="px-4 py-2">{u.timestamp ? new Date(u.timestamp).toLocaleString() : "-"}</td>
                            <td className="px-4 py-2">
                              <Badge variant={u.status === 'completed' ? 'default' : 'destructive'}>
                                {u.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-2">
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                color: '#fff',
                                background: u.violator_status === 'active' ? '#52c41a' : u.violator_status === 'suspended' ? '#f5222d' : '#faad14'
                              }}>
                                {u.violator_status ? (u.violator_status.charAt(0).toUpperCase() + u.violator_status.slice(1)) : 'Unknown'}
                              </span>
                            </td>
                            <td className="px-4 py-2 rounded-r-xl">
                              <Button
                                variant={u.violator_status === 'active' ? 'destructive' : 'default'}
                                onClick={async () => {
                                  const newStatus = u.violator_status === 'active' ? 'suspended' : 'active';
                                  const token = localStorage.getItem("token");
                                  const headers = {
                                    "Content-Type": "application/json",
                                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                                  };
                                  await fetch(`${API_BASE}/api/regulator/violator/${u.violator_id}/status`, {
                                    method: 'PATCH',
                                    headers,
                                    body: JSON.stringify({ status: newStatus })
                                  });
                                  // Refetch violations and event logs to show RegulatorOversight event
                                  const violationsRes = await fetch(`${API_BASE}/api/regulator/manufacturer-violations`, { headers });
                                  const manufacturerViolations = await violationsRes.json();
                                  const eventRes = await fetch(`${API_BASE}/api/blockchain/events`, { headers });
                                  const eventLogs = await eventRes.json();
                                  setData((prev) => ({
                                    ...prev,
                                    userViolations: manufacturerViolations,
                                    auditLogs: eventLogs
                                  }));
                                }}
                              >
                                {u.violator_status === 'active' ? 'Suspend' : 'Activate'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AUDIT LOGS */}
          <TabsContent value="auditLogs">
            <Card className="rounded-xl shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="text-blue-500" /> Blockchain Event Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
                ) : filtered(data.auditLogs).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No audit logs found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full rounded-xl overflow-hidden border border-gray-200 shadow-lg text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-pink-200 to-red-200 text-gray-700">
                          <th className="px-4 py-2 text-left font-semibold">ID</th>
                          <th className="px-4 py-2 text-left font-semibold">Event Name</th>
                          <th className="px-4 py-2 text-left font-semibold">Contract Name</th>
                          <th className="px-4 py-2 text-left font-semibold">Entity ID</th>
                          <th className="px-4 py-2 text-left font-semibold">Entity Type</th>
                          <th className="px-4 py-2 text-left font-semibold">Transaction Hash</th>
                          <th className="px-4 py-2 text-left font-semibold">Timestamp</th>
                          <th className="px-4 py-2 text-left font-semibold">Processed</th>
                          <th className="px-4 py-2 text-left font-semibold">Wallet Address</th>
                          <th className="px-4 py-2 text-left font-semibold">Block Number</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered(data.auditLogs)
                          .slice(0, 12)
                          .map((a: any, idx: number) => (
                            <tr key={a.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-pink-50" + " hover:bg-pink-100 transition-colors duration-150"}>
                              <td className="px-4 py-2 font-medium rounded-l-xl">{a.id}</td>
                              <td className="px-4 py-2">{a.eventname}</td>
                              <td className="px-4 py-2">{a.contractname}</td>
                              <td className="px-4 py-2">{a.entityid}</td>
                              <td className="px-4 py-2">{a.entitytype}</td>
                              <td className="px-4 py-2">{a.transactionhash}</td>
                              <td className="px-4 py-2">{a.timestamp ? new Date(a.timestamp).toLocaleString() : "-"}</td>
                              <td className="px-4 py-2">{a.processed ? "Yes" : "No"}</td>
                              <td className="px-4 py-2">{a.wallet_address}</td>
                              <td className="px-4 py-2 rounded-r-xl">{a.blocknumber}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RegulatorBlockchain;
