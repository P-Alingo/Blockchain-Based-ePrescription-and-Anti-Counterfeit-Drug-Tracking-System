import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Shield, AlertTriangle, CheckSquare, BarChart3, Search, FileText, Activity, CheckCircle, Filter } from "lucide-react";
import { Line, Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const RegulatorAnalytics = () => {
    const sidebarItems = [
      { icon: Shield, label: 'Dashboard', path: '/regulator/dashboard', active: false },
      { icon: Search, label: 'Audits', path: '/regulator/audits', active: false },
      { icon: FileText, label: 'Traceability', path: '/regulator/traceability', active: false },
      { icon: AlertTriangle, label: 'Blockchain', path: '/regulator/blockchain', active: false },
      { icon: Activity, label: 'Analytics', path: '/regulator/analytics', active: true },
    ];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState({
    totalShipments: 0,
    flaggedBatches: 0,
    counterfeitIncidents: 0,
    flaggedDrugsOverTime: [],
    topManufacturers: [],
    totalPrescriptions: []
  });

  // Export logic (CSV/PDF)
  function exportAnalytics(type: 'csv' | 'pdf', data: typeof analytics) {
    if (type === 'csv') {
      const rows = [
        ['Total Shipments Monitored', data.totalShipments],
        ['Flagged Batches Detected', data.flaggedBatches],
        ['Counterfeit Incidents Confirmed', data.counterfeitIncidents]
      ];
      let csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'regulator_analytics.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (type === 'pdf') {
      alert('PDF export is not implemented in this demo.');
    }
  }

  useEffect(() => {
    setLoading(true);
    const API_BASE = 'http://localhost:4000';
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    console.log('[RegulatorAnalytics] Fetching /api/regulator/analytics');
    fetch(`${API_BASE}/api/regulator/analytics`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch analytics data");
        return res.json();
      })
      .then((data) => {
        console.log('[RegulatorAnalytics] API response:', data);
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: "bg-destructive text-destructive-foreground",
      warning: "bg-warning text-warning-foreground",
      success: "bg-success text-success-foreground",
      info: "bg-primary text-primary-foreground"
    };
    return variants[severity as keyof typeof variants] || variants.info;
  };

  const getActionIcon = (action: string) => {
    const icons = {
      audit_initiated: Shield,
      alert_resolved: CheckCircle,
      access_denied: AlertTriangle,
      report_generated: Activity,
      license_suspended: AlertTriangle,
      backup_completed: CheckCircle
    };
    return icons[action as keyof typeof icons] || Activity;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
   <DashboardLayout sidebarItems={sidebarItems} userRole="regulator" userName="Dr. Jane Regulator" userEmail="jane@ppb.go.ke">
      <div className="space-y-8">
        <div>
           <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Analytics</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Comprehensive analytics and regulatory performance overview
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Analytics
          </Button>
          <Button className="medical-button gap-2">
            <Filter className="w-4 h-4" />
            Advanced Filter
          </Button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="medical-grid">
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Shipments Monitored</p>
                <p className="text-3xl font-bold mt-2">{analytics.totalShipments}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Flagged Batches Detected</p>
                <p className="text-3xl font-bold mt-2">{analytics.flaggedBatches}</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex gap-3 mb-6">
        <Button variant="outline" className="gap-2" onClick={() => exportAnalytics('csv', analytics)}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => exportAnalytics('pdf', analytics)}>
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle>Flagged Drugs Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <Line
              data={{
                labels: analytics.flaggedDrugsOverTime.map((d) => d.month ? new Date(d.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''),
                datasets: [
                  {
                    label: 'Flagged Drugs',
                    data: analytics.flaggedDrugsOverTime.map((d) => d.count),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    fill: true,
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: true } } }}
            />
          </CardContent>
        </Card>
        <Card className="healthcare-card">
          <CardHeader>
            <CardTitle>Top Manufacturers</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar
              data={{
                labels: analytics.topManufacturers.map((m) => `Manufacturer ${m.manufacturer_id}`),
                datasets: [
                  {
                    label: 'Batches',
                    data: analytics.topManufacturers.map((m) => m.count),
                    backgroundColor: '#3b82f6',
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: true } } }}
            />
          </CardContent>
        </Card>
        <Card className="healthcare-card col-span-2">
          <CardHeader>
            <CardTitle>Total Prescriptions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <Line
              data={{
                labels: analytics.totalPrescriptions.map((d) => d.month ? new Date(d.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''),
                datasets: [
                  {
                    label: 'Prescriptions',
                    data: analytics.totalPrescriptions.map((d) => d.count),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    fill: true,
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: true } } }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RegulatorAnalytics;