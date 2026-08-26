import { useState, useEffect, useCallback } from 'react';
import { VerifiedSupplier } from '../types';
import { getSuppliers, SupplierFilterParams } from '../services/supplierService';

export interface UseSuppliersReturn {
  suppliers: VerifiedSupplier[];
  loading: boolean;
  error: string | null;
  count: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  fetchSuppliersList: (params?: SupplierFilterParams) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom React Hook for managing loading, error, and paginated data states
 * for the Nexora Luxe Supplier Directory.
 */
export function useSuppliers(initialParams: SupplierFilterParams = {}): UseSuppliersReturn {
  const [suppliers, setSuppliers] = useState<VerifiedSupplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(initialParams.page || 1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  
  // Keep track of current parameters
  const [currentParams, setCurrentParams] = useState<SupplierFilterParams>(initialParams);

  const fetchSuppliersList = useCallback(async (params: SupplierFilterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const mergedParams = { ...currentParams, ...params };
      setCurrentParams(mergedParams);

      const response = await getSuppliers(mergedParams);
      
      setSuppliers(response.data);
      setCount(response.count);
      setPage(response.page);
      setTotalPages(response.totalPages);
      setHasMore(response.hasMore);
    } catch (err: any) {
      console.error('Error fetching suppliers list:', err);
      setError(err?.message || 'Failed to retrieve supplier listings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentParams]);

  const refetch = useCallback(() => {
    return fetchSuppliersList(currentParams);
  }, [fetchSuppliersList, currentParams]);

  // Initial fetch on mount or when specific filter triggers change
  useEffect(() => {
    fetchSuppliersList(initialParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialParams.searchQuery,
    initialParams.businessType,
    initialParams.category,
    initialParams.city,
    initialParams.verifiedOnly,
    initialParams.page,
    initialParams.sortBy
  ]);

  return {
    suppliers,
    loading,
    error,
    count,
    page,
    totalPages,
    hasMore,
    fetchSuppliersList,
    refetch
  };
}
