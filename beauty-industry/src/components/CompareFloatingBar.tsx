import React from 'react';
import { ArrowLeftRight, X, Sparkles, Trash2, Plus } from 'lucide-react';
import { Product } from '../types';

interface CompareFloatingBarProps {
  selectedProducts: Product[];
  onOpenCompareModal: () => void;
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
}

export const CompareFloatingBar: React.FC<CompareFloatingBarProps> = ({
  selectedProducts,
  onOpenCompareModal,
  onRemoveProduct,
  onClearAll
}) => {
  if (selectedProducts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl animate-in slide-in-from-bottom-6 duration-300">
      <div className="bg-white/95 backdrop-blur-md border-2 border-[#B8005A]/20 shadow-2xl rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 text-xs">
        
        {/* Left Side: Product Thumbnails Tray */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <div className="hidden sm:flex items-center gap-1.5 text-[#B8005A] font-extrabold text-xs shrink-0 pl-1 pr-2 border-r border-[#EDEDED]">
            <ArrowLeftRight className="w-4 h-4" />
            <span>Compare</span>
          </div>

          {/* Render Slots (up to 3) */}
          <div className="flex items-center gap-2">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="relative group flex items-center gap-1.5 bg-[#FAF8F5] border border-[#EAE5DE] rounded-xl p-1 pr-2 shadow-2xs shrink-0"
              >
                <img
                  src={product.image || undefined}
                  alt={product.name}
                  className="w-8 h-8 rounded-lg object-cover border border-[#EFEBE4]"
                />
                <div className="max-w-[80px] sm:max-w-[100px] truncate font-bold text-[#1A1A1A] text-[11px]">
                  {product.name}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveProduct(product.id);
                  }}
                  className="w-4 h-4 rounded-full bg-gray-200 hover:bg-[#B8005A] hover:text-white text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Remove"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: 3 - selectedProducts.length }).map((_, idx) => (
              <div
                key={idx}
                className="hidden sm:flex items-center justify-center w-8 h-8 rounded-xl border border-dashed border-[#DCD6CC] text-[#A09A90] text-[10px] font-bold"
                title="Empty comparison slot"
              >
                +{idx + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: CTA Button & Clear */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClearAll}
            className="text-[11px] font-bold text-[#737373] hover:text-[#B8005A] px-2 py-1 transition-colors cursor-pointer"
          >
            Clear
          </button>

          <button
            onClick={onOpenCompareModal}
            className="bg-[#B8005A] hover:bg-[#A0004E] text-white font-extrabold px-4 py-2 sm:py-2.5 rounded-xl shadow-md hover:shadow-pink-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Compare ({selectedProducts.length}/3)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
