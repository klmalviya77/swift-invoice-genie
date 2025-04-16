import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash, Package, ArrowDown, ArrowUp, Tag, AlertTriangle, Info } from 'lucide-react';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Product, getStockMovementHistory, getProducts, getInvoiceById } from '@/lib/storage';

const ProductsPage: React.FC = () => {
  const { products: appProducts, saveProduct, removeProduct } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { toast } = useToast();

  // Products fetched directly from storage
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productHistory, setProductHistory] = useState<Array<{ date: string; change: number; invoiceId: string; invoiceNumber: string }>>([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch products data on component mount and when appProducts changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const allProducts = await getProducts();
        setProducts(allProducts);
        
        // Apply current filters
        filterProducts(allProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [appProducts]);

  // Fetch product history when selectedProductId changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (selectedProductId) {
        try {
          const history = await getStockMovementHistory(selectedProductId);
          setProductHistory(history);
        } catch (error) {
          console.error("Error fetching product history:", error);
        }
      }
    };
    
    fetchHistory();
  }, [selectedProductId]);

  // Update filtered products when tab or search changes
  useEffect(() => {
    filterProducts(products);
  }, [searchTerm, sortField, sortDirection, products]);

  const fetchInvoiceNumber = async (invoiceId: string) => {
    try {
      const invoice = await getInvoiceById(invoiceId);
      return invoice.invoiceNumber;
    } catch (error) {
      console.error("Error fetching invoice:", error);
      return "Unknown";
    }
  };

  const filterProducts = (productList: Product[]) => {
    let filtered = [...productList];
    
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
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
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
    
    setFilteredProducts(sorted);
  };

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

  const handleDeleteProduct = async (id: string) => {
    await removeProduct(id);
    setConfirmDelete(null);
    // Refresh products
    const updatedProducts = await getProducts();
    setProducts(updatedProducts);
    filterProducts(updatedProducts);
    
    toast({
      title: 'Product Deleted',
      description: 'The product has been deleted successfully.',
    });
  };

  const handleSaveProduct = async () => {
    await saveProduct(formProduct);
    // Refresh products
    const updatedProducts = await getProducts();
    setProducts(updatedProducts);
    filterProducts(updatedProducts);
    
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

  const getStockStatusBadge = (product: Product) => {
    if (product.stock <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (product.stock <= (product.lowStockAlert || 5)) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products Management</h1>
          <p className="text-muted-foreground">Manage your products and their details</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      <div className="relative flex items-center">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredProducts.length === 0 ? (
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
              {filteredProducts.map((product) => (
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
                            {productHistory.length > 0 ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-4 font-semibold text-sm border-b pb-2">
                                  <div>Date</div>
                                  <div>Invoice</div>
                                  <div className="text-right">Change</div>
                                  <div className="text-right">Type</div>
                                </div>
                                {productHistory.map((entry, index) => (
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
