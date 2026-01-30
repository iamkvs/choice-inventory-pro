import Dexie, { type Table } from 'dexie';

// Types
export interface Company {
  id?: number;
  name: string;
  logo?: string;
  phone: string;
  email: string;
  address?: string;
  taxId?: string;
  currency: string;
  updatedAt: Date;
}

export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'master' | 'sales' | 'user';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id?: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  referral?: string;
  notes?: string;
  totalPurchases: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id?: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minStock: number;
  location?: string;
  supplier?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Shipment {
  id?: number;
  trackingNumber: string;
  supplier: string;
  origin: string;
  destination: string;
  status: 'pending' | 'in_transit' | 'customs' | 'delivered' | 'cancelled';
  shippingCost: number;
  expectedDate?: Date;
  actualDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShipmentItem {
  id?: number;
  shipmentId: number;
  productId: number;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  date: Date;
  dueDate?: Date;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paid: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id?: number;
  invoiceId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Activity {
  id?: number;
  type: 'sale' | 'purchase' | 'shipment' | 'payment' | 'adjustment';
  description: string;
  amount?: number;
  userId?: number;
  userName?: string;
  createdAt: Date;
}

export class InventoryDB extends Dexie {
  company!: Table<Company>;
  users!: Table<User>;
  customers!: Table<Customer>;
  products!: Table<Product>;
  shipments!: Table<Shipment>;
  shipmentItems!: Table<ShipmentItem>;
  invoices!: Table<Invoice>;
  invoiceItems!: Table<InvoiceItem>;
  activities!: Table<Activity>;

  constructor() {
    super('ChoiceInventoryDB');
    
    this.version(1).stores({
      company: '++id',
      users: '++id, email, role',
      customers: '++id, email, name',
      products: '++id, sku, name, category',
      shipments: '++id, trackingNumber, status',
      shipmentItems: '++id, shipmentId, productId',
      invoices: '++id, invoiceNumber, customerId, date, status',
      invoiceItems: '++id, invoiceId, productId',
      activities: '++id, type, createdAt',
    });
  }
}

export const db = new InventoryDB();

// Initialize default data
export async function initializeDatabase() {
  // Check if company exists
  const company = await db.company.get(1);
  if (!company) {
    await db.company.add({
      name: 'Ishq Trading',
      phone: '',
      email: '',
      currency: 'USD',
      updatedAt: new Date(),
    });
  }

  // Check if admin user exists
  const adminUser = await db.users.where('email').equals('admin@choice.com').first();
  if (!adminUser) {
    await db.users.add({
      name: 'Administrator',
      email: 'admin@choice.com',
      password: 'admin123', // In production, use hashed passwords
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

// Export database as JSON for backup
export async function exportDatabase(): Promise<string> {
  const data = {
    company: await db.company.toArray(),
    users: await db.users.toArray(),
    customers: await db.customers.toArray(),
    products: await db.products.toArray(),
    shipments: await db.shipments.toArray(),
    shipmentItems: await db.shipmentItems.toArray(),
    invoices: await db.invoices.toArray(),
    invoiceItems: await db.invoiceItems.toArray(),
    activities: await db.activities.toArray(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

// Import database from JSON
export async function importDatabase(jsonData: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonData);
    
    await db.transaction('rw', 
      [db.company, db.users, db.customers, db.products, 
       db.shipments, db.shipmentItems, db.invoices, 
       db.invoiceItems, db.activities], 
      async () => {
        // Clear existing data
        await db.company.clear();
        await db.users.clear();
        await db.customers.clear();
        await db.products.clear();
        await db.shipments.clear();
        await db.shipmentItems.clear();
        await db.invoices.clear();
        await db.invoiceItems.clear();
        await db.activities.clear();

        // Import new data
        if (data.company) await db.company.bulkAdd(data.company);
        if (data.users) await db.users.bulkAdd(data.users);
        if (data.customers) await db.customers.bulkAdd(data.customers);
        if (data.products) await db.products.bulkAdd(data.products);
        if (data.shipments) await db.shipments.bulkAdd(data.shipments);
        if (data.shipmentItems) await db.shipmentItems.bulkAdd(data.shipmentItems);
        if (data.invoices) await db.invoices.bulkAdd(data.invoices);
        if (data.invoiceItems) await db.invoiceItems.bulkAdd(data.invoiceItems);
        if (data.activities) await db.activities.bulkAdd(data.activities);
      }
    );
    return true;
  } catch (error) {
    console.error('Import failed:', error);
    return false;
  }
}
