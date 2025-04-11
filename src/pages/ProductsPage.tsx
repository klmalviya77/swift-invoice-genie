
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
  FileText
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
import { Product, generateQuickInvoice } from '@/lib/storage';

const ProductsPage: React.FC = () => {
  const { products, parties, saveProduct, removeProduct } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Product form state
  const [formProduct, setFormProduct] = useState<Product>({
    id: '',
    name: '',
    description: '',
    price: 0,
    stock: 0,
    unit: 'pcs'
  });

  // Quick invoice form state
  const [quickInvoice, setQuickInvoice] = useState({
    productId: '',
    partyId: '',
    quantity: 1,
    discount: 0,
    gstPercentage: 18,
    status: 'unpaid' as const
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

  const filteredProducts = products.filter((product) => {
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.price.toString().includes(searchTerm)
    );
  });

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
      unit: 'pcs'
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
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
                    <Label htmlFor="price">Price</Label>
                    <Input 
                      id="price" 
                      type="number"
                      min="0"
                      value={formProduct.price}
                      onChange={(e) => setFormProduct({...formProduct, price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input 
                      id="stock" 
                      type="number"
                      min="0"
                      value={formProduct.stock}
                      onChange={(e) => setFormProduct({...formProduct, stock: parseInt(e.target.value) || 0})}
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
                      <option key={product.id} value={product.id}>{product.name} - ₹{product.price}</option>
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
        </div>
      </div>

      <div className="flex items-center">
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
              {/* Same form content as above */}
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell className="text-right">₹{product.price.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">{product.stock?.toLocaleString('en-IN') || 0} {product.unit}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
