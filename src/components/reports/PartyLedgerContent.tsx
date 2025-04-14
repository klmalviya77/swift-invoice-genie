
import React from 'react';
import { Search, Calendar, ChevronsRight } from 'lucide-react';
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

interface LedgerEntry {
  id: string;
  date: string;
  invoiceNumber: string;
  type: 'customer' | 'supplier';
  amount: number;
  status: 'paid' | 'unpaid' | 'partial';
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
}

const PartyLedgerContent: React.FC<PartyLedgerContentProps> = ({
  selectedPartyId,
  partyLedger,
  ledgerTotals,
  formatDate
}) => {
  const navigate = useNavigate();

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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partyLedger.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{formatDate(entry.date)}</TableCell>
                <TableCell>{entry.invoiceNumber}</TableCell>
                <TableCell className="text-right">₹{entry.amount.toLocaleString('en-IN')}</TableCell>
                <TableCell className="capitalize">{entry.status}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/invoices/${entry.id}`)}
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
