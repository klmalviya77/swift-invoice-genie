
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Package, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getLowStockProducts, getOutOfStockProducts } from '@/lib/storage';
import { useApp } from '@/contexts/AppContext';

const InventoryNavItem: React.FC = () => {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { products } = useApp(); // Use AppContext to detect data changes
  
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        const [lowStock, outOfStock] = await Promise.all([
          getLowStockProducts(),
          getOutOfStockProducts()
        ]);
        
        setLowStockCount(lowStock.length);
        setOutOfStockCount(outOfStock.length);
      } catch (error) {
        console.error("Error fetching inventory counts:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCounts();
  }, [products]); // Re-fetch counts when products change
  
  const hasAlerts = lowStockCount > 0 || outOfStockCount > 0;

  return (
    <NavLink
      to="/inventory"
      className={({ isActive }) =>
        cn(
          'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
          isActive ? 'bg-accent text-accent-foreground' : 'transparent'
        )
      }
    >
      <Package className="mr-2 h-4 w-4" />
      <span className="flex-1">Inventory</span>
      {!loading && hasAlerts && (
        <Badge variant="outline" className="ml-auto bg-yellow-100 text-yellow-800 flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {outOfStockCount + lowStockCount}
        </Badge>
      )}
    </NavLink>
  );
};

export default InventoryNavItem;
