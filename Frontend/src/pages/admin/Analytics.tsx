import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Cog, Database, FileText, Activity, AlertTriangle, CheckCircle, Shield, Filter, Download, Clock, Eye } from 'lucide-react';

const Analytics = () => {
  const sidebarItems = [
    { icon: Settings, label: 'Dashboard', path: '/admin/dashboard', active: false },
    { icon: Users, label: 'User Management', path: '/admin/users', active: false },
    { icon: Cog, label: 'Reports', path: '/admin/reports', active: false },
    { icon: Database, label: 'Database', path: '/admin/database', active: false },
    { icon: FileText, label: 'Blockchain', path: '/admin/blockchain', active: false },
    { icon: Activity, label: 'Analytics', path: '/admin/analytics', active: true },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('today');
  const [analyticsLogs, setAnalyticsLogs] = useState([]);
  const [analyticsStats, setAnalyticsStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    systemChanges: 0,
    securityEvents: 0
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
        setAnalyticsLogs(data.logs || []);
        setAnalyticsStats(data.stats || {
          totalUsers: 0,
          totalReports: 0,
          systemChanges: 0,
          securityEvents: 0
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getSeverityBadge = (severity) => {
    const variants = {
      critical: 'bg-destructive text-destructive-foreground animate-pulse',
      warning: 'bg-warning text-warning-foreground',
      success: 'bg-success text-success-foreground',
      info: 'bg-primary text-primary-foreground',
    };
    return variants[severity] || variants.info;
  };

  const getActionIcon = (action) => {
    const icons = {
      user_created: Users,
      report_generated: FileText,
      system_setting_changed: Settings,
      security_event: Shield,
      database_backup: Database
    };
    return icons[action] || Activity;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="admin" userName="System Admin" userEmail="admin@eprescribe.go.ke">
      <div className="min-h-screen bg-background p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">Analytics</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Comprehensive system analytics and performance overview
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

        {/* Analytics Statistics - fetched from backend */}
        <div className="medical-grid">
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold mt-2">{analyticsStats.totalUsers}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                  <p className="text-3xl font-bold mt-2">{analyticsStats.totalReports}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">System Changes</p>
                  <p className="text-3xl font-bold mt-2">{analyticsStats.systemChanges}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Settings className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Security Events</p>
                  <p className="text-3xl font-bold mt-2">{analyticsStats.securityEvents}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-full">
                  <Shield className="w-8 h-8 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="healthcare-card">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search analytics by user, action, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="user_created">User Created</SelectItem>
                  <SelectItem value="report_generated">Report Generated</SelectItem>
                  <SelectItem value="system_setting_changed">System Setting Changed</SelectItem>
                  <SelectItem value="security_event">Security Event</SelectItem>
                  <SelectItem value="database_backup">Database Backup</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Logs Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Analytics</TabsTrigger>
            <TabsTrigger value="user_created">User Created</TabsTrigger>
            <TabsTrigger value="report_generated">Report Generated</TabsTrigger>
            <TabsTrigger value="system_setting_changed">System Setting</TabsTrigger>
            <TabsTrigger value="security_event">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card className="healthcare-card">
              <CardHeader>
                <CardTitle>Recent Analytics</CardTitle>
                <CardDescription>
                  Chronological view of all administrative analytics events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsLogs.filter(log => {
                    return (
                      searchTerm === '' ||
                      log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      log.description?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                  }).map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    return (
                      <div key={log.id} className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className={`p-2 rounded-full ${log.success ? 'bg-success/10' : 'bg-destructive/10'}`}>
                          <ActionIcon className={`w-5 h-5 ${log.success ? 'text-success' : 'text-destructive'}`} />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{log.description}</h3>
                              <Badge className={getSeverityBadge(log.severity)}>{log.severity}</Badge>
                              {!log.success && <Badge variant="destructive">Failed</Badge>}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {formatTime(log.timestamp)}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">User:</span> {log.user}
                            </div>
                            <div>
                              <span className="font-medium">Role:</span> {log.role}
                            </div>
                            <div>
                              <span className="font-medium">Target:</span> {log.target}
                            </div>
                            <div>
                              <span className="font-medium">IP:</span> {log.ipAddress}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">User Agent:</span> {log.userAgent}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          Details
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user_created" className="space-y-4">
            <div className="space-y-4">
              {analyticsLogs.filter(log => log.action === 'user_created').map((log) => {
                const ActionIcon = getActionIcon(log.action);
                return (
                  <Card key={log.id} className="healthcare-card border-l-4 border-l-blue-600">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <ActionIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-blue-600">{log.description}</h3>
                            <span className="text-sm text-muted-foreground">{formatTime(log.timestamp)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>User:</strong> {log.user}</div>
                            <div><strong>Target:</strong> {log.target}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="report_generated" className="space-y-4">
            <div className="space-y-4">
              {analyticsLogs.filter(log => log.action === 'report_generated').map((log) => {
                const ActionIcon = getActionIcon(log.action);
                return (
                  <Card key={log.id} className="healthcare-card border-l-4 border-l-green-600">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-green-100 rounded-full">
                          <ActionIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-green-600">{log.description}</h3>
                            <span className="text-sm text-muted-foreground">{formatTime(log.timestamp)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>User:</strong> {log.user}</div>
                            <div><strong>Target:</strong> {log.target}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="system_setting_changed" className="space-y-4">
            <div className="space-y-4">
              {analyticsLogs.filter(log => log.action === 'system_setting_changed').map((log) => {
                const ActionIcon = getActionIcon(log.action);
                return (
                  <Card key={log.id} className="healthcare-card border-l-4 border-l-orange-600">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-orange-100 rounded-full">
                          <ActionIcon className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-orange-600">{log.description}</h3>
                            <span className="text-sm text-muted-foreground">{formatTime(log.timestamp)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>User:</strong> {log.user}</div>
                            <div><strong>Target:</strong> {log.target}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="security_event" className="space-y-4">
            <div className="space-y-4">
              {analyticsLogs.filter(log => log.action === 'security_event').map((log) => {
                const ActionIcon = getActionIcon(log.action);
                return (
                  <Card key={log.id} className="healthcare-card border-l-4 border-l-destructive">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-destructive/10 rounded-full">
                          <ActionIcon className="w-6 h-6 text-destructive" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-destructive">{log.description}</h3>
                            <span className="text-sm text-muted-foreground">{formatTime(log.timestamp)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>User:</strong> {log.user}</div>
                            <div><strong>Target:</strong> {log.target}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;