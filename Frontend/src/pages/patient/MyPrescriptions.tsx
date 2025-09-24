import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  QrCode, 
  Bell,
  Activity,
  Search,
  Calendar,
  Download,
  Eye,
  Shield,
  Pill
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MyPrescriptions = () => {
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/patient/dashboard', active: false },
    { icon: FileText, label: 'My Prescriptions', path: '/patient/prescriptions', active: true },
    { icon: QrCode, label: 'QR Code Viewer', path: '/patient/qr-viewer', active: false },
    { icon: Bell, label: 'My Alerts', path: '/patient/alerts', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/patient/activity-logs', active: false },
  ];

  const activePrescriptions = [
    {
      id: 'RX-2024-001',
      doctor: 'Dr. Samuel Kimani',
      hospital: 'Kenyatta National Hospital',
      drug: 'Amoxicillin 500mg',
      dosage: '1 tablet, 3 times daily',
      duration: '7 days',
      issued: '2024-01-15',
      expires: '2024-01-22',
      daysLeft: 5,
      taken: 4,
      total: 21
    },
    {
      id: 'RX-2024-003',
      doctor: 'Dr. Grace Wanjiku',
      hospital: 'Aga Khan University Hospital',
      drug: 'Lisinopril 10mg',
      dosage: '1 tablet, once daily',
      duration: '30 days',
      issued: '2024-01-13',
      expires: '2024-02-12',
      daysLeft: 28,
      taken: 3,
      total: 30
    },
    {
      id: 'RX-2024-005',
      doctor: 'Dr. Peter Mwangi',
      hospital: 'Nairobi Hospital',
      drug: 'Metformin 850mg',
      dosage: '1 tablet, 2 times daily',
      duration: '30 days',
      issued: '2024-01-10',
      expires: '2024-02-09',
      daysLeft: 25,
      taken: 12,
      total: 60
    }
  ];

  const completedPrescriptions = [
    {
      id: 'RX-2024-002',
      doctor: 'Dr. John Doe',
      hospital: 'Mater Hospital',
      drug: 'Paracetamol 500mg',
      dosage: '2 tablets, 4 times daily',
      duration: '5 days',
      issued: '2024-01-08',
      completed: '2024-01-13',
      taken: 40,
      total: 40
    }
  ];

  const expiredPrescriptions = [
    {
      id: 'RX-2024-004',
      doctor: 'Dr. Sarah Johnson',
      hospital: 'MP Shah Hospital',
      drug: 'Ibuprofen 400mg',
      dosage: '1 tablet, 3 times daily',
      duration: '10 days',
      issued: '2023-12-20',
      expired: '2023-12-30',
      taken: 15,
      total: 30
    }
  ];

  const getProgressPercentage = (taken: number, total: number) => {
    return Math.round((taken / total) * 100);
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="patient"
      userName="Maria Wanjiku"
      userEmail="maria.w@gmail.com"
    >
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
           <h1 className="text-3xl font-bold text-green-600">My Prescriptions</h1>
            <p className="text-muted-foreground">View and manage all your prescription history</p>
          </div>
          <Button className="btn-gradient-primary">
            <Download className="mr-2 w-4 h-4" />
            Export Summary
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
                    placeholder="Search by prescription ID, drug name, or doctor..."
                    className="pl-10 focus:ring-primary"
                  />
                </div>
              </div>
              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  <SelectItem value="kimani">Dr. Samuel Kimani</SelectItem>
                  <SelectItem value="wanjiku">Dr. Grace Wanjiku</SelectItem>
                  <SelectItem value="mwangi">Dr. Peter Mwangi</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-0">
            <Tabs defaultValue="active" className="w-full">
              <div className="p-6 pb-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active">Active (3)</TabsTrigger>
                  <TabsTrigger value="completed">Completed (1)</TabsTrigger>
                  <TabsTrigger value="expired">Expired (1)</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="active" className="p-6 pt-4">
                <div className="space-y-6">
                  {activePrescriptions.map((prescription) => (
                    <div key={prescription.id} className="p-6 rounded-lg border bg-muted/30">
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-xl font-semibold">{prescription.drug}</h3>
                            <Badge className="bg-warning text-warning-foreground">Active</Badge>
                            <Badge variant="outline" className="text-xs">
                              {prescription.daysLeft} days left
                            </Badge>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-3 mb-4">
                            <div>
                              <p className="text-sm"><span className="font-medium">Prescription ID:</span> {prescription.id}</p>
                              <p className="text-sm"><span className="font-medium">Doctor:</span> {prescription.doctor}</p>
                              <p className="text-sm"><span className="font-medium">Hospital:</span> {prescription.hospital}</p>
                            </div>
                            <div>
                              <p className="text-sm"><span className="font-medium">Dosage:</span> {prescription.dosage}</p>
                              <p className="text-sm"><span className="font-medium">Duration:</span> {prescription.duration}</p>
                              <p className="text-sm"><span className="font-medium">Expires:</span> {prescription.expires}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span>Progress: {prescription.taken}/{prescription.total} doses</span>
                              <span>{getProgressPercentage(prescription.taken, prescription.total)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary rounded-full h-2 transition-all"
                                style={{ width: `${getProgressPercentage(prescription.taken, prescription.total)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[120px]">
                          <Button size="sm" className="btn-gradient-primary">
                            <QrCode className="mr-1 w-3 h-3" />
                            QR Code
                          </Button>
                          <Button variant="outline" size="sm">
                            <Pill className="mr-1 w-3 h-3" />
                            Mark Taken
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 w-3 h-3" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="p-6 pt-4">
                <div className="space-y-6">
                  {completedPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="p-6 rounded-lg border bg-muted/30">
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-xl font-semibold">{prescription.drug}</h3>
                            <Badge className="bg-success text-success-foreground">Completed</Badge>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-3 mb-4">
                            <div>
                              <p className="text-sm"><span className="font-medium">Prescription ID:</span> {prescription.id}</p>
                              <p className="text-sm"><span className="font-medium">Doctor:</span> {prescription.doctor}</p>
                              <p className="text-sm"><span className="font-medium">Hospital:</span> {prescription.hospital}</p>
                            </div>
                            <div>
                              <p className="text-sm"><span className="font-medium">Dosage:</span> {prescription.dosage}</p>
                              <p className="text-sm"><span className="font-medium">Duration:</span> {prescription.duration}</p>
                              <p className="text-sm"><span className="font-medium">Completed:</span> {prescription.completed}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span>Completed: {prescription.taken}/{prescription.total} doses</span>
                              <span>100%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="bg-success rounded-full h-2 w-full"></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[120px]">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 w-3 h-3" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="mr-1 w-3 h-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="expired" className="p-6 pt-4">
                <div className="space-y-6">
                  {expiredPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="p-6 rounded-lg border bg-muted/30 opacity-75">
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-xl font-semibold">{prescription.drug}</h3>
                            <Badge className="bg-destructive text-destructive-foreground">Expired</Badge>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-3 mb-4">
                            <div>
                              <p className="text-sm"><span className="font-medium">Prescription ID:</span> {prescription.id}</p>
                              <p className="text-sm"><span className="font-medium">Doctor:</span> {prescription.doctor}</p>
                              <p className="text-sm"><span className="font-medium">Hospital:</span> {prescription.hospital}</p>
                            </div>
                            <div>
                              <p className="text-sm"><span className="font-medium">Dosage:</span> {prescription.dosage}</p>
                              <p className="text-sm"><span className="font-medium">Duration:</span> {prescription.duration}</p>
                              <p className="text-sm"><span className="font-medium">Expired:</span> {prescription.expired}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span>Taken: {prescription.taken}/{prescription.total} doses</span>
                              <span>{getProgressPercentage(prescription.taken, prescription.total)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-destructive rounded-full h-2"
                                style={{ width: `${getProgressPercentage(prescription.taken, prescription.total)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[120px]">
                          <Button variant="outline" size="sm" disabled>
                            <Eye className="mr-1 w-3 h-3" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MyPrescriptions;