
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
      status: invoice.status === 'paid' ? 'unpaid' : 'paid' 
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
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/invoices')}
            className="no-print"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-muted-foreground">
              {formatDate(invoice.date)}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 no-print">
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

      <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8 max-w-4xl mx-auto invoice-container" ref={printRef}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-primary">{businessInfo.name}</h2>
            <address className="not-italic text-gray-600 mt-1">
              {businessInfo.address.split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </address>
            <div className="mt-2">
              <p className="text-gray-600">Phone: {businessInfo.phone}</p>
              <p className="text-gray-600">Email: {businessInfo.email}</p>
              {businessInfo.gst && <p className="text-gray-600">GST: {businessInfo.gst}</p>}
            </div>
          </div>
          
          <div className="mt-6 md:mt-0 md:text-right">
            <h1 className="text-2xl font-bold">INVOICE</h1>
            <p className="text-gray-600 mt-1">#{invoice.invoiceNumber}</p>
            <p className="text-gray-600 mt-1">Date: {formatDate(invoice.date)}</p>
            <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'} className="mt-2 capitalize">
              {invoice.status}
            </Badge>
          </div>
        </div>
        
        {/* Party Info */}
        <div className="border-t border-b py-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h3 className="font-medium text-gray-500">Bill To:</h3>
              <h4 className="font-bold text-lg mt-1">{party.name}</h4>
              <address className="not-italic text-gray-600 mt-1">
                {party.address.split('\n').map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </address>
              <p className="text-gray-600 mt-1">Phone: {party.mobile}</p>
              {party.gst && <p className="text-gray-600">GST: {party.gst}</p>}
            </div>
            <div className="mt-4 md:mt-0">
              <h3 className="font-medium text-gray-500">Type:</h3>
              <p className="text-gray-800 mt-1 capitalize">{party.type}</p>
            </div>
          </div>
        </div>
        
        {/* Items Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 text-left font-medium text-gray-600 border-b">Item</th>
              <th className="py-2 px-4 text-right font-medium text-gray-600 border-b">Qty</th>
              <th className="py-2 px-4 text-right font-medium text-gray-600 border-b">Rate</th>
              <th className="py-2 px-4 text-right font-medium text-gray-600 border-b">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-3 px-4 border-b">{item.product}</td>
                <td className="py-3 px-4 text-right border-b">{item.qty}</td>
                <td className="py-3 px-4 text-right border-b">₹{item.rate.toLocaleString('en-IN')}</td>
                <td className="py-3 px-4 text-right border-b">₹{item.amount.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full md:w-64">
            <div className="flex justify-between py-2">
              <span className="font-medium text-gray-600">Subtotal:</span>
              <span>₹{invoice.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-gray-600">GST ({invoice.gstPercentage}%):</span>
              <span>₹{invoice.gstAmount.toLocaleString('en-IN')}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Discount:</span>
                <span>₹{invoice.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between py-3 font-bold text-lg">
              <span>Total:</span>
              <span>₹{invoice.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
        
        {/* Terms & Signature */}
        <div className="mt-8 pt-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Terms & Conditions</h4>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {businessInfo.termsAndConditions}
              </div>
            </div>
            <div className="text-right">
              <div className="mt-12 pt-4 border-t inline-block">
                <p className="font-medium">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewPage;
