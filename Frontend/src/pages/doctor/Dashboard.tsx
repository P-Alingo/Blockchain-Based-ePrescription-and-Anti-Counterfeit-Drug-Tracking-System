import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Activity,
  Shield,
  Plus,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DoctorDashboard = () => {
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/doctor/dashboard', active: true },
    { icon: FileText, label: 'Create Prescription', path: '/doctor/create-prescription', active: false },
    { icon: Clock, label: 'My Prescriptions', path: '/doctor/prescriptions', active: false },
    { icon: Shield, label: 'Blockchain Verification', path: '/doctor/blockchain-verification', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/doctor/activity-logs', active: false },
  ];

  const stats = [
    {
      title: 'Total Prescriptions',
      value: '2,847',
      change: '+12%',
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: 'Active Prescriptions',
      value: '127',
      change: '+8%',
      icon: Clock,
      color: 'text-warning'
    },
    {
      title: 'Dispensed Today',
      value: '23',
      change: '+15%',
      icon: CheckCircle,
      color: 'text-success'
    },
    {
      title: 'Patients Served',
      value: '1,542',
      change: '+5%',
      icon: Users,
      color: 'text-accent'
    }
  ];

  const recentPrescriptions = [
    {
      id: 'RX-2024-001',
      patient: 'Maria Wanjiku',
      drug: 'Amoxicillin 500mg',
      status: 'Active',
      date: '2024-01-15',
      urgency: 'normal'
    },
    {
      id: 'RX-2024-002',
      patient: 'John Kimani',
      drug: 'Metformin 850mg',
      status: 'Dispensed',
      date: '2024-01-14',
      urgency: 'urgent'
    },
    {
      id: 'RX-2024-003',
      patient: 'Grace Nyong\'o',
      drug: 'Lisinopril 10mg',
      status: 'Active',
      date: '2024-01-13',
      urgency: 'normal'
    }
  ];

  return (
    <DashboardLayout
      sidebarItems={sidebarItems.map(item => ({
        ...item,
        active: item.path === '/doctor/dashboard'
      }))}
      userRole="doctor"
      userName="Dr. Samuel Kimani"
      userEmail="s.kimani@hospital.co.ke"
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Doctor Dashboard</h1>
            <p className="text-muted-foreground">Manage prescriptions and monitor blockchain verification</p>
          </div>
          <Link to="/doctor/create-prescription">
            <Button className="btn-gradient-primary">
              <Plus className="mr-2 w-5 h-5" />
              New Prescription
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
                    <div className="flex items-center space-x-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-success" />
                      <span className="text-xs text-success">{stat.change}</span>
                    </div>
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
          {/* Recent Prescriptions */}
          <div className="lg:col-span-2">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Recent Prescriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">{prescription.id}</span>
                          {prescription.urgency === 'urgent' && (
                            <Badge variant="destructive" className="text-xs">Urgent</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Patient: {prescription.patient}</p>
                        <p className="text-sm font-medium">{prescription.drug}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={prescription.status === 'Active' ? 'default' : 'secondary'}
                          className={prescription.status === 'Active' ? 'bg-warning text-warning-foreground' : ''}
                        >
                          {prescription.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{prescription.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link to="/doctor/prescriptions">
                    <Button variant="outline" className="w-full">View All Prescriptions</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/doctor/create-prescription">
                  <Button className="w-full btn-gradient-primary">
                    <FileText className="mr-2 w-4 h-4" />
                    Create Prescription
                  </Button>
                </Link>
                <Link to="/doctor/blockchain-verification">
                  <Button variant="outline" className="w-full">
                    <Shield className="mr-2 w-4 h-4" />
                    Verify on Blockchain
                  </Button>
                </Link>
                <Link to="/doctor/activity-logs">
                  <Button variant="outline" className="w-full">
                    <Activity className="mr-2 w-4 h-4" />
                    View Activity Logs
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-warning/10">
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Blockchain Sync</p>
                      <p className="text-xs text-muted-foreground">3 prescriptions pending blockchain confirmation</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-success/10">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">System Status</p>
                      <p className="text-xs text-muted-foreground">All systems operational</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;