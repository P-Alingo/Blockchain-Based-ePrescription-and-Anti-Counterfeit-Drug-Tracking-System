import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Cog, Database, FileText, Activity, AlertTriangle, CheckCircle, Shield, Filter, Download, Clock, Eye } from 'lucide-react';


const AdminAnalytics = () => {
  // Sidebar
  const sidebarItems = [
    { icon: Settings, label: "Dashboard", path: "/admin/dashboard", active: false },
    { icon: Users, label: "User Management", path: "/admin/users", active: false },
    { icon: Cog, label: "System Logs", path: "/admin/system-logs", active: false },
    { icon: FileText, label: "Blockchain", path: "/admin/blockchain", active: false },
    { icon: Activity, label: "Analytics", path: "/admin/analytics", active: true },
  ];

  // State for advanced analytics
  const [metrics, setMetrics] = useState({
    prescriptionsIssued: 0,
    prescriptionsDispensed: 0,
    topDrugs: [],
    expiryTrends: [],
    dosageFrequencies: [],
    onTimeShipments: 0,
    delayedShipments: 0,
    quantityShipped: 0,
    quantityReceived: 0,
    flaggedShipments: 0,
    counterfeitShipments: 0,
    userActivity: [],
    loginFrequency: [],
    transactionCounts: [],
    supplyChainTimes: [],
    blockchainSuccess: 0,
    blockchainFailure: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch analytics data");
        return res.json();
      })
      .then((data) => {
        // Prescription Metrics
        const prescriptionsIssued = data.stats.activePrescriptions || 0;
        const prescriptionsDispensed = data.stats.totalPrescriptions || 0;
        // Top prescribed drugs
        const topDrugs = data.drugDistribution ? data.drugDistribution.slice(0, 5) : [];
        // Expiry trends & dosage frequencies (stub: use available data)
        const expiryTrends = data.alerts.flaggedDrugs || [];
        const dosageFrequencies = [];
        // Shipment Analytics
        const onTimeShipments = data.stats.totalShipments - data.stats.failedShipments;
        const delayedShipments = data.stats.failedShipments;
        const quantityShipped = data.drugDistribution ? data.drugDistribution.reduce((sum, d) => sum + (d.total_quantity || 0), 0) : 0;
        const quantityReceived = quantityShipped; // Stub: assume received = shipped
        const flaggedShipments = data.stats.flaggedShipments || 0;
        const counterfeitShipments = data.stats.counterfeitDrugs || 0;
        // User Activity Trends
        const userActivity = data.recentActivity || [];
        const loginFrequency = [];
        const transactionCounts = [];
        // Drug Supply Chain Insights
        const supplyChainTimes = [];
        // Blockchain Transaction Success/Failure
        const blockchainSuccess = data.recentBlockchainTx ? data.recentBlockchainTx.filter(tx => tx.eventname === "Success").length : 0;
        const blockchainFailure = data.recentBlockchainTx ? data.recentBlockchainTx.filter(tx => tx.eventname === "Failure").length : 0;

        setMetrics({
          prescriptionsIssued,
          prescriptionsDispensed,
          topDrugs,
          expiryTrends,
          dosageFrequencies,
          onTimeShipments,
          delayedShipments,
          quantityShipped,
          quantityReceived,
          flaggedShipments,
          counterfeitShipments,
          userActivity,
          loginFrequency,
          transactionCounts,
          supplyChainTimes,
          blockchainSuccess,
          blockchainFailure,
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Helper for rendering top drugs
  const renderTopDrugs = () => (
    <div className="space-y-2">
      {metrics.topDrugs.map((drug, idx) => (
        <div key={idx} className="flex justify-between items-center">
          <span>{drug.drug_name}</span>
          <span className="font-bold">{drug.total_quantity}</span>
        </div>
      ))}
    </div>
  );

  // Helper for rendering expiry trends
  const renderExpiryTrends = () => (
    <div className="space-y-2">
      {metrics.expiryTrends.map((batch, idx) => (
        <div key={idx} className="flex justify-between items-center">
          <span>{batch.drug_name} (Batch: {batch.batchnumber})</span>
          <span className="text-xs text-muted-foreground">Exp: {batch.expirydate}</span>
        </div>
      ))}
    </div>
  );

  // Helper for rendering user activity
  const renderUserActivity = () => (
    <div className="space-y-2">
      {metrics.userActivity.map((activity, idx) => (
        <div key={idx} className="flex justify-between items-center">
          <span>{activity.user} ({activity.action_type})</span>
          <span className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );

  // Helper for blockchain success/failure
  const renderBlockchainStats = () => (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <span className="text-success font-bold text-2xl">{metrics.blockchainSuccess}</span>
        <span className="text-xs">Success</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-destructive font-bold text-2xl">{metrics.blockchainFailure}</span>
        <span className="text-xs">Failure</span>
      </div>
    </div>
  );

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="admin" userName="System Admin" userEmail="admin@eprescribe.go.ke">
      <div className="min-h-screen bg-background p-6 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 dark:from-blue-100 dark:to-blue-300 bg-clip-text text-transparent">Advanced Analytics</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Provides advanced insights and data visualization for the system’s operational performance, helping the admin and regulators make data-driven decisions.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Analytics
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading analytics...</div>
        ) : error ? (
          <div className="text-center text-destructive py-12">{error}</div>
        ) : (
          <div className="space-y-8">
            {/* Prescription Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Prescription Metrics</CardTitle>
                <CardDescription>Issued vs. Dispensed, Top Drugs, Expiry Trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm">Prescriptions Issued</p>
                    <p className="text-2xl font-bold">{metrics.prescriptionsIssued}</p>
                  </div>
                  <div>
                    <p className="text-sm">Prescriptions Dispensed</p>
                    <p className="text-2xl font-bold">{metrics.prescriptionsDispensed}</p>
                  </div>
                  <div>
                    <p className="text-sm">Top Prescribed Drugs</p>
                    {renderTopDrugs()}
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-sm">Common Expiry Trends</p>
                  {renderExpiryTrends()}
                </div>
              </CardContent>
            </Card>

            {/* Shipment Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Shipment Analytics</CardTitle>
                <CardDescription>On-time vs Delayed, Quantity, Flagged/Counterfeit Ratio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm">On-time Shipments</p>
                    <p className="text-2xl font-bold text-success">{metrics.onTimeShipments}</p>
                  </div>
                  <div>
                    <p className="text-sm">Delayed Shipments</p>
                    <p className="text-2xl font-bold text-destructive">{metrics.delayedShipments}</p>
                  </div>
                  <div>
                    <p className="text-sm">Flagged/Counterfeit Shipments</p>
                    <p className="text-2xl font-bold">{metrics.flaggedShipments + metrics.counterfeitShipments}</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm">Quantity Shipped</p>
                    <p className="text-xl font-bold">{metrics.quantityShipped}</p>
                  </div>
                  <div>
                    <p className="text-sm">Quantity Received</p>
                    <p className="text-xl font-bold">{metrics.quantityReceived}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Activity Trends */}
            <Card>
              <CardHeader>
                <CardTitle>User Activity Trends</CardTitle>
                <CardDescription>Most Active Stakeholders, Login Frequency, Transaction Counts</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-sm">Recent User Activity</p>
                  {renderUserActivity()}
                </div>
              </CardContent>
            </Card>

            {/* Drug Supply Chain Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Drug Supply Chain Insights</CardTitle>
                <CardDescription>Average Time from Manufacture to Pharmacy</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-sm">(Data not available in current API)</p>
                </div>
              </CardContent>
            </Card>

            {/* Blockchain Transaction Success/Failure Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Transaction Success/Failure Rates</CardTitle>
                <CardDescription>Success vs Failure from recent blockchain logs</CardDescription>
              </CardHeader>
              <CardContent>
                {renderBlockchainStats()}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;