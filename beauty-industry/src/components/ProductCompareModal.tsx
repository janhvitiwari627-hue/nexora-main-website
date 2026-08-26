import React from 'react';
import { X, Check, ShieldCheck, FileText, Send, Building2, ExternalLink } from 'lucide-react';
import { SearchProduct } from '../types';

interface ProductCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: SearchProduct[];
  onRemoveProduct: (id: string) => void;
  onOpenEnquiry: (product: SearchProduct) => void;
}

export const ProductCompareModal: React.FC<ProductCompareModalProps> = ({
  isOpen,
  onClose,
  products,
  onRemoveProduct,
  onOpenEnquiry
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="product-compare-modal"
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-[#e8e8e8] overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 bg-[#1c1b1b] text-white flex items-center justify-between border-b border-[#313030]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e6007e]"></span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                B2B Technical &amp; Commercial Spec Comparison
              </h2>
            </div>
            <p className="text-xs text-[#a09095] mt-0.5">
              Comparing {products.length} verified formulation and manufacturing offers side-by-side
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a09095] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table / Matrix Body */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6 bg-[#fdf8f8]">
          {products.length === 0 ? (
            <div className="py-16 text-center text-[#594047]">
              <p className="text-base font-semibold">No products selected for comparison.</p>
              <p className="text-sm text-[#8c7077] mt-1">Select 2 to 4 products from the search results to compare specs.</p>
            </div>
          ) : (
            <div className="min-w-[700px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#e8e8e8]">
                    <th className="p-4 text-left w-1/4 bg-[#fcf9f8] font-bold text-xs uppercase tracking-wider text-[#8c7077]">
                      Attributes
                    </th>
                    {products.map((prod) => (
                      <th key={prod.id} className="p-4 text-left w-1/4 bg-white border-l border-[#e8e8e8] align-top">
                        <div className="relative group">
                          <button
                            onClick={() => onRemoveProduct(prod.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-xs transition-colors"
                            title="Remove from comparison"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <img
                            src={prod.image}
                            alt={prod.title}
                            className="w-full h-28 object-cover rounded-lg mb-2.5 border border-[#e8e8e8]"
                          />
                          <h3 className="font-bold text-sm text-[#1c1b1b] line-clamp-2 leading-snug">
                            {prod.title}
                          </h3>
                          <p className="text-xs text-[#594047] flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3 text-[#b90064]" />
                            {prod.supplierName}
                          </p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e8e8] text-xs">
                  {/* Estimated Price */}
                  <tr>
                    <td className="p-3.5 font-semibold text-[#594047] bg-[#fcf9f8]">Target Price / Unit</td>
                    {products.map((prod) => (
                      <td key={prod.id} className="p-3.5 font-bold text-sm text-[#b90064] border-l border-[#e8e8e8] bg-white">
                        {prod.priceRange}
                        {prod.bulkTierText && (
                          <span className="block text-[11px] font-normal text-[#594047] mt-0.5">
                            {prod.bulkTierText}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* MOQ */}
                  <tr>
                    <td className="p-3.5 font-semibold text-[#594047] bg-[#fcf9f8]">Min. Order Quantity (MOQ)</td>
                    {products.map((prod) => (
                      <td key={prod.id} className="p-3.5 font-bold text-[#1c1b1b] border-l border-[#e8e8e8] bg-white">
                        {prod.moq}
                      </td>
                    ))}
                  </tr>

                  {/* Formulation Base */}
                  <tr>
                    <td className="p-3.5 font-semibold text-[#594047] bg-[#fcf9f8]">Formulation Base</td>
                    {products.map((prod) => (
                      <td key={prod.id} className="p-3.5 text-[#1c1b1b] border-l border-[#e8e8e8] bg-white">
                        {prod.specs?.formulationBase || 'Custom Actives Matrix'}
                      </td>
                    ))}
                  </tr>

                  {/* Packaging Type */}
                  <tr>
                    <td className="p-3.5 font-semibold text-[#594047] bg-[#fcf9f8]">Packaging Material</td>
                    {products.map((prod) => (
                      <td key={prod.id} className="p-3.5 text-[#1c1b1b] border-l border-[#e8e8e8] bg-white">
                        {prod.specs?.packagingType || 'Standard B2B Packaging'}
                      </td>
                    ))}
                  </tr>

                  {/* Sample Lead Time */}
                  <tr>
                    <td className="p-3.5 font-semibold text-[#594047] bg-[#fcf9f8]">Sample Dispatch Time</td>
                    {products.map((prod) => (
                      <td key={prod.id} className="p-3.5 text-[#1c1b1b] border-l border-[#e8e8e8] bg-white">
                        {prod.specs?.sampleLeadTime || '2-4 Days'}
                      </td>
                    ))}
                  </tr>

                  {/* Production Capacity */}
                  <tr>
                    <td className="p-3.5 font-semibold text-[#594047] bg-[#fcf9f8]">Monthly Capacity</td>
                    {products.map((prod) => (
                      <td key={prod.id} className="p-3.5 text-[#1c1b1b] border-l border-[#e8e8e8] bg-white">
                        {prod.specs?.productionCapacity || 'High Volume Ready'}
                      </td>
                    ))}
                  </tr>

                  {/* Compliance & Standards */}
                  <tr>
                    <td className="p-3.5 font-semibold text-[#594047] bg-[#fcf9f8]">Compliance &amp; Certifications</td>
                    {products.map((prod) => (
                      <td key={prod.id} className="p-3.5 border-l border-[#e8e8e8] bg-white">
                        <div className="flex flex-wrap gap-1">
                          {prod.certifications.map((cert, idx) => (
                            <span key={idx} className="bg-[#f0f5ff] text-[#0050d6] font-semibold text-[10px] px-2 py-0.5 rounded">
                              {cert}
                            </span>
                          ))}
                          {prod.isGstVerified && (
                            <span className="bg-[#e6f4ea] text-[#00875a] font-semibold text-[10px] px-2 py-0.5 rounded">
                              GST Verified
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Action Row */}
                  <tr>
                    <td className="p-3.5 font-semibold text-[#594047] bg-[#fcf9f8]">Direct Action</td>
                    {products.map((prod) => (
                      <td key={prod.id} className="p-3.5 border-l border-[#e8e8e8] bg-white">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenEnquiry(prod);
                          }}
                          className="w-full bg-[#b90064] hover:bg-[#8e004b] text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Enquiry
                        </button>
                      </td>
                    ))}
                  </tr>

                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#e8e8e8] flex items-center justify-between">
          <span className="text-xs text-[#8c7077]">
            Nexora Verified Sourcing Engine • All supplier specifications are audited.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#f0edec] hover:bg-[#e0bec6]/40 text-[#1c1b1b] font-semibold text-xs rounded-lg transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
