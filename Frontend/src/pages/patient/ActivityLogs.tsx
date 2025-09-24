import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  QrCode, 
  Bell,
  Activity,
  Eye,
  Pill,
  Shield,
  Scan
} from 'lucide-react';

const ActivityLogs = () => {
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/patient/dashboard', active: false },
    { icon: FileText, label: 'My Prescriptions', path: '/patient/prescriptions', active: false },
    { icon: QrCode, label: 'QR Code Viewer', path: '/patient/qr-viewer', active: false },
    { icon: Bell, label: 'My Alerts', path: '/patient/alerts', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/patient/activity-logs', active: true },
  ];

  const activities = [
    {
      action: 'QR Code Viewed',
      prescription: 'RX-2024-001',
      timestamp: '2024-01-15 14:32:15',
      details: 'Viewed QR code for Amoxicillin prescription'
    },
    {
      action: 'Medication Taken',
      prescription: 'RX-2024-003',
      timestamp: '2024-01-15 08:00:00',
      details: 'Marked Lisinopril dose as taken'
    }
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'QR Code Viewed': return <QrCode className="w-4 h-4" />;
      case 'Medication Taken': return <Pill className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="patient"
      userName="Maria Wanjiku"
      userEmail="maria.w@gmail.com"
    >
      <div className="space-y-8">
        <div>
         <h1 className="text-3xl font-bold text-green-600">Activity Logs</h1>
          <p className="text-muted-foreground">Track your prescription and medication history</p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg border bg-muted/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{activity.action}</h3>
                    <p className="text-sm text-muted-foreground">{activity.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ActivityLogs;