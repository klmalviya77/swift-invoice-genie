
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useInventoryStats } from '@/hooks/useInventoryStats';
import { ArrowUpRight, DollarSign, Package, Users, FileText, AlertTriangle, RotateCcw } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { parties, invoices, loading } = useApp();
  const { 
    lowStockCount, 
    outOfStockCount, 
    totalInventoryValue,
    pendingSalesReturns,
    pendingPurchaseReturns, 
    loading: statsLoading 
  } = useInventoryStats();
  
  // Calculate statistics
  const customerCount = parties.filter(party => party.type === 'customer').length;
  const supplierCount = parties.filter(party => party.type === 'supplier').length;
  
  const totalSales = invoices
    .filter(invoice => {
      const party = parties.find(p => p.id === invoice.partyId);
      return party && party.type === 'customer';
    })
    .reduce((sum, invoice) => sum + invoice.total, 0);
    
  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid' || inv.status === 'partial').length;
  
  const totalPendingReturns = pendingSalesReturns + pendingPurchaseReturns;

  if (loading || statsLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Get an overview of your business</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Party Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parties</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parties.length}</div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{customerCount} Customers</span>
              <span>{supplierCount} Suppliers</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/parties')}>
              <span>View All</span>
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Invoice Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{unpaidInvoices} Unpaid</span>
              <span>₹{totalSales.toLocaleString('en-IN')} Total Sales</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/invoices')}>
              <span>View All</span>
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Inventory Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalInventoryValue.toLocaleString('en-IN')}</div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{lowStockCount} Low Stock</span>
              <span>{outOfStockCount} Out of Stock</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/inventory')}>
              <span>View Inventory</span>
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Returns Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returns</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPendingReturns}</div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{pendingPurchaseReturns} Purchase Returns</span>
              <span>{pendingSalesReturns} Sales Returns</span>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1" onClick={() => navigate('/purchase-returns')}>
              <span>Purchase</span>
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="flex-1" onClick={() => navigate('/sales-returns')}>
              <span>Sales</span>
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Index;
