
import React from 'react';
import { ChevronsRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Invoice, Party } from '@/lib/storage';

interface TransactionsTableProps {
  invoices: Invoice[];
  parties: Party[];
  formatDate: (dateString: string) => string;
  getPartyName: (partyId: string) => string;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  invoices,
  parties,
  formatDate,
  getPartyName
}) => {
  const navigate = useNavigate();

  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No transactions found</h3>
        <p className="text-muted-foreground mt-2">
          Try adjusting your filter criteria or date range
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Party</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const party = parties.find(p => p.id === invoice.partyId);
            return (
              <TableRow key={invoice.id}>
                <TableCell>{formatDate(invoice.date)}</TableCell>
                <TableCell>{invoice.invoiceNumber}</TableCell>
                <TableCell>{getPartyName(invoice.partyId)}</TableCell>
                <TableCell className="capitalize">{party?.type || 'unknown'}</TableCell>
                <TableCell className="text-right">₹{invoice.total.toLocaleString('en-IN')}</TableCell>
                <TableCell className="capitalize">{invoice.status}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionsTable;
