import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeminiService, type ContractAnalysisResult } from '@/components/integrations/ai/geminiService';
import type { Contract } from '@/data/mockContracts';
import type { BatchAnalysisResult, AnalysisResult } from '@/components/integrations/ai/contractAnalysisService';

export const useContractAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<BatchAnalysisResult | null>(null);
  const navigate = useNavigate();

  const analyzeContracts = async (contracts: Contract[]) => {
    setIsAnalyzing(true);
    
    try {
      const geminiService = new GeminiService({
        apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
        model: 'gemini-1.5-flash'
      });

      const startTime = Date.now();
      const results: AnalysisResult[] = [];
      let successCount = 0;
      let errorCount = 0;

      // Processar cada contrato individualmente
      for (const contract of contracts) {
        const contractStartTime = Date.now();
        
        try {
          // Criar um texto descritivo do contrato para análise
          const contractText = `
CONTRATO DE ${contract.type?.toUpperCase() || 'SERVIÇOS'}

DADOS DO CONTRATO:
- Número: ${contract.number}
- Tipo: ${contract.type}
- Fornecedor: ${contract.supplier}
- Valor: R$ ${contract.value?.toLocaleString('pt-BR') || 'N/A'}
- Data de Vencimento: ${contract.dueDate || 'A definir'}
- Localização: ${contract.location}
- Fluxo: ${contract.flow}
- Status: ${contract.status || 'Ativo'}

DESCRIÇÃO:
Este é um contrato de ${contract.type} firmado entre a Vivo e ${contract.supplier}.
O contrato tem valor de R$ ${contract.value?.toLocaleString('pt-BR') || 'valor não informado'} 
e está programado para vencimento em ${contract.dueDate || 'data não especificada'}.
          `.trim();

          // Chamar a API do Gemini para análise
          const analysis = await geminiService.analyzeContract(contractText);
          
          const contractProcessingTime = Date.now() - contractStartTime;
          
          results.push({
            contractId: contract.number || contract.id,
            fileName: `Contrato ${contract.number}`,
            analysis,
            processingTime: contractProcessingTime
          });
          
          successCount++;
          
        } catch (error) {
          console.error(`Erro ao analisar contrato ${contract.number}:`, error);
          
          // Fallback com dados básicos em caso de erro
          const fallbackAnalysis: ContractAnalysisResult = {
            summary: `Erro na análise do contrato ${contract.number}. Contrato de ${contract.type} com ${contract.supplier}.`,
            keyTerms: {
              parties: [contract.supplier, "Vivo"],
              value: `R$ ${contract.value?.toLocaleString('pt-BR') || 'N/A'}`,
              startDate: "A definir",
              endDate: contract.dueDate || "A definir",
              duration: "A definir"
            },
            riskAnalysis: {
              highRisk: ["Erro na análise - revisar manualmente"],
              mediumRisk: ["Verificar documentação completa"],
              lowRisk: []
            },
            clauses: {
              payment: ["Erro na análise"],
              termination: ["Erro na análise"],
              liability: ["Erro na análise"],
              other: []
            },
            recommendations: ["Revisar contrato manualmente devido a erro na análise automática"],
            score: 50
          };
          
          results.push({
            contractId: contract.number || contract.id,
            fileName: `Contrato ${contract.number}`,
            analysis: fallbackAnalysis,
            processingTime: Date.now() - contractStartTime,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
          
          errorCount++;
        }
      }

      const totalProcessingTime = Date.now() - startTime;
      
      const batchResults: BatchAnalysisResult = {
        results,
        totalProcessingTime,
        successCount,
        errorCount,
        summary: `Análise de ${contracts.length} contratos concluída. ${successCount} sucessos, ${errorCount} erros.`
      };
      
      setAnalysisResults(batchResults);
      navigate('/report', { state: { results: batchResults, contracts } });
      
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