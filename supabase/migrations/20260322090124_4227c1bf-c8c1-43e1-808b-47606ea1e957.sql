
-- Create storage bucket for council documents
INSERT INTO storage.buckets (id, name, public) VALUES ('council-documents', 'council-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Councillors can upload documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'council-documents');

-- Allow anyone to read/download
CREATE POLICY "Anyone can download documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'council-documents');
