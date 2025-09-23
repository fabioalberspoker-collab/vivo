import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { ContractFromDB } from "@/hooks/useContractFilters";
import { BatchAnalysisResult } from "@/components/integrations/ai/contractAnalysisService";

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
                        <div class="contract-analysis">
                            <h3>📄 Contrato: ${result.contractId}</h3>
                            ${contract ? `
                            <p><strong>Fornecedor:</strong> ${contract.fornecedor || 'N/A'}</p>
                            <p><strong>Valor:</strong> R$ ${(contract.valor_contrato || 0).toLocaleString('pt-BR')}</p>
                            <p><strong>Status:</strong> ${contract.status || 'N/A'}</p>
                            ` : ''}
                            <div style="margin-top: 15px; white-space: pre-wrap; line-height: 1.6;">
                                ${result.analysis.summary.replace(/\n/g, '<br>')}
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
                    <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-vivo-purple mb-3">
                        📄 Contrato: {result.contractId}
                      </h3>
                      {contract && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                          <p><strong>Fornecedor:</strong> {contract.fornecedor || 'N/A'}</p>
                          <p><strong>Valor:</strong> R$ {(contract.valor_contrato || 0).toLocaleString('pt-BR')}</p>
                          <p><strong>Status:</strong> {contract.status || 'N/A'}</p>
                        </div>
                      )}
                      <div className="mt-4 p-4 bg-gray-50 rounded border">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {result.analysis.summary}
                        </div>
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