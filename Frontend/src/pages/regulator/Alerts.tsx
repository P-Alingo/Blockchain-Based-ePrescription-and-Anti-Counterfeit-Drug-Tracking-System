import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Bell, AlertTriangle, Clock, CheckCircle, Shield, Activity, Filter, Eye, CheckSquare, FileText } from "lucide-react";

const RegulatorAlerts = () => {
    const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/regulator/dashboard', active: false },
    { icon: Search, label: 'Audits', path: '/regulator/audits', active: false },
    { icon: FileText, label: 'Reports', path: '/regulator/reports', active: false },
    { icon: AlertTriangle, label: 'Alerts', path: '/regulator/alerts', active: true },
    { icon: CheckSquare, label: 'Compliance Actions', path: '/regulator/compliance', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/regulator/activity-logs', active: false },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const alerts = [
    {
      id: "ALT-2024-001",
      title: "Suspicious Prescription Pattern Detected",
      description: "Multiple high-dose opioid prescriptions from Dr. John Doe in the last 24 hours",
      priority: "critical",
      status: "active",
      timestamp: "2024-02-20 14:30",
      facility: "Nairobi General Hospital",
      type: "prescription_anomaly",
      actions: 3
    },
    {
      id: "ALT-2024-002",
      title: "Unauthorized Access Attempt",
      description: "Failed login attempts detected on patient records system",
      priority: "high",
      status: "investigating",
      timestamp: "2024-02-20 13:15",
      facility: "Mombasa Medical Center",
      type: "security",
      actions: 1
    },
    {
      id: "ALT-2024-003",
      title: "Drug Inventory Discrepancy",
      description: "Controlled substances count mismatch at pharmacy inventory",
      priority: "high",
      status: "active",
      timestamp: "2024-02-20 11:45",
      facility: "Kisumu Pharmacy",
      type: "inventory",
      actions: 2
    },
    {
      id: "ALT-2024-004",
      title: "Unusual Dispensing Pattern",
      description: "High volume of specific medication dispensed outside normal hours",
      priority: "medium",
      status: "resolved",
      timestamp: "2024-02-19 22:30",
      facility: "Eldoret Health Center",
      type: "dispensing",
      actions: 0
    },
    {
      id: "ALT-2024-005",
      title: "System Maintenance Required",
      description: "Blockchain verification node showing performance degradation",
      priority: "low",
      status: "scheduled",
      timestamp: "2024-02-19 16:20",
      facility: "System Infrastructure",
      type: "system",
      actions: 1
    }
  ];

  const alertStats = [
    { title: "Active Alerts", value: "12", icon: Bell, color: "text-destructive", bg: "bg-destructive/10" },
    { title: "Resolved Today", value: "8", icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
    { title: "Under Investigation", value: "3", icon: Activity, color: "text-warning", bg: "bg-warning/10" },
    { title: "Critical Priority", value: "2", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" }
  ];

  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: "bg-destructive text-destructive-foreground animate-pulse",
      high: "bg-warning text-warning-foreground",
      medium: "bg-primary text-primary-foreground",
      low: "bg-muted text-muted-foreground"
    };
    return variants[priority as keyof typeof variants] || variants.low;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-destructive text-destructive-foreground",
      investigating: "bg-warning text-warning-foreground",
      resolved: "bg-success text-success-foreground",
      scheduled: "bg-primary text-primary-foreground"
    };
    return variants[status as keyof typeof variants] || variants.active;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      prescription_anomaly: AlertTriangle,
      security: Shield,
      inventory: Activity,
      dispensing: Clock,
      system: Activity
    };
    return icons[type as keyof typeof icons] || Bell;
  };

  return (
   <DashboardLayout sidebarItems={sidebarItems} userRole="regulator" userName="Dr. Jane Regulator" userEmail="jane@ppb.go.ke">
      <div className="space-y-8">
        <div>
           <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">System Alerts</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Real-time monitoring and incident response management
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Configure Alerts
          </Button>
          <Button className="medical-button gap-2">
            <Bell className="w-4 h-4" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="medical-grid">
        {alertStats.map((stat, index) => (
          <Card key={index} className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bg}`}>
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
                placeholder="Search alerts by title or facility..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="space-y-4">
            {alerts.filter(alert => alert.status === 'active').map((alert) => {
              const TypeIcon = getTypeIcon(alert.type);
              return (
                <Card key={alert.id} className="healthcare-card border-l-4 border-l-destructive">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="p-2 bg-destructive/10 rounded-full">
                          <TypeIcon className="w-6 h-6 text-destructive" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{alert.title}</h3>
                            <Badge className={getPriorityBadge(alert.priority)}>
                              {alert.priority}
                            </Badge>
                            <Badge className={getStatusBadge(alert.status)}>
                              {alert.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{alert.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span><strong>ID:</strong> {alert.id}</span>
                            <span><strong>Facility:</strong> {alert.facility}</span>
                            <span><strong>Time:</strong> {alert.timestamp}</span>
                            <span><strong>Actions:</strong> {alert.actions} pending</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          Investigate
                        </Button>
                        <Button size="sm" className="gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="investigating" className="space-y-4">
          <div className="space-y-4">
            {alerts.filter(alert => alert.status === 'investigating').map((alert) => {
              const TypeIcon = getTypeIcon(alert.type);
              return (
                <Card key={alert.id} className="healthcare-card border-l-4 border-l-warning">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="p-2 bg-warning/10 rounded-full">
                          <TypeIcon className="w-6 h-6 text-warning" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{alert.title}</h3>
                            <Badge className={getPriorityBadge(alert.priority)}>
                              {alert.priority}
                            </Badge>
                            <Badge className={getStatusBadge(alert.status)}>
                              {alert.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{alert.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span><strong>ID:</strong> {alert.id}</span>
                            <span><strong>Facility:</strong> {alert.facility}</span>
                            <span><strong>Time:</strong> {alert.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          View Details
                        </Button>
                        <Button size="sm" className="gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Update Status
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <div className="space-y-4">
            {alerts.filter(alert => alert.status === 'resolved').map((alert) => {
              const TypeIcon = getTypeIcon(alert.type);
              return (
                <Card key={alert.id} className="healthcare-card border-l-4 border-l-success opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="p-2 bg-success/10 rounded-full">
                          <TypeIcon className="w-6 h-6 text-success" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold line-through">{alert.title}</h3>
                            <Badge className={getStatusBadge(alert.status)}>
                              {alert.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{alert.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span><strong>ID:</strong> {alert.id}</span>
                            <span><strong>Facility:</strong> {alert.facility}</span>
                            <span><strong>Resolved:</strong> {alert.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {alerts.map((alert) => {
              const TypeIcon = getTypeIcon(alert.type);
              const borderColor = alert.status === 'active' ? 'border-l-destructive' :
                                 alert.status === 'investigating' ? 'border-l-warning' :
                                 alert.status === 'resolved' ? 'border-l-success' : 'border-l-muted';
              
              return (
                <Card key={alert.id} className={`healthcare-card border-l-4 ${borderColor}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <TypeIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{alert.title}</h3>
                            <Badge className={getPriorityBadge(alert.priority)}>
                              {alert.priority}
                            </Badge>
                            <Badge className={getStatusBadge(alert.status)}>
                              {alert.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{alert.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span><strong>ID:</strong> {alert.id}</span>
                            <span><strong>Facility:</strong> {alert.facility}</span>
                            <span><strong>Time:</strong> {alert.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Details
                      </Button>
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

export default RegulatorAlerts;