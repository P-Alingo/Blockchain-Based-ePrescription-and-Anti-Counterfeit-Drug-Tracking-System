import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Settings, Users, Cog, FileText, Activity,
  Search, Plus, Edit, Trash2, Eye, Filter, X, Save
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  wallet_address?: string;
  phone_number?: string;
  gender?: string;
  dob?: string;
  user_code?: string;
  status?: "pending" | "active" | "suspended";
  createdat?: string;
  updatedat?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [syncingUserId, setSyncingUserId] = useState<string | null>(null);

  const sidebarItems = [
    { icon: Settings, label: "Dashboard", path: "/admin/dashboard", active: false },
    { icon: Users, label: "User Management", path: "/admin/users", active: true },
    { icon: Cog, label: "System Settings", path: "/admin/settings", active: false },
    { icon: FileText, label: "Reports", path: "/admin/reports", active: false },
    { icon: Activity, label: "Activity Logs", path: "/admin/activity-logs", active: false },
  ];

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const token = localStorage.getItem("token");

  // Fetch all users
  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Search users
  const searchUsers = async () => {
    if (!searchTerm.trim()) return fetchUsers();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/search?query=${encodeURIComponent(searchTerm)}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to search users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single user
  const fetchUser = async (userId: string) => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch user details");
      const data = await res.json();
      return data.user;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const viewUser = async (userId: string, enableEdit = false) => {
    const user = await fetchUser(userId);
    if (!user) return;
    setSelectedUser(user);
    setModalOpen(true);
    setEditMode(enableEdit);
  };

  const handleEdit = () => setEditMode(true);

  const handleSave = async () => {
    if (!selectedUser || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(selectedUser),
      });
      if (!res.ok) throw new Error("Failed to update user");
      const updatedUser = await fetchUser(selectedUser.id);
      if (!updatedUser) throw new Error("Failed to fetch updated user");
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setSelectedUser(updatedUser);
      setEditMode(false);
      alert("User updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update user");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert("User deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const handleSyncBlockchain = async (userId: string) => {
    if (!token) return;
    setSyncingUserId(userId);
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/sync-blockchain`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to sync user to blockchain");
      const updatedUser = await fetchUser(userId);
      if (updatedUser) setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      alert("✅ User successfully synced to blockchain!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to sync user to blockchain");
    } finally {
      setSyncingUserId(null);
    }
  };

  const filteredUsers = users.filter(user =>
    (roleFilter === "all" || user.role === roleFilter) &&
    (statusFilter === "all" || statusFilter === (user.status || "pending"))
  );

  useEffect(() => { fetchUsers(); }, []);

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      doctor: "bg-blue-100 text-blue-700",
      patient: "bg-green-100 text-green-700",
      pharmacist: "bg-purple-100 text-purple-700",
      manufacturer: "bg-orange-100 text-orange-700",
      distributor: "bg-cyan-100 text-cyan-700",
      regulator: "bg-red-100 text-red-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "pending": return "secondary";
      case "suspended": return "destructive";
      default: return "outline";
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="admin" userName="System Admin" userEmail="admin@eprescribe.go.ke">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage system users, roles, and permissions</p>
          </div>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>Search and filter registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                  placeholder="Search users by name, email, or ID..."
                  className="pl-10"
                />
              </div>
              <Select onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="pharmacist">Pharmacist</SelectItem>
                  <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="regulator">Regulator</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={searchUsers}><Filter className="mr-2 h-4 w-4" />Filter</Button>
            </div>

            {/* Users Table */}
            {loading ? <p>Loading users...</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge className={getRoleColor(user.role)}>{user.role}</Badge></TableCell>
                      <TableCell><Badge variant={getStatusColor(user.status || "pending")}>{user.status || "pending"}</Badge></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => viewUser(user.id)}><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => viewUser(user.id, true)}><Edit className="h-3 w-3" /></Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-800"
                          onClick={() => handleSyncBlockchain(user.id)}
                          disabled={syncingUserId === user.id}
                        >
                          <Plus className="h-3 w-3" />{syncingUserId === user.id ? "Syncing..." : "Sync"}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(user.id)}><Trash2 className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View/Edit Modal */}
        {modalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-md">
              <CardHeader className="flex justify-between items-center">
                <CardTitle>{editMode ? "Edit User" : "View User"}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setModalOpen(false); setSelectedUser(null); }}><X /></Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {["full_name","email","role","wallet_address","phone_number","gender","dob","user_code"].map(field => (
                  <div key={field}>
                    <p className="text-xs font-semibold">{field.replace("_"," ").toUpperCase()}</p>
                    <Input
                      value={(selectedUser as any)[field] || ""}
                      onChange={(e) => editMode && setSelectedUser({ ...selectedUser, [field]: e.target.value })}
                      disabled={!editMode}
                    />
                  </div>
                ))}
                <div className="mt-2">
                  <p className="text-xs font-semibold">Status</p>
                  <Select
                    value={selectedUser.status || "pending"}
                    onValueChange={(val) => {
                      if (editMode && selectedUser) {
                        const updatedUser = { ...selectedUser, status: val as "pending"|"active"|"suspended" };
                        setSelectedUser(updatedUser);
                        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                      }
                    }}
                    disabled={!editMode}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  {editMode ? (
                    <Button onClick={handleSave}><Save className="mr-1 h-4 w-4" />Save</Button>
                  ) : (
                    <Button onClick={handleEdit}><Edit className="mr-1 h-4 w-4" />Edit</Button>
                  )}
                  <Button variant="ghost" onClick={() => { setModalOpen(false); setSelectedUser(null); }}>Close</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
