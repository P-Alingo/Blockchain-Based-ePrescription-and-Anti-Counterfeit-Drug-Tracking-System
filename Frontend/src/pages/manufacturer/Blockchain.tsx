import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Truck,
  Shield,
  Activity,
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ManufacturerBlockchain = () => {
  const sidebarItems = [
    { icon: Package, label: "Dashboard", path: "/manufacturer/dashboard", active: false },
    { icon: Shield, label: "Blockchain", path: "/manufacturer/blockchain", active: true },
    { icon: Truck, label: "Shipments", path: "/manufacturer/shipments", active: false },
    { icon: Activity, label: "Analytics", path: "/manufacturer/analytics", active: false },
  ];

  const [search, setSearch] = useState("");

  // Define the expected data shape
  type BlockchainData = {
    batches: Array<{
      batchId: string;
      productName: string;
      transactionHash: string;
      timestamp: string | number;
      status: string;
    }>;
    transfers: Array<{
      id: string;
      batchId: string;
      from: string;
      to: string;
      transactionHash: string;
      timestamp: string | number;
    }>;
    flags: Array<{
      id: string;
      batchId: string;
      reason: string;
      transactionHash: string;
      timestamp: string | number;
    }>;
  };

  // Fetch blockchain data
  const { data, refetch, isLoading, error } = useQuery<BlockchainData>({
    queryKey: ["manufacturer-blockchain", search],
    queryFn: async (): Promise<BlockchainData> => {
      const res = await axios.get<BlockchainData>(`/api/manufacturer/blockchain`, {
        params: search ? { search } : {},
      });
      return res.data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Verified":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case "Pending":
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      case "Flagged":
        return <Badge variant="destructive">Flagged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="manufacturer"
      userName="Sarah Manufacturer"
      userEmail="sarah@pharmaceutical.co.ke"
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Blockchain Records
          </h1>
          <p className="text-muted-foreground">
            View, search, and verify manufacturing batches, transfers, and flagged events live from blockchain.
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Batch ID, Event Type, or Tx Hash..."
              className="w-80"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        <Tabs defaultValue="batches" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
            <TabsTrigger value="flags">Flags</TabsTrigger>
          </TabsList>

          {/* BATCHES TAB */}
          <TabsContent value="batches">
            <Card>
              <CardHeader>
                <CardTitle>Batches on Blockchain</CardTitle>
                <CardDescription>
                  Manufacturing batches registered and verified on-chain.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading blockchain batches...
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-destructive">
                    Failed to load batches
                  </div>
                ) : data?.batches?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No batch records found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch ID</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Tx Hash</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.batches?.map((b: any) => (
                        <TableRow key={b.transactionHash}>
                          <TableCell className="font-medium">{b.batchId}</TableCell>
                          <TableCell>{b.productName}</TableCell>
                          <TableCell className="font-mono text-sm break-all">
                            {b.transactionHash}
                          </TableCell>
                          <TableCell>{new Date(b.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(b.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TRANSFER EVENTS TAB */}
          <TabsContent value="transfers">
            <Card>
              <CardHeader>
                <CardTitle>Transfer Events</CardTitle>
                <CardDescription>
                  Track batch transfers between manufacturer, distributor, and pharmacist.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading transfer events...
                  </div>
                ) : data?.transfers?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transfer events found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event ID</TableHead>
                        <TableHead>Batch ID</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Tx Hash</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.transfers?.map((t: any) => (
                        <TableRow key={t.transactionHash}>
                          <TableCell>{t.id}</TableCell>
                          <TableCell>{t.batchId}</TableCell>
                          <TableCell>{t.from}</TableCell>
                          <TableCell>{t.to}</TableCell>
                          <TableCell className="font-mono text-sm break-all">
                            {t.transactionHash}
                          </TableCell>
                          <TableCell>{new Date(t.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FLAGGED EVENTS TAB */}
          <TabsContent value="flags">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Batches</CardTitle>
                <CardDescription>
                  Batches or events flagged for irregularities or discrepancies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading flagged batches...
                  </div>
                ) : data?.flags?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No flagged records found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Flag ID</TableHead>
                        <TableHead>Batch ID</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Tx Hash</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.flags?.map((f: any) => (
                        <TableRow key={f.transactionHash}>
                          <TableCell>{f.id}</TableCell>
                          <TableCell>{f.batchId}</TableCell>
                          <TableCell>{f.reason}</TableCell>
                          <TableCell className="font-mono text-sm break-all">
                            {f.transactionHash}
                          </TableCell>
                          <TableCell>{new Date(f.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ManufacturerBlockchain;
