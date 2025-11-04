import DashboardLayout from '@/components/layout/DashboardLayout';
import { Shield, FileText, AlertTriangle, CheckCircle, Activity, BarChart3, TrendingUp, Users, Building, Eye, Search, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';

const RegulatorDashboard = () => {
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/regulator/dashboard', active: true },
    { icon: Search, label: 'Audits', path: '/regulator/audits', active: false },
    { icon: FileText, label: 'Reports', path: '/regulator/reports', active: false },
    { icon: AlertTriangle, label: 'Blockchain', path: '/regulator/blockchain', active: false },
    { icon: CheckSquare, label: 'Compliance Actions', path: '/regulator/compliance', active: false },
    { icon: Activity, label: 'Analytics', path: '/regulator/analytics', active: false },
  ];

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sample data for compliance alerts (replace with API data as needed)
  const complianceAlerts = [
    {
      id: 1,
      facility: "PharmaCare Nairobi",
      issue: "Expired license detected",
      date: "2024-06-01",
      severity: "high"
    },
    {
      id: 2,
      facility: "HealthPlus Kisumu",
      issue: "Missing audit report",
      date: "2024-05-28",
      severity: "medium"
    },
    {
      id: 3,
      facility: "MediTrust Eldoret",
      issue: "Unverified pharmacist",
      date: "2024-05-25",
      severity: "low"
    }
  ];

  // Sample data for audit metrics (replace with API data as needed)
  const auditMetrics = [
    {
      facility: "PharmaCare Nairobi",
      audited: 12,
      total: 15,
      compliance: 80
    },
    {
      facility: "HealthPlus Kisumu",
      audited: 8,
      total: 10,
      compliance: 75
    },
    {
      facility: "MediTrust Eldoret",
      audited: 5,
      total: 7,
      compliance: 71
    }
  ];

  useEffect(() => {
    setLoading(true);
    fetch("/api/regulator/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="regulator" userName="Dr. Jane Regulator" userEmail="jane@ppb.go.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
            Regulator Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor compliance, conduct audits, and ensure pharmaceutical safety standards</p>
        </div>
        {/* Regulatory Stats - Loading/Error/Data */}
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading dashboard...</div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">{error}</div>
        ) : dashboardData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Licensed Facilities</CardTitle>
                  <Building className="h-4 w-4 text-red-600 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">{dashboardData.licensedFacilities ?? '-'}</div>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    {dashboardData.newFacilitiesThisMonth ? `+${dashboardData.newFacilitiesThisMonth} new this month` : ''}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{dashboardData.complianceRate ?? '-'}</div>
                  <p className="text-xs text-green-600 dark:text-green-400">Overall system compliance</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Audits</CardTitle>
                  <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{dashboardData.activeAudits ?? '-'}</div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Ongoing inspections</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">8</div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Require investigation</p>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Overview and Recent Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Compliance</CardTitle>
                  <CardDescription>Facility compliance rates by category</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {auditMetrics.map((audit) => (
                    <div key={audit.facility} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{audit.facility}</span>
                        <span>{audit.audited}/{audit.total} audited</span>
                      </div>
                      <Progress value={audit.compliance} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {audit.compliance}% compliance rate
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Compliance Alerts</CardTitle>
                  <CardDescription>Issues requiring regulatory attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {complianceAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{alert.facility}</p>
                        <p className="text-xs text-muted-foreground">{alert.issue}</p>
                        <p className="text-xs text-muted-foreground">{alert.date}</p>
                      </div>
                      <Badge
                        variant={
                          alert.severity === 'high' ? 'destructive' :
                          alert.severity === 'medium' ? 'default' : 'secondary'
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Regulatory Operations</CardTitle>
                <CardDescription>Quick access to regulatory functions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="h-20 flex-col gap-2" variant="outline">
                    <FileText className="h-6 w-6" />
                    Schedule Audit
                  </Button>
                  <Button className="h-20 flex-col gap-2" variant="outline">
                    <AlertTriangle className="h-6 w-6" />
                    Review Alerts
                  </Button>
                  <Button className="h-20 flex-col gap-2" variant="outline">
                    <CheckCircle className="h-6 w-6" />
                    Compliance Report
                  </Button>
                  <Button className="h-20 flex-col gap-2" variant="outline">
                    <Shield className="h-6 w-6" />
                    License Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default RegulatorDashboard;