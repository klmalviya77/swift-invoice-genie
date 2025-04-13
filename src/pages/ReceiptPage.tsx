
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ReceiptPage = () => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [receiptMode, setReceiptMode] = useState('cash');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [description, setDescription] = useState('');
  
  const handleNewReceipt = () => {
    setShowForm(true);
  };
  
  const handleCancel = () => {
    setShowForm(false);
    // Reset form fields
    setAmount('');
    setReceiptDate('');
    setReceiptMode('cash');
    setReceivedFrom('');
    setDescription('');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!amount || !receiptDate) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Here you would typically save the receipt to a database
    // For now, just show a success message
    toast({
      title: "Success",
      description: "Receipt created successfully!",
    });
    
    // Close the form and reset fields
    handleCancel();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Receipt History</h2>
        {!showForm && (
          <Button onClick={handleNewReceipt}>
            <Plus className="mr-2 h-4 w-4" /> New Receipt
          </Button>
        )}
      </div>
      
      {showForm ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium">Create New Receipt</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="receivedFrom">Received From</Label>
                <Input 
                  id="receivedFrom" 
                  placeholder="Enter name" 
                  value={receivedFrom}
                  onChange={(e) => setReceivedFrom(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (₹)*</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="Enter amount" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="date">Date*</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="mode">Receipt Mode</Label>
                <Select 
                  value={receiptMode} 
                  onValueChange={setReceiptMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select receipt mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  placeholder="Enter description" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" type="button" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Receipt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
};

export default ReceiptPage;
