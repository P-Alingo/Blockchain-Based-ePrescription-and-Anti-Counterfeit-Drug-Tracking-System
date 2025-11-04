import { Settings, Users, Cog, Database, FileText, Activity } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Download,
  BarChart3,
  Filter,
  Calendar as CalendarIcon,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const AdminReports = () => {
  const sidebarItems = [
    { icon: Settings, label: 'Dashboard', path: '/admin/dashboard', active: false },
    { icon: Users, label: 'User Management', path: '/admin/users', active: false },
    { icon: Cog, label: 'Reports', path: '/admin/reports', active: true },
    { icon: Database, label: 'Database', path: '/admin/database', active: false },
    { icon: FileText, label: 'Blockchain', path: '/admin/blockchain', active: false },
    { icon: Activity, label: 'Analytics', path: '/admin/analytics', active: false },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [date, setDate] = useState<Date>();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/reports')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch reports');
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

  const reportMetrics = [
    { title: 'Total Reports', value: '47', icon: FileText, color: 'text-primary', change: '+12%' },
    { title: 'Downloads This Month', value: '345', icon: Download, color: 'text-success', change: '+25%' },
    { title: 'Active Users', value: '1,247', icon: Users, color: 'text-secondary', change: '+8%' },
    { title: 'System Uptime', value: '99.9%', icon: Activity, color: 'text-warning', change: '+0.1%' },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      published: 'bg-success text-success-foreground',
      draft: 'bg-muted text-muted-foreground',
      'in-review': 'bg-warning text-warning-foreground',
    };
    return variants[status as keyof typeof variants] || variants.draft;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      Analytics: 'text-primary',
      'User Activity': 'text-secondary',
      Performance: 'text-warning',
      Security: 'text-destructive',
      Financial: 'text-success',
    };
    return colors[type as keyof typeof colors] || 'text-muted-foreground';
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="admin" userName="System Admin" userEmail="admin@eprescribe.go.ke">
      <div className="min-h-screen bg-background p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">System Reports</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Administrative reports and system analytics
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics Dashboard
            </Button>
            <Button className="medical-button gap-2">
              <FileText className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="medical-grid">
          {reportMetrics.map((metric, index) => (
            <Card key={index} className="dashboard-card">
              {/* You can add metric display here if needed */}
            </Card>
          ))}
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="space-y-6">
                {reports.map((report) => (
                  <Card key={report.id} className="healthcare-card hover-lift">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-xl">{report.title}</CardTitle>
                            <Badge className={getStatusBadge(report.status)}>
                              {report.status.replace('-', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className={getTypeColor(report.type)}>{report.type}</span>
                            <span>{report.id}</span>
                            <span>By {report.author}</span>
                            <span>{report.createdDate}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`/api/reports/${report.id}`, '_blank')}>
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{report.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-accent/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">File Size</p>
                          <p className="font-semibold">{report.size}</p>
                        </div>
                        <div className="text-center p-3 bg-accent/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Downloads</p>
                          <p className="font-semibold">{report.downloads}</p>
                        </div>
                        {report.metrics && Object.entries(report.metrics)
                          .slice(0, 2)
                          .map(([key, value]) => (
                            <div key={key} className="text-center p-3 bg-accent/50 rounded-lg">
                              <p className="text-sm text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                              <p className="font-semibold">{String(value)}</p>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Scheduled Reports</h3>
                <p className="text-muted-foreground mb-6">Automated reports scheduled for generation</p>
                <Button className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Schedule New Report
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-6">
                <Card className="healthcare-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Real-time Analytics
                    </CardTitle>
                    <CardDescription>Live system metrics and usage statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <p className="text-2xl font-bold text-primary">1,247</p>
                        <p className="text-sm text-muted-foreground">Active Users</p>
                      </div>
                      <div className="text-center p-4 bg-success/10 rounded-lg">
                        <p className="text-2xl font-bold text-success">8,934</p>
                        <p className="text-sm text-muted-foreground">Prescriptions Today</p>
                      </div>
                      <div className="text-center p-4 bg-warning/10 rounded-lg">
                        <p className="text-2xl font-bold text-warning">99.9%</p>
                        <p className="text-sm text-muted-foreground">System Uptime</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="healthcare-card">
                  <CardHeader>
                    <CardTitle>Generate Custom Analytics Report</CardTitle>
                    <CardDescription>
                      Create a custom report with specific metrics and date ranges
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select metrics" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="users">User Activity</SelectItem>
                          <SelectItem value="prescriptions">Prescription Data</SelectItem>
                          <SelectItem value="performance">System Performance</SelectItem>
                          <SelectItem value="security">Security Events</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Time period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Last 7 days</SelectItem>
                          <SelectItem value="month">Last 30 days</SelectItem>
                          <SelectItem value="quarter">Last 3 months</SelectItem>
                          <SelectItem value="year">Last 12 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Generate Analytics Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;