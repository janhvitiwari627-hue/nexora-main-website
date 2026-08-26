import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Award,
  FileCheck2,
  Zap,
  Globe2,
  Activity,
  CheckCircle2,
  Plus,
  Send,
  Phone,
  MessageCircle,
  Building2,
  Sparkles,
  Layers,
  Clock,
  Boxes,
  HelpCircle,
  TrendingUp,
  XCircle,
  Scale
} from 'lucide-react';
import { SearchSupplier } from '../types';
import { VerifiedBadge } from './VerifiedBadge';

interface SupplierComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSuppliers: SearchSupplier[];
  allSuppliers: SearchSupplier[];
  onAddSupplier: (supplier: SearchSupplier) => void;
  onRemoveSupplier: (supplierId: string) => void;
  onClearAll: () => void;
  onOpenEnquiry: (supplier: SearchSupplier) => void;
  onCallSupplier: (supplierName: string) => void;
  onWhatsAppSupplier: (supplierName: string) => void;
}

export const SupplierComparisonModal: React.FC<SupplierComparisonModalProps> = ({
  isOpen,
  onClose,
  selectedSuppliers,
  allSuppliers,
  onAddSupplier,
  onRemoveSupplier,
  onClearAll,
  onOpenEnquiry,
  onCallSupplier,
  onWhatsAppSupplier,
}) => {
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  if (!isOpen) return null;

  const availableToAdd = allSuppliers.filter(
    (s) => !selectedSuppliers.some((sel) => sel.id === s.id)
  );

  // Helper to check if a value is the highest/best among compared suppliers
  const isHighestTrustScore = (score: number) => {
    if (selectedSuppliers.length < 2) return false;
    const max = Math.max(...selectedSuppliers.map((s) => s.trustScore || 0));
    return score === max;
  };

  const isFastestResponse = (score: number) => {
    if (selectedSuppliers.length < 2) return false;
    const max = Math.max(...selectedSuppliers.map((s) => s.responseScore || 0));
    return score === max;
  };

  const isHighestReliability = (rating: number) => {
    if (selectedSuppliers.length < 2) return false;
    const max = Math.max(...selectedSuppliers.map((s) => s.reliabilityRating || 0));
    return rating === max;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#fdf8f8] rounded-2xl w-full max-w-6xl shadow-2xl border border-[#e8e8e8] overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-white px-6 py-4.5 border-b border-[#e8e8e8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fde7f3] text-[#b90064] flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#1c1b1b]">
                  Supplier Side-by-Side Comparison
                </h2>
                <span className="text-[11px] font-bold bg-[#fde7f3] text-[#b90064] px-2.5 py-0.5 rounded-full">
                  {selectedSuppliers.length} of 3 Selected
                </span>
              </div>
              <p className="text-[12px] text-[#594047]">
                Compare audited credentials, SLA ratings, factory capacity, and manufacturing specialties.
              </p>
            </div>
          </div>

          {/* Top Actions Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Highlight Differences toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-[#fcf9f8] hover:bg-[#f6eff2] border border-[#e8e8e8] px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#1c1b1b] transition-colors select-none">
              <input
                type="checkbox"
                checked={highlightDifferences}
                onChange={(e) => setHighlightDifferences(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#b90064] rounded cursor-pointer"
              />
              <span>Highlight Leaders</span>
            </label>

            {/* Add Supplier dropdown if < 3 */}
            {selectedSuppliers.length < 3 && availableToAdd.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAddDropdown(!showAddDropdown)}
                  className="bg-white hover:bg-[#fde7f3] border border-[#b90064]/40 text-[#b90064] text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Supplier ({3 - selectedSuppliers.length} left)</span>
                </button>

                {showAddDropdown && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-[#e8e8e8] py-2 z-50 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-[#8c7077] uppercase tracking-wider border-b border-[#e8e8e8]">
                      Select to Add
                    </div>
                    {availableToAdd.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onAddSupplier(s);
                          setShowAddDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#fde7f3]/50 flex items-center gap-2.5 transition-colors"
                      >
                        <span className="w-7 h-7 rounded-lg bg-[#b90064] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {s.shortCode}
                        </span>
                        <div className="overflow-hidden">
                          <p className="text-[12px] font-bold text-[#1c1b1b] truncate">{s.name}</p>
                          <p className="text-[10px] text-[#594047] truncate">{s.city} • {s.trustScore}/100 Trust</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Clear All */}
            {selectedSuppliers.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[12px] text-[#8c7077] hover:text-[#b90064] px-2 py-1.5 font-medium transition-colors"
              >
                Clear
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#594047] hover:bg-[#f0e6eb] hover:text-[#1c1b1b] transition-colors"
              title="Close Modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Comparison Table */}
        <div className="overflow-y-auto overflow-x-auto flex-1 p-5 md:p-6 custom-scrollbar">
          {selectedSuppliers.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-[#e8e8e8]">
              <div className="w-14 h-14 rounded-2xl bg-[#fde7f3] text-[#b90064] flex items-center justify-center mx-auto mb-3.5">
                <Scale className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#1c1b1b]">No Suppliers Selected for Comparison</h3>
              <p className="text-[13px] text-[#594047] max-w-md mx-auto mt-1 mb-5">
                Select 2 or 3 verified suppliers from the directory to review their audits, certifications, and production capabilities side-by-side.
              </p>
              <div className="flex flex-wrap gap-2.5 justify-center max-w-lg mx-auto">
                {allSuppliers.slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onAddSupplier(s)}
                    className="bg-[#fcf9f8] hover:bg-[#fde7f3] border border-[#e8e8e8] hover:border-[#b90064] text-[#1c1b1b] text-[12px] font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#b90064]" />
                    <span>{s.name} ({s.city})</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="min-w-[760px] bg-white rounded-2xl border border-[#e8e8e8] shadow-2xs overflow-hidden">
              
              {/* Header Row: Supplier Cards Grid */}
              <div className="grid grid-cols-12 border-b border-[#e8e8e8] bg-[#fcf9f8] sticky top-0 z-20">
                <div className="col-span-3 p-4 flex flex-col justify-end border-r border-[#e8e8e8] bg-[#f7f2f2]">
                  <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider">
                    Manufacturing Criteria
                  </span>
                  <span className="text-[12px] text-[#594047] mt-0.5">
                    Direct comparison attributes
                  </span>
                </div>

                {/* Columns for 1 to 3 selected suppliers */}
                {selectedSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className={`${
                      selectedSuppliers.length === 1
                        ? 'col-span-9'
                        : selectedSuppliers.length === 2
                        ? 'col-span-4'
                        : 'col-span-3'
                    } p-4 border-r border-[#e8e8e8] last:border-r-0 flex flex-col justify-between relative group bg-white`}
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => onRemoveSupplier(supplier.id)}
                      className="absolute top-3 right-3 p-1 rounded-md text-[#8c7077] hover:text-[#b90064] hover:bg-[#fde7f3] transition-colors"
                      title="Remove from comparison"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div>
                      {/* Logo + Name */}
                      <div className="flex items-center gap-2.5 mb-2 pr-6">
                        <div className="w-10 h-10 rounded-xl bg-[#b90064] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                          {supplier.shortCode}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <h3 className="font-bold text-[14px] text-[#1c1b1b] leading-tight">
                              {supplier.name}
                            </h3>
                            <ShieldCheck className="w-3.5 h-3.5 text-[#b90064] shrink-0" />
                          </div>
                          <p className="text-[11px] text-[#594047] mt-0.5">
                            {supplier.type}
                          </p>
                        </div>
                      </div>

                      {/* Location & Trust Pill */}
                      <div className="flex items-center justify-between gap-1 mt-2 flex-wrap">
                        <span className="text-[11px] text-[#594047]">
                          📍 {supplier.city}{supplier.state ? `, ${supplier.state}` : ''}
                        </span>
                        <VerifiedBadge
                          trustScore={supplier.trustScore}
                          overallRating={supplier.overallRating}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Quick CTA */}
                    <div className="mt-3.5 pt-3 border-t border-[#f0e6eb]">
                      <button
                        onClick={() => onOpenEnquiry(supplier)}
                        className="w-full bg-[#b90064] hover:bg-[#8e004b] text-white text-[12px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Enquiry</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Empty slot placeholder if only 2 selected */}
                {selectedSuppliers.length === 2 && (
                  <div className="col-span-2 p-4 border-r-0 flex flex-col items-center justify-center bg-[#fcf9f8]/60 text-center border-dashed">
                    <div className="w-8 h-8 rounded-full bg-white border border-dashed border-[#8c7077] flex items-center justify-center text-[#8c7077] mb-2">
                      <Plus className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-semibold text-[#594047]">Add 3rd Supplier</p>
                    {availableToAdd.length > 0 && (
                      <button
                        onClick={() => onAddSupplier(availableToAdd[0])}
                        className="text-[10px] text-[#b90064] font-bold hover:underline mt-1"
                      >
                        + Add {availableToAdd[0].shortCode}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 1: CREDENTIALS & AUDIT STATUS */}
              <div className="bg-[#f9f4f5] px-4 py-2 border-b border-[#e8e8e8] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#b90064]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1c1b1b]">
                  1. Credentials & Facility Audits
                </span>
              </div>

              {/* Row: GST Verification */}
              <div className="grid grid-cols-12 border-b border-[#e8e8e8] text-[12px]">
                <div className="col-span-3 p-3.5 bg-[#fcf9f8] font-semibold text-[#1c1b1b] border-r border-[#e8e8e8] flex items-center">
                  GST Registration
                </div>
                {selectedSuppliers.map((s) => (
                  <div
                    key={s.id}
                    className={`${
                      selectedSuppliers.length === 1
                        ? 'col-span-9'
                        : selectedSuppliers.length === 2
                        ? 'col-span-4'
                        : 'col-span-3'
                    } p-3.5 border-r border-[#e8e8e8] last:border-r-0 flex items-center gap-1.5`}
                  >
                    {s.isGstVerified ? (
                      <span className="text-[#00875a] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        GST Verified & Active
                      </span>
                    ) : (
                      <span className="text-[#8c7077]">Pending Verification</span>
                    )}
                  </div>
                ))}
                {selectedSuppliers.length === 2 && <div className="col-span-2 bg-[#fcf9f8]/40 border-r-0"></div>}
              </div>

              {/* Row: ISO / GMP Standards */}
              <div className="grid grid-cols-12 border-b border-[#e8e8e8] text-[12px]">
                <div className="col-span-3 p-3.5 bg-[#fcf9f8] font-semibold text-[#1c1b1b] border-r border-[#e8e8e8] flex items-center">
                  GMP & ISO Standards
                </div>
                {selectedSuppliers.map((s) => (
                  <div
                    key={s.id}
                    className={`${
                      selectedSuppliers.length === 1
                        ? 'col-span-9'
                        : selectedSuppliers.length === 2
                        ? 'col-span-4'
                        : 'col-span-3'
                    } p-3.5 border-r border-[#e8e8e8] last:border-r-0 flex items-center gap-1.5`}
                  >
                    <span className="bg-[#fde7f3] text-[#b90064] font-semibold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      {s.isIsoCertified ? 'ISO 22716 / 9001 GMP' : 'Standard GMP'}
                    </span>
                  </div>
                ))}
                {selectedSuppliers.length === 2 && <div className="col-span-2 bg-[#fcf9f8]/40 border-r-0"></div>}
              </div>

              {/* Row: Export & Regulatory Compliance */}
              <div className="grid grid-cols-12 border-b border-[#e8e8e8] text-[12px]">
                <div className="col-span-3 p-3.5 bg-[#fcf9f8] font-semibold text-[#1c1b1b] border-r border-[#e8e8e8] flex items-center">
                  Export Compliance
                </div>
                {selectedSuppliers.map((s) => (
                  <div
                    key={s.id}
                    className={`${
                      selectedSuppliers.length === 1
                        ? 'col-span-9'
                        : selectedSuppliers.length === 2
                        ? 'col-span-4'
                        : 'col-span-3'
                    } p-3.5 border-r border-[#e8e8e8] last:border-r-0`}
                  >
                    <span className="font-semibold text-[#0050d6] block">
                      {s.exportCertifications || 'Domestic & SAARC Certified'}
                    </span>
                    <span className="text-[10px] text-[#594047] block mt-0.5">
                      {s.exportReadiness}% Export Readiness Index
                    </span>
                  </div>
                ))}
                {selectedSuppliers.length === 2 && <div className="col-span-2 bg-[#fcf9f8]/40 border-r-0"></div>}
              </div>

              {/* Row: Full Certifications List */}
              <div className="grid grid-cols-12 border-b border-[#e8e8e8] text-[12px]">
                <div className="col-span-3 p-3.5 bg-[#fcf9f8] font-semibold text-[#1c1b1b] border-r border-[#e8e8e8]">
                  Verified Badges & Accreditations
                </div>
                {selectedSuppliers.map((s) => (
                  <div
                    key={s.id}
                    className={`${
                      selectedSuppliers.length === 1
                        ? 'col-span-9'
                        : selectedSuppliers.length === 2
                        ? 'col-span-4'
                        : 'col-span-3'
                    } p-3.5 border-r border-[#e8e8e8] last:border-r-0`}
                  >
                    <div className="flex flex-wrap gap-1">
                      {(s.certificationsList || ['ISO 9001', 'GMP', 'Cruelty Free']).map((cert, idx) => (
                        <span
                          key={idx}
                          className="bg-white border border-[#e8e8e8] text-[#594047] text-[10px] font-medium px-2 py-0.5 rounded shadow-2xs"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {selectedSuppliers.length === 2 && <div className="col-span-2 bg-[#fcf9f8]/40 border-r-0"></div>}
              </div>

              {/* SECTION 2: RATINGS & SLA METRICS */}
              <div className="bg-[#f9f4f5] px-4 py-2 border-b border-[#e8e8e8] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0050d6]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1c1b1b]">
                  2. Ratings, SLA & Reliability Scores
                </span>
              </div>

              {/* Row: Trust Score */}
              <div className="grid grid-cols-12 border-b border-[#e8e8e8] text-[12px]">
                <div className="col-span-3 p-3.5 bg-[#fcf9f8] font-semibold text-[#1c1b1b] border-r border-[#e8e8e8] flex items-center">
                  Trust Score (/100)
                </div>
                {selectedSuppliers.map((s) => {
                  const isLeader = highlightDifferences && isHighestTrustScore(s.trustScore);
                  return (
                    <div
                      key={s.id}
                      className={`${
                        selectedSuppliers.length === 1
                          ? 'col-span-9'
                          : selectedSuppliers.length === 2
                          ? 'col-span-4'
                          : 'col-span-3'
                      } p-3.5 border-r border-[#e8e8e8] last:border-r-0 ${
                        isLeader ? 'bg-[#fde7f3]/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-[#b90064]">
                          {s.trustScore}/100
                        </span>
                        {isLeader && (
                          <span className="text-[10px] font-bold bg-[#b90064] text-white px-1.5 py-0.2 rounded">
                            Top Score
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-[#f0e6eb] rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-[#b90064] rounded-full"
                          style={{ width: `${s.trustScore}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {selectedSuppliers.length === 2 && <div className="col-span-2 bg-[#fcf9f8]/40 border-r-0"></div>}
              </div>

              {/* Row: Reliability & Batch Consistency */}
              <div className="grid grid-cols-12 border-b border-[#e8e8e8] text-[12px]">
                <div className="col-span-3 p-3.5 bg-[#fcf9f8] font-semibold text-[#1c1b1b] border-r border-[#e8e8e8] flex items-center">
                  Reliability & Quality Index
                </div>
                {selectedSuppliers.map((s) => {
                  const isLeader = highlightDifferences && isHighestReliability(s.reliabilityRating);
                  return (
                    <div
                      key={s.id}
                      className={`${
                        selectedSuppliers.length === 1
                          ? 'col-span-9'
                          : selectedSuppliers.length === 2
                          ? 'col-span-4'
                          : 'col-span-3'
                      } p-3.5 border-r border-[#e8e8e8] last:border-r-0 ${
                        isLeader ? 'bg-[#dbe1ff]/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0050d6]">
                          {s.reliabilityRating}%
                        </span>
                        {isLeader && (
                          <span className="text-[10px] font-bold bg-[#0050d6] text-white px-1.5 py-0.2 rounded">
                            Highest
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-[#dbe1ff] rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-[#0050d6] rounded-full"
                          style={{ width: `${s.reliabilityRating}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {selectedSuppliers.length === 2 && <div className="col-span-2 bg-[#fcf9f8]/40 border-r-0"></div>}
              </div>

              {/* Row: Response Time (SLA) */}
              <div className="grid grid-cols-12 border-b border-[#e8e8e8] text-[12px]">
                <div className="col-span-3 p-3.5 bg-[#fcf9f8] font-semibold text-[#1c1b1b] border-r border-[#e8e8e8] flex items-center">
                  Response SLA & Speed
                </div>
                {selectedSuppliers.map((s) => {
                  const isFastest = highlightDifferences && isFastestResponse(s.responseScore);
                  return (
                    <div
                      key={s.id}
                      className={`${
                        selectedSuppliers.length === 1
                          ? 'col-span-9'
                          : selectedSuppliers.length === 2
                          ? 'col-span-4'
                          : 'col-span-3'
                      } p-3.5 border-r border-[#e8e8e8] last:border-r-0 ${
                        isFastest ? 'bg-[#e3fcef]/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1c1b1b] flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-[#b90064]" />
                          {s.responseTimeText}
                        </span>
                        {isFastest && (
                          <span className="text-[10px] font-bold bg-[#00875a] text-white px-1.5 py-0.2 rounded">
                            Fastest
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#594047] block mt-0.5">
                        {s.responseRate}
                      </span>
                    </div>
                  );
                })}
                {selectedSuppliers.length === 2 && <div className="col-span-2 bg-[#fcf9f8]/40 border-r-0"></div>}
              </div>

              {/* SECTION 3: SPECIALTIES, MOQ & PRODUCTION CAPACITY */}
              <div className="bg-[#f9f4f5] px-4 py-2 border-b border-[#e8e8e8] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#b90064]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1c1b1b]">
                  3. Specialties & Commercial Capacities
                </span>
              </div>

              {/* Row: Specialty Formulations */}
              <div className="grid grid-cols-12 border-b border-[#e8e8e8] text-[12px]">
                <div className="col-span-3 p-3.5 bg-[#fcf9f8] font-semibold text-[#1c1b1b] border-r border-[#e8e8e8]">
                  Key Specialties & Formulations
                </div>
                {selectedSuppliers.map((s) => (
                  <div
                    key={s.id}
                    className={`${
                      selectedSuppliers.length === 1
                        ? 'col-span-9'
                        : selectedSuppliers.length === 2
                        ? 'col-span-4'
                        : 'col-span-3'
                    } p-3.5 border-r border-[#e8e8e8] last:border-r-0`}
                  >
                    <div className="space-y-1.5">
                      {(s.specialties || s.categories).map((spec, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#1c1b1b]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#b90064] shrink-0"></span>
                          <span className="font-medium">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {selectedSuppliers.length === 2 && <div className="col-span-2 bg-[#fcf9f8]/40 border-r-0"></div>}
              </div>

              {/* Row: Minimum Order Value (MOV) / MOQ */}
              <div className="grid grid-cols-12 border-b border-[#e8e8e8] text-[12px]">
                <div className="col-span-3 p-3.5 bg-[#fcf9f8] font-semibold text-[#1c1b1b] border-r border-[#e8e8e8] flex items-center">
                  Minimum Order Value (MOV)
                </div>
                {selectedSuppliers.map((s) => (
                  <div
                    key={s.id}
                    className={`${
                      selectedSuppliers.length === 1
                        ? 'col-span-9'
                        : selectedSuppliers.length === 2
                        ? 'col-span-4'
                        : 'col-span-3'
                    } p-3.5 border-r border-[#e8e8e8] last:border-r-0 font-bold text-[#1c1b1b]`}
                  >
                    {s.minOrderValue || '₹25,000 / 100 units'}
                  </div>
                ))}
                {selectedSuppliers.length === 2 && <div className="col-span-2 bg-[#fcf9f8]/40 border-r-0"></div>}
              </div>

              {/* Row: Sample Turnaround Time */}
              <div className="grid grid-cols-12 border-b border-[#e8e8e8] text-[12px]">
                <div className="col-span-3 p-3.5 bg-[#fcf9f8] font-semibold text-[#1c1b1b] border-r border-[#e8e8e8] flex items-center">
                  Sample Dispatch Speed
                </div>
                {selectedSuppliers.map((s) => (
                  <div
                    key={s.id}
                    className={`${
                      selectedSuppliers.length === 1
                        ? 'col-span-9'
                        : selectedSuppliers.length === 2
                        ? 'col-span-4'
                        : 'col-span-3'
                    } p-3.5 border-r border-[#e8e8e8] last:border-r-0 font-medium text-[#594047] flex items-center gap-1.5`}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#8c7077]" />
                    <span>{s.sampleLeadTime || '2 - 3 Days'}</span>
                  </div>
                ))}
                {selectedSuppliers.length === 2 && <div className="col-span-2 bg-[#fcf9f8]/40 border-r-0"></div>}
              </div>

              {/* Row: Monthly Production Capacity */}
              <div className="grid grid-cols-12 border-b border-[#e8e8e8] text-[12px]">
                <div className="col-span-3 p-3.5 bg-[#fcf9f8] font-semibold text-[#1c1b1b] border-r border-[#e8e8e8] flex items-center">
                  Monthly Capacity & Plant Area
                </div>
                {selectedSuppliers.map((s) => (
                  <div
                    key={s.id}
                    className={`${
                      selectedSuppliers.length === 1
                        ? 'col-span-9'
                        : selectedSuppliers.length === 2
                        ? 'col-span-4'
                        : 'col-span-3'
                    } p-3.5 border-r border-[#e8e8e8] last:border-r-0`}
                  >
                    <span className="font-bold text-[#1c1b1b] block">
                      {s.monthlyCapacity || '150,000 Units/mo'}
                    </span>
                    <span className="text-[11px] text-[#594047] block mt-0.5">
                      🏢 {s.facilityArea || 'GMP Audited Facility'}
                    </span>
                  </div>
                ))}
                {selectedSuppliers.length === 2 && <div className="col-span-2 bg-[#fcf9f8]/40 border-r-0"></div>}
              </div>

              {/* SECTION 4: DIRECT CONNECT ACTIONS */}
              <div className="grid grid-cols-12 bg-[#fcf9f8] p-4 text-[12px]">
                <div className="col-span-3 font-bold text-[#1c1b1b] flex items-center border-r border-[#e8e8e8] pr-4">
                  Initiate B2B Negotiation
                </div>
                {selectedSuppliers.map((s) => (
                  <div
                    key={s.id}
                    className={`${
                      selectedSuppliers.length === 1
                        ? 'col-span-9'
                        : selectedSuppliers.length === 2
                        ? 'col-span-4'
                        : 'col-span-3'
                    } px-3 flex items-center gap-2`}
                  >
                    <button
                      onClick={() => onOpenEnquiry(s)}
                      className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white text-[11px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-98"
                    >
                      <Send className="w-3 h-3" />
                      <span>Contact</span>
                    </button>
                    <button
                      onClick={() => onCallSupplier(s.name)}
                      title="Direct Call"
                      className="p-2 bg-white hover:bg-[#f7f2f2] border border-[#e8e8e8] text-[#594047] rounded-lg transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onWhatsAppSupplier(s.name)}
                      title="WhatsApp Direct"
                      className="p-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {selectedSuppliers.length === 2 && <div className="col-span-2"></div>}
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-3.5 border-t border-[#e8e8e8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[12px] text-[#594047]">
            <CheckCircle2 className="w-4 h-4 text-[#00875a]" />
            <span>All manufacturing data verified via Nexora On-Site Facility Audits and GST/GMP registries.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="bg-[#f0e6eb] hover:bg-[#e4d6dd] text-[#1c1b1b] text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Close Comparison
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
