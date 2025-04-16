// Types for our data
export interface Party {
  id: string;
  name: string;
  type: 'customer' | 'supplier';
  mobile: string;
  address: string;
  gst?: string;
  state?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  unit?: string;
  hsn?: string;
  lowStockAlert?: number;
  costPrice?: number;
}

export interface InvoiceItem {
  id: string;
  product: string;
  productId: string;
  qty: number;
  rate: number;
  amount: number;
  hsn?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  partyId: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  discount: number;
  total: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  deliveryBy?: string;
  transport?: string;
  vehicleNo?: string;
  eWayBillNo?: string;
  poNumber?: string;
  paymentTerm?: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'receipt';
  amount: number;
  date: string;
  partyId: string;
  invoiceId?: string;
  mode: 'cash' | 'bank_transfer' | 'upi' | 'cheque';
  description?: string;
  reference?: string;
  createdAt: string;
}

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  gst?: string;
  termsAndConditions: string;
}

export interface ReturnItem {
  id: string;
  productId: string;
  product: string;
  qty: number;
  rate: number;
  amount: number;
  reason?: string;
  hsn?: string;
}

export interface Return {
  id: string;
  returnNumber: string;
  date: string;
  invoiceId?: string;
  invoiceNumber?: string;
  partyId: string;
  items: ReturnItem[];
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  total: number;
  status: 'pending' | 'processed' | 'rejected';
  notes?: string;
  type: 'purchase' | 'sales';
}

// Default business info
const defaultBusinessInfo: BusinessInfo = {
  name: 'BizSwift Enterprise',
  address: '123 Business Street, City, State, PIN',
  phone: '9876543210',
  email: 'contact@bizswift.com',
  gst: '22AAAAA0000A1Z5',
  termsAndConditions: '1. Payment due within 30 days\n2. Goods once sold cannot be returned\n3. All disputes subject to local jurisdiction'
};

// Import IndexedDB utilities
import { 
  openDB, 
  getAllItems, 
  getItemById, 
  saveItem, 
  deleteItem, 
  STORES,
  migrateFromLocalStorage
} from './db';

// Initialize the database and migrate data from localStorage if needed
let dbInitialized = false;

const initializeDB = async (): Promise<void> => {
  if (!dbInitialized) {
    await migrateFromLocalStorage();
    dbInitialized = true;
  }
};

// Initialize DB when this module is loaded
initializeDB().catch(console.error);

// Helper functions
export const getParties = async (): Promise<Party[]> => {
  await initializeDB();
  return await getAllItems<Party>(STORES.PARTIES);
};

export const saveParty = async (party: Party): Promise<void> => {
  await initializeDB();
  await saveItem<Party>(STORES.PARTIES, party);
};

export const deleteParty = async (id: string): Promise<void> => {
  await initializeDB();
  await deleteItem(STORES.PARTIES, id);
};

export const getPartyById = async (id: string): Promise<Party | undefined> => {
  await initializeDB();
  return await getItemById<Party>(STORES.PARTIES, id);
};

// Products functions
export const getProducts = async (): Promise<Product[]> => {
  await initializeDB();
  return await getAllItems<Product>(STORES.PRODUCTS);
};

export const saveProduct = async (product: Product): Promise<void> => {
  await initializeDB();
  if (product.stock === undefined) {
    product.stock = 0;
  }
  await saveItem<Product>(STORES.PRODUCTS, product);
};

export const deleteProduct = async (id: string): Promise<void> => {
  await initializeDB();
  await deleteItem(STORES.PRODUCTS, id);
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  await initializeDB();
  return await getItemById<Product>(STORES.PRODUCTS, id);
};

export const adjustProductStock = async (productId: string, quantity: number): Promise<boolean> => {
  await initializeDB();
  const product = await getProductById(productId);
  if (!product) return false;
  
  product.stock += quantity;
  await saveProduct(product);
  return true;
};

export const hasEnoughStock = async (productId: string, requestedQty: number): Promise<boolean> => {
  await initializeDB();
  const product = await getProductById(productId);
  if (!product) return false;
  return product.stock >= requestedQty;
};

export const getInvoices = async (): Promise<Invoice[]> => {
  await initializeDB();
  const invoices = await getAllItems<Invoice>(STORES.INVOICES);
  
  return invoices.map((invoice: Invoice) => {
    if (invoice.paidAmount === undefined) {
      invoice.paidAmount = invoice.status === 'paid' ? invoice.total : 0;
    }
    return invoice;
  });
};

export const generateInvoiceNumber = async (): Promise<string> => {
  await initializeDB();
  const invoices = await getInvoices();
  const date = new Date();
  const year = date.getFullYear().toString().substring(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const monthPrefix = `INV-${year}${month}-`;
  const monthInvoices = invoices.filter(inv => inv.invoiceNumber.startsWith(monthPrefix));
  
  let maxNumber = 0;
  monthInvoices.forEach(invoice => {
    const numberPart = invoice.invoiceNumber.split('-')[2];
    const number = parseInt(numberPart);
    if (!isNaN(number) && number > maxNumber) {
      maxNumber = number;
    }
  });
  
  const nextNumber = maxNumber + 1;
  return `${monthPrefix}${nextNumber.toString().padStart(3, '0')}`;
};

export const saveInvoice = async (invoice: Invoice): Promise<Invoice> => {
  await initializeDB();
  const invoices = await getInvoices();
  const isNewInvoice = !invoice.id || !invoices.some(i => i.id === invoice.id);
  
  if (!invoice.id) {
    invoice.id = crypto.randomUUID();
  }
  
  if (!invoice.invoiceNumber) {
    invoice.invoiceNumber = await generateInvoiceNumber();
  }
  
  if (invoice.paidAmount === undefined) {
    invoice.paidAmount = invoice.status === 'paid' ? invoice.total : 0;
  }
  
  if (invoice.paidAmount >= invoice.total) {
    invoice.status = 'paid';
  } else if (invoice.paidAmount > 0) {
    invoice.status = 'partial';
  } else {
    invoice.status = 'unpaid';
  }
  
  if (isNewInvoice) {
    const party = await getPartyById(invoice.partyId);
    
    if (party?.type === 'customer') {
      for (const item of invoice.items) {
        if (item.productId) {
          await adjustProductStock(item.productId, -item.qty);
        }
      }
    } else if (party?.type === 'supplier') {
      for (const item of invoice.items) {
        if (item.productId) {
          await adjustProductStock(item.productId, item.qty);
        }
      }
    }
  }
  
  await saveItem<Invoice>(STORES.INVOICES, invoice);
  return invoice;
};

export const deleteInvoice = async (id: string): Promise<void> => {
  await initializeDB();
  await deleteItem(STORES.INVOICES, id);
};

export const getInvoiceById = async (id: string): Promise<Invoice | undefined> => {
  await initializeDB();
  return await getItemById<Invoice>(STORES.INVOICES, id);
};

export const getInvoicesByPartyId = async (partyId: string): Promise<Invoice[]> => {
  await initializeDB();
  const invoices = await getInvoices();
  return invoices.filter(invoice => invoice.partyId === partyId);
};

export const getBusinessInfo = async (): Promise<BusinessInfo> => {
  await initializeDB();
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.BUSINESS_INFO, 'readonly');
      const store = transaction.objectStore(STORES.BUSINESS_INFO);
      const request = store.getAll();
      
      request.onsuccess = () => {
        if (request.result && request.result.length > 0) {
          resolve(request.result[0]);
        } else {
          resolve(defaultBusinessInfo);
        }
      };
      
      request.onerror = () => {
        console.error('Error getting business info:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to get business info:', error);
    return defaultBusinessInfo;
  }
};

export const saveBusinessInfo = async (info: BusinessInfo): Promise<void> => {
  await initializeDB();
  await saveItem(STORES.BUSINESS_INFO, info);
};

export const getInvoicesByDateRange = async (startDate: string, endDate: string): Promise<Invoice[]> => {
  await initializeDB();
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59);
  
  const invoices = await getInvoices();
  return invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    return invoiceDate >= start && invoiceDate <= end;
  });
};

export const generateQuickInvoice = async (
  partyId: string, 
  productId: string, 
  quantity: number, 
  discount: number = 0, 
  gstPercentage: number = 18,
  status: 'paid' | 'partial' | 'unpaid' = 'unpaid'
): Promise<Invoice> => {
  await initializeDB();
  const product = await getProductById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  const party = await getPartyById(partyId);
  if (!party) {
    throw new Error('Party not found');
  }
  
  if (party.type === 'customer' && !(await hasEnoughStock(productId, quantity))) {
    throw new Error(`Not enough stock available for ${product.name}. Current stock: ${product.stock}`);
  }
  
  const amount = product.price * quantity;
  const subtotal = amount;
  const gstAmount = (subtotal * gstPercentage) / 100;
  const total = subtotal + gstAmount - discount;
  
  const invoiceItem: InvoiceItem = {
    id: crypto.randomUUID(),
    product: product.name,
    productId: product.id,
    qty: quantity,
    rate: product.price,
    amount: amount,
    hsn: product.hsn
  };
  
  const invoice: Invoice = {
    id: crypto.randomUUID(),
    invoiceNumber: await generateInvoiceNumber(),
    partyId,
    date: new Date().toISOString().split('T')[0],
    items: [invoiceItem],
    subtotal,
    gstPercentage,
    gstAmount,
    discount,
    total,
    paidAmount: status === 'paid' ? total : 0,
    status,
    deliveryBy: '',
    transport: '',
    vehicleNo: '',
    eWayBillNo: '',
    poNumber: '',
    paymentTerm: ''
  };
  
  return await saveInvoice(invoice);
};

export const getLowStockProducts = async (): Promise<Product[]> => {
  await initializeDB();
  const products = await getProducts();
  return products.filter(product => {
    const threshold = product.lowStockAlert || 5;
    return product.stock <= threshold;
  });
};

export const getOutOfStockProducts = async (): Promise<Product[]> => {
  await initializeDB();
  const products = await getProducts();
  return products.filter(product => product.stock <= 0);
};

export const getStockMovementHistory = async (productId: string): Promise<{ date: string, change: number, invoiceId: string, invoiceNumber: string }[]> => {
  await initializeDB();
  const history: { date: string, change: number, invoiceId: string, invoiceNumber: string }[] = [];
  
  const invoices = await getInvoices();
  
  for (const invoice of invoices) {
    const party = await getPartyById(invoice.partyId);
    if (!party) continue;
    
    const isCustomer = party.type === 'customer';
    
    for (const item of invoice.items) {
      if (item.productId === productId) {
        history.push({
          date: invoice.date,
          change: isCustomer ? -item.qty : item.qty,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber
        });
      }
    }
  }
  
  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getTransactions = async (): Promise<Transaction[]> => {
  await initializeDB();
  return await getAllItems<Transaction>(STORES.TRANSACTIONS);
};

export const saveTransaction = async (transaction: Transaction): Promise<void> => {
  await initializeDB();
  if (!transaction.id) {
    transaction.id = crypto.randomUUID();
  }
  
  if (!transaction.createdAt) {
    transaction.createdAt = new Date().toISOString();
  }
  
  await saveItem<Transaction>(STORES.TRANSACTIONS, transaction);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await initializeDB();
  await deleteItem(STORES.TRANSACTIONS, id);
};

export const getTransactionsByPartyId = async (partyId: string): Promise<Transaction[]> => {
  await initializeDB();
  const transactions = await getTransactions();
  return transactions.filter(transaction => transaction.partyId === partyId);
};

export const getTransactionsByType = async (type: 'payment' | 'receipt'): Promise<Transaction[]> => {
  await initializeDB();
  const transactions = await getTransactions();
  return transactions.filter(transaction => transaction.type === type);
};

export const getTransactionsByInvoiceId = async (invoiceId: string): Promise<Transaction[]> => {
  await initializeDB();
  const transactions = await getTransactions();
  return transactions.filter(transaction => transaction.invoiceId === invoiceId);
};

export const getInvoiceRemainingAmount = async (invoiceId: string): Promise<number> => {
  await initializeDB();
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) return 0;
  
  return Math.max(0, invoice.total - invoice.paidAmount);
};

export const updateInvoicePaymentStatus = async (invoice: Invoice): Promise<Invoice> => {
  await initializeDB();
  const transactions = await getTransactionsByInvoiceId(invoice.id);
  const paidAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  const updatedInvoice = {
    ...invoice,
    paidAmount: paidAmount
  };
  
  if (paidAmount >= invoice.total) {
    updatedInvoice.status = 'paid';
  } else if (paidAmount > 0) {
    updatedInvoice.status = 'partial';
  } else {
    updatedInvoice.status = 'unpaid';
  }
  
  return await saveInvoice(updatedInvoice);
};

// Returns functions
export const getReturns = async (): Promise<Return[]> => {
  await initializeDB();
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.RETURNS, 'readonly');
      const store = transaction.objectStore(STORES.RETURNS);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        console.error('Error getting returns:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to get returns:', error);
    return [];
  }
};

export const saveReturn = async (returnData: Return): Promise<Return> => {
  await initializeDB();
  
  if (!returnData.id) {
    returnData.id = crypto.randomUUID();
  }
  
  if (!returnData.returnNumber) {
    returnData.returnNumber = await generateReturnNumber(returnData.type);
  }
  
  // Process inventory adjustment based on return type
  if (returnData.status === 'processed') {
    for (const item of returnData.items) {
      if (item.productId) {
        // For purchase return, we're returning products to supplier, so decrease stock
        // For sales return, we're getting products back from customer, so increase stock
        const quantityChange = returnData.type === 'purchase' ? -item.qty : item.qty;
        await adjustProductStock(item.productId, quantityChange);
      }
    }
  }
  
  await saveItem<Return>(STORES.RETURNS, returnData);
  return returnData;
};

export const deleteReturn = async (id: string): Promise<void> => {
  await initializeDB();
  await deleteItem(STORES.RETURNS, id);
};

export const getReturnById = async (id: string): Promise<Return | undefined> => {
  await initializeDB();
  return await getItemById<Return>(STORES.RETURNS, id);
};

export const getReturnsByType = async (type: 'purchase' | 'sales'): Promise<Return[]> => {
  await initializeDB();
  const returns = await getReturns();
  return returns.filter(returnData => returnData.type === type);
};

export const getReturnsByPartyId = async (partyId: string): Promise<Return[]> => {
  await initializeDB();
  const returns = await getReturns();
  return returns.filter(returnData => returnData.partyId === partyId);
};

export const getReturnsByInvoiceId = async (invoiceId: string): Promise<Return[]> => {
  await initializeDB();
  const returns = await getReturns();
  return returns.filter(returnData => returnData.invoiceId === invoiceId);
};

export const generateReturnNumber = async (type: 'purchase' | 'sales'): Promise<string> => {
  await initializeDB();
  const returns = await getReturns();
  const date = new Date();
  const year = date.getFullYear().toString().substring(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const prefix = type === 'purchase' ? 'PR-' : 'SR-';
  const monthPrefix = `${prefix}${year}${month}-`;
  
  const monthReturns = returns.filter(ret => ret.returnNumber.startsWith(monthPrefix));
  
  let maxNumber = 0;
  monthReturns.forEach(ret => {
    const numberPart = ret.returnNumber.split('-')[2];
    const number = parseInt(numberPart);
    if (!isNaN(number) && number > maxNumber) {
      maxNumber = number;
    }
  });
  
  const nextNumber = maxNumber + 1;
  return `${monthPrefix}${nextNumber.toString().padStart(3, '0')}`;
};
