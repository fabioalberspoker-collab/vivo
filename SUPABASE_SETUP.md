# Configuração do Supabase para Contract Reader

## Problema Identificado
O Contract Reader está tentando acessar o bucket "documentos" mas está encontrando problemas de permissões RLS (Row Level Security).

## Soluções

### 1. Verificar se o bucket está público
1. Vá para: https://supabase.com/dashboard/project/jstytygxbnapydwkvpzk/storage/buckets/documentos
2. Clique no bucket "documentos"
3. Verifique se está marcado como "Public bucket"
4. Se não estiver, marque como público

### 2. Configurar políticas RLS para Storage
Se o bucket não for público, você precisa criar políticas RLS:

```sql
-- Política para permitir leitura de arquivos no bucket documentos
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'documentos');

-- Política para permitir upload de arquivos no bucket documentos  
CREATE POLICY "Allow public upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documentos');
```

### 3. Desabilitar RLS temporariamente (para testes)
**⚠️ Apenas para desenvolvimento/testes:**

1. Vá para: https://supabase.com/dashboard/project/jstytygxbnapydwkvpzk/editor
2. Execute este comando SQL:

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**⚠️ Lembre-se de reabilitar depois:**
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### 4. Verificar configuração do cliente Supabase
Verifique se o arquivo `src/integrations/supabase/client.ts` tem as configurações corretas:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jstytygxbnapydwkvpzk.supabase.co'
const supabaseAnonKey = 'sua-anon-key-aqui'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Como testar
1. Faça uma das configurações acima
2. Teste o Contract Reader clicando no botão no header
3. Verifique o console do navegador para logs detalhados
4. Se houver arquivos no bucket, eles devem aparecer nos logs

## Upload de documentos para teste
1. Vá para: https://supabase.com/dashboard/project/jstytygxbnapydwkvpzk/storage/buckets/documentos
2. Faça upload de alguns arquivos PDF ou TXT
3. Teste o Contract Reader novamente

## Status do Contract Reader
✅ Código atualizado para usar o bucket "documentos" confirmado
✅ Logs detalhados implementados para diagnóstico
✅ Tratamento de erros RLS adicionado
✅ Modelo Gemini atualizado para versão estável

🔄 **Próximo passo:** Configurar as permissões do Supabase conforme instruções acima