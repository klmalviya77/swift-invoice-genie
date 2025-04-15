
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useApp } from '@/contexts/AppContext';

const ReceiptPage = () => {
  const { toast } = useToast();
  const { parties, transactions, saveTransaction } = useApp();
  
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receiptMode, setReceiptMode] = useState('cash');
  const [description, setDescription] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [reference, setReference] = useState('');
  
  // Filter receipts from context transactions
  const receipts = transactions
    .filter(t => t.type === 'receipt')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const handleNewReceipt = () => {
    setShowForm(true);
  };
  
  const handleCancel = () => {
    setShowForm(false);
    // Reset form fields
    setAmount('');
    setReceiptDate(new Date().toISOString().slice(0, 10));
    setReceiptMode('cash');
    setDescription('');
    setSelectedPartyId('');
    setReference('');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!amount || !receiptDate || !selectedPartyId) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Create and save transaction
    const newReceipt = {
      id: crypto.randomUUID(),
      type: 'receipt' as const, // Type assertion to ensure it's the correct literal type
      amount: parseFloat(amount),
      date: receiptDate,
      partyId: selectedPartyId,
      mode: receiptMode as 'cash' | 'bank_transfer' | 'upi' | 'cheque',
      description: description,
      reference: reference,
      createdAt: new Date().toISOString()
    };
    
    // Use the context function to save the transaction
    saveTransaction(newReceipt);
    
    toast({
      title: "Success",
      description: "Receipt created successfully!",
    });
    
    // Close the form and reset fields
    handleCancel();
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get party name from ID
  const getPartyName = (partyId: string) => {
    const party = parties.find(p => p.id === partyId);
    return party ? party.name : 'Unknown Party';
  };

  // Filter parties to show only customers for receipts
  const customerParties = parties.filter(p => p.type === 'customer');

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
                <Label htmlFor="party">Received From*</Label>
                <Select 
                  value={selectedPartyId} 
                  onValueChange={setSelectedPartyId}
                  required
                >
                  <SelectTrigger id="party">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerParties.length === 0 ? (
                      <SelectItem value="no-parties" disabled>
                        No customers available
                      </SelectItem>
                    ) : (
                      customerParties.map(party => (
                        <SelectItem key={party.id} value={party.id}>
                          {party.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                <Label htmlFor="mode">Payment Mode</Label>
                <Select 
                  value={receiptMode} 
                  onValueChange={setReceiptMode}
                >
                  <SelectTrigger id="mode">
                    <SelectValue placeholder="Select payment mode" />
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
                <Label htmlFor="reference">Reference/Cheque No.</Label>
                <Input 
                  id="reference" 
                  placeholder="Enter reference number" 
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
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
            {receipts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No receipt transactions found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell>{formatDate(receipt.date)}</TableCell>
                        <TableCell>{getPartyName(receipt.partyId)}</TableCell>
                        <TableCell className="capitalize">{receipt.mode.replace('_', ' ')}</TableCell>
                        <TableCell>{receipt.reference || '-'}</TableCell>
                        <TableCell className="text-right font-medium">₹{receipt.amount.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReceiptPage;
