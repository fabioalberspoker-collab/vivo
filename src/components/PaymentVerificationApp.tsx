import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Plus, Brain, Loader2 } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      
      // Verificar se há filtros ativos (incluindo filtros personalizados)
      const hasStandardFilters = Object.values(activeFilters).some(filter => 
        Array.isArray(filter) ? filter.length > 0 : 
        filter && typeof filter === 'object' ? Object.values(filter).some(v => v !== null && v !== undefined) :
        filter !== null && filter !== undefined
      );
      
      // Verificar se há filtros personalizados ativos
      const hasCustomFilters = Object.keys(customFilterValues).length > 0 && 
        Object.values(customFilterValues).some(value => 
          value !== null && value !== undefined && value !== '' &&
          !(Array.isArray(value) && value.length === 0)
        );
      
      const hasActiveFilters = hasStandardFilters || hasCustomFilters;
      
      let selectedContracts;
      
      if (hasCustomFilters) {
        // ESTRATÉGIA PARA FILTROS PERSONALIZADOS: 
        // Buscar contratos filtrados diretamente do Supabase e aplicar IA
        console.log('🔍 NOVA ESTRATÉGIA: Buscando contratos filtrados diretamente do Supabase...');
        
        try {
          // Construir query do Supabase com todos os filtros
          let query = supabase.from('contracts').select('*');

          // Aplicar filtros padrão
          if (flowType.length > 0) {
            query = query.in('tipo_fluxo', flowType);
          }

          if (supplierName.trim()) {
            query = query.ilike('fornecedor', `%${supplierName}%`);
          }

          if (contractNumber.trim()) {
            query = query.ilike('numero_contrato', `%${contractNumber}%`);
          }

          if (contractValue[0] > 0 || contractValue[1] < 10000000) {
            query = query.gte('valor_contrato', contractValue[0])
                       .lte('valor_contrato', contractValue[1]);
          }

          if (region.trim()) {
            query = query.ilike('regiao', `%${region}%`);
          }

          if (selectedStates.length > 0) {
            const conditions = selectedStates.map(state => `estado.ilike.%${state}%`);
            query = query.or(conditions.join(','));
          }

          // Aplicar filtros de data
          if (dueDate) {
            const today = new Date().toISOString().split('T')[0];
            
            switch (dueDate) {
              case 'overdue': {
                query = query.lt('data_vencimento', today);
                break;
              }
              case 'next7days': {
                const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                query = query.gte('data_vencimento', today).lte('data_vencimento', next7Days);
                break;
              }
              case 'next30days': {
                const next30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                query = query.gte('data_vencimento', today).lte('data_vencimento', next30Days);
                break;
              }
              case 'custom': {
                if (customStart && customEnd) {
                  query = query.gte('data_vencimento', customStart).lte('data_vencimento', customEnd);
                }
                break;
              }
            }
          }

          // Aplicar filtros personalizados
          if (customFilters && customFilterValues) {
            const customFiltersArray = customFilters as Array<{
              id: string;
              name: string;
              type: string;
              table: string;
              field: string;
              options?: string[];
            }>;

            customFiltersArray.forEach((filter) => {
              const filterValue = customFilterValues[filter.id];
              
              if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
                console.log(`🔧 Aplicando filtro personalizado: ${filter.name} = ${filterValue} no campo ${filter.field}`);
                
                switch (filter.type) {
                  case 'Dropdown':
                    if (Array.isArray(filterValue) && filterValue.length > 0) {
                      // Para campos que podem ter acentos, usar OR com ilike
                      if (['risco', 'prioridade', 'area_responsavel', 'status'].includes(filter.field)) {
                        const conditions = filterValue.map(val => `${filter.field}.ilike.%${val}%`);
                        query = query.or(conditions.join(','));
                      } else {
                        query = query.in(filter.field, filterValue);
                      }
                    } else if (typeof filterValue === 'string' && filterValue.trim()) {
                      if (['risco', 'prioridade', 'area_responsavel', 'status'].includes(filter.field)) {
                        query = query.ilike(filter.field, `%${filterValue}%`);
                      } else {
                        query = query.eq(filter.field, filterValue);
                      }
                    }
                    break;
                  case 'Input':
                    if (typeof filterValue === 'string' && filterValue.trim()) {
                      query = query.ilike(filter.field, `%${filterValue}%`);
                    }
                    break;
                  case 'Date':
                    if (typeof filterValue === 'string' && filterValue.trim()) {
                      query = query.eq(filter.field, filterValue);
                    }
                    break;
                  case 'Number':
                    if (typeof filterValue === 'number' || (typeof filterValue === 'string' && !isNaN(Number(filterValue)))) {
                      query = query.eq(filter.field, Number(filterValue));
                    }
                    break;
                }
              }
            });
          }

          // Buscar dados filtrados
          const { data: filteredData, error } = await query;
          
          if (error) {
            console.error('❌ Erro ao buscar contratos filtrados:', error);
            throw new Error(`Erro ao buscar contratos: ${error.message}`);
          }
          
          const filteredContracts = filteredData || [];
          console.log(`📊 ${filteredContracts.length} contratos encontrados após filtros via Supabase`);
          
          if (filteredContracts.length === 0) {
            toast({
              title: "Nenhum Contrato Encontrado",
              description: "Os filtros aplicados não retornaram nenhum contrato. Ajuste os critérios de filtro.",
              variant: "destructive"
            });
            return;
          }

          // Aplicar seleção inteligente nos contratos filtrados
          // usando o MESMO algoritmo da IA real
          console.log('🚀 MODO IA REAL: Aplicando algoritmo completo da IA em contratos filtrados');
          selectedContracts = applyRealAIAlgorithmToFiltered(filteredContracts, targetSampleSize);
          
        } catch (error) {
          console.error('❌ Erro na busca de contratos filtrados:', error);
          toast({
            title: "Erro na Análise",
            description: "Não foi possível buscar os contratos filtrados. Tente novamente.",
            variant: "destructive"
          });
          return;
        }
        
      } else if (hasStandardFilters) {
        // FILTROS PADRÃO: A IA consegue processar diretamente
        console.log('🧠 Usando IA com filtros padrão...');
        selectedContracts = await selectRepresentativeSample(targetSampleSize, activeFilters);
        
      } else {
        // SEM FILTROS: Análise normal da IA
        console.log('🧠 Usando IA sem filtros...');
        selectedContracts = await selectRepresentativeSample(targetSampleSize);
      }
      
      // Função que replica EXATAMENTE o algoritmo da IA real
      function applyRealAIAlgorithmToFiltered(
        filteredContracts: ContractFromDB[], 
        targetSize: number
      ): ContractFromDB[] {
        console.log('🧠 Aplicando algoritmo real da IA nos contratos filtrados...');
        console.log(`📊 Entrada: ${filteredContracts.length} contratos filtrados, alvo: ${targetSize} contratos`);
        
        if (filteredContracts.length <= targetSize) {
          console.log('✅ Número de contratos filtrados <= alvo, retornando todos');
          return filteredContracts;
        }
        
        // ETAPA 1: Análise de Diversidade (igual à IA real)
        console.log('🔍 ETAPA 1: Analisando diversidade por categorias...');
        const analysis = analyzeDiversityCriteria(filteredContracts);
        console.log(`📋 Categorias encontradas: ${analysis.regions.size} regiões, ${analysis.flowTypes.size} tipos de fluxo, ${analysis.statuses.size} status, ${analysis.areas.size} áreas`);
        
        // ETAPA 2: Seleção Inteligente (igual à IA real)
        console.log('⚡ ETAPA 2: Executando seleção inteligente...');
        const result = performIntelligentSelection(filteredContracts, analysis, targetSize);
        console.log(`✨ IA REAL concluída: ${result.length} contratos selecionados com máxima diversidade`);
        return result;
      }
      
      // Análise de diversidade (replicando a IA)
      function analyzeDiversityCriteria(contracts: ContractFromDB[]) {
        const analysis = {
          regions: new Map<string, ContractFromDB[]>(),
          flowTypes: new Map<string, ContractFromDB[]>(),
          statuses: new Map<string, ContractFromDB[]>(),
          areas: new Map<string, ContractFromDB[]>(),
          valueRanges: new Map<string, ContractFromDB[]>(),
          suppliers: new Map<string, ContractFromDB[]>(),
          dueDateRanges: new Map<string, ContractFromDB[]>(),
          riskLevels: new Map<string, ContractFromDB[]>()
        };
        
        contracts.forEach(contract => {
          // Agrupar por região
          const region = contract.regiao || 'Sem Região';
          if (!analysis.regions.has(region)) analysis.regions.set(region, []);
          analysis.regions.get(region)?.push(contract);
          
          // Agrupar por tipo de fluxo
          const flowType = contract.tipo_fluxo || 'Sem Tipo';
          if (!analysis.flowTypes.has(flowType)) analysis.flowTypes.set(flowType, []);
          analysis.flowTypes.get(flowType)?.push(contract);
          
          // Agrupar por status
          const status = contract.status || 'Sem Status';
          if (!analysis.statuses.has(status)) analysis.statuses.set(status, []);
          analysis.statuses.get(status)?.push(contract);
          
          // Agrupar por área
          const area = contract.area_responsavel || 'Sem Área';
          if (!analysis.areas.has(area)) analysis.areas.set(area, []);
          analysis.areas.get(area)?.push(contract);
        });
        
        return analysis;
      }
      
      // Seleção inteligente (replicando a IA)
      function performIntelligentSelection(
        allContracts: ContractFromDB[],
        analysis: {
          regions: Map<string, ContractFromDB[]>;
          flowTypes: Map<string, ContractFromDB[]>;
          statuses: Map<string, ContractFromDB[]>;
          areas: Map<string, ContractFromDB[]>;
        },
        targetSize: number
      ): ContractFromDB[] {
        console.log('📊 Executando seleção inteligente com diversidade máxima...');
        console.log(`🎯 Meta: selecionar ${targetSize} de ${allContracts.length} contratos disponíveis`);
        
        if (targetSize >= allContracts.length) {
          console.log('✅ Target >= total, retornando todos os contratos');
          return [...allContracts];
        }
        
        const selectedContracts = new Set<ContractFromDB>();
        const selectedIds = new Set<string>();
        
        // FASE 1: Garantir pelo menos 1 contrato de cada categoria principal
        console.log('🔥 FASE 1: Garantindo representatividade por categoria...');
        const mainCategories = [analysis.regions, analysis.flowTypes, analysis.statuses, analysis.areas];
        
        mainCategories.forEach((categoryMap, index) => {
          const categoryName = ['regiões', 'tipos de fluxo', 'status', 'áreas'][index];
          console.log(`  └─ Processando categoria: ${categoryName} (${categoryMap.size} grupos)`);
          
          if (selectedContracts.size >= targetSize) return;
          
          for (const [categoryValue, contracts] of categoryMap) {
            if (selectedContracts.size >= targetSize) break;
            
            const representative = selectMostRepresentative(contracts, selectedIds);
            if (representative && !selectedIds.has(representative.numero_contrato || '')) {
              selectedContracts.add(representative);
              selectedIds.add(representative.numero_contrato || '');
              console.log(`     ✓ Selecionado representativo para ${categoryName}="${categoryValue}": ${representative.numero_contrato}`);
            }
          }
        });
        
        console.log(`🎯 FASE 1 concluída: ${selectedContracts.size} contratos selecionados por representatividade`);
        
        // FASE 2: Preencher slots restantes com diversidade máxima
        const remainingSlots = targetSize - selectedContracts.size;
        console.log(`🚀 FASE 2: Preenchendo ${remainingSlots} slots com diversidade máxima...`);
        
        if (remainingSlots > 0) {
          const unselectedContracts = allContracts.filter(
            contract => !selectedIds.has(contract.numero_contrato || '')
          );
          
          // Ordenar por score de diversidade
          const diversityScored = unselectedContracts.map(contract => ({
            contract,
            diversityScore: calculateDiversityScore(contract, selectedContracts)
          }));
          
          diversityScored.sort((a, b) => b.diversityScore - a.diversityScore);
          console.log(`📊 Top 3 contratos por diversidade: ${diversityScored.slice(0,3).map((item, i) => `${i+1}° ${item.contract.numero_contrato}(${item.diversityScore}pts)`).join(', ')}`);
          
          // Selecionar os mais diversos
          for (let i = 0; i < Math.min(remainingSlots, diversityScored.length); i++) {
            selectedContracts.add(diversityScored[i].contract);
            console.log(`     ✓ Adicionado por diversidade: ${diversityScored[i].contract.numero_contrato} (${diversityScored[i].diversityScore}pts)`);
          }
        }
        
        console.log(`✅ Seleção inteligente concluída: ${selectedContracts.size}/${targetSize} contratos selecionados`);
        return Array.from(selectedContracts);
      }
      
      // Selecionar mais representativo de uma categoria
      function selectMostRepresentative(
        contracts: ContractFromDB[],
        excludeIds: Set<string>
      ): ContractFromDB | null {
        const available = contracts.filter(
          contract => !excludeIds.has(contract.numero_contrato || '')
        );
        
        if (available.length === 0) return null;
        if (available.length === 1) return available[0];
        
        return available.reduce((best, current) => {
          const bestScore = getRepresentativeScore(best);
          const currentScore = getRepresentativeScore(current);
          return currentScore > bestScore ? current : best;
        });
      }
      
      // Score de representatividade
      function getRepresentativeScore(contract: ContractFromDB): number {
        let score = 0;
        
        const value = contract.valor_contrato || 0;
        if (value > 10000 && value < 1000000) score += 2;
        else if (value > 0) score += 1;
        
        if (contract.data_vencimento) score += 1;
        if (contract.area_responsavel && contract.area_responsavel !== 'Não Informado') score += 1;
        if (contract.fornecedor && contract.fornecedor !== 'Não Informado') score += 1;
        
        return score;
      }
      
      // Score de diversidade (igual à IA real)
      function calculateDiversityScore(
        contract: ContractFromDB,
        alreadySelected: Set<ContractFromDB>
      ): number {
        let score = 0;
        const selectedArray = Array.from(alreadySelected);
        
        // Score por região (prioriza regiões menos representadas)
        const regionCount = selectedArray.filter(c => c.regiao === contract.regiao).length;
        score += regionCount === 0 ? 10 : Math.max(1, 10 - regionCount);
        
        // Score por tipo de fluxo
        const flowCount = selectedArray.filter(c => c.tipo_fluxo === contract.tipo_fluxo).length;
        score += flowCount === 0 ? 10 : Math.max(1, 10 - flowCount);
        
        // Score por status
        const statusCount = selectedArray.filter(c => c.status === contract.status).length;
        score += statusCount === 0 ? 8 : Math.max(1, 8 - statusCount);
        
        // Score por área
        const areaCount = selectedArray.filter(c => c.area_responsavel === contract.area_responsavel).length;
        score += areaCount === 0 ? 6 : Math.max(1, 6 - areaCount);
        
        // Bonus por combinação única
        const uniqueCombination = selectedArray.filter(c => 
          c.regiao === contract.regiao && 
          c.tipo_fluxo === contract.tipo_fluxo && 
          c.status === contract.status
        ).length;
        
        if (uniqueCombination === 0) score += 15; // Grande bonus por combinação única
        
        return score;
      }
      
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
