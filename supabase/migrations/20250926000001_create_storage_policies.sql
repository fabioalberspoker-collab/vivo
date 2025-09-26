-- Storage policies for documentos bucket
-- This migration creates the necessary RLS policies for the storage bucket

-- First, ensure the bucket exists (if it doesn't already)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT (read access) to documentos bucket
CREATE POLICY "Allow public read access to documentos bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documentos');

-- Policy for INSERT (upload access) to documentos bucket
CREATE POLICY "Allow public upload to documentos bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documentos');

-- Policy for UPDATE to documentos bucket
CREATE POLICY "Allow public update in documentos bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'documentos')
WITH CHECK (bucket_id = 'documentos');

-- Policy for DELETE from documentos bucket
CREATE POLICY "Allow public delete from documentos bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'documentos');

-- Ensure the bucket has proper permissions
UPDATE storage.buckets 
SET 
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
WHERE id = 'documentos';