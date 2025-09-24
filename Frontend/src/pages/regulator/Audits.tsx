import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, Eye, AlertTriangle, CheckCircle, Clock, FileText, Shield, CheckSquare, Activity } from "lucide-react";

const RegulatorAudits = () => {
    const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/regulator/dashboard', active: false },
    { icon: Search, label: 'Audits', path: '/regulator/audits', active: true },
    { icon: FileText, label: 'Reports', path: '/regulator/reports', active: false },
    { icon: AlertTriangle, label: 'Alerts', path: '/regulator/alerts', active: false },
    { icon: CheckSquare, label: 'Compliance Actions', path: '/regulator/compliance', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/regulator/activity-logs', active: false },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const auditData = [
    {
      id: "AUD-2024-001",
      facility: "Nairobi General Hospital",
      type: "Prescription Compliance",
      status: "completed",
      score: 95,
      date: "2024-01-15",
      auditor: "Dr. Sarah Kimani",
      findings: 2,
      priority: "low"
    },
    {
      id: "AUD-2024-002", 
      facility: "Mombasa Medical Center",
      type: "Controlled Substances",
      status: "in-progress",
      score: null,
      date: "2024-01-20",
      auditor: "Dr. James Mwangi",
      findings: 0,
      priority: "high"
    },
    {
      id: "AUD-2024-003",
      facility: "Kisumu Health Clinic",
      type: "Record Keeping",
      status: "pending",
      score: null,
      date: "2024-01-25",
      auditor: "Dr. Grace Ochieng",
      findings: 0,
      priority: "medium"
    },
    {
      id: "AUD-2024-004",
      facility: "Eldoret Central Pharmacy",
      type: "Storage & Handling",
      status: "completed",
      score: 88,
      date: "2024-01-10",
      auditor: "Dr. Peter Kiptoo",
      findings: 4,
      priority: "medium"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-success text-success-foreground",
      "in-progress": "bg-warning text-warning-foreground", 
      pending: "bg-muted text-muted-foreground"
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "bg-destructive text-destructive-foreground",
      medium: "bg-warning text-warning-foreground",
      low: "bg-success text-success-foreground"
    };
    return variants[priority as keyof typeof variants] || variants.low;
  };

  return (
   <DashboardLayout sidebarItems={sidebarItems} userRole="regulator" userName="Dr. Jane Regulator" userEmail="jane@ppb.go.ke">
      <div className="space-y-8">
        <div>
           <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Regulatory Audits</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Comprehensive facility audits and compliance monitoring
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button className="medical-button gap-2">
            <FileText className="w-4 h-4" />
            New Audit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="medical-grid">
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Audits</p>
                <p className="text-3xl font-bold text-primary">24</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-success">18</p>
              </div>
              <div className="p-3 bg-success/10 rounded-full">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-warning">4</p>
              </div>
              <div className="p-3 bg-warning/10 rounded-full">
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issues Found</p>
                <p className="text-3xl font-bold text-destructive">6</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-8 h-8 text-destructive" />
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search audits by facility or ID..."
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audits Table */}
      <Card className="healthcare-card">
        <CardHeader>
          <CardTitle>Recent Audits</CardTitle>
          <CardDescription>
            Overview of all regulatory audits and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditData.map((audit) => (
              <div key={audit.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{audit.id}</h3>
                    <Badge className={getStatusBadge(audit.status)}>
                      {audit.status.replace('-', ' ')}
                    </Badge>
                    <Badge variant="outline" className={getPriorityBadge(audit.priority)}>
                      {audit.priority} priority
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Facility:</span> {audit.facility}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {audit.type}
                    </div>
                    <div>
                      <span className="font-medium">Auditor:</span> {audit.auditor}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {audit.date}
                    </div>
                    <div>
                      <span className="font-medium">Score:</span> {audit.score ? `${audit.score}%` : 'Pending'}
                    </div>
                    <div>
                      <span className="font-medium">Findings:</span> {audit.findings} issues
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Report
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </DashboardLayout>
  );
};

export default RegulatorAudits;