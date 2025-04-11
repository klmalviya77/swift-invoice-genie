
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, PieChart, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';

const Index = () => {
  const navigate = useNavigate();
  const { parties, invoices, businessInfo } = useApp();
  
  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
  const totalSales = invoices
    .filter(inv => parties.find(p => p.id === inv.partyId)?.type === 'customer')
    .reduce((sum, inv) => sum + inv.total, 0);
  const totalPurchases = invoices
    .filter(inv => parties.find(p => p.id === inv.partyId)?.type === 'supplier')
    .reduce((sum, inv) => sum + inv.total, 0);

  const features = [
    {
      title: 'Parties',
      description: 'Manage customers and suppliers',
      icon: Users,
      path: '/parties',
      count: parties.length,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      title: 'Invoices',
      description: 'Create and manage invoices',
      icon: FileText,
      path: '/invoices',
      count: invoices.length,
      color: 'bg-green-100 text-green-700'
    },
    {
      title: 'Reports',
      description: 'View financial reports',
      icon: PieChart,
      path: '/reports',
      count: null,
      color: 'bg-purple-100 text-purple-700'
    },
    {
      title: 'Settings',
      description: 'Configure business details',
      icon: Settings,
      path: '/settings',
      count: null,
      color: 'bg-gray-100 text-gray-700'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{businessInfo.name}</h1>
          <p className="text-muted-foreground">Welcome to your business dashboard</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSales.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPurchases.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidInvoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Parties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parties.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Card key={feature.title} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${feature.color}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <CardTitle className="mt-4">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {feature.count !== null && (
                <p className="text-sm text-muted-foreground mb-4">
                  {feature.count} {feature.count === 1 ? 'entry' : 'entries'}
                </p>
              )}
              <Button onClick={() => navigate(feature.path)}>
                Go to {feature.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;
