import React from 'react';
import { MapPin, Eye } from 'lucide-react';
import { VERIFIED_SUPPLIERS } from '../data/mockData';
import { VerifiedBadge } from './VerifiedBadge';

interface MarketplaceColumnsProps {
  onSupplierClick?: (supplierId: string) => void;
  onProductClick?: (productId: string) => void;
  onEnquiryClick?: (data: { title: string; supplier: string; type: 'supplier' | 'product' }) => void;
  onViewAllSuppliers?: () => void;
  onViewAllProducts?: () => void;
}

export const MarketplaceColumns: React.FC<MarketplaceColumnsProps> = ({
  onSupplierClick,
  onProductClick,
  onEnquiryClick,
  onViewAllSuppliers,
  onViewAllProducts,
}) => {
  // Use first 4 suppliers from VERIFIED_SUPPLIERS mock data with rich scores
  const suppliers = VERIFIED_SUPPLIERS.slice(0, 4);

  const products = [
    {
      id: 'peptide-face-serum',
      name: 'Anti-Aging Peptide Serum',
      supplier: 'Aura Beauty Labs',
      price: '₹350 - ₹450',
      unit: '/ pc',
      moq: '50 pcs',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'frosted-glass-droppers',
      name: 'Frosted Glass Droppers 30ml',
      supplier: 'CosmoTech Industries',
      price: '₹25 - ₹45',
      unit: '/ pc',
      moq: '500 pcs',
      image: 'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'matte-liquid-lipstick-base',
      name: 'Matte Liquid Lipstick Base',
      supplier: 'PureFormulations Pvt.',
      price: '₹850 - ₹1,200',
      unit: '/ kg',
      moq: '10 kg',
      image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'vegan-hydrating-face-mist',
      name: 'Rosemary & Redensyl Scalp Serum',
      supplier: 'BioTech Derma Labs',
      price: '₹320 - ₹390',
      unit: '/ pc',
      moq: '100 pcs',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 my-6">
      {/* Verified Suppliers Column */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-serif text-[22px] md:text-[24px] font-bold text-[#500037]">
            Featured Suppliers
          </h2>
          <button
            onClick={onViewAllSuppliers}
            className="text-[13px] font-semibold text-[#500037] hover:text-[#53103B] hover:underline transition-colors cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white border border-[#E8DFE3] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col h-full hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#FAF1F5] flex items-center justify-center shrink-0 border border-[#F0E8EB]">
                  <span className="font-serif text-[#500037] text-xl font-bold">
                    {supplier.shortCode}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-[#1e1a1d] line-clamp-1">
                    {supplier.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 text-[#8D8087] text-[12px]">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{supplier.city}, {supplier.state}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <VerifiedBadge
                  trustScore={supplier.trustScore}
                  overallRating={supplier.overallRating}
                  size="sm"
                />
                <span className="text-[11.5px] text-[#6F626A] font-medium">
                  Resp: {supplier.responseTimeText || supplier.responseRate}
                </span>
              </div>

              <div className="mt-auto pt-3 border-t border-[#F0E8EB] flex gap-2">
                <button
                  onClick={() =>
                    onEnquiryClick?.({
                      title: supplier.name,
                      supplier: supplier.name,
                      type: 'supplier',
                    })
                  }
                  className="flex-1 bg-[#500037] text-white font-semibold text-[12px] py-2 rounded-lg hover:bg-[#53103B] transition-colors cursor-pointer"
                >
                  Send Enquiry
                </button>
                <button
                  onClick={() => onSupplierClick?.(supplier.id)}
                  className="flex-1 bg-[#F5EBEF] text-[#500037] font-semibold text-[12px] py-2 rounded-lg hover:bg-[#E9E0E4] transition-colors cursor-pointer"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Products Column */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-serif text-[22px] md:text-[24px] font-bold text-[#500037]">
            Trending Sourcing
          </h2>
          <button
            onClick={onViewAllProducts}
            className="text-[13px] font-semibold text-[#500037] hover:text-[#53103B] hover:underline transition-colors cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-[#E8DFE3] rounded-xl overflow-hidden shadow-sm flex flex-col h-full group hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
            >
              <div className="h-36 overflow-hidden bg-[#FAF1F5]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-[15px] font-semibold text-[#1e1a1d] mb-0.5 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-[12px] text-[#6F626A] mb-3 line-clamp-1">
                  By {product.supplier}
                </p>

                <div className="flex justify-between items-end mb-4 bg-[#FCF8F7] p-2 rounded-lg border border-[#F0E8EB]">
                  <div>
                    <span className="block text-[10px] text-[#8D8087] uppercase font-semibold">
                      B2B Price
                    </span>
                    <span className="font-bold text-[#500037] text-[14px]">
                      {product.price}{' '}
                      <span className="text-[11px] font-normal text-[#6F626A]">
                        {product.unit}
                      </span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-[#8D8087] uppercase font-semibold">
                      MOQ
                    </span>
                    <span className="text-[13px] font-semibold text-[#1e1a1d]">
                      {product.moq}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-2 border-t border-[#F0E8EB] flex gap-2">
                  <button
                    onClick={() =>
                      onEnquiryClick?.({
                        title: product.name,
                        supplier: product.supplier,
                        type: 'product',
                      })
                    }
                    className="flex-1 bg-[#500037] text-white font-semibold text-[12px] py-2 rounded-lg hover:bg-[#53103B] transition-colors cursor-pointer"
                  >
                    Send Enquiry
                  </button>
                  <button
                    onClick={() => onProductClick?.(product.id)}
                    className="flex-none text-[#500037] p-2 rounded-lg border border-[#500037] hover:bg-[#FAF1F5] transition-colors flex items-center justify-center cursor-pointer"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
