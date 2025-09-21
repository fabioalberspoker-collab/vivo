import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
          setContracts([]);
          toast({
            title: "Erro ao carregar contratos",
            description: `Erro na conexão com a base de dados.`,
            variant: "destructive"
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
        query = query.ilike('fornecedor', `%${filterParams.supplierName}%`);
      }

      // Aplicar filtro por número do contrato
      if (filterParams.contractNumber.trim()) {
        query = query.ilike('numero_contrato', `%${filterParams.contractNumber}%`);
      }

      // Aplicar filtro por faixa de valor do contrato
      if (filterParams.contractValue[0] > 0 || filterParams.contractValue[1] < 10000000) {
        query = query.gte('valor_contrato', filterParams.contractValue[0])
                   .lte('valor_contrato', filterParams.contractValue[1]);
      }

      // Aplicar filtro por região
      if (filterParams.region.trim()) {
        query = query.eq('regiao', filterParams.region);
      }

      // Aplicar filtro por estados
      if (filterParams.selectedStates.length > 0) {
        query = query.in('estado', filterParams.selectedStates);
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
            // Aplicar filtro baseado no tipo
            switch (filter.type) {
              case 'Dropdown': {
                if (Array.isArray(filterValue) && filterValue.length > 0) {
                  query = query.in(filter.field, filterValue);
                } else if (typeof filterValue === 'string' && filterValue.trim()) {
                  query = query.eq(filter.field, filterValue);
                }
                break;
              }
              case 'Input': {
                if (typeof filterValue === 'string' && filterValue.trim()) {
                  query = query.ilike(filter.field, `%${filterValue}%`);
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
                // Para tipos não reconhecidos, tentar uma busca de igualdade
                if (typeof filterValue === 'string' && filterValue.trim()) {
                  query = query.eq(filter.field, filterValue);
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

  return { contracts, isLoading, applyFilters };
};