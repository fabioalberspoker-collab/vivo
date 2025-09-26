-- Increase numeric precision for reader table to handle larger contract values
-- Change from NUMERIC(5,2) to NUMERIC(15,2) to support values up to 999,999,999,999.99

-- Update multa column to support larger penalty values
ALTER TABLE public.reader 
ALTER COLUMN multa TYPE NUMERIC(15,2);

-- Update valor_contrato column to support larger contract values
ALTER TABLE public.reader 
ALTER COLUMN valor_contrato TYPE NUMERIC(15,2);

-- Update valor_pagamento column to support larger payment values
ALTER TABLE public.reader 
ALTER COLUMN valor_pagamento TYPE NUMERIC(15,2);

-- Add comment explaining the precision change
COMMENT ON COLUMN public.reader.multa IS 'Penalty amount in Brazilian Reais - supports up to 999 billion with 2 decimal places';
COMMENT ON COLUMN public.reader.valor_contrato IS 'Total contract value in Brazilian Reais - supports up to 999 billion with 2 decimal places';
COMMENT ON COLUMN public.reader.valor_pagamento IS 'Payment amount per installment in Brazilian Reais - supports up to 999 billion with 2 decimal places';