import React from 'react';
import { Store, Boxes, MessagesSquare } from 'lucide-react';

interface SellerGrowthSectionProps {
  onJoinSupplier?: () => void;
  onSupplierLogin?: () => void;
}

export const SellerGrowthSection: React.FC<SellerGrowthSectionProps> = ({
  onJoinSupplier,
  onSupplierLogin,
}) => {
  return (
    <section className="my-12">
      <div className="bg-[#FBF3F6] rounded-2xl overflow-hidden border border-[#E8DFE3] shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Content */}
          <div className="p-6 sm:p-10 md:p-14 flex flex-col justify-center">
            <h2 className="font-serif text-[26px] sm:text-[32px] text-[#500037] font-bold mb-3 leading-tight">
              Grow Your Beauty Business on Nexora Luxe
            </h2>
            <p className="text-[14px] sm:text-[15px] text-[#534249] mb-8 leading-relaxed">
              Create your business presence, showcase products and connect with serious beauty-industry buyers.
            </p>

            <div className="space-y-6 mb-8">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-[#500037]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Store className="w-5 h-5 text-[#500037]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1e1a1d]">Create Business Profile</h3>
                  <p className="text-[13px] text-[#6F626A] mt-0.5">
                    Build a trusted professional presence with verification badges and factory highlights.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-[#500037]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Boxes className="w-5 h-5 text-[#500037]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1e1a1d]">List Your Products</h3>
                  <p className="text-[13px] text-[#6F626A] mt-0.5">
                    Showcase bulk formulations, MOQ tiers, specifications, and wholesale pricing.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-[#500037]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MessagesSquare className="w-5 h-5 text-[#500037]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1e1a1d]">Get Buyer Leads & RFQs</h3>
                  <p className="text-[13px] text-[#6F626A] mt-0.5">
                    Receive direct enquiries, quote requests, and connect with qualified buyers.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={onJoinSupplier}
                className="bg-[#500037] text-white font-semibold text-[14px] px-6 py-3 rounded-lg hover:bg-[#53103B] transition-colors shadow-sm cursor-pointer"
              >
                Join as Supplier
              </button>
              <button
                onClick={onSupplierLogin}
                className="border border-[#500037] text-[#500037] font-semibold text-[14px] px-6 py-3 rounded-lg hover:bg-[#500037]/5 transition-colors cursor-pointer"
              >
                Supplier Login
              </button>
            </div>
          </div>

          {/* Right Image */}
          <div className="h-64 sm:h-80 lg:h-auto relative overflow-hidden bg-[#FAF1F5]">
            <img
              alt="Professional beauty business meeting"
              className="absolute inset-0 w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-transparent via-[#FBF3F6]/20 to-[#FBF3F6]/40"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
