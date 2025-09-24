import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  Shield,
  Activity,
  QrCode,
  Plus,
  Search
} from 'lucide-react';

const CreatePrescription = () => {
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/doctor/dashboard', active: false },
    { icon: FileText, label: 'Create Prescription', path: '/doctor/create-prescription', active: true },
    { icon: Clock, label: 'My Prescriptions', path: '/doctor/prescriptions', active: false },
    { icon: Shield, label: 'Blockchain Verification', path: '/doctor/blockchain-verification', active: false },
    { icon: Activity, label: 'Activity Logs', path: '/doctor/activity-logs', active: false },
  ];

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      userRole="doctor"
      userName="Dr. Samuel Kimani"
      userEmail="s.kimani@hospital.co.ke"
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Create New Prescription</h1>
          <p className="text-muted-foreground">Create a secure, blockchain-verified prescription</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="patientId">Patient ID or Search</Label>
                    <Input 
                      id="patientId" 
                      placeholder="Enter patient ID or name"
                      className="focus:ring-primary"
                    />
                  </div>
                  <Button variant="outline" className="mt-6">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientName">Full Name</Label>
                    <Input 
                      id="patientName" 
                      placeholder="Patient full name"
                      className="focus:ring-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientAge">Age</Label>
                    <Input 
                      id="patientAge" 
                      type="number"
                      placeholder="Age"
                      className="focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientPhone">Phone Number</Label>
                    <Input 
                      id="patientPhone" 
                      placeholder="+254 700 000 000"
                      className="focus:ring-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientGender">Gender</Label>
                    <Select>
                      <SelectTrigger className="focus:ring-primary">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Prescription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="drugName">Drug Name</Label>
                  <Select>
                    <SelectTrigger className="focus:ring-primary">
                      <SelectValue placeholder="Search and select drug" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amoxicillin">Amoxicillin 500mg</SelectItem>
                      <SelectItem value="metformin">Metformin 850mg</SelectItem>
                      <SelectItem value="lisinopril">Lisinopril 10mg</SelectItem>
                      <SelectItem value="atorvastatin">Atorvastatin 20mg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input 
                      id="dosage" 
                      placeholder="e.g., 500mg"
                      className="focus:ring-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select>
                      <SelectTrigger className="focus:ring-primary">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Once daily</SelectItem>
                        <SelectItem value="twice">Twice daily</SelectItem>
                        <SelectItem value="thrice">Three times daily</SelectItem>
                        <SelectItem value="four">Four times daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (Days)</Label>
                    <Input 
                      id="duration" 
                      type="number"
                      placeholder="e.g., 7"
                      className="focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="instructions">Special Instructions</Label>
                  <Textarea 
                    id="instructions"
                    placeholder="Take with food, avoid alcohol, etc."
                    className="focus:ring-primary"
                    rows={3}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input 
                      id="issueDate" 
                      type="date"
                      className="focus:ring-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input 
                      id="validUntil" 
                      type="date"
                      className="focus:ring-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Prescription Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                  <p className="text-sm font-medium">Patient: <span className="text-muted-foreground">Not selected</span></p>
                  <p className="text-sm font-medium">Drug: <span className="text-muted-foreground">Not selected</span></p>
                  <p className="text-sm font-medium">Dosage: <span className="text-muted-foreground">-</span></p>
                  <p className="text-sm font-medium">Duration: <span className="text-muted-foreground">-</span></p>
                </div>
                <div className="space-y-3">
                  <Button className="w-full btn-gradient-primary" disabled>
                    <QrCode className="mr-2 w-4 h-4" />
                    Generate Prescription
                  </Button>
                  <Button variant="outline" className="w-full">
                    Save as Draft
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Blockchain Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Blockchain Protection</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  This prescription will be secured on the blockchain with an immutable timestamp and verification hash.
                </p>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Anti-Counterfeit Protected
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatePrescription;