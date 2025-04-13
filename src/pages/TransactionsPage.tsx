
import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const TransactionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab based on current URL
  const getActiveTab = () => {
    if (location.pathname.includes('receipt')) {
      return 'receipt';
    }
    return 'payment';
  };

  // Set default tab on component mount
  useEffect(() => {
    // If we're on the base transactions route without a sub-route, navigate to payment
    if (location.pathname === '/transactions') {
      navigate('/transactions/payment');
    }
  }, [location.pathname, navigate]);

  const handleTabChange = (value: string) => {
    navigate(`/transactions/${value}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Money Transactions</h1>
        <p className="text-muted-foreground">Manage your payments and receipts</p>
      </div>

      <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <Outlet />
        </div>
      </Tabs>
    </div>
  );
};

export default TransactionsPage;
