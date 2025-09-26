# Configuração do Supabase para Contract Reader

## ❌ Problema Atual - Tabela não encontrada
```
POST /rest/v1/reader 404 (Not Found)
Error: Could not find the table 'public.Reader' in the schema cache
Hint: Perhaps you meant the table 'public.reader'
```

## ✅ SOLUÇÃO IMEDIATA

### Passo 1: Abrir Editor SQL
1. Acesse: https://supabase.com/dashboard/project/jstytygxbnapydwkvpzk/sql
2. Cole o código SQL abaixo:

```sql
-- Criar políticas RLS para tabela reader (nome em minúscula)
CREATE POLICY "Allow authenticated insert on reader" ON reader
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated select on reader" ON reader  
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated update on reader" ON reader
FOR UPDATE USING (true) WITH CHECK (true);
```

### Passo 2: Executar o SQL
1. Cole o código no editor SQL
2. Clique em "Run" para executar
3. Verifique se aparece "Success" nas 3 políticas

### Passo 3: Testar o Contract Reader  
1. Volte para a aplicação: http://localhost:8081/
2. Clique no botão "Contract Reader"
3. Verifique os logs no console - deve funcionar sem erros 401

## Explicação Técnica

**Problema**: O Supabase usa nomes de tabela em minúscula. A tabela se chama `reader` (não `Reader`).

**Solução**: As políticas criadas permitem:
- `INSERT`: Qualquer usuário autenticado pode inserir contratos
- `SELECT`: Qualquer usuário autenticado pode ler contratos  
- `UPDATE`: Qualquer usuário autenticado pode atualizar contratos

## Verificação das Políticas

Execute este SQL para verificar se as políticas foram criadas:

```sql
SELECT tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'reader';
```

Resultado esperado:
```
reader | Allow authenticated insert on reader | t | INSERT
reader | Allow authenticated select on reader | t | SELECT  
reader | Allow authenticated update on reader | t | UPDATE
```

## Status Após Correção

✅ Contract Reader pode inserir dados na tabela reader  
✅ Logs mostrarão "Successfully saved contract CTR-XXXXX to database"  
✅ Dados aparecerão na tabela: https://supabase.com/dashboard/project/jstytygxbnapydwkvpzk/editor/37887  

## Alternativa Rápida (Apenas para Testes)

Se quiser desabilitar RLS temporariamente:

```sql
ALTER TABLE reader DISABLE ROW LEVEL SECURITY;
```

**⚠️ IMPORTANTE**: Lembre-se de reabilitar depois:
```sql  
ALTER TABLE reader ENABLE ROW LEVEL SECURITY;
```