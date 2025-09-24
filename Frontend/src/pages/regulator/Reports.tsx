import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, Eye, TrendingUp, FileText, BarChart3, Calendar, Filter, Shield, AlertTriangle, CheckSquare, Activity } from "lucide-react";

const RegulatorReports = () => {
    const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/regulator/dashboard', active: false },
    { icon: Search, label: 'Audits', path: '/regulator/audits', active: false },
    { icon: FileText, label: 'Reports', path: '/regulator/reports', active: true },
    { icon: AlertTriangle, label: 'Alerts', path: '/regulator/alerts', active: false },
    { icon: CheckSquare, label: 'Compliance Actions', path: '/regulator/compliance', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/regulator/activity-logs', active: false },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const reports = [
    {
      id: "RPT-2024-001",
      title: "Prescription Fraud Analysis Q1 2024",
      type: "Fraud Investigation",
      status: "published",
      date: "2024-01-30",
      author: "Regulatory Analytics Team",
      downloads: 156,
      pages: 45,
      summary: "Comprehensive analysis of prescription fraud patterns across Kenya's healthcare system"
    },
    {
      id: "RPT-2024-002",
      title: "Controlled Substances Compliance Report",
      type: "Compliance",
      status: "draft",
      date: "2024-02-15",
      author: "Dr. Sarah Kimani",
      downloads: 0,
      pages: 32,
      summary: "Assessment of controlled substances handling and documentation practices"
    },
    {
      id: "RPT-2024-003",
      title: "Digital Health Records Security Audit",
      type: "Security",
      status: "published",
      date: "2024-02-01",
      author: "Cybersecurity Division",
      downloads: 89,
      pages: 67,
      summary: "Evaluation of digital health record systems security implementations"
    },
    {
      id: "RPT-2024-004",
      title: "Pharmaceutical Supply Chain Analysis",
      type: "Supply Chain",
      status: "in-review",
      date: "2024-02-20",
      author: "Supply Chain Team",
      downloads: 0,
      pages: 38,
      summary: "Analysis of pharmaceutical distribution and supply chain integrity"
    }
  ];

  const metrics = [
    { title: "Total Reports", value: "47", change: "+12%", icon: FileText, color: "text-primary" },
    { title: "Published This Month", value: "8", change: "+25%", icon: TrendingUp, color: "text-success" },
    { title: "Total Downloads", value: "2,847", change: "+45%", icon: Download, color: "text-warning" },
    { title: "Avg. Report Length", value: "42 pages", change: "+8%", icon: BarChart3, color: "text-secondary" }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      published: "bg-success text-success-foreground",
      draft: "bg-muted text-muted-foreground",
      "in-review": "bg-warning text-warning-foreground"
    };
    return variants[status as keyof typeof variants] || variants.draft;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      "Fraud Investigation": "text-destructive",
      "Compliance": "text-primary",
      "Security": "text-warning",
      "Supply Chain": "text-success"
    };
    return colors[type as keyof typeof colors] || "text-muted-foreground";
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="regulator" userName="Dr. Jane Regulator" userEmail="jane@ppb.go.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Regulatory Reports</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Comprehensive analysis and compliance documentation
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Schedule Report
          </Button>
          <Button className="medical-button gap-2">
            <FileText className="w-4 h-4" />
            Create Report
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="medical-grid">
        {metrics.map((metric, index) => (
          <Card key={index} className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-3xl font-bold mt-2">{metric.value}</p>
                  <p className={`text-sm mt-1 ${metric.color}`}>{metric.change} from last month</p>
                </div>
                <div className={`p-3 bg-primary/10 rounded-full`}>
                  <metric.icon className={`w-8 h-8 ${metric.color}`} />
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
                placeholder="Search reports by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="fraud">Fraud Investigation</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="supply-chain">Supply Chain</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Section */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="review">In Review</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="healthcare-card hover-lift">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{report.title}</CardTitle>
                        <Badge className={getStatusBadge(report.status)}>
                          {report.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{report.id}</span>
                        <span className={getTypeColor(report.type)}>{report.type}</span>
                        <span>{report.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{report.summary}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-6">
                      <span><strong>Author:</strong> {report.author}</span>
                      <span><strong>Pages:</strong> {report.pages}</span>
                      <span><strong>Downloads:</strong> {report.downloads}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          <div className="grid gap-6">
            {reports.filter(r => r.status === 'published').map((report) => (
              <Card key={report.id} className="healthcare-card hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{report.title}</CardTitle>
                  <CardDescription>{report.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{report.author}</span>
                      <span>{report.downloads} downloads</span>
                    </div>
                    <Button className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Draft Reports</h3>
            <p className="text-muted-foreground">Reports currently being authored and reviewed</p>
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <div className="text-center py-12">
            <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Reports Under Review</h3>
            <p className="text-muted-foreground">Reports pending regulatory approval</p>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default RegulatorReports;