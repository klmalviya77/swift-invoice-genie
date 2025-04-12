
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ReceiptPage = () => {
  const { toast } = useToast();
  
  const handleNewReceipt = () => {
    toast({
      title: "Coming Soon",
      description: "Receipt creation feature will be available soon!",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Receipt History</h2>
        <Button onClick={handleNewReceipt}>
          <Plus className="mr-2 h-4 w-4" /> New Receipt
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No receipt transactions found
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptPage;
