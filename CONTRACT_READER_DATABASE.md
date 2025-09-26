# Contract Reader - Integração com Base de Dados

## Funcionalidade Implementada ✅

O ContractReader agora salva automaticamente os dados JSON retornados pelo Gemini na tabela `Reader` do Supabase.

## Como Funciona

### 1. Processamento do Documento
1. ContractReader lê documentos do bucket "documentos" 
2. Extrai texto de PDFs usando PDF.js
3. Envia para Gemini AI para análise e extração de dados

### 2. Análise do Gemini
O Gemini retorna dados estruturados no formato:
```json
{
  "contratado": "Nome da empresa fornecedora",
  "contratante": "Nome da empresa contratante", 
  "tipo_fluxo": "Tipo do contrato (RE, FI, Engenharia, etc)",
  "valor_contrato": 150000.00,
  "valor_pagamento": 15000.00,
  "localizacao": {
    "estado": "SP",
    "cidade": "São Paulo"
  },
  "data_vencimento": "2025-12-31",
  "area_responsavel": "Infraestrutura",
  // ... outros campos
}
```

### 3. Salvamento Automático na Base de Dados
Os dados são mapeados 1:1 com os campos exatos da tabela `reader`:

| Campo Gemini | Campo Tabela | Valor Padrão | Observação |
|--------------|--------------|--------------|------------|
| `area_responsavel` | `area_responsavel` | "Área não definida" | Área responsável |
| `contratado` | `contratado` | "Fornecedor - [arquivo]" | Nome do fornecedor |
| `contratante` | `contratante` | "Empresa Contratante" | Nome da empresa contratante |
| `data_vencimento` | `data_vencimento` | "2001-01-01" | Data de vencimento |
| `datas_vencimento_parcelas` | `datas_vencimento_parcelas` | [] | Array de datas das parcelas |
| `forma_pagamento` | `forma_pagamento` | 1 | Forma de pagamento (numérico) |
| `localizacao_estado` | `localizacao_estado` | "SP" | Estado (sigla) |
| `localizacao_cidade` | `localizacao_cidade` | "São Paulo" | Cidade |
| `multa` | `multa` | 0 | Valor da multa |
| `tipo_fluxo` | `tipo_fluxo` | "Não classificado" | Tipo do contrato |
| `valor_contrato` | `valor_contrato` | 0 | Valor total |
| `valor_pagamento` | `valor_pagamento` | 0 | Valor do pagamento |

### 4. Prompt Atualizado do Gemini
O Gemini agora recebe instruções específicas para retornar TODOS os 12 campos da tabela com valores apropriados ou padrão.

### 4. Valores Padrão Inteligentes
O sistema preenche automaticamente campos vazios com valores padrão apropriados:

**Para campos de texto (string):**
- `contratado`: Se vazio → `"Fornecedor - [nome_do_arquivo]"`
- `contratante`: Se vazio → `"Empresa Contratante"`
- `tipo_fluxo`: Se vazio → `"Não classificado"`
- `area_responsavel`: Se vazio → `"Área não definida"`
- Outros campos vazios → `"Não informado"`

**Para campos numéricos:**
- `valor_contrato`, `valor_pagamento`, `multa`: Se vazio → `0`
- `forma_pagamento`: Se vazio → `1` (valor padrão para forma de pagamento)

**Para campos de data:**
- `data_vencimento`: Se vazio → `"2001-01-01"`

### 5. Sistema Adaptativo
- **Inserção inteligente**: Tenta inserir todos os campos disponíveis
- **Valores padrão**: Nunca deixa campos null/vazios
- **Fallback automático**: Se algum campo não existir, usa apenas os campos mínimos
- **Campos mínimos garantidos**: `contratado`, `tipo_fluxo`, `valor_contrato` (sempre com valores padrão)

## Como Usar

1. **Upload de Documentos**:
   - Faça upload de PDFs ou TXT no bucket "documentos" 
   - URL: https://supabase.com/dashboard/project/jstytygxbnapydwkvpzk/storage/buckets/documentos

2. **Processar Contratos**:
   - Clique no botão "Contract Reader" no header da aplicação
   - Aguarde o processamento (logs no console do navegador)

3. **Verificar Resultados**:
   - Tabela Reader: https://supabase.com/dashboard/project/jstytygxbnapydwkvpzk/editor/37887
   - Os contratos processados aparecerão automaticamente

## Logs e Monitoramento

O sistema gera logs detalhados:
```
📄 Processing file: contrato_exemplo.pdf
💾 Saving contract data to database for file: contrato_exemplo.pdf
🔧 Applied default values for: contratante, area_responsavel, data_vencimento  
📝 Contract data to insert: { contratado: "Empresa XYZ", tipo_fluxo: "RE", ... }
✅ Successfully saved contract for contrato_exemplo.pdf to database
💾 Contract saved to database for file: contrato_exemplo.pdf
✅ Successfully processed contrato_exemplo.pdf
```

Em caso de problemas com colunas:
```
🔄 Trying to insert with minimal fields...
✅ Successfully saved contract with minimal fields
```

## Tratamento de Erros

- **Erro no processamento**: Arquivo pulado, não afeta outros
- **Erro no salvamento**: Logged como aviso, processamento continua
- **Dados inválidos**: Gemini tenta extrair o que conseguir
- **Campos obrigatórios**: Valores padrão aplicados

## Benefícios

✅ **Automação Total**: Upload → Processamento → Base de Dados  
✅ **Dados Estruturados**: JSON consistente para análises  
✅ **Rastreabilidade**: URL do documento salva na tabela  
✅ **Robustez**: Continua mesmo com erros parciais  
✅ **Monitoramento**: Logs detalhados para debugging  

## Próximos Passos

1. Configure as permissões RLS do Supabase (ver SUPABASE_SETUP.md)
2. Faça upload de documentos de teste
3. Teste o Contract Reader
4. Verifique os resultados na tabela contracts

## Estrutura de Arquivos

```
src/domains/contracts/services/
├── ContractReader.ts          # Serviço principal
├── types.ts                   # Interfaces e tipos
│   ├── ContractStorageFile    # Arquivo no storage
│   ├── ContractParserResponse # Resposta do Gemini  
│   └── ContractDatabaseInsert # Dados para inserção
└── hooks/useContractReader.ts # Hook React
```

O sistema está pronto para uso! 🚀