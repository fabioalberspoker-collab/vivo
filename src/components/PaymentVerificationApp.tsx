import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Plus, Brain, Loader2 } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";

import Header from "@/shared/components/Header";
import FilterContainer from "@/domains/filters/components/FilterContainer";
import FlowTypeFilter from "@/domains/filters/components/filters/FlowTypeFilter";
import ValueRangeFilter from "@/domains/filters/components/filters/ValueRangeFilter";
import LocationFilter from "@/domains/filters/components/filters/LocationFilter";
import DueDateFilter from "@/domains/filters/components/filters/DueDateFilter";
import SupplierFilter from "@/domains/filters/components/filters/SupplierFilter";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import ContractsTable from "@/domains/contracts/components/ContractsTable";
import CreateFilterModal from "@/domains/filters/components/CreateFilterModal";
import CustomFilterRenderer from "@/domains/filters/components/CustomFilterRenderer";
import { useCustomFilters } from "@/domains/filters/hooks/useCustomFilters";
import { useContractFilters, ContractFromDB } from "@/domains/contracts/hooks/useContractFilters";
import { useSmartContractAnalysis } from "@/domains/analytics/hooks/useSmartContractAnalysis";

const PaymentVerificationApp = () => {
  const { toast } = useToast();
  const { customFilters, addFilter, removeFilter, isLoading: filtersLoading } = useCustomFilters();
  const { contracts, isLoading, applyFilters, setContracts } = useContractFilters();
  
  // Smart Contract Analysis Hook
  const { selectRepresentativeSample, isAnalyzing, analysisStatus } = useSmartContractAnalysis();
  
  // Default filter states
  const [flowType, setFlowType] = useState<string[]>([]);
  const [contractValue, setContractValue] = useState<[number, number]>([0, 10000000]);
  const [paymentValue, setPaymentValue] = useState<[number, number]>([0, 10000000]);
  const [region, setRegion] = useState<string>("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>("");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [supplierName, setSupplierName] = useState<string>("");
  const [contractNumber, setContractNumber] = useState<string>("");
  const [contractCount, setContractCount] = useState<number>(10);
  
  // Custom filter values
  const [customFilterValues, setCustomFilterValues] = useState<Record<string, unknown>>({});
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCustomFilterChange = (filterId: string, value: unknown) => {
    setCustomFilterValues(prev => ({
      ...prev,
      [filterId]: value
    }));
  };

  const handleApplyFilters = async () => {
    const filterParams = {
      flowType,
      contractValue,
      paymentValue,
      region,
      selectedStates,
      dueDate,
      customStart,
      customEnd,
      supplierName,
      contractNumber,
      contractCount,
      customFilterValues,
      customFilters
    };

    await applyFilters(filterParams);
  };

  const handleViewContract = (contract: ContractFromDB) => {
    try {
      // Criar um elemento <a> temporário para abrir em nova aba
      const link = document.createElement('a');
      link.href = contract.documento_url || '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Documento Aberto",
        description: `Abrindo documento do contrato ${contract.numero_contrato} em nova aba...`
      });
    } catch (error) {
      toast({
        title: "Erro ao abrir documento",
        description: "Não foi possível abrir o documento. Verifique se a URL está válida.",
        variant: "destructive"
      });
    }
  };

  /**
   * Análise Inteligente de Contratos com Filtros Contextuais
   * 
   * A IA considera os filtros ativos do usuário para selecionar uma amostra representativa
   * apenas dos contratos que atendem aos critérios especificados.
   * 
   * Critérios de diversidade considerados:
   * - Fornecedores e regiões
   * - Tipos de fluxo e valores
   * - Datas de vencimento
   * - Níveis de risco
   */
  const handleSmartAnalysis = async () => {
    try {
      // Usar a quantidade de contratos definida pelo usuário
      const targetSampleSize = contractCount;
      
      // Construir objeto de filtros ativos baseado nos states atuais
      const activeFilters = {
        supplier: selectedStates, // Assumindo que selectedStates representa fornecedores selecionados
        location: selectedStates,
        flowType: flowType,
        dueDate: dueDate ? {
          start: customStart || undefined,
          end: customEnd || undefined
        } : undefined,
        contractValue: (contractValue[0] > 0 || contractValue[1] < 10000000) ? {
          min: contractValue[0],
          max: contractValue[1]
        } : undefined
      };
      
      // Verificar se há filtros ativos
      const hasActiveFilters = Object.values(activeFilters).some(filter => 
        Array.isArray(filter) ? filter.length > 0 : 
        filter && typeof filter === 'object' ? Object.values(filter).some(v => v !== null && v !== undefined) :
        filter !== null && filter !== undefined
      );
      
      // Chamar a IA para seleção representativa (com ou sem filtros)
      const selectedContracts = await selectRepresentativeSample(
        targetSampleSize, 
        hasActiveFilters ? activeFilters : undefined
      );
      
      if (selectedContracts.length > 0) {
        // Atualizar a tabela de contratos filtrados com a seleção inteligente da IA
        setContracts(selectedContracts);
        
        const successMessage = hasActiveFilters 
          ? `${selectedContracts.length} contratos selecionados considerando filtros ativos`
          : `${selectedContracts.length} contratos selecionados com máxima diversidade`;
        
        toast({
          title: "Análise Inteligente Concluída!",
          description: successMessage,
          variant: "default"
        });
        
        console.log('📊 Contratos selecionados pela IA:', selectedContracts);
        
      } else {
        toast({
          title: "Nenhum Contrato Selecionado",
          description: "A IA não conseguiu selecionar contratos. Verifique a base de dados.",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('❌ Erro na análise inteligente:', error);
      toast({
        title: "Erro na Análise",
        description: "Houve um problema durante a seleção inteligente de contratos",
        variant: "destructive"
      });
    }
  };

  const resetFilters = () => {
    setFlowType([]);
    setContractValue([0, 10000000]);
    setPaymentValue([0, 10000000]);
    setRegion("");
    setSelectedStates([]);
    setDueDate("");
    setCustomStart("");
    setCustomEnd("");
    setSupplierName("");
    setContractNumber("");
    setContractCount(10);
    setCustomFilterValues({});
    
    toast({
      title: "Filtros limpos",
      description: "Todos os filtros foram resetados."
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header filteredContracts={contracts} />
      
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Default Filters */}
          <FilterContainer title="Fornecedor">
            <SupplierFilter
              supplierName={supplierName}
              contractNumber={contractNumber}
              onSupplierNameChange={setSupplierName}
              onContractNumberChange={setContractNumber}
            />
          </FilterContainer>
          
          <FilterContainer title="Tipo de Fluxo">
            <FlowTypeFilter value={flowType} onChange={setFlowType} />
          </FilterContainer>
          
          <FilterContainer title="Valor do Contrato">
            <ValueRangeFilter
              title="Valor do Contrato"
              min={0}
              max={10000000}
              value={contractValue}
              onChange={setContractValue}
            />
          </FilterContainer>
          
          <FilterContainer title="Valor do Pagamento">
            <ValueRangeFilter
              title="Valor do Pagamento"
              min={0}
              max={10000000}
              value={paymentValue}
              onChange={setPaymentValue}
            />
          </FilterContainer>
          
          <FilterContainer title="Localização">
            <LocationFilter
              region={region}
              selectedStates={selectedStates}
              onRegionChange={setRegion}
              onStatesChange={setSelectedStates}
            />
          </FilterContainer>
          
          <FilterContainer title="Data de Vencimento">
            <DueDateFilter
              value={dueDate}
              customStart={customStart}
              customEnd={customEnd}
              onChange={setDueDate}
              onCustomStartChange={setCustomStart}
              onCustomEndChange={setCustomEnd}
            />
          </FilterContainer>
          
          {/* Custom Filters */}
          {customFilters.map((filter) => (
            <FilterContainer
              key={filter.id}
              title={filter.name}
              canDelete={true}
              onDelete={() => removeFilter(filter.id)}
            >
              <CustomFilterRenderer
                filter={filter}
                value={customFilterValues[filter.id]}
                onChange={(value) => handleCustomFilterChange(filter.id, value)}
              />
            </FilterContainer>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex justify-start">
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Novos Filtros
            </Button>
          </div>
          
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract-count">Quantidade de Contratos</Label>
              <Input
                id="contract-count"
                type="number"
                min="1"
                max="1000"
                value={contractCount}
                onChange={(e) => setContractCount(parseInt(e.target.value) || 1)}
                placeholder="Quantidade"
                className="w-40"
              />
            </div>
            
            <Button onClick={handleApplyFilters} variant="default" disabled={isLoading || filtersLoading}>
              {isLoading ? "Aplicando..." : "Aplicar Filtros"}
            </Button>
            
            {/* Botão de Análise Inteligente - Seleção Representativa por IA */}
            <Button 
              onClick={handleSmartAnalysis} 
              variant="default"
              disabled={isAnalyzing || isLoading || filtersLoading}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Analisar Melhor Amostra
                </>
              )}
            </Button>
            
            <Button onClick={resetFilters} variant="outline">
              Limpar Filtros
            </Button>
          </div>
        </div>
        
        {/* Status da Análise Inteligente */}
        {isAnalyzing && analysisStatus && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <span className="text-purple-800 font-medium">Análise Inteligente em Andamento</span>
            </div>
            <p className="text-purple-600 text-sm mt-2">{analysisStatus}</p>
          </div>
        )}
        
        {/* Results Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Contratos Filtrados ({contracts.length})
            </h2>
          </div>
          
          <ContractsTable
            contracts={contracts}
            onViewContract={handleViewContract}
          />
        </div>
      </main>
      
      {/* Create Filter Modal */}
      <CreateFilterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addFilter}
      />
    </div>
  );
};

export default PaymentVerificationApp;
