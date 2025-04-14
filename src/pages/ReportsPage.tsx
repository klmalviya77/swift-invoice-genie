
import React, { useState } from 'react';
import { Calendar, Search, ChevronsRight, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Party, Invoice } from '@/lib/storage';

interface LedgerEntry {
  id: string;
  date: string;
  invoiceNumber: string;
  type: 'customer' | 'supplier';
  amount: number;
  status: 'paid' | 'unpaid' | 'partial';
}

const ReportsPage: React.FC = () => {
  const { parties, invoices } = useApp();
  const navigate = useNavigate();
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().substring(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const date = new Date();
    return date.toISOString().substring(0, 10);
  });
  const [reportType, setReportType] = useState<'sales' | 'purchases' | 'all'>('all');

  // Calculate totals
  const totalSales = invoices
    .filter(inv => {
      const party = parties.find(p => p.id === inv.partyId);
      return party && party.type === 'customer';
    })
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalPurchases = invoices
    .filter(inv => {
      const party = parties.find(p => p.id === inv.partyId);
      return party && party.type === 'supplier';
    })
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalUnpaid = invoices
    .filter(inv => inv.status === 'unpaid')
    .reduce((sum, inv) => sum + inv.total, 0);

  // Filter invoices based on date range and report type
  const filterInvoices = (): Invoice[] => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      const isInDateRange = invoiceDate >= start && invoiceDate <= end;
      
      if (!isInDateRange) return false;
      
      if (reportType === 'all') return true;
      
      const party = parties.find(p => p.id === invoice.partyId);
      if (!party) return false;
      
      if (reportType === 'sales') return party.type === 'customer';
      if (reportType === 'purchases') return party.type === 'supplier';
      
      return true;
    });
  };

  // Get ledger for a specific party
  const getPartyLedger = (partyId: string): LedgerEntry[] => {
    const party = parties.find(p => p.id === partyId);
    if (!party) return [];
    
    return invoices
      .filter(invoice => invoice.partyId === partyId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(invoice => ({
        id: invoice.id,
        date: invoice.date,
        invoiceNumber: invoice.invoiceNumber,
        type: party.type,
        amount: invoice.total,
        status: invoice.status,
      }));
  };

  const filteredInvoices = filterInvoices();
  const partyLedger = selectedPartyId ? getPartyLedger(selectedPartyId) : [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPartyName = (partyId: string) => {
    const party = parties.find(p => p.id === partyId);
    return party ? party.name : 'Unknown';
  };

  // Calculate totals for a party's ledger
  const calculateLedgerTotals = () => {
    const totalAmount = partyLedger.reduce((sum, entry) => sum + entry.amount, 0);
    const paidAmount = partyLedger
      .filter(entry => entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const unpaidAmount = totalAmount - paidAmount;
    
    return {
      totalAmount,
      paidAmount,
      unpaidAmount,
    };
  };

  const ledgerTotals = calculateLedgerTotals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">View financial reports and party ledgers</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSales.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPurchases.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalUnpaid.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="ledger">Party Ledger</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <div className="mt-1">
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <div className="mt-1">
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger id="report-type" className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="sales">Sales Only</SelectItem>
                  <SelectItem value="purchases">Purchases Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No transactions found</h3>
              <p className="text-muted-foreground mt-2">
                Try adjusting your filter criteria or date range
              </p>
            </div>
          ) : (
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
                  {filteredInvoices.map((invoice) => {
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
          )}
        </TabsContent>
        
        <TabsContent value="ledger" className="space-y-4">
          <div className="flex items-center">
            <div className="relative flex-1 max-w-md">
              <Label htmlFor="party-select">Select Party</Label>
              <Select value={selectedPartyId} onValueChange={setSelectedPartyId}>
                <SelectTrigger id="party-select" className="mt-1">
                  <SelectValue placeholder="Select a party" />
                </SelectTrigger>
                <SelectContent>
                  {parties.length === 0 ? (
                    <SelectItem value="no-parties" disabled>
                      No parties available
                    </SelectItem>
                  ) : (
                    parties.map(party => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.name} ({party.type})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!selectedPartyId && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No party selected</h3>
              <p className="text-muted-foreground mt-2">
                Select a party to view their ledger
              </p>
            </div>
          )}

          {selectedPartyId && partyLedger.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No transactions found</h3>
              <p className="text-muted-foreground mt-2">
                This party has no transactions yet
              </p>
            </div>
          )}

          {selectedPartyId && partyLedger.length > 0 && (
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
