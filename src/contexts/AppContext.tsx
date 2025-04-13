
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Party,
  Invoice,
  BusinessInfo,
  Product,
  Transaction,
  getParties,
  saveParty,
  deleteParty,
  getInvoices,
  saveInvoice,
  deleteInvoice,
  getBusinessInfo,
  saveBusinessInfo,
  getPartyById,
  getInvoiceById,
  getProducts,
  saveProduct as saveProductToStorage,
  deleteProduct,
  getTransactions,
  saveTransaction as saveTransactionToStorage,
  deleteTransaction,
  getTransactionsByPartyId,
  getTransactionsByType,
  getTransactionsByInvoiceId,
  getInvoiceRemainingAmount,
  updateInvoicePaymentStatus
} from '@/lib/storage';

interface AppContextType {
  parties: Party[];
  invoices: Invoice[];
  products: Product[];
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  addParty: (party: Party) => void;
  updateParty: (party: Party) => void;
  removeParty: (id: string) => void;
  addInvoice: (invoice: Invoice) => Invoice;
  updateInvoice: (invoice: Invoice) => void;
  removeInvoice: (id: string) => void;
  saveProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  saveTransaction: (transaction: Transaction) => void;
  removeTransaction: (id: string) => void;
  updateBusinessInfo: (info: BusinessInfo) => void;
  getParty: (id: string) => Party | undefined;
  getInvoice: (id: string) => Invoice | undefined;
  getTransactionsByParty: (partyId: string) => Transaction[];
  getTransactionsByInvoice: (invoiceId: string) => Transaction[];
  getInvoiceRemainingBalance: (invoiceId: string) => number;
  updateInvoiceStatusFromTransaction: (partyId: string, amount: number, invoiceId?: string) => void;
  recordPartialPayment: (invoiceId: string, amount: number, paymentDetails: Partial<Transaction>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(getBusinessInfo());

  // Load initial data
  useEffect(() => {
    setParties(getParties());
    setInvoices(getInvoices());
    setProducts(getProducts());
    setTransactions(getTransactions());
  }, []);

  const addParty = (party: Party) => {
    saveParty(party);
    setParties(getParties());
  };

  const updateParty = (party: Party) => {
    saveParty(party);
    setParties(getParties());
  };

  const removeParty = (id: string) => {
    deleteParty(id);
    setParties(getParties());
  };

  const addInvoice = (invoice: Invoice) => {
    saveInvoice(invoice);
    setInvoices(getInvoices());
    return invoice;
  };

  const updateInvoice = (invoice: Invoice) => {
    saveInvoice(invoice);
    setInvoices(getInvoices());
  };

  const removeInvoice = (id: string) => {
    deleteInvoice(id);
    setInvoices(getInvoices());
  };

  const saveProduct = (product: Product) => {
    saveProductToStorage(product);
    setProducts(getProducts());
  };

  const removeProduct = (id: string) => {
    deleteProduct(id);
    setProducts(getProducts());
  };

  const saveTransaction = (transaction: Transaction) => {
    saveTransactionToStorage(transaction);
    setTransactions(getTransactions());
    
    // Automatically update invoice status when a new transaction is created
    if (transaction.invoiceId) {
      // If transaction is for a specific invoice
      const invoice = getInvoiceById(transaction.invoiceId);
      if (invoice) {
        const updatedInvoice = updateInvoicePaymentStatus(invoice);
        setInvoices(getInvoices());
      }
    } else {
      // If transaction is general (not for a specific invoice)
      updateInvoiceStatusFromTransaction(transaction.partyId, transaction.amount);
    }
  };

  const removeTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    deleteTransaction(id);
    setTransactions(getTransactions());
    
    // If transaction was linked to an invoice, update invoice status
    if (transaction?.invoiceId) {
      const invoice = getInvoiceById(transaction.invoiceId);
      if (invoice) {
        const updatedInvoice = updateInvoicePaymentStatus(invoice);
        setInvoices(getInvoices());
      }
    }
  };

  const updateBusinessInfo = (info: BusinessInfo) => {
    saveBusinessInfo(info);
    setBusinessInfo(info);
  };

  const getParty = (id: string): Party | undefined => {
    return getPartyById(id);
  };

  const getInvoice = (id: string): Invoice | undefined => {
    return getInvoiceById(id);
  };

  const getTransactionsByParty = (partyId: string): Transaction[] => {
    return getTransactionsByPartyId(partyId);
  };

  const getTransactionsByInvoice = (invoiceId: string): Transaction[] => {
    return getTransactionsByInvoiceId(invoiceId);
  };

  const getInvoiceRemainingBalance = (invoiceId: string): number => {
    return getInvoiceRemainingAmount(invoiceId);
  };

  // Function to record a partial payment for an invoice
  const recordPartialPayment = (invoiceId: string, amount: number, paymentDetails: Partial<Transaction>) => {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) return;
    
    // Create and save the transaction
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: invoice.partyId ? (
        getPartyById(invoice.partyId)?.type === 'supplier' ? 'payment' : 'receipt'
      ) : 'receipt',
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      partyId: invoice.partyId,
      invoiceId: invoiceId,
      mode: paymentDetails.mode || 'cash',
      description: paymentDetails.description || `Partial payment for invoice ${invoice.invoiceNumber}`,
      reference: paymentDetails.reference || '',
      createdAt: new Date().toISOString(),
      ...paymentDetails
    };
    
    saveTransactionToStorage(transaction);
    setTransactions(getTransactions());
    
    // Update the invoice
    const updatedInvoice = updateInvoicePaymentStatus(invoice);
    setInvoices(getInvoices());
  };

  // Updated function: Updates invoice status based on transactions
  const updateInvoiceStatusFromTransaction = (partyId: string, amount: number, invoiceId?: string) => {
    if (invoiceId) {
      // If a specific invoice is provided, just update that one
      const invoice = getInvoiceById(invoiceId);
      if (invoice) {
        const updatedInvoice = updateInvoicePaymentStatus(invoice);
        setInvoices(getInvoices());
      }
      return;
    }
    
    // Get all unpaid or partially paid invoices for this party
    const partyInvoices = getInvoices().filter(
      inv => inv.partyId === partyId && (inv.status === 'unpaid' || inv.status === 'partial')
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (partyInvoices.length === 0) return;

    let remainingAmount = amount;
    const updatedInvoices = [];

    // Try to mark invoices as paid or partially paid, starting from the oldest
    for (const invoice of partyInvoices) {
      const remainingInvoiceAmount = invoice.total - invoice.paidAmount;
      
      if (remainingAmount >= remainingInvoiceAmount) {
        // Can pay this invoice completely
        invoice.paidAmount = invoice.total;
        invoice.status = 'paid';
        remainingAmount -= remainingInvoiceAmount;
        updatedInvoices.push(invoice);
      } else if (remainingAmount > 0) {
        // Can only partially pay this invoice
        invoice.paidAmount += remainingAmount;
        invoice.status = 'partial';
        updatedInvoices.push(invoice);
        remainingAmount = 0;
        break;
      } else {
        break;
      }
    }

    // Save the updated invoices
    for (const invoice of updatedInvoices) {
      saveInvoice(invoice);
    }

    // Refresh invoices in state if any were updated
    if (updatedInvoices.length > 0) {
      setInvoices(getInvoices());
    }
  };

  return (
    <AppContext.Provider
      value={{
        parties,
        invoices,
        products,
        transactions,
        businessInfo,
        addParty,
        updateParty,
        removeParty,
        addInvoice,
        updateInvoice,
        removeInvoice,
        saveProduct,
        removeProduct,
        saveTransaction,
        removeTransaction,
        updateBusinessInfo,
        getParty,
        getInvoice,
        getTransactionsByParty,
        getTransactionsByInvoice,
        getInvoiceRemainingBalance,
        updateInvoiceStatusFromTransaction,
        recordPartialPayment
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
