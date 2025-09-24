import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { ContractFromDB } from "@/hooks/useContractFilters";

interface ReportPageState {
  results: any;
  contracts: ContractFromDB[];
}

interface ContractDetailModalProps {
  contract: ContractFromDB | null;
  analysis: any | null;
  isOpen: boolean;
  onClose: () => void;
}

// Chart color palette
const CHART_COLORS = ["#660099", "#004fd0", "#0078ec", "#0099ee", "#00b7da", "#00d1bc"];

// Helper functions for data aggregation
const aggregateRiskData = (results: any[], contracts: ContractFromDB[]) => {
  const riskCounts = { "Baixo Risco": 0, "Médio Risco": 0, "Alto Risco": 0 };
  
  results.forEach((result: any) => {
    if (!result.error && result.analysis?.score) {
      const score = result.analysis.score;
      if (score >= 80) riskCounts["Baixo Risco"]++;
      else if (score >= 50) riskCounts["Médio Risco"]++;
      else riskCounts["Alto Risco"]++;
    }
  });

  return Object.entries(riskCounts).map(([name, value], index) => ({
    name,
    value,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));
};

const aggregateContractTypeData = (contracts: ContractFromDB[]) => {
  const typeCounts: Record<string, number> = {};
  contracts.forEach(contract => {
    const type = contract.tipo_fluxo || "Não Informado";
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  return Object.entries(typeCounts).map(([name, value], index) => ({
    name,
    value,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));
};

const aggregateAreaData = (contracts: ContractFromDB[]) => {
  const areaCounts: Record<string, number> = {};
  contracts.forEach(contract => {
    const area = contract.area_responsavel || "Não Informado";
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  });

  return Object.entries(areaCounts).map(([name, value], index) => ({
    name,
    value,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));
};

const aggregatePaymentStatusData = (contracts: ContractFromDB[]) => {
  const statusCounts: Record<string, number> = {};
  contracts.forEach(contract => {
    const status = contract.status || "Não Informado";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([name, value], index) => ({
    name,
    value,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));
};

const aggregateValueRanges = (contracts: ContractFromDB[], valueField: 'valor_contrato' | 'valor_pagamento') => {
  const ranges = {
    "0 - 10k": 0,
    "10k - 100k": 0,
    "100k - 1M": 0,
    "1M - 5M": 0,
    "5M - 10M": 0,
    "10M+": 0
  };

  contracts.forEach(contract => {
    const value = contract[valueField] || 0;
    if (value <= 10000) ranges["0 - 10k"]++;
    else if (value <= 100000) ranges["10k - 100k"]++;
    else if (value <= 1000000) ranges["100k - 1M"]++;
    else if (value <= 5000000) ranges["1M - 5M"]++;
    else if (value <= 10000000) ranges["5M - 10M"]++;
    else ranges["10M+"]++;
  });

  return Object.entries(ranges).map(([name, value], index) => ({
    name,
    value,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));
};

const aggregateStatusData = (contracts: ContractFromDB[]) => {
  const statusCounts: Record<string, number> = {};
  contracts.forEach(contract => {
    const status = contract.status || "Não Informado";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([name, value], index) => ({
    name,
    value,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));
};

// Chart component
const DashboardChart = ({ data, title }: { data: any[], title: string }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">{title}</h3>
      <div className="flex justify-center items-center h-[300px] w-full">
        <PieChart width={350} height={300}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => [value, "Quantidade"]}
            labelStyle={{ color: '#374151' }}
            contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
          />
          <Legend />
        </PieChart>
      </div>
    </Card>
  );
};

const ContractDetailModal: React.FC<ContractDetailModalProps> = ({ 
  contract, 
  analysis, 
  isOpen, 
  onClose 
}) => {
  if (!contract || !analysis || !analysis.analysis) return null;

  const result = analysis.analysis;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span> Relatório Completo - Contrato {contract.numero_contrato}</span>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Score: {result.score || "N/A"}/100
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Visualize o relatório detalhado de análise do contrato, incluindo informações do fornecedor, valor e resumo executivo gerado pela IA.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Fornecedor</span>
              <p className="font-medium">{contract.fornecedor || "N/A"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Valor</span>
              <p className="font-medium text-green-600">R$ {(contract.valor_contrato || 0).toLocaleString("pt-BR")}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
              <p className="font-medium">{contract.status || "N/A"}</p>
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3"> Resumo Executivo</h4>
            <div className="p-4 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="text-gray-700 leading-relaxed">{result.summary}</p>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-right pt-4 border-t">
            Tempo de processamento: {analysis.processingTime}ms
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Report = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reportData, setReportData] = useState<ReportPageState | null>(null);
  const [selectedContract, setSelectedContract] = useState<{ contract: ContractFromDB | null; analysis: any | null }>({ contract: null, analysis: null });

  useEffect(() => {
    if (location.state && location.state.results && location.state.contracts) {
      setReportData(location.state as ReportPageState);
    } else {
      navigate("/");
    }
  }, [location.state, navigate]);

  const handleGoBack = () => {
    navigate("/");
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
  const timestamp = new Date().toLocaleString("pt-BR");
  const totalAnalyzed = results.results.length;
  const successfulAnalyses = results.results.filter((r: any) => !r.error).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Filtros
            </Button>
            <h1 className="text-xl font-bold text-purple-600">
              Relatório de Análise de Contratos
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center border-b border-gray-200 pb-6 mb-8">
            <h1 className="text-3xl font-bold text-purple-600 mb-2">
               Relatório de Análise de Contratos
            </h1>
            <p className="text-gray-600">Gerado em: {timestamp}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-purple-600">
              <h3 className="font-semibold text-gray-700 mb-2">🔸 Total de Contratos</h3>
              <p className="text-3xl font-bold text-purple-600">{contracts.length}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-green-500">
              <h3 className="font-semibold text-gray-700 mb-2">🔸 Análises Realizadas</h3>
              <p className="text-3xl font-bold text-green-600">{totalAnalyzed}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-gray-700 mb-2">🔸 Taxa de Sucesso</h3>
              <p className={`text-3xl font-bold ${successfulAnalyses === totalAnalyzed ? "text-green-600" : "text-yellow-600"}`}>
                {Math.round((successfulAnalyses / totalAnalyzed) * 100)}%
              </p>
            </div>
          </div>

          {/* Dashboard Charts Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-300">
              📊 Dashboard Analítico
            </h2>
            
            <Tabs defaultValue="risk" className="w-full" orientation="vertical">
              <div className="flex gap-6">
                <TabsList className="flex flex-col h-fit w-48 bg-gray-50">
                  <TabsTrigger value="risk" className="w-full justify-start text-left px-4 py-3">
                    🎯 Riscos
                  </TabsTrigger>
                  <TabsTrigger value="types" className="w-full justify-start text-left px-4 py-3">
                    📋 Tipos
                  </TabsTrigger>
                  <TabsTrigger value="areas" className="w-full justify-start text-left px-4 py-3">
                    🏢 Áreas
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="w-full justify-start text-left px-4 py-3">
                    💳 Pagamento
                  </TabsTrigger>
                  <TabsTrigger value="contract-values" className="w-full justify-start text-left px-4 py-3">
                    💰 Valores Contrato
                  </TabsTrigger>
                  <TabsTrigger value="payment-values" className="w-full justify-start text-left px-4 py-3">
                    💵 Valores Pagamento
                  </TabsTrigger>
                  <TabsTrigger value="status" className="w-full justify-start text-left px-4 py-3">
                    📊 Status
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex-1">
                  <TabsContent value="risk" className="mt-0">
                    <DashboardChart 
                      data={aggregateRiskData(results.results, contracts)} 
                      title="Distribuição por Nível de Risco" 
                    />
                  </TabsContent>
                  
                  <TabsContent value="types" className="mt-0">
                    <DashboardChart 
                      data={aggregateContractTypeData(contracts)} 
                      title="Distribuição por Tipo de Contrato" 
                    />
                  </TabsContent>
                  
                  <TabsContent value="areas" className="mt-0">
                    <DashboardChart 
                      data={aggregateAreaData(contracts)} 
                      title="Distribuição por Área Responsável" 
                    />
                  </TabsContent>
                  
                  <TabsContent value="payment" className="mt-0">
                    <DashboardChart 
                      data={aggregatePaymentStatusData(contracts)} 
                      title="Distribuição por Status de Pagamento" 
                    />
                  </TabsContent>
                  
                  <TabsContent value="contract-values" className="mt-0">
                    <DashboardChart 
                      data={aggregateValueRanges(contracts, 'valor_contrato')} 
                      title="Distribuição por Faixa de Valor do Contrato" 
                    />
                  </TabsContent>
                  
                  <TabsContent value="payment-values" className="mt-0">
                    <DashboardChart 
                      data={aggregateValueRanges(contracts, 'valor_pagamento')} 
                      title="Distribuição por Faixa de Valor de Pagamento" 
                    />
                  </TabsContent>
                  
                  <TabsContent value="status" className="mt-0">
                    <DashboardChart 
                      data={aggregateStatusData(contracts)} 
                      title="Distribuição por Status" 
                    />
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-300">
               Contratos Analisados
            </h2>
            
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número do Contrato</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Tipo de Fluxo</TableHead>
                      <TableHead>Valor do Contrato</TableHead>
                      <TableHead>Valor de Pagamento</TableHead>
                      <TableHead>Região</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Vencimento</TableHead>
                      <TableHead>Score IA</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.results.map((result: any, index: number) => {
                      // Tentar encontrar o contrato correspondente
                      let contract = contracts.find(c => c.numero_contrato === result.contractId);
                      
                      // Se não encontrou, criar contrato básico com dados do resultado
                      if (!contract && result.contractId) {
                        contract = {
                          numero_contrato: result.contractId,
                          fornecedor: 'Fornecedor não identificado',
                          tipo_fluxo: 'N/A',
                          valor_contrato: 0,
                          valor_pagamento: 0,
                          regiao: 'N/A',
                          estado: 'N/A',
                          municipio: 'N/A',
                          status: 'N/A',
                          data_vencimento: null,
                          data_assinatura: null,
                          area_responsavel: 'N/A',
                          prioridade: 'N/A'
                        } as ContractFromDB;
                      }
                      
                      // Mostrar linha para análises bem-sucedidas OU com erro
                      if (contract && (result.analysis || result.error)) {
                        // Se tem erro, mostrar linha de erro
                        if (result.error) {
                          return (
                            <TableRow key={result.contractId || index} className="bg-red-50">
                              <TableCell className="font-mono">{contract.numero_contrato}</TableCell>
                              <TableCell colSpan={9} className="text-red-600">
                                <strong>Erro:</strong> {result.error || "Erro desconhecido"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="destructive">Erro</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        // Linha normal para análises bem-sucedidas
                        return (
                          <TableRow key={contract.numero_contrato || index}>
                            <TableCell className="font-mono">{contract.numero_contrato}</TableCell>
                            <TableCell>{contract.fornecedor}</TableCell>
                            <TableCell>{contract.tipo_fluxo}</TableCell>
                            <TableCell className="font-medium">
                              R$ {(contract.valor_contrato || 0).toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell className="font-medium">
                              R$ {(contract.valor_pagamento || 0).toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell>{contract.regiao}</TableCell>
                            <TableCell>{contract.estado}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  contract.status === "Pago" ? "default" :
                                  contract.status === "Pendente" ? "secondary" :
                                  contract.status === "Vencido" ? "destructive" : "outline"
                                }
                                className={
                                  contract.status === "Pago" ? "bg-green-500 text-white" :
                                  contract.status === "Pendente" ? "bg-yellow-500 text-white" :
                                  contract.status === "Vencido" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-800"
                                }
                              >
                                {contract.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {contract.data_vencimento ? new Date(contract.data_vencimento).toLocaleDateString("pt-BR") : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                {result.analysis.score || "N/A"}/100
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedContract({ contract, analysis: result })}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                title="Ver relatório completo"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return null;
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          <ContractDetailModal
            contract={selectedContract.contract}
            analysis={selectedContract.analysis}
            isOpen={!!selectedContract.contract && !!selectedContract.analysis}
            onClose={() => setSelectedContract({ contract: null, analysis: null })}
          />

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
