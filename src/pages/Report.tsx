import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { ContractFromDB } from "@/hooks/useContractFilters";
import { BatchAnalysisResult } from "@/components/integrations/ai/contractAnalysisService";
import { DashboardCharts } from "@/components/DashboardCharts";

interface ReportPageState {
  results: BatchAnalysisResult;
  contracts: ContractFromDB[];
}

const Report = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reportData, setReportData] = useState<ReportPageState | null>(null);

  useEffect(() => {
    // Verificar se há dados do estado de navegação
    if (location.state && location.state.results && location.state.contracts) {
      setReportData(location.state as ReportPageState);
    } else {
      // Se não há dados, redirecionar para a página principal
      navigate("/");
    }
  }, [location.state, navigate]);

  const handleGoBack = () => {
    navigate("/");
  };

  const handleDownloadReport = () => {
    if (!reportData) return;
    
    const reportHtml = generateReportHtml(reportData.results, reportData.contracts);
    downloadReport(reportHtml, 'relatorio-analise-contratos.html');
  };

  const handlePrintReport = () => {
    globalThis.window?.print();
  };

  const generateReportHtml = (results: BatchAnalysisResult, contracts: ContractFromDB[]): string => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const totalAnalyzed = results.results.length;
    const successfulAnalyses = results.results.filter(r => !r.error).length;
    const errors = results.results.filter(r => r.error);

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Análise de Contratos - ${timestamp}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                background-color: #f8f9fa;
                color: #333;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #8B5CF6;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .summary-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #8B5CF6;
            }
            .analysis-section {
                margin-bottom: 40px;
                padding: 20px;
                background: #fafafa;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }
            .contract-analysis {
                margin-bottom: 30px;
                padding: 20px;
                background: white;
                border-radius: 6px;
                border: 1px solid #dee2e6;
            }
            .error-section {
                background: #fff5f5;
                border-left: 4px solid #ef4444;
                padding: 15px;
                margin: 10px 0;
                border-radius: 4px;
            }
            h1 { color: #8B5CF6; font-size: 2.2em; margin: 0; }
            h2 { color: #6366f1; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; }
            h3 { color: #7c3aed; margin-top: 25px; }
            .timestamp { color: #6b7280; font-style: italic; }
            .footer { 
                text-align: center; 
                margin-top: 40px; 
                padding-top: 20px; 
                border-top: 1px solid #e9ecef;
                color: #6b7280;
            }
            @media print {
                body { background: white; }
                .container { box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 Relatório de Análise de Contratos</h1>
                <p class="timestamp">Gerado em: ${timestamp}</p>
            </div>

            <div class="summary-cards">
                <div class="card">
                    <h3>📊 Total de Contratos</h3>
                    <p style="font-size: 2em; font-weight: bold; margin: 0; color: #8B5CF6;">${contracts.length}</p>
                </div>
                <div class="card">
                    <h3>✅ Análises Realizadas</h3>
                    <p style="font-size: 2em; font-weight: bold; margin: 0; color: #10b981;">${totalAnalyzed}</p>
                </div>
                <div class="card">
                    <h3>🎯 Taxa de Sucesso</h3>
                    <p style="font-size: 2em; font-weight: bold; margin: 0; color: ${successfulAnalyses === totalAnalyzed ? '#10b981' : '#f59e0b'};">${Math.round((successfulAnalyses / totalAnalyzed) * 100)}%</p>
                </div>
                ${errors.length > 0 ? `
                <div class="card">
                    <h3>⚠️ Erros</h3>
                    <p style="font-size: 2em; font-weight: bold; margin: 0; color: #ef4444;">${errors.length}</p>
                </div>
                ` : ''}
            </div>

            ${results.summary ? `
            <div class="analysis-section">
                <h2>🔍 Análise Consolidada</h2>
                <div style="white-space: pre-wrap; line-height: 1.7;">
                    ${results.summary.replace(/\n/g, '<br>')}
                </div>
            </div>
            ` : ''}

            <div class="analysis-section">
                <h2>📑 Análises Individuais</h2>
                ${results.results.map((result, index) => {
                    const contract = contracts.find(c => c.numero_contrato === result.contractId);
                    if (!result.error && result.analysis) {
                        return `
                        <div class="contract-analysis" style="margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                            <h3 style="color: #8B5CF6; margin-bottom: 15px;">📄 Contrato: ${result.contractId} 
                                <span style="float: right; font-size: 14px; color: #666; background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">Score: ${result.analysis.score || 'N/A'}/100</span>
                            </h3>
                            
                            ${contract ? `
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                                    <div><strong>Fornecedor:</strong> ${contract.fornecedor || 'N/A'}</div>
                                    <div><strong>Valor:</strong> <span style="color: #28a745;">R$ ${(contract.valor_contrato || 0).toLocaleString('pt-BR')}</span></div>
                                    <div><strong>Status:</strong> ${contract.status || 'N/A'}</div>
                                </div>
                            </div>
                            ` : ''}
                            
                            <div style="margin-bottom: 20px;">
                                <h4 style="color: #333; margin-bottom: 10px;">📋 Resumo Executivo</h4>
                                <div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; border-radius: 4px;">
                                    ${result.analysis.summary.replace(/\n/g, '<br>')}
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <h4 style="color: #333; margin-bottom: 10px;">🔑 Termos Principais</h4>
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                                    <div style="background: #e8f5e8; padding: 10px; border-radius: 4px;">
                                        <strong>Partes:</strong> ${result.analysis.keyTerms.parties.join(', ')}
                                    </div>
                                    <div style="background: #f3e5f5; padding: 10px; border-radius: 4px;">
                                        <strong>Valor:</strong> ${result.analysis.keyTerms.value}
                                    </div>
                                    <div style="background: #fff3cd; padding: 10px; border-radius: 4px;">
                                        <strong>Início:</strong> ${result.analysis.keyTerms.startDate}
                                    </div>
                                    <div style="background: #ffeaa7; padding: 10px; border-radius: 4px;">
                                        <strong>Fim:</strong> ${result.analysis.keyTerms.endDate}
                                    </div>
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <h4 style="color: #333; margin-bottom: 10px;">⚠️ Análise de Riscos</h4>
                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                                    ${result.analysis.riskAnalysis.highRisk.length > 0 ? `
                                    <div style="background: #ffebee; padding: 10px; border-radius: 4px; border: 1px solid #ffcdd2;">
                                        <strong style="color: #c62828;">🔴 Alto Risco</strong>
                                        <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #d32f2f;">
                                            ${result.analysis.riskAnalysis.highRisk.map(risk => `<li>${risk}</li>`).join('')}
                                        </ul>
                                    </div>
                                    ` : ''}
                                    ${result.analysis.riskAnalysis.mediumRisk.length > 0 ? `
                                    <div style="background: #fff8e1; padding: 10px; border-radius: 4px; border: 1px solid #ffecb3;">
                                        <strong style="color: #f57c00;">🟡 Médio Risco</strong>
                                        <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #ef6c00;">
                                            ${result.analysis.riskAnalysis.mediumRisk.map(risk => `<li>${risk}</li>`).join('')}
                                        </ul>
                                    </div>
                                    ` : ''}
                                    ${result.analysis.riskAnalysis.lowRisk.length > 0 ? `
                                    <div style="background: #e8f5e8; padding: 10px; border-radius: 4px; border: 1px solid #c8e6c9;">
                                        <strong style="color: #2e7d32;">🟢 Baixo Risco</strong>
                                        <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #388e3c;">
                                            ${result.analysis.riskAnalysis.lowRisk.map(risk => `<li>${risk}</li>`).join('')}
                                        </ul>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            ${result.analysis.recommendations.length > 0 ? `
                            <div style="margin-bottom: 15px;">
                                <h4 style="color: #333; margin-bottom: 10px;">💡 Recomendações</h4>
                                <div style="background: #e8f5e8; padding: 15px; border-radius: 4px; border: 1px solid #4caf50;">
                                    <ul style="margin: 0; padding-left: 20px; color: #2e7d32;">
                                        ${result.analysis.recommendations.map(rec => `<li style="margin-bottom: 5px;">✓ ${rec}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                            ` : ''}
                            
                            <div style="text-align: right; font-size: 12px; color: #666;">
                                Tempo de processamento: ${result.processingTime}ms
                            </div>
                        </div>
                        `;
                    } else {
                        return `
                        <div class="error-section">
                            <h3>❌ Erro na análise: ${result.contractId}</h3>
                            <p><strong>Erro:</strong> ${result.error || 'Erro desconhecido'}</p>
                        </div>
                        `;
                    }
                }).join('')}
            </div>

            <div class="footer">
                <p>Relatório gerado automaticamente pelo sistema Vivo Contract Insight</p>
                <p>Análise realizada com tecnologia de IA Gemini</p>
            </div>
        </div>
    </body>
    </html>
    `;
  };

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

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Carregando relatório...</p>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Filtros
          </Button>
        </div>
      </div>
    );
  }

  const { results, contracts } = reportData;
  const timestamp = new Date().toLocaleString('pt-BR');
  const totalAnalyzed = results.results.length;
  const successfulAnalyses = results.results.filter(r => !r.error).length;
  const errors = results.results.filter(r => r.error);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com ações */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Filtros
            </Button>
            <h1 className="text-xl font-bold text-vivo-purple">
              Relatório de Análise de Contratos
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button onClick={handlePrintReport} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={handleDownloadReport} className="bg-vivo-purple hover:bg-vivo-purple/90">
              <Download className="mr-2 h-4 w-4" />
              Baixar HTML
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo do relatório */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header do relatório */}
          <div className="text-center border-b border-gray-200 pb-6 mb-8">
            <h1 className="text-3xl font-bold text-vivo-purple mb-2">
              📋 Relatório de Análise de Contratos
            </h1>
            <p className="text-gray-600">Gerado em: {timestamp}</p>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-vivo-purple">
              <h3 className="font-semibold text-gray-700 mb-2">📊 Total de Contratos</h3>
              <p className="text-3xl font-bold text-vivo-purple">{contracts.length}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-green-500">
              <h3 className="font-semibold text-gray-700 mb-2">✅ Análises Realizadas</h3>
              <p className="text-3xl font-bold text-green-600">{totalAnalyzed}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-gray-700 mb-2">🎯 Taxa de Sucesso</h3>
              <p className={`text-3xl font-bold ${successfulAnalyses === totalAnalyzed ? 'text-green-600' : 'text-yellow-600'}`}>
                {Math.round((successfulAnalyses / totalAnalyzed) * 100)}%
              </p>
            </div>
            {errors.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-red-500">
                <h3 className="font-semibold text-gray-700 mb-2">⚠️ Erros</h3>
                <p className="text-3xl font-bold text-red-600">{errors.length}</p>
              </div>
            )}
          </div>

          {/* Dashboard de Gráficos */}
          <DashboardCharts 
            contracts={contracts} 
            analysisResults={results} 
          />

          {/* Análise consolidada */}
          {results.summary && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
                🔍 Resumo da Análise
              </h2>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {results.summary}
              </div>
            </div>
          )}

          {/* Análises individuais */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-300">
              📑 Análises Individuais
            </h2>
            <div className="space-y-6">
              {results.results.map((result, index) => {
                const contract = contracts.find(c => c.numero_contrato === result.contractId);
                
                if (!result.error && result.analysis) {
                  return (
                    <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-vivo-purple mb-4 flex items-center">
                        📄 Contrato: {result.contractId}
                        <span className="ml-auto text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Score: {result.analysis.score || 'N/A'}/100
                        </span>
                      </h3>
                      
                      {contract && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded">
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Fornecedor</span>
                            <p className="font-medium">{contract.fornecedor || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Valor</span>
                            <p className="font-medium text-green-600">R$ {(contract.valor_contrato || 0).toLocaleString('pt-BR')}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                            <p className="font-medium">{contract.status || 'N/A'}</p>
                          </div>
                        </div>
                      )}

                      {/* Resumo Executivo */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
                          📋 Resumo Executivo
                        </h4>
                        <div className="p-4 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="text-gray-700 leading-relaxed">
                            {result.analysis.summary}
                          </p>
                        </div>
                      </div>

                      {/* Termos Principais */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                          🔑 Termos Principais
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-green-50 rounded">
                            <span className="text-xs text-green-600 uppercase tracking-wide font-semibold">Partes Envolvidas</span>
                            <div className="mt-1">
                              {result.analysis.keyTerms.parties.map((party, idx) => (
                                <span key={idx} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                                  {party}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded">
                            <span className="text-xs text-purple-600 uppercase tracking-wide font-semibold">Valor</span>
                            <p className="text-purple-800 font-medium">{result.analysis.keyTerms.value}</p>
                          </div>
                          <div className="p-3 bg-yellow-50 rounded">
                            <span className="text-xs text-yellow-600 uppercase tracking-wide font-semibold">Data Início</span>
                            <p className="text-yellow-800 font-medium">{result.analysis.keyTerms.startDate}</p>
                          </div>
                          <div className="p-3 bg-orange-50 rounded">
                            <span className="text-xs text-orange-600 uppercase tracking-wide font-semibold">Data Fim</span>
                            <p className="text-orange-800 font-medium">{result.analysis.keyTerms.endDate}</p>
                          </div>
                        </div>
                      </div>

                      {/* Análise de Riscos */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                          ⚠️ Análise de Riscos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {result.analysis.riskAnalysis.highRisk.length > 0 && (
                            <div className="p-3 bg-red-50 rounded border border-red-200">
                              <h5 className="text-sm font-semibold text-red-700 mb-2">🔴 Alto Risco</h5>
                              <ul className="text-sm text-red-600">
                                {result.analysis.riskAnalysis.highRisk.map((risk, idx) => (
                                  <li key={idx} className="mb-1">• {risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.analysis.riskAnalysis.mediumRisk.length > 0 && (
                            <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                              <h5 className="text-sm font-semibold text-yellow-700 mb-2">🟡 Médio Risco</h5>
                              <ul className="text-sm text-yellow-600">
                                {result.analysis.riskAnalysis.mediumRisk.map((risk, idx) => (
                                  <li key={idx} className="mb-1">• {risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.analysis.riskAnalysis.lowRisk.length > 0 && (
                            <div className="p-3 bg-green-50 rounded border border-green-200">
                              <h5 className="text-sm font-semibold text-green-700 mb-2">🟢 Baixo Risco</h5>
                              <ul className="text-sm text-green-600">
                                {result.analysis.riskAnalysis.lowRisk.map((risk, idx) => (
                                  <li key={idx} className="mb-1">• {risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cláusulas Identificadas */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                          📝 Cláusulas Identificadas
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.analysis.clauses.payment.length > 0 && (
                            <div className="p-3 bg-blue-50 rounded">
                              <h5 className="text-sm font-semibold text-blue-700 mb-2">💳 Pagamento</h5>
                              <ul className="text-sm text-blue-600">
                                {result.analysis.clauses.payment.map((clause, idx) => (
                                  <li key={idx} className="mb-1">• {clause}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.analysis.clauses.termination.length > 0 && (
                            <div className="p-3 bg-red-50 rounded">
                              <h5 className="text-sm font-semibold text-red-700 mb-2">🚫 Rescisão</h5>
                              <ul className="text-sm text-red-600">
                                {result.analysis.clauses.termination.map((clause, idx) => (
                                  <li key={idx} className="mb-1">• {clause}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.analysis.clauses.liability.length > 0 && (
                            <div className="p-3 bg-purple-50 rounded">
                              <h5 className="text-sm font-semibold text-purple-700 mb-2">⚖️ Responsabilidade</h5>
                              <ul className="text-sm text-purple-600">
                                {result.analysis.clauses.liability.map((clause, idx) => (
                                  <li key={idx} className="mb-1">• {clause}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.analysis.clauses.other.length > 0 && (
                            <div className="p-3 bg-gray-50 rounded">
                              <h5 className="text-sm font-semibold text-gray-700 mb-2">📄 Outras</h5>
                              <ul className="text-sm text-gray-600">
                                {result.analysis.clauses.other.map((clause, idx) => (
                                  <li key={idx} className="mb-1">• {clause}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recomendações */}
                      {result.analysis.recommendations.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                            💡 Recomendações
                          </h4>
                          <div className="p-4 bg-green-50 rounded border border-green-200">
                            <ul className="text-sm text-green-700">
                              {result.analysis.recommendations.map((rec, idx) => (
                                <li key={idx} className="mb-2 flex items-start">
                                  <span className="text-green-500 mr-2">✓</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Tempo de Processamento */}
                      <div className="text-xs text-gray-500 text-right">
                        Tempo de processamento: {result.processingTime}ms
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={index} className="bg-red-50 p-6 rounded-lg border border-red-200">
                      <h3 className="text-lg font-semibold text-red-700 mb-2">
                        ❌ Erro na análise: {result.contractId}
                      </h3>
                      <p className="text-red-600">
                        <strong>Erro:</strong> {result.error || 'Erro desconhecido'}
                      </p>
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-gray-200 text-gray-600">
            <p>Relatório gerado automaticamente pelo sistema Vivo Contract Insight</p>
            <p className="text-sm">Análise realizada com tecnologia de IA Gemini</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;