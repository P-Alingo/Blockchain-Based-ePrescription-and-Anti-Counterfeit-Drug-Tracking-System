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

const RegulatorBlockchain = () => {
  const [data, setData] = useState({
    flaggedPrescriptions: [],
    flaggedBatches: [],
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
        const API_BASE = "http://localhost:4000";
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/api/regulator/blockchain`, { headers });

        if (!res.ok) {
          const text = await res.text();
          if (text.startsWith("<!doctype") || text.startsWith("<html")) {
            throw new Error("Server returned HTML error page — check backend logs.");
          }
          throw new Error("Failed to fetch blockchain data");
        }

        const result = await res.json();
        setData(result);
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
            Blockchain Oversight
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            View and verify flagged prescriptions, batches, user violations, and audit logs from the blockchain network.
          </p>
        </div>

        {/* Search & Refresh */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all records..."
              className="w-96"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* TABS */}
        <Tabs defaultValue="flaggedPrescriptions" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="flaggedPrescriptions">Flagged Prescriptions</TabsTrigger>
            <TabsTrigger value="flaggedBatches">Flagged Batches</TabsTrigger>
            <TabsTrigger value="userViolations">User Violations</TabsTrigger>
            <TabsTrigger value="auditLogs">Audit Logs</TabsTrigger>
          </TabsList>

          {/* FLAGGED PRESCRIPTIONS */}
          <TabsContent value="flaggedPrescriptions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-red-500" /> Flagged Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading flagged prescriptions...
                  </div>
                ) : error ? (
                  <div className="text-destructive text-center py-8">{error}</div>
                ) : filtered(data.flaggedPrescriptions).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No flagged prescriptions found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Prescription ID</th>
                          <th className="px-4 py-2 text-left">Reason</th>
                          <th className="px-4 py-2 text-left">Pharmacist</th>
                          <th className="px-4 py-2 text-left">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered(data.flaggedPrescriptions).map((p: any, idx: number) => (
                          <tr key={idx} className="border-b">
                            <td className="px-4 py-2 font-medium">{p.prescriptionId}</td>
                            <td className="px-4 py-2">{p.reason}</td>
                            <td className="px-4 py-2">{p.pharmacist || "-"}</td>
                            <td className="px-4 py-2">
                              {p.timestamp ? new Date(p.timestamp).toLocaleString() : "-"}
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

          {/* FLAGGED BATCHES */}
          <TabsContent value="flaggedBatches">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="text-orange-500" /> Flagged Batches
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading flagged batches...
                  </div>
                ) : filtered(data.flaggedBatches).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No flagged batches found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Batch ID</th>
                          <th className="px-4 py-2 text-left">Product</th>
                          <th className="px-4 py-2 text-left">Reason</th>
                          <th className="px-4 py-2 text-left">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered(data.flaggedBatches).map((b: any, idx: number) => (
                          <tr key={idx} className="border-b">
                            <td className="px-4 py-2 font-medium">{b.batchId}</td>
                            <td className="px-4 py-2">{b.productName}</td>
                            <td className="px-4 py-2">{b.reason}</td>
                            <td className="px-4 py-2">
                              {b.timestamp ? new Date(b.timestamp).toLocaleString() : "-"}
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

          {/* USER VIOLATIONS */}
          <TabsContent value="userViolations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="text-red-500" /> User Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading user violations...
                  </div>
                ) : filtered(data.userViolations).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No violations recorded.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">User</th>
                          <th className="px-4 py-2 text-left">Violation</th>
                          <th className="px-4 py-2 text-left">Action Taken</th>
                          <th className="px-4 py-2 text-left">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered(data.userViolations).map((u: any, idx: number) => (
                          <tr key={idx} className="border-b">
                            <td className="px-4 py-2 font-medium">{u.username}</td>
                            <td className="px-4 py-2">{u.violation}</td>
                            <td className="px-4 py-2">{u.action || "-"}</td>
                            <td className="px-4 py-2">
                              {u.timestamp ? new Date(u.timestamp).toLocaleString() : "-"}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="text-blue-500" /> Blockchain Audit Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading audit logs...
                  </div>
                ) : filtered(data.auditLogs).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No audit logs found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Action Type</th>
                          <th className="px-4 py-2 text-left">Entity</th>
                          <th className="px-4 py-2 text-left">Details</th>
                          <th className="px-4 py-2 text-left">User</th>
                          <th className="px-4 py-2 text-left">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered(data.auditLogs).map((a: any, idx: number) => (
                          <tr key={idx} className="border-b">
                            <td className="px-4 py-2 font-medium">{a.action_type}</td>
                            <td className="px-4 py-2">{a.entity_type}</td>
                            <td className="px-4 py-2">{a.details}</td>
                            <td className="px-4 py-2">{a.user || "-"}</td>
                            <td className="px-4 py-2">
                              {a.timestamp ? new Date(a.timestamp).toLocaleString() : "-"}
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RegulatorBlockchain;
