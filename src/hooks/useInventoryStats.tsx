
import { useState, useEffect } from 'react';
import { getLowStockProducts, getOutOfStockProducts, getProducts, getReturns } from '@/lib/storage';
import { useApp } from '@/contexts/AppContext';

export const useInventoryStats = () => {
  const [stats, setStats] = useState({
    lowStockCount: 0,
    outOfStockCount: 0,
    totalProducts: 0,
    inStockCount: 0,
    totalInventoryValue: 0,
    pendingSalesReturns: 0,
    pendingPurchaseReturns: 0
  });
  
  const [loading, setLoading] = useState(true);
  const { products, returns } = useApp(); // Use AppContext to detect data changes

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [lowStockProducts, outOfStockProducts, allProducts, allReturns] = await Promise.all([
          getLowStockProducts(),
          getOutOfStockProducts(),
          getProducts(),
          getReturns()
        ]);
        
        const lowStockCount = lowStockProducts.length;
        const outOfStockCount = outOfStockProducts.length;
        const totalProducts = allProducts.length;
        
        const totalInventoryValue = allProducts.reduce((total, product) => {
          return total + (product.stock * product.price);
        }, 0);
        
        // Count pending returns
        const pendingSalesReturns = allReturns.filter(
          ret => ret.type === 'sales' && ret.status === 'pending'
        ).length;
        
        const pendingPurchaseReturns = allReturns.filter(
          ret => ret.type === 'purchase' && ret.status === 'pending'
        ).length;
        
        console.log("Updated inventory stats:", {
          lowStockCount,
          outOfStockCount,
          totalProducts,
          inStockCount: totalProducts - outOfStockCount,
          totalInventoryValue,
          pendingSalesReturns,
          pendingPurchaseReturns
        });
        
        setStats({
          lowStockCount,
          outOfStockCount,
          totalProducts,
          inStockCount: totalProducts - outOfStockCount,
          totalInventoryValue,
          pendingSalesReturns,
          pendingPurchaseReturns
        });
      } catch (error) {
        console.error("Error fetching inventory stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [products, returns]); // Re-fetch stats when products or returns change

  return { ...stats, loading };
};

export default useInventoryStats;
