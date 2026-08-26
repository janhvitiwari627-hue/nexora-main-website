import React, { useState } from 'react';
import { 
  CheckCircle2, 
  UploadCloud, 
  ShieldCheck, 
  FileText, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  Info,
  Download
} from 'lucide-react';
import { exportSupplierAuditVaultToCsv } from '../utils/exportCsv';

interface SupplierVerificationScreenProps {
  onBack: () => void;
}

export const SupplierVerificationScreen: React.FC<SupplierVerificationScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents'>('overview');
  
  // Mock statuses for the UI
  const [verificationStatus, setVerificationStatus] = useState({
    business: 'verified', // verified, pending, action_required
    gst: 'verified',
    iso: 'action_required',
    gmp: 'pending',
    fda: 'action_required',
    factory: 'action_required'
  });

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  
  // Track uploaded documents in session
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string, url: string, type: string, date: string }>>({});
  
  // Preview modal state
  const [previewDoc, setPreviewDoc] = useState<{ name: string, url: string, type: string } | null>(null);

  const handleUploadClick = (docName: string) => {
    setUploadingDoc(docName);
    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && uploadingDoc) {
      const file = e.target.files[0];
      const fileUrl = URL.createObjectURL(file);
      
      if (uploadingDoc === 'Bulk Archive') {
        // Simulate extracting ZIP and applying to missing documents
        setUploadedDocs(prev => ({
          ...prev,
          'ISO 9001:2015': { name: 'Extracted_ISO.pdf', url: fileUrl, type: 'application/pdf', date: 'Just now' },
          'GMP Certificate': { name: 'Extracted_GMP.pdf', url: fileUrl, type: 'application/pdf', date: 'Just now' },
          'US-FDA Registration': { name: 'Extracted_FDA.pdf', url: fileUrl, type: 'application/pdf', date: 'Just now' }
        }));
      } else {
        setUploadedDocs(prev => ({
          ...prev,
          [uploadingDoc]: {
            name: file.name,
            url: fileUrl,
            type: file.type,
            date: 'Just now'
          }
        }));
      }
      
      // Reset input
      e.target.value = '';
      setUploadingDoc(null);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#FCF9F8] pb-24">
      {/* Hidden File Input */}
      <input 
        type="file" 
        id="file-upload" 
        className="hidden" 
        accept=".pdf,.jpg,.jpeg,.png,.zip"
        onChange={handleFileChange}
      />
      {/* Notification Banner */}
      <div className="bg-[#E5F5EB] border-b border-[#008A27]/20 px-4 py-3 flex items-center justify-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-[#008A27]" />
        <span className="text-[13px] font-bold text-[#008A27]">Notification: Your ISO 9001:2015 certificate has been successfully verified!</span>
      </div>
      
      {/* Header */}
      <div className="bg-white border-b border-[#F0EDEC]">
        <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <button 
                onClick={onBack}
                className="text-[13px] text-[#594047] hover:text-[#B90064] font-medium flex items-center gap-1 mb-3 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to Dashboard
              </button>
              <h1 className="text-[28px] md:text-[32px] font-serif font-bold text-[#1C1B1B] leading-tight mb-2">
                Verification Center
              </h1>
              <p className="text-[14px] text-[#594047]">
                Manage your trust badges, upload compliance documents, and stand out to premium B2B buyers.
              </p>
            </div>
            
            {/* Top Level Status Card & Export Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="bg-[#FDF8F8] border border-[#E0BEC6] rounded-xl p-4 flex items-start gap-3 min-w-[240px]">
                <div className="w-10 h-10 rounded-full bg-[#B90064]/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#B90064]" />
                </div>
                <div>
                  <div className="text-[12px] text-[#594047] font-semibold uppercase tracking-wider mb-0.5">Overall Status</div>
                  <div className="text-[16px] font-bold text-[#1C1B1B]">Verified Supplier</div>
                  <div className="text-[12px] text-[#B90064] mt-1 font-medium">Rank Boost Active</div>
                </div>
              </div>

              <button
                onClick={() => {
                  const sampleDocs = [
                    { docName: 'GST Registration Certificate', docType: 'GSTIN License', regNumber: '27AABCA1234A1Z5', issuingAuthority: 'Govt of India (GST Portal)', status: 'Verified', uploadDate: '2026-01-10', expiryDate: 'Permanent' },
                    { docName: 'ISO 22716 Cosmetics GMP', docType: 'ISO Certification', regNumber: 'ISO-22716-2025-IND', issuingAuthority: 'TÜV SÜD South Asia', status: 'Verified', uploadDate: '2025-11-20', expiryDate: '2028-11-19' },
                    { docName: 'US-FDA Establishment Identifier (FEI)', docType: 'US-FDA Registration', regNumber: 'FEI-3018294021', issuingAuthority: 'U.S. Food and Drug Administration', status: 'Verified', uploadDate: '2026-02-01', expiryDate: '2027-12-31' },
                    { docName: 'Factory License & Pollution Board NOC', docType: 'Industrial License', regNumber: 'FAC-MH-2024-88', issuingAuthority: 'Maharashtra Pollution Control Board', status: 'Verified', uploadDate: '2025-06-15', expiryDate: '2029-06-14' },
                    ...Object.entries(uploadedDocs).map(([key, val]) => ({
                      docName: key,
                      docType: 'Uploaded Certificate',
                      regNumber: 'REG-PENDING',
                      issuingAuthority: 'Self-Uploaded Audit Vault',
                      status: 'Under Review',
                      uploadDate: (val as any)?.date || 'Just now',
                      expiryDate: 'TBD'
                    }))
                  ];
                  exportSupplierAuditVaultToCsv(sampleDocs);
                }}
                className="bg-white border border-[#E0BEC6] hover:border-[#B90064] text-[#1C1B1B] hover:text-[#B90064] text-[13px] font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#B90064]" />
                <span>Export Audit Vault CSV</span>
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-6 mt-8 border-b border-[#F0EDEC]">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-[14px] font-semibold transition-colors relative ${activeTab === 'overview' ? 'text-[#B90064]' : 'text-[#594047] hover:text-[#1C1B1B]'}`}
            >
              Overview & Badges
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#B90064] rounded-t-full" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`pb-3 text-[14px] font-semibold transition-colors relative ${activeTab === 'documents' ? 'text-[#B90064]' : 'text-[#594047] hover:text-[#1C1B1B]'}`}
            >
              Document Uploads
              {activeTab === 'documents' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#B90064] rounded-t-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-8 mt-8">
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Trust Badges */}
            <div className="bg-white border border-[#E8DFE3] rounded-2xl p-6">
              <h2 className="text-[18px] font-bold text-[#1C1B1B] mb-1">Your Trust Badges</h2>
              <p className="text-[13px] text-[#594047] mb-6">Badges visible to buyers on your profile and listings.</p>
              
              <div className="space-y-4">
                {/* Badge Item: Verified Business */}
                <div className="flex items-center justify-between p-4 border border-[#E8DFE3] rounded-xl bg-[#FDF8F8]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#B90064] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#1C1B1B]">Business Verified</div>
                      <div className="text-[12px] text-[#594047]">Core identity & GST confirmed</div>
                    </div>
                  </div>
                  <div className="text-[12px] font-bold text-[#008A27] bg-[#E5F5EB] px-2.5 py-1 rounded-full">
                    Active
                  </div>
                </div>

                {/* Badge Item: Quality Certified */}
                <div className="flex items-center justify-between p-4 border border-[#E8DFE3] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${uploadedDocs['ISO 9001:2015'] ? 'bg-[#FFF4E5]' : 'bg-[#F0EDEC]'}`}>
                      <ShieldCheck className={`w-4 h-4 ${uploadedDocs['ISO 9001:2015'] ? 'text-[#D97706]' : 'text-[#8D8087]'}`} />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#1C1B1B]">Quality Certified</div>
                      <div className="text-[12px] text-[#594047]">ISO / GMP credentials</div>
                    </div>
                  </div>
                  {uploadedDocs['ISO 9001:2015'] ? (
                     <div className="text-[12px] font-bold text-[#D97706] bg-[#FFF4E5] px-2.5 py-1 rounded-full">
                       Under Review
                     </div>
                  ) : (
                    <div className="text-[12px] font-bold text-[#594047] bg-[#F0EDEC] px-2.5 py-1 rounded-full cursor-pointer hover:bg-[#E8DFE3] transition-colors" onClick={() => setActiveTab('documents')}>
                      Upload Required
                    </div>
                  )}
                </div>

                {/* Badge Item: Export Ready */}
                <div className="flex items-center justify-between p-4 border border-[#E8DFE3] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${uploadedDocs['US-FDA Registration'] ? 'bg-[#FFF4E5]' : 'bg-[#F0EDEC]'}`}>
                      <ShieldCheck className={`w-4 h-4 ${uploadedDocs['US-FDA Registration'] ? 'text-[#D97706]' : 'text-[#8D8087]'}`} />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#1C1B1B]">Export Ready</div>
                      <div className="text-[12px] text-[#594047]">US-FDA / EU registered</div>
                    </div>
                  </div>
                  {uploadedDocs['US-FDA Registration'] ? (
                     <div className="text-[12px] font-bold text-[#D97706] bg-[#FFF4E5] px-2.5 py-1 rounded-full">
                       Under Review
                     </div>
                  ) : (
                    <div className="text-[12px] font-bold text-[#594047] bg-[#F0EDEC] px-2.5 py-1 rounded-full cursor-pointer hover:bg-[#E8DFE3] transition-colors" onClick={() => setActiveTab('documents')}>
                      Upload Required
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Why Verify */}
            <div className="bg-[#FFF7FA] border border-[#E0BEC6] rounded-2xl p-6">
              <h2 className="text-[18px] font-bold text-[#500037] mb-4">Why Complete Verification?</h2>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#B90064] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[14px] font-bold text-[#1C1B1B]">3x More Buyer Enquiries</div>
                    <div className="text-[13px] text-[#594047] mt-0.5">Verified suppliers receive significantly more sourcing requests from premium buyers.</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#B90064] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[14px] font-bold text-[#1C1B1B]">Higher Search Ranking</div>
                    <div className="text-[13px] text-[#594047] mt-0.5">Your products and profile will appear above unverified competitors in global search.</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#B90064] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[14px] font-bold text-[#1C1B1B]">Exclusive RFQ Access</div>
                    <div className="text-[13px] text-[#594047] mt-0.5">Only fully verified suppliers can quote on high-value, restricted buyer RFQs.</div>
                  </div>
                </li>
              </ul>
              
              <button 
                onClick={() => setActiveTab('documents')}
                className="w-full mt-6 bg-[#B90064] hover:bg-[#A00056] text-white text-[14px] font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Upload Documents Now
              </button>
            </div>
            
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white border border-[#E8DFE3] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[#E8DFE3] bg-[#FDF8F8] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold text-[#1C1B1B]">Document Submission</h2>
                <p className="text-[13px] text-[#594047] mt-1">Upload clear, legible copies of your certificates. PDFs or high-res JPEGs preferred.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleUploadClick('Bulk Archive')}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E8DFE3] rounded-lg text-[13px] font-bold text-[#1C1B1B] hover:bg-[#F0EDEC] transition-colors"
                >
                  <UploadCloud className="w-4 h-4" />
                  Bulk Upload (.ZIP)
                </button>
                <button 
                  onClick={() => {
                    // Simulate export
                    const link = document.createElement('a');
                    link.href = '#';
                    link.download = 'Nexora_Audit_Vault_AuraLabs.zip';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-[#FDF8F8] border border-[#B90064] rounded-lg text-[13px] font-bold text-[#B90064] hover:bg-[#FDE7F3] transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Export Audit Vault
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-[#E8DFE3]">
              
              {/* Document 1: GST */}
              <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-[#1C1B1B]">GST Certificate</h3>
                    <span className="bg-[#E5F5EB] text-[#008A27] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Verified</span>
                  </div>
                  <p className="text-[13px] text-[#594047]">Required for core business identity verification in India.</p>
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[12px] text-[#594047]">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#B90064]" />
                      GST_Certificate_AuraBeauty.pdf
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-[#D97706]">
                      <Clock className="w-3.5 h-3.5" />
                      Expires: Mar 31, 2025
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <button 
                    onClick={() => handleUploadClick('GST Certificate')}
                    className="px-4 py-2 border border-[#E8DFE3] text-[#1C1B1B] text-[13px] font-semibold rounded-lg hover:bg-[#F0EDEC] transition-colors"
                  >
                    Renew / Update
                  </button>
                </div>
              </div>

              {/* Document 2: ISO */}
              <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-[#1C1B1B]">ISO 9001:2015</h3>
                    {uploadedDocs['ISO 9001:2015'] ? (
                      <span className="bg-[#FFF4E5] text-[#D97706] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Under Review</span>
                    ) : (
                      <span className="bg-[#FDE7F3] text-[#B90064] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Required</span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#594047]">Proves your Quality Management System standards.</p>
                  {uploadedDocs['ISO 9001:2015'] && (
                    <div className="mt-2 flex items-center gap-2 text-[12px] text-[#594047]">
                      <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                      {uploadedDocs['ISO 9001:2015'].name} ({uploadedDocs['ISO 9001:2015'].date})
                    </div>
                  )}
                </div>
                <div className="shrink-0 w-full md:w-auto flex items-center gap-3">
                  {uploadedDocs['ISO 9001:2015'] ? (
                    <>
                      <button 
                        onClick={() => setPreviewDoc(uploadedDocs['ISO 9001:2015'])}
                        className="px-4 py-2 border border-[#E8DFE3] text-[#1C1B1B] text-[13px] font-semibold rounded-lg hover:bg-[#F0EDEC] transition-colors"
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => handleUploadClick('ISO 9001:2015')}
                        className="px-4 py-2 border border-[#E8DFE3] text-[#1C1B1B] text-[13px] font-semibold rounded-lg hover:bg-[#F0EDEC] transition-colors"
                      >
                        Update
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleUploadClick('ISO 9001:2015')}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#B90064] hover:bg-[#A00056] text-white text-[13px] font-bold rounded-lg transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Upload PDF/JPG
                    </button>
                  )}
                </div>
              </div>

              {/* Document 3: GMP */}
              <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-[#1C1B1B]">GMP Certificate</h3>
                    <span className="bg-[#FFF4E5] text-[#D97706] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Pending Review</span>
                  </div>
                  <p className="text-[13px] text-[#594047]">Good Manufacturing Practices certification.</p>
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-[#594047]">
                    <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                    GMP_Cert_2024.pdf (Uploaded 2 days ago)
                  </div>
                </div>
                <div className="shrink-0">
                  <button className="px-4 py-2 border border-[#E8DFE3] text-[#1C1B1B] text-[13px] font-semibold rounded-lg hover:bg-[#F0EDEC] transition-colors" disabled>
                    In Review
                  </button>
                </div>
              </div>

              {/* Document 4: US-FDA */}
              <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-[#1C1B1B]">US-FDA Registration</h3>
                    {uploadedDocs['US-FDA Registration'] ? (
                      <span className="bg-[#FFF4E5] text-[#D97706] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Under Review</span>
                    ) : (
                      <span className="bg-[#F0EDEC] text-[#594047] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Optional</span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#594047]">Boosts trust for international export buyers.</p>
                  {uploadedDocs['US-FDA Registration'] && (
                    <div className="mt-2 flex items-center gap-2 text-[12px] text-[#594047]">
                      <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                      {uploadedDocs['US-FDA Registration'].name} ({uploadedDocs['US-FDA Registration'].date})
                    </div>
                  )}
                </div>
                <div className="shrink-0 w-full md:w-auto flex items-center gap-3">
                  {uploadedDocs['US-FDA Registration'] ? (
                    <>
                      <button 
                        onClick={() => setPreviewDoc(uploadedDocs['US-FDA Registration'])}
                        className="px-4 py-2 border border-[#E8DFE3] text-[#1C1B1B] text-[13px] font-semibold rounded-lg hover:bg-[#F0EDEC] transition-colors"
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => handleUploadClick('US-FDA Registration')}
                        className="px-4 py-2 border border-[#E8DFE3] text-[#1C1B1B] text-[13px] font-semibold rounded-lg hover:bg-[#F0EDEC] transition-colors"
                      >
                        Update
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleUploadClick('US-FDA Registration')}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-[#B90064] text-[#B90064] hover:bg-[#FDF8F8] text-[13px] font-bold rounded-lg transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Upload Document
                    </button>
                  )}
                </div>
              </div>

            </div>
            
            {/* Info Footer */}
            <div className="p-5 bg-[#F0EDEC] flex items-start gap-3">
              <Info className="w-5 h-5 text-[#594047] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#594047] leading-relaxed">
                Verification processing typically takes 24-48 business hours. Ensure all uploaded documents are clearly legible and valid. Expired documents will result in badge removal.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-[#1C1B1B]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[800px] h-[95vh] md:h-auto md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-[#F0EDEC]">
              <h3 className="text-[15px] md:text-[16px] font-bold text-[#1C1B1B] truncate pr-4">{previewDoc.name}</h3>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="text-[#594047] hover:text-[#B90064] text-[13px] md:text-[14px] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#FDF8F8] transition-colors shrink-0"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-[#F0EDEC] flex items-center justify-center p-2 md:p-4 min-h-[300px] md:min-h-[400px]">
              {previewDoc.type.startsWith('image/') ? (
                <img 
                  src={previewDoc.url} 
                  alt="Document Preview" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                />
              ) : previewDoc.type === 'application/pdf' ? (
                <iframe 
                  src={previewDoc.url} 
                  className="w-full h-full min-h-[60vh] rounded-lg shadow-sm bg-white"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-[#594047] p-8 text-center">
                  <FileText className="w-10 h-10 md:w-12 md:h-12 text-[#B90064]" />
                  <p className="text-[13px] md:text-[14px] font-medium">Preview not available for this file type.</p>
                  <p className="text-[12px]">You can still submit it for review.</p>
                </div>
              )}
            </div>
            <div className="p-3 md:p-4 border-t border-[#F0EDEC] flex justify-end gap-3 bg-white">
              <button 
                onClick={() => setPreviewDoc(null)}
                className="w-full md:w-auto px-5 py-2.5 md:py-2 bg-[#B90064] text-white text-[14px] font-bold rounded-lg hover:bg-[#A00056] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
