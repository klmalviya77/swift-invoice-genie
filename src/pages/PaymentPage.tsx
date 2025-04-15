
import React, { useState, useEffect } from 'react';
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

const PaymentPage = () => {
  const { toast } = useToast();
  const { parties, transactions, saveTransaction } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState('cash');
  const [description, setDescription] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [reference, setReference] = useState('');
  
  // We're now using transactions directly from the App context instead of local state
  // This ensures real-time updates across all components
  const payments = transactions
    .filter(t => t.type === 'payment')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const handleNewPayment = () => {
    setShowForm(true);
  };
  
  const handleCancel = () => {
    setShowForm(false);
    // Reset form fields
    setAmount('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMode('cash');
    setDescription('');
    setSelectedPartyId('');
    setReference('');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!amount || !paymentDate || !selectedPartyId) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Create and save transaction
    const newPayment = {
      id: crypto.randomUUID(),
      type: 'payment',
      amount: parseFloat(amount),
      date: paymentDate,
      partyId: selectedPartyId,
      mode: paymentMode as 'cash' | 'bank_transfer' | 'upi' | 'cheque',
      description: description,
      reference: reference,
      createdAt: new Date().toISOString()
    };
    
    // Use the context function to save the transaction and update state everywhere
    saveTransaction(newPayment);
    
    toast({
      title: "Success",
      description: "Payment created successfully!",
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Payment History</h2>
        {!showForm && (
          <Button onClick={handleNewPayment}>
            <Plus className="mr-2 h-4 w-4" /> New Payment
          </Button>
        )}
      </div>
      
      {showForm ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium">Create New Payment</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="party">Pay To*</Label>
                <Select 
                  value={selectedPartyId} 
                  onValueChange={setSelectedPartyId}
                  required
                >
                  <SelectTrigger id="party">
                    <SelectValue placeholder="Select party" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.length === 0 ? (
                      <SelectItem value="no-parties" disabled>
                        No parties available
                      </SelectItem>
                    ) : (
                      parties.map(party => (
                        <SelectItem key={party.id} value={party.id}>
                          {party.name} ({party.type})
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
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="mode">Payment Mode</Label>
                <Select 
                  value={paymentMode} 
                  onValueChange={setPaymentMode}
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
                  Save Payment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payment transactions found
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
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell>{getPartyName(payment.partyId)}</TableCell>
                        <TableCell className="capitalize">{payment.mode.replace('_', ' ')}</TableCell>
                        <TableCell>{payment.reference || '-'}</TableCell>
                        <TableCell className="text-right font-medium">₹{payment.amount.toLocaleString('en-IN')}</TableCell>
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

export default PaymentPage;
