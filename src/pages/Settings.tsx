import { useEffect, useState } from 'react';
import { Building2, Users, Database, Save, Upload, Download, Trash2, Plus, Shield, UserCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Company, type User, exportDatabase, importDatabase } from '@/db/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

export function Settings() {
  const { company, loadCompany, updateCompany } = useAppStore();
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => {
    loadCompany();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your company settings, users, and data</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="company">
            <Building2 className="h-4 w-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="h-4 w-4 mr-2" />
            Backup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6">
          <CompanySettings company={company} onUpdate={updateCompany} />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="backup" className="mt-6">
          <BackupRestore />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Company Settings Component
interface CompanySettingsProps {
  company: Company | null;
  onUpdate: (data: Partial<Company>) => Promise<void>;
}

function CompanySettings({ company, onUpdate }: CompanySettingsProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: company?.name || '',
    phone: company?.phone || '',
    email: company?.email || '',
    address: company?.address || '',
    taxId: company?.taxId || '',
    currency: company?.currency || 'USD',
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        phone: company.phone || '',
        email: company.email || '',
        address: company.address || '',
        taxId: company.taxId || '',
        currency: company.currency || 'USD',
      });
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(formData);
    toast({
      title: 'Settings Saved',
      description: 'Company information has been updated successfully',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>Update your business details that appear on invoices and reports</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / GST Number</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(v) => setFormData({ ...formData, currency: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                <SelectItem value="AED">AED - UAE Dirham</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-[#0082f3] hover:bg-[#2895f7]">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// User Management Component
function UserManagement() {
  const { toast } = useToast();
  const { currentUser } = useAppStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const users = useLiveQuery(() => db.users.toArray(), []);

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) {
      toast({
        title: 'Cannot Delete',
        description: 'You cannot delete your own account',
        variant: 'destructive',
      });
      return;
    }
    if (confirm('Are you sure you want to delete this user?')) {
      await db.users.delete(id);
      toast({ title: 'User Deleted', description: 'User has been removed successfully' });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4 text-red-600" />;
      case 'master': return <Shield className="h-4 w-4 text-blue-600" />;
      case 'sales': return <UserCircle className="h-4 w-4 text-green-600" />;
      default: return <UserCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'master': return 'bg-blue-100 text-blue-700';
      case 'sales': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0082f3] hover:bg-[#2895f7]">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <UserForm
              onSubmit={async (data) => {
                await db.users.add({
                  ...data,
                  isActive: true,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
                setIsAddDialogOpen(false);
                toast({ title: 'User Added', description: 'New user has been created successfully' });
              }}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', getRoleColor(user.role))}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(user.id!)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!users || users.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No users found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// User Form Component
interface UserFormProps {
  onSubmit: (data: Omit<User, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function UserForm({ onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as User['role'],
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Full Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Email *</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Password *</Label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Role *</Label>
        <Select
          value={formData.role}
          onValueChange={(v) => setFormData({ ...formData, role: v as User['role'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin - Full Access</SelectItem>
            <SelectItem value="master">Master - All except Settings</SelectItem>
            <SelectItem value="sales">Sales - Customers & Invoices</SelectItem>
            <SelectItem value="user">User - View Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#0082f3] hover:bg-[#2895f7]">
          Add User
        </Button>
      </div>
    </form>
  );
}

// Backup & Restore Component
function BackupRestore() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportDatabase();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `choice_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Backup Created', description: 'Your data has been exported successfully' });
    } catch (error) {
      toast({ title: 'Backup Failed', description: 'Failed to create backup', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const success = await importDatabase(text);
      if (success) {
        toast({ title: 'Restore Complete', description: 'Your data has been restored successfully' });
        window.location.reload();
      } else {
        toast({ title: 'Restore Failed', description: 'Failed to restore data', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Restore Failed', description: 'Invalid backup file', variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Backup Data</CardTitle>
          <CardDescription>Export all your data to a JSON file for safekeeping</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-[#0082f3] hover:bg-[#2895f7]"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Creating Backup...' : 'Export Backup'}
            </Button>
            <p className="text-sm text-gray-500">
              This will download a JSON file containing all your data
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restore Data</CardTitle>
          <CardDescription>Import data from a previous backup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label
                htmlFor="import-file"
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors',
                  isImporting
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                )}
              >
                <Upload className="h-4 w-4" />
                {isImporting ? 'Restoring...' : 'Select Backup File'}
              </Label>
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
              />
              <p className="text-sm text-gray-500">
                Select a JSON backup file to restore your data
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Restoring will replace all current data. Make sure to backup your current data first.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Choice Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-[#0082f3] rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">C</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Choice Inventory Management System</h3>
              <p className="text-sm text-gray-500">Version 1.0.0</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              <strong>Developed by:</strong> Prashanth KV
            </p>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> itsmeekv@gmail.com
            </p>
            <p className="text-sm text-gray-600">
              <strong>Studio:</strong> Choice16 Studio
            </p>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500">
              This is a Progressive Web App (PWA) that works offline. All data is stored locally on your device.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
