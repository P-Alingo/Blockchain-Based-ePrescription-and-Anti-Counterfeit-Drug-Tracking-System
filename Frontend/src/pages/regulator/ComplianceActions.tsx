import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Shield, AlertTriangle, CheckCircle, Clock, FileText, Eye, Gavel, Scale, CheckSquare, Activity } from "lucide-react";

const RegulatorComplianceActions = () => {
    const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/regulator/dashboard', active: false },
    { icon: Search, label: 'Audits', path: '/regulator/audits', active: false },
    { icon: FileText, label: 'Reports', path: '/regulator/reports', active: false },
    { icon: AlertTriangle, label: 'Alerts', path: '/regulator/alerts', active: false },
    { icon: CheckSquare, label: 'Compliance Actions', path: '/regulator/compliance', active: true },
    { icon: Activity, label: 'Activity Logs', path: '/regulator/activity-logs', active: false },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const complianceActions = [
    {
      id: "CA-2024-001",
      title: "License Suspension - Unauthorized Prescription Practices",
      facility: "Westside Medical Clinic",
      type: "License Action",
      severity: "critical",
      status: "active",
      date: "2024-02-15",
      dueDate: "2024-03-15",
      officer: "Dr. Sarah Kimani",
      description: "Immediate suspension due to pattern of unauthorized controlled substance prescriptions",
      actions: ["License suspended", "Investigation ongoing", "Compliance review required"],
      fine: "KES 500,000"
    },
    {
      id: "CA-2024-002", 
      title: "Corrective Action Plan - Record Keeping Violations",
      facility: "Nairobi Community Pharmacy",
      type: "Corrective Action",
      severity: "medium",
      status: "in-progress",
      date: "2024-02-10",
      dueDate: "2024-03-10",
      officer: "Dr. James Mwangi",
      description: "Implementation of improved record keeping systems and staff training",
      actions: ["Training program initiated", "System upgrade in progress", "Monthly reviews scheduled"],
      fine: "KES 50,000"
    },
    {
      id: "CA-2024-003",
      title: "Warning Notice - Storage Compliance Issues",
      facility: "Mombasa Central Hospital",
      type: "Warning",
      severity: "low",
      status: "resolved",
      date: "2024-02-05",
      dueDate: "2024-02-20",
      officer: "Dr. Grace Ochieng",
      description: "Improper storage of controlled substances - corrective measures implemented",
      actions: ["Storage facility upgraded", "Staff retrained", "Compliance verified"],
      fine: null
    },
    {
      id: "CA-2024-004",
      title: "Mandatory Audit - Digital Security Compliance",
      facility: "Kisumu Medical Center",
      type: "Audit Required",
      severity: "high",
      status: "pending",
      date: "2024-02-20",
      dueDate: "2024-03-30",
      officer: "Dr. Peter Kiptoo",
      description: "Comprehensive security audit following suspected data breach",
      actions: ["Security assessment scheduled", "System access restricted", "External audit firm engaged"],
      fine: "KES 200,000"
    }
  ];

  const complianceStats = [
    { title: "Active Actions", value: "15", icon: Shield, color: "text-destructive", bg: "bg-destructive/10" },
    { title: "Resolved This Month", value: "8", icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
    { title: "Pending Review", value: "6", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { title: "Total Fines Issued", value: "KES 2.1M", icon: Scale, color: "text-primary", bg: "bg-primary/10" }
  ];

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: "bg-destructive text-destructive-foreground",
      high: "bg-warning text-warning-foreground",
      medium: "bg-primary text-primary-foreground", 
      low: "bg-success text-success-foreground"
    };
    return variants[severity as keyof typeof variants] || variants.low;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-destructive text-destructive-foreground",
      "in-progress": "bg-warning text-warning-foreground",
      pending: "bg-muted text-muted-foreground",
      resolved: "bg-success text-success-foreground"
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      "License Action": Gavel,
      "Corrective Action": FileText,
      "Warning": AlertTriangle,
      "Audit Required": Search
    };
    return icons[type as keyof typeof icons] || Shield;
  };

  return (
   <DashboardLayout sidebarItems={sidebarItems} userRole="regulator" userName="Dr. Jane Regulator" userEmail="jane@ppb.go.ke">
      <div className="space-y-8">
        <div>
           <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Compliance Actions</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Regulatory enforcement and compliance management
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Generate Report
          </Button>
          <Button className="medical-button gap-2">
            <Gavel className="w-4 h-4" />
            New Action
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="medical-grid">
        {complianceStats.map((stat, index) => (
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
                placeholder="Search actions by facility or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Actions Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active Actions</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="space-y-6">
            {complianceActions.filter(action => action.status === 'active').map((action) => {
              const TypeIcon = getTypeIcon(action.type);
              return (
                <Card key={action.id} className="healthcare-card border-l-4 border-l-destructive">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="p-3 bg-destructive/10 rounded-full">
                          <TypeIcon className="w-6 h-6 text-destructive" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-xl">{action.title}</CardTitle>
                            <Badge className={getSeverityBadge(action.severity)}>
                              {action.severity}
                            </Badge>
                            <Badge className={getStatusBadge(action.status)}>
                              {action.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span><strong>ID:</strong> {action.id}</span>
                            <span><strong>Type:</strong> {action.type}</span>
                            <span><strong>Officer:</strong> {action.officer}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          Review
                        </Button>
                        <Button size="sm" className="gap-2">
                          <FileText className="w-4 h-4" />
                          Update
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Facility</p>
                        <p className="font-semibold">{action.facility}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                        <p className="font-semibold text-destructive">{action.dueDate}</p>
                      </div>
                      {action.fine && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Fine Amount</p>
                          <p className="font-semibold text-destructive">{action.fine}</p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                      <p className="text-foreground">{action.description}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Required Actions</p>
                      <ul className="space-y-1">
                        {action.actions.map((actionItem, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-sm">{actionItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-6">
            {complianceActions.filter(action => action.status === 'pending').map((action) => {
              const TypeIcon = getTypeIcon(action.type);
              return (
                <Card key={action.id} className="healthcare-card border-l-4 border-l-warning">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="p-3 bg-warning/10 rounded-full">
                          <TypeIcon className="w-6 h-6 text-warning" />
                        </div>
                        <div className="space-y-2">
                          <CardTitle className="text-xl">{action.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span><strong>Facility:</strong> {action.facility}</span>
                            <span><strong>Due:</strong> {action.dueDate}</span>
                          </div>
                        </div>
                      </div>
                      <Button className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Activate
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <div className="space-y-6">
            {complianceActions.filter(action => action.status === 'resolved').map((action) => {
              const TypeIcon = getTypeIcon(action.type);
              return (
                <Card key={action.id} className="healthcare-card border-l-4 border-l-success opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="p-3 bg-success/10 rounded-full">
                          <TypeIcon className="w-6 h-6 text-success" />
                        </div>
                        <div className="space-y-2">
                          <CardTitle className="text-xl line-through">{action.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span><strong>Facility:</strong> {action.facility}</span>
                            <span><strong>Resolved:</strong> {action.date}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Report
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-6">
            {complianceActions.map((action) => {
              const TypeIcon = getTypeIcon(action.type);
              const borderColor = action.status === 'active' ? 'border-l-destructive' :
                                 action.status === 'pending' ? 'border-l-warning' :
                                 action.status === 'resolved' ? 'border-l-success' : 'border-l-muted';
              
              return (
                <Card key={action.id} className={`healthcare-card border-l-4 ${borderColor}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <TypeIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-xl">{action.title}</CardTitle>
                            <Badge className={getSeverityBadge(action.severity)}>
                              {action.severity}
                            </Badge>
                            <Badge className={getStatusBadge(action.status)}>
                              {action.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span><strong>Facility:</strong> {action.facility}</span>
                            <span><strong>Officer:</strong> {action.officer}</span>
                            <span><strong>Date:</strong> {action.date}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Details
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
      </DashboardLayout>
  );
};

export default RegulatorComplianceActions;