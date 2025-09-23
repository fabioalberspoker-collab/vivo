# Guia de Solução de Problemas - API Gemini

## Erro 503 - Service Unavailable

### O que significa?
O erro 503 indica que o serviço da API Google Gemini está temporariamente sobrecarregado ou em manutenção.

### O que o sistema faz automaticamente?
✅ **Retry Automático**: O sistema tenta até 5 vezes com intervalos crescentes (2s, 4s, 8s, 16s, 32s)
✅ **Análise Básica**: Se a IA não estiver disponível, gera análise com dados básicos do contrato
✅ **Notificações**: Mostra feedback visual sobre o status da análise
✅ **Continuidade**: Continua processando outros contratos mesmo se alguns falharem

### O que fazer quando encontrar este erro?

#### Opção 1: Aguardar (Recomendado)
- O sistema está tentando automaticamente
- Aguarde alguns minutos e tente novamente
- O Google Gemini geralmente retorna rapidamente

#### Opção 2: Tentar Novamente
- Use o botão "Exportar Relatório" novamente após alguns minutos
- O sistema tentará processar os contratos novamente

#### Opção 3: Verificar Análise Básica
- Mesmo com erro 503, o sistema gera análise básica
- Verifique o relatório gerado - pode conter informações úteis
- Use o ícone 👁️ para ver detalhes de cada contrato

### Mensagens que você pode ver:

- 🔄 "Serviço IA temporariamente indisponível"
- ⏳ "Tentando novamente em Xs..."
- 📊 "Análise básica gerada"

### Quando se preocupar?
- Se o erro persistir por mais de 30 minutos
- Se nenhum contrato for processado após várias tentativas
- Se a internet estiver funcionando normalmente mas o erro continua

### Contato para Suporte
Em caso de problemas persistentes, verifique:
1. Conexão com a internet
2. Status da API Gemini no Google Cloud Console
3. Limites de uso da API

---
*Este sistema foi projetado para ser resiliente e continuar funcionando mesmo com problemas temporários da API.*