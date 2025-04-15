
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import html2pdf from 'html2pdf.js';

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

interface PartyLedgerContentProps {
  selectedPartyId: string;
  partyLedger: LedgerEntry[];
  ledgerTotals: {
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
  };
  formatDate: (date: string) => string;
  partyName: string;
}

const PartyLedgerContent: React.FC<PartyLedgerContentProps> = ({
  selectedPartyId,
  partyLedger,
  ledgerTotals,
  formatDate,
  partyName,
}) => {
  const navigate = useNavigate();
  const ledgerRef = useRef<HTMLDivElement>(null);

  // Navigate to invoice details
  const handleItemClick = (entry: LedgerEntry) => {
    if (!entry.isTransaction && entry.invoiceNumber) {
      navigate(`/invoices/${entry.id}`);
    }
  };

  const handlePrintLedger = () => {
    const printContent = document.getElementById('printable-ledger');
    if (printContent) {
      const originalDisplay = document.body.style.display;
      const originalOverflow = document.body.style.overflow;
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      // Write the HTML content to the new window
      printWindow.document.write(`
        <html>
          <head>
            <title>Party Ledger - ${partyName}</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
              .summary { margin-top: 20px; font-weight: bold; }
              .receipt { color: green; }
              .payment { color: red; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Party Ledger Statement</h2>
              <h3>${partyName}</h3>
            </div>
            ${printContent.innerHTML}
            <div class="summary">
              <p>Total Amount: ₹${ledgerTotals.totalAmount.toLocaleString('en-IN')}</p>
              <p>Paid Amount: ₹${ledgerTotals.paidAmount.toLocaleString('en-IN')}</p>
              <p>Balance Due: ₹${ledgerTotals.unpaidAmount.toLocaleString('en-IN')}</p>
            </div>
          </body>
        </html>
      `);

      // Print and close
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('printable-ledger');
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: `${partyName}_Ledger.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Add the header and summary to the PDF
    const clone = element.cloneNode(true) as HTMLElement;
    const container = document.createElement('div');
    
    const header = document.createElement('div');
    header.innerHTML = `
      <h2 style="text-align: center;">Party Ledger Statement</h2>
      <h3 style="text-align: center;">${partyName}</h3>
    `;
    
    const summary = document.createElement('div');
    summary.innerHTML = `
      <p><strong>Total Amount:</strong> ₹${ledgerTotals.totalAmount.toLocaleString('en-IN')}</p>
      <p><strong>Paid Amount:</strong> ₹${ledgerTotals.paidAmount.toLocaleString('en-IN')}</p>
      <p><strong>Balance Due:</strong> ₹${ledgerTotals.unpaidAmount.toLocaleString('en-IN')}</p>
    `;
    
    container.appendChild(header);
    container.appendChild(clone);
    container.appendChild(summary);
    
    html2pdf().from(container).set(opt).save();
  };

  const handleShare = (method: 'whatsapp' | 'email') => {
    const partyDetails = `Party: ${partyName}`;
    const totalDetails = `Total: ₹${ledgerTotals.totalAmount.toLocaleString('en-IN')}, Paid: ₹${ledgerTotals.paidAmount.toLocaleString('en-IN')}, Due: ₹${ledgerTotals.unpaidAmount.toLocaleString('en-IN')}`;
    
    if (method === 'whatsapp') {
      const message = `*Party Ledger Statement*\n${partyDetails}\n${totalDetails}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } else if (method === 'email') {
      const subject = `Party Ledger Statement - ${partyName}`;
      const body = `Party Ledger Statement\n\n${partyDetails}\n${totalDetails}`;
      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    }
  };

  if (!selectedPartyId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Select a party to view ledger details
          </div>
        </CardContent>
      </Card>
    );
  }

  if (partyLedger.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No transactions found for this party
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{partyName} - Ledger</h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintLedger}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleShare('whatsapp')}
                  >
                    Share via WhatsApp
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleShare('email')}
                  >
                    Share via Email
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div id="printable-ledger" ref={ledgerRef}>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partyLedger.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className={
                      !entry.isTransaction && entry.invoiceNumber
                        ? 'cursor-pointer hover:bg-muted'
                        : ''
                    }
                    onClick={() => handleItemClick(entry)}
                  >
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      {entry.isTransaction
                        ? `${entry.transactionType === 'receipt' ? 'Receipt' : 'Payment'} - ${
                            entry.description || 'No description'
                          }`
                        : `Invoice ${entry.invoiceNumber || ''} ${
                            entry.status ? `(${entry.status})` : ''
                          }`}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{entry.amount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      {entry.isTransaction ? (
                        <span
                          className={
                            entry.transactionType === 'receipt'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {entry.transactionType === 'receipt' ? 'Credit' : 'Debit'}
                        </span>
                      ) : (
                        <span
                          className={
                            entry.type === 'customer' ? 'text-blue-600' : 'text-orange-600'
                          }
                        >
                          {entry.type === 'customer' ? 'Sale' : 'Purchase'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <div className="flex justify-between">
            <span className="font-medium">Total Amount:</span>
            <span>₹{ledgerTotals.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Paid Amount:</span>
            <span>₹{ledgerTotals.paidAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Balance Due:</span>
            <span className="font-bold">
              ₹{ledgerTotals.unpaidAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartyLedgerContent;
