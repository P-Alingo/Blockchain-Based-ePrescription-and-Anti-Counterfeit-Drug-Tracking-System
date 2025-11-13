import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Activity,
  Shield,
  Search,
  FileText,
  AlertTriangle,
  Package,
  CheckSquare,
} from "lucide-react";

const sidebarItems = [
  { icon: Shield, label: "Dashboard", path: "/pharmacist/dashboard", active: false },
  { icon: Activity, label: "Blockchain", path: "/pharmacist/blockchain", active: true },
  { icon: Activity, label: "Analytics", path: "/pharmacist/analytics", active: false },
  { icon: Package, label: "Inventory & Requests", path: "/pharmacist/inventory-requests", active: false },
  { icon: FileText, label: "My Prescriptions", path: "/pharmacist/myprescriptions", active: false },
  { icon: Package, label: "Shipments", path: "/pharmacist/shipments", active: false },
];

const PharmacistBlockchain = () => {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/pharmacist/blockchain");
        if (!res.ok) throw new Error("Failed to fetch blockchain records");
        const data = await res.json();
        setRecords(data);
        setFiltered(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filteredList = records.filter(
      (r) =>
        r.referenceId.toLowerCase().includes(query) ||
        (r.patientName && r.patientName.toLowerCase().includes(query)) ||
        (r.batchNumber && r.batchNumber.toLowerCase().includes(query))
    );
    setFiltered(filteredList);
  };

  const updateOnChain = async (recordId, actionType) => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/pharmacist/blockchain/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, actionType }),
      });
      if (!res.ok) throw new Error("Failed to update on-chain record");

      const updated = await res.json();
      setRecords((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setFiltered((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="pharmacist"
      userName="Pharmacist User"
      userEmail="pharmacist@hospital.com"
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Blockchain Prescriptions & Batch Movements
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            View, search, and manage prescriptions assigned to you — and track batch movements secured on-chain.
          </p>
        </div>

        <Card className="healthcare-card">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Prescriptions & Batch Events</CardTitle>
            <div className="relative mt-2 sm:mt-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Patient, Reference ID, or Batch"
                value={searchQuery}
                onChange={handleSearch}
                className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading blockchain data...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-destructive">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No prescriptions or batch events found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-2 text-left">Patient</th>
                      <th className="px-4 py-2 text-left">Reference ID</th>
                      <th className="px-4 py-2 text-left">Batch No.</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Timestamp</th>
                      <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((rec) => (
                      <tr key={rec.id} className="border-b hover:bg-muted/40 transition">
                        <td className="px-4 py-2">{rec.patientName || "—"}</td>
                        <td className="px-4 py-2 font-medium">{rec.referenceId}</td>
                        <td className="px-4 py-2">{rec.batchNumber || "—"}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rec.status === "issued"
                                ? "bg-blue-100 text-blue-800"
                                : rec.status === "dispensed"
                                ? "bg-green-100 text-green-800"
                                : rec.status === "flagged"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {new Date(rec.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 space-x-2">
                          {rec.status !== "dispensed" && (
                            <button
                              disabled={updating}
                              onClick={() => updateOnChain(rec.id, "dispense")}
                              className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600 disabled:opacity-50"
                            >
                              Mark Dispensed
                            </button>
                          )}
                          {rec.status !== "flagged" && (
                            <button
                              disabled={updating}
                              onClick={() => updateOnChain(rec.id, "flag")}
                              className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 disabled:opacity-50"
                            >
                              Flag Batch
                            </button>
                          )}
                        </td>
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

export default PharmacistBlockchain;
