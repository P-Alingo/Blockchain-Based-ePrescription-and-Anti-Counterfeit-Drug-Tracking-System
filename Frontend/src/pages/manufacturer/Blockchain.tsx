import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Hash, Search, CheckCircle, AlertTriangle, Clock, Package2, Package, Plus, List, Activity, Truck } from "lucide-react";

const ManufacturerBlockchainVerification = () => {
    const sidebarItems = [
    { icon: Package, label: "Dashboard", path: "/manufacturer/dashboard", active: false },
    { icon: Plus, label: "Register Batch", path: "/manufacturer/register-batch", active: false },
    { icon: List, label: "Batches", path: "/manufacturer/batches", active: false },
    { icon: Shield, label: "Blockchain", path: "/manufacturer/blockchain", active: true },
    { icon: Activity, label: "Analytics", path: "/manufacturer/analytics", active: false },
    { icon: Truck, label: "Shipments", path: "/manufacturer/shipments", active: false },
  ];
  const [searchHash, setSearchHash] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Define the expected data type
  type BlockchainStats = {
    totalRecords: number;
    verified: number;
    pending: number;
    gasSpent: number;
    avgGasPrice?: string;
    totalGasUsed?: string;
  };

  type BlockchainRecord = {
    batchId: string;
    productName: string;
    transactionHash: string;
    blockNumber: number | string;
    timestamp: string;
    manufacturer: string;
    gasUsed?: string | number;
    confirmations: number;
    status: string;
  };

  type BlockchainData = {
    stats: BlockchainStats;
    records: BlockchainRecord[];
  };

  // Fetch blockchain records
  const { data: blockchainData, refetch } = useQuery<BlockchainData>({
    queryKey: ["manufacturer-blockchain", searchTerm],
    queryFn: async () => {
      const res = await axios.get(`/api/manufacturer/blockchain`, {
        params: searchTerm ? { search: searchTerm } : {}
      });
      return res.data as BlockchainData;
    }
  });

  // Fetch summary stats
  const stats = blockchainData?.stats || {
    totalRecords: 0,
    verified: 0,
    pending: 0,
    gasSpent: 0
  };
  const blockchainRecords = blockchainData?.records || [];

  // Hash verification
  const handleVerifyHash = async () => {
    if (!searchHash) return;
    try {
      const res = await axios.get(`/api/manufacturer/blockchain/${searchHash}`);
      setVerificationResult(res.data);
    } catch (err) {
      setVerificationResult({ error: "Transaction not found" });
    }
  };

  // Explorer link
  const getExplorerUrl = (txHash) => `https://etherscan.io/tx/${txHash}`;

  const getStatusBadge = (status, confirmations) => {
    if (status === "Verified" && confirmations > 1000) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Verified</Badge>;
    } else if (status === "Verified" && confirmations > 100) {
      return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
    } else if (status === "Pending") {
      return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
    }
    return <Badge variant="destructive">Failed</Badge>;
  };

  return (
 <DashboardLayout sidebarItems={sidebarItems} userRole="manufacturer" userName="Sarah Manufacturer" userEmail="sarah@pharmaceutical.co.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Blockchain Verification
          </h1>
          <p className="text-muted-foreground">Verify manufacturing records on the blockchain</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Hash className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Blockchain Records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.verified.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.gasSpent}</p>
                <p className="text-sm text-muted-foreground">Gas Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="verify" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="verify">Verify Hash</TabsTrigger>
          <TabsTrigger value="records">Blockchain Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="verify" className="space-y-6">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Hash Verification
              </CardTitle>
              <CardDescription>
                Verify blockchain transaction hash for manufacturing records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter transaction hash (e.g., 0x1a2b3c4d5e6f...)"
                  value={searchHash}
                  onChange={(e) => setSearchHash(e.target.value)}
                  className="flex-1 font-mono"
                />
                <Button onClick={handleVerifyHash} className="px-8">
                  Verify Hash
                </Button>
              </div>

              {verificationResult && (
                <Card className="border-2 border-green-500/50 bg-green-50/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold">Hash Verified Successfully</h3>
                        <p className="text-sm text-muted-foreground">
                          Record found on blockchain
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Batch ID</p>
                        <p className="font-semibold">{verificationResult.batchId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Product</p>
                        <p className="font-semibold">{verificationResult.productName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Block Number</p>
                        <p className="font-mono text-sm">{verificationResult.blockNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                        <p className="font-mono text-sm">{verificationResult.timestamp}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Manufacturer</p>
                        <p className="font-semibold">{verificationResult.manufacturer}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Transaction Hash</p>
                        <p className="font-mono text-xs break-all">{verificationResult.transactionHash}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Blockchain Records</CardTitle>
                  <CardDescription>All manufacturing records stored on blockchain</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    className="w-64"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Transaction Hash</TableHead>
                    <TableHead>Block Number</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Confirmations</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockchainRecords.map((record) => (
                    <TableRow key={record.transactionHash}>
                      <TableCell className="font-medium">{record.batchId}</TableCell>
                      <TableCell>{record.productName}</TableCell>
                      <TableCell className="font-mono text-sm">
                        <a href={getExplorerUrl(record.transactionHash)} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{record.transactionHash}</a>
                        <Button size="sm" variant="outline" className="ml-2" onClick={() => { setSelectedTx(record); setShowModal(true); }}>Details</Button>
                      </TableCell>
                      <TableCell className="font-mono">{record.blockNumber}</TableCell>
                      <TableCell className="font-mono text-sm">{record.timestamp}</TableCell>
                      <TableCell>{record.confirmations?.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(record.status, record.confirmations)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification Trends</CardTitle>
                <CardDescription>Monthly blockchain verification statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">This Month</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Records</span>
                        <span className="text-sm font-medium">{stats.totalRecords.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Successfully Verified</span>
                        <span className="text-sm font-medium">{stats.verified.toLocaleString()} ({stats.totalRecords ? Math.round((stats.verified / stats.totalRecords) * 100) : 0}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Pending Verification</span>
                        <span className="text-sm font-medium">{stats.pending.toLocaleString()} ({stats.totalRecords ? Math.round((stats.pending / stats.totalRecords) * 100) : 0}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gas Usage Analytics</CardTitle>
                <CardDescription>Blockchain transaction costs and efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Cost Analysis</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Average Gas Price</span>
                        <span className="text-sm font-medium">{stats.avgGasPrice || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Gas Used</span>
                        <span className="text-sm font-medium">{stats.totalGasUsed || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Monthly Cost</span>
                        <span className="text-sm font-medium">{stats.gasSpent || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    {/* Details Modal */}
    {showModal && selectedTx && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
          <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowModal(false)}>&times;</button>
          <h2 className="text-xl font-bold mb-4">Transaction Details</h2>
          <div className="space-y-2">
            <div><span className="font-semibold">Batch ID:</span> {selectedTx.batchId}</div>
            <div><span className="font-semibold">Product:</span> {selectedTx.productName}</div>
            <div><span className="font-semibold">Transaction Hash:</span> <a href={getExplorerUrl(selectedTx.transactionHash)} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{selectedTx.transactionHash}</a></div>
            <div><span className="font-semibold">Block Number:</span> {selectedTx.blockNumber}</div>
            <div><span className="font-semibold">Timestamp:</span> {selectedTx.timestamp}</div>
            <div><span className="font-semibold">Manufacturer:</span> {selectedTx.manufacturer}</div>
            <div><span className="font-semibold">Gas Used:</span> {selectedTx.gasUsed}</div>
            <div><span className="font-semibold">Confirmations:</span> {selectedTx.confirmations}</div>
            <div><span className="font-semibold">Status:</span> {getStatusBadge(selectedTx.status, selectedTx.confirmations)}</div>
          </div>
        </div>
      </div>
    )}
    </DashboardLayout>
  );
};

export default ManufacturerBlockchainVerification;