
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Package, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getLowStockProducts, getOutOfStockProducts } from '@/lib/storage';

const InventoryNavItem: React.FC = () => {
  const lowStockCount = getLowStockProducts().length;
  const outOfStockCount = getOutOfStockProducts().length;
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
      {hasAlerts && (
        <Badge variant="outline" className="ml-auto bg-yellow-100 text-yellow-800 flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {outOfStockCount + lowStockCount}
        </Badge>
      )}
    </NavLink>
  );
};

export default InventoryNavItem;
