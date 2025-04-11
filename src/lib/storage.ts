
// Types for our data
export interface Party {
  id: string;
  name: string;
  type: 'customer' | 'supplier';
  mobile: string;
  address: string;
  gst?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock?: number;
  unit?: string;
}

export interface InvoiceItem {
  id: string;
  product: string;
  qty: number;
  rate: number;
  amount: number;
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
  status: 'paid' | 'unpaid';
}

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  gst?: string;
  termsAndConditions: string;
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

// Storage keys
const PARTIES_KEY = 'bizswift_parties';
const INVOICES_KEY = 'bizswift_invoices';
const BUSINESS_INFO_KEY = 'bizswift_business_info';
const PRODUCTS_KEY = 'bizswift_products';

// Helper functions
export const getParties = (): Party[] => {
  const partiesJson = localStorage.getItem(PARTIES_KEY);
  return partiesJson ? JSON.parse(partiesJson) : [];
};

export const saveParty = (party: Party): void => {
  const parties = getParties();
  if (!party.id) {
    party.id = crypto.randomUUID();
  }
  
  const existingIndex = parties.findIndex(p => p.id === party.id);
  if (existingIndex >= 0) {
    parties[existingIndex] = party;
  } else {
    parties.push(party);
  }
  
  localStorage.setItem(PARTIES_KEY, JSON.stringify(parties));
};

export const deleteParty = (id: string): void => {
  const parties = getParties().filter(party => party.id !== id);
  localStorage.setItem(PARTIES_KEY, JSON.stringify(parties));
};

export const getPartyById = (id: string): Party | undefined => {
  return getParties().find(party => party.id === id);
};

// Products functions
export const getProducts = (): Product[] => {
  const productsJson = localStorage.getItem(PRODUCTS_KEY);
  return productsJson ? JSON.parse(productsJson) : [];
};

export const saveProduct = (product: Product): void => {
  const products = getProducts();
  if (!product.id) {
    product.id = crypto.randomUUID();
  }
  
  const existingIndex = products.findIndex(p => p.id === product.id);
  if (existingIndex >= 0) {
    products[existingIndex] = product;
  } else {
    products.push(product);
  }
  
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

export const deleteProduct = (id: string): void => {
  const products = getProducts().filter(product => product.id !== id);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

export const getProductById = (id: string): Product | undefined => {
  return getProducts().find(product => product.id === id);
};

export const getInvoices = (): Invoice[] => {
  const invoicesJson = localStorage.getItem(INVOICES_KEY);
  return invoicesJson ? JSON.parse(invoicesJson) : [];
};

// Improved invoice number generation
export const generateInvoiceNumber = (): string => {
  const invoices = getInvoices();
  const date = new Date();
  const year = date.getFullYear().toString().substring(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Find the highest invoice number for the current month
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

export const saveInvoice = (invoice: Invoice): Invoice => {
  const invoices = getInvoices();
  if (!invoice.id) {
    invoice.id = crypto.randomUUID();
  }
  
  // Generate invoice number if not present
  if (!invoice.invoiceNumber) {
    invoice.invoiceNumber = generateInvoiceNumber();
  }
  
  const existingIndex = invoices.findIndex(i => i.id === invoice.id);
  if (existingIndex >= 0) {
    invoices[existingIndex] = invoice;
  } else {
    invoices.push(invoice);
  }
  
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  return invoice;
};

export const deleteInvoice = (id: string): void => {
  const invoices = getInvoices().filter(invoice => invoice.id !== id);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
};

export const getInvoiceById = (id: string): Invoice | undefined => {
  return getInvoices().find(invoice => invoice.id === id);
};

export const getInvoicesByPartyId = (partyId: string): Invoice[] => {
  return getInvoices().filter(invoice => invoice.partyId === partyId);
};

export const getBusinessInfo = (): BusinessInfo => {
  const infoJson = localStorage.getItem(BUSINESS_INFO_KEY);
  return infoJson ? JSON.parse(infoJson) : defaultBusinessInfo;
};

export const saveBusinessInfo = (info: BusinessInfo): void => {
  localStorage.setItem(BUSINESS_INFO_KEY, JSON.stringify(info));
};

// Filter invoices by date range
export const getInvoicesByDateRange = (startDate: string, endDate: string): Invoice[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59);
  
  return getInvoices().filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    return invoiceDate >= start && invoiceDate <= end;
  });
};

// Generate a quick invoice for a single product
export const generateQuickInvoice = (
  partyId: string, 
  productId: string, 
  quantity: number, 
  discount: number = 0, 
  gstPercentage: number = 18,
  status: 'paid' | 'unpaid' = 'unpaid'
): Invoice => {
  const product = getProductById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  const amount = product.price * quantity;
  const subtotal = amount;
  const gstAmount = (subtotal * gstPercentage) / 100;
  const total = subtotal + gstAmount - discount;
  
  const invoiceItem: InvoiceItem = {
    id: crypto.randomUUID(),
    product: product.name,
    qty: quantity,
    rate: product.price,
    amount: amount
  };
  
  const invoice: Invoice = {
    id: crypto.randomUUID(),
    invoiceNumber: generateInvoiceNumber(),
    partyId,
    date: new Date().toISOString().split('T')[0],
    items: [invoiceItem],
    subtotal,
    gstPercentage,
    gstAmount,
    discount,
    total,
    status
  };
  
  return saveInvoice(invoice);
};
