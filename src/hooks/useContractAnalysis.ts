import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeminiService } from '@/components/integrations/ai/geminiService';
import type { Contract } from '@/data/mockContracts';
import type { BatchAnalysisResult, AnalysisResult } from '@/components/integrations/ai/contractAnalysisService';

export const useContractAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<BatchAnalysisResult | null>(null);
  const navigate = useNavigate();

  const analyzeContracts = async (contracts: Contract[]) => {
    setIsAnalyzing(true);
    
    try {
      // Simulação básica por enquanto
      const results: BatchAnalysisResult = {
        results: contracts.map(contract => ({
          contractId: contract.number || contract.id,
          fileName: `Contrato ${contract.number}`,
          analysis: {
            summary: `Análise do contrato ${contract.number}: Contrato de ${contract.type} com ${contract.supplier} no valor de R$ ${contract.value?.toLocaleString('pt-BR') || 'N/A'}.`,
            keyTerms: {
              parties: [contract.supplier, "Vivo"],
              value: `R$ ${contract.value?.toLocaleString('pt-BR') || 'N/A'}`,
              startDate: "A definir",
              endDate: contract.dueDate || "A definir",
              duration: "A definir"
            },
            riskAnalysis: {
              highRisk: contract.value > 100000 ? ["Alto valor contratual"] : [],
              mediumRisk: ["Verificar documentação completa"],
              lowRisk: contract.value <= 50000 ? ["Valor baixo"] : []
            },
            clauses: {
              payment: ["Conforme contrato"],
              termination: ["A verificar"],
              liability: ["A verificar"],
              other: []
            },
            recommendations: ["Revisar cláusulas de pagamento"],
            score: 75
          },
          processingTime: 1000
        })),
        totalProcessingTime: contracts.length * 1000,
        successCount: contracts.length,
        errorCount: 0,
        summary: `Análise de ${contracts.length} contratos concluída.`
      };
      
      setAnalysisResults(results);
      navigate('/report', { state: { results, contracts } });
      
    } catch (error) {
      console.error('Erro ao analisar contratos:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeContracts,
    isAnalyzing,
    analysisResults
  };
};