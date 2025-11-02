import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Activity, User, Shield, Eye, Download, Filter, Clock, AlertTriangle, CheckCircle, CheckSquare, FileText } from "lucide-react";

const RegulatorActivityLogs = () => {
    const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/regulator/dashboard', active: false },
    { icon: Search, label: 'Audits', path: '/regulator/audits', active: false },
    { icon: FileText, label: 'Reports', path: '/regulator/reports', active: false },
    { icon: AlertTriangle, label: 'Alerts', path: '/regulator/alerts', active: false },
    { icon: CheckSquare, label: 'Compliance Actions', path: '/regulator/compliance', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/regulator/activity-logs', active: true },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("today");

  const activityLogs = [
    {
      id: "LOG-2024-001",
      timestamp: "2024-02-20 14:30:25",
      user: "Dr. Sarah Kimani",
      role: "Senior Regulator",
      action: "audit_initiated",
      description: "Initiated compliance audit for Nairobi General Hospital",
      target: "Nairobi General Hospital",
      severity: "info",
      ipAddress: "41.222.45.123",
      userAgent: "Chrome 121.0.0.0",
      success: true
    },
    {
      id: "LOG-2024-002",
      timestamp: "2024-02-20 14:15:10",
      user: "Dr. James Mwangi",
      role: "Compliance Officer",
      action: "alert_resolved",
      description: "Resolved suspicious prescription pattern alert ALT-2024-001",
      target: "Alert System",
      severity: "success", 
      ipAddress: "41.222.45.124",
      userAgent: "Firefox 122.0.0.0",
      success: true
    },
    {
      id: "LOG-2024-003",
      timestamp: "2024-02-20 13:45:32",
      user: "System Administrator",
      role: "System Admin",
      action: "access_denied",
      description: "Failed login attempt with invalid credentials",
      target: "Authentication System",
      severity: "warning",
      ipAddress: "197.156.89.45",
      userAgent: "Unknown Client",
      success: false
    },
    {
      id: "LOG-2024-004",
      timestamp: "2024-02-20 13:30:18",
      user: "Dr. Grace Ochieng",
      role: "Regulator",
      action: "report_generated",
      description: "Generated quarterly compliance report for Western Region",
      target: "Report System",
      severity: "info",
      ipAddress: "41.222.45.125",
      userAgent: "Chrome 120.0.0.0",
      success: true
    },
    {
      id: "LOG-2024-005",
      timestamp: "2024-02-20 12:15:45",
      user: "Dr. Peter Kiptoo",
      role: "Senior Regulator",
      action: "license_suspended",
      description: "Suspended medical license for Dr. John Doe - License #MD-2019-4567",
      target: "License Management",
      severity: "critical",
      ipAddress: "41.222.45.126",
      userAgent: "Chrome 121.0.0.0",
      success: true
    },
    {
      id: "LOG-2024-006",
      timestamp: "2024-02-20 11:30:22",
      user: "Automated System",
      role: "System",
      action: "backup_completed",
      description: "Daily backup of regulatory database completed successfully",
      target: "Database System",
      severity: "info",
      ipAddress: "127.0.0.1",
      userAgent: "System Process",
      success: true
    }
  ];

  const activityStats = [
    { title: "Total Activities", value: "1,847", icon: Activity, color: "text-primary" },
    { title: "Critical Actions", value: "12", icon: AlertTriangle, color: "text-destructive" },
    { title: "Successful Actions", value: "1,823", icon: CheckCircle, color: "text-success" },
    { title: "Failed Attempts", value: "24", icon: Shield, color: "text-warning" }
  ];

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
           <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Activity Logs</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Comprehensive audit trail of all regulatory activities
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Logs
          </Button>
          <Button className="medical-button gap-2">
            <Filter className="w-4 h-4" />
            Advanced Filter
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="medical-grid">
        {activityStats.map((stat, index) => (
          <Card key={index} className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="healthcare-card">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs by user, action, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="audit">Audit Actions</SelectItem>
                <SelectItem value="alert">Alert Actions</SelectItem>
                <SelectItem value="access">Access Events</SelectItem>
                <SelectItem value="system">System Events</SelectItem>
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

      {/* Activity Logs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Logs</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="user">User Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Chronological view of all regulatory system activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.map((log) => {
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
                            <Badge className={getSeverityBadge(log.severity)}>
                              {log.severity}
                            </Badge>
                            {!log.success && (
                              <Badge variant="destructive">Failed</Badge>
                            )}
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

        <TabsContent value="critical" className="space-y-4">
          <div className="space-y-4">
            {activityLogs.filter(log => log.severity === 'critical').map((log) => {
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

        <TabsContent value="security" className="space-y-4">
          <div className="space-y-4">
            {activityLogs.filter(log => log.action.includes('access') || log.action.includes('login') || !log.success).map((log) => {
              const ActionIcon = getActionIcon(log.action);
              return (
                <Card key={log.id} className="healthcare-card border-l-4 border-l-warning">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-warning/10 rounded-full">
                        <ActionIcon className="w-6 h-6 text-warning" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{log.description}</h3>
                          <span className="text-sm text-muted-foreground">{formatTime(log.timestamp)}</span>
                        </div>
                        <div className="text-sm text-destructive">
                          <strong>Security Event:</strong> IP {log.ipAddress} - {log.userAgent}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="space-y-4">
            {activityLogs.filter(log => log.user === 'Automated System' || log.user === 'System Administrator').map((log) => {
              const ActionIcon = getActionIcon(log.action);
              return (
                <Card key={log.id} className="healthcare-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <ActionIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{log.description}</h3>
                          <span className="text-sm text-muted-foreground">{formatTime(log.timestamp)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>System Process:</strong> {log.target}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <div className="space-y-4">
            {activityLogs.filter(log => log.user !== 'Automated System' && log.user !== 'System Administrator').map((log) => {
              const ActionIcon = getActionIcon(log.action);
              return (
                <Card key={log.id} className="healthcare-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-secondary/10 rounded-full">
                        <User className="w-6 h-6 text-secondary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{log.description}</h3>
                          <span className="text-sm text-muted-foreground">{formatTime(log.timestamp)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div><strong>User:</strong> {log.user} ({log.role})</div>
                          <div><strong>IP Address:</strong> {log.ipAddress}</div>
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
    </DashboardLayout>
  );
};

export default RegulatorActivityLogs;