import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState, useEffect } from "react";
import { Truck, Package, List, RotateCcw, FileText, Activity, MapPin, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const DistributorAnalytics = () => {
  const sidebarItems = [
    { icon: Truck, label: 'Dashboard', path: '/distributor/dashboard', active: false },
    { icon: Package, label: 'Shipments', path: '/distributor/shipments', active: false },
    { icon: RotateCcw, label: 'Requests', path: '/distributor/requests', active: false },
    { icon: Activity, label: 'Analytics', path: '/distributor/analytics', active: true },
  ];

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch("http://localhost:4000/api/distributor/analytics", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json();
        setAnalytics(data);
        setError(null);
      } catch (err) {
        setError(err.message || "Error fetching analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || error) {
    return (
      <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
        {loading && <div className="p-8 text-center">Loading analytics...</div>}
        {error && <div className="p-8 text-center text-red-500">{error}</div>}
      </DashboardLayout>
    );
  }

  // Prepare chart data
  const shipmentsPerRegion = analytics?.shipmentsPerRegion || [];
  const regionLabels = shipmentsPerRegion.map(r => r.region || 'Unknown');
  const regionCounts = shipmentsPerRegion.map(r => r.count);
  const workloadByManufacturer = analytics?.workloadByManufacturer || [];
  const manufacturerLabels = workloadByManufacturer.map(m => m.manufacturerid);
  const manufacturerCounts = workloadByManufacturer.map(m => m.shipment_count);

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="distributor" userName="Mike Distributor" userEmail="mike@logistics.co.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
            Distributor Analytics
          </h1>
          <p className="text-muted-foreground">Visualize distribution performance, shipments, and workload</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Avg Delivery Speed</CardTitle>
              <CardDescription>Hours per shipment</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{analytics?.avgDeliverySpeed?.toFixed(2) || 0}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Regions Served</CardTitle>
              <CardDescription>Distinct regions</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{regionLabels.length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Manufacturers Worked With</CardTitle>
              <CardDescription>Distinct manufacturers</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{manufacturerLabels.length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Shipments</CardTitle>
              <CardDescription>From logistics report</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{analytics?.logisticsReport?.length || 0}</span>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Shipments Per Region</CardTitle>
              <CardDescription>Distribution reach</CardDescription>
            </CardHeader>
            <CardContent>
              <Pie
                data={{
                  labels: regionLabels,
                  datasets: [{
                    label: 'Shipments',
                    data: regionCounts,
                    backgroundColor: [
                      '#38bdf8', '#818cf8', '#fbbf24', '#f87171', '#34d399', '#f472b6', '#a3e635', '#facc15', '#fcd34d', '#c7d2fe'
                    ],
                  }],
                }}
                options={{ plugins: { legend: { position: 'bottom' } } }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Workload By Manufacturer</CardTitle>
              <CardDescription>Shipments handled</CardDescription>
            </CardHeader>
            <CardContent>
              <Bar
                data={{
                  labels: manufacturerLabels,
                  datasets: [{
                    label: 'Shipments',
                    data: manufacturerCounts,
                    backgroundColor: '#818cf8',
                  }],
                }}
                options={{
                  plugins: { legend: { display: false } },
                  scales: { x: { title: { display: true, text: 'Manufacturer ID' } }, y: { beginAtZero: true } }
                }}
              />
            </CardContent>
          </Card>
        </div>
        <Card className="border-primary/20 shadow-lg mt-8">
          <CardHeader>
            <CardTitle>Logistics Report</CardTitle>
            <CardDescription>All shipments handled by distributor</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="mb-4" onClick={() => {
              const csv = [
                ['Shipment #', 'Drug', 'Batch', 'Region', 'Departure', 'Arrival', 'Status'].join(','),
                ...analytics?.logisticsReport?.map((r) => [
                  r.shipmentnumber,
                  r.drugid,
                  r.batchnumber,
                  r.facility,
                  r.departure_date,
                  r.arrival_date,
                  r.status
                ].map(val => `"${val ?? ''}"`).join(','))
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `logistics_report.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th>Shipment #</th>
                    <th>Drug</th>
                    <th>Batch</th>
                    <th>Region</th>
                    <th>Departure</th>
                    <th>Arrival</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.logisticsReport?.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.shipmentnumber}</td>
                      <td>{r.drugid}</td>
                      <td>{r.batchnumber}</td>
                      <td>{r.facility}</td>
                      <td>{r.departure_date}</td>
                      <td>{r.arrival_date}</td>
                      <td>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DistributorAnalytics;