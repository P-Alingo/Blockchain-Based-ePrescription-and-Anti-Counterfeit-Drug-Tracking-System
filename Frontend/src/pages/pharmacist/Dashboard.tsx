import DashboardLayout from '@/components/layout/DashboardLayout';
import { Scan, Shield, Package, Activity, TrendingUp, AlertTriangle, CheckCircle, Clock, PillBottle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PharmacistDashboard = () => {
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/pharmacist/dashboard', active: true },
    { icon: Scan, label: 'Scan Prescription', path: '/pharmacist/scan', active: false },
    { icon: Shield, label: 'Verify Prescription', path: '/pharmacist/verify', active: false },
    { icon: PillBottle, label: 'Dispense Drug', path: '/pharmacist/dispense', active: false },
    { icon: Package, label: 'Inventory', path: '/pharmacist/inventory', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/pharmacist/activity-logs', active: false },
  ];

  const recentPrescriptions = [
    { id: 'RX001', patient: 'Sarah Johnson', medication: 'Amoxicillin 500mg', status: 'verified', time: '2 hours ago' },
    { id: 'RX002', patient: 'Michael Davis', medication: 'Lisinopril 10mg', status: 'pending', time: '30 minutes ago' },
    { id: 'RX003', patient: 'Emma Wilson', medication: 'Metformin 850mg', status: 'dispensed', time: '1 hour ago' },
  ];

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Pharmacist Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor prescriptions, verify authenticity, and manage inventory</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Prescriptions</CardTitle>
              <Scan className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">47</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Prescriptions</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">43</div>
              <p className="text-xs text-green-600 dark:text-green-400">91% verification rate</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">8</div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">4</div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Awaiting verification</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Prescriptions</CardTitle>
              <CardDescription>Latest prescription activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentPrescriptions.map((prescription) => (
                <div key={prescription.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{prescription.patient}</p>
                    <p className="text-xs text-muted-foreground">{prescription.medication}</p>
                    <p className="text-xs text-muted-foreground">{prescription.time}</p>
                  </div>
                  <Badge
                    variant={
                      prescription.status === 'verified' ? 'default' :
                      prescription.status === 'dispensed' ? 'secondary' : 'outline'
                    }
                  >
                    {prescription.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>Current stock levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Paracetamol 500mg</span>
                  <span>85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Amoxicillin 250mg</span>
                  <span>62%</span>
                </div>
                <Progress value={62} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ibuprofen 400mg</span>
                  <span className="text-orange-600">15%</span>
                </div>
                <Progress value={15} className="h-2 bg-orange-100" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ciprofloxacin 500mg</span>
                  <span className="text-red-600">8%</span>
                </div>
                <Progress value={8} className="h-2 bg-red-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common pharmacy operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Scan className="h-6 w-6" />
                Scan QR Code
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Shield className="h-6 w-6" />
                Verify Prescription
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Package className="h-6 w-6" />
                Check Inventory
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Activity className="h-6 w-6" />
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PharmacistDashboard;