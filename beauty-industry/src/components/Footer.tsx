import React from 'react';

interface FooterProps {
  onNavigate: (tab: 'home' | 'products' | 'brands' | 'distributors' | 'business') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-[#F0E6EC] mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <div 
                onClick={() => onNavigate('home')} 
                className="text-2xl font-extrabold text-[#B8005A] tracking-tight font-serif cursor-pointer hover:opacity-90 transition-opacity"
              >
                Nexora Luxe
              </div>
              <p className="mt-3 text-sm text-[#737373] max-w-sm leading-relaxed">
                The premier platform for beauty business and product discovery.
              </p>
            </div>
            
            <div className="mt-6 flex items-center gap-3 text-xs text-[#8E8E93]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAFAFA] border border-[#EEEEEE]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                Global B2B Network
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#FAFAFA] border border-[#EEEEEE]">
                Verified Suppliers Only
              </span>
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="md:col-span-3 sm:col-span-6">
            <ul className="space-y-3.5 text-sm font-medium text-[#4A4A4A]">
              <li>
                <button
                  onClick={() => onNavigate('products')}
                  className="hover:text-[#B8005A] transition-colors"
                >
                  Product Discovery
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('brands')}
                  className="hover:text-[#B8005A] transition-colors"
                >
                  Brand Directory
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('distributors')}
                  className="hover:text-[#B8005A] transition-colors"
                >
                  Distributor Network
                </button>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="md:col-span-4 sm:col-span-6">
            <ul className="space-y-3.5 text-sm font-medium text-[#4A4A4A]">
              <li>
                <button
                  onClick={() => onNavigate('business')}
                  className="hover:text-[#B8005A] transition-colors"
                >
                  Business Solutions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('business')}
                  className="hover:text-[#B8005A] transition-colors"
                >
                  About Nexora
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('business')}
                  className="hover:text-[#B8005A] transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 pt-8 border-t border-[#F5F5F5] text-center text-xs text-[#8E8E93]">
          <p>© 2024 Nexora Luxe Management. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
