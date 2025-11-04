import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState, useEffect } from "react";
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
      { icon: AlertTriangle, label: 'Blockchain', path: '/regulator/blockchain', active: false },
      { icon: CheckSquare, label: 'Compliance Actions', path: '/regulator/compliance', active: false },
      { icon: Activity, label: 'Analytics', path: '/regulator/analytics', active: false },
    ];

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Placeholder metrics array
  const metrics = [
    { title: "Total Reports", value: reports.length, change: "+0", color: "text-primary", icon: FileText },
    { title: "Published", value: reports.filter(r => r.status === 'published').length, change: "+0", color: "text-success", icon: BarChart3 },
    { title: "Drafts", value: reports.filter(r => r.status === 'draft').length, change: "0", color: "text-warning", icon: TrendingUp },
    { title: "In Review", value: reports.filter(r => r.status === 'in-review').length, change: "0", color: "text-muted-foreground", icon: Eye }
  ];

  useEffect(() => {
    setLoading(true);
    fetch("/api/reports")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch reports");
        return res.json();
      })
      .then((data) => {
        setReports(data);
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
          <>
            {loading && (
              <div className="py-8 text-center text-muted-foreground">Loading reports...</div>
            )}
            {error && !loading && (
              <div className="py-8 text-center text-destructive">{error}</div>
            )}
            {!loading && !error && reports.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">No reports found.</div>
            )}
            {!loading && !error && reports.length > 0 && (
              <div className="grid gap-6">
                {reports.map((report) => (
                  <Card key={report.id} className="healthcare-card hover-lift">
                    <CardHeader>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription>{report.summary}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{report.type}</span>
                        <span>{report.id}</span>
                        <span>By {report.author}</span>
                        <span>{report.date}</span>
                        <span>{report.status}</span>
                        <span>{report.pages} pages</span>
                        <span>{report.downloads} downloads</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            window.open(`/api/reports/download/${report.id}`, '_blank');
                          }}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
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