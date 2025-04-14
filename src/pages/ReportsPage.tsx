
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { Invoice } from '@/lib/storage';

import SummaryCards from '@/components/reports/SummaryCards';
import TransactionsFilter from '@/components/reports/TransactionsFilter';
import TransactionsTable from '@/components/reports/TransactionsTable';
import PartyLedgerFilter from '@/components/reports/PartyLedgerFilter';
import PartyLedgerContent from '@/components/reports/PartyLedgerContent';

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

      <SummaryCards 
        totalSales={totalSales} 
        totalPurchases={totalPurchases} 
        totalUnpaid={totalUnpaid} 
      />

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="ledger">Party Ledger</TabsTrigger>
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
