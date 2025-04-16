
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { BusinessInfo } from '@/lib/storage';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Download, Upload, Database } from 'lucide-react';
import { openDB, STORES } from '@/lib/db';

const SettingsPage: React.FC = () => {
  const { businessInfo, updateBusinessInfo, parties, invoices, products, transactions, refreshData } = useApp();
  const [formData, setFormData] = useState<BusinessInfo>(businessInfo);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await updateBusinessInfo(formData);
      toast({
        title: 'Settings Updated',
        description: 'Your business information has been updated successfully.',
      });
    } else {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting.',
        variant: 'destructive',
      });
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      // Create a JSON blob with all the app data
      const exportData = {
        businessInfo,
        parties,
        invoices,
        products,
        transactions,
        timestamp: new Date().toISOString(),
        appVersion: '1.0.0',
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `bizswift-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Backup Created',
        description: 'Your business data has been exported successfully.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while exporting your data.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBackupFile(e.target.files[0]);
    }
  };

  const handleImportData = async () => {
    if (!backupFile) {
      toast({
        title: 'Error',
        description: 'Please select a backup file first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsImporting(true);
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          if (typeof event.target?.result === 'string') {
            const importedData = JSON.parse(event.target.result);
            
            // Validate the imported data has the required structure
            if (!importedData.businessInfo || !importedData.parties || !importedData.invoices) {
              throw new Error('Invalid backup file format');
            }
            
            console.log("Importing data:", importedData);
            
            // Store the imported data in IndexedDB
            const db = await openDB();
            
            // Clear existing data before importing
            const clearStores = async () => {
              const storeNames = [
                STORES.BUSINESS_INFO,
                STORES.PARTIES,
                STORES.INVOICES,
                STORES.PRODUCTS,
                STORES.TRANSACTIONS
              ];
              
              for (const storeName of storeNames) {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                await store.clear();
                await new Promise<void>((resolve) => {
                  transaction.oncomplete = () => resolve();
                  transaction.onerror = (e) => {
                    console.error(`Error clearing ${storeName}:`, e);
                    resolve();
                  };
                });
              }
            };
            
            await clearStores();
            
            // Import business info
            if (importedData.businessInfo) {
              const transaction = db.transaction(STORES.BUSINESS_INFO, 'readwrite');
              const store = transaction.objectStore(STORES.BUSINESS_INFO);
              console.log("Adding business info:", importedData.businessInfo);
              const request = store.add(importedData.businessInfo);
              
              request.onerror = (e) => {
                console.error("Error importing business info:", e);
              };
              
              await new Promise<void>((resolve) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = (e) => {
                  console.error("Transaction error for business info:", e);
                  resolve();
                };
              });
            }
            
            // Import parties
            if (importedData.parties && importedData.parties.length > 0) {
              const transaction = db.transaction(STORES.PARTIES, 'readwrite');
              const store = transaction.objectStore(STORES.PARTIES);
              console.log("Adding parties:", importedData.parties.length);
              
              for (const party of importedData.parties) {
                const request = store.add(party);
                request.onerror = (e) => {
                  console.error("Error importing party:", party.id, e);
                };
              }
              
              await new Promise<void>((resolve) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = (e) => {
                  console.error("Transaction error for parties:", e);
                  resolve();
                };
              });
            }
            
            // Import invoices
            if (importedData.invoices && importedData.invoices.length > 0) {
              const transaction = db.transaction(STORES.INVOICES, 'readwrite');
              const store = transaction.objectStore(STORES.INVOICES);
              console.log("Adding invoices:", importedData.invoices.length);
              
              for (const invoice of importedData.invoices) {
                const request = store.add(invoice);
                request.onerror = (e) => {
                  console.error("Error importing invoice:", invoice.id, e);
                };
              }
              
              await new Promise<void>((resolve) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = (e) => {
                  console.error("Transaction error for invoices:", e);
                  resolve();
                };
              });
            }
            
            // Import products
            if (importedData.products && importedData.products.length > 0) {
              const transaction = db.transaction(STORES.PRODUCTS, 'readwrite');
              const store = transaction.objectStore(STORES.PRODUCTS);
              console.log("Adding products:", importedData.products.length);
              
              for (const product of importedData.products) {
                const request = store.add(product);
                request.onerror = (e) => {
                  console.error("Error importing product:", product.id, e);
                };
              }
              
              await new Promise<void>((resolve) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = (e) => {
                  console.error("Transaction error for products:", e);
                  resolve();
                };
              });
            }
            
            // Import transactions
            if (importedData.transactions && importedData.transactions.length > 0) {
              const transaction = db.transaction(STORES.TRANSACTIONS, 'readwrite');
              const store = transaction.objectStore(STORES.TRANSACTIONS);
              console.log("Adding transactions:", importedData.transactions.length);
              
              for (const t of importedData.transactions) {
                const request = store.add(t);
                request.onerror = (e) => {
                  console.error("Error importing transaction:", t.id, e);
                };
              }
              
              await new Promise<void>((resolve) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = (e) => {
                  console.error("Transaction error for transactions:", e);
                  resolve();
                };
              });
            }
            
            db.close();
            
            console.log("Import completed, refreshing data");
            
            // Refresh the app data
            await refreshData();
            
            toast({
              title: 'Import Successful',
              description: 'Your business data has been imported successfully.',
            });
            
            // Reset UI state
            setIsImporting(false);
            setBackupFile(null);
            // Reset the file input
            const fileInput = document.getElementById('backup-file') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
          }
        } catch (error) {
          console.error('Import parsing error:', error);
          toast({
            title: 'Import Failed',
            description: 'The selected file is not a valid backup file.',
            variant: 'destructive',
          });
          setIsImporting(false);
          setBackupFile(null);
          // Reset the file input
          const fileInput = document.getElementById('backup-file') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
        }
      };
      
      reader.onerror = () => {
        setIsImporting(false);
        toast({
          title: 'Import Failed',
          description: 'Failed to read the backup file.',
          variant: 'destructive',
        });
      };
      
      reader.readAsText(backupFile);
    } catch (error) {
      console.error('Import error:', error);
      setIsImporting(false);
      toast({
        title: 'Import Failed',
        description: 'An error occurred while importing your data.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Settings</h1>
        <p className="text-muted-foreground">Manage your business information and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Backup & Restore</CardTitle>
          <CardDescription>Backup or restore your business data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Backup Data</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Export all your business data including parties, invoices, products, 
                and transactions to a JSON file.
              </p>
              <Button 
                onClick={handleExportData}
                className="w-full md:w-auto"
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Download Backup'}
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Restore Data</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Import previously exported backup data. This will overwrite your current data.
              </p>
              <div className="grid gap-4">
                <Input 
                  id="backup-file" 
                  type="file" 
                  accept=".json"
                  onChange={handleBackupFileChange}
                  disabled={isImporting}
                />
                <Button 
                  onClick={handleImportData}
                  disabled={!backupFile || isImporting}
                  className="w-full md:w-auto"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isImporting ? 'Importing...' : 'Restore Backup'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              This information will appear on your invoices and other documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className={errors.name ? 'text-destructive' : ''}>
                  Business Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className={errors.email ? 'text-destructive' : ''}>
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className={errors.phone ? 'text-destructive' : ''}>
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gst">
                  GST Number (Optional)
                </Label>
                <Input
                  id="gst"
                  name="gst"
                  value={formData.gst || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2 mt-6">
              <Label htmlFor="address" className={errors.address ? 'text-destructive' : ''}>
                Business Address
              </Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className={errors.address ? 'border-destructive' : ''}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
            <CardDescription>
              Customize the terms and conditions that appear on your invoices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">
                Terms and Conditions
              </Label>
              <Textarea
                id="termsAndConditions"
                name="termsAndConditions"
                value={formData.termsAndConditions}
                onChange={handleChange}
                rows={5}
                placeholder="Enter your business terms and conditions..."
              />
            </div>
            
            <div className="flex justify-end mt-6">
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default SettingsPage;
