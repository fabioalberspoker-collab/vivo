import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeminiService } from '@/components/integrations/ai/geminiService';
import { ContractAnalysisService } from '@/components/integrations/ai/contractAnalysisService';
import type { Contract } from '@/data/mockContracts';
import type { BatchAnalysisResult, ContractFile, ContractAnalysisOptions } from '@/components/integrations/ai/contractAnalysisService';

export const useContractAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<BatchAnalysisResult | null>(null);
  const navigate = useNavigate();

  const analyzeContracts = async (contracts: Contract[], options: ContractAnalysisOptions = {}) => {
    setIsAnalyzing(true);
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyD918kJyTaAlXtxXrfoBMjdwnxWLk0yqaw";
      const geminiService = new GeminiService({ 
        apiKey: apiKey,
        model: 'gemini-1.5-flash'
      });
      const analysisService = new ContractAnalysisService(geminiService);
      
      // Converter contratos para o formato esperado pelo serviço
      const contractFiles: ContractFile[] = contracts.map(contract => ({
        contractId: contract.number || contract.id,
        fileName: `Contrato ${contract.number}`,
        filePath: `contracts/${contract.number}.json`,
        bucketName: 'contracts'
      }));

      // Executar análise em lote
      const results = await analysisService.analyzeMultipleContracts(contractFiles, options);
      
      setAnalysisResults(results);
      
      // Navegar para a página de relatório com os resultados
      navigate('/report', { 
        state: { 
          results, 
          contracts 
        } 
      });
      
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