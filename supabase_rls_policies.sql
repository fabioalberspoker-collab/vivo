-- Políticas RLS para permitir inserção na tabela reader
-- Execute estes comandos no editor SQL do Supabase

-- 1. Verificar se RLS está habilitado (deve estar)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'reader';

-- 2. Criar política para permitir inserção de contratos
-- Esta política permite que qualquer usuário autenticado insira dados
CREATE POLICY "Allow authenticated insert on reader" ON reader
FOR INSERT WITH CHECK (true);

-- 3. Criar política para permitir leitura de contratos
CREATE POLICY "Allow authenticated select on reader" ON reader
FOR SELECT USING (true);

-- 4. Criar política para permitir atualização (caso necessário no futuro)
CREATE POLICY "Allow authenticated update on reader" ON reader
FOR UPDATE USING (true) WITH CHECK (true);

-- 5. Verificar se as políticas foram criadas
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'reader';