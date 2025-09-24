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
  CheckCircle,
  AlertTriangle,
  Zap,
  Hash,
  Calendar
} from 'lucide-react';

const BlockchainVerification = () => {
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/doctor/dashboard', active: false },
    { icon: FileText, label: 'Create Prescription', path: '/doctor/create-prescription', active: false },
    { icon: Clock, label: 'My Prescriptions', path: '/doctor/prescriptions', active: false },
    { icon: Shield, label: 'Blockchain Verification', path: '/doctor/blockchain-verification', active: true },
    { icon: Activity, label: 'Activity Logs', path: '/doctor/activity-logs', active: false },
  ];

  const verificationData = [
    {
      id: 'RX-2024-001',
      patient: 'Maria Wanjiku',
      drug: 'Amoxicillin 500mg',
      blockHash: '0x742d35cc6ba256c3f0b21b...',
      timestamp: '2024-01-15 14:32:15',
      confirmations: 127,
      status: 'verified',
      gasUsed: '45,230'
    },
    {
      id: 'RX-2024-002',
      patient: 'John Kimani',
      drug: 'Metformin 850mg',
      blockHash: '0x9a8f21dc9b345a7e2c8d1f...',
      timestamp: '2024-01-14 11:28:42',
      confirmations: 89,
      status: 'pending',
      gasUsed: '43,890'
    },
    {
      id: 'RX-2024-003',
      patient: 'Grace Nyong\'o',
      drug: 'Lisinopril 10mg',
      blockHash: '0x1f5e3d9c8a742b6e4f9a2c...',
      timestamp: '2024-01-13 16:45:33',
      confirmations: 203,
      status: 'verified',
      gasUsed: '44,670'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pending': return <Clock className="w-4 h-4 text-warning" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'failed': return 'bg-destructive text-destructive-foreground';
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
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Blockchain Verification</h1>
          <p className="text-muted-foreground">Monitor prescription blockchain status and verification</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Verified</p>
                  <p className="text-2xl font-bold">2,847</p>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">23</p>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gas Used Today</p>
                  <p className="text-2xl font-bold">1.2M</p>
                </div>
                <Zap className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">99.2%</p>
                </div>
                <Shield className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Search Prescription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Search by prescription ID or transaction hash..."
                    className="pl-10 focus:ring-primary"
                  />
                </div>
              </div>
              <Button className="btn-gradient-primary">
                <Shield className="mr-2 w-4 h-4" />
                Verify
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Recent Blockchain Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {verificationData.map((item) => (
                <div key={item.id} className="p-6 rounded-lg border bg-muted/30">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">{item.id}</span>
                        {getStatusIcon(item.status)}
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <p><span className="font-medium">Patient:</span> {item.patient}</p>
                        <p><span className="font-medium">Drug:</span> {item.drug}</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <Hash className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono bg-muted/50 px-2 py-1 rounded">{item.blockHash}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{item.timestamp}</span>
                          </span>
                          <span>{item.confirmations} confirmations</span>
                          <span>Gas: {item.gasUsed}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm">
                        View on Explorer
                      </Button>
                      <Button variant="outline" size="sm">
                        Re-verify
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Button variant="outline">Load More Transactions</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BlockchainVerification;