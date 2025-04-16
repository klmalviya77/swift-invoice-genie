import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Party,
  Invoice,
  BusinessInfo,
  Product,
  Transaction,
  Return,
  ReturnItem,
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
  updateInvoicePaymentStatus,
  getLowStockProducts,
  getOutOfStockProducts,
  adjustProductStock,
  getReturns,
  saveReturn as saveReturnToStorage,
  deleteReturn,
  getReturnsByType,
  getReturnsByPartyId,
  getReturnById
} from '@/lib/storage';

interface AppContextType {
  parties: Party[];
  invoices: Invoice[];
  products: Product[];
  transactions: Transaction[];
  returns: Return[];
  businessInfo: BusinessInfo;
  loading: boolean;
  addParty: (party: Party) => Promise<void>;
  updateParty: (party: Party) => Promise<void>;
  removeParty: (id: string) => Promise<void>;
  addInvoice: (invoice: Invoice) => Promise<Invoice>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  removeInvoice: (id: string) => Promise<void>;
  saveProduct: (product: Product) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  saveTransaction: (transaction: Transaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  updateBusinessInfo: (info: BusinessInfo) => Promise<void>;
  getParty: (id: string) => Promise<Party | undefined>;
  getInvoice: (id: string) => Promise<Invoice | undefined>;
  getTransactionsByParty: (partyId: string) => Promise<Transaction[]>;
  getTransactionsByInvoice: (invoiceId: string) => Promise<Transaction[]>;
  getInvoiceRemainingBalance: (invoiceId: string) => Promise<number>;
  updateInvoiceStatusFromTransaction: (partyId: string, amount: number, invoiceId?: string) => Promise<void>;
  recordPartialPayment: (invoiceId: string, amount: number, paymentDetails: Partial<Transaction>) => Promise<void>;
  // Inventory-related functions
  adjustStock: (productId: string, quantity: number) => Promise<boolean>;
  getLowStock: () => Promise<Product[]>;
  getOutOfStock: () => Promise<Product[]>;
  // Return-related functions
  saveReturn: (returnData: Return) => Promise<Return>;
  removeReturn: (id: string) => Promise<void>;
  getReturnsByInvoice: (invoiceId: string) => Promise<Return[]>;
  getReturn: (id: string) => Promise<Return | undefined>;
  getReturnsByParty: (partyId: string) => Promise<Return[]>;
  refreshData: () => Promise<void>;
}

const defaultBusinessInfo: BusinessInfo = {
  name: 'BizSwift Enterprise',
  address: '123 Business Street, City, State, PIN',
  phone: '9876543210',
  email: 'contact@bizswift.com',
  gst: '22AAAAA0000A1Z5',
  termsAndConditions: '1. Payment due within 30 days\n2. Goods once sold cannot be returned\n3. All disputes subject to local jurisdiction'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(defaultBusinessInfo);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshData = async () => {
    try {
      setLoading(true);
      
      const [newParties, newInvoices, newProducts, newTransactions, newBusinessInfo, newReturns] = await Promise.all([
        getParties(),
        getInvoices(),
        getProducts(),
        getTransactions(),
        getBusinessInfo(),
        getReturns()
      ]);
      
      setParties(newParties);
      setInvoices(newInvoices);
      setProducts(newProducts);
      setTransactions(newTransactions);
      setBusinessInfo(newBusinessInfo);
      setReturns(newReturns);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addParty = async (party: Party) => {
    await saveParty(party);
    const newParties = await getParties();
    setParties(newParties);
  };

  const updateParty = async (party: Party) => {
    await saveParty(party);
    const newParties = await getParties();
    setParties(newParties);
  };

  const removeParty = async (id: string) => {
    await deleteParty(id);
    const newParties = await getParties();
    setParties(newParties);
  };

  const addInvoice = async (invoice: Invoice) => {
    const savedInvoice = await saveInvoice(invoice);
    const [newInvoices, newProducts] = await Promise.all([
      getInvoices(),
      getProducts()
    ]);
    setInvoices(newInvoices);
    setProducts(newProducts);
    return savedInvoice;
  };

  const updateInvoice = async (invoice: Invoice) => {
    await saveInvoice(invoice);
    const newInvoices = await getInvoices();
    setInvoices(newInvoices);
  };

  const removeInvoice = async (id: string) => {
    await deleteInvoice(id);
    const newInvoices = await getInvoices();
    setInvoices(newInvoices);
  };

  const saveProduct = async (product: Product) => {
    await saveProductToStorage(product);
    const newProducts = await getProducts();
    setProducts(newProducts);
  };

  const removeProduct = async (id: string) => {
    await deleteProduct(id);
    const newProducts = await getProducts();
    setProducts(newProducts);
  };

  const saveTransaction = async (transaction: Transaction) => {
    await saveTransactionToStorage(transaction);
    const newTransactions = await getTransactions();
    setTransactions(newTransactions);
    
    if (transaction.invoiceId) {
      const invoice = await getInvoiceById(transaction.invoiceId);
      if (invoice) {
        await updateInvoicePaymentStatus(invoice);
        const newInvoices = await getInvoices();
        setInvoices(newInvoices);
      }
    } else {
      await updateInvoiceStatusFromTransaction(transaction.partyId, transaction.amount);
    }
  };

  const removeTransaction = async (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    await deleteTransaction(id);
    const newTransactions = await getTransactions();
    setTransactions(newTransactions);
    
    if (transaction?.invoiceId) {
      const invoice = await getInvoiceById(transaction.invoiceId);
      if (invoice) {
        await updateInvoicePaymentStatus(invoice);
        const newInvoices = await getInvoices();
        setInvoices(newInvoices);
      }
    }
  };

  const updateBusinessInfo = async (info: BusinessInfo) => {
    await saveBusinessInfo(info);
    setBusinessInfo(info);
  };

  const getParty = async (id: string): Promise<Party | undefined> => {
    return await getPartyById(id);
  };

  const getInvoice = async (id: string): Promise<Invoice | undefined> => {
    return await getInvoiceById(id);
  };

  const getTransactionsByParty = async (partyId: string): Promise<Transaction[]> => {
    return await getTransactionsByPartyId(partyId);
  };

  const getTransactionsByInvoice = async (invoiceId: string): Promise<Transaction[]> => {
    return await getTransactionsByInvoiceId(invoiceId);
  };

  const getInvoiceRemainingBalance = async (invoiceId: string): Promise<number> => {
    return await getInvoiceRemainingAmount(invoiceId);
  };

  const recordPartialPayment = async (invoiceId: string, amount: number, paymentDetails: Partial<Transaction>) => {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) return;
    
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: invoice.partyId ? (
        (await getPartyById(invoice.partyId))?.type === 'supplier' ? 'payment' : 'receipt'
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
    
    await saveTransactionToStorage(transaction);
    const newTransactions = await getTransactions();
    setTransactions(newTransactions);
    
    const updatedInvoice = await updateInvoicePaymentStatus(invoice);
    const newInvoices = await getInvoices();
    setInvoices(newInvoices);
  };

  const updateInvoiceStatusFromTransaction = async (partyId: string, amount: number, invoiceId?: string) => {
    if (invoiceId) {
      const invoice = await getInvoiceById(invoiceId);
      if (invoice) {
        await updateInvoicePaymentStatus(invoice);
        const newInvoices = await getInvoices();
        setInvoices(newInvoices);
      }
      return;
    }
    
    const allInvoices = await getInvoices();
    const partyInvoices = allInvoices
      .filter(inv => inv.partyId === partyId && (inv.status === 'unpaid' || inv.status === 'partial'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (partyInvoices.length === 0) return;

    let remainingAmount = amount;
    const updatedInvoices = [];

    for (const invoice of partyInvoices) {
      const remainingInvoiceAmount = invoice.total - invoice.paidAmount;
      
      if (remainingAmount >= remainingInvoiceAmount) {
        invoice.paidAmount = invoice.total;
        invoice.status = 'paid';
        remainingAmount -= remainingInvoiceAmount;
        updatedInvoices.push(invoice);
      } else if (remainingAmount > 0) {
        invoice.paidAmount += remainingAmount;
        invoice.status = 'partial';
        updatedInvoices.push(invoice);
        remainingAmount = 0;
        break;
      } else {
        break;
      }
    }

    for (const invoice of updatedInvoices) {
      await saveInvoice(invoice);
    }

    if (updatedInvoices.length > 0) {
      const newInvoices = await getInvoices();
      setInvoices(newInvoices);
    }
  };

  const adjustStock = async (productId: string, quantity: number): Promise<boolean> => {
    const result = await adjustProductStock(productId, quantity);
    if (result) {
      const newProducts = await getProducts();
      setProducts(newProducts);
    }
    return result;
  };

  const getLowStock = async (): Promise<Product[]> => {
    return await getLowStockProducts();
  };

  const getOutOfStock = async (): Promise<Product[]> => {
    return await getOutOfStockProducts();
  };

  const saveReturn = async (returnData: Return): Promise<Return> => {
    const savedReturn = await saveReturnToStorage(returnData);
    const newReturns = await getReturns();
    setReturns(newReturns);
    
    if (returnData.status === 'processed') {
      const newProducts = await getProducts();
      setProducts(newProducts);
    }
    
    return savedReturn;
  };

  const removeReturn = async (id: string): Promise<void> => {
    await deleteReturn(id);
    const newReturns = await getReturns();
    setReturns(newReturns);
  };

  const getReturnsByInvoice = async (invoiceId: string): Promise<Return[]> => {
    return returns.filter(ret => ret.invoiceId === invoiceId);
  };

  const getReturn = async (id: string): Promise<Return | undefined> => {
    return await getReturnById(id);
  };

  const getReturnsByParty = async (partyId: string): Promise<Return[]> => {
    return await getReturnsByPartyId(partyId);
  };

  return (
    <AppContext.Provider
      value={{
        parties,
        invoices,
        products,
        transactions,
        returns,
        businessInfo,
        loading,
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
        recordPartialPayment,
        adjustStock,
        getLowStock,
        getOutOfStock,
        saveReturn,
        removeReturn,
        getReturnsByInvoice,
        getReturn,
        getReturnsByParty,
        refreshData
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
