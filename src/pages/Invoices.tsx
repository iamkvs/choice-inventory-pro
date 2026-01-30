import { useState } from 'react';
import { Plus, Search, Eye, Trash2, FileText, Send } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Invoice, type InvoiceItem } from '@/db/database';
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
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportInvoiceToPDF, downloadBlob } from '@/utils/exportUtils';
import { sendInvoiceEmail } from '@/utils/emailUtils';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

export function Invoices() {
  const { toast } = useToast();
  const { company } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const invoices = useLiveQuery(
    () => {
      if (searchQuery) {
        return db.invoices
          .where('invoiceNumber')
          .startsWithIgnoreCase(searchQuery)
          .or('customerName')
          .startsWithIgnoreCase(searchQuery)
          .toArray();
      }
      return db.invoices.reverse().toArray();
    },
    [searchQuery]
  );

  const handleExportPDF = async (invoice: Invoice) => {
    const items = await db.invoiceItems.where('invoiceId').equals(invoice.id!).toArray();
    const customer = await db.customers.get(invoice.customerId);
    const blob = await exportInvoiceToPDF(invoice, items, company, customer || null);
    downloadBlob(blob, `invoice_${invoice.invoiceNumber}.pdf`);
    toast({ title: 'Export Successful', description: 'Invoice exported to PDF' });
  };

  const handleSendEmail = async (invoice: Invoice) => {
    const customer = await db.customers.get(invoice.customerId);
    if (customer) {
      const result = await sendInvoiceEmail(invoice, customer, company);
      toast({
        title: result.success ? 'Email Sent' : 'Email Failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await db.invoices.delete(id);
      await db.invoiceItems.where('invoiceId').equals(id).delete();
      toast({ title: 'Invoice Deleted', description: 'Invoice has been removed successfully' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">Create and manage customer invoices</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0082f3] hover:bg-[#2895f7]">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <InvoiceForm
              onSubmit={async (invoiceData, items) => {
                const invoiceId = await db.invoices.add({
                  ...invoiceData,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
                
                for (const item of items) {
                  await db.invoiceItems.add({
                    ...item,
                    invoiceId: invoiceId as number,
                  });
                  
                  // Update product quantity
                  const product = await db.products.get(item.productId);
                  if (product) {
                    await db.products.update(item.productId, {
                      quantity: product.quantity - item.quantity,
                      updatedAt: new Date(),
                    });
                  }
                }
                
                // Update customer stats
                const customer = await db.customers.get(invoiceData.customerId);
                if (customer) {
                  await db.customers.update(invoiceData.customerId, {
                    totalPurchases: customer.totalPurchases + 1,
                    totalAmount: customer.totalAmount + invoiceData.total,
                    updatedAt: new Date(),
                  });
                }
                
                // Add activity
                await db.activities.add({
                  type: 'sale',
                  description: `Created invoice ${invoiceData.invoiceNumber} for ${invoiceData.customerName}`,
                  amount: invoiceData.total,
                  createdAt: new Date(),
                });
                
                setIsAddDialogOpen(false);
                toast({ title: 'Invoice Created', description: 'New invoice has been created successfully' });
              }}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by invoice number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({invoices?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell>${invoice.total.toFixed(2)}</TableCell>
                    <TableCell>${invoice.paid.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={cn(getStatusColor(invoice.status), 'font-medium')}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Invoice Details</DialogTitle>
                            </DialogHeader>
                            <InvoiceView invoice={invoice} />
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="ghost" size="icon" onClick={() => handleExportPDF(invoice)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                        
                        <Button variant="ghost" size="icon" onClick={() => handleSendEmail(invoice)}>
                          <Send className="h-4 w-4" />
                        </Button>
                        
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(invoice.id!)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!invoices || invoices.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No invoices found</p>
                      <p className="text-sm">Create your first invoice to get started</p>
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

// Invoice Form Component
interface InvoiceFormProps {
  onSubmit: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>, items: Omit<InvoiceItem, 'id' | 'invoiceId'>[]) => void;
  onCancel: () => void;
}

function InvoiceForm({ onSubmit, onCancel }: InvoiceFormProps) {
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  
  const [selectedCustomer, setSelectedCustomer] = useState<number | ''>('');
  const [items, setItems] = useState<Array<{ productId: number; quantity: number }>>([{ productId: 0, quantity: 1 }]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  const calculateTotals = () => {
    let subtotal = 0;
    items.forEach(item => {
      const product = products?.find(p => p.id === item.productId);
      if (product) {
        subtotal += product.sellingPrice * item.quantity;
      }
    });
    const total = subtotal + tax - discount;
    return { subtotal, total };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    const customer = customers?.find(c => c.id === selectedCustomer);
    if (!customer) return;

    const { subtotal, total } = calculateTotals();
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    
    const invoiceItems = items.map(item => {
      const product = products?.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || '',
        quantity: item.quantity,
        unitPrice: product?.sellingPrice || 0,
        total: (product?.sellingPrice || 0) * item.quantity,
      };
    });

    onSubmit({
      invoiceNumber,
      customerId: selectedCustomer,
      customerName: customer.name,
      date: new Date(),
      subtotal,
      tax,
      discount,
      total,
      paid: 0,
      status: 'draft',
      notes,
    }, invoiceItems);
  };

  const { subtotal, total } = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Customer *</Label>
        <Select value={selectedCustomer.toString()} onValueChange={(v) => setSelectedCustomer(Number(v))}>
          <SelectTrigger>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {customers?.map((customer) => (
              <SelectItem key={customer.id} value={customer.id!.toString()}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Items</Label>
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Select
              value={item.productId.toString()}
              onValueChange={(v) => {
                const newItems = [...items];
                newItems[index].productId = Number(v);
                setItems(newItems);
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id!.toString()}>
                    {product.name} - ${product.sellingPrice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => {
                const newItems = [...items];
                newItems[index].quantity = parseInt(e.target.value);
                setItems(newItems);
              }}
              className="w-24"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setItems(items.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setItems([...items, { productId: 0, quantity: 1 }])}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tax</Label>
          <Input
            type="number"
            step="0.01"
            value={tax}
            onChange={(e) => setTax(parseFloat(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Discount</Label>
          <Input
            type="number"
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes..."
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>${discount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#0082f3] hover:bg-[#2895f7]">
          Create Invoice
        </Button>
      </div>
    </form>
  );
}

// Invoice View Component
function InvoiceView({ invoice }: { invoice: Invoice }) {
  const { company } = useAppStore();
  const items = useLiveQuery(() => db.invoiceItems.where('invoiceId').equals(invoice.id!).toArray(), [invoice.id]);
  const customer = useLiveQuery(() => db.customers.get(invoice.customerId), [invoice.customerId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{company?.name || 'Your Company'}</h2>
          <p className="text-sm text-gray-500">{company?.address}</p>
          <p className="text-sm text-gray-500">{company?.phone} | {company?.email}</p>
        </div>
        <div className="text-right">
          <h3 className="text-xl font-bold">INVOICE</h3>
          <p className="text-sm">{invoice.invoiceNumber}</p>
          <p className="text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-500">Bill To:</h4>
        <p className="font-medium">{customer?.name}</p>
        <p className="text-sm text-gray-500">{customer?.address}</p>
        <p className="text-sm text-gray-500">{customer?.phone} | {customer?.email}</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.productName}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
              <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>${invoice.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>${invoice.discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>${invoice.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid:</span>
            <span>${invoice.paid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Balance:</span>
            <span>${(invoice.total - invoice.paid).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-500">Notes:</h4>
          <p className="text-sm">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
