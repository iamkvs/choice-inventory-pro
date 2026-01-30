import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, type User, type Company, type Activity } from '@/db/database';

interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  company: Company | null;
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  stats: {
    totalRevenue: number;
    totalProducts: number;
    totalCustomers: number;
    totalInvoices: number;
    lowStockCount: number;
    pendingShipments: number;
  };
  recentActivities: Activity[];
  monthlyData: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  loadCompany: () => Promise<void>;
  updateCompany: (company: Partial<Company>) => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth State
      currentUser: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const user = await db.users.where('email').equals(email).first();
        if (user && user.password === password && user.isActive) {
          set({ currentUser: user, isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },

      hasRole: (roles: string[]) => {
        const user = get().currentUser;
        return user ? roles.includes(user.role) : false;
      },

      // Dashboard State
      stats: {
        totalRevenue: 0,
        totalProducts: 0,
        totalCustomers: 0,
        totalInvoices: 0,
        lowStockCount: 0,
        pendingShipments: 0,
      },
      recentActivities: [],
      monthlyData: [],

      refreshDashboard: async () => {
        const invoices = await db.invoices.toArray();
        const products = await db.products.toArray();
        const customers = await db.customers.toArray();
        const shipments = await db.shipments.toArray();
        const activities = await db.activities.reverse().limit(10).toArray();

        const totalRevenue = invoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.total, 0);

        const lowStockCount = products.filter(p => p.quantity <= p.minStock).length;
        const pendingShipments = shipments.filter(s => 
          s.status === 'pending' || s.status === 'in_transit' || s.status === 'customs'
        ).length;

        const monthlyMap = new Map();
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
          monthlyMap.set(key, { month: key, revenue: 0, expenses: 0, profit: 0 });
        }

        invoices.forEach(inv => {
          const date = new Date(inv.date);
          const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
          if (monthlyMap.has(key)) {
            const data = monthlyMap.get(key);
            if (inv.status === 'paid') {
              data.revenue += inv.total;
              data.profit += inv.total * 0.3;
            }
          }
        });

        set({
          stats: {
            totalRevenue,
            totalProducts: products.length,
            totalCustomers: customers.length,
            totalInvoices: invoices.length,
            lowStockCount,
            pendingShipments,
          },
          recentActivities: activities,
          monthlyData: Array.from(monthlyMap.values()),
        });
      },

      // UI State
      company: null,
      isSidebarOpen: true,
      theme: 'light',

      toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),

      setTheme: (theme: 'light' | 'dark') => set({ theme }),

      loadCompany: async () => {
        const company = await db.company.get(1);
        if (company) {
          set({ company });
        }
      },

      updateCompany: async (companyData: Partial<Company>) => {
        const company = await db.company.get(1);
        if (company) {
          await db.company.update(company.id!, {
            ...companyData,
            updatedAt: new Date(),
          });
          await get().loadCompany();
        }
      },
    }),
    {
      name: 'choice-app-storage',
      partialize: (state) => ({ 
        currentUser: state.currentUser, 
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
      }),
    }
  )
);
