import React, { useState } from 'react';
import { BadgeCheck, FileText, MessageSquare } from 'lucide-react';
import { CATEGORY_TAXONOMY, getSubcategoriesForCategoryName } from '../data/categories';

interface QuickRFQSectionProps {
  onSubmitSuccess?: (message: string) => void;
  onPostDetailedClick?: () => void;
}

export const QuickRFQSection: React.FC<QuickRFQSectionProps> = ({
  onSubmitSuccess,
  onPostDetailedClick,
}) => {
  const [category, setCategory] = useState('Skincare');
  const [subcategory, setSubcategory] = useState('Serums & Treatments');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.trim() || !phone.trim()) {
      alert('Please enter your required product and mobile number.');
      return;
    }
    setSubmitted(true);
    if (onSubmitSuccess) {
      onSubmitSuccess(`RFQ submitted for "${product}". Verified suppliers will contact you shortly!`);
    }
    setTimeout(() => {
      setSubmitted(false);
      setProduct('');
      setQuantity('');
      setCity('');
      setPhone('');
    }, 3000);
  };

  return (
    <section className="my-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e8e8e8] bg-white">
        {/* Left Info Panel */}
        <div className="bg-[#650034] p-8 md:p-12 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-[28px] md:text-[32px] font-bold tracking-tight mb-6">
              Buy Smart. Source Better.
            </h2>
            <ul className="flex flex-col gap-4 text-[15px] opacity-95">
              <li className="flex items-center gap-3 font-medium">
                <BadgeCheck className="w-5 h-5 text-[#ffb0c8] shrink-0" />
                Connect with GST Verified Suppliers
              </li>
              <li className="flex items-center gap-3 font-medium">
                <FileText className="w-5 h-5 text-[#ffb0c8] shrink-0" />
                Get Multiple Quotes Instantly
              </li>
              <li className="flex items-center gap-3 font-medium">
                <MessageSquare className="w-5 h-5 text-[#ffb0c8] shrink-0" />
                Direct Communication without Middlemen
              </li>
            </ul>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-8 md:p-12 bg-white flex flex-col justify-center">
          <h3 className="text-[20px] font-bold text-[#1c1b1b] mb-6">
            Quick RFQ (Request for Quotation)
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#574147] mb-1">
                  Category <span className="text-[#ba1a1a]">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setCategory(newCat);
                    const subs = getSubcategoriesForCategoryName(newCat);
                    if (subs.length > 0) setSubcategory(subs[0]);
                  }}
                  className="w-full border border-[#e8e8e8] bg-[#f7f2f2] rounded-lg p-2.5 text-[13.5px] text-[#1c1b1b] focus:border-[#650034] outline-none cursor-pointer"
                >
                  {Object.keys(CATEGORY_TAXONOMY).map((catName) => (
                    <option key={catName} value={catName}>
                      {catName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#574147] mb-1">
                  Subcategory <span className="text-[#ba1a1a]">*</span>
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full border border-[#e8e8e8] bg-[#f7f2f2] rounded-lg p-2.5 text-[13.5px] text-[#1c1b1b] focus:border-[#650034] outline-none cursor-pointer"
                >
                  {getSubcategoriesForCategoryName(category).map((subItem) => (
                    <option key={subItem} value={subItem}>
                      {subItem}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#574147] mb-1">
                Product / Requirement <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                required
                placeholder="e.g. 50ml Airless Pump Bottles"
                className="w-full border border-[#e8e8e8] bg-[#f7f2f2] rounded-lg p-3 text-[14px] text-[#1c1b1b] focus:border-[#650034] focus:ring-1 focus:ring-[#650034] outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#574147] mb-1">
                  Required Quantity
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 5000 pcs"
                  className="w-full border border-[#e8e8e8] bg-[#f7f2f2] rounded-lg p-3 text-[14px] text-[#1c1b1b] focus:border-[#650034] focus:ring-1 focus:ring-[#650034] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#574147] mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Delivery location"
                  className="w-full border border-[#e8e8e8] bg-[#f7f2f2] rounded-lg p-3 text-[14px] text-[#1c1b1b] focus:border-[#650034] focus:ring-1 focus:ring-[#650034] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#574147] mb-1">
                Mobile Number <span className="text-[#ba1a1a]">*</span>
              </label>
              <div className="flex rounded-lg border border-[#e8e8e8] bg-[#f7f2f2] overflow-hidden focus-within:border-[#650034] focus-within:ring-1 focus-within:ring-[#650034]">
                <span className="px-3.5 py-3 text-[14px] font-semibold text-[#574147] bg-[#ece7e7] border-r border-[#e8e8e8]">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="10-digit mobile number"
                  className="w-full bg-transparent p-3 text-[14px] text-[#1c1b1b] outline-none"
                />
              </div>
            </div>

            {submitted ? (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-center font-semibold rounded-lg text-[13px]">
                Requirement received! Connecting you with top beauty suppliers.
              </div>
            ) : (
              <div className="mt-3 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="bg-[#650034] text-white text-[13px] font-semibold py-3 px-6 rounded-lg hover:bg-[#8e004b] transition-colors flex-1 text-center shadow-sm"
                >
                  Get Supplier Quotes
                </button>
                <button
                  type="button"
                  onClick={onPostDetailedClick}
                  className="border border-[#650034] text-[#650034] text-[13px] font-semibold py-3 px-6 rounded-lg hover:bg-[#fde7f3] transition-colors text-center whitespace-nowrap"
                >
                  Post Detailed Requirement
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};
