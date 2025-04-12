
import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Phone, 
  Mail, 
  Edit 
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const InvoiceViewPage: React.FC = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getInvoice, getParty, businessInfo, updateInvoice } = useApp();
  const printRef = useRef<HTMLDivElement>(null);
  
  const invoice = invoiceId ? getInvoice(invoiceId) : null;
  const party = invoice ? getParty(invoice.partyId) : null;
  
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
      status: invoice.status === 'paid' ? 'unpaid' as const : 'paid' as const 
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isPurchaseInvoice = party.type === 'supplier';
  const invoiceTitle = isPurchaseInvoice ? 'PURCHASE BILL' : 'INVOICE';
  
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
            <Button variant="outline" onClick={() => {
              const message = encodeURIComponent(
                `Invoice: ${invoice.invoiceNumber}\n` +
                `Date: ${new Date(invoice.date).toLocaleDateString()}\n` +
                `Amount: ₹${invoice.total.toLocaleString('en-IN')}\n` +
                `Status: ${invoice.status.toUpperCase()}\n\n` +
                `Please check your email for the detailed invoice or contact us for any queries.`
              );
              
              window.open(`https://wa.me/91${party.mobile}?text=${message}`, '_blank');
            }}>
              <Phone className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
          )}
          <Button variant="outline" onClick={() => {
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
          }}>
            <Mail className="mr-2 h-4 w-4" /> Email
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8 invoice-container" ref={printRef}>
        <div className="flex flex-col print:block">
          {/* Header Section */}
          <div className="flex justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{businessInfo.name}</h2>
              <address className="not-italic text-gray-700 mt-1">
                {businessInfo.address.split('\n').map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </address>
              <p className="text-gray-700">GSTIN: {businessInfo.gst || 'N/A'}</p>
            </div>
            
            <div className="text-right">
              <h1 className="text-xl font-bold text-gray-800">{invoiceTitle}</h1>
              <p className="text-gray-700">Invoice #: {invoice.invoiceNumber}</p>
              <p className="text-gray-700">Date: {formatDate(invoice.date)}</p>
              <p className="text-gray-700">Due Date: {formatDate(dueDate.toISOString())}</p>
            </div>
          </div>
          
          <hr className="my-6 border-gray-200" />
          
          {/* Party Info */}
          <div className="mb-8">
            <h3 className="font-medium text-gray-700 mb-2">{isPurchaseInvoice ? 'Supplier:' : 'Bill To:'}</h3>
            <h4 className="font-bold text-lg">{party.name}</h4>
            <address className="not-italic text-gray-700 mt-1">
              {party.address.split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </address>
            {party.gst && <p className="text-gray-700">GSTIN: {party.gst}</p>}
            <p className="text-gray-700">Contact: {party.mobile}</p>
          </div>
          
          {/* Items Table */}
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="py-2 text-left font-medium text-gray-700 border border-gray-200">S.NO</TableHead>
                <TableHead className="py-2 text-left font-medium text-gray-700 border border-gray-200">ITEM DESCRIPTION</TableHead>
                <TableHead className="py-2 text-left font-medium text-gray-700 border border-gray-200">HSN</TableHead>
                <TableHead className="py-2 text-center font-medium text-gray-700 border border-gray-200">QTY</TableHead>
                <TableHead className="py-2 text-right font-medium text-gray-700 border border-gray-200">RATE</TableHead>
                <TableHead className="py-2 text-right font-medium text-gray-700 border border-gray-200">AMOUNT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <TableCell className="py-3 text-left border border-gray-200">{index + 1}</TableCell>
                  <TableCell className="py-3 text-left border border-gray-200">{item.product}</TableCell>
                  <TableCell className="py-3 text-left border border-gray-200">{Math.floor(Math.random() * 900000) + 100000}</TableCell>
                  <TableCell className="py-3 text-center border border-gray-200">{item.qty}</TableCell>
                  <TableCell className="py-3 text-right border border-gray-200">₹{item.rate.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="py-3 text-right border border-gray-200">₹{item.amount.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-6 flex flex-wrap print:flex-nowrap justify-between">
            {/* Payment Information */}
            <div className="w-full md:w-1/2 p-4 border border-gray-200 rounded-md mb-4 print:mb-0">
              <h4 className="font-medium text-gray-800 mb-3">Payment Information:</h4>
              <div className="space-y-1 text-gray-700">
                <p>Account Name: {businessInfo.name}</p>
                <p>Bank: HDFC Bank</p>
                <p>A/C No: N/A</p>
                <p>IFSC: N/A</p>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium text-gray-800 mb-2">Notes:</h4>
                <p className="text-gray-700">No additional notes</p>
              </div>
            </div>
            
            {/* Totals */}
            <div className="w-full md:w-1/3">
              <div className="flex justify-between py-2">
                <span className="font-medium text-gray-700">Subtotal:</span>
                <span className="text-right">₹{invoice.subtotal.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between py-2">
                <span className="font-medium text-gray-700">Discount ({Math.round((invoice.discount/invoice.subtotal)*100)}%):</span>
                <span className="text-right">-₹{invoice.discount.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between py-2">
                <span className="font-medium text-gray-700">Taxable Amount:</span>
                <span className="text-right">₹{(invoice.subtotal - invoice.discount).toLocaleString('en-IN')}</span>
              </div>
              
              {invoice.gstPercentage > 0 && (
                <>
                  <div className="flex justify-between py-2">
                    <span className="font-medium text-gray-700">CGST:</span>
                    <span className="text-right">₹{(invoice.gstAmount/2).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-medium text-gray-700">SGST:</span>
                    <span className="text-right">₹{(invoice.gstAmount/2).toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between py-3 font-bold text-lg border-t border-gray-200 mt-2">
                <span>Total:</span>
                <span className="text-right">₹{invoice.total.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between py-3 font-bold">
                <span>Amount Due:</span>
                <span className="text-right">₹{invoice.status === 'paid' ? '0.00' : invoice.total.toLocaleString('en-IN')}</span>
              </div>
              
              {invoice.status === 'unpaid' && (
                <div className="text-right">
                  <Badge variant="destructive" className="uppercase">Unpaid</Badge>
                </div>
              )}
            </div>
          </div>
          
          {/* Terms & Signature */}
          <div className="mt-8 pt-6 border-t border-gray-200 print-footer">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="md:w-1/2">
                <h4 className="font-medium text-gray-800 mb-2">Terms & Conditions:</h4>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  All goods remain the property of the seller until paid in full
                </div>
              </div>
              <div className="md:w-1/2 text-right mt-6 md:mt-0">
                <div className="pt-10 mb-2">
                  <p className="font-medium text-gray-800">Authorized Signature</p>
                </div>
                <p className="mt-12 font-medium">{businessInfo.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewPage;
