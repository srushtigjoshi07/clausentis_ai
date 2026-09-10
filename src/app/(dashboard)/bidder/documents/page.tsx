'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  UploadCloud, 
  Search, 
  FileCheck, 
  Building, 
  Award, 
  Receipt, 
  Briefcase, 
  Layers, 
  Trash2, 
  Download, 
  Loader2, 
  FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { 
  getBidderDocuments, 
  createBidderDocument, 
  deleteBidderDocument, 
  getBidderDocumentSignedUrl,
  BidderDocumentRow
} from '@/lib/actions/documents';

const VAULT_CATEGORIES = [
  { id: 'all', label: 'All Vault Documents', icon: Layers },
  { id: 'financial_statement', label: 'Audited Financials & CA', icon: Receipt },
  { id: 'experience_certificate', label: 'Work Orders & Completion', icon: Briefcase },
  { id: 'tax_document', label: 'GST, PAN & Tax Regs', icon: Building },
  { id: 'quality_certification', label: 'ISO & Quality Standards', icon: Award },
  { id: 'affidavit', label: 'Affidavits & Undertakings', icon: FileCheck },
];

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateStr));
  } catch {
    return 'Recent';
  }
}

export default function BidderDocumentVaultPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<BidderDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  // Upload modal / state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('financial_statement');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    try {
      const data = await getBidderDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getBidderDocuments().then((data) => {
      if (isMounted) {
        setDocuments(data || []);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size === 0) {
        setUploadError('Document appears to be empty (0 bytes).');
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
      if (!ext || !validExtensions.includes(ext)) {
        setUploadError('Please upload a supported document format (PDF, DOC, DOCX, PNG, JPG).');
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setUploadError('Document exceeds maximum size limit of 25MB.');
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be signed in to upload company documents.');
      }

      const fileExt = uploadFile.name.split('.').pop() || 'pdf';
      const storageFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${storageFileName}`;

      const { error: storageError } = await supabase.storage
        .from('bidder-documents')
        .upload(filePath, uploadFile);

      if (storageError) {
        throw new Error(storageError.message || 'Failed to upload document to secure storage.');
      }

      await createBidderDocument({
        file_name: uploadFile.name,
        document_type: uploadCategory,
        file_path: filePath,
        file_size_bytes: uploadFile.size,
      });

      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadDocuments();

    } catch (err: unknown) {
      console.error('Upload document error:', err);
      setUploadError(err instanceof Error ? err.message : 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (storagePath: string) => {
    try {
      const signedUrl = await getBidderDocumentSignedUrl(storagePath);
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      } else {
        alert('Could not generate download link.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to remove this document from the company vault?')) {
      return;
    }

    setActionLoadingId(docId);
    try {
      await deleteBidderDocument(docId);
      await loadDocuments();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'all' || doc.document_type === selectedCategory;
    const matchesSearch = 
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans bg-white">
      
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-6 pt-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold font-mono uppercase tracking-wider text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
            COMPANY VAULT
          </span>
          <span className="text-[#777777] text-xs">&bull;</span>
          <span className="text-[#555555] text-xs font-mono">Apex Heavy Engineering Pvt Ltd</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] mt-1">
          Company Document Vault
        </h1>
        <p className="text-xs sm:text-sm text-[#555555] mt-1">
          Manage statutory credentials, audited financials, and technical experience used for autonomous qualification checks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Category Filter Sidebar */}
        <div className="lg:col-span-3 rounded-xl border border-[#E5E5E5] bg-white p-3 space-y-1 shadow-xs">
          <div className="px-3 py-2 text-[10px] font-mono font-semibold text-[#777777] uppercase tracking-wider">
            Vault Domains
          </div>
          {VAULT_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count = cat.id === 'all' 
              ? documents.length 
              : documents.filter(d => d.document_type === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left w-full border ${
                  isSelected 
                    ? 'bg-[#111111] text-white border-[#111111] font-medium' 
                    : 'text-[#555555] bg-white hover:bg-[#F7F7F7] hover:text-[#111111] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
                  <span className="truncate">{cat.label}</span>
                </div>
                <span className={`text-xs font-mono ${isSelected ? 'text-white/80' : 'text-[#777777]'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 flex flex-col gap-5">
          
          {/* Upload Dropzone Box */}
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#E5E5E5]">
              <div>
                <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-[#111111] stroke-[1.5]" /> Upload Company Credential
                </h3>
                <p className="text-xs text-[#555555] mt-0.5">
                  Upload audited balance sheets, ISO certificates, GST certificates, or past work orders.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-mono font-semibold text-[#777777] block mb-1.5 uppercase tracking-wider">
                  Document Type
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  <option value="financial_statement">Audited Financials &amp; Turnover</option>
                  <option value="experience_certificate">Work Orders &amp; Past Experience</option>
                  <option value="tax_document">GST &amp; Tax Registration</option>
                  <option value="quality_certification">ISO &amp; Quality Certifications</option>
                  <option value="affidavit">Legal Undertakings &amp; Affidavits</option>
                  <option value="other">Other Credentials</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono font-semibold text-[#777777] block mb-1.5 uppercase tracking-wider">
                  Select File (PDF / DOCX)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelection}
                  accept=".pdf,.doc,.docx"
                  disabled={isUploading}
                  className="w-full text-xs text-[#555555] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[#111111] file:text-white file:cursor-pointer"
                />
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-[#111111] mt-2 font-mono bg-[#F7F7F7] border border-[#E5E5E5] p-2 rounded">{uploadError}</p>
            )}

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleUploadSubmit}
                disabled={!uploadFile || isUploading}
                size="sm"
                className="bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs h-8 px-4 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving to Vault...
                  </>
                ) : (
                  'Save to Vault'
                )}
              </Button>
            </div>
          </div>

          {/* Search & Vault Display Box */}
          <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-[#E5E5E5] bg-[#F7F7F7] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#777777] stroke-[1.5]" />
                <input
                  type="search"
                  placeholder="Search stored credentials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] placeholder:text-[#777777] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#E5E5E5] text-xs shrink-0">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded-md transition-colors text-xs ${
                    viewMode === 'cards'
                      ? 'bg-[#111111] text-white font-medium'
                      : 'text-[#555555] hover:text-[#111111]'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-md transition-colors text-xs ${
                    viewMode === 'table'
                      ? 'bg-[#111111] text-white font-medium'
                      : 'text-[#555555] hover:text-[#111111]'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-[#777777] text-xs flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#111111]" />
                <span>Loading vault credentials...</span>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="h-10 w-10 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#111111] mb-3">
                  <FolderOpen className="h-5 w-5 stroke-[1.5]" />
                </div>
                <h4 className="font-semibold text-sm text-[#111111]">Document Vault is empty</h4>
                <p className="text-xs text-[#555555] mt-1 max-w-sm">
                  No company documents stored yet in this category. Upload credentials above to enable autonomous eligibility evaluation.
                </p>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-[#E5E5E5] bg-white shadow-2xs hover:border-[#111111] transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="h-7 w-7 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
                          <FileText className="h-3.5 w-3.5 stroke-[1.5]" />
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] font-medium">
                          ✓ VERIFIED
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#111111] truncate" title={doc.file_name}>
                        {doc.file_name}
                      </h4>
                      <p className="text-[11px] text-[#555555] capitalize mt-0.5">
                        {(doc.document_type || 'Credential').replace('_', ' ')}
                      </p>
                      <p className="text-[10px] text-[#777777] font-mono mt-1.5">
                        {formatDate(doc.created_at)}
                      </p>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-[#E5E5E5] flex items-center justify-between">
                      {doc.file_path && (
                        <button
                          onClick={() => handleDownload(doc.file_path)}
                          className="text-xs font-medium text-[#111111] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={actionLoadingId === doc.id}
                        className="text-xs text-[#777777] hover:text-[#111111] transition-colors ml-auto cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="text-[10px] text-[#555555] uppercase tracking-wider bg-[#F7F7F7] border-b border-[#E5E5E5] font-mono">
                    <tr>
                      <th className="px-4 py-3">Document Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Uploaded</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {filteredDocs.map((doc) => {
                      const isDeleting = actionLoadingId === doc.id;
                      return (
                        <tr key={doc.id} className="hover:bg-[#F7F7F7] transition-colors">
                          <td className="px-4 py-3 font-medium text-[#111111] max-w-xs truncate flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-[#777777] shrink-0" />
                            <span className="truncate">{doc.file_name}</span>
                          </td>
                          <td className="px-4 py-3 text-[#555555] capitalize">
                            {(doc.document_type || 'other').replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 text-[#777777] font-mono text-[11px]">
                            {formatDate(doc.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111]">
                              ✓ VERIFIED
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {doc.file_path && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDownload(doc.file_path)}
                                  title="Download / View"
                                  className="h-7 w-7 text-[#555555] hover:text-[#111111]"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(doc.id)}
                                disabled={isDeleting}
                                title="Delete"
                                className="h-7 w-7 text-[#777777] hover:text-[#111111]"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
