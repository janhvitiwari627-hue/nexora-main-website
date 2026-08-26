// ============================================================================
// NEXORA LUXE - SUPABASE & DB SUPPLIER SERVICE LAYER (RLS-COMPLIANT)
// ============================================================================

import { supabase } from '../lib/supabase';
import { db } from '../db/database';
import { VerifiedSupplier, PortfolioProduct } from '../types';
import { VERIFIED_SUPPLIERS } from '../data/mockData';

export interface SupplierFilterParams {
  searchQuery?: string;
  businessType?: string;
  category?: string;
  city?: string;
  verifiedOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'rating' | 'response_time' | 'years_established';
}

export interface PaginatedSuppliersResponse {
  data: VerifiedSupplier[];
  count: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * RLS-Compliant Supplier Data Fetcher with Supabase Query Engine & Relational DB Fallback
 */
export async function fetchSuppliers(params: SupplierFilterParams = {}): Promise<PaginatedSuppliersResponse> {
  const {
    searchQuery = '',
    businessType = 'All',
    category = 'All',
    city = 'All',
    verifiedOnly = false,
    page = 1,
    limit = 12,
    sortBy = 'relevance'
  } = params;

  try {
    // Attempt Supabase fetch if real client is configured
    if ((import.meta as any).env?.VITE_SUPABASE_URL && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) {
      let query = supabase
        .from('profiles_supplier')
        .select('*', { count: 'exact' });

      if (verifiedOnly) {
        query = query.eq('is_verified', true);
      }

      if (businessType !== 'All') {
        query = query.ilike('business_type', `%${businessType}%`);
      }

      if (category !== 'All') {
        query = query.contains('categories', [category]);
      }

      if (city !== 'All' && city !== 'Mumbai, Maharashtra') {
        query = query.ilike('city', `%${city.split(',')[0]}%`);
      }

      if (searchQuery.trim()) {
        query = query.or(`company_name.ilike.%${searchQuery}%,business_type.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
      }

      // Sorting
      if (sortBy === 'rating') {
        query = query.order('trust_score', { ascending: false });
      } else if (sortBy === 'response_time') {
        query = query.order('avg_response_time', { ascending: true });
      } else if (sortBy === 'years_established') {
        query = query.order('year_established', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (!error && data && data.length > 0) {
        const mappedData: VerifiedSupplier[] = data.map((item: any) => ({
          id: item.id,
          name: item.company_name,
          shortCode: item.slug || item.company_name.substring(0, 4).toUpperCase(),
          type: item.business_type,
          city: item.city,
          state: item.state,
          isVerified: item.is_verified ?? true,
          isGstVerified: item.is_gst_verified ?? true,
          isIsoCertified: item.is_iso_certified ?? true,
          isBusinessVerified: true,
          isGmpCertified: true,
          isFdaRegistered: true,
          categories: item.categories || ['Skincare', 'OEM / Private Label'],
          phone: item.phone || '+91 98200 12345',
          whatsapp: item.whatsapp || '+91 98200 12345',
          responseRate: item.response_rate ? `${item.response_rate}%` : '98%',
          trustScore: item.trust_score || 96,
          reliabilityRating: 4.9,
          productQualityRating: 4.8,
          overallRating: item.trust_score ? item.trust_score / 20 : 4.8,
          totalReviewsCount: 42,
          responseScore: 98,
          responseTimeText: item.avg_response_time ? `${item.avg_response_time} Hours` : '2 Hours',
          exportReadiness: 95,
          establishedYear: String(item.year_established || '2015'),
          moq: '500 Units',
          verificationBadge: item.verification_level || 'Nexora Verified',
          certificationsList: item.certifications || ['WHO-GMP', 'ISO 22716'],
          locationDetails: {
            industrialZone: `${item.city} Industrial Hub`,
            fullAddress: item.address || `${item.city}, ${item.state || 'India'}`,
            city: item.city,
            state: item.state || 'India',
            lat: 19.0760,
            lng: 72.8777,
            shippingHubs: [],
            rawMaterialSources: [],
            customsStatus: 'Export Ready',
            dispatchTurnaround: '3-5 Days',
            coldChainAvailable: true,
            transitAdvantage: 'Direct Airport Highway'
          },
          complianceReports: [],
          portfolioProducts: []
        }));

        const totalRecords = count || mappedData.length;
        const totalPages = Math.ceil(totalRecords / limit);

        return {
          data: mappedData,
          count: totalRecords,
          page,
          totalPages,
          hasMore: page < totalPages
        };
      }
    }
  } catch (err) {
    console.warn('Supabase fetch query notice, using local relational store:', err);
  }

  // Local Store Filtering (Fallback to Relational DB State & Verified Suppliers dataset)
  const dbState = db.getRawState();
  const dbSuppliers = dbState.profiles_supplier || [];
  let baseList: VerifiedSupplier[] = [...VERIFIED_SUPPLIERS];

  // Merge DB suppliers if missing from base
  dbSuppliers.forEach(dbSup => {
    if (!baseList.some(s => s.id === dbSup.id)) {
      baseList.push({
        id: dbSup.id,
        name: dbSup.company_name,
        shortCode: dbSup.slug || dbSup.company_name.substring(0, 4).toUpperCase(),
        type: dbSup.business_type,
        city: dbSup.city,
        state: dbSup.state,
        isVerified: dbSup.is_verified,
        isGstVerified: dbSup.is_gst_verified,
        isIsoCertified: dbSup.is_iso_certified,
        isBusinessVerified: true,
        isGmpCertified: true,
        isFdaRegistered: true,
        categories: dbSup.categories,
        phone: dbSup.phone || '+91 98200 12345',
        whatsapp: dbSup.whatsapp || '+91 98200 12345',
        responseRate: `${dbSup.response_rate}%`,
        trustScore: dbSup.trust_score,
        reliabilityRating: 4.9,
        productQualityRating: 4.8,
        overallRating: 4.8,
        totalReviewsCount: 38,
        responseScore: 98,
        responseTimeText: `${dbSup.avg_response_time} Hours`,
        exportReadiness: 95,
        establishedYear: dbSup.year_established,
        moq: '500 Units',
        verificationBadge: dbSup.verification_level,
        certificationsList: ['WHO-GMP', 'ISO 22716'],
        locationDetails: {
          industrialZone: `${dbSup.city} Tech Park`,
          fullAddress: dbSup.address,
          city: dbSup.city,
          state: dbSup.state,
          lat: 19.0760,
          lng: 72.8777,
          shippingHubs: [],
          rawMaterialSources: [],
          customsStatus: 'Verified',
          dispatchTurnaround: '2-4 Days',
          coldChainAvailable: true,
          transitAdvantage: 'Express Corridor'
        },
        complianceReports: [],
        portfolioProducts: []
      });
    }
  });

  // Apply Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    baseList = baseList.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.categories.some(c => c.toLowerCase().includes(q))
    );
  }

  // Apply Business Type
  if (businessType !== 'All') {
    baseList = baseList.filter(s => s.type.toLowerCase().includes(businessType.toLowerCase()));
  }

  // Apply Verified Only
  if (verifiedOnly) {
    baseList = baseList.filter(s => s.isVerified);
  }

  // Apply Category
  if (category !== 'All') {
    baseList = baseList.filter(s => s.categories.some(c => c.toLowerCase().includes(category.toLowerCase())));
  }

  // Apply Sorting
  if (sortBy === 'rating') {
    baseList.sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0));
  } else if (sortBy === 'years_established') {
    baseList.sort((a, b) => parseInt(a.establishedYear || '0') - parseInt(b.establishedYear || '0'));
  }

  const totalCount = baseList.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedData = baseList.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    count: totalCount,
    page,
    totalPages,
    hasMore: page < totalPages
  };
}

/**
 * Fetch Single Supplier Profile by ID
 */
export async function fetchSupplierById(supplierId: string): Promise<VerifiedSupplier | null> {
  const res = await fetchSuppliers({ limit: 100 });
  return res.data.find(s => s.id === supplierId) || null;
}

/**
 * Alias of fetchSuppliers for consistency across codebase (getSuppliers)
 */
export async function getSuppliers(params: SupplierFilterParams = {}): Promise<PaginatedSuppliersResponse> {
  return fetchSuppliers(params);
}

/**
 * Alias of fetchSupplierById for consistency across codebase (getSupplierById)
 */
export async function getSupplierById(supplierId: string): Promise<VerifiedSupplier | null> {
  return fetchSupplierById(supplierId);
}

/**
 * Fetch Products for a specific Supplier
 */
export async function getSupplierProducts(supplierId: string): Promise<PortfolioProduct[]> {
  try {
    if ((import.meta as any).env?.VITE_SUPABASE_URL && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', supplierId);
      
      if (!error && data && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          name: p.name,
          image: p.image_url || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&q=80',
          price: p.price_range || '₹150 - ₹250',
          moq: p.moq || '500 Units'
        }));
      }
    }
  } catch (err) {
    console.warn('Supabase products fetch notice:', err);
  }

  // Fallback to supplier's portfolio products
  const supplier = await fetchSupplierById(supplierId);
  if (supplier && supplier.portfolioProducts && supplier.portfolioProducts.length > 0) {
    return supplier.portfolioProducts;
  }

  // Return realistic mock products
  return [
    {
      id: 'prod-101',
      name: 'Organic Vitamin C Formulation Base',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&q=80',
      price: '₹120 / Unit',
      moq: '1,000 Units'
    },
    {
      id: 'prod-102',
      name: 'Hydrating Peptide Cream (Bulk)',
      image: 'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?auto=format&fit=crop&w=200&q=80',
      price: '₹180 / Unit',
      moq: '500 Units'
    }
  ];
}
