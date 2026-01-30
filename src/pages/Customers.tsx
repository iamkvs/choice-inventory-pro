import { useState } from 'react';
import { Plus, Search, Download, Edit, Trash2, Users, Mail, Phone, MapPin } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer } from '@/db/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { exportCustomersToExcel, downloadBlob } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

export function Customers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const customers = useLiveQuery(
    () => {
      if (searchQuery) {
        return db.customers
          .where('name')
          .startsWithIgnoreCase(searchQuery)
          .or('email')
          .startsWithIgnoreCase(searchQuery)
          .or('phone')
          .startsWithIgnoreCase(searchQuery)
          .toArray();
      }
      return db.customers.toArray();
    },
    [searchQuery]
  );

  const handleExport = async () => {
    if (customers && customers.length > 0) {
      const blob = await exportCustomersToExcel(customers);
      downloadBlob(blob, `customers_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast({
        title: 'Export Successful',
        description: 'Customers exported to Excel',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      await db.customers.delete(id);
      toast({
        title: 'Customer Deleted',
        description: 'Customer has been removed successfully',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">Manage your customer database</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0082f3] hover:bg-[#2895f7]">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <CustomerForm
                onSubmit={async (data) => {
                  await db.customers.add({
                    ...data,
                    totalPurchases: 0,
                    totalAmount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });
                  setIsAddDialogOpen(false);
                  toast({
                    title: 'Customer Added',
                    description: 'New customer has been added successfully',
                  });
                }}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({customers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Referral</TableHead>
                  <TableHead>Total Purchases</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#0082f3] flex items-center justify-center text-white font-medium">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          {customer.address && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {customer.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {customer.email}
                        </p>
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {customer.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{customer.referral || '-'}</TableCell>
                    <TableCell>{customer.totalPurchases}</TableCell>
                    <TableCell>${customer.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Customer</DialogTitle>
                            </DialogHeader>
                            <CustomerForm
                              customer={customer}
                              onSubmit={async (data) => {
                                await db.customers.update(customer.id!, {
                                  ...data,
                                  updatedAt: new Date(),
                                });
                                toast({
                                  title: 'Customer Updated',
                                  description: 'Customer has been updated successfully',
                                });
                              }}
                              onCancel={() => {}}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer.id!)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!customers || customers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No customers found</p>
                      <p className="text-sm">Add your first customer to get started</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Customer Form Component
interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: Omit<Customer, 'id' | 'totalPurchases' | 'totalAmount' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function CustomerForm({ customer, onSubmit, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    referral: customer?.referral || '',
    notes: customer?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="referral">Referral Source</Label>
          <Input
            id="referral"
            value={formData.referral}
            onChange={(e) => setFormData({ ...formData, referral: e.target.value })}
            placeholder="How did they find you?"
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
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional information..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#0082f3] hover:bg-[#2895f7]">
          {customer ? 'Update Customer' : 'Add Customer'}
        </Button>
      </div>
    </form>
  );
}
