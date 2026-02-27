'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, Lock, AlertCircle, Download } from 'lucide-react';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { encryptFile, getUserEncryptionKey, decryptFile } from '@/lib/encryption';
import { getSupabase } from '@/lib/supabase';

const GOLD = '#D4AF37';
const GRAY = '#6b6b70';

type DocumentType = 'nin_result' | 'drivers_license' | 'utility_bill' | 'international_passport';

interface Document {
  type: DocumentType;
  label: string;
  description: string;
  uploaded: boolean;
  uploadedAt?: string;
  fileName?: string;
  fileSize?: number;
  encryptedUrl?: string;
  iv?: string;
}

const DOCUMENT_TYPES: Document[] = [
  {
    type: 'nin_result',
    label: 'NIN Verification Result',
    description: 'Official NIN verification document from NIMC',
    uploaded: false,
  },
  {
    type: 'drivers_license',
    label: "Driver's License",
    description: 'Valid Nigerian driver\'s license',
    uploaded: false,
  },
  {
    type: 'utility_bill',
    label: 'Utility Bill',
    description: 'Recent utility bill (electricity, water, or gas)',
    uploaded: false,
  },
  {
    type: 'international_passport',
    label: 'International Passport',
    description: 'Valid international passport',
    uploaded: false,
  },
];

/**
 * Sovereign Vault - Encrypted Document Storage
 * 
 * Features:
 * - Client-side encryption before upload
 * - Supabase Storage integration
 * - Partner Ping Logic for selective document sharing
 * - AES-GCM 256-bit encryption
 */
export function SovereignVault() {
  const [documents, setDocuments] = useState<Document[]>(DOCUMENT_TYPES);
  const [uploading, setUploading] = useState<DocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    const identityPhone = getIdentityAnchorPhone();
    setPhone(identityPhone);
    
    if (identityPhone) {
      loadDocuments(identityPhone);
    }
  }, []);

  const loadDocuments = async (phoneNumber: string) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data, error } = await (supabase as any)
        .from('sovereign_vault_documents')
        .select('*')
        .eq('phone_number', phoneNumber);

      if (error) throw error;

      if (data && data.length > 0) {
        setDocuments(prev => prev.map(doc => {
          const uploaded = data.find((d: any) => d.document_type === doc.type);
          if (uploaded) {
            return {
              ...doc,
              uploaded: true,
              uploadedAt: uploaded.uploaded_at,
              fileName: uploaded.file_name,
              fileSize: uploaded.file_size,
              encryptedUrl: uploaded.encrypted_url,
              iv: uploaded.iv,
            };
          }
          return doc;
        }));
      }
    } catch (err) {
      console.error('[Sovereign Vault] Error loading documents:', err);
    }
  };

  const handleFileUpload = async (type: DocumentType, file: File) => {
    if (!phone) {
      setError('Identity anchor required. Please log in first.');
      return;
    }

    setUploading(type);
    setError(null);

    try {
      // Get user's encryption key
      const encryptionKey = await getUserEncryptionKey(phone);

      // Encrypt the file
      const { encryptedData, iv } = await encryptFile(file, encryptionKey);

      // Upload to Supabase Storage
      const supabase = getSupabase();
      if (!supabase) throw new Error('Supabase not initialized');

      const fileName = `${phone}/${type}/${Date.now()}_${file.name}`;
      
      // Convert base64 to blob for upload
      const encryptedBlob = new Blob([atob(encryptedData)], { type: 'application/octet-stream' });

      const { data: uploadData, error: uploadError } = await (supabase as any)
        .storage
        .from('sovereign-vault')
        .upload(fileName, encryptedBlob);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await (supabase as any)
        .from('sovereign_vault_documents')
        .upsert({
          phone_number: phone,
          document_type: type,
          file_name: file.name,
          file_size: file.size,
          encrypted_url: uploadData.path,
          iv: iv,
          uploaded_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      // Update UI
      setDocuments(prev => prev.map(doc => 
        doc.type === type
          ? { ...doc, uploaded: true, uploadedAt: new Date().toISOString(), fileName: file.name, fileSize: file.size }
          : doc
      ));

      setUploading(null);
    } catch (err) {
      console.error('[Sovereign Vault] Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(212, 175, 55, 0.2)' }}
        >
          <Lock className="w-6 h-6" style={{ color: GOLD }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: GOLD }}>
            Sovereign Vault
          </h2>
          <p className="text-sm" style={{ color: GRAY }}>
            Encrypted document storage with end-to-end encryption
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg border border-red-500/50 bg-red-500/10 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Document List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.type}
            document={doc}
            uploading={uploading === doc.type}
            onUpload={(file) => handleFileUpload(doc.type, file)}
          />
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 rounded-lg border border-[#2a2a2e] bg-[#16161a]">
        <div className="flex items-start gap-2">
          <Lock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: GOLD }} />
          <div>
            <h3 className="text-sm font-bold mb-1" style={{ color: GOLD }}>
              End-to-End Encryption
            </h3>
            <p className="text-xs" style={{ color: GRAY }}>
              All documents are encrypted in your browser using AES-GCM 256-bit encryption before upload.
              Only you (and authorized partners via Partner Ping) can decrypt and access these documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DOCUMENT CARD COMPONENT
// ============================================================================

interface DocumentCardProps {
  document: Document;
  uploading: boolean;
  onUpload: (file: File) => void;
}

function DocumentCard({ document, uploading, onUpload }: DocumentCardProps) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div
      className="p-4 rounded-lg border transition-all"
      style={{
        borderColor: document.uploaded ? 'rgba(34, 197, 94, 0.4)' : '#2a2a2e',
        background: document.uploaded ? 'rgba(34, 197, 94, 0.05)' : '#16161a',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: document.uploaded ? 'rgba(34, 197, 94, 0.2)' : 'rgba(212, 175, 55, 0.2)',
          }}
        >
          {document.uploaded ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <FileText className="w-5 h-5" style={{ color: GOLD }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold mb-1" style={{ color: document.uploaded ? '#22c55e' : GOLD }}>
            {document.label}
          </h3>
          <p className="text-xs mb-2" style={{ color: GRAY }}>
            {document.description}
          </p>

          {document.uploaded ? (
            <div className="text-xs" style={{ color: GRAY }}>
              <p>Uploaded: {new Date(document.uploadedAt!).toLocaleDateString()}</p>
              <p>File: {document.fileName}</p>
            </div>
          ) : (
            <label className="inline-block">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50"
                style={{
                  background: uploading ? '#2a2a2e' : GOLD,
                  color: uploading ? GRAY : '#050505',
                }}
              >
                {uploading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3" />
                    Upload
                  </>
                )}
              </span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

