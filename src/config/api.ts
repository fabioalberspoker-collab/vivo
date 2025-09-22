/**
 * Configuração centralizada para URLs de API
 * 
 * Este arquivo centraliza todas as configurações de endpoints da API,
 * utilizando variáveis de ambiente para diferentes ambientes (dev/prod).
 * 
 * Uso:
 * - Desenvolvimento: VITE_API_URL=http://localhost:3000
 * - Produção: VITE_API_URL=https://meu-projeto.vercel.app
 */

// URL base da API configurada via variável de ambiente
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Endpoints específicos da API
export const API_ENDPOINTS = {
  // Filtros personalizados
  CREATE_CUSTOM_FILTER: '/api/createCustomFilter',
  
  // Health check
  HEALTH: '/api/health',
  
  // Contratos (se houver endpoints específicos)
  CONTRACTS: '/api/contracts',
  
  // IA e análise
  AI_ANALYSIS: '/api/ai/analysis',
} as const;

/**
 * Função utilitária para construir URLs completas da API
 * @param endpoint - Endpoint da API (ex: '/api/createCustomFilter')
 * @returns URL completa da API
 */
export function buildApiUrl(endpoint: string): string {
  return `${API_URL}${endpoint}`;
}

/**
 * Função utilitária para construir URLs usando os endpoints predefinidos
 * @param endpointKey - Chave do endpoint no objeto API_ENDPOINTS
 * @returns URL completa da API
 */
export function getApiEndpoint(endpointKey: keyof typeof API_ENDPOINTS): string {
  return buildApiUrl(API_ENDPOINTS[endpointKey]);
}

// Log de debug para desenvolvimento
if (import.meta.env.DEV) {
  console.log('🌐 [API CONFIG] URL base da API:', API_URL);
  console.log('🌐 [API CONFIG] Ambiente:', import.meta.env.MODE);
}