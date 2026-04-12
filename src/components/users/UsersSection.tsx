import { useState, useEffect } from 'react';
import { Users, Plus, Loader2, Edit, Trash2, Check, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api, User } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

const UsersSection = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'agent' });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.get<{ data: User[] }>('/users');
      setUsers(data.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', formData);
      toast.success('User created successfully');
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role: 'agent' });
      fetchUsers();
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      const updateData: any = { name: formData.name, role: formData.role };
      if (formData.password) updateData.password = formData.password;
      
      await api.put(`/users/${editingUser.id}`, updateData);
      toast.success('User updated successfully');
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'agent' });
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleApproveUser = async (id: number) => {
    try {
      await api.post(`/users/${id}/approve`);
      toast.success('User approved');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleRejectUser = async (id: number) => {
    try {
      await api.post(`/users/${id}/reject`);
      toast.success('User rejected');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to reject user');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search || 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColor = (s: string) => {
    if (s === 'approved') return 'bg-green-100 text-green-700';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const roleColor = (r: string) => {
    if (r === 'admin') return 'bg-purple-100 text-purple-700';
    return 'bg-blue-100 text-blue-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Users Management</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search users..." 
            className="w-full bg-muted rounded-lg pl-9 pr-4 py-2 text-sm outline-none" 
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-muted rounded-lg px-3 py-2 text-sm outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No users found</td></tr>
            ) : filteredUsers.map(u => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-3 text-sm font-medium">{u.name}</td>
                <td className="p-3 text-sm text-muted-foreground">{u.email}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded ${roleColor(u.role)}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded ${statusColor(u.status)}`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setEditingUser(u); setFormData({ name: u.name, email: u.email, password: '', role: u.role }); }}
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                    {u.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleApproveUser(u.id)}
                          className="text-xs text-green-500 hover:underline flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button 
                          onClick={() => handleRejectUser(u.id)}
                          className="text-xs text-red-500 hover:underline flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </>
                    )}
                    {u.status === 'rejected' && (
                      <button 
                        onClick={() => handleApproveUser(u.id)}
                        className="text-xs text-green-500 hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-xs text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showAddModal || editingUser) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1"
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="text-sm text-muted-foreground">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1"
                    required
                  />
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground">
                  Password {editingUser ? '(leave blank to keep)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1"
                  required={!editingUser}
                  minLength={8}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1"
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingUser(null); setFormData({ name: '', email: '', password: '', role: 'agent' }); }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersSection;