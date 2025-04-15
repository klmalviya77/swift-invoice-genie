
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash, 
  Package,
  ArrowDown,
  ArrowUp,
  Tag,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useApp } from '@/contexts/AppContext';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetFooter, 
  SheetClose 
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { 
  Product, 
  generateQuickInvoice, 
  getLowStockProducts,
  getOutOfStockProducts,
  getStockMovementHistory
} from '@/lib/storage';

const ProductsPage: React.FC = () => {
  const { products, parties, saveProduct, removeProduct } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Product form state
  const [formProduct, setFormProduct] = useState<Product>({
    id: '',
    name: '',
    description: '',
    price: 0,
    stock: 0,
    unit: 'pcs',
    lowStockAlert: 5,
    costPrice: 0
  });

  // Quick invoice form state
  const [quickInvoice, setQuickInvoice] = useState({
    productId: '',
    partyId: '',
    quantity: 1,
    discount: 0,
    gstPercentage: 18,
    status: 'unpaid' as 'paid' | 'unpaid'
  });

  // Stock adjustment form state
  const [stockAdjustment, setStockAdjustment] = useState({
    productId: '',
    quantity: 0,
    reason: '',
    adjustmentType: 'increase' as 'increase' | 'decrease'
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Filter products based on tab and search term
  const getFilteredProducts = () => {
    let filtered = [...products];
    
    // Apply tab filter
    if (activeTab === "low-stock") {
      filtered = getLowStockProducts();
    } else if (activeTab === "out-of-stock") {
      filtered = getOutOfStockProducts();
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((product) => {
        return (
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.price.toString().includes(searchTerm)
        );
      });
    }
    
    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let compareA, compareB;
    
    if (sortField === 'price') {
      compareA = a.price;
      compareB = b.price;
    } else if (sortField === 'stock') {
      compareA = a.stock || 0;
      compareB = b.stock || 0;
    } else {
      compareA = a[sortField as keyof typeof a];
      compareB = b[sortField as keyof typeof b];
    }
    
    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleDeleteProduct = (id: string) => {
    removeProduct(id);
    setConfirmDelete(null);
    toast({
      title: 'Product Deleted',
      description: 'The product has been deleted successfully.',
    });
  };

  const handleSaveProduct = () => {
    saveProduct(formProduct);
    setFormProduct({
      id: '',
      name: '',
      description: '',
      price: 0,
      stock: 0,
      unit: 'pcs',
      lowStockAlert: 5,
      costPrice: 0
    });
    toast({
      title: 'Product Saved',
      description: 'The product has been saved successfully.',
    });
  };

  const handleEditProduct = (product: Product) => {
    setFormProduct({ ...product });
  };

  const handleGenerateInvoice = () => {
    try {
      const newInvoice = generateQuickInvoice(
        quickInvoice.partyId,
        quickInvoice.productId,
        quickInvoice.quantity,
        quickInvoice.discount,
        quickInvoice.gstPercentage,
        quickInvoice.status
      );
      
      toast({
        title: 'Invoice Created',
        description: `Invoice ${newInvoice.invoiceNumber} has been created successfully.`,
      });
      
      // Navigate to the invoice view
      navigate(`/invoices/${newInvoice.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create invoice',
        variant: 'destructive'
      });
    }
  };

  const handleStockAdjustment = () => {
    if (!stockAdjustment.productId) {
      toast({
        title: 'Error',
        description: 'Please select a product',
        variant: 'destructive'
      });
      return;
    }

    const product = products.find(p => p.id === stockAdjustment.productId);
    if (!product) {
      toast({
        title: 'Error',
        description: 'Product not found',
        variant: 'destructive'
      });
      return;
    }

    const adjustmentValue = stockAdjustment.adjustmentType === 'increase' 
      ? stockAdjustment.quantity 
      : -stockAdjustment.quantity;

    const updatedProduct = {
      ...product,
      stock: product.stock + adjustmentValue
    };

    saveProduct(updatedProduct);
    
    toast({
      title: 'Stock Updated',
      description: `${product.name} stock has been ${stockAdjustment.adjustmentType}d by ${stockAdjustment.quantity} ${product.unit}.`,
    });

    // Reset form
    setStockAdjustment({
      productId: '',
      quantity: 0,
      reason: '',
      adjustmentType: 'increase'
    });
  };

  // Get stock status badge
  const getStockStatusBadge = (product: Product) => {
    const threshold = product.lowStockAlert || 5;
    
    if (product.stock <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (product.stock <= threshold) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  // Get product stock movement history
  const getProductHistory = (productId: string) => {
    return getStockMovementHistory(productId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products & Inventory</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>{formProduct.id ? 'Edit Product' : 'Add New Product'}</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input 
                    id="name" 
                    value={formProduct.name}
                    onChange={(e) => setFormProduct({...formProduct, name: e.target.value})}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    value={formProduct.description}
                    onChange={(e) => setFormProduct({...formProduct, description: e.target.value})}
                    placeholder="Enter product description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Selling Price</Label>
                    <Input 
                      id="price" 
                      type="number"
                      min="0"
                      value={formProduct.price}
                      onChange={(e) => setFormProduct({...formProduct, price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="costPrice">Cost Price</Label>
                    <Input 
                      id="costPrice" 
                      type="number"
                      min="0"
                      value={formProduct.costPrice || 0}
                      onChange={(e) => setFormProduct({...formProduct, costPrice: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Current Stock</Label>
                    <Input 
                      id="stock" 
                      type="number"
                      min="0"
                      value={formProduct.stock}
                      onChange={(e) => setFormProduct({...formProduct, stock: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                    <Input 
                      id="lowStockAlert" 
                      type="number"
                      min="0"
                      value={formProduct.lowStockAlert || 5}
                      onChange={(e) => setFormProduct({...formProduct, lowStockAlert: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input 
                    id="unit" 
                    value={formProduct.unit}
                    onChange={(e) => setFormProduct({...formProduct, unit: e.target.value})}
                    placeholder="pcs, kg, ltr, etc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hsn">HSN Code</Label>
                  <Input 
                    id="hsn" 
                    value={formProduct.hsn || ''}
                    onChange={(e) => setFormProduct({...formProduct, hsn: e.target.value})}
                    placeholder="HSN code"
                  />
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button onClick={handleSaveProduct}>Save</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" /> Quick Invoice
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Generate Quick Invoice</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="party">Select Customer</Label>
                  <select 
                    id="party"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={quickInvoice.partyId}
                    onChange={(e) => setQuickInvoice({...quickInvoice, partyId: e.target.value})}
                  >
                    <option value="">Select a customer</option>
                    {parties
                      .filter(party => party.type === 'customer')
                      .map(party => (
                        <option key={party.id} value={party.id}>{party.name}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product">Select Product</Label>
                  <select 
                    id="product"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={quickInvoice.productId}
                    onChange={(e) => setQuickInvoice({...quickInvoice, productId: e.target.value})}
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id} disabled={product.stock <= 0}>
                        {product.name} - ₹{product.price} {product.stock <= 0 ? '(Out of Stock)' : `(${product.stock} ${product.unit} available)`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input 
                      id="quantity" 
                      type="number"
                      min="1"
                      value={quickInvoice.quantity}
                      onChange={(e) => setQuickInvoice({...quickInvoice, quantity: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="discount">Discount</Label>
                    <Input 
                      id="discount" 
                      type="number"
                      min="0"
                      value={quickInvoice.discount}
                      onChange={(e) => setQuickInvoice({...quickInvoice, discount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="gst">GST %</Label>
                    <Input 
                      id="gst" 
                      type="number"
                      min="0"
                      max="100"
                      value={quickInvoice.gstPercentage}
                      onChange={(e) => setQuickInvoice({...quickInvoice, gstPercentage: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <select 
                      id="status"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={quickInvoice.status}
                      onChange={(e) => setQuickInvoice({...quickInvoice, status: e.target.value as 'paid' | 'unpaid'})}
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button 
                    onClick={handleGenerateInvoice}
                    disabled={!quickInvoice.partyId || !quickInvoice.productId || quickInvoice.quantity < 1}
                  >
                    Generate Invoice
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">
                <Package className="mr-2 h-4 w-4" /> Adjust Stock
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Adjust Stock</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="stockProduct">Select Product</Label>
                  <select 
                    id="stockProduct"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={stockAdjustment.productId}
                    onChange={(e) => setStockAdjustment({...stockAdjustment, productId: e.target.value})}
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Current Stock: {product.stock} {product.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="adjustmentType">Adjustment Type</Label>
                    <select 
                      id="adjustmentType"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={stockAdjustment.adjustmentType}
                      onChange={(e) => setStockAdjustment({...stockAdjustment, adjustmentType: e.target.value as 'increase' | 'decrease'})}
                    >
                      <option value="increase">Increase</option>
                      <option value="decrease">Decrease</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="adjustQuantity">Quantity</Label>
                    <Input 
                      id="adjustQuantity" 
                      type="number"
                      min="1"
                      value={stockAdjustment.quantity}
                      onChange={(e) => setStockAdjustment({...stockAdjustment, quantity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason for Adjustment</Label>
                  <Input 
                    id="reason" 
                    value={stockAdjustment.reason}
                    onChange={(e) => setStockAdjustment({...stockAdjustment, reason: e.target.value})}
                    placeholder="Enter reason for adjustment"
                  />
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button 
                    onClick={handleStockAdjustment}
                    disabled={!stockAdjustment.productId || stockAdjustment.quantity <= 0}
                  >
                    Apply Stock Adjustment
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full md:w-auto"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="low-stock">
              Low Stock 
              {getLowStockProducts().length > 0 && (
                <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800">
                  {getLowStockProducts().length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="out-of-stock">
              Out of Stock
              {getOutOfStockProducts().length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {getOutOfStockProducts().length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {sortedProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No products found</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm
              ? 'Try adjusting your search terms'
              : activeTab !== 'all'
                ? `No products with ${activeTab === 'low-stock' ? 'low stock' : 'out of stock'} status`
                : 'Get started by adding your first product'}
          </p>
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Add New Product</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name2">Product Name</Label>
                  <Input 
                    id="name2" 
                    value={formProduct.name}
                    onChange={(e) => setFormProduct({...formProduct, name: e.target.value})}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description2">Description</Label>
                  <Input 
                    id="description2" 
                    value={formProduct.description}
                    onChange={(e) => setFormProduct({...formProduct, description: e.target.value})}
                    placeholder="Enter product description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price2">Price</Label>
                    <Input 
                      id="price2" 
                      type="number"
                      min="0"
                      value={formProduct.price}
                      onChange={(e) => setFormProduct({...formProduct, price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock2">Stock</Label>
                    <Input 
                      id="stock2" 
                      type="number"
                      min="0"
                      value={formProduct.stock}
                      onChange={(e) => setFormProduct({...formProduct, stock: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit2">Unit</Label>
                  <Input 
                    id="unit2" 
                    value={formProduct.unit}
                    onChange={(e) => setFormProduct({...formProduct, unit: e.target.value})}
                    placeholder="pcs, kg, ltr, etc."
                  />
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button onClick={handleSaveProduct}>Save</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                  <div className="flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    Name
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('description')}>
                  <div className="flex items-center">
                    Description
                    {getSortIcon('description')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('price')}>
                  <div className="flex items-center justify-end">
                    <Tag className="mr-2 h-4 w-4" />
                    Price
                    {getSortIcon('price')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('stock')}>
                  <div className="flex items-center justify-end">
                    Stock
                    {getSortIcon('stock')}
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell className="text-right">₹{product.price.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">{product.stock.toLocaleString('en-IN')} {product.unit}</TableCell>
                  <TableCell>{getStockStatusBadge(product)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedProductId(product.id)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Stock History: {product.name}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 max-h-80 overflow-auto">
                            {selectedProductId && getProductHistory(selectedProductId).length > 0 ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-4 font-semibold text-sm border-b pb-2">
                                  <div>Date</div>
                                  <div>Invoice</div>
                                  <div className="text-right">Change</div>
                                  <div className="text-right">Type</div>
                                </div>
                                {getProductHistory(selectedProductId).map((entry, index) => (
                                  <div key={index} className="grid grid-cols-4 text-sm">
                                    <div>{new Date(entry.date).toLocaleDateString()}</div>
                                    <div>{entry.invoiceNumber}</div>
                                    <div className={`text-right ${entry.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {entry.change > 0 ? '+' : ''}{entry.change} {product.unit}
                                    </div>
                                    <div className="text-right">
                                      {entry.change > 0 ? 'Purchase' : 'Sale'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-center text-muted-foreground py-8">No stock movement history found.</p>
                            )}
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button>Close</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Dialog open={confirmDelete === product.id} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setConfirmDelete(product.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Product</DialogTitle>
                          </DialogHeader>
                          <p>Are you sure you want to delete {product.name}? This action cannot be undone.</p>
                          <div className="flex justify-end space-x-2 pt-4">
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button 
                              variant="destructive"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
