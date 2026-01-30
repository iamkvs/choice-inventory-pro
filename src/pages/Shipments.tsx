import { useState } from 'react';
import { Plus, Search, Ship, Calendar, MapPin, Edit, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Shipment, type ShipmentItem } from '@/db/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function Shipments() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const shipments = useLiveQuery(
    () => {
      if (searchQuery) {
        return db.shipments
          .where('trackingNumber')
          .startsWithIgnoreCase(searchQuery)
          .or('supplier')
          .startsWithIgnoreCase(searchQuery)
          .toArray();
      }
      return db.shipments.reverse().toArray();
    },
    [searchQuery]
  );

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this shipment?')) {
      await db.shipments.delete(id);
      await db.shipmentItems.where('shipmentId').equals(id).delete();
      toast({ title: 'Shipment Deleted', description: 'Shipment has been removed successfully' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_transit': return <Ship className="h-5 w-5 text-blue-600" />;
      case 'customs': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'pending': return <Clock className="h-5 w-5 text-gray-600" />;
      case 'cancelled': return <AlertCircle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      case 'customs': return 'bg-orange-100 text-orange-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
          <p className="text-sm text-gray-500">Track international shipments and inventory arrivals</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0082f3] hover:bg-[#2895f7]">
              <Plus className="h-4 w-4 mr-2" />
              Add Shipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Add New Shipment</DialogTitle>
            </DialogHeader>
            <ShipmentForm
              onSubmit={async (shipmentData, items) => {
                const shipmentId = await db.shipments.add({
                  ...shipmentData,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
                
                for (const item of items) {
                  await db.shipmentItems.add({
                    ...item,
                    shipmentId: shipmentId as number,
                  });
                }
                
                // Add activity
                await db.activities.add({
                  type: 'shipment',
                  description: `Added shipment ${shipmentData.trackingNumber} from ${shipmentData.supplier}`,
                  createdAt: new Date(),
                });
                
                setIsAddDialogOpen(false);
                toast({ title: 'Shipment Added', description: 'New shipment has been added successfully' });
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
              placeholder="Search by tracking number or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shipments?.map((shipment) => (
          <Card key={shipment.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(shipment.status)}
                  <div>
                    <p className="font-medium">{shipment.trackingNumber}</p>
                    <p className="text-xs text-gray-500">{shipment.supplier}</p>
                  </div>
                </div>
                <Badge className={cn(getStatusColor(shipment.status), 'font-medium')}>
                  {shipment.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{shipment.origin} → {shipment.destination}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Expected: {shipment.expectedDate ? new Date(shipment.expectedDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Ship className="h-4 w-4" />
                  <span>Shipping Cost: ${shipment.shippingCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Shipment Status</DialogTitle>
                    </DialogHeader>
                    <ShipmentStatusForm
                      shipment={shipment}
                      onSubmit={async (data) => {
                        await db.shipments.update(shipment.id!, {
                          ...data,
                          updatedAt: new Date(),
                        });
                        
                        // If delivered, update product quantities
                        if (data.status === 'delivered' && shipment.status !== 'delivered') {
                          const items = await db.shipmentItems.where('shipmentId').equals(shipment.id!).toArray();
                          for (const item of items) {
                            const product = await db.products.get(item.productId);
                            if (product) {
                              await db.products.update(item.productId, {
                                quantity: product.quantity + item.quantity,
                                updatedAt: new Date(),
                              });
                            }
                          }
                          
                          await db.activities.add({
                            type: 'shipment',
                            description: `Shipment ${shipment.trackingNumber} delivered`,
                            createdAt: new Date(),
                          });
                        }
                        
                        toast({ title: 'Shipment Updated', description: 'Shipment status has been updated' });
                      }}
                      onCancel={() => {}}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(shipment.id!)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!shipments || shipments.length === 0) && (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Ship className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No shipments found</p>
                <p className="text-sm">Add your first shipment to start tracking</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Shipment Form Component
interface ShipmentFormProps {
  onSubmit: (shipment: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>, items: Omit<ShipmentItem, 'id' | 'shipmentId'>[]) => void;
  onCancel: () => void;
}

function ShipmentForm({ onSubmit, onCancel }: ShipmentFormProps) {
  const products = useLiveQuery(() => db.products.toArray(), []);
  
  const [trackingNumber, setTrackingNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [status, setStatus] = useState<Shipment['status']>('pending');
  const [shippingCost, setShippingCost] = useState(0);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: number; quantity: number; costPerUnit: number }>>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const shipmentItems = items.map(item => ({
      ...item,
      totalCost: item.costPerUnit * item.quantity,
    }));

    onSubmit({
      trackingNumber,
      supplier,
      origin,
      destination,
      status,
      shippingCost,
      expectedDate: expectedDate ? new Date(expectedDate) : undefined,
      notes,
    }, shipmentItems);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tracking Number *</Label>
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Supplier *</Label>
          <Input
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Origin *</Label>
          <Input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="e.g., China"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Destination *</Label>
          <Input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g., USA"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as Shipment['status'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="customs">In Customs</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Expected Date</Label>
          <Input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Shipping Cost</Label>
        <Input
          type="number"
          step="0.01"
          value={shippingCost}
          onChange={(e) => setShippingCost(parseFloat(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label>Items in Shipment</Label>
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
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="1"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => {
                const newItems = [...items];
                newItems[index].quantity = parseInt(e.target.value);
                setItems(newItems);
              }}
              className="w-20"
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Cost/unit"
              value={item.costPerUnit}
              onChange={(e) => {
                const newItems = [...items];
                newItems[index].costPerUnit = parseFloat(e.target.value);
                setItems(newItems);
              }}
              className="w-28"
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
          onClick={() => setItems([...items, { productId: 0, quantity: 1, costPerUnit: 0 }])}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#0082f3] hover:bg-[#2895f7]">
          Add Shipment
        </Button>
      </div>
    </form>
  );
}

// Shipment Status Form
interface ShipmentStatusFormProps {
  shipment: Shipment;
  onSubmit: (data: Partial<Shipment>) => void;
  onCancel: () => void;
}

function ShipmentStatusForm({ shipment, onSubmit }: ShipmentStatusFormProps) {
  const [status, setStatus] = useState(shipment.status);
  const [actualDate, setActualDate] = useState(
    shipment.actualDate ? new Date(shipment.actualDate).toISOString().split('T')[0] : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      status,
      actualDate: actualDate ? new Date(actualDate) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as Shipment['status'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="customs">In Customs</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {status === 'delivered' && (
        <div className="space-y-2">
          <Label>Actual Delivery Date</Label>
          <Input
            type="date"
            value={actualDate}
            onChange={(e) => setActualDate(e.target.value)}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" className="bg-[#0082f3] hover:bg-[#2895f7]">
          Update Status
        </Button>
      </div>
    </form>
  );
}
