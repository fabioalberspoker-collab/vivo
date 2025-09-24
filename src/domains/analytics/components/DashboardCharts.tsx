import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { Contract } from '@/data/mockContracts';
import type { BatchAnalysisResult } from '@/services/ai/contractAnalysisService';

interface DashboardChartsProps {
  contracts: Contract[];
  analysisResults: BatchAnalysisResult;
}

// Cores definidas para os gráficos
const CHART_COLORS = ['#660099', '#004fd0', '#0078ec', '#0099ee', '#00b7da', '#00d1bc'];

// Cores específicas para riscos
const RISK_COLORS = {
  'Alto Risco': '#dc2626',   // Vermelho
  'Médio Risco': '#f59e0b',  // Amarelo
  'Baixo Risco': '#10b981'   // Verde
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ contracts, analysisResults }) => {
  
  // Função para processar dados de risco
  const processRiskData = () => {
    const riskCounts = { 'Alto Risco': 0, 'Médio Risco': 0, 'Baixo Risco': 0 };
    
    analysisResults.results.forEach(result => {
      const analysis = result.analysis;
      
      if (analysis.riskAnalysis.highRisk.length > 0) {
        riskCounts['Alto Risco']++;
      } else if (analysis.riskAnalysis.mediumRisk.length > 0) {
        riskCounts['Médio Risco']++;
      } else {
        riskCounts['Baixo Risco']++;
      }
    });
    
    return Object.entries(riskCounts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value, color: RISK_COLORS[name as keyof typeof RISK_COLORS] }));
  };

  // Função para processar dados por tipo de fluxo
  const processFlowTypeData = () => {
    const flowCounts: Record<string, number> = {};
    
    contracts.forEach(contract => {
      const flow = contract.flowType || 'Não especificado';
      flowCounts[flow] = (flowCounts[flow] || 0) + 1;
    });
    
    return Object.entries(flowCounts)
      .map(([name, value], index) => ({ 
        name, 
        value, 
        color: CHART_COLORS[index % CHART_COLORS.length] 
      }));
  };

  // Função para processar dados por localização (área responsável)
  const processLocationData = () => {
    const locationCounts: Record<string, number> = {};
    
    contracts.forEach(contract => {
      const location = contract.region || 'Não especificado';
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });
    
    return Object.entries(locationCounts)
      .map(([name, value], index) => ({ 
        name, 
        value, 
        color: CHART_COLORS[index % CHART_COLORS.length] 
      }));
  };

  // Função para processar dados por status
  const processStatusData = () => {
    const statusCounts: Record<string, number> = {};
    
    contracts.forEach(contract => {
      const status = contract.status || 'Ativo';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts)
      .map(([name, value], index) => ({ 
        name, 
        value, 
        color: CHART_COLORS[index % CHART_COLORS.length] 
      }));
  };

  // Função para processar dados por faixa de valor de contrato
  const processContractValueData = () => {
    const valueCounts = {
      '0 - 10K': 0,
      '10K - 100K': 0,
      '100K - 1M': 0,
      '1M - 5M': 0,
      '5M - 10M': 0,
      '10M+': 0
    };
    
    contracts.forEach(contract => {
      const value = contract.value || 0;
      
      if (value <= 10000) {
        valueCounts['0 - 10K']++;
      } else if (value <= 100000) {
        valueCounts['10K - 100K']++;
      } else if (value <= 1000000) {
        valueCounts['100K - 1M']++;
      } else if (value <= 5000000) {
        valueCounts['1M - 5M']++;
      } else if (value <= 10000000) {
        valueCounts['5M - 10M']++;
      } else {
        valueCounts['10M+']++;
      }
    });
    
    return Object.entries(valueCounts)
      .filter(([, value]) => value > 0)
      .map(([name, value], index) => ({ 
        name, 
        value, 
        color: CHART_COLORS[index % CHART_COLORS.length] 
      }));
  };

  // Função para processar dados por status de pagamento (baseado na proximidade do vencimento)
  const processPaymentStatusData = () => {
    const today = new Date();
    const paymentCounts = {
      'Em dia': 0,
      'Próximo ao vencimento': 0,
      'Vencido': 0
    };
    
    contracts.forEach(contract => {
      if (contract.dueDate) {
        const dueDate = new Date(contract.dueDate);
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays < 0) {
          paymentCounts['Vencido']++;
        } else if (diffDays <= 30) {
          paymentCounts['Próximo ao vencimento']++;
        } else {
          paymentCounts['Em dia']++;
        }
      } else {
        paymentCounts['Em dia']++;
      }
    });
    
    return Object.entries(paymentCounts)
      .filter(([, value]) => value > 0)
      .map(([name, value], index) => {
        const colors = {
          'Em dia': '#10b981',
          'Próximo ao vencimento': '#f59e0b',
          'Vencido': '#dc2626'
        };
        return { name, value, color: colors[name as keyof typeof colors] };
      });
  };

  // Função para processar dados por faixa de valor de pagamento (mesmo que contrato por enquanto)
  const processPaymentValueData = () => {
    return processContractValueData(); // Reutilizando a mesma lógica
  };

  // Componente reutilizável para gráfico de pizza
  const PieChartComponent: React.FC<{ 
    data: Array<{ name: string; value: number; color: string }>;
    title: string;
    description: string;
  }> = ({ data, title, description }) => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value} contrato${value !== 1 ? 's' : ''}`,
                  name
                ]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value: string) => value}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const riskData = processRiskData();
  const flowTypeData = processFlowTypeData();
  const locationData = processLocationData();
  const statusData = processStatusData();
  const contractValueData = processContractValueData();
  const paymentStatusData = processPaymentStatusData();
  const paymentValueData = processPaymentValueData();

  return (
    <div className="w-full mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard de Análise</h2>
        <p className="text-gray-600">Visão geral dos contratos analisados</p>
      </div>
      
      <Tabs defaultValue="risk" className="w-full">
        <div className="flex gap-6">
          {/* Abas laterais */}
          <div className="w-64 flex-shrink-0">
            <TabsList className="flex flex-col h-auto w-full bg-white border border-gray-200 p-1">
              <TabsTrigger 
                value="risk" 
                className="w-full justify-start text-left p-3 data-[state=active]:bg-[#660099] data-[state=active]:text-white"
              >
                <div>
                  <div className="font-medium">Análise de Riscos</div>
                  <div className="text-xs opacity-75">Distribuição por nível de risco</div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="flow" 
                className="w-full justify-start text-left p-3 data-[state=active]:bg-[#004fd0] data-[state=active]:text-white"
              >
                <div>
                  <div className="font-medium">Tipo de Fluxo</div>
                  <div className="text-xs opacity-75">Por tipo de contrato</div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="location" 
                className="w-full justify-start text-left p-3 data-[state=active]:bg-[#0078ec] data-[state=active]:text-white"
              >
                <div>
                  <div className="font-medium">Área Responsável</div>
                  <div className="text-xs opacity-75">Por localização</div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="payment-status" 
                className="w-full justify-start text-left p-3 data-[state=active]:bg-[#0099ee] data-[state=active]:text-white"
              >
                <div>
                  <div className="font-medium">Status Pagamento</div>
                  <div className="text-xs opacity-75">Situação dos vencimentos</div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="contract-value" 
                className="w-full justify-start text-left p-3 data-[state=active]:bg-[#00b7da] data-[state=active]:text-white"
              >
                <div>
                  <div className="font-medium">Valor Contrato</div>
                  <div className="text-xs opacity-75">Faixas de valor</div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="payment-value" 
                className="w-full justify-start text-left p-3 data-[state=active]:bg-[#00d1bc] data-[state=active]:text-white"
              >
                <div>
                  <div className="font-medium">Valor Pagamento</div>
                  <div className="text-xs opacity-75">Faixas de pagamento</div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="status" 
                className="w-full justify-start text-left p-3 data-[state=active]:bg-[#660099] data-[state=active]:text-white"
              >
                <div>
                  <div className="font-medium">Status Contratos</div>
                  <div className="text-xs opacity-75">Status atual</div>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Área do gráfico */}
          <div className="flex-1">
            <TabsContent value="risk" className="mt-0">
              <PieChartComponent
                data={riskData}
                title="Análise de Riscos"
                description="Distribuição dos contratos por nível de risco"
              />
            </TabsContent>
            
            <TabsContent value="flow" className="mt-0">
              <PieChartComponent
                data={flowTypeData}
                title="Tipos de Fluxo"
                description="Distribuição dos contratos por tipo de fluxo"
              />
            </TabsContent>
            
            <TabsContent value="location" className="mt-0">
              <PieChartComponent
                data={locationData}
                title="Áreas Responsáveis"
                description="Distribuição dos contratos por localização/área"
              />
            </TabsContent>
            
            <TabsContent value="payment-status" className="mt-0">
              <PieChartComponent
                data={paymentStatusData}
                title="Status de Pagamento"
                description="Situação dos pagamentos baseada na proximidade do vencimento"
              />
            </TabsContent>
            
            <TabsContent value="contract-value" className="mt-0">
              <PieChartComponent
                data={contractValueData}
                title="Valor dos Contratos"
                description="Distribuição dos contratos por faixa de valor"
              />
            </TabsContent>
            
            <TabsContent value="payment-value" className="mt-0">
              <PieChartComponent
                data={paymentValueData}
                title="Valor dos Pagamentos"
                description="Distribuição dos pagamentos por faixa de valor"
              />
            </TabsContent>
            
            <TabsContent value="status" className="mt-0">
              <PieChartComponent
                data={statusData}
                title="Status dos Contratos"
                description="Distribuição dos contratos por status atual"
              />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};
