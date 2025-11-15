import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Activity, Shield, Search, FileText, AlertTriangle, CheckSquare, Cog, 
  Settings, Users, Package, Pill, Flag, Database, Eye, ExternalLink
} from "lucide-react";

const sidebarItems = [
  { icon: Settings, label: 'Dashboard', path: '/admin/dashboard', active: false },
  { icon: Users, label: 'User Management', path: '/admin/users', active: false },
  { icon: Cog, label: 'System Logs', path: '/admin/system-logs', active: false },
  { icon: FileText, label: 'Blockchain', path: '/admin/blockchain', active: true },
  { icon: Activity, label: 'Analytics', path: '/admin/analytics', active: false },
];

interface BlockchainEvent {
  id: string;
  eventname: string;
  contractname: string;
  transactionhash: string;
  entityid: string;
  details: string;
  timestamp: string;
}

interface BlockchainStats {
  totalUsers: number;
  totalPrescriptions: number;
  totalBatches: number;
  flaggedItems: number;
  blockchainHealth: {
    connected: boolean;
    network: string;
    contractAddress: string;
    adminAddress: string;
  };
}

const AdminBlockchain = () => {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("events");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  const fetchBlockchainData = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Fetch blockchain events
      const eventsRes = await fetch(`${API_URL}/api/blockchain/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!eventsRes.ok) throw new Error("Failed to fetch blockchain events");
      const eventsData = await eventsRes.json();

      // Fetch dashboard stats for blockchain metrics
      const statsRes = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!statsRes.ok) throw new Error("Failed to fetch blockchain stats");
      const statsData = await statsRes.json();

      // Fetch blockchain health
      const healthRes = await fetch(`${API_URL}/api/admin/blockchain-health`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const healthData = healthRes.ok ? await healthRes.json() : { blockchain: { connected: false } };

      // Set events
      if (Array.isArray(eventsData)) {
        setEvents(eventsData);
      } else if (eventsData && Array.isArray(eventsData.logs)) {
        setEvents(eventsData.logs);
      } else {
        setEvents([]);
      }

      // Set stats
      setStats({
        totalUsers: statsData.usersByRole?.reduce((sum: number, role: any) => sum + parseInt(role.count), 0) || 0,
        totalPrescriptions: statsData.totalPrescriptions || 0,
        totalBatches: statsData.totalBatches || 0,
        flaggedItems: statsData.flaggedShipments || 0,
        blockchainHealth: healthData.blockchain || { connected: false }
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show only the latest 12 events
  const filteredEvents = events
    .filter(event =>
      event.eventname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.entityid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.transactionhash?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 12);

  const getEventTypeColor = (eventType: string) => {
    switch (eventType?.toLowerCase()) {
      case 'userregistered': return 'bg-blue-100 text-blue-700';
      case 'userstatusupdated': return 'bg-purple-100 text-purple-700';
      case 'prescriptioncreated': return 'bg-green-100 text-green-700';
      case 'batchcreated': return 'bg-orange-100 text-orange-700';
      case 'shipmentflagged': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType?.toLowerCase()) {
      case 'userregistered': return <Users className="h-4 w-4" />;
      case 'userstatusupdated': return <Shield className="h-4 w-4" />;
      case 'prescriptioncreated': return <Pill className="h-4 w-4" />;
      case 'batchcreated': return <Package className="h-4 w-4" />;
      case 'shipmentflagged': return <Flag className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const truncateHash = (hash: string) => {
    if (!hash) return '-';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  const viewOnBlockExplorer = (txHash: string) => {
    // This would open the transaction in a block explorer
    // You can customize this based on your blockchain network
    const explorerUrl = `https://etherscan.io/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems} userRole="admin" userName="System Admin" userEmail="admin@eprescribe.go.ke">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading blockchain data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="admin" userName="System Admin" userEmail="admin@eprescribe.go.ke">
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
            Blockchain Dashboard
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Comprehensive view of all blockchain activities and on-chain data
          </p>
        </div>

        {/* Blockchain Health Status */}
        {stats?.blockchainHealth && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Blockchain Network Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stats.blockchainHealth.connected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <Activity className="h-6 w-6" />
                  </div>
                  <p className="mt-2 font-semibold">Connection</p>
                  <Badge variant={stats.blockchainHealth.connected ? "default" : "destructive"}>
                    {stats.blockchainHealth.connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="mt-2 font-semibold">Users On-Chain</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600">
                    <Pill className="h-6 w-6" />
                  </div>
                  <p className="mt-2 font-semibold">Prescriptions</p>
                  <p className="text-2xl font-bold">{stats.totalPrescriptions}</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600">
                    <Package className="h-6 w-6" />
                  </div>
                  <p className="mt-2 font-semibold">Drug Batches</p>
                  <p className="text-2xl font-bold">{stats.totalBatches}</p>
                </div>
              </div>

              {stats.blockchainHealth.connected && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Network:</span> {stats.blockchainHealth.network || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-semibold">Contract:</span> {truncateHash(stats.blockchainHealth.contractAddress)}
                    </div>
                    <div>
                      <span className="font-semibold">Admin:</span> {truncateHash(stats.blockchainHealth.adminAddress)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search and Events Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Blockchain Event Logs
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events, hashes, IDs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="py-8 text-center text-destructive">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <p>{error}</p>
                <Button onClick={fetchBlockchainData} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>No blockchain events found.</p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm("")}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Transaction Hash</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.eventname)}
                            <Badge className={getEventTypeColor(event.eventname)}>
                              {event.eventname || 'Unknown'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {truncateHash(event.transactionhash)}
                        </TableCell>
                        <TableCell>{event.entityid || '-'}</TableCell>
                        <TableCell>{event.contractname || '-'}</TableCell>
                        <TableCell>
                          {event.timestamp ? new Date(event.timestamp).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {event.transactionhash && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewOnBlockExplorer(event.transactionhash)}
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Blockchain Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Flagged Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-500" />
                Flagged Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                  <Flag className="h-8 w-8" />
                </div>
                <p className="text-3xl font-bold text-red-600">{stats?.flaggedItems || 0}</p>
                <p className="text-muted-foreground mt-2">Suspicious shipments & items</p>
                <Button variant="outline" className="mt-4">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog className="h-5 w-5" />
                Blockchain Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  View Contract Details
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Check Network Health
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Event Logs
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Verify On-Chain Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminBlockchain;