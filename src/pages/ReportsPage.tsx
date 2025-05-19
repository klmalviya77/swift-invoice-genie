
import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { Invoice, Transaction } from '@/lib/storage';
import { useLocation } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChartBarIcon, ChartPieIcon, FileText } from "lucide-react";
import { DatePicker } from "@/components/ui/calendar";

import SummaryCards from '@/components/reports/SummaryCards';
import TransactionsFilter from '@/components/reports/TransactionsFilter';
import TransactionsTable from '@/components/reports/TransactionsTable';
import PartyLedgerFilter from '@/components/reports/PartyLedgerFilter';
import PartyLedgerContent from '@/components/reports/PartyLedgerContent';

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

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const ReportsPage: React.FC = () => {
  const { parties, invoices, transactions } = useApp();
  const location = useLocation();
  
  // Parse URL params to set initial state
  const getUrlParam = useCallback((paramName: string) => {
    const params = new URLSearchParams(location.search);
    return params.get(paramName);
  }, [location.search]);
  
  // Initialize with URL params or defaults
  const [selectedPartyId, setSelectedPartyId] = useState<string>(() => {
    return getUrlParam('partyId') || '';
  });
  
  const [activeTab, setActiveTab] = useState<string>(() => {
    return getUrlParam('tab') || 'transactions';
  });
  
  const [startDate, setStartDate] = useState<string>(() => {
    const urlDate = getUrlParam('startDate');
    if (urlDate) return urlDate;
    
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().substring(0, 10);
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    const urlDate = getUrlParam('endDate');
    if (urlDate) return urlDate;
    
    const date = new Date();
    return date.toISOString().substring(0, 10);
  });
  
  const [reportType, setReportType] = useState<'sales' | 'purchases' | 'all'>(() => {
    return (getUrlParam('type') as 'sales' | 'purchases' | 'all') || 'all';
  });

  // Additional state for advanced reports
  const [selectedReport, setSelectedReport] = useState<string>('daybook');

  // Set tab from URL if provided
  useEffect(() => {
    const tab = getUrlParam('tab');
    if (tab) {
      setActiveTab(tab);
    }
    
    const partyId = getUrlParam('partyId');
    if (partyId) {
      setSelectedPartyId(partyId);
    }
  }, [location.search, getUrlParam]);

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
    
    // Get invoices for this party
    const partyInvoices = invoices
      .filter(invoice => invoice.partyId === partyId)
      .map(invoice => ({
        id: invoice.id,
        date: invoice.date,
        invoiceNumber: invoice.invoiceNumber,
        type: party.type,
        amount: invoice.total,
        status: invoice.status,
        isTransaction: false
      }));
    
    // Get transactions for this party
    const partyTransactions = transactions
      .filter(transaction => transaction.partyId === partyId)
      .map(transaction => ({
        id: transaction.id,
        date: transaction.date,
        type: party.type,
        amount: transaction.amount,
        isTransaction: true,
        transactionType: transaction.type,
        description: transaction.description
      }));
    
    // Combine and sort by date
    return [...partyInvoices, ...partyTransactions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Get filtered transactions based on date range
  const getFilteredTransactions = (): Transaction[] => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= start && transactionDate <= end;
    });
  };

  // Get cash transactions (mode = 'cash')
  const getCashTransactions = (): Transaction[] => {
    return getFilteredTransactions().filter(t => t.mode === 'cash');
  };

  // Get bank transactions (mode != 'cash')
  const getBankTransactions = (): Transaction[] => {
    return getFilteredTransactions().filter(t => t.mode !== 'cash');
  };

  const filteredInvoices = filterInvoices();
  const partyLedger = selectedPartyId ? getPartyLedger(selectedPartyId) : [];
  const filteredTransactions = getFilteredTransactions();
  const cashTransactions = getCashTransactions();
  const bankTransactions = getBankTransactions();

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
    // We need to handle transactions differently from invoices
    
    const invoiceEntries = partyLedger.filter(entry => !entry.isTransaction);
    const transactionEntries = partyLedger.filter(entry => entry.isTransaction);
    
    const totalInvoiceAmount = invoiceEntries.reduce((sum, entry) => sum + entry.amount, 0);
    
    let paidAmount = invoiceEntries
      .filter(entry => entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    // Add receipts (if customer) or subtract payments (if supplier)
    const party = parties.find(p => p.id === selectedPartyId);
    if (party) {
      if (party.type === 'customer') {
        // For customers, receipts are payments received
        paidAmount += transactionEntries
          .filter(entry => entry.transactionType === 'receipt')
          .reduce((sum, entry) => sum + entry.amount, 0);
      } else {
        // For suppliers, payments are amounts paid
        paidAmount += transactionEntries
          .filter(entry => entry.transactionType === 'payment')
          .reduce((sum, entry) => sum + entry.amount, 0);
      }
    }
    
    const unpaidAmount = Math.max(0, totalInvoiceAmount - paidAmount);
    
    return {
      totalAmount: totalInvoiceAmount,
      paidAmount,
      unpaidAmount,
    };
  };

  // List of available report types
  const reportTypes: ReportType[] = [
    { id: 'daybook', name: 'Day Book', description: 'Daily incoming & outgoing cash tracking', icon: CalendarIcon },
    { id: 'cashbook', name: 'Cash Book', description: 'Cash flow monitor', icon: ChartBarIcon },
    { id: 'bankbook', name: 'Bank Book', description: 'Reconcile with bank statements', icon: FileText },
    { id: 'ledger', name: 'Ledger Report', description: 'Check balances and transactions of parties', icon: FileText },
    { id: 'trialbalance', name: 'Trial Balance', description: 'Tallying of debit and credit', icon: ChartBarIcon },
    { id: 'profitloss', name: 'Profit & Loss', description: 'Monthly/Yearly profit tracking', icon: ChartPieIcon },
    { id: 'balancesheet', name: 'Balance Sheet', description: 'Financial position', icon: FileText },
    { id: 'stocksummary', name: 'Stock Summary', description: 'Inventory tracking', icon: ChartBarIcon },
    { id: 'purchaseregister', name: 'Purchase Register', description: 'Vendor-wise expense tracking', icon: FileText },
    { id: 'salesregister', name: 'Sales Register', description: 'Customer-wise sales history', icon: FileText },
    { id: 'purchasereturns', name: 'Purchase Returns', description: 'Track vendor return values', icon: FileText },
    { id: 'salesreturns', name: 'Sales Returns', description: 'Track customer returns', icon: FileText },
    { id: 'gstreport', name: 'GST Report', description: 'Tax filing', icon: FileText },
    { id: 'customeroutstanding', name: 'Customer Outstanding', description: 'Who hasn\'t paid and how much', icon: ChartBarIcon },
    { id: 'supplieroutstanding', name: 'Supplier Outstanding', description: 'How much to pay to whom', icon: ChartBarIcon },
    { id: 'expense', name: 'Expense Report', description: 'Expense tracking by category', icon: ChartBarIcon },
    { id: 'income', name: 'Income Report', description: 'Extra income apart from sales', icon: ChartBarIcon },
    { id: 'itemsales', name: 'Item-wise Sales', description: 'Best-selling product analysis', icon: ChartPieIcon },
    { id: 'partysales', name: 'Party-wise Sales', description: 'Loyal customers, bulk buyers', icon: ChartPieIcon },
    { id: 'itempurchase', name: 'Item-wise Purchase', description: 'Stock sourcing trends', icon: ChartBarIcon },
    { id: 'monthly', name: 'Monthly Summary', description: 'Monthly financial snapshot', icon: CalendarIcon },
    { id: 'yearly', name: 'Yearly Financial', description: 'Year-end summary', icon: CalendarIcon },
  ];

  const ledgerTotals = calculateLedgerTotals();
  const selectedPartyName = selectedPartyId ? getPartyName(selectedPartyId) : '';

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Render report content based on selected report
  const renderReportContent = () => {
    switch(selectedReport) {
      case 'daybook':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Day Book Report</h3>
              <div className="flex items-center gap-2">
                <DatePicker 
                  date={new Date(startDate)} 
                  onSelect={(date) => setStartDate(date.toISOString().split('T')[0])} 
                />
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDate(startDate)}
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Transactions for {formatDate(startDate)}</CardTitle>
                <CardDescription>Daily incoming & outgoing cash tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Party</th>
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions
                      .filter(t => new Date(t.date).toISOString().split('T')[0] === startDate)
                      .map(transaction => (
                        <tr key={transaction.id} className="border-b hover:bg-muted/50">
                          <td className="py-2">{transaction.type === 'payment' ? 'Payment' : 'Receipt'}</td>
                          <td className="py-2">{getPartyName(transaction.partyId)}</td>
                          <td className="py-2">{transaction.description || '-'}</td>
                          <td className="py-2 text-right">₹{transaction.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    {filteredTransactions.filter(t => new Date(t.date).toISOString().split('T')[0] === startDate).length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-4">No transactions found for this date</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'cashbook':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Cash Book Report</h3>
              <div className="flex items-center gap-2">
                <TransactionsFilter 
                  startDate={startDate}
                  endDate={endDate}
                  reportType={reportType}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onReportTypeChange={setReportType}
                />
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Cash Transactions</CardTitle>
                <CardDescription>Cash flow monitor ({formatDate(startDate)} to {formatDate(endDate)})</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Party</th>
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashTransactions.map(transaction => (
                      <tr key={transaction.id} className="border-b hover:bg-muted/50">
                        <td className="py-2">{formatDate(transaction.date)}</td>
                        <td className="py-2">{transaction.type === 'payment' ? 'Payment' : 'Receipt'}</td>
                        <td className="py-2">{getPartyName(transaction.partyId)}</td>
                        <td className="py-2">{transaction.description || '-'}</td>
                        <td className="py-2 text-right">₹{transaction.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {cashTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-4">No cash transactions found for this period</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-muted/50 font-medium">
                    <tr>
                      <td colSpan={4} className="py-2 text-right">Total Receipts:</td>
                      <td className="py-2 text-right">₹{cashTransactions.filter(t => t.type === 'receipt').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-2 text-right">Total Payments:</td>
                      <td className="py-2 text-right">₹{cashTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-2 text-right">Net Cash Flow:</td>
                      <td className="py-2 text-right">
                        ₹{(cashTransactions.filter(t => t.type === 'receipt').reduce((sum, t) => sum + t.amount, 0) - 
                          cashTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0)).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'bankbook':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Bank Book Report</h3>
              <div className="flex items-center gap-2">
                <TransactionsFilter 
                  startDate={startDate}
                  endDate={endDate}
                  reportType={reportType}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onReportTypeChange={setReportType}
                />
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Bank Transactions</CardTitle>
                <CardDescription>Bank account reconciliation ({formatDate(startDate)} to {formatDate(endDate)})</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Mode</th>
                      <th className="text-left py-2">Party</th>
                      <th className="text-left py-2">Reference</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankTransactions.map(transaction => (
                      <tr key={transaction.id} className="border-b hover:bg-muted/50">
                        <td className="py-2">{formatDate(transaction.date)}</td>
                        <td className="py-2">{transaction.type === 'payment' ? 'Payment' : 'Receipt'}</td>
                        <td className="py-2">{transaction.mode === 'bank_transfer' ? 'Bank Transfer' : transaction.mode === 'upi' ? 'UPI' : transaction.mode}</td>
                        <td className="py-2">{getPartyName(transaction.partyId)}</td>
                        <td className="py-2">{transaction.reference || '-'}</td>
                        <td className="py-2 text-right">₹{transaction.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {bankTransactions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-4">No bank transactions found for this period</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-muted/50 font-medium">
                    <tr>
                      <td colSpan={5} className="py-2 text-right">Total Receipts:</td>
                      <td className="py-2 text-right">₹{bankTransactions.filter(t => t.type === 'receipt').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="py-2 text-right">Total Payments:</td>
                      <td className="py-2 text-right">₹{bankTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="py-2 text-right">Net Bank Flow:</td>
                      <td className="py-2 text-right">
                        ₹{(bankTransactions.filter(t => t.type === 'receipt').reduce((sum, t) => sum + t.amount, 0) - 
                          bankTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0)).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </div>
        );
      
      default:
        return (
          <div className="space-y-4 p-6 text-center bg-muted rounded-lg">
            <h3 className="text-lg font-medium">Select a report type to view details</h3>
            <p className="text-muted-foreground">The report will be displayed here</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">View financial reports and party ledgers</p>
      </div>

      <SummaryCards 
        totalSales={totalSales} 
        totalPurchases={totalPurchases} 
        totalUnpaid={totalUnpaid} 
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="ledger">Party Ledger</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4">
          <TransactionsFilter 
            startDate={startDate}
            endDate={endDate}
            reportType={reportType}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onReportTypeChange={setReportType}
          />

          <TransactionsTable 
            invoices={filteredInvoices}
            parties={parties}
            formatDate={formatDate}
            getPartyName={getPartyName}
          />
        </TabsContent>
        
        <TabsContent value="ledger" className="space-y-4">
          <PartyLedgerFilter 
            parties={parties}
            selectedPartyId={selectedPartyId}
            onPartyChange={setSelectedPartyId}
          />

          <PartyLedgerContent 
            selectedPartyId={selectedPartyId}
            partyLedger={partyLedger}
            ledgerTotals={ledgerTotals}
            formatDate={formatDate}
            partyName={selectedPartyName}
          />
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map(report => (
              <Card 
                key={report.id}
                className={`cursor-pointer transition-all ${selectedReport === report.id ? 'border-primary' : ''}`}
                onClick={() => setSelectedReport(report.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{report.name}</CardTitle>
                    <report.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription className="text-xs">{report.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          <div className="mt-8">
            {renderReportContent()}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
