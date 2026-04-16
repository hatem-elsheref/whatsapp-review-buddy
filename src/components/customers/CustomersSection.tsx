import { useState, useEffect } from 'react';
import { Search, MessageSquare, FileText, Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, Contact } from '@/lib/api';

interface ContactFormData {
  phone_number: string;
  name: string;
  profile_name: string;
  opt_in: boolean;
}

const CustomersSection = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({ phone_number: '', name: '', profile_name: '', opt_in: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await api.get<{ data: Contact[] }>('/contacts');
      setContacts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/contacts', formData);
      toast.success('Contact added successfully');
      setShowAddModal(false);
      setFormData({ phone_number: '', name: '', profile_name: '', opt_in: false });
      fetchContacts();
    } catch (error) {
      toast.error('Failed to add contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api.post(`/contacts/${id}/delete`);
      toast.success('Contact deleted');
      fetchContacts();
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const filtered = contacts.filter(c =>
    (c.name?.toLowerCase() || c.phone_number).includes(search.toLowerCase()) ||
    c.phone_number.includes(search)
  );

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
        <h2 className="font-semibold">Contacts</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search by name or phone..." 
              className="bg-muted rounded-lg pl-9 pr-4 py-2 text-sm outline-none w-72" 
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Profile Name</th>
              <th className="text-left p-3">Opt-in</th>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No contacts found</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {c.name?.charAt(0).toUpperCase() || c.phone_number.slice(-2)}
                    </div>
                    <span className="text-sm font-medium">{c.name || '—'}</span>
                  </div>
                </td>
                <td className="p-3 text-sm text-muted-foreground">{c.phone_number}</td>
                <td className="p-3 text-sm text-muted-foreground">{c.profile_name || '—'}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded ${c.opt_in ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {c.opt_in ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-3 text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <button 
                    onClick={() => handleDeleteContact(c.id)}
                    className="text-xs text-red-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">Add New Contact</h3>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Profile Name</label>
                <input
                  type="text"
                  value={formData.profile_name}
                  onChange={(e) => setFormData({ ...formData, profile_name: e.target.value })}
                  placeholder="Profile name from WhatsApp"
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="opt_in"
                  checked={formData.opt_in}
                  onChange={(e) => setFormData({ ...formData, opt_in: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="opt_in" className="text-sm text-muted-foreground">
                  Opt-in (customer agreed to receive messages)
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersSection;