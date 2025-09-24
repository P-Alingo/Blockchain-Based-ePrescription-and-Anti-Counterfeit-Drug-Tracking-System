import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  QrCode, 
  Bell,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Pill,
  TrendingUp,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PatientDashboard = () => {
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/patient/dashboard', active: true },
    { icon: FileText, label: 'My Prescriptions', path: '/patient/prescriptions', active: false },
    { icon: QrCode, label: 'QR Code Viewer', path: '/patient/qr-viewer', active: false },
    { icon: Bell, label: 'My Alerts', path: '/patient/alerts', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/patient/activity-logs', active: false },
  ];

  const stats = [
    {
      title: 'Active Prescriptions',
      value: '3',
      change: 'No change',
      icon: Clock,
      color: 'text-warning'
    },
    {
      title: 'Completed This Month',
      value: '8',
      change: '+2 from last month',
      icon: CheckCircle,
      color: 'text-success'
    },
    {
      title: 'Total Prescriptions',
      value: '24',
      change: '+3 this month',
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: 'Alerts',
      value: '1',
      change: 'Expiry reminder',
      icon: Bell,
      color: 'text-destructive'
    }
  ];

  const activePrescriptions = [
    {
      id: 'RX-2024-001',
      doctor: 'Dr. Samuel Kimani',
      drug: 'Amoxicillin 500mg',
      dosage: '1 tablet, 3x daily',
      daysLeft: 5,
      status: 'Active',
      nextDose: '14:00 today'
    },
    {
      id: 'RX-2024-003',
      doctor: 'Dr. Grace Wanjiku',
      drug: 'Lisinopril 10mg',
      dosage: '1 tablet, once daily',
      daysLeft: 28,
      status: 'Active',
      nextDose: '08:00 tomorrow'
    },
    {
      id: 'RX-2024-005',
      doctor: 'Dr. Peter Mwangi',
      drug: 'Metformin 850mg',
      dosage: '1 tablet, 2x daily',
      daysLeft: 15,
      status: 'Active',
      nextDose: '19:00 today'
    }
  ];

  const recentActivity = [
    {
      action: 'Prescription Dispensed',
      prescription: 'RX-2024-001',
      timestamp: '2 hours ago',
      pharmacy: 'Nairobi Central Pharmacy'
    },
    {
      action: 'Medication Reminder',
      prescription: 'RX-2024-003',
      timestamp: '8 hours ago',
      pharmacy: '-'
    },
    {
      action: 'QR Code Scanned',
      prescription: 'RX-2024-005',
      timestamp: '1 day ago',
      pharmacy: 'Westlands Pharmacy'
    }
  ];

  return (
    <DashboardLayout
      sidebarItems={sidebarItems.map(item => ({
        ...item,
        active: item.path === '/patient/dashboard'
      }))}
      userRole="patient"
      userName="Maria Wanjiku"
      userEmail="maria.w@gmail.com"
    >
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
           <h1 className="text-3xl font-bold text-green-600">Patient Dashboard</h1>
            <p className="text-muted-foreground">Track your prescriptions and medication schedule</p>
          </div>
          <Link to="/patient/qr-viewer">
            <Button className="btn-gradient-primary">
              <QrCode className="mr-2 w-5 h-5" />
              Show QR Code
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="card-elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Active Prescriptions */}
          <div className="lg:col-span-2">
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Active Prescriptions</CardTitle>
                  <Badge className="bg-warning text-warning-foreground">3 Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activePrescriptions.map((prescription) => (
                    <div key={prescription.id} className="p-4 rounded-lg border bg-muted/30">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{prescription.drug}</h3>
                          <p className="text-sm text-muted-foreground">by {prescription.doctor}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {prescription.daysLeft} days left
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Dosage:</span> {prescription.dosage}</p>
                        <p><span className="font-medium">Next dose:</span> {prescription.nextDose}</p>
                        <p><span className="font-medium">Prescription ID:</span> {prescription.id}</p>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Link to={`/patient/qr-viewer?id=${prescription.id}`}>
                          <Button size="sm" variant="outline">
                            <QrCode className="mr-1 w-3 h-3" />
                            QR Code
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline">
                          <Pill className="mr-1 w-3 h-3" />
                          Mark Taken
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link to="/patient/prescriptions">
                    <Button variant="outline" className="w-full">View All Prescriptions</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Today's Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Amoxicillin</span>
                    <span className="text-sm text-muted-foreground">14:00</span>
                  </div>
                  <p className="text-xs text-muted-foreground">1 tablet after meal</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Metformin</span>
                    <span className="text-sm text-muted-foreground">19:00</span>
                  </div>
                  <p className="text-xs text-muted-foreground">1 tablet with dinner</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/patient/qr-viewer">
                  <Button className="w-full btn-gradient-primary">
                    <QrCode className="mr-2 w-4 h-4" />
                    Show QR Codes
                  </Button>
                </Link>
                <Link to="/patient/alerts">
                  <Button variant="outline" className="w-full">
                    <Bell className="mr-2 w-4 h-4" />
                    View Alerts (1)
                  </Button>
                </Link>
                <Link to="/patient/activity-logs">
                  <Button variant="outline" className="w-full">
                    <Activity className="mr-2 w-4 h-4" />
                    Activity History
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="text-sm">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.prescription} • {activity.timestamp}
                      </p>
                      {activity.pharmacy !== '-' && (
                        <p className="text-xs text-muted-foreground">at {activity.pharmacy}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;