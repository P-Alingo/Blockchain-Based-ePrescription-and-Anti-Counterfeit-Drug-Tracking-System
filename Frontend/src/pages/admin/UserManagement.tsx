import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Settings, Users, Cog, Database, FileText, Activity,
  Search, Plus, Edit, Trash2, Eye, Filter, X, Save, RotateCcw, Archive
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  status?: "pending" | "active" | "suspended" | "inactive";
  createdat?: string;
  updatedat?: string;
  is_deleted?: boolean;
  blockchain?: {
    exists?: boolean;
    role?: string;
    status?: string;
    error?: string;
    is_synced?: boolean;
    transaction_hash?: string;
    block_number?: number;
  };
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [syncingUserId, setSyncingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");

  const sidebarItems = [
    { icon: Settings, label: 'Dashboard', path: '/admin/dashboard', active: false },
    { icon: Users, label: 'User Management', path: '/admin/users', active: true },
    { icon: Cog, label: 'System Logs', path: '/admin/system-logs', active: false },
    { icon: FileText, label: 'Blockchain', path: '/admin/blockchain', active: false },
    { icon: Activity, label: 'Analytics', path: '/admin/analytics', active: false },
  ];

  // ✅ UPDATED: Changed from /api/users to /api/admin/users
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const token = localStorage.getItem("token");

  // Fetch all users - ✅ UPDATED ENDPOINT
  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      let usersWithBlockchain = data.users || [];
      // Fetch blockchain status for each user with wallet address
      const updatedUsers = await Promise.all(usersWithBlockchain.map(async (user: User) => {
        if (user.wallet_address) {
          try {
            const blockchainStatus = await fetchBlockchainStatus(user.id);
            if (blockchainStatus) {
              user.blockchain = {
                exists: blockchainStatus.blockchain_status !== 'not_registered',
                status: blockchainStatus.blockchain_status,
                role: blockchainStatus.blockchain_role,
                is_synced: blockchainStatus.is_synced,
                error: blockchainStatus.error,
                transaction_hash: blockchainStatus.transaction_hash,
                block_number: blockchainStatus.block_number
              };
            }
          } catch (err) {
            user.blockchain = { error: 'Failed to fetch blockchain status' };
          }
        }
        return user;
      }));
      setUsers(updatedUsers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch deleted users - ✅ UPDATED ENDPOINT
  const fetchDeletedUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/deleted`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setDeletedUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch deleted users:", err);
    }
  };

  // Search users - ✅ UPDATED ENDPOINT
  const searchUsers = async () => {
    if (!searchTerm.trim()) return fetchUsers();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/users/search?query=${encodeURIComponent(searchTerm)}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
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

  // Fetch single user - ✅ UPDATED ENDPOINT
  const fetchUser = async (userId: string) => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to fetch user details");
      const data = await res.json();
      return data.user;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // Get blockchain status - ✅ NEW FUNCTION
  const fetchBlockchainStatus = async (userId: string) => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/blockchain-status`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to fetch blockchain status");
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Failed to fetch blockchain status:", err);
      return null;
    }
  };

  const viewUser = async (userId: string, enableEdit = false) => {
    const user = await fetchUser(userId);
    if (!user) return;
    
    // Fetch blockchain status for the user
    const blockchainStatus = await fetchBlockchainStatus(userId);
    if (blockchainStatus) {
      user.blockchain = {
        exists: blockchainStatus.blockchain_status !== 'not_registered',
        status: blockchainStatus.blockchain_status,
        role: blockchainStatus.blockchain_role,
        is_synced: blockchainStatus.is_synced
      };
    }
    
    setSelectedUser(user);
    setModalOpen(true);
    setEditMode(enableEdit);
  };

  const handleEdit = () => setEditMode(true);

  const handleSave = async () => {
    if (!selectedUser || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
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
    if (!window.confirm("Are you sure you want to delete this user? This will suspend them on the blockchain but keep their record.")) return;
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, { 
        method: "DELETE", 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to delete user");
      
      // Remove from active users and add to deleted users
      const deletedUser = users.find(u => u.id === userId);
      if (deletedUser) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setDeletedUsers(prev => [...prev, { ...deletedUser, is_deleted: true }]);
      }
      
      alert("User soft deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const handleRestore = async (userId: string) => {
    if (!window.confirm("Are you sure you want to restore this user?")) return;
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/restore`, { 
        method: "PATCH", 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!res.ok) throw new Error("Failed to restore user");
      
      // Remove from deleted users and add back to active users
      const restoredUser = deletedUsers.find(u => u.id === userId);
      if (restoredUser) {
        setDeletedUsers(prev => prev.filter(u => u.id !== userId));
        setUsers(prev => [...prev, { ...restoredUser, is_deleted: false, status: 'active' }]);
      }
      
      alert("User restored successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to restore user");
    }
  };

  const handleSyncBlockchain = async (userId: string) => {
    if (!token) return;
    setSyncingUserId(userId);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/sync-blockchain`, { 
        method: "POST", 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to sync user to blockchain");
      const updatedUser = await fetchUser(userId);
      if (updatedUser) {
        if (activeTab === "active") {
          setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        } else {
          setDeletedUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        }
      }
      alert("✅ User successfully synced to blockchain!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to sync user to blockchain");
    } finally {
      setSyncingUserId(null);
    }
  };

  const filteredUsers = (activeTab === "active" ? users : deletedUsers).filter(user =>
    (roleFilter === "all" || user.role === roleFilter) &&
    (statusFilter === "all" || statusFilter === (user.status || "pending"))
  );


  // Refresh handler
  const handleRefresh = () => {
    fetchUsers();
    fetchDeletedUsers();
  };

  useEffect(() => { 
    fetchUsers(); 
    fetchDeletedUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "deleted") {
      fetchDeletedUsers();
    }
  }, [activeTab]);

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      doctor: "bg-blue-100 text-blue-700",
      patient: "bg-green-100 text-green-700",
      pharmacist: "bg-purple-100 text-purple-700",
      manufacturer: "bg-orange-100 text-orange-700",
      distributor: "bg-cyan-100 text-cyan-700",
      regulator: "bg-red-100 text-red-700",
      admin: "bg-gray-100 text-gray-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "pending": return "secondary";
      case "suspended": return "destructive";
      case "inactive": return "outline";
      default: return "outline";
    }
  };

  const getBlockchainStatusBadge = (user: User) => {
    if (!user.wallet_address) {
      return <Badge variant="outline" className="text-xs">No Wallet</Badge>;
    }
    
    if (user.blockchain?.error) {
      return <Badge variant="destructive" className="text-xs">Error</Badge>;
    }
    
    if (!user.blockchain?.exists) {
      return <Badge variant="secondary" className="text-xs">Not Registered</Badge>;
    }
    
    if (user.blockchain?.is_synced) {
      return <Badge variant="default" className="text-xs bg-green-100 text-green-700">Synced</Badge>;
    }
    
    return <Badge variant="outline" className="text-xs">Not Synced</Badge>;
  };

  const renderUserTable = (userList: User[], isDeleted = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Blockchain</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {userList.map((user) => (
          <TableRow key={user.id} className={isDeleted ? "bg-muted/50" : ""}>
            <TableCell>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {user.full_name}
                  {isDeleted && <Badge variant="outline" className="ml-2 text-xs">Deleted</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.is_deleted ? '[DELETED]' : user.email}
                </p>
                <p className="text-xs text-muted-foreground">ID: {user.id}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusColor(user.status || "pending")}>
                {user.status || "pending"}
              </Badge>
            </TableCell>
            <TableCell>
              {getBlockchainStatusBadge(user)}
            </TableCell>
            <TableCell className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => viewUser(user.id)}>
                <Eye className="h-3 w-3" />
              </Button>
              
              {!isDeleted && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => viewUser(user.id, true)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-800"
                    onClick={() => handleSyncBlockchain(user.id)}
                    disabled={syncingUserId === user.id || !user.wallet_address}
                  >
                    <Plus className="h-3 w-3" />
                    {syncingUserId === user.id ? "Syncing..." : "Sync"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive" 
                    onClick={() => handleDelete(user.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
              
              {isDeleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-800"
                  onClick={() => handleRestore(user.id)}
                >
                  <RotateCcw className="h-3 w-3" />
                  Restore
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <DashboardLayout sidebarItems={sidebarItems} userRole="admin" userName="System Admin" userEmail="admin@eprescribe.go.ke">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage system users, roles, and blockchain synchronization</p>
          </div>
          <Button variant="outline" onClick={handleRefresh} className="ml-4 flex gap-2 items-center">
            <RotateCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Tabs for Active/Deleted Users */}
        <Card>
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>
              Search and filter registered users. 
              {users.some(u => u.blockchain?.is_synced) && (
                <span className="text-green-600 ml-2">
                  {users.filter(u => u.blockchain?.is_synced).length} users synced with blockchain
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">
                  <Users className="h-4 w-4 mr-2" />
                  Active Users ({users.length})
                </TabsTrigger>
                <TabsTrigger value="deleted">
                  <Archive className="h-4 w-4 mr-2" />
                  Deleted Users ({deletedUsers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {/* Filters & Search */}
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
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="pharmacist">Pharmacist</SelectItem>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="regulator">Regulator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={searchUsers}>
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>

                {/* Users Table */}
                {loading ? (
                  <p>Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {activeTab === "active" ? "No active users found" : "No deleted users found"}
                  </div>
                ) : (
                  renderUserTable(filteredUsers, activeTab === "deleted")
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* View/Edit Modal */}
        {modalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-md">
              <CardHeader className="flex justify-between items-center">
                <CardTitle>
                  {editMode ? "Edit User" : "View User"}
                  {selectedUser.is_deleted && <Badge variant="outline" className="ml-2">Deleted</Badge>}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setModalOpen(false); setSelectedUser(null); }}>
                  <X />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Blockchain Status Display */}
                {selectedUser.wallet_address && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="mb-2">
                      <span className="text-sm font-semibold">Blockchain Status</span>
                    </div>
                    {selectedUser.blockchain ? (
                      <div className="space-y-1 text-xs">
                        <div>Status: <Badge variant={selectedUser.blockchain.is_synced ? "default" : "secondary"}>
                          {selectedUser.blockchain.status || 'Unknown'}
                        </Badge></div>
                        <div>Role: {selectedUser.blockchain.role || 'Unknown'}</div>
                        <div>Synced: {selectedUser.blockchain.is_synced ? '✅' : '❌'}</div>
                        {selectedUser.blockchain.error && (
                          <div className="text-red-600">Error: {selectedUser.blockchain.error}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Loading blockchain status...</div>
                    )}
                  </div>
                )}

                {["full_name","email","role","wallet_address","phone_number","gender","dob","user_code"].map(field => (
                  <div key={field}>
                    <p className="text-xs font-semibold">{field.replace("_"," ").toUpperCase()}</p>
                    <Input
                      value={(selectedUser as any)[field] || ""}
                      onChange={(e) => editMode && setSelectedUser({ ...selectedUser, [field]: e.target.value })}
                      disabled={!editMode || selectedUser.is_deleted}
                    />
                  </div>
                ))}
                <div className="mt-2">
                  <p className="text-xs font-semibold">Status</p>
                  <Select
                    value={selectedUser.status || "pending"}
                    onValueChange={(val) => {
                      if (editMode && selectedUser && !selectedUser.is_deleted) {
                        const updatedUser = { ...selectedUser, status: val as "pending"|"active"|"suspended"|"inactive" };
                        setSelectedUser(updatedUser);
                        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                      }
                    }}
                    disabled={!editMode || selectedUser.is_deleted}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  {editMode ? (
                    <Button onClick={handleSave} disabled={selectedUser.is_deleted}>
                      <Save className="mr-1 h-4 w-4" />
                      Save
                    </Button>
                  ) : (
                    <Button onClick={handleEdit} disabled={selectedUser.is_deleted}>
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => { setModalOpen(false); setSelectedUser(null); }}>
                    Close
                  </Button>
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