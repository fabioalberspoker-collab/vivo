-- Enable Row Level Security and create policies for contratos table

-- Enable RLS on contratos table
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

-- Enable RLS on filtros_personalizados table  
ALTER TABLE public.filtros_personalizados ENABLE ROW LEVEL SECURITY;

-- Create policies for contratos table (public read access for now)
CREATE POLICY "Allow public read access to contratos" 
ON public.contratos 
FOR SELECT 
USING (true);

-- Create policies for filtros_personalizados table (public access for now)
CREATE POLICY "Allow public read access to filtros_personalizados" 
ON public.filtros_personalizados 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to filtros_personalizados" 
ON public.filtros_personalizados 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to filtros_personalizados" 
ON public.filtros_personalizados 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to filtros_personalizados" 
ON public.filtros_personalizados 
FOR DELETE 
USING (true);