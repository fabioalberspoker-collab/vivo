Quero que você faça as seguintes mudanças no meu projeto React + Vite (com shadcn):

Substituir todos os fetch/axios que chamam diretamente http://localhost:3000/api/... para usar uma variável de ambiente no estilo:

const API_URL = import.meta.env.VITE_API_URL;
fetch(`${API_URL}/api/createCustomFilter`, { method: "POST" })

Criar no código do projeto o uso de import.meta.env.VITE_API_URL como endpoint base.
Em desenvolvimento, esse valor será http://localhost:3000.
Em produção, será https://meu-projeto.vercel.app (vou configurar no painel do Vercel).

Garantir que todas as chamadas de API usem essa variável de ambiente, para evitar problemas de CORS em produção.

Se possível, centralizar esse valor num arquivo utilitário (exemplo: src/config/api.ts) que exporta algo como:
export const API_URL = import.meta.env.VITE_API_URL;