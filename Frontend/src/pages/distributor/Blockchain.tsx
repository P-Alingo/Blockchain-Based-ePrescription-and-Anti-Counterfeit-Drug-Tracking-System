import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Truck,
  Package,
  List,
  RotateCcw,
  FileText,
  Activity,
  Search,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const API_BASE_URL = "http://localhost:4000";

const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const sidebarItems = [
  { icon: Truck, label: "Dashboard", path: "/distributor/dashboard", active: false },
  { icon: Package, label: "Shipments", path: "/distributor/shipments", active: false },
  { icon: RotateCcw, label: "Requests", path: "/distributor/requests", active: false },
  { icon: FileText, label: "Blockchain", path: "/distributor/blockchain", active: true },
  { icon: Activity, label: "Analytics", path: "/distributor/analytics", active: false },
];

type BlockchainRecord = {
  id: string;
  batchNumber?: string;
  eventType?: string;
  sender?: string;
  receiver?: string;
  status?: string;
  txHash?: string;
  timestamp?: string | number;
};

const DistributorBlockchain = () => {
  const [records, setRecords] = useState<BlockchainRecord[]>([]);
  const [filtered, setFiltered] = useState<BlockchainRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/distributor/blockchain");
      setRecords(res.data as BlockchainRecord[]);
      setFiltered(res.data as BlockchainRecord[]);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to fetch blockchain events";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // Optional: poll blockchain updates every 30s
    const interval = setInterval(loadEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value.toLowerCase();
    setSearchQuery(q);
    const filteredData = records.filter(
      (r) =>
        (r.batchNumber && r.batchNumber.toLowerCase().includes(q)) ||
        (r.receiver && r.receiver.toLowerCase().includes(q)) ||
        (r.status && r.status.toLowerCase().includes(q)) ||
        (r.eventType && r.eventType.toLowerCase().includes(q))
    );
    setFiltered(filteredData);
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="distributor"
      userName="Mike Distributor"
      userEmail="mike@logistics.co.ke"
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Blockchain Batch & Transfer Events
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            View and search live blockchain records — including batch transfers, flags, and transaction history.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Live Blockchain Records</CardTitle>
            <div className="relative mt-2 sm:mt-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Batch No, Receiver, or Status"
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
              <div className="py-8 text-center text-red-500">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No blockchain records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-2 text-left">Batch No.</th>
                      <th className="px-4 py-2 text-left">Event Type</th>
                      <th className="px-4 py-2 text-left">From</th>
                      <th className="px-4 py-2 text-left">To (Receiver)</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Tx Hash</th>
                      <th className="px-4 py-2 text-left">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((rec) => (
                      <tr key={rec.id} className="border-b hover:bg-muted/40 transition">
                        <td className="px-4 py-2 font-medium">{rec.batchNumber || "—"}</td>
                        <td className="px-4 py-2 flex items-center gap-1">
                          {rec.eventType === "Transfer" ? (
                            <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                          ) : rec.eventType === "Flagged" ? (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          ) : (
                            <List className="w-4 h-4 text-gray-500" />
                          )}
                          {rec.eventType}
                        </td>
                        <td className="px-4 py-2">{rec.sender || "—"}</td>
                        <td className="px-4 py-2">{rec.receiver || "—"}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rec.status === "in-transit"
                                ? "bg-blue-100 text-blue-800"
                                : rec.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : rec.status === "flagged"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {rec.status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs truncate max-w-[120px]">
                          {rec.txHash ? (
                            <a
                              href={`https://etherscan.io/tx/${rec.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {rec.txHash.slice(0, 10)}...
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(rec.timestamp).toLocaleString()}
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

export default DistributorBlockchain;
