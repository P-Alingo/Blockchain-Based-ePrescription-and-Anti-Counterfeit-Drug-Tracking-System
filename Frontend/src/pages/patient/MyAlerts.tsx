import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  QrCode, 
  Bell,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pill,
  Shield
} from 'lucide-react';

const MyAlerts = () => {
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/patient/dashboard', active: false },
    { icon: FileText, label: 'My Prescriptions', path: '/patient/prescriptions', active: false },
    { icon: QrCode, label: 'QR Code Viewer', path: '/patient/qr-viewer', active: false },
    { icon: Bell, label: 'My Alerts', path: '/patient/alerts', active: true },
    { icon: Activity, label: 'Activity Logs', path: '/patient/activity-logs', active: false },
  ];

  const alerts = [
    {
      id: 1,
      type: 'expiry',
      title: 'Prescription Expiring Soon',
      message: 'Your Amoxicillin prescription (RX-2024-001) expires in 5 days',
      timestamp: '2024-01-15 14:30',
      priority: 'high',
      read: false
    },
    {
      id: 2,
      type: 'reminder',
      title: 'Medication Reminder',
      message: 'Time to take your Metformin dose',
      timestamp: '2024-01-15 12:00',
      priority: 'medium',
      read: true
    }
  ];

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="patient"
      userName="Maria Wanjiku"
      userEmail="maria.w@gmail.com"
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-green-600">My Alerts</h1>
          <p className="text-muted-foreground">Stay updated with prescription and medication alerts</p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      {alert.type === 'expiry' ? (
                        <AlertTriangle className="w-5 h-5 text-warning mt-1" />
                      ) : (
                        <Bell className="w-5 h-5 text-primary mt-1" />
                      )}
                      <div>
                        <h3 className="font-semibold">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                      </div>
                    </div>
                    <Badge 
                      className={
                        alert.priority === 'high' ? 'bg-destructive text-destructive-foreground' :
                        alert.priority === 'medium' ? 'bg-warning text-warning-foreground' :
                        'bg-muted text-muted-foreground'
                      }
                    >
                      {alert.priority}
                    </Badge>
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

export default MyAlerts;