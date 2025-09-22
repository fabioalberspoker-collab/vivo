# Configuração da API Gemini

Para utilizar a funcionalidade de análise de contratos com IA, é necessário configurar a chave da API do Google Gemini.

## Como obter a chave da API

1. Acesse [Google AI Studio](https://aistudio.google.com/)
2. Faça login com sua conta Google
3. Navegue até "Get API Key"
4. Crie uma nova chave de API
5. Copie a chave gerada

## Configuração no projeto

### Opção 1: Variável de ambiente (Recomendado)

Crie um arquivo `.env.local` na raiz do projeto:

```env
REACT_APP_GEMINI_API_KEY=sua_chave_aqui
```

### Opção 2: Configuração manual

Se não configurar a variável de ambiente, o sistema solicitará a chave quando necessário.

## Segurança

⚠️ **IMPORTANTE**: Nunca commite a chave da API no repositório. Mantenha-a em variáveis de ambiente ou configurações locais.

## Testando a integração

1. Configure a chave da API
2. Aplique filtros para selecionar contratos
3. Clique no botão "Exportar Relatório"
4. Aguarde a análise ser processada
5. O resumo será exibido automaticamente em uma nova aba

## Solução de problemas

- **"Chave da API não configurada"**: Verifique se a variável REACT_APP_GEMINI_API_KEY está definida
- **"Nenhum contrato encontrado"**: Aplique filtros antes de gerar o relatório
- **"Erro na análise"**: Verifique a conexão com a internet e se a chave da API é válida