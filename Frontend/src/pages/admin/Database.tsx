import { Settings, Users, Cog, Database, FileText, Activity } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const sidebarItems = [
  { icon: Settings, label: 'Dashboard', path: '/admin/dashboard', active: false },
  { icon: Users, label: 'User Management', path: '/admin/users', active: false },
  { icon: Cog, label: 'Reports', path: '/admin/reports', active: false },
  { icon: Database, label: 'Database', path: '/admin/database', active: true },
  { icon: FileText, label: 'Blockchain', path: '/admin/blockchain', active: false },
  { icon: Activity, label: 'Analytics', path: '/admin/analytics', active: false },
];

import { useState, useEffect } from 'react';

const AdminDatabase = () => {
  const [databaseStats, setDatabaseStats] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDatabaseData = async () => {
      setLoading(true);
      try {
        // Fetch database stats
        const statsRes = await fetch('/api/admin/database-stats');
        const statsData = await statsRes.json();
        setDatabaseStats(statsData);

        // Fetch table rows
        const tablesRes = await fetch('/api/admin/database-tables');
        const tablesData = await tablesRes.json();
        setTableRows(tablesData);
      } catch (err) {
        setError('Failed to fetch database data');
      } finally {
        setLoading(false);
      }
    };
    fetchDatabaseData();
  }, []);

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="admin" userName="System Admin" userEmail="admin@eprescribe.go.ke">
      <div className="min-h-screen bg-background p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 dark:from-blue-100 dark:to-blue-300 bg-clip-text text-transparent">Database Overview</h1>
            <p className="text-lg text-muted-foreground mt-2">
              View and manage system database tables, records, and backups
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Cog className="w-4 h-4" />
              Database Settings
            </Button>
            <Button className="medical-button gap-2">
              <FileText className="w-4 h-4" />
              Backup Now
            </Button>
          </div>
        </div>

        {/* Database Stats */}
        <div className="medical-grid">
          {loading ? (
            <div className="p-8 text-center">Loading database stats...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : databaseStats.length === 0 ? (
            <div className="p-8 text-center">No database stats found</div>
          ) : (
            databaseStats.map((stat, index) => (
              <Card key={index} className="dashboard-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full">
                      {stat.icon && typeof stat.icon === 'string' ? (
                        <span className={`w-8 h-8 ${stat.color}`}>{stat.icon}</span>
                      ) : (
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Table List */}
        <Card className="healthcare-card mt-8">
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
            <CardDescription>List of all tables in the system database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold">Table Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Records</th>
                    <th className="px-4 py-3 text-left font-semibold">Last Updated</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="p-8 text-center">Loading tables...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={4} className="p-8 text-center text-red-500">{error}</td></tr>
                  ) : tableRows.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center">No tables found</td></tr>
                  ) : (
                    tableRows.map((row) => (
                      <tr key={row.name}>
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3">{row.records}</td>
                        <td className="px-4 py-3">{row.lastUpdated}</td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="destructive" className="ml-2">Delete</Button>
                        </td>
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

export default AdminDatabase;
