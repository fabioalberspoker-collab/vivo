import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { GeminiService, type ContractAnalysisResult } from '@/components/integrations/ai/geminiService';
import type { Contract } from '@/data/mockContracts';
import type { ContractFromDB } from '@/hooks/useContractFilters';
import type { BatchAnalysisResult, AnalysisResult } from '@/components/integrations/ai/contractAnalysisService';

export const useContractAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<BatchAnalysisResult | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const analyzeContracts = async (contracts: Contract[], originalContracts?: ContractFromDB[]) => {
    setIsAnalyzing(true);
    setAnalysisStatus('Iniciando análise...');
    
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
      for (let i = 0; i < contracts.length; i++) {
        const contract = contracts[i];
        setAnalysisStatus(`Analisando contrato ${i + 1} de ${contracts.length}: ${contract.supplier}...`);
        
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
- Localização: ${contract.region}
- Fluxo: ${contract.flowType}
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
          
          // Verificar tipo específico de erro para melhor feedback
          let errorType = 'unknown';
          let userMessage = 'Erro na análise - dados básicos incluídos';
          
          if (error instanceof Error) {
            if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
              errorType = 'service_unavailable';
              userMessage = '🔄 Serviço IA indisponível - tentando reconectar';
              setAnalysisStatus(`⚠️ Serviço IA temporariamente indisponível. Gerando análise básica...`);
              
              // Toast para erro 503
              if (i === 0) { // Mostrar apenas uma vez
                toast({
                  title: "⚠️ Serviço IA Indisponível",
                  description: "O serviço de análise está temporariamente sobrecarregado. O sistema continuará gerando análises básicas automaticamente.",
                  variant: "destructive",
                });
              }
            } else if (error.message.includes('429') || error.message.includes('rate limit')) {
              errorType = 'rate_limit';
              userMessage = '⏳ Limite de uso atingido - análise básica gerada';
              setAnalysisStatus(`⏳ Limite de API atingido. Continuando com análise simplificada...`);
              
              if (i === 0) {
                toast({
                  title: "⏳ Limite de Uso Atingido",
                  description: "Limite da API temporariamente atingido. Aguarde alguns minutos ou continue com análises básicas.",
                  variant: "destructive",
                });
              }
            } else if (error.message.includes('fetch') || error.message.includes('network')) {
              errorType = 'network';
              userMessage = '📡 Problema de conectividade - análise básica gerada';
              setAnalysisStatus(`📡 Problema de rede detectado. Continuando com dados básicos...`);
              
              if (i === 0) {
                toast({
                  title: "📡 Problema de Conectividade",
                  description: "Problema de rede detectado. Verifique sua conexão e tente novamente se necessário.",
                  variant: "destructive",
                });
              }
            }
          }
          
          const errorMessage = userMessage;
          
          // Fallback com dados básicos em caso de erro
          const fallbackAnalysis: ContractAnalysisResult = {
            summary: `${errorMessage}. Contrato ${contract.number}: ${contract.type} com ${contract.supplier}.`,
            keyTerms: {
              parties: [contract.supplier, "Vivo"],
              value: `R$ ${contract.value?.toLocaleString('pt-BR') || 'N/A'}`,
              startDate: "A definir",
              endDate: contract.dueDate || "A definir",
              duration: "A definir"
            },
            riskAnalysis: {
              highRisk: errorType === 'service_unavailable' ? ["Análise IA indisponível - revisar manualmente"] : ["Erro na análise - revisar manualmente"],
              mediumRisk: ["Verificar documentação completa"],
              lowRisk: []
            },
            clauses: {
              payment: [errorType === 'service_unavailable' ? "Análise IA indisponível" : "Erro na análise"],
              termination: [errorType === 'service_unavailable' ? "Análise IA indisponível" : "Erro na análise"],
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
      setAnalysisStatus('Análise concluída! Redirecionando para o relatório...');
      
      // Toast de sucesso ou aviso baseado nos resultados
      if (errorCount === 0) {
        toast({
          title: "✅ Análise Concluída",
          description: `${successCount} contratos analisados com sucesso!`,
          variant: "default",
        });
      } else if (successCount > 0) {
        toast({
          title: "⚠️ Análise Parcialmente Concluída",
          description: `${successCount} contratos analisados com sucesso, ${errorCount} com problemas. Verifique o relatório para detalhes.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Problemas na Análise",
          description: `Todos os contratos tiveram problemas na análise. Dados básicos foram gerados.`,
          variant: "destructive",
        });
      }
      
      
      // Usar contratos originais se fornecidos, senão fazer conversão
      const contractsForReport = originalContracts || contracts.map(contract => ({
        numero_contrato: contract.number,
        fornecedor: contract.supplier,
        tipo_fluxo: contract.flowType,
        valor_contrato: contract.value,
        valor_pagamento: contract.value, // Usando o mesmo valor para simplificar
        regiao: contract.region,
        estado: contract.state,
        municipio: contract.state, // Usando estado como municipio temporariamente
        status: contract.status === 'paid' ? 'Pago' : 
               contract.status === 'pending' ? 'Pendente' : 
               contract.status === 'overdue' ? 'Vencido' : 'Processando',
        data_vencimento: contract.dueDate,
        data_assinatura: new Date().toISOString().split('T')[0], // Data atual como assinatura
        area_responsavel: 'TI', // Área padrão - pode ser customizada depois
        prioridade: 'Média', // Prioridade padrão
        risco: 'Baixo', // Risco padrão
        responsavel: 'Sistema' // Responsável padrão
      }));
      
      navigate('/report', { state: { results: batchResults, contracts: contractsForReport } });
      
    } catch (error) {
      console.error('Erro ao analisar contratos:', error);
      setAnalysisStatus('Erro durante a análise. Tente novamente.');
      throw error;
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisStatus(''), 2000); // Limpar status após 2 segundos
    }
  };

  return {
    analyzeContracts,
    isAnalyzing,
    analysisStatus,
    analysisResults
  };
};