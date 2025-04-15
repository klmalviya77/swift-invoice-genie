
import { useMemo } from 'react';
import { getLowStockProducts, getOutOfStockProducts, getProducts } from '@/lib/storage';

export const useInventoryStats = () => {
  const stats = useMemo(() => {
    const lowStockCount = getLowStockProducts().length;
    const outOfStockCount = getOutOfStockProducts().length;
    const totalProducts = getProducts().length;
    
    const totalInventoryValue = getProducts().reduce((total, product) => {
      return total + (product.stock * product.price);
    }, 0);
    
    return {
      lowStockCount,
      outOfStockCount,
      totalProducts,
      inStockCount: totalProducts - outOfStockCount,
      totalInventoryValue
    };
  }, []);

  return stats;
};

export default useInventoryStats;
