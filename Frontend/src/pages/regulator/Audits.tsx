import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import clsx from "clsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, Download, Eye, AlertTriangle, CheckCircle, Clock, FileText, Shield, CheckSquare, Activity } from "lucide-react";

const RegulatorAudits = () => {
  // ...existing code...

  // Add header and description for consistent aesthetic
  const auditsHeader = (
    <div className="space-y-2 mb-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
        Regulator Audits
      </h1>
      <p className="text-muted-foreground">
        Review audit logs, monitor compliance actions, and ensure regulatory standards are upheld
      </p>
    </div>
  );
  useEffect(() => {
    setLoadingLog(true);
    const API_BASE = 'http://localhost:4000'; // Change to your backend base URL if needed
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_BASE}/api/regulator/auditlog`, { headers })
      .then(res => res.json())
      .then(data => {
        setAuditLog(data);
        setLoadingLog(false);
      })
      .catch(err => {
        setLogError("Failed to load audit log.");
        setLoadingLog(false);
      });
  }, []);
  // Helper to format details preview for table
  const getDetailsPreview = (log: any) => {
    let parsed = null;
    try {
      parsed = JSON.parse(log.details);
    } catch {
      // If not JSON, show truncated string with tooltip for full view
      return (
        <span title={log.details} className="block max-w-[220px] truncate cursor-pointer bg-muted/40 px-2 py-1 rounded">
          {log.details && log.details.length > 80 ? log.details.slice(0, 80) + '...' : log.details}
        </span>
      );
    }
    // For prescription, shipment, drugbatch, show only first 2-3 summary lines with badges
    if (log.entity_type === "prescription") {
      const patientName = userMap[parsed.patient_id] || parsed.patient_id;
      const doctorName = userMap[parsed.doctor_id] || parsed.doctor_id;
      const drugName = drugMap[parsed.drug_id] || parsed.drug_id;
      return (
        <div className="flex flex-wrap gap-2 items-center bg-muted/40 px-2 py-1 rounded">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">Prescription: {parsed.prescription_code || parsed.id}</span>
          <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-xs font-semibold">Patient: {patientName}</span>
          <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-xs font-semibold">Drug: {drugName}</span>
          <span className="italic text-muted-foreground text-xs">...see more</span>
        </div>
      );
    }
    if (log.entity_type === "shipment") {
      return (
        <div className="flex flex-wrap gap-2 items-center bg-muted/40 px-2 py-1 rounded">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">Shipment: {parsed.shipmentnumber || parsed.id}</span>
          <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-xs font-semibold">Status: {parsed.status}</span>
          <span className="italic text-muted-foreground text-xs">...see more</span>
        </div>
      );
    }
    if (log.entity_type === "drugbatch") {
      const drugName = drugMap[parsed.drugid] || parsed.drugid;
      return (
        <div className="flex flex-wrap gap-2 items-center bg-muted/40 px-2 py-1 rounded">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">Batch: {parsed.batchnumber || parsed.id}</span>
          <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-xs font-semibold">Drug: {drugName}</span>
          <span className="italic text-muted-foreground text-xs">...see more</span>
        </div>
      );
    }
    // For other JSON objects, show only first 2 key-value pairs as badges, rest as ...
    const entries = Object.entries(parsed);
    return (
      <div className="flex flex-wrap gap-2 items-center bg-muted/40 px-2 py-1 rounded">
        {entries.slice(0, 2).map(([key, value]) => (
          <span key={key} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">
            {key}: {String(value).length > 20 ? String(value).slice(0, 20) + '...' : String(value)}
          </span>
        ))}
        {entries.length > 2 && <span className="italic text-muted-foreground text-xs">...see more</span>}
      </div>
    );
  };
  const [userMap, setUserMap] = useState({});
  const [drugMap, setDrugMap] = useState({});
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [loadingLog, setLoadingLog] = useState<boolean>(false);
  const [logError, setLogError] = useState<string | null>(null);

  // Get all unique action types for filter dropdown
  const actionTypes = Array.from(new Set(auditLog.map(log => log.action_type))).sort();

  // Helper to get filtered, searched, and sorted logs
  const getProcessedLogs = (logs: any[]) => {
    let filtered = logs;
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        if (dateFilter === 'today') {
          return logDate.toDateString() === now.toDateString();
        }
        if (dateFilter === 'week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0,0,0,0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23,59,59,999);
          return logDate >= startOfWeek && logDate <= endOfWeek;
        }
        if (dateFilter === 'month') {
          return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
        }
        if (dateFilter === 'year') {
          return logDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action_type === actionFilter);
    }
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        (log.user && log.user.toLowerCase().includes(term)) ||
        (log.entity_id && String(log.entity_id).includes(term)) ||
        (log.entity_type && log.entity_type.toLowerCase().includes(term)) ||
        (log.details && log.details.toLowerCase().includes(term))
      );
    }
    filtered = filtered.slice();
    filtered.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? tb - ta : ta - tb;
    });
    return filtered;
  };
  const sidebarItems = [
    { icon: Shield, label: 'Dashboard', path: '/regulator/dashboard', active: false },
    { icon: Search, label: 'Audits', path: '/regulator/audits', active: true },
    { icon: FileText, label: 'Traceability', path: '/regulator/traceability', active: false },
    { icon: AlertTriangle, label: 'Blockchain', path: '/regulator/blockchain', active: false },
    { icon: Activity, label: 'Analytics', path: '/regulator/analytics', active: false },
  ];
      /* The stray .map((log, idx) => ( ... )) should be removed or replaced with a valid array mapping.
         If this is meant to render table rows, ensure it is inside a valid array mapping context, e.g. auditLog.map(...).
         Below is a corrected example assuming auditLog is the array to be mapped: */
      
    // Removed stray JSX block that was outside of any function or return statement.

        {/* Audit Log Tab */}
        <TabsContent value="auditlog" className="space-y-4">
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>
                All actions recorded in the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLog && (
                <div className="py-8 text-center text-muted-foreground">Loading audit log...</div>
              )}
              {logError && !loadingLog && (
                <div className="py-8 text-center text-destructive">{logError}</div>
              )}
              {!loadingLog && !logError && auditLog.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">No audit log entries found.</div>
              )}
              {!loadingLog && !logError && auditLog.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border rounded-lg">
                      <thead className="sticky top-0 bg-background z-10">
                        <tr className="border-b bg-muted">
                          <th className="px-4 py-2 text-left">ID</th>
                          <th className="px-4 py-2 text-left">User</th>
                          <th className="px-4 py-2 text-left">Action</th>
                          <th className="px-4 py-2 text-left">Entity</th>
                          <th className="px-4 py-2 text-left">Entity ID</th>
                          <th className="px-4 py-2 text-left">Timestamp</th>
                          <th className="px-4 py-2 text-left">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLog
                          .filter(log => actionFilter === "all" || log.action_type === actionFilter)
                          .filter(log =>
                            searchTerm === "" ||
                            (log.user && log.user.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (log.entity_id && String(log.entity_id).includes(searchTerm))
                          )
                          .map((log, idx) => (
                          <tr key={log.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/40"}>
                            <td className="px-4 py-2 font-semibold">{log.id}</td>
                            <td className="px-4 py-2">{log.user ?? <span className="italic text-muted-foreground">System</span>}</td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className="bg-muted text-muted-foreground">
                                {log.action_type}
                              </Badge>
                            </td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className="bg-muted text-muted-foreground">
                                {log.entity_type}
                              </Badge>
                            </td>
                            <td className="px-4 py-2">{log.entity_id}</td>
                            <td className="px-4 py-2">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
                            <td className="px-4 py-2 align-top" style={{maxWidth: '240px', wordBreak: 'break-word'}}>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="w-full text-left p-0 h-auto min-h-0">
                                    <div className="cursor-pointer block w-full text-xs leading-tight text-left truncate" style={{maxWidth: '220px', whiteSpace: 'pre-line'}}>
                                      {getDetailsPreview(log)}
                                    </div>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Audit Details</DialogTitle>
                                  </DialogHeader>
                                  {(() => {
                                    let parsed = null;
                                    try {
                                      parsed = JSON.parse(log.details);
                                    } catch {
                                      return (
                                        <pre className="whitespace-pre-wrap break-words text-xs bg-muted p-4 rounded-lg max-h-[400px] overflow-auto">{log.details}</pre>
                                      );
                                    }
                                    // For prescription, shipment, drugbatch, show formatted summary
                                    if (log.entity_type === "prescription") {
                                      const patientName = userMap[parsed.patient_id] || parsed.patient_id;
                                      const doctorName = userMap[parsed.doctor_id] || parsed.doctor_id;
                                      const drugName = drugMap[parsed.drug_id] || parsed.drug_id;
                                      return (
                                        <div className="text-left space-y-1">
                                          <div><b>Prescription:</b> {parsed.prescription_code || parsed.id}</div>
                                          <div><b>Patient:</b> {patientName}</div>
                                          <div><b>Drug:</b> {drugName}</div>
                                          <div><b>Doctor:</b> {doctorName}</div>
                                          <div><b>Status:</b> {parsed.status}</div>
                                          <div><b>Quantity:</b> {parsed.quantity} {parsed.dosage_unit || ''}</div>
                                        </div>
                                      );
                                    }
                                    if (log.entity_type === "shipment") {
                                      return (
                                        <div className="text-left space-y-1">
                                          <div><b>Shipment:</b> {parsed.shipmentnumber || parsed.id}</div>
                                          <div><b>Status:</b> {parsed.status}</div>
                                        </div>
                                      );
                                    }
                                    if (log.entity_type === "drugbatch") {
                                      const drugName = drugMap[parsed.drugid] || parsed.drugid;
                                      return (
                                        <div className="text-left space-y-1">
                                          <div><b>Batch:</b> {parsed.batchnumber || parsed.id}</div>
                                          <div><b>Drug:</b> {drugName}</div>
                                          <div><b>Qty:</b> {parsed.quantity}</div>
                                        </div>
                                      );
                                    }
                                    // For other JSON, show all key-value pairs, formatted
                                    return (
                                      <div className="text-left space-y-1">
                                        {Object.entries(parsed).map(([key, value]) => (
                                          <div key={key}><b>{key}:</b> {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </DialogContent>
                              </Dialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      
      // All duplicate and stray JSX code removed. Only one return statement below.

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="regulator">
      {auditsHeader}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList>
          <TabsTrigger value="recent">Recent Audits</TabsTrigger>
          <TabsTrigger value="auditlog">Audit Logs</TabsTrigger>
        </TabsList>
        {/* Recent Audits Tab */}
        <TabsContent value="recent" className="space-y-4">
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle>Recent Audits</CardTitle>
              <CardDescription>
                The most recent actions performed by regulators
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Controls: Search, Filter, Sort, Date Range */}
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <Input
                  type="text"
                  placeholder="Search by user, entity, details..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-48"
                />
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actionTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={v => setSortOrder(v as 'asc' | 'desc')}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loadingLog && (
                <div className="py-8 text-center text-muted-foreground">Loading recent audits...</div>
              )}
              {logError && !loadingLog && (
                <div className="py-8 text-center text-destructive">{logError}</div>
              )}
              {!loadingLog && !logError && getProcessedLogs(auditLog).length === 0 && (
                <div className="py-8 text-center text-muted-foreground">No recent audits found.</div>
              )}
              {!loadingLog && !logError && getProcessedLogs(auditLog).length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border rounded-lg">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b bg-muted">
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">User</th>
                        <th className="px-4 py-2 text-left">Action</th>
                        <th className="px-4 py-2 text-left">Entity</th>
                        <th className="px-4 py-2 text-left">Entity ID</th>
                        <th className="px-4 py-2 text-left">Timestamp</th>
                        <th className="px-4 py-2 text-left">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getProcessedLogs(auditLog)
                        .slice(0, 10)
                        .map((log, idx) => (
                          <tr key={log.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/40"}>
                            <td className="px-4 py-2 font-semibold">{log.id}</td>
                            <td className="px-4 py-2">{log.user ?? <span className="italic text-muted-foreground">System</span>}</td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className="bg-muted text-muted-foreground">
                                {log.action_type}
                              </Badge>
                            </td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className="bg-muted text-muted-foreground">
                                {log.entity_type}
                              </Badge>
                            </td>
                            <td className="px-4 py-2">{log.entity_id}</td>
                            <td className="px-4 py-2">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
                            <td className="px-4 py-2 align-top" style={{maxWidth: '240px', wordBreak: 'break-word'}}>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="w-full text-left p-0 h-auto min-h-0">
                                    <div className="cursor-pointer block w-full text-xs leading-tight text-left truncate" style={{maxWidth: '220px', whiteSpace: 'pre-line'}}>
                                      {getDetailsPreview(log)}
                                    </div>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Audit Details</DialogTitle>
                                  </DialogHeader>
                                  {(() => {
                                    let parsed = null;
                                    try {
                                      parsed = JSON.parse(log.details);
                                    } catch {
                                      return (
                                        <pre className="whitespace-pre-wrap break-words text-xs bg-muted p-4 rounded-lg max-h-[400px] overflow-auto">{log.details}</pre>
                                      );
                                    }
                                    // For prescription, shipment, drugbatch, show formatted summary
                                    if (log.entity_type === "prescription") {
                                      const patientName = userMap[parsed.patient_id] || parsed.patient_id;
                                      const doctorName = userMap[parsed.doctor_id] || parsed.doctor_id;
                                      const drugName = drugMap[parsed.drug_id] || parsed.drug_id;
                                      return (
                                        <div className="text-left space-y-1">
                                          <div><b>Prescription:</b> {parsed.prescription_code || parsed.id}</div>
                                          <div><b>Patient:</b> {patientName}</div>
                                          <div><b>Drug:</b> {drugName}</div>
                                          <div><b>Doctor:</b> {doctorName}</div>
                                          <div><b>Status:</b> {parsed.status}</div>
                                          <div><b>Quantity:</b> {parsed.quantity} {parsed.dosage_unit || ''}</div>
                                        </div>
                                      );
                                    }
                                    if (log.entity_type === "shipment") {
                                      return (
                                        <div className="text-left space-y-1">
                                          <div><b>Shipment:</b> {parsed.shipmentnumber || parsed.id}</div>
                                          <div><b>Status:</b> {parsed.status}</div>
                                        </div>
                                      );
                                    }
                                    if (log.entity_type === "drugbatch") {
                                      const drugName = drugMap[parsed.drugid] || parsed.drugid;
                                      return (
                                        <div className="text-left space-y-1">
                                          <div><b>Batch:</b> {parsed.batchnumber || parsed.id}</div>
                                          <div><b>Drug:</b> {drugName}</div>
                                          <div><b>Qty:</b> {parsed.quantity}</div>
                                        </div>
                                      );
                                    }
                                    // For other JSON, show all key-value pairs, formatted
                                    return (
                                      <div className="text-left space-y-1">
                                        {Object.entries(parsed).map(([key, value]) => (
                                          <div key={key}><b>{key}:</b> {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </DialogContent>
                              </Dialog>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Audit Logs Tab */}
        <TabsContent value="auditlog" className="space-y-4">
          <Card className="healthcare-card">
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                All actions recorded in the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Controls: Search, Filter, Sort */}
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <Input
                  type="text"
                  placeholder="Search by user, entity, details..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-48"
                />
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actionTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={v => setSortOrder(v as 'asc' | 'desc')}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loadingLog && (
                <div className="py-8 text-center text-muted-foreground">Loading audit log...</div>
              )}
              {logError && !loadingLog && (
                <div className="py-8 text-center text-destructive">{logError}</div>
              )}
              {!loadingLog && !logError && getProcessedLogs(auditLog).length === 0 && (
                <div className="py-8 text-center text-muted-foreground">No audit log entries found.</div>
              )}
              {!loadingLog && !logError && getProcessedLogs(auditLog).length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border rounded-lg">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b bg-muted">
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">User</th>
                        <th className="px-4 py-2 text-left">Action</th>
                        <th className="px-4 py-2 text-left">Entity</th>
                        <th className="px-4 py-2 text-left">Entity ID</th>
                        <th className="px-4 py-2 text-left">Timestamp</th>
                        <th className="px-4 py-2 text-left">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getProcessedLogs(auditLog)
                        .map((log, idx) => (
                          <tr key={log.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/40"}>
                            <td className="px-4 py-2 font-semibold">{log.id}</td>
                            <td className="px-4 py-2">{log.user ?? <span className="italic text-muted-foreground">System</span>}</td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className="bg-muted text-muted-foreground">
                                {log.action_type}
                              </Badge>
                            </td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className="bg-muted text-muted-foreground">
                                {log.entity_type}
                              </Badge>
                            </td>
                            <td className="px-4 py-2">{log.entity_id}</td>
                            <td className="px-4 py-2">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
                            <td className="px-4 py-2 align-top" style={{maxWidth: '240px', wordBreak: 'break-word'}}>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="w-full text-left p-0 h-auto min-h-0">
                                    <div className="cursor-pointer block w-full text-xs leading-tight text-left truncate" style={{maxWidth: '220px', whiteSpace: 'pre-line'}}>
                                      {getDetailsPreview(log)}
                                    </div>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Audit Details</DialogTitle>
                                  </DialogHeader>
                                  {(() => {
                                    let parsed = null;
                                    try {
                                      parsed = JSON.parse(log.details);
                                    } catch {
                                      return (
                                        <pre className="whitespace-pre-wrap break-words text-xs bg-muted p-4 rounded-lg max-h-[400px] overflow-auto">{log.details}</pre>
                                      );
                                    }
                                    // For prescription, shipment, drugbatch, show formatted summary
                                    if (log.entity_type === "prescription") {
                                      const patientName = userMap[parsed.patient_id] || parsed.patient_id;
                                      const doctorName = userMap[parsed.doctor_id] || parsed.doctor_id;
                                      const drugName = drugMap[parsed.drug_id] || parsed.drug_id;
                                      return (
                                        <div className="text-left space-y-1">
                                          <div><b>Prescription:</b> {parsed.prescription_code || parsed.id}</div>
                                          <div><b>Patient:</b> {patientName}</div>
                                          <div><b>Drug:</b> {drugName}</div>
                                          <div><b>Doctor:</b> {doctorName}</div>
                                          <div><b>Status:</b> {parsed.status}</div>
                                          <div><b>Quantity:</b> {parsed.quantity} {parsed.dosage_unit || ''}</div>
                                        </div>
                                      );
                                    }
                                    if (log.entity_type === "shipment") {
                                      return (
                                        <div className="text-left space-y-1">
                                          <div><b>Shipment:</b> {parsed.shipmentnumber || parsed.id}</div>
                                          <div><b>Status:</b> {parsed.status}</div>
                                        </div>
                                      );
                                    }
                                    if (log.entity_type === "drugbatch") {
                                      const drugName = drugMap[parsed.drugid] || parsed.drugid;
                                      return (
                                        <div className="text-left space-y-1">
                                          <div><b>Batch:</b> {parsed.batchnumber || parsed.id}</div>
                                          <div><b>Drug:</b> {drugName}</div>
                                          <div><b>Qty:</b> {parsed.quantity}</div>
                                        </div>
                                      );
                                    }
                                    // For other JSON, show all key-value pairs, formatted
                                    return (
                                      <div className="text-left space-y-1">
                                        {Object.entries(parsed).map(([key, value]) => (
                                          <div key={key}><b>{key}:</b> {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </DialogContent>
                              </Dialog>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
    }

export default RegulatorAudits;