
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Outlet, useNavigate } from 'react-router-dom';

const TransactionsPage = () => {
  const navigate = useNavigate();

  const handleTabChange = (value: string) => {
    navigate(`/transactions/${value}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Money Transactions</h1>
        <p className="text-muted-foreground">Manage your payments and receipts</p>
      </div>

      <Tabs defaultValue="payment" onValueChange={handleTabChange}>
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
