
import { Settings, Users, Cog, FileText, Activity, Shield } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const sidebarItems = [
  { icon: Settings, label: 'Dashboard', path: '/admin/dashboard', active: false },
  { icon: Users, label: 'User Management', path: '/admin/users', active: false },
  { icon: Cog, label: 'System Logs', path: '/admin/system-logs', active: true },
  { icon: FileText, label: 'Blockchain', path: '/admin/blockchain', active: false },
  { icon: Activity, label: 'Analytics', path: '/admin/analytics', active: false },
];

const SystemLogs = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'database'>('logs');
  // Modal state for details
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetails, setModalDetails] = useState<React.ReactNode>(null);
  const [modalType, setModalType] = useState('');
  const [modalEntity, setModalEntity] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [latestLogs, setLatestLogs] = useState([]);
  const [blockchainLogs, setBlockchainLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ user: '', entity: '', action: '', date: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Database tab state
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState({ columns: [], rows: [], primaryKey: 'id' });
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState(null);
  // Row management modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addRow, setAddRow] = useState({});
  const [deleteRowId, setDeleteRowId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const API_BASE = 'http://localhost:4000';
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    // Fetch latest 10 logs by default
    fetch(`${API_BASE}/api/admin/audit-logs/search?limit=10`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch logs');
        return res.json();
      })
      .then((logs) => {
        setLatestLogs(logs || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    // Fetch blockchain logs and table list
    fetch(`${API_BASE}/api/admin/analytics`, { headers })
      .then((res) => res.json())
      .then((data) => {
        setBlockchainLogs(data.recentBlockchainTx || []);
      });
    fetch(`${API_BASE}/api/admin/database/list`, { headers })
      .then((res) => res.json())
      .then((data) => setTables(data.tables || []))
      .catch(() => setTables([]));
  }, []);

  // Fetch table data when selectedTable changes
  useEffect(() => {
    if (!selectedTable) return;
    setDbLoading(true);
    setDbError(null);
    const API_BASE = 'http://localhost:4000';
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_BASE}/api/admin/database/${selectedTable}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        setTableData({
          columns: data.columns || [],
          rows: data.rows || [],
          primaryKey: data.primaryKey || 'id'
        });
        setDbLoading(false);
      })
      .catch((err) => {
        setDbError('Failed to fetch table data');
        setDbLoading(false);
      });
  }, [selectedTable]);

  // Fetch filtered logs from backend when search/filter changes
  const [filteredAuditLogs, setFilteredAuditLogs] = useState([]);
  useEffect(() => {
    const API_BASE = 'http://localhost:4000';
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const hasActiveFilter = filter.user || filter.entity || filter.action || filter.date || search;
    if (hasActiveFilter) {
      setLoading(true);
      // Build query string only for non-empty filters
      const params = new URLSearchParams();
      if (filter.user) params.append('user', filter.user);
      if (filter.action) params.append('action_type', filter.action);
      if (filter.entity) params.append('entity_type', filter.entity);
      if (filter.date) params.append('date', filter.date);
      if (search) params.append('user', search);
      fetch(`${API_BASE}/api/admin/audit-logs/search?${params.toString()}`, { headers })
        .then((res) => res.json())
        .then((logs) => {
          setFilteredAuditLogs(logs || []);
          setLoading(false);
        })
        .catch(() => {
          setFilteredAuditLogs([]);
          setLoading(false);
        });
    } else {
      // Show latest 10 logs by default
      setFilteredAuditLogs(latestLogs.slice(0, 10));
    }
  }, [filter.user, filter.entity, filter.action, filter.date, search, latestLogs]);

  const [searchBlockchain, setSearchBlockchain] = useState('');
  const [filterBlockchainDate, setFilterBlockchainDate] = useState('');
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
              Forensic and compliance tool: audit trails, blockchain event logs, and database management for transparency and traceability
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6">
          <Button variant={activeTab === 'logs' ? 'default' : 'ghost'} onClick={() => setActiveTab('logs')}>Logs</Button>
          <Button variant={activeTab === 'database' ? 'default' : 'ghost'} onClick={() => setActiveTab('database')}>Database</Button>
        </div>

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <>
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
                <CardDescription>Latest 10 logs from all system actions for compliance and traceability</CardDescription>
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
                        filteredAuditLogs.map((log, idx) => {
                          // Color badge for action type
                          let actionColor = 'bg-gray-200 text-gray-800';
                          if (log.action_type === 'INSERT') actionColor = 'bg-green-100 text-green-700';
                          else if (log.action_type === 'UPDATE') actionColor = 'bg-blue-100 text-blue-700';
                          else if (log.action_type === 'DELETE') actionColor = 'bg-red-100 text-red-700';
                          // Parse details
                          let detailsContent = log.details;
                          let isJson = false;
                          try {
                            detailsContent = JSON.parse(log.details);
                            isJson = true;
                          } catch {}
                          // User and role
                          const userDisplay = log.user || log.full_name || 'System';
                          const roleDisplay = log.role || log.user_role || 'System';
                          // Friendly details rendering (for modal)
                          let modalDetailsNode;
                          if (isJson && log.action_type === 'INSERT') {
                            modalDetailsNode = (
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(detailsContent).map(([key, value]) => (
                                  <div key={key} className="text-sm"><span className="font-semibold text-gray-700">{key}:</span> <span className="text-gray-900">{String(value)}</span></div>
                                ))}
                              </div>
                            );
                          } else if (isJson && log.action_type === 'UPDATE') {
                            modalDetailsNode = (
                              <div className="flex gap-6">
                                <div>
                                  <div className="font-semibold text-blue-700 mb-1 text-sm">Old</div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(detailsContent.old || {}).map(([key, value]) => (
                                      <div key={key} className="text-sm"><span className="font-semibold text-gray-700">{key}:</span> <span className="text-gray-900">{String(value)}</span></div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-semibold text-green-700 mb-1 text-sm">New</div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(detailsContent.new || {}).map(([key, value]) => (
                                      <div key={key} className="text-sm"><span className="font-semibold text-gray-700">{key}:</span> <span className="text-gray-900">{String(value)}</span></div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          } else if (isJson) {
                            modalDetailsNode = (
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(detailsContent).map(([key, value]) => (
                                  <div key={key} className="text-sm"><span className="font-semibold text-gray-700">{key}:</span> <span className="text-gray-900">{String(value)}</span></div>
                                ))}
                              </div>
                            );
                          } else {
                            modalDetailsNode = <span>{log.details || '-'}</span>;
                          }
                          return (
                            <tr key={idx} className="hover:bg-blue-50 transition">
                              <td className="px-4 py-3">{userDisplay}</td>
                              <td className="px-4 py-3">{roleDisplay}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${actionColor}`}>{log.action_type || '-'}</span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-blue-700">{log.entity_type || '-'}</td>
                              <td className="px-4 py-3">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</td>
                              <td className="px-4 py-3">
                                <button
                                  className="text-blue-600 underline cursor-pointer text-xs px-2 py-1 rounded hover:bg-blue-100"
                                  onClick={() => {
                                    setModalOpen(true);
                                    setModalDetails(modalDetailsNode);
                                    setModalType(log.action_type);
                                    setModalEntity(log.entity_type);
                                  }}
                                >View Details</button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                  {/* Details Modal */}
                  <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="mb-2">Audit Log Details</DialogTitle>
                        <DialogDescription>
                          <div className="mb-2"><span className="font-semibold">Entity:</span> <span className="text-blue-700">{modalEntity}</span></div>
                          <div className="mb-2"><span className="font-semibold">Action Type:</span> <span>{modalType}</span></div>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-2">
                        {modalDetails}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
              {/* Blockchain Event Logs */}
              {/* Blockchain Event Logs Search & Filter */}
              <Card className="healthcare-card mt-8">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <Input
                      placeholder="Search blockchain events..."
                      value={searchBlockchain}
                      onChange={e => setSearchBlockchain(e.target.value)}
                      className="md:w-1/3"
                    />
                    <Input
                      type="date"
                      placeholder="Filter by date..."
                      value={filterBlockchainDate}
                      onChange={e => setFilterBlockchainDate(e.target.value)}
                      className="md:w-1/6"
                    />
                  </div>
                </CardContent>
                <CardHeader>
                  <CardTitle>Blockchain Event Logs</CardTitle>
                  <CardDescription>All blockchain events for system transparency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full rounded-xl overflow-hidden border border-gray-200 shadow-lg text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-pink-200 to-red-200 text-gray-700">
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
                          filteredBlockchainLogs
                            .filter(log => {
                              // Filter by searchBlockchain and filterBlockchainDate
                              const matchesSearch = searchBlockchain === '' ||
                                (log.eventname && log.eventname.toLowerCase().includes(searchBlockchain.toLowerCase())) ||
                                (log.contractname && log.contractname.toLowerCase().includes(searchBlockchain.toLowerCase())) ||
                                (log.transactionhash && log.transactionhash.toLowerCase().includes(searchBlockchain.toLowerCase()));
                              const matchesDate = filterBlockchainDate === '' ||
                                (log.timestamp && log.timestamp.startsWith(filterBlockchainDate));
                              return matchesSearch && matchesDate;
                            })
                            .map((log, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-pink-50" + " hover:bg-pink-100 transition-colors duration-150"}>
                                <td className="px-4 py-3 rounded-l-xl">{log.eventname || '-'}</td>
                                <td className="px-4 py-3">{log.contractname || '-'}</td>
                                <td className="px-4 py-3 font-mono text-xs">
                                  {log.transactionhash ? (
                                    <a href={`https://etherscan.io/tx/${log.transactionhash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{log.transactionhash}</a>
                                  ) : '-'}
                                </td>
                                <td className="px-4 py-3">{log.status || 'processed'}</td>
                                <td className="px-4 py-3 rounded-r-xl">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </Card>
          </>
        )}

        {/* Database Tab (Reverted to previous working logic) */}
        {activeTab === 'database' && (
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>Select a table to view and manage data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table} value={table}>{table}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button disabled={!selectedTable} onClick={() => setSelectedTable('')}>Clear</Button>
              </div>
              {dbLoading ? (
                <div className="py-8 text-center">Loading table data...</div>
              ) : dbError ? (
                <div className="py-8 text-center text-red-500">{dbError}</div>
              ) : selectedTable && tableData.columns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead>
                      <tr className="bg-muted">
                        {tableData.columns.map((col) => (
                          <th key={col} className="px-4 py-2 text-left font-semibold">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(tableData.rows || [])
                        .filter(row => row && typeof row === 'object')
                        .map((row, idx) => (
                          <tr key={idx} className="border-b">
                            {tableData.columns.map((col) => (
                              <td key={col} className="px-4 py-2">{row && row[col] !== undefined && row[col] !== null ? row[col] : ''}</td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center">Select a table to view data.</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default SystemLogs;
