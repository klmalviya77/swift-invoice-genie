
import React, { useRef } from 'react';
import { Search, Calendar, ChevronsRight, Printer, Share2, FileText, ArrowDownCircle, ArrowUpCircle, MailIcon, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import html2pdf from 'html2pdf.js';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LedgerEntry {
  id: string;
  date: string;
  invoiceNumber?: string;
  type: 'customer' | 'supplier';
  amount: number;
  status?: 'paid' | 'unpaid' | 'partial';
  isTransaction?: boolean;
  transactionType?: 'payment' | 'receipt';
  description?: string;
}

interface LedgerTotals {
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

interface PartyLedgerContentProps {
  selectedPartyId: string;
  partyLedger: LedgerEntry[];
  ledgerTotals: LedgerTotals;
  formatDate: (dateString: string) => string;
  partyName?: string;
}

const PartyLedgerContent: React.FC<PartyLedgerContentProps> = ({
  selectedPartyId,
  partyLedger,
  ledgerTotals,
  formatDate,
  partyName
}) => {
  const navigate = useNavigate();
  const ledgerRef = useRef<HTMLDivElement>(null);
  const printableRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  if (!selectedPartyId) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No party selected</h3>
        <p className="text-muted-foreground mt-2">
          Select a party to view their ledger
        </p>
      </div>
    );
  }

  if (partyLedger.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No transactions found</h3>
        <p className="text-muted-foreground mt-2">
          This party has no transactions yet
        </p>
      </div>
    );
  }

  const downloadLedgerPdf = () => {
    if (!ledgerRef.current) return;
    
    const element = ledgerRef.current;
    const opt = {
      margin: 10,
      filename: `${partyName || 'Party'}_Ledger.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
    
    toast({
      title: "PDF Downloaded",
      description: "Ledger statement has been downloaded as PDF",
    });
  };

  const printLedger = () => {
    if (!printableRef.current) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Could not open print window. Please check your browser settings.",
        variant: "destructive",
      });
      return;
    }
    
    // Get the HTML content to print
    const contentToPrint = printableRef.current.innerHTML;
    
    // Add necessary styles
    printWindow.document.write(`
      <html>
        <head>
          <title>${partyName || 'Party'} Ledger</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 20px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .text-right { text-align: right; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${partyName || 'Party'} - Ledger Statement</h2>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="summary">
            <div class="summary-row">
              <span><strong>Total Transactions:</strong></span>
              <span>₹${ledgerTotals.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div class="summary-row">
              <span><strong>Paid Amount:</strong></span>
              <span>₹${ledgerTotals.paidAmount.toLocaleString('en-IN')}</span>
            </div>
            <div class="summary-row">
              <span><strong>Outstanding Balance:</strong></span>
              <span>₹${ledgerTotals.unpaidAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
          ${contentToPrint}
          <div class="footer">
            <p>This is a computer-generated statement and does not require a signature.</p>
          </div>
        </body>
      </html>
    `);
    
    // Wait for content to load then print
    printWindow.document.close();
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  const shareViaWhatsApp = () => {
    if (!ledgerRef.current) return;
    
    const element = ledgerRef.current;
    const opt = {
      margin: 10,
      filename: `${partyName || 'Party'}_Ledger.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).outputPdf('blob').then((blob: Blob) => {
      const file = new File([blob], `${partyName || 'Party'}_Ledger.pdf`, { type: 'application/pdf' });
      
      // Create message text for WhatsApp
      const text = `${partyName || 'Party'} Ledger Statement - Total Amount: ₹${ledgerTotals.totalAmount.toLocaleString('en-IN')}, Outstanding: ₹${ledgerTotals.unpaidAmount.toLocaleString('en-IN')}`;
      
      // Create URL for WhatsApp
      const encodedText = encodeURIComponent(text);
      const whatsappUrl = `https://wa.me/?text=${encodedText}`;
      
      // Open WhatsApp in a new window
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "WhatsApp Opened",
        description: "WhatsApp has been opened with the ledger summary. Please attach the PDF manually.",
      });
    });
  };

  const shareViaEmail = () => {
    if (!ledgerRef.current) return;
    
    const element = ledgerRef.current;
    const opt = {
      margin: 10,
      filename: `${partyName || 'Party'}_Ledger.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Create email subject and body
    const subject = encodeURIComponent(`${partyName || 'Party'} Ledger Statement`);
    const body = encodeURIComponent(`Please find attached the ledger statement for ${partyName || 'Party'}.\n\nTotal Amount: ₹${ledgerTotals.totalAmount.toLocaleString('en-IN')}\nPaid Amount: ₹${ledgerTotals.paidAmount.toLocaleString('en-IN')}\nOutstanding Balance: ₹${ledgerTotals.unpaidAmount.toLocaleString('en-IN')}`);
    
    // Open default email client
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    
    // Generate the PDF for manual attachment
    html2pdf().set(opt).from(element).save();
    
    toast({
      title: "Email Client Opened",
      description: "Your email client has been opened. Please attach the downloaded PDF manually.",
    });
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{ledgerTotals.totalAmount.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{ledgerTotals.paidAmount.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{ledgerTotals.unpaidAmount.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-4 mb-4">
        <Button variant="outline" onClick={printLedger}>
          <Printer className="h-4 w-4 mr-2" />
          Print Ledger
        </Button>
        <Button variant="outline" onClick={downloadLedgerPdf}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share Ledger
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={shareViaWhatsApp}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                viewBox="0 0 24 24"
                fill="#25D366"
              >
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                />
              </svg>
              WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareViaEmail}>
              <MailIcon className="h-4 w-4 mr-2" />
              Email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div ref={ledgerRef} className="rounded-md border">
        <div className="p-4 bg-muted font-medium">
          <h3 className="text-lg">{partyName ? `${partyName} - Ledger Statement` : 'Party Ledger'}</h3>
        </div>
        <div ref={printableRef}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Particulars</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partyLedger.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDate(entry.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {entry.isTransaction ? (
                        <>
                          {entry.transactionType === 'receipt' ? (
                            <ArrowDownCircle className="h-4 w-4 mr-2 text-green-600" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4 mr-2 text-red-600" />
                          )}
                          {entry.description || (entry.transactionType === 'receipt' ? 'Amount Received' : 'Payment Made')}
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          {entry.invoiceNumber || 'Invoice'}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">₹{entry.amount.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="capitalize">
                    {entry.isTransaction 
                      ? (entry.transactionType === 'receipt' ? 'Received' : 'Paid') 
                      : entry.status}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        if (entry.isTransaction) {
                          navigate(`/transactions?id=${entry.id}`);
                        } else {
                          navigate(`/invoices/${entry.id}`);
                        }
                      }}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default PartyLedgerContent;
