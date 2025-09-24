/**
 * Função para normalizar texto removendo acentos e padronizando
 * @param text - Texto a ser normalizado
 * @returns Texto normalizado sem acentos e com primeira letra maiúscula
 */
export function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Remove acentos usando decomposição Unicode
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Converte para lowercase e depois primeira letra maiúscula
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/**
 * Função para criar uma versão normalizada para comparação
 * @param text - Texto a ser normalizado para comparação
 * @returns Texto em lowercase sem acentos para comparação
 */
export function normalizeForComparison(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Mapas de normalização para campos específicos
 */
export const normalizationMaps = {
  risco: {
    'baixo': 'Baixo',
    'medio': 'Medio',
    'médio': 'Medio',
    'alto': 'Alto',
    'critico': 'Critico',
    'crítico': 'Critico'
  },
  prioridade: {
    'baixa': 'Baixa',
    'media': 'Media',
    'média': 'Media',
    'alta': 'Alta',
    'urgente': 'Urgente',
    'critica': 'Critica',
    'crítica': 'Critica'
  },
  area_responsavel: {
    'financeiro': 'Financeiro',
    'juridico': 'Juridico',
    'jurídico': 'Juridico',
    'operacoes': 'Operacoes',
    'operações': 'Operacoes',
    'ti': 'TI',
    'rh': 'RH',
    'recursos humanos': 'Recursos Humanos',
    'comercial': 'Comercial',
    'compras': 'Compras'
  }
};

/**
 * Função para normalizar valor baseado no campo
 * @param field - Nome do campo
 * @param value - Valor a ser normalizado
 * @returns Valor normalizado
 */
export function normalizeFieldValue(field: string, value: string): string {
  if (!value || typeof value !== 'string') return '';
  
  const normalizedValue = normalizeForComparison(value);
  const fieldMap = normalizationMaps[field as keyof typeof normalizationMaps];
  
  if (fieldMap && fieldMap[normalizedValue as keyof typeof fieldMap]) {
    return fieldMap[normalizedValue as keyof typeof fieldMap];
  }
  
  return normalizeText(value);
}
