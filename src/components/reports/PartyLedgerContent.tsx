
import React, { useRef } from 'react';
import { Search, Calendar, ChevronsRight, Printer, Share2, FileText, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
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

  const printLedger = () => {
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
      title: "PDF Generated",
      description: "Ledger statement has been exported as PDF",
    });
  };

  const shareLedger = async () => {
    if (!ledgerRef.current) return;
    
    const element = ledgerRef.current;
    const opt = {
      margin: 10,
      filename: `${partyName || 'Party'}_Ledger.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    try {
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      
      if (navigator.share) {
        const file = new File([pdfBlob], `${partyName || 'Party'}_Ledger.pdf`, { type: 'application/pdf' });
        await navigator.share({
          title: `${partyName || 'Party'} Ledger Statement`,
          files: [file]
        });
        toast({
          title: "Shared Successfully",
          description: "Ledger statement has been shared",
        });
      } else {
        // Fallback for browsers that don't support navigator.share
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = `${partyName || 'Party'}_Ledger.pdf`;
        link.click();
        toast({
          title: "PDF Downloaded",
          description: "Ledger statement has been downloaded",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Sharing Failed",
        description: "Could not share the ledger statement",
        variant: "destructive",
      });
    }
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
        <Button variant="outline" onClick={shareLedger}>
          <Share2 className="h-4 w-4 mr-2" />
          Share Ledger
        </Button>
      </div>

      <div ref={ledgerRef} className="rounded-md border">
        <div className="p-4 bg-muted font-medium">
          <h3 className="text-lg">{partyName ? `${partyName} - Ledger Statement` : 'Party Ledger'}</h3>
        </div>
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
    </>
  );
};

export default PartyLedgerContent;
