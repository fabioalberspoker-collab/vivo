import { useState, useEffect } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { normalizeForComparison, normalizeFieldValue } from "@/lib/textUtils";

export interface FilterParams {
  flowType: string[];
  contractValue: [number, number];
  supplierName: string;
  contractNumber: string;
  contractCount: number;
  region: string;
  selectedStates: string[];
  dueDate: string;
  customStart: string;
  customEnd: string;
  paymentValue: [number, number];
  customFilterValues: Record<string, unknown>;
  customFilters: unknown[];
}

// Interface para dados reais da tabela 'contracts' no Supabase
export interface ContractFromDB {
  numero_contrato: string;
  fornecedor: string;
  tipo_fluxo: string;
  valor_contrato: number;
  valor_pagamento: number;
  regiao: string;
  estado: string;
  municipio: string;
  data_assinatura: string;
  data_vencimento: string;
  data_pagamento?: string;
  area_responsavel: string;
  status: string;
  prioridade: string;
  risco: string;
  responsavel: string;
  documento_url?: string;
}

export const useContractFilters = () => {
  const [contracts, setContracts] = useState<ContractFromDB[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Carregar contratos iniciais
  useEffect(() => {
    const loadInitialContracts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*')
          .limit(10);

        if (error) {
          console.error("❌ [SUPABASE] Erro ao carregar da tabela 'contracts':", error);
          
          // Fallback: usar dados mock para demonstração
          const mockData: ContractFromDB[] = [
            {
              numero_contrato: 'CT-2024-001',
              fornecedor: 'Tech Solutions Ltda',
              tipo_fluxo: 'Infraestrutura',
              valor_contrato: 150000,
              valor_pagamento: 150000,
              regiao: 'Sudeste',
              estado: 'SP',
              municipio: 'São Paulo',
              status: 'Pago',
              data_vencimento: '2024-12-31',
              data_assinatura: '2024-01-15',
              area_responsavel: 'TI',
              prioridade: 'Alta',
              risco: 'Baixo',
              responsavel: 'João Silva'
            },
            {
              numero_contrato: 'CT-2024-002',
              fornecedor: 'Construtora ABC',
              tipo_fluxo: 'Obras',
              valor_contrato: 300000,
              valor_pagamento: 280000,
              regiao: 'Sul',
              estado: 'RS',
              municipio: 'Porto Alegre',
              status: 'Pendente',
              data_vencimento: '2025-03-15',
              data_assinatura: '2024-02-10',
              area_responsavel: 'Infraestrutura',
              prioridade: 'Média',
              risco: 'Médio',
              responsavel: 'Maria Santos'
            },
            {
              numero_contrato: 'CT-2024-003',
              fornecedor: 'ServiCorp',
              tipo_fluxo: 'Serviços',
              valor_contrato: 75000,
              valor_pagamento: 75000,
              regiao: 'Nordeste',
              estado: 'BA',
              municipio: 'Salvador',
              status: 'Vencido',
              data_vencimento: '2024-09-01',
              data_assinatura: '2024-03-20',
              area_responsavel: 'Operações',
              prioridade: 'Baixa',
              risco: 'Alto',
              responsavel: 'Carlos Oliveira'
            }
          ];
          
          setContracts(mockData);
          toast({
            title: "Dados de Teste Carregados",
            description: `${mockData.length} contratos de teste carregados para demonstração.`,
            variant: "default"
          });
          return;
        }

        if (data && data.length > 0) {
          setContracts(data as ContractFromDB[]);
        } else {
          setContracts([]);
          toast({
            title: "Nenhum contrato encontrado",
            description: `A tabela está vazia.`,
            variant: "default"
          });
        }
      } catch (error) {
        console.error("❌ [SUPABASE] Erro geral:", error);
        setContracts([]);
        toast({
          title: "Erro ao carregar contratos",
          description: `Erro na conexão com a base de dados.`,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialContracts();
  }, [toast]);

  const applyFilters = async (filterParams: FilterParams) => {
    setIsLoading(true);
    
    try {
      // Construir query do Supabase com filtros
      let query = supabase.from('contracts').select('*');

      // Aplicar filtro por tipo de fluxo
      if (filterParams.flowType.length > 0) {
        query = query.in('tipo_fluxo', filterParams.flowType);
      }

      // Aplicar filtro por fornecedor
      if (filterParams.supplierName.trim()) {
        const normalizedSupplier = normalizeForComparison(filterParams.supplierName);
        query = query.ilike('fornecedor', `%${normalizedSupplier}%`);
      }

      // Aplicar filtro por número do contrato
      if (filterParams.contractNumber.trim()) {
        const normalizedContractNumber = normalizeForComparison(filterParams.contractNumber);
        query = query.ilike('numero_contrato', `%${normalizedContractNumber}%`);
      }

      // Aplicar filtro por faixa de valor do contrato
      if (filterParams.contractValue[0] > 0 || filterParams.contractValue[1] < 10000000) {
        query = query.gte('valor_contrato', filterParams.contractValue[0])
                   .lte('valor_contrato', filterParams.contractValue[1]);
      }

      // Aplicar filtro por região
      if (filterParams.region.trim()) {
        const normalizedRegion = normalizeForComparison(filterParams.region);
        query = query.ilike('regiao', `%${normalizedRegion}%`);
      }

      // Aplicar filtro por estados
      if (filterParams.selectedStates.length > 0) {
        const normalizedStates = filterParams.selectedStates.map(state => normalizeForComparison(state));
        const conditions = normalizedStates.map(state => `estado.ilike.%${state}%`);
        query = query.or(conditions.join(','));
      }

      // Aplicar filtro por data de vencimento
      if (filterParams.dueDate) {
        const today = new Date().toISOString().split('T')[0];
        
        switch (filterParams.dueDate) {
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
          case '30-60': {
            const next30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const next60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            query = query.gte('data_vencimento', next30Days).lte('data_vencimento', next60Days);
            break;
          }
          case '60-90': {
            const next60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const next90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            query = query.gte('data_vencimento', next60Days).lte('data_vencimento', next90Days);
            break;
          }
          case 'custom': {
            if (filterParams.customStart && filterParams.customEnd) {
              query = query.gte('data_vencimento', filterParams.customStart)
                          .lte('data_vencimento', filterParams.customEnd);
            }
            break;
          }
        }
      }

      // Aplicar filtros personalizados
      if (filterParams.customFilters && filterParams.customFilterValues) {
        const customFilters = filterParams.customFilters as Array<{
          id: string;
          name: string;
          type: string;
          table: string;
          field: string;
          options?: string[];
        }>;

        customFilters.forEach((filter) => {
          const filterValue = filterParams.customFilterValues[filter.id];
          
          if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
            // Normalizar valor para campos específicos que precisam de padronização
            const shouldNormalize = ['risco', 'prioridade', 'area_responsavel'].includes(filter.field);
            
            // Aplicar filtro baseado no tipo
            switch (filter.type) {
              case 'Dropdown': {
                if (Array.isArray(filterValue) && filterValue.length > 0) {
                  if (shouldNormalize) {
                    // Para campos com acentos, criar condições OR com ilike para cada valor
                    const conditions = filterValue.map(val => {
                      const normalizedValue = normalizeForComparison(val);
                      return `${filter.field}.ilike.%${normalizedValue}%`;
                    });
                    query = query.or(conditions.join(','));
                  } else {
                    query = query.in(filter.field, filterValue);
                  }
                } else if (typeof filterValue === 'string' && filterValue.trim()) {
                  if (shouldNormalize) {
                    // Para campos com acentos, usar busca case-insensitive
                    const normalizedValue = normalizeForComparison(filterValue);
                    query = query.ilike(filter.field, `%${normalizedValue}%`);
                  } else {
                    query = query.eq(filter.field, filterValue);
                  }
                }
                break;
              }
              case 'Input': {
                if (typeof filterValue === 'string' && filterValue.trim()) {
                  if (shouldNormalize) {
                    const normalizedValue = normalizeForComparison(filterValue);
                    query = query.ilike(filter.field, `%${normalizedValue}%`);
                  } else {
                    query = query.ilike(filter.field, `%${filterValue}%`);
                  }
                }
                break;
              }
              case 'Date': {
                if (typeof filterValue === 'string' && filterValue.trim()) {
                  query = query.eq(filter.field, filterValue);
                }
                break;
              }
              case 'Number': {
                if (typeof filterValue === 'number' || (typeof filterValue === 'string' && !isNaN(Number(filterValue)))) {
                  query = query.eq(filter.field, Number(filterValue));
                }
                break;
              }
              case 'Range': {
                if (Array.isArray(filterValue) && filterValue.length === 2) {
                  const [min, max] = filterValue;
                  query = query.gte(filter.field, min).lte(filter.field, max);
                }
                break;
              }
              default:
                // Para tipos não reconhecidos, tentar uma busca de igualdade com normalização se necessário
                if (typeof filterValue === 'string' && filterValue.trim()) {
                  if (shouldNormalize) {
                    const normalizedValue = normalizeForComparison(filterValue);
                    query = query.ilike(filter.field, `%${normalizedValue}%`);
                  } else {
                    query = query.eq(filter.field, filterValue);
                  }
                }
                break;
            }
          }
        });
      }

      // Aplicar limite
      query = query.limit(filterParams.contractCount);

      const { data, error } = await query;

      if (error) {
        console.error("❌ [SUPABASE] Erro na query da tabela 'contracts':", error);
        throw error;
      }

      if (!data || data.length === 0) {
        setContracts([]);
        toast({
          title: "Nenhum resultado encontrado",
          description: "Tente ajustar os filtros para encontrar contratos."
        });
        return;
      }

      // Usar dados diretamente sem transformação
      setContracts(data as ContractFromDB[]);
      
      toast({
        title: "Filtros aplicados com sucesso",
        description: `${data.length} contrato(s) encontrado(s) na tabela 'contracts'.`
      });

    } catch (error) {
      console.error("❌ [SUPABASE] Erro geral na aplicação de filtros:", error);
      
      setContracts([]);
      toast({
        title: "Erro ao aplicar filtros",
        description: `Erro ao conectar com a base de dados.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { contracts, isLoading, applyFilters, setContracts };
};
