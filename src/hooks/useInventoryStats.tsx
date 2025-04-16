
import { useState, useEffect } from 'react';
import { getLowStockProducts, getOutOfStockProducts, getProducts } from '@/lib/storage';

export const useInventoryStats = () => {
  const [stats, setStats] = useState({
    lowStockCount: 0,
    outOfStockCount: 0,
    totalProducts: 0,
    inStockCount: 0,
    totalInventoryValue: 0
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [lowStockProducts, outOfStockProducts, allProducts] = await Promise.all([
          getLowStockProducts(),
          getOutOfStockProducts(),
          getProducts()
        ]);
        
        const lowStockCount = lowStockProducts.length;
        const outOfStockCount = outOfStockProducts.length;
        const totalProducts = allProducts.length;
        
        const totalInventoryValue = allProducts.reduce((total, product) => {
          return total + (product.stock * product.price);
        }, 0);
        
        setStats({
          lowStockCount,
          outOfStockCount,
          totalProducts,
          inStockCount: totalProducts - outOfStockCount,
          totalInventoryValue
        });
      } catch (error) {
        console.error("Error fetching inventory stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return { ...stats, loading };
};

export default useInventoryStats;
