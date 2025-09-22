import { VercelRequest, VercelResponse } from '@vercel/node';

// Tipos de filtros disponíveis
const FILTER_TYPES = [
  'supplier',
  'location', 
  'flowType',
  'dueDate',
  'valueRange',
  'contractCount'
] as const;

// Mapeamento de palavras-chave para tipos de filtro
const KEYWORD_MAPPING = {
  // Fornecedor
  'fornecedor': 'supplier',
  'supplier': 'supplier',
  'empresa': 'supplier',
  'companhia': 'supplier',
  
  // Localização
  'local': 'location',
  'localização': 'location', 
  'location': 'location',
  'região': 'location',
  'estado': 'location',
  'cidade': 'location',
  
  // Tipo de fluxo
  'fluxo': 'flowType',
  'flow': 'flowType',
  'tipo': 'flowType',
  'categoria': 'flowType',
  
  // Data de vencimento
  'vencimento': 'dueDate',
  'data': 'dueDate',
  'prazo': 'dueDate',
  'due': 'dueDate',
  'deadline': 'dueDate',
  'vence': 'dueDate',
  'venceu': 'dueDate',
  'atrasado': 'dueDate',
  'overdue': 'dueDate',
  
  // Valor
  'valor': 'valueRange',
  'value': 'valueRange',
  'preço': 'valueRange',
  'custo': 'valueRange',
  'montante': 'valueRange',
  'quantia': 'valueRange',
  
  // Quantidade de contratos
  'quantidade': 'contractCount',
  'count': 'contractCount',
  'número': 'contractCount',
  'total': 'contractCount',
  'contratos': 'contractCount'
};

// Opções para cada tipo de filtro
const FILTER_OPTIONS = {
  supplier: ['Vivo', 'Claro', 'TIM', 'Oi', 'Nextel', 'Algar'],
  location: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Porto Alegre', 'Salvador'],
  flowType: ['Entrada', 'Saída', 'Transferência', 'Cancelamento'],
  dueDate: ['overdue', 'next7days', 'next30days', '30-60', '60-90', 'custom'],
  valueRange: ['0-10000', '10000-50000', '50000-100000', '100000+'],
  contractCount: ['1-10', '11-50', '51-100', '100+']
};

/**
 * Analisa o prompt do usuário e determina o tipo de filtro mais adequado
 */
function analyzePrompt(prompt: string): { filterType: string; filterValue: string; confidence: number } {
  const lowerPrompt = prompt.toLowerCase();
  const words = lowerPrompt.split(/\s+/);
  
  const scores: Record<string, number> = {};
  
  // Pontuação baseada em palavras-chave
  for (const word of words) {
    for (const [keyword, filterType] of Object.entries(KEYWORD_MAPPING)) {
      if (word.includes(keyword) || keyword.includes(word)) {
        scores[filterType] = (scores[filterType] || 0) + 1;
      }
    }
  }
  
  // Análise contextual adicional
  if (lowerPrompt.includes('atrasado') || lowerPrompt.includes('venceu')) {
    scores.dueDate = (scores.dueDate || 0) + 2;
  }
  
  if (lowerPrompt.match(/\d+/)) {
    scores.valueRange = (scores.valueRange || 0) + 1;
    scores.contractCount = (scores.contractCount || 0) + 1;
  }
  
  // Determinar o filtro com maior pontuação
  const bestFilter = Object.entries(scores).reduce((best, [type, score]) => 
    score > best.score ? { type, score } : best, 
    { type: 'supplier', score: 0 }
  );
  
  const filterType = bestFilter.type;
  const options = FILTER_OPTIONS[filterType as keyof typeof FILTER_OPTIONS];
  
  // Selecionar uma opção adequada
  let filterValue = options[0]; // Padrão
  
  // Lógica específica para cada tipo
  if (filterType === 'dueDate') {
    if (lowerPrompt.includes('atrasado') || lowerPrompt.includes('venceu')) {
      filterValue = 'overdue';
    } else if (lowerPrompt.includes('7') || lowerPrompt.includes('semana')) {
      filterValue = 'next7days';
    } else if (lowerPrompt.includes('30') || lowerPrompt.includes('mês')) {
      filterValue = 'next30days';
    }
  } else if (filterType === 'valueRange') {
    const numbers = prompt.match(/\d+/g);
    if (numbers) {
      const value = parseInt(numbers[0]);
      if (value < 10000) filterValue = '0-10000';
      else if (value < 50000) filterValue = '10000-50000';
      else if (value < 100000) filterValue = '50000-100000';
      else filterValue = '100000+';
    }
  }
  
  const confidence = Math.min(bestFilter.score / words.length * 100, 95);
  
  return { filterType, filterValue, confidence };
}

/**
 * Gera um label descritivo para o filtro
 */
function generateFilterLabel(filterType: string, filterValue: string, prompt: string): string {
  const typeLabels = {
    supplier: 'Fornecedor',
    location: 'Localização',
    flowType: 'Tipo de Fluxo',
    dueDate: 'Data de Vencimento',
    valueRange: 'Faixa de Valor',
    contractCount: 'Quantidade de Contratos'
  };
  
  const valueLabels = {
    overdue: 'Em Atraso',
    next7days: 'Próximos 7 dias',
    next30days: 'Próximos 30 dias',
    '30-60': '30-60 dias',
    '60-90': '60-90 dias',
    custom: 'Personalizado'
  };
  
  const typeLabel = typeLabels[filterType as keyof typeof typeLabels] || filterType;
  const valueLabel = valueLabels[filterValue as keyof typeof valueLabels] || filterValue;
  
  return `${typeLabel}: ${valueLabel}`;
}

/**
 * Endpoint principal para criar filtros personalizados usando IA
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Este endpoint aceita apenas requisições POST'
    });
  }

  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        error: 'Prompt inválido',
        message: 'É necessário fornecer um prompt válido para criar o filtro'
      });
    }
    
    console.log('🤖 [CREATE FILTER] Analisando prompt:', prompt);
    
    // Simular processamento de IA (em produção real, aqui seria uma chamada para OpenAI/Claude)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const analysis = analyzePrompt(prompt.trim());
    const filterLabel = generateFilterLabel(analysis.filterType, analysis.filterValue, prompt);
    
    console.log('🤖 [CREATE FILTER] Resultado:', {
      filterType: analysis.filterType,
      filterValue: analysis.filterValue,
      filterLabel,
      confidence: analysis.confidence
    });
    
    res.status(200).json({
      filterType: analysis.filterType,
      filterValue: analysis.filterValue,
      filterLabel,
      confidence: analysis.confidence,
      prompt: prompt.trim(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [CREATE FILTER] Erro:', error);
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
      timestamp: new Date().toISOString()
    });
  }
}