
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PaymentPage = () => {
  const { toast } = useToast();
  
  const handleNewPayment = () => {
    toast({
      title: "Coming Soon",
      description: "Payment creation feature will be available soon!",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Payment History</h2>
        <Button onClick={handleNewPayment}>
          <Plus className="mr-2 h-4 w-4" /> New Payment
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No payment transactions found
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPage;
