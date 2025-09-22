# Erro de CORS - Solução

## 🚨 Problema Identificado

O frontend em produção está tentando chamar `http://localhost:3000` em vez da API do próprio Vercel.

**Erro:**
```
Access to fetch at 'http://localhost:3000/api/createCustomFilter' from origin 'https://vivo-five-pearl.vercel.app' has been blocked by CORS policy
```

## ✅ Soluções Implementadas

### 1. Auto-detecção da URL da API (Já corrigido no código)

Atualizei `src/config/api.ts` para detectar automaticamente quando está no Vercel:

```typescript
export const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.origin.includes('vercel.app') 
    ? window.location.origin 
    : undefined);
```

### 2. Configure a variável de ambiente no Vercel (RECOMENDADO)

**No dashboard do Vercel:**

1. Vá para seu projeto: https://vercel.com/dashboard
2. Clique em "Settings" → "Environment Variables"
3. Adicione:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://vivo-five-pearl.vercel.app`
   - **Environment:** Production

4. Redeploy o projeto

## 🧪 Como Testar

### 1. Teste a API diretamente:
- Health check: https://vivo-five-pearl.vercel.app/api/health
- Create filter: POST para https://vivo-five-pearl.vercel.app/api/createCustomFilter

### 2. No console do browser (F12), verifique:
```javascript
// Deve mostrar a URL correta da API
console.log('API_URL configurada:', window.API_CONFIG?.url);
```

## 🚀 Deploy das Correções

```bash
git add .
git commit -m "fix: auto-detect API URL for Vercel deployment"
git push
```

## 📋 Status

- ✅ Código atualizado para auto-detecção
- ⏳ Aguardando redeploy
- ⏳ Configurar VITE_API_URL no Vercel (opcional mas recomendado)

O sistema agora deve funcionar automaticamente no Vercel sem configuração adicional!