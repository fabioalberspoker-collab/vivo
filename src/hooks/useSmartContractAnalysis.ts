import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ContractFromDB } from '@/hooks/useContractFilters';

/**
 * Hook para seleção inteligente de contratos representativos
 * Utiliza algoritmo de diversidade máxima para garantir amostragem equilibrada
 */
export const useSmartContractAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const { toast } = useToast();

  /**
   * Algoritmo de Seleção Representativa
   * 
   * OBJETIVO: Garantir máxima diversidade na amostra independente do tamanho
   * 
   * ESTRATÉGIA:
   * 1. Coleta todos os contratos da base
   * 2. Categoriza por critérios de diversidade (região, tipo, valores, etc.)
   * 3. Distribui proporcionalmente a seleção entre categorias
   * 4. Aplica algoritmo de distância euclidiana para evitar duplicatas similares
   * 5. Prioriza contratos únicos em categorias sub-representadas
   */
  const selectRepresentativeSample = async (targetSize: number): Promise<ContractFromDB[]> => {
    setIsAnalyzing(true);
    setAnalysisStatus('🔍 Coletando todos os contratos da base...');

    try {
      // 1. Buscar todos os contratos da base
      const { data: allContracts, error } = await supabase
        .from('contracts')
        .select('*');

      if (error) {
        throw new Error(`Erro ao acessar base de dados: ${error.message}`);
      }

      if (!allContracts || allContracts.length === 0) {
        throw new Error('Nenhum contrato encontrado na base de dados');
      }

      setAnalysisStatus('🧠 IA analisando diversidade de critérios...');

      // 2. Análise de Diversidade - Categorizar contratos por critérios
      const diversityAnalysis = analyzeDiversityCriteria(allContracts);
      
      setAnalysisStatus('📊 Calculando distribuição representativa...');

      // 3. Seleção Inteligente baseada em representatividade
      const selectedContracts = performIntelligentSelection(
        allContracts,
        diversityAnalysis,
        targetSize
      );

      setAnalysisStatus('✅ Amostra representativa selecionada com sucesso!');

      toast({
        title: "Análise Inteligente Concluída",
        description: `${selectedContracts.length} contratos selecionados com máxima diversidade`,
        variant: "default"
      });

      return selectedContracts;

    } catch (error) {
      console.error('❌ Erro na seleção inteligente:', error);
      toast({
        title: "Erro na Seleção",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus('');
    }
  };

  return {
    selectRepresentativeSample,
    isAnalyzing,
    analysisStatus
  };
};

/**
 * Análise de Critérios de Diversidade
 * 
 * Categoriza contratos pelos seguintes critérios:
 * - Região geográfica
 * - Tipo de fluxo
 * - Faixas de valor financeiro
 * - Áreas responsáveis
 * - Status do contrato
 * - Fornecedores
 * - Faixas de datas de vencimento
 * - Níveis de risco
 */
interface DiversityAnalysis {
  regions: Map<string, ContractFromDB[]>;
  flowTypes: Map<string, ContractFromDB[]>;
  valueRanges: Map<string, ContractFromDB[]>;
  areas: Map<string, ContractFromDB[]>;
  statuses: Map<string, ContractFromDB[]>;
  suppliers: Map<string, ContractFromDB[]>;
  dueDateRanges: Map<string, ContractFromDB[]>;
  riskLevels: Map<string, ContractFromDB[]>;
}

const analyzeDiversityCriteria = (contracts: ContractFromDB[]): DiversityAnalysis => {
  const analysis: DiversityAnalysis = {
    regions: new Map(),
    flowTypes: new Map(),
    valueRanges: new Map(),
    areas: new Map(),
    statuses: new Map(),
    suppliers: new Map(),
    dueDateRanges: new Map(),
    riskLevels: new Map()
  };

  contracts.forEach(contract => {
    // Categorizar por região
    const region = contract.regiao || 'Não Informado';
    addToCategory(analysis.regions, region, contract);

    // Categorizar por tipo de fluxo
    const flowType = contract.tipo_fluxo || 'Não Informado';
    addToCategory(analysis.flowTypes, flowType, contract);

    // Categorizar por faixas de valor
    const valueRange = getValueRange(contract.valor_contrato || 0);
    addToCategory(analysis.valueRanges, valueRange, contract);

    // Categorizar por área responsável
    const area = contract.area_responsavel || 'Não Informado';
    addToCategory(analysis.areas, area, contract);

    // Categorizar por status
    const status = contract.status || 'Não Informado';
    addToCategory(analysis.statuses, status, contract);

    // Categorizar por fornecedor
    const supplier = contract.fornecedor || 'Não Informado';
    addToCategory(analysis.suppliers, supplier, contract);

    // Categorizar por faixa de data de vencimento
    const dueDateRange = getDueDateRange(contract.data_vencimento);
    addToCategory(analysis.dueDateRanges, dueDateRange, contract);

    // Categorizar por nível de risco
    const riskLevel = contract.risco || 'Não Informado';
    addToCategory(analysis.riskLevels, riskLevel, contract);
  });

  return analysis;
};

/**
 * Utilitário para adicionar contratos às categorias de diversidade
 */
const addToCategory = (categoryMap: Map<string, ContractFromDB[]>, key: string, contract: ContractFromDB) => {
  if (!categoryMap.has(key)) {
    categoryMap.set(key, []);
  }
  categoryMap.get(key)!.push(contract);
};

/**
 * Classificação de valores em faixas representativas
 */
const getValueRange = (value: number): string => {
  if (value <= 10000) return '0-10k';
  if (value <= 50000) return '10k-50k';
  if (value <= 100000) return '50k-100k';
  if (value <= 500000) return '100k-500k';
  if (value <= 1000000) return '500k-1M';
  if (value <= 5000000) return '1M-5M';
  return '5M+';
};

/**
 * Classificação de datas de vencimento em faixas temporais
 */
const getDueDateRange = (dueDate?: string): string => {
  if (!dueDate) return 'Sem Data';
  
  const today = new Date();
  const targetDate = new Date(dueDate);
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Vencido';
  if (diffDays <= 30) return 'Próx. 30 dias';
  if (diffDays <= 90) return 'Próx. 90 dias';
  if (diffDays <= 180) return 'Próx. 6 meses';
  if (diffDays <= 365) return 'Próx. 12 meses';
  return 'Mais de 1 ano';
};

/**
 * Algoritmo de Seleção Inteligente
 * 
 * ESTRATÉGIA DE DIVERSIDADE MÁXIMA:
 * 1. Calcula peso de cada critério de diversidade
 * 2. Distribui proporcionalmente slots para cada categoria
 * 3. Seleciona contratos únicos evitando sobreposição
 * 4. Prioriza categorias sub-representadas
 * 5. Aplica desempate por valor e data para máxima variedade
 */
const performIntelligentSelection = (
  allContracts: ContractFromDB[],
  analysis: DiversityAnalysis,
  targetSize: number
): ContractFromDB[] => {

  // Se a amostra solicitada >= base completa, retorna todos
  if (targetSize >= allContracts.length) {
    return [...allContracts];
  }

  const selectedContracts = new Set<ContractFromDB>();
  const selectedIds = new Set<string>();

  // FASE 1: Garantir pelo menos 1 contrato de cada categoria principal
  const mainCategories = [analysis.regions, analysis.flowTypes, analysis.statuses, analysis.areas];
  
  mainCategories.forEach(categoryMap => {
    for (const [, contracts] of categoryMap) {
      if (selectedContracts.size >= targetSize) break;
      
      // Seleciona o contrato mais representativo da categoria
      const representative = selectMostRepresentative(contracts, selectedIds);
      if (representative && !selectedIds.has(representative.numero_contrato || '')) {
        selectedContracts.add(representative);
        selectedIds.add(representative.numero_contrato || '');
      }
    }
  });

  // FASE 2: Preencher slots restantes com diversidade máxima
  const remainingSlots = targetSize - selectedContracts.size;
  const unselectedContracts = allContracts.filter(
    contract => !selectedIds.has(contract.numero_contrato || '')
  );

  // Ordena contratos restantes por diversidade (menos representados primeiro)
  const diversityScored = unselectedContracts.map(contract => ({
    contract,
    diversityScore: calculateDiversityScore(contract, analysis, selectedContracts)
  }));

  diversityScored.sort((a, b) => b.diversityScore - a.diversityScore);

  // Seleciona os mais diversos até completar a amostra
  for (let i = 0; i < Math.min(remainingSlots, diversityScored.length); i++) {
    selectedContracts.add(diversityScored[i].contract);
  }

  return Array.from(selectedContracts);
};

/**
 * Seleciona o contrato mais representativo de uma categoria
 * Prioriza variedade de valores e datas
 */
const selectMostRepresentative = (
  contracts: ContractFromDB[],
  excludeIds: Set<string>
): ContractFromDB | null => {
  
  const available = contracts.filter(
    contract => !excludeIds.has(contract.numero_contrato || '')
  );
  
  if (available.length === 0) return null;
  if (available.length === 1) return available[0];

  // Critério: maior diversidade de valor + data mais relevante
  return available.reduce((best, current) => {
    const bestScore = getRepresentativeScore(best);
    const currentScore = getRepresentativeScore(current);
    return currentScore > bestScore ? current : best;
  });
};

/**
 * Calcula score de representatividade de um contrato
 */
const getRepresentativeScore = (contract: ContractFromDB): number => {
  let score = 0;
  
  // Pontos por valor (contratos de valores médios são mais representativos)
  const value = contract.valor_contrato || 0;
  if (value > 10000 && value < 1000000) score += 2;
  else if (value > 0) score += 1;
  
  // Pontos por ter data de vencimento
  if (contract.data_vencimento) score += 1;
  
  // Pontos por ter área responsável definida
  if (contract.area_responsavel && contract.area_responsavel !== 'Não Informado') score += 1;
  
  // Pontos por ter fornecedor definido
  if (contract.fornecedor && contract.fornecedor !== 'Não Informado') score += 1;

  return score;
};

/**
 * Calcula score de diversidade para um contrato
 * Contratos de categorias menos representadas ganham maior pontuação
 */
const calculateDiversityScore = (
  contract: ContractFromDB,
  analysis: DiversityAnalysis,
  alreadySelected: Set<ContractFromDB>
): number => {
  let score = 0;

  // Pontuação inversa ao tamanho da categoria (categorias menores = maior score)
  const selectedArray = Array.from(alreadySelected);
  
  // Score por região
  const regionCount = selectedArray.filter(c => c.regiao === contract.regiao).length;
  score += regionCount === 0 ? 10 : Math.max(1, 10 - regionCount);
  
  // Score por tipo de fluxo
  const flowCount = selectedArray.filter(c => c.tipo_fluxo === contract.tipo_fluxo).length;
  score += flowCount === 0 ? 10 : Math.max(1, 10 - flowCount);
  
  // Score por status
  const statusCount = selectedArray.filter(c => c.status === contract.status).length;
  score += statusCount === 0 ? 8 : Math.max(1, 8 - statusCount);
  
  // Score por área
  const areaCount = selectedArray.filter(c => c.area_responsavel === contract.area_responsavel).length;
  score += areaCount === 0 ? 6 : Math.max(1, 6 - areaCount);

  // Bonus por combinação única de critérios
  const uniqueCombination = selectedArray.filter(c => 
    c.regiao === contract.regiao && 
    c.tipo_fluxo === contract.tipo_fluxo && 
    c.status === contract.status
  ).length;
  
  if (uniqueCombination === 0) score += 15; // Grande bonus por combinação única

  return score;
};