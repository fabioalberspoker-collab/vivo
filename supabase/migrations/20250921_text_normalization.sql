-- Enable unaccent extension for text normalization
-- This allows us to search text without accents

-- Create the unaccent extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create a function to normalize text for search (remove accents and convert to lowercase)
CREATE OR REPLACE FUNCTION normalize_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(unaccent(input_text));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create indexes for normalized search on commonly filtered fields
CREATE INDEX IF NOT EXISTS idx_contracts_risco_normalized 
ON public.contracts USING gin(normalize_text(risco));

CREATE INDEX IF NOT EXISTS idx_contracts_prioridade_normalized 
ON public.contracts USING gin(normalize_text(prioridade));

CREATE INDEX IF NOT EXISTS idx_contracts_area_responsavel_normalized 
ON public.contracts USING gin(normalize_text(area_responsavel));

CREATE INDEX IF NOT EXISTS idx_contracts_status_normalized 
ON public.contracts USING gin(normalize_text(status));