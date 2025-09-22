# API do Vivo Contract Insight

Esta API fornece endpoints para funcionalidades avançadas do sistema de contratos.

## Endpoints Disponíveis

### Health Check
- **GET** `/api/health`
- Verifica se a API está funcionando
- Resposta: Status da API e informações do ambiente

### Criar Filtro Personalizado
- **POST** `/api/createCustomFilter`
- Cria filtros personalizados baseados em linguagem natural
- Body: `{ "prompt": "sua descrição do filtro" }`
- Resposta: Filtro gerado com tipo, valor e label

## Configuração

### Variáveis de Ambiente

```env
# Configuração da API no frontend
VITE_API_URL=https://seu-projeto.vercel.app

# Para desenvolvimento local
VITE_API_URL=http://localhost:3000
```

### Deploy no Vercel

O projeto está configurado para fazer deploy automático das funções serverless:

1. Faça push do código para o repositório
2. Configure a variável `VITE_API_URL` no Vercel para apontar para seu domínio
3. As funções da API estarão disponíveis automaticamente

## Funcionalidades da IA

O endpoint `/api/createCustomFilter` analisa prompts em linguagem natural e converte em filtros estruturados:

**Exemplos de prompts:**
- "contratos que vencem nos próximos 7 dias"
- "fornecedores da região de São Paulo"
- "contratos com valor acima de 50 mil"
- "contratos em atraso"

**Tipos de filtros suportados:**
- `supplier` - Filtro por fornecedor
- `location` - Filtro por localização
- `flowType` - Filtro por tipo de fluxo
- `dueDate` - Filtro por data de vencimento
- `valueRange` - Filtro por faixa de valor
- `contractCount` - Filtro por quantidade de contratos

## Modo Fallback

Se a API não estiver disponível, o sistema automaticamente usa o modo mock com dados de demonstração.