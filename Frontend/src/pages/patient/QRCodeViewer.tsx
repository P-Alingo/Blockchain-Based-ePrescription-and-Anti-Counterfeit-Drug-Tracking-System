import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  QrCode, 
  Bell,
  Activity,
  Download,
  Share2,
  Maximize2,
  Smartphone,
  Shield,
  AlertCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const QRCodeViewer = () => {
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/patient/dashboard', active: false },
    { icon: FileText, label: 'My Prescriptions', path: '/patient/prescriptions', active: false },
    { icon: QrCode, label: 'QR Code Viewer', path: '/patient/qr-viewer', active: true },
    { icon: Bell, label: 'My Alerts', path: '/patient/alerts', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/patient/activity-logs', active: false },
  ];

  const activePrescriptions = [
    {
      id: 'RX-2024-001',
      doctor: 'Dr. Samuel Kimani',
      drug: 'Amoxicillin 500mg',
      dosage: '1 tablet, 3x daily',
      expires: '2024-01-22',
      daysLeft: 5,
      qrCode: 'QR001',
      status: 'Active'
    },
    {
      id: 'RX-2024-003',
      doctor: 'Dr. Grace Wanjiku',
      drug: 'Lisinopril 10mg',
      dosage: '1 tablet, once daily',
      expires: '2024-02-12',
      daysLeft: 28,
      qrCode: 'QR003',
      status: 'Active'
    },
    {
      id: 'RX-2024-005',
      doctor: 'Dr. Peter Mwangi',
      drug: 'Metformin 850mg',
      dosage: '1 tablet, 2x daily',
      expires: '2024-02-09',
      daysLeft: 25,
      qrCode: 'QR005',
      status: 'Active'
    }
  ];

  const selectedPrescription = activePrescriptions[0]; // Default selection

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
           <h1 className="text-3xl font-bold text-green-600">QR Code Viewer</h1>
            <p className="text-muted-foreground">Show prescription QR codes for pharmacy scanning</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* QR Code Display */}
          <div className="lg:col-span-2">
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Prescription QR Code</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  {/* QR Code Placeholder */}
                  <div className="mx-auto w-80 h-80 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <QrCode className="w-24 h-24 mx-auto text-primary/50" />
                      <div className="space-y-2">
                        <p className="font-semibold text-lg">{selectedPrescription.id}</p>
                        <p className="text-sm text-muted-foreground">QR Code for Pharmacy Scanning</p>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          Blockchain Verified
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Prescription Details */}
                  <div className="p-6 rounded-lg bg-muted/30 text-left space-y-3">
                    <h3 className="font-semibold text-lg mb-4">Prescription Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><span className="font-medium">Drug:</span> {selectedPrescription.drug}</p>
                        <p><span className="font-medium">Doctor:</span> {selectedPrescription.doctor}</p>
                        <p><span className="font-medium">Dosage:</span> {selectedPrescription.dosage}</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Prescription ID:</span> {selectedPrescription.id}</p>
                        <p><span className="font-medium">Expires:</span> {selectedPrescription.expires}</p>
                        <p><span className="font-medium">Days Left:</span> {selectedPrescription.daysLeft}</p>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="p-4 rounded-lg bg-primary/10 text-left">
                    <div className="flex items-start space-x-3">
                      <Smartphone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-primary mb-1">How to use this QR Code:</p>
                        <ul className="text-muted-foreground space-y-1">
                          <li>1. Show this QR code to your pharmacist</li>
                          <li>2. Pharmacist will scan to verify prescription authenticity</li>
                          <li>3. Wait for blockchain verification confirmation</li>
                          <li>4. Receive your medication once verified</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prescription Selector */}
          <div className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Select Prescription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Select defaultValue={selectedPrescription.id}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose prescription to display" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePrescriptions.map((prescription) => (
                        <SelectItem key={prescription.id} value={prescription.id}>
                          <div className="text-left">
                            <div className="font-medium">{prescription.drug}</div>
                            <div className="text-xs text-muted-foreground">{prescription.id}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activePrescriptions.map((prescription) => (
                  <div 
                    key={prescription.id} 
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      prescription.id === selectedPrescription.id 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{prescription.drug}</span>
                        <Badge 
                          variant={prescription.daysLeft > 7 ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {prescription.daysLeft}d left
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{prescription.id}</p>
                      <p className="text-xs text-muted-foreground">by {prescription.doctor}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <span>Security Notice</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0"></div>
                  <p>Your QR codes are protected by blockchain technology</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0"></div>
                  <p>Each scan is logged and verified in real-time</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0"></div>
                  <p>Only show QR codes to authorized pharmacists</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                  <p>Report any suspicious scanning attempts</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full btn-gradient-primary">
                  <Maximize2 className="mr-2 w-4 h-4" />
                  Fullscreen View
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 w-4 h-4" />
                  Save as Image
                </Button>
                <Button variant="outline" className="w-full">
                  <Share2 className="mr-2 w-4 h-4" />
                  Share QR Code
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QRCodeViewer;