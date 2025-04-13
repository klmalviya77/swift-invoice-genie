
import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Phone, 
  Mail, 
  Edit,
  CreditCard,
  IndianRupee
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Transaction } from '@/lib/storage';

const InvoiceViewPage: React.FC = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    getInvoice, 
    getParty, 
    businessInfo, 
    updateInvoice, 
    getTransactionsByInvoice,
    getInvoiceRemainingBalance,
    recordPartialPayment
  } = useApp();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [isPartialPaymentOpen, setIsPartialPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank_transfer' | 'upi' | 'cheque'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  
  const invoice = invoiceId ? getInvoice(invoiceId) : null;
  const party = invoice ? getParty(invoice.partyId) : null;
  const transactions = invoiceId ? getTransactionsByInvoice(invoiceId) : [];
  const remainingBalance = invoiceId ? getInvoiceRemainingBalance(invoiceId) : 0;
  
  if (!invoice || !party) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h1 className="text-2xl font-bold mb-4">Invoice Not Found</h1>
        <p className="text-gray-600 mb-6">The invoice you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/invoices')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
        </Button>
      </div>
    );
  }

  // Calculate due date (15 days from invoice date)
  const invoiceDate = new Date(invoice.date);
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 15);
  const dueDateStr = dueDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (printRef.current) {
      const options = {
        margin: [10, 10, 10, 10],
        filename: `Invoice-${invoice.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      toast({
        title: 'Generating PDF',
        description: 'Your PDF is being generated...',
      });

      html2pdf().from(printRef.current).set(options).save().then(() => {
        toast({
          title: 'PDF Generated',
          description: 'Your PDF has been successfully downloaded.',
        });
      });
    }
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `Invoice: ${invoice.invoiceNumber}\n` +
      `Date: ${new Date(invoice.date).toLocaleDateString()}\n` +
      `Amount: ₹${invoice.total.toLocaleString('en-IN')}\n` +
      `Status: ${invoice.status.toUpperCase()}\n\n` +
      `Please check your email for the detailed invoice or contact us for any queries.`
    );
    
    window.open(`https://wa.me/91${party.mobile}?text=${message}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber} from ${businessInfo.name}`);
    const body = encodeURIComponent(
      `Dear ${party.name},\n\n` +
      `Please find the details of your invoice:\n\n` +
      `Invoice Number: ${invoice.invoiceNumber}\n` +
      `Date: ${new Date(invoice.date).toLocaleDateString()}\n` +
      `Amount: ₹${invoice.total.toLocaleString('en-IN')}\n` +
      `Status: ${invoice.status.toUpperCase()}\n\n` +
      `Item Details:\n` +
      invoice.items.map(item => 
        `- ${item.product}: ${item.qty} x ₹${item.rate} = ₹${item.amount}`
      ).join('\n') +
      `\n\nSubtotal: ₹${invoice.subtotal.toLocaleString('en-IN')}\n` +
      `GST (${invoice.gstPercentage}%): ₹${invoice.gstAmount.toLocaleString('en-IN')}\n` +
      `Discount: ₹${invoice.discount.toLocaleString('en-IN')}\n` +
      `Total: ₹${invoice.total.toLocaleString('en-IN')}\n\n` +
      `For any questions, please contact us at:\n` +
      `Phone: ${businessInfo.phone}\n` +
      `Email: ${businessInfo.email}\n\n` +
      `Thank you for your business!\n\n` +
      `Regards,\n${businessInfo.name}`
    );
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const togglePaymentStatus = () => {
    const updatedInvoice = { 
      ...invoice, 
      status: invoice.status === 'paid' ? 'unpaid' as const : 'paid' as const,
      paidAmount: invoice.status === 'paid' ? 0 : invoice.total 
    };
    updateInvoice(updatedInvoice);
    
    toast({
      title: 'Payment Status Updated',
      description: `Invoice marked as ${updatedInvoice.status.toUpperCase()}.`,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  const handlePartialPayment = () => {
    if (!paymentAmount || paymentAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount.',
        variant: 'destructive',
      });
      return;
    }
    
    if (paymentAmount > remainingBalance) {
      toast({
        title: 'Amount Too High',
        description: `Maximum payment amount is ₹${remainingBalance.toLocaleString('en-IN')}`,
        variant: 'destructive',
      });
      return;
    }
    
    recordPartialPayment(
      invoice.id,
      paymentAmount,
      {
        mode: paymentMode,
        reference: paymentReference,
        description: paymentDescription || `Partial payment for invoice ${invoice.invoiceNumber}`
      }
    );
    
    toast({
      title: 'Payment Recorded',
      description: `₹${paymentAmount.toLocaleString('en-IN')} payment has been recorded.`,
    });
    
    // Reset form and close dialog
    setPaymentAmount(0);
    setPaymentReference('');
    setPaymentDescription('');
    setIsPartialPaymentOpen(false);
  };

  const isPurchaseInvoice = party.type === 'supplier';
  const invoiceTitle = isPurchaseInvoice ? 'PURCHASE BILL' : 'TAX INVOICE';
  
  // Calculate taxable amount (subtotal - discount)
  const taxableAmount = invoice.subtotal - invoice.discount;
  // Calculate CGST and SGST (half of GST each)
  const cgstAmount = invoice.gstAmount / 2;
  const sgstAmount = invoice.gstAmount / 2;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center no-print">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/invoices')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isPurchaseInvoice ? 'Purchase Bill' : 'Invoice'} {invoice.invoiceNumber}
            </h1>
            <p className="text-muted-foreground">
              {formatDate(invoice.date)}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {invoice.status !== 'paid' && (
            <Dialog open={isPartialPaymentOpen} onOpenChange={setIsPartialPaymentOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" /> Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>
                    Record a payment for Invoice #{invoice.invoiceNumber}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="amount"
                        placeholder="0.00"
                        type="number"
                        className="pl-9"
                        value={paymentAmount || ''}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        max={remainingBalance}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Remaining balance: ₹{remainingBalance.toLocaleString('en-IN')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentMode">Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={(value) => setPaymentMode(value as any)}>
                      <SelectTrigger>
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference Number</Label>
                    <Input
                      id="reference"
                      placeholder="Transaction ID, Cheque number, etc."
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Additional notes about this payment"
                      value={paymentDescription}
                      onChange={(e) => setPaymentDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPartialPaymentOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handlePartialPayment}>
                    Record Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" onClick={togglePaymentStatus}>
            Mark as {invoice.status === 'paid' ? 'Unpaid' : 'Paid'}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/invoices/edit/${invoice.id}`)}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
          {party.mobile && (
            <Button variant="outline" onClick={handleWhatsAppShare}>
              <Phone className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
          )}
          <Button variant="outline" onClick={handleEmailShare}>
            <Mail className="mr-2 h-4 w-4" /> Email
          </Button>
        </div>
      </div>

      {/* Payment Transactions */}
      {transactions.length > 0 && (
        <div className="border rounded-md p-4 no-print">
          <h2 className="text-lg font-medium mb-3">Payment History</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell className="capitalize">{transaction.mode.replace('_', ' ')}</TableCell>
                  <TableCell>{transaction.reference || '-'}</TableCell>
                  <TableCell>{transaction.description || '-'}</TableCell>
                  <TableCell className="text-right font-medium">₹{transaction.amount.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">Total Paid:</TableCell>
                <TableCell className="text-right font-medium">₹{invoice.paidAmount.toLocaleString('en-IN')}</TableCell>
              </TableRow>
              {invoice.status !== 'paid' && (
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">Balance Due:</TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    ₹{(invoice.total - invoice.paidAmount).toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New Invoice Container that will be printed */}
      <div id="invoice-print-container" className="bg-white border border-gray-200 rounded-md shadow-sm p-6 print:p-4 print:shadow-none" ref={printRef}>
        <div className="print-only-invoice mx-auto max-w-[210mm] print:max-w-full">
          {/* Header Section */}
          <div className="flex justify-between border-b border-gray-300 pb-4">
            <div>
              <h1 className="text-xl font-bold">{businessInfo.name}</h1>
              <p className="text-sm">{businessInfo.address.split(',')[0]}</p>
              <p className="text-sm">{businessInfo.address.split(',').slice(1).join(', ')}</p>
              <p className="text-sm">GSTIN: {businessInfo.gst || 'N/A'}</p>
            </div>
            
            <div className="text-right">
              <h2 className="text-xl font-bold">{invoiceTitle}</h2>
              <p className="text-sm">Invoice #: {invoice.invoiceNumber}</p>
              <p className="text-sm">Date: {formatDate(invoice.date)}</p>
              <p className="text-sm">Due Date: {dueDateStr}</p>
            </div>
          </div>
          
          {/* Party Details */}
          <div className="mt-6 mb-8">
            <h3 className="font-semibold mb-2">{isPurchaseInvoice ? 'Supplier:' : 'Customer:'}</h3>
            <p className="font-semibold">{party.name}</p>
            <p className="text-sm">{party.address.split(',')[0]}</p>
            <p className="text-sm">{party.state || party.address.split(',').slice(1).join(', ')}</p>
            <p className="text-sm">GSTIN: {party.gst || 'N/A'}</p>
            <p className="text-sm">Contact: {party.mobile || 'N/A'}</p>
          </div>
          
          {/* Items Table */}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="py-2 px-4 text-left">S.NO</th>
                <th className="py-2 px-4 text-left">ITEM DESCRIPTION</th>
                <th className="py-2 px-4 text-left">HSN</th>
                <th className="py-2 px-4 text-right">QTY</th>
                <th className="py-2 px-4 text-right">RATE</th>
                <th className="py-2 px-4 text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-2 px-4">{index + 1}</td>
                  <td className="py-2 px-4">{item.product}</td>
                  <td className="py-2 px-4">{item.hsn || Math.floor(Math.random() * 900000) + 100000}</td>
                  <td className="py-2 px-4 text-right">{item.qty}</td>
                  <td className="py-2 px-4 text-right">₹{item.rate.toFixed(2)}</td>
                  <td className="py-2 px-4 text-right">₹{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Summary and Payment Info */}
          <div className="flex mt-6">
            <div className="w-1/2 pr-4">
              <div className="border border-gray-300 rounded p-4">
                <h3 className="font-semibold mb-2">Payment Information:</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1">Account Name:</td>
                      <td className="py-1">{businessInfo.name}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Bank:</td>
                      <td className="py-1">HDFC Bank</td>
                    </tr>
                    <tr>
                      <td className="py-1">A/C No:</td>
                      <td className="py-1">N/A</td>
                    </tr>
                    <tr>
                      <td className="py-1">IFSC:</td>
                      <td className="py-1">N/A</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Notes:</h3>
                <p className="text-sm">No additional notes</p>
              </div>
            </div>
            
            <div className="w-1/2 pl-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">Subtotal:</td>
                    <td className="py-2 text-right">₹{invoice.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">Discount ({((invoice.discount / invoice.subtotal) * 100).toFixed(0)}%):</td>
                    <td className="py-2 text-right">-₹{invoice.discount.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">Taxable Amount:</td>
                    <td className="py-2 text-right">₹{taxableAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">CGST:</td>
                    <td className="py-2 text-right">₹{cgstAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">SGST:</td>
                    <td className="py-2 text-right">₹{sgstAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold text-lg">Total:</td>
                    <td className="py-2 text-right font-bold text-lg">₹{invoice.total.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="pt-2 font-semibold">Amount Paid:</td>
                    <td className="pt-2 text-right">₹{invoice.paidAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="pt-2 font-semibold">Balance Due:</td>
                    <td className="pt-2 text-right font-bold">
                      ₹{(invoice.total - invoice.paidAmount).toFixed(2)}
                      <span className={`ml-2 inline-block px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : invoice.status === 'partial' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Terms and Signature */}
          <div className="mt-10 pt-4 border-t border-gray-300 flex justify-between">
            <div className="w-1/2">
              <h3 className="font-semibold mb-2">Terms & Conditions:</h3>
              <p className="text-sm">All goods remain the property of the seller until paid in full</p>
            </div>
            <div className="w-1/2 text-right">
              <p className="font-semibold mb-20">Authorized Signature</p>
              <p className="font-semibold">{businessInfo.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewPage;
