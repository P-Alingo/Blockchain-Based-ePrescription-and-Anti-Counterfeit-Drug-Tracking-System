import DashboardLayout from '@/components/layout/DashboardLayout';
import { Scan, Shield, Package, Activity, Camera, Upload, QrCode, PillBottle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const ScanPrescription = () => {
  const sidebarItems = [
  { icon: Shield, label: 'Dashboard', path: '/pharmacist/dashboard', active: false },
    { icon: Scan, label: 'Scan Prescription', path: '/pharmacist/scan', active: true },
    { icon: Shield, label: 'Verify Prescription', path: '/pharmacist/verify', active: false },
    { icon: PillBottle, label: 'Dispense Drug', path: '/pharmacist/dispense', active: false },
    { icon: Package, label: 'Inventory', path: '/pharmacist/inventory', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/pharmacist/activity-logs', active: false },
  ];

  const recentScans = [
    { id: 'RX001', patient: 'Sarah Johnson', doctor: 'Dr. Michael Smith', medication: 'Amoxicillin 500mg', status: 'verified' },
    { id: 'RX002', patient: 'John Doe', doctor: 'Dr. Anna Wilson', medication: 'Paracetamol 500mg', status: 'pending' },
    { id: 'RX003', patient: 'Mary Brown', doctor: 'Dr. Peter Davis', medication: 'Ibuprofen 400mg', status: 'dispensed' },
  ];

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="pharmacist" userName="John Pharmacist" userEmail="john@pharmacy.co.ke">
      <div className="space-y-8">
        <div>
         <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Scan Prescription
          </h1>
          <p className="text-muted-foreground">Scan and verify electronic prescriptions using QR codes or manual entry</p>
        </div>

        {/* Scanning Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code Scanner
              </CardTitle>
              <CardDescription>Scan prescription QR code for instant verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                <div className="text-center space-y-4">
                  <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Position QR code in camera view</p>
                    <p className="text-xs text-muted-foreground">Camera will automatically detect and scan the code</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Button className="w-full" size="lg">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload">Upload QR Code Image</Label>
                  <div className="flex gap-2">
                    <Input id="file-upload" type="file" accept="image/*" className="flex-1" />
                    <Button variant="outline">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
              <CardDescription>Enter prescription details manually if QR code is unavailable</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prescription-id">Prescription ID</Label>
                <Input id="prescription-id" placeholder="Enter prescription ID" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="patient-id">Patient ID</Label>
                <Input id="patient-id" placeholder="Enter patient identification" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="doctor-license">Doctor License Number</Label>
                <Input id="doctor-license" placeholder="Enter doctor license number" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input id="verification-code" placeholder="Enter verification code" />
              </div>
              
              <Button className="w-full" variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                Verify Prescription
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <CardDescription>Recently scanned and verified prescriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{scan.id}</p>
                      <Badge
                        variant={
                          scan.status === 'verified' ? 'default' :
                          scan.status === 'dispensed' ? 'secondary' : 'outline'
                        }
                      >
                        {scan.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Patient: {scan.patient}</p>
                    <p className="text-sm text-muted-foreground">Doctor: {scan.doctor}</p>
                    <p className="text-sm text-muted-foreground">Medication: {scan.medication}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {scan.status === 'verified' && (
                      <Button size="sm">
                        Dispense
                      </Button>
                    )}
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

export default ScanPrescription;