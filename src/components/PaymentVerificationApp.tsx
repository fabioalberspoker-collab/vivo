import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import Header from "./Header";
import FilterContainer from "./FilterContainer";
import FlowTypeFilter from "./filters/FlowTypeFilter";
import ValueRangeFilter from "./filters/ValueRangeFilter";
import LocationFilter from "./filters/LocationFilter";
import DueDateFilter from "./filters/DueDateFilter";
import SupplierFilter from "./filters/SupplierFilter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ContractsTable from "./ContractsTable";
import CreateFilterModal from "./CreateFilterModal";
import CustomFilterRenderer from "./CustomFilterRenderer";
import { useCustomFilters } from "@/hooks/useCustomFilters";
import { useContractFilters, ContractFromDB } from "@/hooks/useContractFilters";

const PaymentVerificationApp = () => {
  const { toast } = useToast();
  const { customFilters, addFilter, removeFilter, isLoading: filtersLoading } = useCustomFilters();
  const { contracts, isLoading, applyFilters } = useContractFilters();
  
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
            
            <Button onClick={resetFilters} variant="outline">
              Limpar Filtros
            </Button>
          </div>
        </div>
        
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