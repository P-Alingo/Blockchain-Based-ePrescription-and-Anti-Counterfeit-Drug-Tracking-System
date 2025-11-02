import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Settings,
  Users,
  Cog,
  FileText,
  Activity,
  Shield,
  Database,
  Mail,
  Bell,
  Globe,
  Key,
  Save,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

const AdminSystemSettings = () => {
  const sidebarItems = [
    { icon: Settings, label: 'Dashboard', path: '/admin/dashboard', active: false },
    { icon: Users, label: 'User Management', path: '/admin/users', active: false },
    { icon: Cog, label: 'System Settings', path: '/admin/settings', active: true },
    { icon: FileText, label: 'Reports', path: '/admin/reports', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/admin/activity-logs', active: false },
  ];

  const [systemStatus, setSystemStatus] = useState("operational");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [backupEnabled, setBackupEnabled] = useState(true);

  const systemStats = [
    { title: "System Health", value: "Excellent", status: "success", icon: Shield },
    { title: "Database Size", value: "2.4 TB", status: "info", icon: Database },
    { title: "Active Users", value: "847", status: "info", icon: Globe },
    { title: "Last Backup", value: "2 hours ago", status: "success", icon: Database }
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      success: "text-success",
      warning: "text-warning",
      error: "text-destructive",
      info: "text-primary"
    };
    return colors[status as keyof typeof colors] || colors.info;
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="admin"
      userName="System Admin"
      userEmail="admin@eprescribe.go.ke"
    >
      <div className="min-h-screen bg-background p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">System Settings</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Configure and manage system-wide settings and preferences
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>
            <Button className="medical-button gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* System Status */}
        <div className="medical-grid">
          {systemStats.map((stat, index) => (
            <Card key={index} className="dashboard-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className={`text-2xl font-bold mt-2 ${getStatusColor(stat.status)}`}>{stat.value}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <stat.icon className={`w-8 h-8 ${getStatusColor(stat.status)}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="healthcare-card">
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Basic system settings and operational parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="system-name">System Name</Label>
                    <Input
                      id="system-name"
                      placeholder="Blue RX Flow Kenya"
                      defaultValue="Blue RX Flow Kenya"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">System Version</Label>
                    <Input
                      id="version"
                      placeholder="v2.1.4"
                      defaultValue="v2.1.4"
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable to restrict system access during maintenance
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceMode}
                      onCheckedChange={setMaintenanceMode}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">System Timezone</Label>
                    <Select defaultValue="eat">
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eat">East Africa Time (UTC+3)</SelectItem>
                        <SelectItem value="utc">Coordinated Universal Time (UTC)</SelectItem>
                        <SelectItem value="cet">Central European Time (UTC+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Default Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Kiswahili</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="healthcare-card">
              <CardHeader>
                <CardTitle>Performance Settings</CardTitle>
                <CardDescription>
                  Configure system performance and resource utilization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="max-concurrent">Max Concurrent Users</Label>
                    <Input
                      id="max-concurrent"
                      type="number"
                      placeholder="1000"
                      defaultValue="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      placeholder="30"
                      defaultValue="30"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="healthcare-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Policies
                </CardTitle>
                <CardDescription>
                  Configure authentication and access control settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password-policy">Password Complexity</Label>
                    <Select defaultValue="strong">
                      <SelectTrigger>
                        <SelectValue placeholder="Select policy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                        <SelectItem value="medium">Medium (10+ chars, mixed case)</SelectItem>
                        <SelectItem value="strong">Strong (12+ chars, symbols, numbers)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                      <Input
                        id="max-login-attempts"
                        type="number"
                        placeholder="5"
                        defaultValue="5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
                      <Input
                        id="lockout-duration"
                        type="number"
                        placeholder="15"
                        defaultValue="15"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Require 2FA for all admin accounts
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>IP Whitelist Enforcement</Label>
                        <p className="text-sm text-muted-foreground">
                          Restrict access to whitelisted IP addresses
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="healthcare-card">
              <CardHeader>
                <CardTitle>API Security</CardTitle>
                <CardDescription>
                  Configure API access and rate limiting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="api-rate-limit">API Rate Limit (requests/minute)</Label>
                    <Input
                      id="api-rate-limit"
                      type="number"
                      placeholder="100"
                      defaultValue="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token-expiry">API Token Expiry (hours)</Label>
                    <Input
                      id="token-expiry"
                      type="number"
                      placeholder="24"
                      defaultValue="24"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="healthcare-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure system notifications and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable system-wide notifications
                      </p>
                    </div>
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send notifications via email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send critical alerts via SMS
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email Address</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@bluerxflow.ke"
                    defaultValue="admin@bluerxflow.ke"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-frequency">Notification Frequency</Label>
                  <Select defaultValue="immediate">
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Summary</SelectItem>
                      <SelectItem value="weekly">Weekly Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card className="healthcare-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Configure database settings and maintenance schedules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Automatic Backups</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable scheduled database backups
                      </p>
                    </div>
                    <Switch
                      checked={backupEnabled}
                      onCheckedChange={setBackupEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backup-schedule">Backup Schedule</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily at 2:00 AM</SelectItem>
                        <SelectItem value="weekly">Weekly (Sunday 1:00 AM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="retention-period">Backup Retention (days)</Label>
                      <Input
                        id="retention-period"
                        type="number"
                        placeholder="30"
                        defaultValue="30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-connections">Max DB Connections</Label>
                      <Input
                        id="max-connections"
                        type="number"
                        placeholder="100"
                        defaultValue="100"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2">
                    <Database className="w-4 h-4" />
                    Test Connection
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Save className="w-4 h-4" />
                    Backup Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card className="healthcare-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Third-Party Integrations
                </CardTitle>
                <CardDescription>
                  Configure external service integrations and API keys
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Email Service</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-host">SMTP Host</Label>
                        <Input
                          id="smtp-host"
                          placeholder="smtp.gmail.com"
                          defaultValue="smtp.gmail.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">SMTP Port</Label>
                        <Input
                          id="smtp-port"
                          placeholder="587"
                          defaultValue="587"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">SMS Service</h3>
                    <div className="space-y-2">
                      <Label htmlFor="sms-api-key">SMS API Key</Label>
                      <Input
                        id="sms-api-key"
                        type="password"
                        placeholder="••••••••••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Blockchain Network</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="blockchain-endpoint">RPC Endpoint</Label>
                        <Input
                          id="blockchain-endpoint"
                          placeholder="https://mainnet.infura.io/v3/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contract-address">Contract Address</Label>
                        <Input
                          id="contract-address"
                          placeholder="0x..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Test Connections
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminSystemSettings;