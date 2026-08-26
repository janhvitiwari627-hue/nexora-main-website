// ============================================================================
// NEXORA LUXE - PRODUCTION CSV DATA EXPORT UTILITY
// ============================================================================

/**
 * Converts an array of objects to CSV format and initiates a browser file download
 * @param filename File name (e.g., "Buyer_Enquiry_Log_2026.csv")
 * @param headers Array of header mapping objects { label: string, key: string }
 * @param data Array of records to export
 */
export function exportToCsv<T extends Record<string, any>>(
  filename: string,
  headers: Array<{ label: string; key: keyof T | string }>,
  data: T[]
): void {
  if (!data || data.length === 0) {
    alert('No records available to export.');
    return;
  }

  // 1. Generate Header Row
  const headerRow = headers.map((h) => `"${escapeCsvValue(h.label)}"`).join(',');

  // 2. Generate Data Rows
  const dataRows = data.map((item) => {
    return headers
      .map((h) => {
        let val: any = item[h.key];
        if (val === undefined || val === null) {
          val = '';
        } else if (typeof val === 'object') {
          val = JSON.stringify(val);
        } else {
          val = String(val);
        }
        return `"${escapeCsvValue(val)}"`;
      })
      .join(',');
  });

  // 3. Combine into full CSV string with UTF-8 BOM for Excel compatibility
  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');

  // 4. Create Blob and Trigger Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string): string {
  return value.replace(/"/g, '""');
}

/**
 * Formats Buyer Enquiry Log items into CSV export
 */
export function exportBuyerEnquiriesToCsv(enquiries: any[]): void {
  const headers = [
    { label: 'RFQ ID', key: 'id' },
    { label: 'Requirement Title', key: 'title' },
    { label: 'Supplier Name', key: 'supplier' },
    { label: 'Category', key: 'category' },
    { label: 'Quantity Required', key: 'quantity' },
    { label: 'Target Budget', key: 'budget' },
    { label: 'Status', key: 'status' },
    { label: 'Date Posted', key: 'date' },
    { label: 'Quoted Price', key: 'quotedPrice' },
    { label: 'Location', key: 'location' }
  ];

  const formattedData = enquiries.map((e) => ({
    id: e.id || e.rfqReference || 'RFQ-2026',
    title: e.title || e.productTitle || e.requirement_title || 'Sourcing Requirement',
    supplier: e.supplier || e.supplierName || 'Verified Supplier',
    category: e.category || 'Beauty Sourcing',
    quantity: e.quantity || `${e.quantity_required || 1000} ${e.quantity_unit || 'Units'}`,
    budget: e.budget || e.target_budget || 'N/A',
    status: (e.status || 'new').toUpperCase(),
    date: e.date || e.created_at || new Date().toISOString().split('T')[0],
    quotedPrice: e.quotedPrice || e.unit_price ? `₹${e.quotedPrice || e.unit_price}` : 'Pending Quote',
    location: e.location || e.delivery_location || 'Pan-India'
  }));

  const filename = `Nexora_Buyer_Enquiry_Log_${new Date().toISOString().split('T')[0]}.csv`;
  exportToCsv(filename, headers, formattedData);
}

/**
 * Formats Supplier Audit & Verification Vault records into CSV export
 */
export function exportSupplierAuditVaultToCsv(vaultRecords: any[]): void {
  const headers = [
    { label: 'Document Name', key: 'docName' },
    { label: 'Document Type', key: 'docType' },
    { label: 'Certificate / Registration No.', key: 'regNumber' },
    { label: 'Issuing Authority', key: 'issuingAuthority' },
    { label: 'Verification Status', key: 'status' },
    { label: 'Uploaded Date', key: 'uploadDate' },
    { label: 'Expiry Date', key: 'expiryDate' },
    { label: 'Compliance Level', key: 'complianceLevel' }
  ];

  const formattedData = vaultRecords.map((r) => ({
    docName: r.name || r.docName || 'Compliance Document',
    docType: r.type || r.docType || 'Business License',
    regNumber: r.number || r.regNumber || 'REG-2026-X99',
    issuingAuthority: r.authority || r.issuingAuthority || 'Govt of India / ISO',
    status: (r.status || 'verified').toUpperCase(),
    uploadDate: r.uploadDate || '2026-01-15',
    expiryDate: r.expiryDate || '2028-12-31',
    complianceLevel: r.level || 'Class A Verified'
  }));

  const filename = `Nexora_Supplier_Audit_Vault_${new Date().toISOString().split('T')[0]}.csv`;
  exportToCsv(filename, headers, formattedData);
}
