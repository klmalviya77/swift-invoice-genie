
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
  getTransactionsByType
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
  };

  const removeTransaction = (id: string) => {
    deleteTransaction(id);
    setTransactions(getTransactions());
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
        getTransactionsByParty
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
