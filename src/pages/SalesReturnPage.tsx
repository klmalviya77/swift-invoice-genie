
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Return, ReturnItem, Party, Invoice, Product } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { PackageOpen, Plus, Trash2 } from 'lucide-react';

interface FormValues {
  customer: string;
  invoice: string;
  date: string;
  notes: string;
}

const SalesReturnPage: React.FC = () => {
  const navigate = useNavigate();
  const { parties, invoices, products, saveReturn, loading } = useApp();
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  const [partyInvoices, setPartyInvoices] = useState<Invoice[]>([]);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  const customers = parties.filter(party => party.type === 'customer');
  
  const form = useForm<FormValues>({
    defaultValues: {
      customer: '',
      invoice: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    }
  });

  // Filter invoices when customer changes
  useEffect(() => {
    if (selectedParty) {
      const filteredInvoices = invoices.filter(invoice => invoice.partyId === selectedParty);
      setPartyInvoices(filteredInvoices);
      
      // Clear selected invoice if it's not from this customer
      if (selectedInvoice && !filteredInvoices.some(inv => inv.id === selectedInvoice)) {
        setSelectedInvoice('');
        form.setValue('invoice', '');
      }
    } else {
      setPartyInvoices([]);
      setSelectedInvoice('');
      form.setValue('invoice', '');
    }
  }, [selectedParty, invoices, form, selectedInvoice]);
  
  // Update available products when invoice changes
  useEffect(() => {
    if (selectedInvoice) {
      const invoice = invoices.find(inv => inv.id === selectedInvoice);
      if (invoice) {
        // Get only products that were in this invoice
        const invoiceProductIds = invoice.items.map(item => item.productId);
        const productsInInvoice = products.filter(product => 
          invoiceProductIds.includes(product.id)
        );
        setAvailableProducts(productsInInvoice);
        
        // Pre-fill any existing items
        const prefilledItems = invoice.items.map(item => ({
          id: crypto.randomUUID(),
          productId: item.productId,
          product: item.product,
          qty: 0, // Default to 0
          rate: item.rate,
          amount: 0,
          hsn: item.hsn
        }));
        setReturnItems(prefilledItems);
      }
    } else {
      setAvailableProducts(products);
      setReturnItems([]);
    }
  }, [selectedInvoice, invoices, products]);

  const handlePartyChange = (value: string) => {
    setSelectedParty(value);
    form.setValue('customer', value);
  };

  const handleInvoiceChange = (value: string) => {
    setSelectedInvoice(value);
    form.setValue('invoice', value);
    
    // Set date to invoice date if an invoice is selected
    const selectedInv = invoices.find(inv => inv.id === value);
    if (selectedInv) {
      form.setValue('date', selectedInv.date);
    }
  };

  const addItem = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if this product is already in the list
    const existingItemIndex = returnItems.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...returnItems];
      updatedItems[existingItemIndex].qty = quantity;
      updatedItems[existingItemIndex].amount = quantity * updatedItems[existingItemIndex].rate;
      setReturnItems(updatedItems);
    } else {
      // Add new item
      const newItem: ReturnItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        product: product.name,
        qty: quantity,
        rate: product.price,
        amount: quantity * product.price,
        hsn: product.hsn
      };
      setReturnItems([...returnItems, newItem]);
    }
    
    setShowAddItemDialog(false);
  };

  const removeItem = (id: string) => {
    setReturnItems(returnItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return returnItems.reduce((total, item) => total + item.amount, 0);
  };

  const calculateGST = (subtotal: number) => {
    // Get GST percentage from the invoice or use a default
    const invoice = invoices.find(inv => inv.id === selectedInvoice);
    const gstPercentage = invoice ? invoice.gstPercentage : 18;
    return (subtotal * gstPercentage) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const gst = calculateGST(subtotal);
    return subtotal + gst;
  };

  const onSubmit = async (data: FormValues) => {
    if (returnItems.length === 0) {
      toast({
        title: "Error",
        description: "You need to add at least one item to return",
        variant: "destructive"
      });
      return;
    }

    try {
      const invoice = invoices.find(inv => inv.id === selectedInvoice);
      
      const salesReturn: Return = {
        id: crypto.randomUUID(),
        returnNumber: '', // Will be generated by storage.ts
        date: data.date,
        invoiceId: selectedInvoice || undefined,
        invoiceNumber: invoice?.invoiceNumber,
        partyId: selectedParty,
        items: returnItems,
        subtotal: calculateSubtotal(),
        gstPercentage: invoice?.gstPercentage || 18,
        gstAmount: calculateGST(calculateSubtotal()),
        total: calculateTotal(),
        status: 'pending',
        notes: data.notes,
        type: 'sales'
      };

      await saveReturn(salesReturn);
      
      toast({
        title: "Success",
        description: "Sales return created successfully"
      });
      
      navigate('/sales-returns');
    } catch (error) {
      console.error('Error creating sales return:', error);
      toast({
        title: "Error",
        description: "Failed to create sales return",
        variant: "destructive"
      });
    }
  };

  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [returnQuantity, setReturnQuantity] = useState<number>(1);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Sales Return</h1>
        <p className="text-muted-foreground">Create a new sales return for items returned by customers</p>
      </div>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Return Details</CardTitle>
              <CardDescription>
                Fill in the details for this sales return
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select 
                        value={selectedParty} 
                        onValueChange={handlePartyChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice (Optional)</FormLabel>
                      <Select 
                        value={selectedInvoice} 
                        onValueChange={handleInvoiceChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select invoice" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No invoice (Direct return)</SelectItem>
                          {partyInvoices.map(invoice => (
                            <SelectItem key={invoice.id} value={invoice.id}>
                              {invoice.invoiceNumber} ({new Date(invoice.date).toLocaleDateString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Return Items</h3>
                  <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Return Item</DialogTitle>
                        <DialogDescription>
                          Select a product and specify the quantity to return
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <FormLabel htmlFor="product">Product</FormLabel>
                          <Select 
                            value={selectedProduct} 
                            onValueChange={setSelectedProduct}
                          >
                            <SelectTrigger id="product">
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProducts.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <FormLabel htmlFor="quantity">Quantity</FormLabel>
                          <Input 
                            id="quantity" 
                            type="number" 
                            min="1" 
                            value={returnQuantity} 
                            onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 0)} 
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => addItem(selectedProduct, returnQuantity)}
                          disabled={!selectedProduct || returnQuantity <= 0}
                        >
                          Add Item
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {returnItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returnItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product}</TableCell>
                          <TableCell className="text-right">
                            <Input 
                              type="number" 
                              min="1" 
                              value={item.qty} 
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 0;
                                const updatedItems = returnItems.map(i => 
                                  i.id === item.id 
                                    ? { ...i, qty, amount: qty * i.rate } 
                                    : i
                                );
                                setReturnItems(updatedItems);
                              }}
                              className="w-20 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">₹{item.rate.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{item.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <PackageOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">No items added</h3>
                    <p className="text-muted-foreground mt-2">
                      Add items to this return using the Add Item button
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-col items-end">
                  <div className="w-48 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST:</span>
                      <span>₹{calculateGST(calculateSubtotal()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any additional notes about this return"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => navigate('/sales-returns')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={returnItems.length === 0}>
                Create Return
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default SalesReturnPage;
