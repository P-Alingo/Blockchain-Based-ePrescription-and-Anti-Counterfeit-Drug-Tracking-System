import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  Shield,
  Activity,
  Search,
  Download,
  Filter,
  User,
  Plus,
  Eye,
  QrCode,
  AlertTriangle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ActivityLogs = () => {
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/doctor/dashboard', active: false },
    { icon: FileText, label: 'Create Prescription', path: '/doctor/create-prescription', active: false },
    { icon: Clock, label: 'My Prescriptions', path: '/doctor/prescriptions', active: false },
    { icon: Shield, label: 'Blockchain Verification', path: '/doctor/blockchain-verification', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/doctor/activity-logs', active: true },
  ];

  const activities = [
    {
      id: 1,
      action: 'Created Prescription',
      prescriptionId: 'RX-2024-001',
      patient: 'Maria Wanjiku',
      timestamp: '2024-01-15 14:32:15',
      details: 'Amoxicillin 500mg - 7 days',
      status: 'success',
      ipAddress: '192.168.1.100'
    },
    {
      id: 2,
      action: 'Blockchain Verification',
      prescriptionId: 'RX-2024-001',
      patient: 'Maria Wanjiku',
      timestamp: '2024-01-15 14:33:42',
      details: 'Transaction: 0x742d35cc6ba256...',
      status: 'success',
      ipAddress: '192.168.1.100'
    },
    {
      id: 3,
      action: 'QR Code Generated',
      prescriptionId: 'RX-2024-001',
      patient: 'Maria Wanjiku',
      timestamp: '2024-01-15 14:33:58',
      details: 'QR code created for prescription',
      status: 'success',
      ipAddress: '192.168.1.100'
    },
    {
      id: 4,
      action: 'Viewed Prescription',
      prescriptionId: 'RX-2024-002',
      patient: 'John Kimani',
      timestamp: '2024-01-14 16:28:12',
      details: 'Accessed prescription details',
      status: 'info',
      ipAddress: '192.168.1.100'
    },
    {
      id: 5,
      action: 'Login Attempt',
      prescriptionId: '-',
      patient: '-',
      timestamp: '2024-01-14 08:15:30',
      details: 'Successful login to dashboard',
      status: 'success',
      ipAddress: '192.168.1.100'
    },
    {
      id: 6,
      action: 'Failed Verification',
      prescriptionId: 'RX-2024-003',
      patient: 'Grace Nyong\'o',
      timestamp: '2024-01-13 18:45:22',
      details: 'Blockchain verification timeout',
      status: 'error',
      ipAddress: '192.168.1.100'
    }
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Created Prescription': return <Plus className="w-4 h-4" />;
      case 'Blockchain Verification': return <Shield className="w-4 h-4" />;
      case 'QR Code Generated': return <QrCode className="w-4 h-4" />;
      case 'Viewed Prescription': return <Eye className="w-4 h-4" />;
      case 'Login Attempt': return <User className="w-4 h-4" />;
      case 'Failed Verification': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success text-success-foreground';
      case 'error': return 'bg-destructive text-destructive-foreground';
      case 'info': return 'bg-primary text-primary-foreground';
      case 'warning': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="doctor"
      userName="Dr. Samuel Kimani"
      userEmail="s.kimani@hospital.co.ke"
    >
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Activity Logs</h1>
            <p className="text-muted-foreground">Complete audit trail of your prescription activities</p>
          </div>
          <Button className="btn-gradient-primary">
            <Download className="mr-2 w-4 h-4" />
            Export Logs
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                  <p className="text-2xl font-bold">4,892</p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">23</p>
                </div>
                <Clock className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed Actions</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">99.7%</p>
                </div>
                <Shield className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Filter & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Search activities, prescription IDs, or patient names..."
                    className="pl-10 focus:ring-primary"
                  />
                </div>
              </div>
              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Created Prescription</SelectItem>
                  <SelectItem value="verify">Blockchain Verification</SelectItem>
                  <SelectItem value="view">Viewed Prescription</SelectItem>
                  <SelectItem value="login">Login Attempt</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg border bg-muted/30">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.status === 'success' ? 'bg-success/10 text-success' :
                    activity.status === 'error' ? 'bg-destructive/10 text-destructive' :
                    activity.status === 'info' ? 'bg-primary/10 text-primary' :
                    'bg-muted/50 text-muted-foreground'
                  }`}>
                    {getActionIcon(activity.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold">{activity.action}</h3>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{activity.timestamp}</span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                      {activity.prescriptionId !== '-' && (
                        <p><span className="font-medium">Prescription:</span> {activity.prescriptionId}</p>
                      )}
                      {activity.patient !== '-' && (
                        <p><span className="font-medium">Patient:</span> {activity.patient}</p>
                      )}
                    </div>
                    
                    <p className="text-sm mb-2">{activity.details}</p>
                    
                    <div className="text-xs text-muted-foreground">
                      <span>IP Address: {activity.ipAddress}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <span className="text-sm text-muted-foreground">Page 1 of 24</span>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ActivityLogs;