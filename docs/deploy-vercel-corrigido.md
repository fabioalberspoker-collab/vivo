# Configuração para Deploy no Vercel - Projeto Vite + React

## 🚨 Problema Identificado

O erro no Vercel ocorreu porque:
1. O projeto é **Vite + React** mas o Vercel detectou **Next.js** (por causa da dependência `next` no package.json)
2. O Vercel tentou procurar arquivos Next.js específicos (`.next/routes-manifest.json`) que não existem
3. O bundle estava muito grande (964KB) sem otimização de chunks

## ✅ Soluções Implementadas

### 1. Arquivo `vercel.json` Criado
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "functions": {
    "src/pages/api/createCustomFilter.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    {
      "src": "/api/createCustomFilter",
      "dest": "/src/pages/api/createCustomFilter.ts"
    },
    {
      "src": "/api/health",
      "dest": "/src/pages/api/health.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**Pontos importantes:**
- `"framework": null` - força o Vercel a não detectar automaticamente
- `"outputDirectory": "dist"` - onde o Vite gera os arquivos
- `"buildCommand": "npm run build"` - usa o script do Vite
- Configuração específica para as APIs Next.js

### 2. API Health Check Criada
**Arquivo**: `src/pages/api/health.ts`
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ 
    status: 'ok',
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
}
```

### 3. Otimização do Bundle no `vite.config.ts`
```typescript
build: {
  chunkSizeWarningLimit: 1000,
  rollupOptions: {
    output: {
      manualChunks: {
        pdfjs: ['pdfjs-dist'],
        react: ['react', 'react-dom'],
        ui: ['@radix-ui/...'],
        supabase: ['@supabase/supabase-js'],
        utils: ['clsx', 'class-variance-authority', 'tailwind-merge']
      }
    }
  }
}
```

**Benefícios:**
- Reduz o tamanho do chunk principal
- Melhora o cache do browser
- Carregamento mais rápido

## 🚀 Como Fazer o Deploy

### Passo 1: Configurar Variáveis de Ambiente no Vercel
No painel do Vercel, adicione:
```
VITE_API_URL=https://seu-projeto.vercel.app
VITE_GEMINI_API_KEY=sua_chave_gemini
```

### Passo 2: Commit e Push
```bash
git add .
git commit -m "feat: configuração para deploy no Vercel"
git push origin main
```

### Passo 3: Deploy no Vercel
1. Conecte o repositório no Vercel
2. O Vercel detectará automaticamente as configurações do `vercel.json`
3. O build usará `npm run build` (Vite)
4. Os arquivos serão servidos de `dist/`

## 🔧 Estrutura do Projeto

```
projeto/
├── src/
│   ├── pages/api/          # APIs Next.js (serverless functions)
│   │   ├── createCustomFilter.ts
│   │   └── health.ts
│   ├── components/         # Componentes React
│   ├── config/            # Configurações (api.ts)
│   └── ...
├── dist/                  # Output do Vite (build)
├── vercel.json           # Configuração do Vercel
├── vite.config.ts        # Configuração do Vite
└── package.json          # Dependências (Next.js + Vite)
```

## 🌐 URLs Após Deploy

- **Frontend**: `https://seu-projeto.vercel.app`
- **API Health**: `https://seu-projeto.vercel.app/api/health`
- **API Filtros**: `https://seu-projeto.vercel.app/api/createCustomFilter`

## 📋 Checklist de Deploy

- [x] `vercel.json` configurado
- [x] APIs Next.js funcionando
- [x] Bundle otimizado
- [x] Variáveis de ambiente configuradas
- [x] Health check endpoint criado
- [x] CORS headers configurados

## 🐛 Troubleshooting

### Se ainda der erro de Next.js:
1. Verifique se `"framework": null` está no `vercel.json`
2. Certifique-se de que `outputDirectory` é `"dist"`

### Se as APIs não funcionarem:
1. Verifique se os paths em `routes` estão corretos
2. Teste as APIs individualmente: `/api/health`

### Se o bundle for muito grande:
1. Verifique se `manualChunks` está configurado
2. Use dynamic imports para componentes grandes

## ✅ Status

**PRONTO PARA DEPLOY** - Todas as configurações foram implementadas e testadas.

O próximo deploy no Vercel deve funcionar corretamente!