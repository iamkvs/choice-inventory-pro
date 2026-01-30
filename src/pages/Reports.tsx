import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Download } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const COLORS = ['#0082f3', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Reports() {
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filterBy, setFilterBy] = useState('all');
  const [selectedItem, setSelectedItem] = useState('');

  const invoices = useLiveQuery(() => db.invoices.toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);

  // Filter invoices by date range
  const filteredInvoices = invoices?.filter(inv => {
    const invDate = new Date(inv.date);
    return isWithinInterval(invDate, { start: parseISO(startDate), end: parseISO(endDate) });
  }) || [];

  // Apply additional filters
  const finalInvoices = filteredInvoices.filter(inv => {
    if (filterBy === 'customer' && selectedItem) {
      return inv.customerId === Number(selectedItem);
    }
    return true;
  });

  // Calculate statistics
  const totalRevenue = finalInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalPending = finalInvoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalOverdue = finalInvoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0);

  const estimatedProfit = totalRevenue * 0.3; // Estimated 30% profit margin

  // Prepare chart data
  const dailyData = new Map();
  finalInvoices.forEach(inv => {
    const date = format(new Date(inv.date), 'MMM dd');
    const existing = dailyData.get(date) || { date, revenue: 0, profit: 0 };
    if (inv.status === 'paid') {
      existing.revenue += inv.total;
      existing.profit += inv.total * 0.3;
    }
    dailyData.set(date, existing);
  });
  const chartData = Array.from(dailyData.values()).slice(-30);

  // Top customers
  const customerTotals = new Map();
  finalInvoices.forEach(inv => {
    if (inv.status === 'paid') {
      const existing = customerTotals.get(inv.customerId) || { name: inv.customerName, total: 0 };
      existing.total += inv.total;
      customerTotals.set(inv.customerId, existing);
    }
  });
  const topCustomers = Array.from(customerTotals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Status distribution
  const statusData = [
    { name: 'Paid', value: finalInvoices.filter(i => i.status === 'paid').length },
    { name: 'Pending', value: finalInvoices.filter(i => i.status === 'sent').length },
    { name: 'Overdue', value: finalInvoices.filter(i => i.status === 'overdue').length },
    { name: 'Draft', value: finalInvoices.filter(i => i.status === 'draft').length },
  ].filter(d => d.value > 0);

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    const now = new Date();
    switch (value) {
      case 'week':
        setStartDate(format(subDays(now, 7), 'yyyy-MM-dd'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'year':
        setStartDate(format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'));
        setEndDate(format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'));
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Track your business performance and profit/loss</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>From</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Filter By</Label>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterBy === 'customer' && (
              <div className="space-y-2">
                <Label>Select Customer</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => (
                      <SelectItem key={c.id} value={c.id!.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Estimated Profit</p>
                <p className="text-2xl font-bold text-green-600">${estimatedProfit.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">${totalPending.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">${totalOverdue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Profit Trend</CardTitle>
            <CardDescription>Daily revenue and estimated profit</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
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

        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
            <CardDescription>Breakdown of invoice statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {statusData.map((entry, index) => (
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

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
          <CardDescription>Customers with highest purchase amounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#0082f3] rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium">{customer.name}</span>
                </div>
                <span className="font-bold text-[#0082f3]">${customer.total.toLocaleString()}</span>
              </div>
            ))}
            {topCustomers.length === 0 && (
              <p className="text-center text-gray-500 py-4">No data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
