// Hook para gerenciar análise de contratos com pipeline completo de IA
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ContractFromDB } from '@/hooks/useContractFilters';
import { ContractAnalysisService, ContractFile, AnalysisProgress, BatchAnalysisResult } from '@/components/integrations/ai/contractAnalysisService';
import { initializeGemini } from '@/components/integrations/ai/geminiService';

export interface AnalysisState {
  isAnalyzing: boolean;
  progress: AnalysisProgress | null;
  results: BatchAnalysisResult | null;
}

export const useContractAnalysis = (geminiApiKey: string) => {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    progress: null,
    results: null
  });
  
  const { toast } = useToast();

  const analyzeContracts = async (contracts: ContractFromDB[]) => {
    try {
      // Validações iniciais
      if (!contracts || contracts.length === 0) {
        toast({
          title: "Nenhum contrato encontrado",
          description: "Aplique filtros para selecionar contratos para análise.",
          variant: "destructive"
        });
        return;
      }

      const apiKey = geminiApiKey?.trim();
      if (!apiKey) {
        toast({
          title: "Configuração necessária",
          description: "Chave da API Gemini não foi fornecida.",
          variant: "destructive"
        });
        return;
      }

      // Filtrar contratos que têm documentos
      const contractsWithDocs = contracts.filter(contract => 
        contract.documento_url && contract.documento_url.trim() !== ''
      );

      if (contractsWithDocs.length === 0) {
        toast({
          title: "Nenhum documento encontrado",
          description: "Os contratos selecionados não possuem documentos anexados.",
          variant: "destructive"
        });
        return;
      }

      console.log(`🚀 Iniciando análise de ${contractsWithDocs.length} contratos com documentos`);

      // Inicializar estado de análise
      setAnalysisState({
        isAnalyzing: true,
        progress: {
          stage: 'downloading',
          progress: 0,
          message: 'Preparando análise...'
        },
        results: null
      });

      // Notificar início
      toast({
        title: "Iniciando análise com IA",
        description: `Processando ${contractsWithDocs.length} documentos. Acompanhe o progresso abaixo.`
      });

      // Inicializar serviços
      const geminiService = initializeGemini(apiKey);
      const analysisService = new ContractAnalysisService(geminiService);

      // Converter contratos para formato do serviço
      const contractFiles: ContractFile[] = contractsWithDocs.map(contract => {
        console.log(`📋 Contrato mapeado:`, {
          numero: contract.numero_contrato,
          fornecedor: contract.fornecedor,
          documento_url: contract.documento_url
        });
        
        return {
          contractId: contract.numero_contrato || 'unknown',
          fileName: contract.fornecedor || `Contrato_${contract.numero_contrato}`,
          filePath: contract.documento_url!,
          bucketName: 'contratos' // Bucket correto baseado no erro
        };
      });

      // Executar análise com callback de progresso
      const results = await analysisService.analyzeMultipleContracts(contractFiles, {
        onProgress: (progress) => {
          setAnalysisState(prev => ({ ...prev, progress }));
        }
      });

      // Atualizar estado com resultados
      setAnalysisState({
        isAnalyzing: false,
        progress: {
          stage: 'completed',
          progress: 100,
          message: 'Análise concluída!'
        },
        results
      });

      // Gerar e abrir relatório
      if (results.successCount > 0) {
        generateAndDisplayReport(results, contractsWithDocs);
        
        toast({
          title: "Análise concluída!",
          description: `${results.successCount} contratos analisados com sucesso. ${results.errorCount > 0 ? `${results.errorCount} com erro.` : ''}`,
        });
      } else {
        toast({
          title: "Falha na análise",
          description: "Nenhum contrato pôde ser analisado com sucesso.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Erro na análise de contratos:', error);
      
      setAnalysisState({
        isAnalyzing: false,
        progress: {
          stage: 'error',
          progress: 0,
          message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        },
        results: null
      });

      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro inesperado durante a análise.",
        variant: "destructive"
      });
    }
  };

  /**
   * Gera relatório HTML e abre em nova aba
   */
  const generateAndDisplayReport = (results: BatchAnalysisResult, contracts: ContractFromDB[]) => {
    try {
      const reportHtml = generateReportHtml(results, contracts);
      
      // Abrir em nova aba
      const newWindow = globalThis.window?.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(reportHtml);
        newWindow.document.close();
      } else {
        // Fallback: download como arquivo
        downloadReport(reportHtml, 'relatorio-analise-contratos.html');
      }
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      toast({
        title: "Erro no relatório",
        description: "Análise concluída, mas houve erro na geração do relatório.",
        variant: "destructive"
      });
    }
  };

  /**
   * Gera HTML do relatório
   */
  const generateReportHtml = (results: BatchAnalysisResult, contracts: ContractFromDB[]): string => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const averageScore = results.results
      .filter(r => !r.error)
      .reduce((sum, r) => sum + r.analysis.score, 0) / results.successCount || 0;

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Análise de Contratos - ${timestamp}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9ff; padding: 20px; border-radius: 6px; text-align: center; border-left: 4px solid #4338ca; }
        .stat-number { font-size: 2em; font-weight: bold; color: #4338ca; }
        .stat-label { color: #666; margin-top: 5px; }
        .contract-analysis { margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 6px; }
        .contract-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .score-badge { padding: 8px 16px; border-radius: 20px; font-weight: bold; color: white; }
        .score-high { background-color: #16a34a; }
        .score-medium { background-color: #ea580c; }
        .score-low { background-color: #dc2626; }
        .risk-section { margin: 15px 0; }
        .risk-high { color: #dc2626; }
        .risk-medium { color: #ea580c; }
        .risk-low { color: #16a34a; }
        .recommendations { background: #f0f9ff; padding: 15px; border-radius: 6px; margin-top: 15px; }
        ul { margin: 10px 0; padding-left: 20px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Relatório de Análise de Contratos</h1>
            <p>Gerado em: ${timestamp}</p>
            <p>Sistema: Vivo Contract Insight com IA Gemini</p>
        </div>

        <div class="summary">
            <div class="stat-card">
                <div class="stat-number">${results.results.length}</div>
                <div class="stat-label">Contratos Processados</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${results.successCount}</div>
                <div class="stat-label">Análises Bem-sucedidas</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Math.round(averageScore)}</div>
                <div class="stat-label">Pontuação Média</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Math.round(results.totalProcessingTime / 1000)}s</div>
                <div class="stat-label">Tempo Total</div>
            </div>
        </div>

        <h2>📊 Resumo Executivo</h2>
        <p>${results.summary}</p>

        <h2>📑 Análises Individuais</h2>
        ${results.results.map(result => {
          if (result.error) {
            return `
            <div class="contract-analysis">
                <div class="contract-header">
                    <h3>❌ ${result.fileName}</h3>
                    <span class="score-badge score-low">ERRO</span>
                </div>
                <p><strong>Erro:</strong> ${result.error}</p>
            </div>`;
          }

          const analysis = result.analysis;
          const scoreClass = analysis.score >= 70 ? 'score-high' : analysis.score >= 50 ? 'score-medium' : 'score-low';
          
          return `
            <div class="contract-analysis">
                <div class="contract-header">
                    <h3>📄 ${result.fileName}</h3>
                    <span class="score-badge ${scoreClass}">${analysis.score}/100</span>
                </div>
                
                <p><strong>Resumo:</strong> ${analysis.summary}</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0;">
                    <div>
                        <h4>📋 Termos Principais</h4>
                        <ul>
                            <li><strong>Partes:</strong> ${analysis.keyTerms.parties.join(', ') || 'Não especificado'}</li>
                            <li><strong>Valor:</strong> ${analysis.keyTerms.value}</li>
                            <li><strong>Início:</strong> ${analysis.keyTerms.startDate}</li>
                            <li><strong>Fim:</strong> ${analysis.keyTerms.endDate}</li>
                            <li><strong>Duração:</strong> ${analysis.keyTerms.duration}</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4>⚖️ Análise de Riscos</h4>
                        ${analysis.riskAnalysis.highRisk.length > 0 ? `
                        <div class="risk-section">
                            <strong class="risk-high">🔴 Alto Risco:</strong>
                            <ul>${analysis.riskAnalysis.highRisk.map(risk => `<li class="risk-high">${risk}</li>`).join('')}</ul>
                        </div>` : ''}
                        
                        ${analysis.riskAnalysis.mediumRisk.length > 0 ? `
                        <div class="risk-section">
                            <strong class="risk-medium">🟡 Médio Risco:</strong>
                            <ul>${analysis.riskAnalysis.mediumRisk.map(risk => `<li class="risk-medium">${risk}</li>`).join('')}</ul>
                        </div>` : ''}
                        
                        ${analysis.riskAnalysis.lowRisk.length > 0 ? `
                        <div class="risk-section">
                            <strong class="risk-low">🟢 Baixo Risco:</strong>
                            <ul>${analysis.riskAnalysis.lowRisk.map(risk => `<li class="risk-low">${risk}</li>`).join('')}</ul>
                        </div>` : ''}
                    </div>
                </div>
                
                ${analysis.recommendations.length > 0 ? `
                <div class="recommendations">
                    <h4>💡 Recomendações</h4>
                    <ul>${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
                </div>` : ''}
            </div>`;
        }).join('')}

        <div class="footer">
            <p>Relatório gerado automaticamente pelo sistema Vivo Contract Insight</p>
            <p>Powered by Google Gemini AI • ${timestamp}</p>
        </div>
    </div>
</body>
</html>`;
  };

  /**
   * Download do relatório como arquivo HTML
   */
  const downloadReport = (html: string, filename: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    analyzeContracts,
    analysisState,
    isAnalyzing: analysisState.isAnalyzing
  };
};