import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Hash, Search, CheckCircle, AlertTriangle, Clock, Package2, Package, Plus, List, Activity } from "lucide-react";

const ManufacturerBlockchainVerification = () => {
   const sidebarItems = [
    { icon: Package, label: 'Dashboard', path: '/manufacturer/dashboard', active: false },
    { icon: Plus, label: 'Register Batch', path: '/manufacturer/register-batch', active: false },
    { icon: List, label: 'Batch List', path: '/manufacturer/batch-list', active: false },
    { icon: Shield, label: 'Blockchain Verification', path: '/manufacturer/blockchain-verification', active: true },
    { icon: Activity, label: 'Activity Logs', path: '/manufacturer/activity-logs', active: false },
  ];
  const [searchHash, setSearchHash] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);

  const blockchainRecords = [
    {
      id: 1,
      batchId: "AMX-2024-001",
      productName: "Amoxicillin 500mg",
      transactionHash: "0x1a2b3c4d5e6f...",
      blockNumber: "18,234,567",
      timestamp: "2024-01-15 10:30:45",
      status: "Verified",
      gasUsed: "21,000",
      confirmations: 1254
    },
    {
      id: 2,
      batchId: "PCM-2024-002",
      productName: "Paracetamol 500mg",
      transactionHash: "0x2b3c4d5e6f7a...",
      blockNumber: "18,234,568",
      timestamp: "2024-01-15 11:15:20",
      status: "Verified",
      gasUsed: "21,000",
      confirmations: 1198
    },
    {
      id: 3,
      batchId: "IBU-2024-003",
      productName: "Ibuprofen 400mg",
      transactionHash: "0x3c4d5e6f7a8b...",
      blockNumber: "18,234,569",
      timestamp: "2024-01-15 12:45:15",
      status: "Pending",
      gasUsed: "21,000",
      confirmations: 856
    }
  ];

  const handleVerifyHash = () => {
    setVerificationResult({
      isValid: true,
      batchId: "AMX-2024-001",
      productName: "Amoxicillin 500mg",
      transactionHash: searchHash || "0x1a2b3c4d5e6f...",
      blockNumber: "18,234,567",
      timestamp: "2024-01-15 10:30:45",
      manufacturer: "PharmaCorp Ltd",
      verificationTime: new Date().toISOString()
    });
  };

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
                <p className="text-2xl font-bold">1,234</p>
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
                <p className="text-2xl font-bold">1,198</p>
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
                <p className="text-2xl font-bold">36</p>
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
                <p className="text-2xl font-bold">₦2.3M</p>
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
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.batchId}</TableCell>
                      <TableCell>{record.productName}</TableCell>
                      <TableCell className="font-mono text-sm">{record.transactionHash}</TableCell>
                      <TableCell className="font-mono">{record.blockNumber}</TableCell>
                      <TableCell className="font-mono text-sm">{record.timestamp}</TableCell>
                      <TableCell>{record.confirmations.toLocaleString()}</TableCell>
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
                        <span className="text-sm font-medium">1,234</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Successfully Verified</span>
                        <span className="text-sm font-medium">1,198 (97%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Pending Verification</span>
                        <span className="text-sm font-medium">36 (3%)</span>
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
                        <span className="text-sm font-medium">20 Gwei</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Gas Used</span>
                        <span className="text-sm font-medium">25.9M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Monthly Cost</span>
                        <span className="text-sm font-medium">₦2.3M</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ManufacturerBlockchainVerification;