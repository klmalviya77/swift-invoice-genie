import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  FileText, 
  ShoppingCart,
  ArrowUp, 
  ArrowDown,
  DollarSign,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';

const Index = () => {
  const navigate = useNavigate();
  const { parties, invoices } = useApp();
  
  // Calculate totals
  const salesInvoices = invoices.filter(inv => 
    parties.find(p => p.id === inv.partyId)?.type === 'customer'
  );
  const purchaseInvoices = invoices.filter(inv => 
    parties.find(p => p.id === inv.partyId)?.type === 'supplier'
  );
  
  const totalSales = salesInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const outstandingAmount = salesInvoices
    .filter(inv => inv.status === 'unpaid')
    .reduce((sum, inv) => sum + inv.total, 0);

  // For quick actions cards
  const quickActions = [
    {
      title: 'Add',
      subtitle: 'Party',
      icon: UserPlus,
      actions: [
        {
          label: 'Add',
          onClick: () => navigate('/parties'),
        }
      ],
      details: [
        {
          label: 'Add new customer or supplier',
          action: null
        }
      ]
    },
    {
      title: 'Create',
      subtitle: 'Invoice',
      icon: DollarSign,
      actions: [
        {
          label: 'Generate',
          onClick: () => navigate('/invoices/new'),
        },
        {
          label: 'Create',
          onClick: () => navigate('/invoices/new'),
        }
      ],
      details: [
        {
          label: 'a new sales invoice',
          action: null
        }
      ]
    },
    {
      title: 'Purchase',
      subtitle: 'Entry',
      icon: ShoppingCart,
      actions: [
        {
          label: 'Record',
          onClick: () => navigate('/invoices/new'),
        },
        {
          label: 'Record',
          onClick: () => navigate('/invoices/new'),
        }
      ],
      details: [
        {
          label: 'a new purchase bill',
          action: null
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Business overview and quick actions</p>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                <div className="flex items-center">
                  <h3 className="text-2xl font-bold">₹{totalSales.toLocaleString('en-IN')}</h3>
                  <span className="ml-2 text-green-500 flex items-center">
                    <ArrowUp className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                <div className="flex items-center">
                  <h3 className="text-2xl font-bold">₹{totalPurchases.toLocaleString('en-IN')}</h3>
                  <span className="ml-2 text-red-500 flex items-center">
                    <ArrowDown className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
                <DollarSign className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                <div className="flex items-center">
                  <h3 className="text-2xl font-bold">₹{outstandingAmount.toLocaleString('en-IN')}</h3>
                  <span className="ml-2 text-green-500 flex items-center">
                    <span className="text-xs font-medium">7.8%</span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Parties</p>
                <div className="flex items-center">
                  <h3 className="text-2xl font-bold">{parties.length}</h3>
                  <span className="ml-2 text-green-500 flex items-center">
                    <span className="text-xs font-medium">3.1%</span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                    <action.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.subtitle}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {action.actions.map((btn, btnIdx) => (
                      <Button 
                        key={btnIdx} 
                        variant="outline" 
                        size="sm"
                        onClick={btn.onClick}
                      >
                        {btn.label}
                      </Button>
                    ))}
                  </div>
                  
                  {action.details.map((detail, detailIdx) => (
                    <div key={detailIdx} className="text-sm text-gray-500">
                      {detail.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
