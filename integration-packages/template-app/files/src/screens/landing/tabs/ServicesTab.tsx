import { Sparkles, Copy, Scissors, Plus, Search, Trash2, Clock, Star, Mic, Gift, Menu, Grid, Pencil } from 'lucide-react';
import { motion } from 'motion/react';
import { Package, Service } from '../../../types';
import { useDashboard } from '../DashboardContext';

/** Owner dashboard tab (lazy-loaded from DashboardScreen). */
export default function ServicesTab() {
  const { data, servicesSubTab, setServicesSubTab, servicesSearchQuery, setServicesSearchQuery, servicesSelectedCategory, setServicesSelectedCategory, servicesViewLayout, setServicesViewLayout, setEditingService, setEditingPackage, setShowServiceDrawer, setShowPackageDrawer, setNewServiceName, setNewServiceCategory, setNewServicePrice, setNewServiceDuration, setNewServiceDesc, setNewServiceFeatured, setNewPackageName, setNewPackagePrice, setNewPackageDuration, setNewPackageDesc, handleDuplicateService, handleDeleteService, handleDuplicatePackage, handleDeletePackage, setShowVoiceModal, setIsVoiceListening, setShowAiSuggestModal } = useDashboard();
  return (
              <motion.div 
                key="services"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6 max-w-7xl mx-auto"
              >
                {/* 1. Header & Quick Actions Bar */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-3xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#ffd9e1]/50 text-[#ac0053]">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Services & Catalog Manager</h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Configure your treatment offerings and high-value package combos. Updates instantly sync to your public live booking site.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button 
                      onClick={() => {
                        setShowVoiceModal(true);
                        setIsVoiceListening(false);
                      }}
                      className="px-4 py-2 border border-[#ffd9e1] bg-[#ffd9e1]/20 hover:bg-[#ffd9e1]/40 text-[#ac0053] font-bold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-2xs"
                    >
                      <Mic className="w-4 h-4 text-[#ac0053]" />
                      Voice Quick-Add
                    </button>
                    <button 
                      onClick={() => setShowAiSuggestModal(true)}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                      AI Suggest Ideas
                    </button>
                    <button 
                      onClick={() => {
                        if (servicesSubTab === 'services') {
                          setEditingService(null);
                          setNewServiceName('');
                          setNewServiceCategory('Hair Styling');
                          setNewServicePrice(400);
                          setNewServiceDuration(30);
                          setNewServiceDesc('');
                          setNewServiceFeatured(false);
                          setShowServiceDrawer(true);
                        } else {
                          setEditingPackage(null);
                          setNewPackageName('');
                          setNewPackagePrice(1200);
                          setNewPackageDuration(60);
                          setNewPackageDesc('');
                          setShowPackageDrawer(true);
                        }
                      }}
                      className="px-4 py-2 bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-[#ac0053]/20"
                    >
                      <Plus className="w-4 h-4" />
                      {servicesSubTab === 'services' ? 'Add Service' : 'Add Package'}
                    </button>
                  </div>
                </div>

                {/* 2. Dynamic Summary Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-3xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 border border-gray-100">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Services</p>
                      <p className="text-lg font-extrabold text-gray-900 mt-0.5">{data.services.length}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-3xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Featured Items</p>
                      <p className="text-lg font-extrabold text-gray-900 mt-0.5">{data.services.filter(s => s.featured).length}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-3xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 border border-purple-100">
                      <Gift className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Combo Packages</p>
                      <p className="text-lg font-extrabold text-gray-900 mt-0.5">{data.packages ? data.packages.length : 0}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-3xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
                      <span className="text-lg font-black text-emerald-600">₹</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Average Price</p>
                      <p className="text-lg font-extrabold text-gray-900 mt-0.5">
                        ₹{data.services.length > 0 ? Math.round(data.services.reduce((acc, s) => acc + s.price, 0) / data.services.length) : 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Catalog Controls Sub-Bar */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-3xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                  {/* Left: Tab Switcher (Services vs Packages) */}
                  <div className="flex p-1 bg-gray-100/80 border border-gray-200 rounded-xl max-w-xs">
                    <button
                      onClick={() => setServicesSubTab('services')}
                      className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap ${
                        servicesSubTab === 'services' 
                          ? 'bg-white text-gray-900 shadow-3xs' 
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Services Catalog ({data.services.length})
                    </button>
                    <button
                      onClick={() => setServicesSubTab('packages')}
                      className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap ${
                        servicesSubTab === 'packages' 
                          ? 'bg-white text-gray-900 shadow-3xs' 
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Package Combos ({data.packages ? data.packages.length : 0})
                    </button>
                  </div>

                  {/* Right: Dynamic Search & Filter */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-grow md:justify-end max-w-2xl">
                    <div className="relative flex-grow">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input 
                        type="text"
                        value={servicesSearchQuery}
                        onChange={(e) => setServicesSearchQuery(e.target.value)}
                        placeholder={servicesSubTab === 'services' ? "Search services..." : "Search packages..."}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053]/10"
                      />
                      {servicesSearchQuery && (
                        <button 
                          onClick={() => setServicesSearchQuery('')}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {servicesSubTab === 'services' && (
                      <select
                        value={servicesSelectedCategory}
                        onChange={(e) => setServicesSelectedCategory(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold outline-none"
                      >
                        <option value="All Categories">All Categories</option>
                        {Array.from(new Set(data.services.map(s => s.category))).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}

                    {/* Grid vs List layout buttons */}
                    <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-200 shrink-0">
                      <button 
                        onClick={() => setServicesViewLayout('list')}
                        className={`p-1.5 rounded-lg ${servicesViewLayout === 'list' ? 'bg-white text-gray-900 shadow-3xs' : 'text-gray-400 hover:text-gray-700'}`}
                        title="List View"
                      >
                        <Menu className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setServicesViewLayout('grid')}
                        className={`p-1.5 rounded-lg ${servicesViewLayout === 'grid' ? 'bg-white text-gray-900 shadow-3xs' : 'text-gray-400 hover:text-gray-700'}`}
                        title="Grid View"
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Filtered Content Lists */}
                {servicesSubTab === 'services' ? (
                  // SERVICES VIEW
                  <div>
                    {data.services.filter(s => {
                      const matchesSearch = s.name.toLowerCase().includes(servicesSearchQuery.toLowerCase()) ||
                                            s.description.toLowerCase().includes(servicesSearchQuery.toLowerCase());
                      const matchesCategory = servicesSelectedCategory === 'All Categories' || s.category === servicesSelectedCategory;
                      return matchesSearch && matchesCategory;
                    }).length === 0 ? (
                      // Empty Filter State
                      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-3xs max-w-xl mx-auto space-y-4">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mx-auto border border-gray-100">
                          <Scissors className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-gray-800 text-sm">No Matching Services Found</h4>
                          <p className="text-xs text-gray-400 mt-1">Try relaxing your search terms or generate catalog items instantly using our AI Ideas engine.</p>
                        </div>
                        <div className="flex gap-2 justify-center pt-2">
                          <button 
                            onClick={() => {
                              setServicesSearchQuery('');
                              setServicesSelectedCategory('All Categories');
                            }}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                          >
                            Clear Filters
                          </button>
                          <button 
                            onClick={() => setShowAiSuggestModal(true)}
                            className="px-4 py-2 bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs rounded-xl transition-all"
                          >
                            Generate Services with AI
                          </button>
                        </div>
                      </div>
                    ) : servicesViewLayout === 'list' ? (
                      // Table List View
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-3xs overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest bg-gray-50/60 select-none">
                              <th className="py-3 px-6 w-10"></th>
                              <th className="py-3 px-6">Service Name & Info</th>
                              <th className="py-3 px-6">Category</th>
                              <th className="py-3 px-6">Duration</th>
                              <th className="py-3 px-6">Price</th>
                              <th className="py-3 px-6">Status</th>
                              <th className="py-3 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.services
                              .filter(s => {
                                const matchesSearch = s.name.toLowerCase().includes(servicesSearchQuery.toLowerCase()) ||
                                                      s.description.toLowerCase().includes(servicesSearchQuery.toLowerCase());
                                const matchesCategory = servicesSelectedCategory === 'All Categories' || s.category === servicesSelectedCategory;
                                return matchesSearch && matchesCategory;
                              })
                              .map(serv => (
                                <tr key={serv.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
                                  <td className="py-4 px-6 text-center">
                                    <div className="text-gray-300 cursor-grab active:cursor-grabbing">
                                      <span className="material-symbols-outlined text-base">drag_indicator</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-gray-900">{serv.name}</span>
                                      {serv.featured && (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-50 text-amber-700 font-extrabold px-1.5 py-0.5 rounded-md border border-amber-200">
                                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Featured
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1 max-w-md font-semibold">{serv.description}</p>
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className="text-[10px] font-extrabold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg uppercase tracking-wide border border-gray-200/50">
                                      {serv.category}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className="text-xs font-bold text-gray-500 inline-flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {serv.duration} mins
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-xs font-extrabold text-gray-900">₹{serv.price}</td>
                                  <td className="py-4 px-6">
                                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100">
                                      Active
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => {
                                          setEditingService(serv);
                                          setNewServiceName(serv.name);
                                          setNewServiceCategory(serv.category);
                                          setNewServicePrice(serv.price);
                                          setNewServiceDuration(serv.duration);
                                          setNewServiceDesc(serv.description);
                                          setNewServiceFeatured(!!serv.featured);
                                          setShowServiceDrawer(true);
                                        }}
                                        className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
                                        title="Edit Service"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleDuplicateService(serv)}
                                        className="p-1 text-gray-400 hover:text-[#ac0053] hover:bg-[#ffd9e1]/20 rounded-md transition-all"
                                        title="Duplicate Service"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteService(serv.id, serv.name)}
                                        className="p-1 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                                        title="Delete Service"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      // Grid Cards View
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.services
                          .filter(s => {
                            const matchesSearch = s.name.toLowerCase().includes(servicesSearchQuery.toLowerCase()) ||
                                                  s.description.toLowerCase().includes(servicesSearchQuery.toLowerCase());
                            const matchesCategory = servicesSelectedCategory === 'All Categories' || s.category === servicesSelectedCategory;
                            return matchesSearch && matchesCategory;
                          })
                          .map(serv => (
                            <div 
                              key={serv.id}
                              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-3xs flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden"
                            >
                              <div>
                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <span className="text-[10px] font-extrabold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full uppercase tracking-wide border border-gray-200/50">
                                    {serv.category}
                                  </span>
                                  {serv.featured && (
                                    <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-0.5">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Featured
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-extrabold text-gray-900 text-sm group-hover:text-[#ac0053] transition-colors">{serv.name}</h4>
                                <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed font-semibold">{serv.description}</p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-gray-500 inline-flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {serv.duration} mins
                                  </span>
                                  <span className="text-xs font-black text-gray-900">₹{serv.price}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => {
                                      setEditingService(serv);
                                      setNewServiceName(serv.name);
                                      setNewServiceCategory(serv.category);
                                      setNewServicePrice(serv.price);
                                      setNewServiceDuration(serv.duration);
                                      setNewServiceDesc(serv.description);
                                      setNewServiceFeatured(!!serv.featured);
                                      setShowServiceDrawer(true);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                                    title="Edit"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDuplicateService(serv)}
                                    className="p-1.5 text-gray-400 hover:text-[#ac0053] hover:bg-[#ffd9e1]/20 rounded-lg transition-all"
                                    title="Duplicate"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteService(serv.id, serv.name)}
                                    className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // PACKAGES VIEW
                  <div>
                    {!(data.packages && data.packages.filter(p => {
                      return p.name.toLowerCase().includes(servicesSearchQuery.toLowerCase()) ||
                             p.description.toLowerCase().includes(servicesSearchQuery.toLowerCase());
                    }).length > 0) ? (
                      // Empty Filter State for Packages
                      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-3xs max-w-xl mx-auto space-y-4">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mx-auto border border-gray-100">
                          <Gift className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-gray-800 text-sm">No Package Combos Available</h4>
                          <p className="text-xs text-gray-400 mt-1">Package combos combine multiple treatments together at a dynamic discount. Create your first high-ticket combo menu.</p>
                        </div>
                        <div className="pt-2 flex justify-center">
                          <button 
                            onClick={() => {
                              setEditingPackage(null);
                              setNewPackageName('');
                              setNewPackagePrice(1200);
                              setNewPackageDuration(60);
                              setNewPackageDesc('');
                              setShowPackageDrawer(true);
                            }}
                            className="px-5 py-2.5 bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-[#ac0053]/15"
                          >
                            + Add First Package Combo
                          </button>
                        </div>
                      </div>
                    ) : servicesViewLayout === 'list' ? (
                      // Table view
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-3xs overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest bg-gray-50/60 select-none">
                              <th className="py-3 px-6 w-10"></th>
                              <th className="py-3 px-6">Package Details</th>
                              <th className="py-3 px-6">Est. Duration</th>
                              <th className="py-3 px-6">Combo Price</th>
                              <th className="py-3 px-6">Status</th>
                              <th className="py-3 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(data.packages || []).filter(p => {
                              return p.name.toLowerCase().includes(servicesSearchQuery.toLowerCase()) ||
                                     p.description.toLowerCase().includes(servicesSearchQuery.toLowerCase());
                            }).map(pkg => (
                              <tr key={pkg.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
                                <td className="py-4 px-6 text-center">
                                  <div className="text-gray-300 cursor-grab active:cursor-grabbing">
                                    <span className="material-symbols-outlined text-base">drag_indicator</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="text-xs font-bold text-gray-900">{pkg.name}</div>
                                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1 max-w-xl font-semibold">{pkg.description}</p>
                                </td>
                                <td className="py-4 px-6">
                                  <span className="text-xs font-bold text-gray-500 inline-flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {pkg.duration} mins
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-xs font-extrabold text-emerald-600">₹{pkg.price}</td>
                                <td className="py-4 px-6">
                                  <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg border border-purple-100">
                                    Live Combo
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex items-center justify-end gap-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => {
                                        setEditingPackage(pkg);
                                        setNewPackageName(pkg.name);
                                        setNewPackagePrice(pkg.price);
                                        setNewPackageDuration(pkg.duration);
                                        setNewPackageDesc(pkg.description);
                                        setShowPackageDrawer(true);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
                                      title="Edit Package"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleDuplicatePackage(pkg)}
                                      className="p-1 text-gray-400 hover:text-[#ac0053] hover:bg-[#ffd9e1]/20 rounded-md transition-all"
                                      title="Duplicate Package"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                                      className="p-1 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                                      title="Delete Package"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      // Grid layout
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(data.packages || []).filter(p => {
                          return p.name.toLowerCase().includes(servicesSearchQuery.toLowerCase()) ||
                                 p.description.toLowerCase().includes(servicesSearchQuery.toLowerCase());
                        }).map(pkg => (
                          <div 
                            key={pkg.id}
                            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-3xs flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden"
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <span className="text-[10px] font-extrabold bg-purple-50 text-purple-600 px-2.5 py-0.5 rounded-full uppercase tracking-wide border border-purple-100/50">
                                  Value Package
                                </span>
                              </div>
                              <h4 className="font-extrabold text-gray-900 text-sm group-hover:text-[#ac0053] transition-colors">{pkg.name}</h4>
                              <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed font-semibold">{pkg.description}</p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-500 inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {pkg.duration} mins
                                </span>
                                <span className="text-xs font-extrabold text-emerald-600">₹{pkg.price}</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => {
                                    setEditingPackage(pkg);
                                    setNewPackageName(pkg.name);
                                    setNewPackagePrice(pkg.price);
                                    setNewPackageDuration(pkg.duration);
                                    setNewPackageDesc(pkg.description);
                                    setShowPackageDrawer(true);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDuplicatePackage(pkg)}
                                  className="p-1.5 text-gray-400 hover:text-[#ac0053] hover:bg-[#ffd9e1]/20 rounded-lg transition-all"
                                  title="Duplicate"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                                  className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
  );
}
