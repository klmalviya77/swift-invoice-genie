
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Invoice, Return } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, 
  AlertCircle, 
  CreditCard, 
  Printer, 
  ArrowRight, 
  RotateCcw, 
  Share, 
  Mail, 
  Download, 
  Check, 
  X, 
  FileText,
  ChevronDown
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import html2pdf from 'html2pdf.js';

interface PaymentFormValues {
  amount: number;
  mode: 'cash' | 'bank_transfer' | 'upi' | 'cheque';
  description?: string;
  reference?: string;
}

// Extended Invoice interface with the missing properties
interface ExtendedInvoice extends Invoice {
  companyName?: string;
  companyAddress?: string;
  companyGST?: string;
  partyAddress?: string;
  partyGST?: string;
  notes?: string;
}

const InvoiceViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { invoices, parties, getParty, getInvoiceRemainingBalance, recordPartialPayment, returns, loading, updateInvoice } = useApp();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<ExtendedInvoice | null>(null);
  const [partyName, setPartyName] = useState<string>('');
  const [partyType, setPartyType] = useState<'customer' | 'supplier' | ''>('');
  const [remainingAmount, setRemainingAmount] = useState<number>(0);
  const [relatedReturns, setRelatedReturns] = useState<Return[]>([]);
  const [businessInfo, setBusinessInfo] = useState({
    name: 'BizSwift Enterprise',
    address: '123 Business Street, City, State, PIN',
    gst: '22AAAAA0000A1Z5'
  });
  const invoicePrintRef = useRef<HTMLDivElement>(null);
  
  // Get invoice details
  useEffect(() => {
    if (!invoiceId) return;
    
    const foundInvoice = invoices.find(inv => inv.id === invoiceId);
    if (foundInvoice) {
      // Cast to ExtendedInvoice to handle the extra properties
      const extInvoice = {...foundInvoice} as ExtendedInvoice;
      extInvoice.companyName = businessInfo.name;
      extInvoice.companyAddress = businessInfo.address;
      extInvoice.companyGST = businessInfo.gst;
      
      setInvoice(extInvoice);
      
      // Find related returns
      const invoiceReturns = returns.filter(ret => ret.invoiceId === invoiceId);
      setRelatedReturns(invoiceReturns);
      
      // Get party details
      const loadPartyDetails = async () => {
        if (foundInvoice.partyId) {
          const party = await getParty(foundInvoice.partyId);
          if (party) {
            setPartyName(party.name);
            setPartyType(party.type);
            
            // Update invoice with party details if available
            extInvoice.partyAddress = party.address;
            extInvoice.partyGST = party.gst;
            setInvoice({...extInvoice});
          }
        }
      };
      
      // Get remaining balance
      const loadRemainingBalance = async () => {
        const balance = await getInvoiceRemainingBalance(foundInvoice.id);
        setRemainingAmount(balance);
      };
      
      loadPartyDetails();
      loadRemainingBalance();
    }
  }, [invoiceId, invoices, getParty, getInvoiceRemainingBalance, returns, businessInfo]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const paymentForm = useForm<PaymentFormValues>({
    defaultValues: {
      amount: 0,
      mode: 'cash',
      description: '',
      reference: ''
    }
  });

  const handleRecordPayment = async (data: PaymentFormValues) => {
    if (!invoice) return;
    
    try {
      await recordPartialPayment(invoice.id, data.amount, {
        mode: data.mode,
        description: data.description,
        reference: data.reference
      });
      
      toast({
        title: "Success",
        description: "Payment recorded successfully"
      });
      
      // Refresh remaining amount
      const balance = await getInvoiceRemainingBalance(invoice.id);
      setRemainingAmount(balance);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive"
      });
    }
  };

  // Handle the mark as paid/unpaid functionality
  const handleStatusChange = async (status: 'paid' | 'unpaid') => {
    if (!invoice) return;
    
    try {
      const updatedInvoice = { 
        ...invoice, 
        status, 
        paidAmount: status === 'paid' ? invoice.total : 0 
      };
      
      await updateInvoice(updatedInvoice);
      setInvoice(updatedInvoice);
      setRemainingAmount(status === 'paid' ? 0 : invoice.total);
      
      toast({
        title: "Success",
        description: `Invoice marked as ${status}`
      });
    } catch (error) {
      console.error(`Error marking invoice as ${status}:`, error);
      toast({
        title: "Error",
        description: `Failed to mark invoice as ${status}`,
        variant: "destructive"
      });
    }
  };

  // Handle the print functionality
  const handlePrint = () => {
    if (!invoice) return;
    
    const printContent = document.getElementById('invoice-print-content');
    if (!printContent) return;
    
    const printStyles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .print-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .print-title { font-size: 24px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total-section { margin-top: 20px; text-align: right; }
        .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; }
        @media print {
          body { padding: 0mm; }
          button { display: none; }
        }
      </style>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Invoice Print</title>');
      printWindow.document.write(printStyles);
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      
      // Wait for the content to load before printing
      printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

  // Generate PDF functionality
  const generatePDF = () => {
    const element = document.getElementById('invoice-print-content');
    if (!element || !invoice) return;
    
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Invoice-${invoice.invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    toast({
      title: "Generating PDF",
      description: "Please wait..."
    });
    
    html2pdf().from(element).set(opt).save().then(() => {
      toast({
        title: "Success",
        description: "PDF downloaded successfully"
      });
    }).catch((error) => {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    });
  };

  // Share via email
  const shareViaEmail = () => {
    if (!invoice) return;
    
    const subject = encodeURIComponent(`Invoice #${invoice.invoiceNumber}`);
    const body = encodeURIComponent(
      `Dear ${partyName},\n\nPlease find attached invoice #${invoice.invoiceNumber} dated ${formatDate(invoice.date)} for amount ₹${invoice.total.toLocaleString('en-IN')}.\n\nRegards,\n${invoice.companyName || businessInfo.name}`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    if (!invoice) return;
    
    const text = encodeURIComponent(
      `Invoice #${invoice.invoiceNumber}\nDate: ${formatDate(invoice.date)}\nAmount: ₹${invoice.total.toLocaleString('en-IN')}\nStatus: ${invoice.status.toUpperCase()}`
    );
    
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Invoice Not Found</h1>
        <p className="mb-4">The invoice you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const returnsCard = (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl">Returns</CardTitle>
        <CardDescription>
          Returns associated with this invoice
        </CardDescription>
      </CardHeader>
      <CardContent>
        {relatedReturns.length > 0 ? (
          <div className="space-y-4">
            {relatedReturns.map(ret => (
              <div key={ret.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">
                      {ret.type === 'purchase' ? 'Purchase Return' : 'Sales Return'} #{ret.returnNumber}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(ret.date).toLocaleDateString()} - 
                      Items: {ret.items.reduce((sum, item) => sum + item.qty, 0)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium">₹{ret.total.toLocaleString('en-IN')}</span>
                    <Badge 
                      variant={ret.status === 'processed' ? 'default' : ret.status === 'pending' ? 'outline' : 'destructive'}
                      className="mt-1"
                    >
                      {ret.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-2 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/${ret.type}-returns/${ret.id}`)}
                  >
                    View Details <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <RotateCcw className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-2 font-medium">No returns found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No returns have been created for this invoice
            </p>
            
            {invoice && (
              <div className="mt-4 flex justify-center gap-2">
                {partyType === 'customer' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/sales-returns/new?invoice=${invoice.id}`)}
                  >
                    Create Sales Return
                  </Button>
                )}
                
                {partyType === 'supplier' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/purchase-returns/new?invoice=${invoice.id}`)}
                  >
                    Create Purchase Return
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Content for printing and PDF
  const invoicePrintContent = (
    <div id="invoice-print-content" className="p-8">
      <div className="print-header">
        <div>
          <div className="print-title">INVOICE</div>
          <div>Invoice #: {invoice.invoiceNumber}</div>
          <div>Date: {formatDate(invoice.date)}</div>
        </div>
        <div>
          <div>{invoice.companyName || businessInfo.name}</div>
          <div>{invoice.companyAddress || businessInfo.address}</div>
          <div>GST: {invoice.companyGST || businessInfo.gst}</div>
        </div>
      </div>
      
      <div className="print-party-info mt-4">
        <div>
          <strong>Bill To:</strong>
          <div>{partyName}</div>
          <div>{invoice.partyAddress || ''}</div>
          <div>{invoice.partyGST ? `GST: ${invoice.partyGST}` : ''}</div>
        </div>
      </div>
      
      <table className="w-full mt-6 border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2 bg-gray-100">Item</th>
            <th className="border border-gray-300 p-2 bg-gray-100">Quantity</th>
            <th className="border border-gray-300 p-2 bg-gray-100">Rate</th>
            <th className="border border-gray-300 p-2 bg-gray-100">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index}>
              <td className="border border-gray-300 p-2">{item.product}</td>
              <td className="border border-gray-300 p-2">{item.qty}</td>
              <td className="border border-gray-300 p-2">₹{item.rate.toFixed(2)}</td>
              <td className="border border-gray-300 p-2">₹{item.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="total-section mt-4 text-right">
        <div>Subtotal: ₹{invoice.subtotal.toFixed(2)}</div>
        <div>GST ({invoice.gstPercentage}%): ₹{invoice.gstAmount.toFixed(2)}</div>
        <div className="font-bold">Total: ₹{invoice.total.toFixed(2)}</div>
      </div>
      
      <div className="footer mt-8 pt-4 border-t border-gray-300">
        <div><strong>Payment Terms:</strong> {invoice.paymentTerm || 'N/A'}</div>
        <div><strong>Notes:</strong> {invoice.notes || ''}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Invoice Details</h1>
          <p className="text-muted-foreground">
            View and manage invoice #{invoice.invoiceNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Share className="mr-2 h-4 w-4" /> Share <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={shareViaWhatsApp}>
                <span className="mr-2">📱</span> Share via WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareViaEmail}>
                <Mail className="mr-2 h-4 w-4" /> Share via Email
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" /> Export <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={generatePDF}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                {invoice.status === 'paid' ? (
                  <><Check className="mr-2 h-4 w-4" /> Paid</>
                ) : (
                  <><X className="mr-2 h-4 w-4" /> Unpaid</>
                )}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleStatusChange('paid')}>
                <Check className="mr-2 h-4 w-4 text-green-500" /> Mark as Paid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('unpaid')}>
                <X className="mr-2 h-4 w-4 text-red-500" /> Mark as Unpaid
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="payment">Record Payment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Invoice Number</dt>
                    <dd className="mt-1 text-sm">{invoice.invoiceNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date</dt>
                    <dd className="mt-1 text-sm">{formatDate(invoice.date)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Party Name</dt>
                    <dd className="mt-1 text-sm">{partyName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm">
                      {invoice.status === 'paid' ? (
                        <Badge variant="default">Paid</Badge>
                      ) : invoice.status === 'partial' ? (
                        <Badge variant="secondary">Partial</Badge>
                      ) : (
                        <Badge variant="destructive">Unpaid</Badge>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                    <dd className="mt-1 text-sm font-bold">₹{invoice.total.toLocaleString('en-IN')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Remaining Amount</dt>
                    <dd className="mt-1 text-sm font-bold">₹{remainingAmount.toLocaleString('en-IN')}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Delivery By</dt>
                    <dd className="mt-1 text-sm">{invoice.deliveryBy || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Transport</dt>
                    <dd className="mt-1 text-sm">{invoice.transport || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Vehicle No</dt>
                    <dd className="mt-1 text-sm">{invoice.vehicleNo || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">E-way Bill No</dt>
                    <dd className="mt-1 text-sm">{invoice.eWayBillNo || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">PO Number</dt>
                    <dd className="mt-1 text-sm">{invoice.poNumber || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Payment Term</dt>
                    <dd className="mt-1 text-sm">{invoice.paymentTerm || 'N/A'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product}</TableCell>
                      <TableCell className="text-right">{item.qty}</TableCell>
                      <TableCell className="text-right">₹{item.rate.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{item.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 flex flex-col items-end">
                <div className="w-48 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({invoice.gstPercentage}%):</span>
                    <span>₹{invoice.gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>₹{invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {returnsCard}
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Record Payment</CardTitle>
              <CardDescription>
                Record a payment for this invoice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(handleRecordPayment)} className="space-y-4">
                  <FormField
                    control={paymentForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Mode</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit">Record Payment</Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">
                  Remaining amount: ₹{remainingAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Hidden print content - now visible with proper styling */}
      {invoicePrintContent}
    </div>
  );
};

export default InvoiceViewPage;
