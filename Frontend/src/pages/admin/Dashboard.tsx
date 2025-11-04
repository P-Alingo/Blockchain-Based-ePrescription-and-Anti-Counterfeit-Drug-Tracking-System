import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings, Users, Cog, FileText, Activity, TrendingUp, Server, Database, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const sidebarItems = [
    { icon: Settings, label: 'Dashboard', path: '/admin/dashboard', active: true },
    { icon: Users, label: 'User Management', path: '/admin/users', active: false },
    { icon: Cog, label: 'Reports', path: '/admin/reports', active: false },
    { icon: Database, label: 'Database', path: '/admin/database', active: false },
    { icon: FileText, label: 'Blockchain', path: '/admin/blockchain', active: false },
    { icon: Activity, label: 'Analytics', path: '/admin/analytics', active: false },
  ];

  const systemHealth = [
    { component: 'Database', status: 'healthy', uptime: 99.9, response: '12ms' },
    { component: 'API Gateway', status: 'healthy', uptime: 99.8, response: '45ms' },
    { component: 'Blockchain Network', status: 'warning', uptime: 98.5, response: '120ms' },
    { component: 'File Storage', status: 'healthy', uptime: 99.7, response: '8ms' },
  ];

  const userStats = [
    { role: 'Patients', count: 12450, growth: '+8.2%' },
    { role: 'Doctors', count: 890, growth: '+3.1%' },
    { role: 'Pharmacists', count: 340, growth: '+5.7%' },
    { role: 'Others', count: 180, growth: '+2.4%' },
  ];

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="admin" userName="System Admin" userEmail="admin@eprescribe.go.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            System Administration
          </h1>
          <p className="text-muted-foreground">Monitor system health, manage users, and oversee platform operations</p>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">13,860</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +6.8% this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Server className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">99.8%</div>
              <p className="text-xs text-green-600 dark:text-green-400">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Storage</CardTitle>
              <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">2.1TB</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">68% capacity used</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">2</div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Resolved today</p>
            </CardContent>
          </Card>
        </div>

        {/* System Health and User Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Component status and performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemHealth.map((component) => (
                <div key={component.component} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{component.component}</p>
                    <p className="text-xs text-muted-foreground">Uptime: {component.uptime}%</p>
                    <p className="text-xs text-muted-foreground">Response: {component.response}</p>
                  </div>
                  <Badge
                    variant={
                      component.status === 'healthy' ? 'default' :
                      component.status === 'warning' ? 'secondary' : 'destructive'
                    }
                  >
                    {component.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Active users by role category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userStats.map((stat) => (
                <div key={stat.role} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{stat.role}</span>
                    <span>{stat.count.toLocaleString()} ({stat.growth})</span>
                  </div>
                  <Progress 
                    value={(stat.count / 13860) * 100} 
                    className="h-2" 
                  />
                  <div className="text-xs text-muted-foreground">
                    {((stat.count / 13860) * 100).toFixed(1)}% of total users
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>System Administration</CardTitle>
            <CardDescription>Quick access to administrative functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Users className="h-6 w-6" />
                Manage Users
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Cog className="h-6 w-6" />
                System Settings
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <FileText className="h-6 w-6" />
                Generate Reports
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Activity className="h-6 w-6" />
                View Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;