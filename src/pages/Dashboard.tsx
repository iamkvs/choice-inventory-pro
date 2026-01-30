import { useEffect } from 'react';
import {
  DollarSign,
  Package,
  Users,
  FileText,
  AlertTriangle,
  Ship,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { db } from '@/db/database';
import { useLiveQuery } from 'dexie-react-hooks';

const COLORS = ['#0082f3', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Dashboard() {
  const { stats, refreshDashboard, monthlyData, recentActivities } = useAppStore();

  // Live queries for real-time updates
  const lowStockProducts = useLiveQuery(
    async () => {
      const products = await db.products.toArray();
      return products.filter(p => p.quantity <= p.minStock);
    },
    []
  );

  const recentInvoices = useLiveQuery(
    () => db.invoices.reverse().limit(5).toArray(),
    []
  );

  useEffect(() => {
    refreshDashboard();
  }, []);

  // Calculate profit/loss data
  const profitLossData = monthlyData.map((d: { month: string; profit: number; revenue: number }) => ({
    month: d.month,
    profit: d.profit,
    revenue: d.revenue,
  }));

  // Stock status data for pie chart
  const stockData = [
    { name: 'In Stock', value: stats.totalProducts - (lowStockProducts?.length || 0) },
    { name: 'Low Stock', value: lowStockProducts?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back! Here&apos;s what&apos;s happening with your business.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          description="Lifetime revenue"
          icon={DollarSign}
          trend="up"
          trendValue="12%"
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Products"
          value={stats.totalProducts}
          description="Active SKUs"
          icon={Package}
          iconClassName="bg-green-100 text-green-600"
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          description="Total customers"
          icon={Users}
          trend="up"
          trendValue="5%"
          iconClassName="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Invoices"
          value={stats.totalInvoices}
          description="Total invoices"
          icon={FileText}
          iconClassName="bg-orange-100 text-orange-600"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStockCount}
          description="Items to reorder"
          icon={AlertTriangle}
          trend={stats.lowStockCount > 0 ? 'down' : 'neutral'}
          iconClassName={cn(
            'bg-red-100 text-red-600',
            stats.lowStockCount === 0 && 'bg-gray-100 text-gray-600'
          )}
        />
        <StatCard
          title="Shipments"
          value={stats.pendingShipments}
          description="In transit"
          icon={Ship}
          iconClassName="bg-cyan-100 text-cyan-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit/Loss Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Profit & Loss Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitLossData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Bar dataKey="revenue" fill="#0082f3" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stock Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Stock Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stockData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stockData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {stockData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices?.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{invoice.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">${invoice.total.toFixed(2)}</p>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        invoice.status === 'paid' && 'bg-green-100 text-green-700',
                        invoice.status === 'sent' && 'bg-yellow-100 text-yellow-700',
                        invoice.status === 'overdue' && 'bg-red-100 text-red-700',
                        invoice.status === 'draft' && 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!recentInvoices || recentInvoices.length === 0) && (
                <p className="text-center text-gray-500 py-4">No invoices yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                      activity.type === 'sale' && 'bg-green-100 text-green-600',
                      activity.type === 'purchase' && 'bg-blue-100 text-blue-600',
                      activity.type === 'shipment' && 'bg-cyan-100 text-cyan-600',
                      activity.type === 'payment' && 'bg-purple-100 text-purple-600',
                      activity.type === 'adjustment' && 'bg-orange-100 text-orange-600'
                    )}
                  >
                    {activity.type === 'sale' && <TrendingUp className="h-4 w-4" />}
                    {activity.type === 'purchase' && <TrendingDown className="h-4 w-4" />}
                    {activity.type === 'shipment' && <Ship className="h-4 w-4" />}
                    {activity.type === 'payment' && <DollarSign className="h-4 w-4" />}
                    {activity.type === 'adjustment' && <Package className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{activity.userName}</span>
                      <span>•</span>
                      <span>{new Date(activity.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {activity.amount && (
                    <span className="text-sm font-medium">
                      ${activity.amount.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
              {recentActivities.length === 0 && (
                <p className="text-center text-gray-500 py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
