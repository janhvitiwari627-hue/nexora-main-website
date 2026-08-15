import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Search, 
  MapPin, 
  ChevronDown, 
  ArrowRight, 
  CheckCircle, 
  Heart, 
  Verified,
  ShieldCheck,
  Award
} from 'lucide-react';
import { Product, CategoryId } from '../types';
import { CATEGORIES } from '../data/mockData';

interface DiscoverViewProps {
  products: Product[];
  selectedCategory: CategoryId | 'all';
  selectedCity: string;
  onSelectCategory: (cat: CategoryId | 'all') => void;
  onSelectProduct: (product: Product) => void;
  onAddToQuote: (product: Product, quantity?: number) => void;
  onOpenCitySelector: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  products,
  selectedCategory,
  selectedCity,
  onSelectCategory,
  onSelectProduct,
  onAddToQuote,
  onOpenCitySelector,
}) => {
  const displayProducts = selectedCategory === 'all' 
    ? products.slice(0, 6) 
    : products.filter(p => p.category === selectedCategory);

  const categoryCardsGrid = [
    { id: 'skincare' as CategoryId, name: 'Skincare', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9k9Wu4_PPQg7f8er_MO6PvvXOdQfJ55AQARlc8KHtSfCon7d1VsRLFqiLbPE3UYiM246jYhdZLm-i4K4RL7fUwTjhxWou3noDb2Gu1YwP3aLdfHf5Anran12otsXOIk0uMpJIZQGL9tS06EmP1-kfWv_AtF0_wMvHj8bmZnk0zVrPAxYkoSKh3HsUD4BRzOfNz3ZFv6HyJB3FBUjIYT2oPAw4nCrLXqUiFspOOIV3zxdNLHzdo5RUkg' },
    { id: 'haircare' as CategoryId, name: 'Haircare', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCURew-uLLAI6Fsl9geMprR7cyEoan64gP8Kzhy1HWkhyKgUHdePq1LXs09YFz1ryDfQWnf0_omHHgcicniEYv8Ze2Z7sQmr04NrUO1CQYZ5wiDbia3Ze4DX5G92Ckx1DYUAQ5ermu_vKPT9ccDnQ1SAxWPmmkncNABQ_HrxkpxNjYelZ9k6iSb9zz62MjGFnvaXCWfJBxBTzE5QZFV4NXlBrd5QlW4-m4duJNG_HPJ5jS3EBm3xOUvwQ' },
    { id: 'haircolor' as CategoryId, name: 'Hair Color', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTi_rIt3XfnbEtmhxC9uEy-WvWFOnciGtyNKGyc7vaf8xzEFOBNkTteAfWKnloQs4rdGyHStm9zjn1DiVYBphOeSXJ2F5Yl0ZEUn34MgWo-noRDY323gvHBJ70BnbcH3pn1jlDtU-nQYxTD_zHNkPCsUa3nmJJIsd7IPE-1NxtKcLsY83NVOQ528jECR5omYshkMAnGJpa4pxhaBkwqD6_DGecP6cpoktOF81tdBgbHZ68o2qLBAuR4g' },
    { id: 'makeup' as CategoryId, name: 'Makeup', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqgTGaY-a2W1tkf_FtHmXFY_YI9ObnQk3JKD3dJI953o-QX0aSQo8jnAT48we6Dhc7yE7r36r1zkVh8Iackil2xvTNAqWlhpmaWJAc_FmrTLptkCu-ej8LohXcklM74J5RyhgobaJKnPeZekn8nds23KAUkrAQ9Al6wncEJsY-xoa5XpZYzP0P3wcYyk1NhZh0Gnzn2lfCMp6bwHSpgcq_XWlonOLC3JWbiL4mV2jN2a5WuReDPi5deA' },
    { id: 'nails' as CategoryId, name: 'Nails', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1cLVaXrKaTeiLlerzHbSWFuzmbASqcrgscv09oQBfGQVgunXaZt1f0lOOfG0ypjfxxixIyfkLNGx9TfVeLuPQ8jwmXuY6oUZrRdC5B2r9R_hWis-tKcKpQlLA1b9d1__G22zUE-pRDstsllt4qK0OIRrzAU6vNrESAOriimXjj9tQVUNg0SEmsf-om8X5-KZnCJvO16rcA-C-NE5yKfxS3AezkzeqLg_ZQkR_2vIBJk8yuCctu4FqnA' },
    { id: 'spa' as CategoryId, name: 'Spa', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKM3-pBfBFc0zmjumd5aIItS6gobJjKl373QkmLlwpMlVpeJO5kTAovOFyQvQT3TNzwBYiNAu_rmTrf9xDroigDzK1XOpLM2Gaf-Rm2Mwm9YVQ8HJ3X4LhtZ_Hk5GShUkrJb-Nsq4AcqJxbGQd3jkevWGRqgzfo4R9jQcROWC9v_jYVvwBW0NsR9UzS1OaB61i7Zn7YqCpmb-pxGT_aZX1hb_S8vRpLOS7F0lfhALb1IwfYcQ_L5n4Ew' },
    { id: 'massage' as CategoryId, name: 'Massage', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyseO-8MKLnNnmM_Nn2f0OpcEaPEQ90sqAjDC2VXkBKRQxnPY2mwiR9xUtKyhESdl5lRcQAT0cnFsmLfnduDVpo0XXwh1Csv78dmoDAri_Oy-BaogcA0gn4E_sigZBjJkJZubmbYXajhVdT1q6FIHv0A336GSCN3ShGA6lgwJCwP5OdzpKzawOJzKlMUuvIl8w4IyINFvVBzF4y1IYjDppDR2XjOE6Jj4-LsbQBENWyMKVmElZU7VfAQ' },
    { id: 'tattoo' as CategoryId, name: 'Tattoo Studio', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAr7IDUZjQ4stdzR7y1DXPrKrxsSAdvWagQcFigqg9lE2TacTjMFKm-UTYtY8dCTfmw9nLhA_bwSvru1Eg9QgZbvslT5UgTum1CSkjC0ZWgBmOGe5-iD1PVloDmnao_4ZauVxdqjQbcZsU2RR-fuoTkSyG29xdnxb9S-WPTpGZIjJOM9kvSPcVA2c6mF80GP7xrmdSGemjm4GxFvHq31as5WukarHw8KE8zEEwhOCKqLJMxCRdwlHwSCA' },
    { id: 'furniture' as CategoryId, name: 'Salon Furniture', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9ZwxJfmdYcwOvUc6STlo1D6OLuySPh75cyXLyx_yfoOOJEzQeAbjYL1fz08DqYEbuouZ92JzisihgGwYyQMXFtRcBLExCAYrrmC1FMw5MtWlBYJ7XCvbKVhFPS41HL5Y0kmLy26wO9nxnCmGwQW4XPNu1yZKZe3LfgiL1VkGbxGQECGlaYDM_sLwUaU2_8wkjCISD6hpTH8u7mpBv_L5sASlqQPzENbwJFfWrcpGbI19vsOt11Hzb2A' },
    { id: 'tools' as CategoryId, name: 'Salon Tools & Eq.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqUXW1okFz35Hn7HnvFBwGvHR8cQiIJy2bTJVEkyc94BYubS-8HxEkSTWzQ7F-avLvByLACM5Uw9TRNAYM9gGkBObWkQZwle5XGpdRuV76pTmKYWMatV0vNj2mDudqB_IJLW9vxbDhl9NiUYt9cnyL32liDSUeZdw6Knu2gv6x4wQyHkmEt3R54WA3_NqKSOs8S1MklONvzuQp6-rnoKLK-wGPdcsYEpIoKFUQnWoMwEXp25jITUyUDw' },
    { id: 'backbar' as CategoryId, name: 'Backbar Essentials', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjYZNA800pKRVHvqsYzyQT7vQWO6Q2Ai8fVuZKXyvR3Bwo7WUmTQILnjsh8BnM61QvryK6dmxYhsAI8T1h3wefnRT7809yBhAJ6-SPXu9Va7A6AngUHfahfdjnWbfv2quwg8C78KilazV-SjTeb0ldIPK0Mu1M-BkXES3s3l19wq-lydcTwvdzl0Ae0KSS8ayj5JeWCZf7Dry9yZq-tC-3lsX3l5ANR7iL7ryM7y-FDfet3a1tA0VVCA' },
    { id: 'clinic' as CategoryId, name: 'Aesthetic Clinic Tools', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwae_ReM4V7aZjUtMhMDuunV88ANLRkZIpmZoFAeDWRJ_zCqItMPS2n5pl0MntByGRw5N57rbmjDmmkD0wJBM0hUCsh8HP39l7Yebd7EQkN9YDMkgRIdl16qcV4SIy6J6idvFZD6sq9APF1tviDGfXtFU4LB4T6QpRneyRAT8GfaL682akE8nGvrVYKY22idlbGtyxqmdLFYycx6X5lfnTgnd39ihEqDSkNoEf8yno4GoHgUVs4z1uQQ' }
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-10 flex flex-col gap-12">
      {/* 1. Top Hero Section with Search & Filters */}
      <section className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B1C1B] mb-3 tracking-tight">
            Explore Beauty Categories
          </h1>
          <p className="text-base text-[#605E5E] max-w-3xl leading-relaxed">
            Discover premium professional beauty products, verified suppliers, and top brands to elevate your salon or retail business.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center w-full">
          <div className="flex-1 w-full relative bg-white rounded-xl border border-[#E8E8E8] shadow-xs flex items-center">
            <span className="material-symbols-outlined text-[#605E5E] ml-4">category</span>
            <select 
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value as CategoryId | 'all')}
              className="w-full pl-4 pr-4 py-3 bg-transparent border-none focus:ring-0 text-sm text-[#1B1C1B] appearance-none outline-none cursor-pointer font-medium"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#605E5E] mr-4 pointer-events-none" />
          </div>

          <div 
            onClick={onOpenCitySelector}
            className="flex-1 w-full relative bg-white rounded-xl border border-[#E8E8E8] shadow-xs flex items-center cursor-pointer py-3 px-4"
          >
            <MapPin className="w-4 h-4 text-[#605E5E] mr-3 shrink-0" />
            <span className="text-sm text-[#1B1C1B] font-medium flex-1">{selectedCity} (Change Region)</span>
            <ChevronDown className="w-4 h-4 text-[#605E5E]" />
          </div>

          <button className="w-full md:w-auto px-8 py-3 bg-[#B90064] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap flex items-center justify-center gap-2 shadow-sm">
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </section>

      {/* 2. Professional Beauty Products Listing Grid */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#E8E8E8] pb-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1B1C1B]">Wholesale Catalog & Products</h2>
            <p className="text-sm text-[#605E5E]">Showing professional supplies for {selectedCategory === 'all' ? 'All Categories' : selectedCategory}</p>
          </div>
          <div className="flex bg-[#F6F3F2] rounded-xl p-1 self-start md:self-auto border border-[#E8E8E8]">
            <button className="px-6 py-2 bg-white shadow-xs rounded-lg font-bold text-xs text-[#B90064]">Products</button>
            <button className="px-6 py-2 text-[#605E5E] font-bold text-xs">Suppliers</button>
            <button className="px-6 py-2 text-[#605E5E] font-bold text-xs">Brands</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProducts.map((product) => (
            <div 
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className="bg-white rounded-2xl shadow-xs overflow-hidden border border-[#E8E8E8] hover:shadow-xl transition-all cursor-pointer flex flex-col group"
            >
              <div className="h-64 bg-[#F6F3F2] relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badges for Professional Business Users */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  <span className="bg-gradient-to-r from-[#B8005A] to-[#931248] text-white text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-md border border-white/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" />
                    VERIFIED PRO
                  </span>
                  {product.isWholesale !== false && (
                    <span className="bg-white/95 backdrop-blur-md text-[#1A1A1A] text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs border border-[#EAE5DE]">
                      <Award className="w-3 h-3 text-[#B8005A]" />
                      WHOLESALE READY
                    </span>
                  )}
                </div>

                <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md rounded-full text-[#605E5E] hover:text-[#B90064] transition-colors shadow-sm">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#605E5E]">{product.brand}</span>
                  <span className="text-[10px] font-extrabold text-[#B8005A] bg-[#FFF0F5] px-2.5 py-0.5 rounded-full border border-[#FFD1E3]">
                    B2B Verified
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#1B1C1B] mb-2 line-clamp-2 group-hover:text-[#B90064] transition-colors">{product.name}</h4>
                <div className="text-xs text-[#605E5E] mb-4 flex items-center gap-1.5">
                  <span>Supplier:</span>
                  <span className="font-semibold text-[#1B1C1B]">{product.supplierName}</span>
                </div>
                <div className="mt-auto pt-4 border-t border-[#E8E8E8] flex items-end justify-between">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#605E5E] mb-0.5">Wholesale</span>
                    <span className="text-lg font-extrabold text-[#B90064]">${(product.price || 0).toFixed(2)}</span>
                    <span className="block text-xs text-[#605E5E] mt-0.5 line-through">MRP: ${((product.price || 0) * 1.5).toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-[#605E5E] mb-0.5">MOQ</span>
                    <span className="text-xs font-bold text-[#1B1C1B]">{product.moq} Units</span>
                    <span className="block text-xs text-[#006e1d] mt-0.5 font-medium flex items-center justify-end gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> In Stock
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Complete 12-Category Visual Cards Grid placed below product listing with View Verified Wholesalers buttons */}
      <section className="flex flex-col gap-6 mt-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1B1C1B]">Explore by Category</h2>
          <p className="text-sm text-[#605E5E]">Source directly from verified manufacturers and distributors across all 12 beauty segments.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryCardsGrid.map((cat, idx) => (
            <div 
              key={idx}
              className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-[#E8E8E8]"
            >
              <img 
                alt={cat.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                src={cat.image} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 w-full flex flex-col justify-end">
                <h3 className="text-white text-xl font-bold mb-3">{cat.name}</h3>
                <button 
                  onClick={() => onSelectCategory(cat.id)}
                  className="w-full py-2.5 bg-white/15 backdrop-blur-md border border-white/40 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-[#B90064] transition-all shadow-sm"
                >
                  View Verified Wholesalers
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};


