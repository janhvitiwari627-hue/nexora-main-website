import React from 'react';
import { FlaskConical, Tag, Factory, Package } from 'lucide-react';

interface OEMSpotlightProps {
  onExploreSolutions?: () => void;
  onPostRequirement?: () => void;
}

export const OEMSpotlight: React.FC<OEMSpotlightProps> = ({
  onExploreSolutions,
  onPostRequirement,
}) => {
  return (
    <section className="my-12">
      <div className="bg-[#6f174f] relative overflow-hidden rounded-2xl shadow-md">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            alt="Cosmetic manufacturing facility"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1600&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#6f174f] via-[#6f174f]/85 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-10 md:p-14 flex flex-col md:flex-row items-center gap-8 max-w-7xl mx-auto">
          <div className="flex-1 text-white">
            <h2 className="font-serif text-[28px] sm:text-[34px] md:text-[40px] font-bold mb-3 leading-tight tracking-tight">
              Build Your Brand with Nexora Luxe
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#ffd8e8] font-medium mb-4">
              Private Label · Custom Formulation · Contract Manufacturing · Premium Packaging
            </p>
            <p className="text-[14px] text-white/85 mb-8 max-w-2xl leading-relaxed">
              Connect with verified beauty manufacturers for custom products, formulations and bulk production.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ffdeae]/20 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4 text-[#ffdeae]" />
                </div>
                <span className="text-[14px] font-medium text-white">Custom Formulation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ffdeae]/20 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-[#ffdeae]" />
                </div>
                <span className="text-[14px] font-medium text-white">Private Label</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ffdeae]/20 flex items-center justify-center">
                  <Factory className="w-4 h-4 text-[#ffdeae]" />
                </div>
                <span className="text-[14px] font-medium text-white">Contract Manufacturing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ffdeae]/20 flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#ffdeae]" />
                </div>
                <span className="text-[14px] font-medium text-white">Packaging Support</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={onExploreSolutions}
                className="bg-[#ffdeae] text-[#281900] font-semibold text-[14px] px-6 py-3 rounded-lg hover:bg-[#eebf76] transition-colors shadow-sm cursor-pointer"
              >
                Explore OEM Solutions
              </button>
              <button
                onClick={onPostRequirement}
                className="border border-white/80 text-white font-semibold text-[14px] px-6 py-3 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                Post OEM Requirement
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
