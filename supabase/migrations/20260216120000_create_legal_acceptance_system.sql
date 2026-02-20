-- Create legal_documents table
CREATE TYPE legal_document_type AS ENUM ('TERMS', 'PRIVACY', 'DATA_POLICY', 'SUBSCRIPTION');

CREATE TABLE legal_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type legal_document_type NOT NULL,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown content
  is_active BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create legal_acceptances table
CREATE TYPE legal_acceptance_source AS ENUM ('REGISTER', 'LOGIN_UPDATE', 'SUBSCRIPTION');

CREATE TABLE legal_acceptances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  document_type legal_document_type NOT NULL,
  document_version TEXT NOT NULL,
  accepted_source legal_acceptance_source NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_legal_documents_type_active ON legal_documents(document_type, is_active);
CREATE INDEX idx_legal_acceptances_user_doc ON legal_acceptances(user_id, document_type, document_version);

-- RLS Policies
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_acceptances ENABLE ROW LEVEL SECURITY;

-- Documents are public to read
CREATE POLICY "Public can view active documents" ON legal_documents
  FOR SELECT USING (true);

-- Only admins can manage documents (assuming generic service role or specific admin check)
-- For now, allowing service role fully.

-- Acceptances: Users can view their own
CREATE POLICY "Users can view own acceptances" ON legal_acceptances
  FOR SELECT USING (auth.uid() = user_id);

-- Acceptances: Users can insert their own (validated by backend usually, but for direct insert: )
-- We will use a function for insertion to capture IP, but allow RLS just in case.
CREATE POLICY "Users can insert own acceptances" ON legal_acceptances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Initial Data (Example)
INSERT INTO legal_documents (document_type, version, title, content, is_active, published_at)
VALUES 
  ('TERMS', '1.0', 'Términos y Condiciones', 'Contenido de los términos y condiciones...', true, NOW()),
  ('PRIVACY', '1.0', 'Política de Privacidad', 'Contenido de la política de privacidad...', true, NOW()),
  ('DATA_POLICY', '1.0', 'Política de Tratamiento de Datos', 'Contenido de política de datos...', true, NOW());
