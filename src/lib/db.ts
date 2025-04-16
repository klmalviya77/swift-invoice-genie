
/**
 * IndexedDB utility for data storage
 */

// Define the database name and version
const DB_NAME = 'bizswift_db';
const DB_VERSION = 1;

// Define the object stores (tables)
const STORES = {
  PARTIES: 'parties',
  INVOICES: 'invoices',
  PRODUCTS: 'products',
  TRANSACTIONS: 'transactions',
  BUSINESS_INFO: 'business_info'
};

// Helper to open the database connection
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = (event) => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.PARTIES)) {
        db.createObjectStore(STORES.PARTIES, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.INVOICES)) {
        db.createObjectStore(STORES.INVOICES, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.BUSINESS_INFO)) {
        // Use 'name' as the keyPath for BusinessInfo
        const businessInfoStore = db.createObjectStore(STORES.BUSINESS_INFO, { keyPath: 'name' });
      }
    };
  });
};

// Generic function to get all items from a store
export const getAllItems = async <T>(storeName: string): Promise<T[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error(`Error getting items from ${storeName}:`, request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Failed to get items from ${storeName}:`, error);
    return [];
  }
};

// Generic function to get an item by its ID
export const getItemById = async <T>(storeName: string, id: string): Promise<T | undefined> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error(`Error getting item from ${storeName}:`, request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Failed to get item from ${storeName}:`, error);
    return undefined;
  }
};

// Generic function to save an item
export const saveItem = async <T>(
  storeName: string, 
  item: T,
  generateId: () => string = () => crypto.randomUUID()
): Promise<T> => {
  try {
    // Special case for BusinessInfo which uses 'name' as keyPath, not 'id'
    if (storeName === STORES.BUSINESS_INFO) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        
        request.onsuccess = () => {
          resolve(item);
        };
        
        request.onerror = () => {
          console.error(`Error saving item to ${storeName}:`, request.error);
          reject(request.error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      });
    }
    
    // For normal objects with 'id' field
    const itemWithId = item as any;
    if (!itemWithId.id) {
      itemWithId.id = generateId();
    }
    
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(itemWithId);
      
      request.onsuccess = () => {
        resolve(itemWithId);
      };
      
      request.onerror = () => {
        console.error(`Error saving item to ${storeName}:`, request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Failed to save item to ${storeName}:`, error);
    throw error;
  }
};

// Generic function to delete an item
export const deleteItem = async (storeName: string, id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        console.error(`Error deleting item from ${storeName}:`, request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Failed to delete item from ${storeName}:`, error);
    throw error;
  }
};

// Migration function to transfer data from localStorage to IndexedDB
export const migrateFromLocalStorage = async (): Promise<void> => {
  try {
    // Migrate parties
    const partiesJson = localStorage.getItem('bizswift_parties');
    if (partiesJson) {
      const parties = JSON.parse(partiesJson);
      const db = await openDB();
      const transaction = db.transaction(STORES.PARTIES, 'readwrite');
      const store = transaction.objectStore(STORES.PARTIES);
      
      for (const party of parties) {
        store.put(party);
      }
      
      await new Promise<void>((resolve) => {
        transaction.oncomplete = () => {
          resolve();
        };
      });
      
      db.close();
    }
    
    // Migrate invoices
    const invoicesJson = localStorage.getItem('bizswift_invoices');
    if (invoicesJson) {
      const invoices = JSON.parse(invoicesJson);
      const db = await openDB();
      const transaction = db.transaction(STORES.INVOICES, 'readwrite');
      const store = transaction.objectStore(STORES.INVOICES);
      
      for (const invoice of invoices) {
        store.put(invoice);
      }
      
      await new Promise<void>((resolve) => {
        transaction.oncomplete = () => {
          resolve();
        };
      });
      
      db.close();
    }
    
    // Migrate products
    const productsJson = localStorage.getItem('bizswift_products');
    if (productsJson) {
      const products = JSON.parse(productsJson);
      const db = await openDB();
      const transaction = db.transaction(STORES.PRODUCTS, 'readwrite');
      const store = transaction.objectStore(STORES.PRODUCTS);
      
      for (const product of products) {
        store.put(product);
      }
      
      await new Promise<void>((resolve) => {
        transaction.oncomplete = () => {
          resolve();
        };
      });
      
      db.close();
    }
    
    // Migrate transactions
    const transactionsJson = localStorage.getItem('bizswift_transactions');
    if (transactionsJson) {
      const transactions = JSON.parse(transactionsJson);
      const db = await openDB();
      const transaction = db.transaction(STORES.TRANSACTIONS, 'readwrite');
      const store = transaction.objectStore(STORES.TRANSACTIONS);
      
      for (const t of transactions) {
        store.put(t);
      }
      
      await new Promise<void>((resolve) => {
        transaction.oncomplete = () => {
          resolve();
        };
      });
      
      db.close();
    }
    
    // Migrate business info
    const businessInfoJson = localStorage.getItem('bizswift_business_info');
    if (businessInfoJson) {
      const businessInfo = JSON.parse(businessInfoJson);
      const db = await openDB();
      const transaction = db.transaction(STORES.BUSINESS_INFO, 'readwrite');
      const store = transaction.objectStore(STORES.BUSINESS_INFO);
      
      store.put(businessInfo);
      
      await new Promise<void>((resolve) => {
        transaction.oncomplete = () => {
          resolve();
        };
      });
      
      db.close();
    }
    
    console.log('Migration from localStorage to IndexedDB completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Export store names for use in other modules
export { STORES };
