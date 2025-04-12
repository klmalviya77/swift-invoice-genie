
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
  const invoiceTitle = isPurchaseInvoice ? 'PURCHASE BILL' : 'DELIVERY CHALLAN';
  
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
              {isPurchaseInvoice ? 'Purchase Bill' : 'Delivery Challan'} {invoice.invoiceNumber}
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
            <Button variant="outline" onClick={handleWhatsAppShare}>
              <Phone className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
          )}
          <Button variant="outline" onClick={handleEmailShare}>
            <Mail className="mr-2 h-4 w-4" /> Email
          </Button>
        </div>
      </div>

      {/* New Invoice Container that will be printed */}
      <div id="invoice-print-container" className="bg-white shadow-none p-0 print:p-0 print:shadow-none" ref={printRef}>
        <div className="print-only-invoice border border-gray-400 print:border mx-auto max-w-[210mm]">
          {/* Header with GSTIN */}
          <div className="border-b border-gray-400 p-2">
            <div className="flex justify-between items-start">
              <div className="text-sm">
                <p className="font-bold">GSTIN : {businessInfo.gst || 'N/A'}</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">
                  {invoiceTitle}
                </p>
                <p className="font-bold text-xl">
                  {businessInfo.name}
                </p>
              </div>
              <div className="text-sm text-right">
                <p>Original Copy</p>
              </div>
            </div>
            
            <div className="text-center text-sm">
              <p>{businessInfo.address.split('\n').join(', ')}</p>
              <p>Tel: {businessInfo.phone} email: {businessInfo.email}</p>
            </div>
          </div>
          
          {/* Party and Invoice Details */}
          <div className="flex border-b border-gray-400">
            {/* Left Column - Party Details */}
            <div className="w-1/2 p-3 border-r border-gray-400">
              <p className="font-bold underline">Party Details:</p>
              <p className="font-bold">{party.name}</p>
              <p className="text-sm">{party.address.split('\n').join(', ')}</p>
              
              <div className="mt-3 grid grid-cols-2 gap-1 text-sm">
                <p>Party Mobile No</p>
                <p>: {party.mobile || 'N/A'}</p>
                
                <p>GSTIN / UIN</p>
                <p>: {party.gst || 'N/A'}</p>
                
                <p>ARN NO</p>
                <p>: </p>
                
                <p>DELIVERY BY</p>
                <p>: {invoice.deliveryBy || 'N/A'}</p>
              </div>
            </div>
            
            {/* Right Column - Invoice Details */}
            <div className="w-1/2 p-3">
              <div className="grid grid-cols-2 gap-1 text-sm">
                <p>No.</p>
                <p>: {invoice.invoiceNumber}</p>
                
                <p>Dated</p>
                <p>: {formatDate(invoice.date)}</p>
                
                <p>Place of Supply</p>
                <p>: {party.state || 'N/A'}</p>
                
                <p>GR/RR No.</p>
                <p>: </p>
                
                <p>Transport</p>
                <p>: {invoice.transport || 'BY HAND'}</p>
                
                <p>Vehicle No.</p>
                <p>: {invoice.vehicleNo || 'N/A'}</p>
                
                <p>Station</p>
                <p>: </p>
                
                <p>E-Way Bill No.</p>
                <p>: {invoice.eWayBillNo || 'N/A'}</p>
                
                <p>P.O NO</p>
                <p>: {invoice.poNumber || 'N/A'}</p>
                
                <p>PAYMENT TERM</p>
                <p>: {invoice.paymentTerm || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          {/* Items Table */}
          <div className="border-b border-gray-400">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="border-r border-gray-400 p-2 text-left">S.N.</th>
                  <th className="border-r border-gray-400 p-2 text-left">Description of Goods</th>
                  <th className="border-r border-gray-400 p-2 text-left">HSN/SAC Code</th>
                  <th className="border-r border-gray-400 p-2 text-center">Qty.</th>
                  <th className="p-2 text-left">Unit</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-400">
                    <td className="border-r border-gray-400 p-2">{index + 1}.</td>
                    <td className="border-r border-gray-400 p-2">{item.product}</td>
                    <td className="border-r border-gray-400 p-2 text-center">
                      {item.hsn || Math.floor(Math.random() * 900000) + 100000}
                    </td>
                    <td className="border-r border-gray-400 p-2 text-center">{item.qty.toFixed(2)}</td>
                    <td className="p-2">PCS</td>
                  </tr>
                ))}
                
                {/* Empty rows to fill space */}
                {Array.from({ length: Math.max(0, 10 - invoice.items.length) }).map((_, index) => (
                  <tr key={`empty-${index}`} className="border-b border-gray-400">
                    <td className="border-r border-gray-400 p-2">&nbsp;</td>
                    <td className="border-r border-gray-400 p-2">&nbsp;</td>
                    <td className="border-r border-gray-400 p-2">&nbsp;</td>
                    <td className="border-r border-gray-400 p-2">&nbsp;</td>
                    <td className="p-2">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Totals */}
          <div className="flex justify-end p-2 border-b border-gray-400">
            <div className="text-right">
              <p className="font-bold">Grand Total</p>
            </div>
            <div className="w-[200px] text-right px-4">
              <p className="font-bold">{invoice.items.reduce((sum, item) => sum + item.qty, 0).toFixed(2)} PCS</p>
            </div>
          </div>
          
          {/* Tax Details */}
          <div className="border-b border-gray-400">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="border-r border-gray-400 p-2 text-left">HSN/SAC</th>
                  <th className="border-r border-gray-400 p-2 text-left">Tax Rate</th>
                  <th className="border-r border-gray-400 p-2 text-left">Taxable Amt.</th>
                  <th className="border-r border-gray-400 p-2 text-center">CGST Amt.</th>
                  <th className="border-r border-gray-400 p-2 text-center">SGST Amt.</th>
                  <th className="p-2 text-center">Total Tax</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {
                  const hsn = item.hsn || Math.floor(Math.random() * 900000) + 100000;
                  const taxRate = invoice.gstPercentage > 0 ? invoice.gstPercentage : 'Nil Rated';
                  const taxableAmount = item.amount - (item.amount * invoice.gstPercentage / 100);
                  const cgstAmount = invoice.gstPercentage > 0 ? (item.amount * (invoice.gstPercentage / 2) / 100).toFixed(2) : '—';
                  const sgstAmount = invoice.gstPercentage > 0 ? (item.amount * (invoice.gstPercentage / 2) / 100).toFixed(2) : '—';
                  const totalTax = invoice.gstPercentage > 0 ? (item.amount * invoice.gstPercentage / 100).toFixed(2) : '0.00';
                  
                  return (
                    <tr key={`tax-${item.id}`} className="border-b border-gray-400">
                      <td className="border-r border-gray-400 p-2">{hsn}</td>
                      <td className="border-r border-gray-400 p-2">{taxRate}</td>
                      <td className="border-r border-gray-400 p-2 text-right">{taxableAmount.toFixed(2)}</td>
                      <td className="border-r border-gray-400 p-2 text-center">{cgstAmount}</td>
                      <td className="border-r border-gray-400 p-2 text-center">{sgstAmount}</td>
                      <td className="p-2 text-right">{totalTax}</td>
                    </tr>
                  );
                })}
                <tr className="font-bold">
                  <td className="border-r border-gray-400 p-2">Total</td>
                  <td className="border-r border-gray-400 p-2"></td>
                  <td className="border-r border-gray-400 p-2 text-right">{invoice.subtotal.toFixed(2)}</td>
                  <td className="border-r border-gray-400 p-2 text-center">
                    {invoice.gstPercentage > 0 ? (invoice.gstAmount / 2).toFixed(2) : '0.00'}
                  </td>
                  <td className="border-r border-gray-400 p-2 text-center">
                    {invoice.gstPercentage > 0 ? (invoice.gstAmount / 2).toFixed(2) : '0.00'}
                  </td>
                  <td className="p-2 text-right">{invoice.gstAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Signature Section */}
          <div className="flex justify-end p-4 min-h-[100px]">
            <div className="text-right signature-section">
              <p className="font-bold mb-8">For {businessInfo.name}</p>
              <p className="mt-8">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewPage;
