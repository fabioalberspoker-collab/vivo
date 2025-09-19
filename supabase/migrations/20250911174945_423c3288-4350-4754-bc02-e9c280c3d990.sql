-- Ensure the contratos table exists with proper structure
-- This migration ensures the table is properly recognized by Supabase types

-- Update the contratos table to ensure it matches expected structure
-- The table already exists but let's ensure all constraints are proper

-- Add any missing constraints or indexes
DO $$
BEGIN
    -- Check if table exists and create if not
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contratos') THEN
        CREATE TABLE public.contratos (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            numero_contrato text NOT NULL,
            fornecedor text NOT NULL,
            tipo_contrato text,
            valor_contrato numeric NOT NULL,
            valor_pagamento numeric,
            status text,
            data_vencimento date NOT NULL,
            data_assinatura date,
            data_pagamento date,
            tipo_fluxo text NOT NULL,
            regiao text,
            estado text NOT NULL,
            municipio text,
            area_responsavel text,
            prioridade text,
            risco text,
            responsavel text
        );
    END IF;
    
    -- Ensure indexes exist for performance
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'contratos' AND indexname = 'idx_contratos_tipo_fluxo') THEN
        CREATE INDEX idx_contratos_tipo_fluxo ON public.contratos(tipo_fluxo);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'contratos' AND indexname = 'idx_contratos_regiao') THEN
        CREATE INDEX idx_contratos_regiao ON public.contratos(regiao);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'contratos' AND indexname = 'idx_contratos_estado') THEN
        CREATE INDEX idx_contratos_estado ON public.contratos(estado);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'contratos' AND indexname = 'idx_contratos_data_vencimento') THEN
        CREATE INDEX idx_contratos_data_vencimento ON public.contratos(data_vencimento);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'contratos' AND indexname = 'idx_contratos_status') THEN
        CREATE INDEX idx_contratos_status ON public.contratos(status);
    END IF;
END
$$;