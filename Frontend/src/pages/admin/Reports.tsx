import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  FileText,
  Download,
  Users,
  Activity,
  BarChart3,
  Filter,
  Calendar as CalendarIcon,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
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
    { icon: FileText, label: 'Dashboard', path: '/admin/dashboard', active: false },
    { icon: Users, label: 'User Management', path: '/admin/users', active: false },
    { icon: FileText, label: 'System Settings', path: '/admin/settings', active: false },
    { icon: FileText, label: 'Reports', path: '/admin/reports', active: true },
    { icon: Activity, label: 'Activity Logs', path: '/admin/activity-logs', active: false },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [date, setDate] = useState<Date>();

  const reports = [
    {
      id: 'RPT-ADM-001',
      title: 'System Usage Analytics - Q1 2024',
      type: 'Analytics',
      status: 'published',
      createdDate: '2024-02-20',
      author: 'System Analytics',
      downloads: 89,
      size: '2.4 MB',
      description:
        'Comprehensive analysis of system usage patterns and user behavior across all modules',
      metrics: {
        users: 1247,
        prescriptions: 8934,
        facilities: 156,
      },
    },
    {
      id: 'RPT-ADM-002',
      title: 'User Activity Summary - February 2024',
      type: 'User Activity',
      status: 'published',
      createdDate: '2024-02-15',
      author: 'Admin Team',
      downloads: 156,
      size: '1.8 MB',
      description:
        'Monthly breakdown of user activities, login patterns, and feature utilization',
      metrics: {
        users: 894,
        sessions: 12456,
        avgSessionDuration: '24m',
      },
    },
    {
      id: 'RPT-ADM-003',
      title: 'System Performance Metrics',
      type: 'Performance',
      status: 'draft',
      createdDate: '2024-02-18',
      author: 'Technical Team',
      downloads: 0,
      size: '3.2 MB',
      description: 'Real-time performance monitoring and system health indicators',
      metrics: {
        uptime: '99.9%',
        responseTime: '145ms',
        errors: 12,
      },
    },
    {
      id: 'RPT-ADM-004',
      title: 'Security Audit Report - January 2024',
      type: 'Security',
      status: 'published',
      createdDate: '2024-02-01',
      author: 'Security Team',
      downloads: 67,
      size: '4.1 MB',
      description:
        'Monthly security assessment including threat analysis and vulnerability reports',
      metrics: {
        threats: 3,
        vulnerabilities: 1,
        incidents: 0,
      },
    },
    {
      id: 'RPT-ADM-005',
      title: 'Financial Overview - Q1 FY2024',
      type: 'Financial',
      status: 'in-review',
      createdDate: '2024-02-10',
      author: 'Finance Department',
      downloads: 0,
      size: '1.9 MB',
      description:
        'Quarterly financial analysis including subscription revenue and operational costs',
      metrics: {
        revenue: 'KES 2.4M',
        costs: 'KES 1.8M',
        profit: 'KES 600K',
      },
    },
  ];

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
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-3xl font-bold mt-2">{metric.value}</p>
                    <p className={`text-sm mt-1 ${metric.color}`}>{metric.change} from last month</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
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
                <Input
                  placeholder="Search reports by title or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="user-activity">User Activity</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Advanced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Reports</TabsTrigger>
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
                        <Button variant="outline" size="sm" className="gap-2">
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
                      {Object.entries(report.metrics)
                        .slice(0, 2)
                        .map(([key, value]) => (
                          <div key={key} className="text-center p-3 bg-accent/50 rounded-lg">
                            <p className="text-sm text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="font-semibold">{value}</p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="published" className="space-y-4">
            <div className="space-y-6">
              {reports
                .filter((r) => r.status === 'published')
                .map((report) => (
                  <Card key={report.id} className="healthcare-card hover-lift">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl">{report.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{report.downloads} downloads</span>
                            <span>{report.size}</span>
                            <span>Published {report.createdDate}</span>
                          </div>
                        </div>
                        <Button className="gap-2">
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{report.description}</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="draft" className="space-y-4">
            <div className="space-y-6">
              {reports
                .filter((r) => r.status === 'draft')
                .map((report) => (
                  <Card key={report.id} className="healthcare-card border-dashed">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl text-muted-foreground">{report.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Draft</span>
                            <span>Last modified {report.createdDate}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button size="sm">Publish</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{report.description}</p>
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
    </DashboardLayout>
  );
};

export default AdminReports;