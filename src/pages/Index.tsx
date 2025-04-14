import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, BadgeDollarSign, CircleDollarSign, User, Users, IndianRupee, ShoppingCart, CalendarDays, LineChart, Receipt, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFC'];

const Index: React.FC = () => {
  const { invoices, parties, transactions } = useApp();
  const [invoiceStats, setInvoiceStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    pendingPercentage: 0,
  });
  const [partyStats, setPartyStats] = useState({
    total: 0,
    customers: 0,
    suppliers: 0,
    customersPercentage: 0,
  });

  const [salesData, setSalesData] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    const totalInvoices = invoices.length;
    const pendingInvoices = invoices.filter(i => i.status === 'unpaid' || i.status === 'partial').length;
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    
    const pendingAmount = invoices
      .filter(i => i.status === 'unpaid' || i.status === 'partial')
      .reduce((sum, invoice) => sum + (invoice.total - (invoice.paidAmount || 0)), 0);
    
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    
    setInvoiceStats({
      total: totalInvoices,
      pending: pendingInvoices,
      paid: paidInvoices,
      pendingPercentage: totalAmount > 0 ? Math.round((pendingAmount / totalAmount) * 100) : 0,
    });

    const totalParties = parties.length;
    const customers = parties.filter(p => p.type === 'customer').length;
    const suppliers = parties.filter(p => p.type === 'supplier').length;
    
    setPartyStats({
      total: totalParties,
      customers,
      suppliers,
      customersPercentage: totalParties > 0 ? Math.round((customers / totalParties) * 100) : 0,
    });

    const last6Months = new Date();
    last6Months.setMonth(last6Months.getMonth() - 5);
    
    const monthlySales: Record<string, number> = {};
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(last6Months);
      date.setMonth(date.getMonth() + i);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlySales[monthYear] = 0;
    }
    
    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.date);
      if (invoiceDate >= last6Months) {
        const monthYear = invoiceDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthlySales[monthYear] !== undefined) {
          monthlySales[monthYear] += invoice.total;
        }
      }
    });
    
    const chartData = Object.entries(monthlySales).map(([name, value]) => ({
      name,
      amount: value,
    }));
    
    setSalesData(chartData);
  }, [invoices, parties]);

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  const recentTransactions = transactions
    .filter(t => new Date(t.date) >= last30Days)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const totalReceived = recentTransactions
    .filter(t => t.type === 'receipt')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalPaid = recentTransactions
    .filter(t => t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);

  const transactionPieData = [
    { name: 'Receipts', value: totalReceived },
    { name: 'Payments', value: totalPaid },
  ];

  const topCustomers = [...parties]
    .filter(p => p.type === 'customer')
    .map(customer => {
      const customerInvoices = invoices.filter(i => i.partyId === customer.id);
      const totalAmount = customerInvoices.reduce((sum, i) => sum + i.total, 0);
      return {
        id: customer.id,
        name: customer.name,
        amount: totalAmount,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Link to="/invoices/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Create Invoice
          </Link>
        </div>
      </div>
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sales
                </CardTitle>
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{invoices
                  .filter(i => {
                    const party = parties.find(p => p.id === i.partyId);
                    return party && party.type === 'customer';
                  })
                  .reduce((sum, i) => sum + i.total, 0)
                  .toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total sales from customer invoices
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Outstanding
                </CardTitle>
                <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{invoices
                  .filter(i => {
                    if (i.status === 'unpaid' || i.status === 'partial') {
                      const party = parties.find(p => p.id === i.partyId);
                      return party && party.type === 'customer';
                    }
                    return false;
                  })
                  .reduce((sum, i) => sum + (i.total - (i.paidAmount || 0)), 0)
                  .toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {invoiceStats.pendingPercentage}% of total amount
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Parties
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{partyStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {partyStats.customersPercentage}% are customers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recent Payments
                </CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalReceived.toLocaleString('en-IN')}</div>
                <p className="text-xs text-muted-foreground">
                  +₹{totalReceived.toLocaleString('en-IN')} in last 30 days
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>
                  Monthly sales for the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tickFormatter={(value) => value.split(' ')[0]}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="#4f46e5" name="Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Payment activity in the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={transactionPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {transactionPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-[#0088FE] mr-2"></div>
                    <div className="flex-1 flex justify-between">
                      <span>Receipts</span>
                      <span>₹{totalReceived.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-[#00C49F] mr-2"></div>
                    <div className="flex-1 flex justify-between">
                      <span>Payments</span>
                      <span>₹{totalPaid.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Top 5 customers by sales volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCustomers.length > 0 ? (
                    topCustomers.map((customer, index) => (
                      <div key={customer.id} className="flex items-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{customer.amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="ml-auto font-medium">#{index + 1}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No customer data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Recent payment activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.slice(0, 5).map(transaction => {
                    const party = parties.find(p => p.id === transaction.partyId);
                    return (
                      <div key={transaction.id} className="flex items-center">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                          transaction.type === 'receipt' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'receipt' ? (
                            <Receipt className="h-5 w-5 text-green-600" />
                          ) : (
                            <CreditCard className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {party ? party.name : 'Unknown Party'}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`ml-auto font-medium ${
                          transaction.type === 'receipt' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'receipt' ? '+' : '-'}
                          ₹{transaction.amount.toLocaleString('en-IN')}
                        </div>
                      </div>
                    );
                  })}

                  {recentTransactions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent transactions</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Invoice Status</CardTitle>
                <CardDescription>Paid vs. unpaid invoices</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Paid', value: invoiceStats.paid },
                        { name: 'Partial', value: invoices.filter(i => i.status === 'partial').length },
                        { name: 'Unpaid', value: invoices.filter(i => i.status === 'unpaid').length }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-[#10b981] mr-2"></div>
                    <div className="flex-1 flex justify-between">
                      <span>Paid</span>
                      <span>{invoiceStats.paid}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-[#f59e0b] mr-2"></div>
                    <div className="flex-1 flex justify-between">
                      <span>Partial</span>
                      <span>{invoices.filter(i => i.status === 'partial').length}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-[#ef4444] mr-2"></div>
                    <div className="flex-1 flex justify-between">
                      <span>Unpaid</span>
                      <span>{invoices.filter(i => i.status === 'unpaid').length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
