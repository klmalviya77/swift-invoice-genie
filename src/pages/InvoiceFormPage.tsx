
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useApp } from '@/contexts/AppContext';
import { Invoice, InvoiceItem, hasEnoughStock } from '@/lib/storage';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const defaultInvoiceItem: InvoiceItem = {
  id: '',
  product: '',
  productId: '', // Add productId field
  qty: 1,
  rate: 0,
  amount: 0,
};

const InvoiceFormPage: React.FC = () => {
  const { invoiceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { parties, products, getInvoice, addInvoice, updateInvoice } = useApp();
  
  // Check if this is a purchase invoice
  const invoiceType = searchParams.get('type') || 'sales';
  const isPurchaseInvoice = invoiceType === 'purchase';
  
  const initialInvoice = invoiceId 
    ? getInvoice(invoiceId) 
    : {
        id: '',
        invoiceNumber: '',
        partyId: searchParams.get('partyId') || '',
        date: new Date().toISOString().substring(0, 10),
        items: [{ ...defaultInvoiceItem, id: crypto.randomUUID() }],
        subtotal: 0,
        gstPercentage: 18,
        gstAmount: 0,
        discount: 0,
        total: 0,
        paidAmount: 0,
        status: 'unpaid' as const,
      };
  
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stockWarnings, setStockWarnings] = useState<Record<string, string>>({});

  // Calculate totals whenever items, GST or discount changes
  useEffect(() => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = (subtotal * invoice.gstPercentage) / 100;
    const total = subtotal + gstAmount - invoice.discount;
    
    setInvoice(prev => ({
      ...prev,
      subtotal,
      gstAmount,
      total: Math.max(0, total), // Ensure total is not negative
    }));
  }, [invoice.items, invoice.gstPercentage, invoice.discount]);

  // Reset form if invoice ID changes
  useEffect(() => {
    if (invoiceId) {
      const existingInvoice = getInvoice(invoiceId);
      if (existingInvoice) {
        setInvoice(existingInvoice);
      } else {
        navigate('/invoices');
      }
    }
  }, [invoiceId, getInvoice, navigate]);

  // Check stock levels for customer invoices (sales)
  useEffect(() => {
    if (isPurchaseInvoice || invoiceId) return; // Skip for purchase invoices or existing invoices
    
    const newWarnings: Record<string, string> = {};
    
    invoice.items.forEach((item, index) => {
      if (item.productId) {
        const product = products.find(p => p.id === item.productId);
        if (product && item.qty > product.stock) {
          newWarnings[`items[${index}]`] = 
            `Warning: Requested quantity (${item.qty}) exceeds available stock (${product.stock} ${product.unit})`;
        }
      }
    });
    
    setStockWarnings(newWarnings);
  }, [invoice.items, products, isPurchaseInvoice, invoiceId]);

  const handlePartyChange = (partyId: string) => {
    setInvoice(prev => ({ ...prev, partyId }));
    
    // Clear party-related error
    if (errors.partyId) {
      setErrors(prev => {
        const { partyId, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleStatusChange = (checked: boolean) => {
    setInvoice(prev => ({
      ...prev,
      status: checked ? 'paid' : 'unpaid',
      paidAmount: checked ? prev.total : 0,
    }));
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'gstPercentage' || name === 'discount') {
      setInvoice(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setInvoice(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    
    if (product) {
      setInvoice(prev => {
        const updatedItems = [...prev.items];
        updatedItems[index] = {
          ...updatedItems[index],
          product: product.name,
          productId: product.id,
          rate: product.price,
          amount: product.price * updatedItems[index].qty,
          hsn: product.hsn
        };
        
        return { ...prev, items: updatedItems };
      });
      
      // Clear item-specific errors
      const errorKeys = [
        `items[${index}].product`,
        `items[${index}].rate`
      ];
      
      setErrors(prev => {
        const newErrors = { ...prev };
        errorKeys.forEach(key => {
          delete newErrors[key];
        });
        return newErrors;
      });
    }
  };

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setInvoice(prev => {
      const updatedItems = [...prev.items];
      
      if (name === 'qty' || name === 'rate') {
        const numValue = parseFloat(value) || 0;
        updatedItems[index] = {
          ...updatedItems[index],
          [name]: numValue,
          amount: name === 'qty' 
            ? numValue * updatedItems[index].rate
            : updatedItems[index].qty * numValue,
        };
      } else {
        updatedItems[index] = {
          ...updatedItems[index],
          [name]: value,
        };
      }
      
      return { ...prev, items: updatedItems };
    });
    
    // Clear item-specific error
    const errorKey = `items[${index}].${name}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const { [errorKey]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { ...defaultInvoiceItem, id: crypto.randomUUID() }],
    }));
  };

  const removeItem = (index: number) => {
    if (invoice.items.length > 1) {
      setInvoice(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
      
      // Remove any errors/warnings for this item
      const newErrors = { ...errors };
      const newWarnings = { ...stockWarnings };
      
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`items[${index}]`)) {
          delete newErrors[key];
        }
      });
      
      Object.keys(newWarnings).forEach(key => {
        if (key.startsWith(`items[${index}]`)) {
          delete newWarnings[key];
        }
      });
      
      setErrors(newErrors);
      setStockWarnings(newWarnings);
    } else {
      toast({
        title: "Cannot Remove",
        description: "An invoice must have at least one item.",
        variant: "destructive",
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!invoice.partyId) {
      newErrors.partyId = 'Please select a party';
    }
    
    if (!invoice.date) {
      newErrors.date = 'Please select a date';
    }
    
    invoice.items.forEach((item, index) => {
      if (!item.product) {
        newErrors[`items[${index}].product`] = 'Product name is required';
      }
      
      if (item.qty <= 0) {
        newErrors[`items[${index}].qty`] = 'Quantity must be greater than 0';
      }
      
      if (item.rate <= 0) {
        newErrors[`items[${index}].rate`] = 'Rate must be greater than 0';
      }
      
      // Check stock for customer invoices (if new invoice)
      if (!isPurchaseInvoice && !invoiceId && item.productId) {
        if (!hasEnoughStock(item.productId, item.qty)) {
          newErrors[`items[${index}].qty`] = `Not enough stock available. Please reduce quantity.`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Update paidAmount based on status
      const finalInvoice = {
        ...invoice,
        paidAmount: invoice.status === 'paid' ? invoice.total : 0
      };
      
      if (invoiceId) {
        updateInvoice(finalInvoice);
        toast({
          title: 'Invoice Updated',
          description: `Invoice ${invoice.invoiceNumber} has been updated successfully.`,
        });
      } else {
        const savedInvoice = addInvoice(finalInvoice);
        toast({
          title: 'Invoice Created',
          description: `Invoice ${savedInvoice.invoiceNumber} has been created successfully.`,
        });
      }
      
      // Redirect to appropriate page based on invoice type
      if (isPurchaseInvoice) {
        navigate(`/purchase-invoices`);
      } else {
        navigate(`/invoices/${invoiceId || invoice.id}`);
      }
    } else {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting.',
        variant: 'destructive',
      });
    }
  };

  // Filter parties based on invoice type
  const filteredParties = parties.filter(party => 
    isPurchaseInvoice ? party.type === 'supplier' : party.type === 'customer'
  );

  const getPartyOptions = () => {
    return filteredParties.map(party => (
      <SelectItem key={party.id} value={party.id}>
        {party.name} ({party.type})
      </SelectItem>
    ));
  };

  // Get available products with stock information
  const getProductOptions = (index: number) => {
    return products.map(product => {
      const isOutOfStock = !isPurchaseInvoice && product.stock <= 0;
      const isCurrentProduct = invoice.items[index].productId === product.id;
      
      // Only disable out of stock products for customer invoices and if not already selected
      const disabled = isOutOfStock && !isCurrentProduct && !isPurchaseInvoice;
      
      return (
        <option 
          key={product.id} 
          value={product.id}
          disabled={disabled}
        >
          {product.name} {!isPurchaseInvoice ? `(${product.stock} ${product.unit} available)` : ''} - ₹{product.price}
          {isOutOfStock && !isPurchaseInvoice ? ' - Out of stock' : ''}
        </option>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => isPurchaseInvoice ? navigate('/purchase-invoices') : navigate('/invoices')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {invoiceId 
              ? `Edit ${isPurchaseInvoice ? 'Purchase' : 'Sales'} Invoice` 
              : `Create ${isPurchaseInvoice ? 'Purchase' : 'Sales'} Invoice`}
          </h1>
          <p className="text-muted-foreground">
            {invoiceId 
              ? `Update an existing ${isPurchaseInvoice ? 'purchase' : 'sales'} invoice` 
              : isPurchaseInvoice 
                ? 'Create a new invoice for a supplier' 
                : 'Create a new invoice for a customer'}
          </p>
        </div>
      </div>

      {Object.keys(stockWarnings).length > 0 && !isPurchaseInvoice && !invoiceId && (
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-800" />
          <AlertTitle className="text-yellow-800">Low Stock Warning</AlertTitle>
          <AlertDescription className="text-yellow-800">
            Some items have insufficient stock. You can still create the invoice, but stock levels will be negative.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="partyId" className={errors.partyId ? 'text-destructive' : ''}>
              Select {isPurchaseInvoice ? 'Supplier' : 'Customer'}
            </Label>
            <Select value={invoice.partyId} onValueChange={handlePartyChange}>
              <SelectTrigger className={errors.partyId ? 'border-destructive' : ''}>
                <SelectValue placeholder={`Select a ${isPurchaseInvoice ? 'supplier' : 'customer'}`} />
              </SelectTrigger>
              <SelectContent>
                {filteredParties.length === 0 ? (
                  <SelectItem value="no-parties" disabled>
                    No {isPurchaseInvoice ? 'suppliers' : 'customers'} available. Please add one first.
                  </SelectItem>
                ) : (
                  getPartyOptions()
                )}
              </SelectContent>
            </Select>
            {errors.partyId && <p className="text-sm text-destructive">{errors.partyId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className={errors.date ? 'text-destructive' : ''}>
              Invoice Date
            </Label>
            <Input
              type="date"
              id="date"
              name="date"
              value={invoice.date}
              onChange={(e) => {
                setInvoice(prev => ({
                  ...prev,
                  date: e.target.value
                }));
                if (errors.date) {
                  setErrors(prev => {
                    const { date, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              className={errors.date ? 'border-destructive' : ''}
            />
            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Invoice Items</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addItem}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 pl-4 text-left font-medium">Product</th>
                  <th className="p-2 text-left font-medium w-20">Qty</th>
                  <th className="p-2 text-left font-medium w-32">Rate (₹)</th>
                  <th className="p-2 text-left font-medium w-32">Amount (₹)</th>
                  <th className="p-2 pr-4 text-right font-medium w-16">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2 pl-4">
                      <select
                        className={`flex h-10 w-full rounded-md border ${errors[`items[${index}].product`] ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background`}
                        value={item.productId || ''}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                      >
                        <option value="">Select a product</option>
                        {getProductOptions(index)}
                      </select>
                      {errors[`items[${index}].product`] && 
                        <p className="text-xs text-destructive mt-1">{errors[`items[${index}].product`]}</p>
                      }
                      {stockWarnings[`items[${index}]`] && 
                        <p className="text-xs text-yellow-600 mt-1">{stockWarnings[`items[${index}]`]}</p>
                      }
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        name="qty"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, e)}
                        min="1"
                        step="1"
                        className={errors[`items[${index}].qty`] ? 'border-destructive' : ''}
                      />
                      {errors[`items[${index}].qty`] && 
                        <p className="text-xs text-destructive mt-1">{errors[`items[${index}].qty`]}</p>
                      }
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        name="rate"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, e)}
                        min="0"
                        step="0.01"
                        className={errors[`items[${index}].rate`] ? 'border-destructive' : ''}
                      />
                      {errors[`items[${index}].rate`] && 
                        <p className="text-xs text-destructive mt-1">{errors[`items[${index}].rate`]}</p>
                      }
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={item.amount}
                        readOnly
                        className="bg-muted"
                      />
                    </td>
                    <td className="p-2 pr-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="paid-status" 
                checked={invoice.status === 'paid'} 
                onCheckedChange={handleStatusChange}
              />
              <Label htmlFor="paid-status" className="font-normal">
                Mark as Paid
              </Label>
            </div>
            {invoice.id && invoice.status === 'partial' && (
              <div className="mt-2 text-sm text-muted-foreground">
                This invoice has partial payments. View the invoice to see payment details or record additional payments.
              </div>
            )}
          </div>
          
          <div className="space-y-4 border rounded-md p-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>₹{invoice.subtotal.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="gstPercentage" className="font-normal text-muted-foreground">
                  GST (%):
                </Label>
                <Input
                  type="number"
                  id="gstPercentage"
                  name="gstPercentage"
                  value={invoice.gstPercentage}
                  onChange={(e) => {
                    setInvoice(prev => ({
                      ...prev,
                      gstPercentage: parseFloat(e.target.value) || 0
                    }));
                  }}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-24 text-right"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">GST Amount:</span>
                <span>₹{invoice.gstAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div className="space-y-2 border-t pt-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="discount" className="font-normal text-muted-foreground">
                  Discount:
                </Label>
                <Input
                  type="number"
                  id="discount"
                  name="discount"
                  value={invoice.discount}
                  onChange={(e) => {
                    setInvoice(prev => ({
                      ...prev,
                      discount: parseFloat(e.target.value) || 0
                    }));
                  }}
                  min="0"
                  step="0.01"
                  className="w-24 text-right"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t pt-2 font-bold">
              <span>Total:</span>
              <span>₹{invoice.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => isPurchaseInvoice ? navigate('/purchase-invoices') : navigate('/invoices')}
          >
            Cancel
          </Button>
          <Button type="submit">
            {invoiceId ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceFormPage;
