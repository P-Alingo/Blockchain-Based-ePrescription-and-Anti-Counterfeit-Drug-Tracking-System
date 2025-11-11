
import { Settings, Users, Cog, FileText, Activity, Shield } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useState, useEffect } from 'react';

const sidebarItems = [
  { icon: Settings, label: 'Dashboard', path: '/admin/dashboard', active: false },
  { icon: Users, label: 'User Management', path: '/admin/users', active: false },
  { icon: Cog, label: 'System Logs', path: '/admin/system-logs', active: true },
  { icon: FileText, label: 'Blockchain', path: '/admin/blockchain', active: false },
  { icon: Activity, label: 'Analytics', path: '/admin/analytics', active: false },
];

const SystemLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [blockchainLogs, setBlockchainLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ user: '', entity: '', action: '', date: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(data => {
        setAuditLogs(data.recentActivity || []);
        setBlockchainLogs(data.recentBlockchainTx || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch logs');
        setLoading(false);
      });
  }, []);

  // Filter logic
  const filteredAuditLogs = auditLogs.filter(log => {
    return (
      (filter.user === '' || (log.user && log.user.toLowerCase().includes(filter.user.toLowerCase()))) &&
      (filter.entity === '' || (log.entity_type && log.entity_type.toLowerCase().includes(filter.entity.toLowerCase()))) &&
      (filter.action === '' || (log.action_type && log.action_type.toLowerCase().includes(filter.action.toLowerCase()))) &&
      (filter.date === '' || (log.timestamp && log.timestamp.startsWith(filter.date))) &&
      (search === '' ||
        (log.user && log.user.toLowerCase().includes(search.toLowerCase())) ||
        (log.action_type && log.action_type.toLowerCase().includes(search.toLowerCase())) ||
        (log.entity_type && log.entity_type.toLowerCase().includes(search.toLowerCase())) ||
        (log.details && log.details.toLowerCase().includes(search.toLowerCase()))
      )
    );
  });

  const filteredBlockchainLogs = blockchainLogs.filter(log => {
    return (
      (search === '' ||
        (log.eventname && log.eventname.toLowerCase().includes(search.toLowerCase())) ||
        (log.contractname && log.contractname.toLowerCase().includes(search.toLowerCase())) ||
        (log.transactionhash && log.transactionhash.toLowerCase().includes(search.toLowerCase()))
      )
    );
  });

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="admin" userName="System Admin" userEmail="admin@eprescribe.go.ke">
      <div className="min-h-screen bg-background p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">System Logs</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Forensic and compliance tool: audit trails & blockchain event logs for transparency and traceability
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <Card className="healthcare-card">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search by user, entity, action, or details..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="md:w-1/3"
              />
              <Input
                placeholder="Filter by user..."
                value={filter.user}
                onChange={e => setFilter(f => ({ ...f, user: e.target.value }))}
                className="md:w-1/6"
              />
              <Input
                placeholder="Filter by entity..."
                value={filter.entity}
                onChange={e => setFilter(f => ({ ...f, entity: e.target.value }))}
                className="md:w-1/6"
              />
              <Input
                placeholder="Filter by action..."
                value={filter.action}
                onChange={e => setFilter(f => ({ ...f, action: e.target.value }))}
                className="md:w-1/6"
              />
              <Input
                type="date"
                placeholder="Filter by date..."
                value={filter.date}
                onChange={e => setFilter(f => ({ ...f, date: e.target.value }))}
                className="md:w-1/6"
              />
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card className="healthcare-card mt-8">
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>All recorded system actions for compliance and traceability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold">User</th>
                    <th className="px-4 py-3 text-left font-semibold">Role</th>
                    <th className="px-4 py-3 text-left font-semibold">Action Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Entity</th>
                    <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                    <th className="px-4 py-3 text-left font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center">Loading audit logs...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={6} className="p-8 text-center text-red-500">{error}</td></tr>
                  ) : filteredAuditLogs.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center">No audit logs found</td></tr>
                  ) : (
                    filteredAuditLogs.map((log, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">{log.user || '-'}</td>
                        <td className="px-4 py-3">{log.role || '-'}</td>
                        <td className="px-4 py-3">{log.action_type || '-'}</td>
                        <td className="px-4 py-3">{log.entity_type || '-'}</td>
                        <td className="px-4 py-3">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</td>
                        <td className="px-4 py-3">{log.details || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Event Logs */}
        <Card className="healthcare-card mt-8">
          <CardHeader>
            <CardTitle>Blockchain Event Logs</CardTitle>
            <CardDescription>All blockchain events for system transparency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold">Event Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Contract Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Transaction Hash</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center">Loading blockchain logs...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={5} className="p-8 text-center text-red-500">{error}</td></tr>
                  ) : filteredBlockchainLogs.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center">No blockchain logs found</td></tr>
                  ) : (
                    filteredBlockchainLogs.map((log, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">{log.eventname || '-'}</td>
                        <td className="px-4 py-3">{log.contractname || '-'}</td>
                        <td className="px-4 py-3">
                          {log.transactionhash ? (
                            <a href={`https://etherscan.io/tx/${log.transactionhash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{log.transactionhash}</a>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3">{log.status || 'processed'}</td>
                        <td className="px-4 py-3">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SystemLogs;
