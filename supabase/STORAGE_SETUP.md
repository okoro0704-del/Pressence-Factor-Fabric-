# Supabase Storage Setup for Sovereign Vault

## Overview
The Sovereign Vault uses Supabase Storage to store encrypted documents. All documents are encrypted client-side before upload using AES-GCM 256-bit encryption.

---

## Step 1: Create Storage Bucket

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your PFF Protocol project
   - Click **Storage** in the left sidebar

2. **Create New Bucket**
   - Click **"New bucket"**
   - **Bucket name:** `sovereign-vault`
   - **Public bucket:** ❌ **NO** (Keep private)
   - **File size limit:** 10 MB (adjust as needed)
   - **Allowed MIME types:** Leave empty (we accept encrypted blobs)
   - Click **"Create bucket"**

---

## Step 2: Configure Bucket Policies

After creating the bucket, set up Row Level Security (RLS) policies:

### **Policy 1: Users can upload their own documents**

```sql
CREATE POLICY "Users can upload own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sovereign-vault' 
  AND (storage.foldername(name))[1] = auth.jwt()->>'phone'
);
```

### **Policy 2: Users can view their own documents**

```sql
CREATE POLICY "Users can view own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'sovereign-vault' 
  AND (storage.foldername(name))[1] = auth.jwt()->>'phone'
);
```

### **Policy 3: Users can update their own documents**

```sql
CREATE POLICY "Users can update own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'sovereign-vault' 
  AND (storage.foldername(name))[1] = auth.jwt()->>'phone'
);
```

### **Policy 4: Users can delete their own documents**

```sql
CREATE POLICY "Users can delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'sovereign-vault' 
  AND (storage.foldername(name))[1] = auth.jwt()->>'phone'
);
```

---

## Step 3: Verify Setup

Run this query in Supabase SQL Editor to verify the bucket exists:

```sql
SELECT * FROM storage.buckets WHERE name = 'sovereign-vault';
```

Expected output:
```
id              | name             | public | file_size_limit | allowed_mime_types
----------------|------------------|--------|-----------------|-------------------
sovereign-vault | sovereign-vault  | false  | 10485760        | null
```

---

## Step 4: Test Upload (Optional)

You can test the upload from the Supabase Dashboard:

1. Go to **Storage** → **sovereign-vault**
2. Click **"Upload file"**
3. Select a test file
4. Verify it appears in the bucket

---

## Folder Structure

Documents are organized by phone number and document type:

```
sovereign-vault/
├── +2348012345678/
│   ├── nin_result/
│   │   └── 1709049600000_nin_verification.pdf
│   ├── drivers_license/
│   │   └── 1709049700000_drivers_license.jpg
│   ├── utility_bill/
│   │   └── 1709049800000_utility_bill.pdf
│   └── international_passport/
│       └── 1709049900000_passport.jpg
└── +2348087654321/
    └── ...
```

---

## Security Notes

✅ **All files are encrypted client-side** before upload  
✅ **Bucket is private** (not publicly accessible)  
✅ **RLS policies** ensure users can only access their own documents  
✅ **Partner Ping API** provides controlled access for authorized partners  
✅ **Audit log** tracks all document access requests  

---

## Next Steps

After setting up the storage bucket:

1. ✅ Run the database migration: `supabase/migrations/20260227_sovereign_vault_documents.sql`
2. ✅ Test document upload from the Settings page
3. ✅ Verify encryption/decryption works correctly
4. ✅ Test Partner Ping API for document sharing

---

**Architect:** Isreal Okoro (mrfundzman)  
**Date:** 2026-02-27

