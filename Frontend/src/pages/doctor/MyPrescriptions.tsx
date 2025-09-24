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
  Filter,
  Download,
  Eye,
  QrCode
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MyPrescriptions = () => {
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/doctor/dashboard', active: false},
    { icon: FileText, label: 'Create Prescription', path: '/doctor/create-prescription', active: false },
    { icon: Clock, label: 'My Prescriptions', path: '/doctor/prescriptions', active: true },
    { icon: Shield, label: 'Blockchain Verification', path: '/doctor/blockchain-verification', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/doctor/activity-logs', active: false },
  ];

  const prescriptions = [
    {
      id: 'RX-2024-001',
      patient: 'Maria Wanjiku',
      age: 45,
      drug: 'Amoxicillin 500mg',
      dosage: '1 tablet, 3x daily',
      duration: '7 days',
      status: 'Active',
      issued: '2024-01-15',
      valid: '2024-01-22',
      dispensed: false
    },
    {
      id: 'RX-2024-002',
      patient: 'John Kimani',
      age: 62,
      drug: 'Metformin 850mg',
      dosage: '1 tablet, 2x daily',
      duration: '30 days',
      status: 'Dispensed',
      issued: '2024-01-14',
      valid: '2024-02-13',
      dispensed: true
    },
    {
      id: 'RX-2024-003',
      patient: 'Grace Nyong\'o',
      age: 38,
      drug: 'Lisinopril 10mg',
      dosage: '1 tablet, once daily',
      duration: '30 days',
      status: 'Active',
      issued: '2024-01-13',
      valid: '2024-02-12',
      dispensed: false
    },
    {
      id: 'RX-2024-004',
      patient: 'Peter Mwangi',
      age: 55,
      drug: 'Atorvastatin 20mg',
      dosage: '1 tablet, once daily',
      duration: '90 days',
      status: 'Expired',
      issued: '2024-01-12',
      valid: '2024-01-19',
      dispensed: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-warning text-warning-foreground';
      case 'Dispensed': return 'bg-success text-success-foreground';
      case 'Expired': return 'bg-destructive text-destructive-foreground';
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
            <h1 className="text-3xl font-bold text-blue-600">My Prescriptions</h1>
            <p className="text-muted-foreground">Manage and track all your issued prescriptions</p>
          </div>
          <Button className="btn-gradient-primary">
            <Download className="mr-2 w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Search by prescription ID, patient name, or drug..."
                    className="pl-10 focus:ring-primary"
                  />
                </div>
              </div>
              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="dispensed">Dispensed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
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
            <CardTitle>Prescription History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="p-6 rounded-lg border bg-muted/30 hover:shadow-md transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-lg">{prescription.id}</span>
                        <Badge className={getStatusColor(prescription.status)}>
                          {prescription.status}
                        </Badge>
                        {prescription.dispensed && (
                          <Badge variant="outline" className="text-xs">Dispensed</Badge>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <p><span className="font-medium">Patient:</span> {prescription.patient} ({prescription.age}y)</p>
                        <p><span className="font-medium">Drug:</span> {prescription.drug}</p>
                        <p><span className="font-medium">Dosage:</span> {prescription.dosage}</p>
                        <p><span className="font-medium">Duration:</span> {prescription.duration}</p>
                      </div>
                      <div className="flex space-x-4 text-xs text-muted-foreground">
                        <span>Issued: {prescription.issued}</span>
                        <span>Valid Until: {prescription.valid}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 w-3 h-3" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <QrCode className="mr-1 w-3 h-3" />
                        QR Code
                      </Button>
                      <Button variant="outline" size="sm">
                        <Shield className="mr-1 w-3 h-3" />
                        Verify
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <span className="text-sm text-muted-foreground">Page 1 of 12</span>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MyPrescriptions;