import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FilterParams {
  flowType: string[];
  contractValue: [number, number];
  paymentValue: [number, number];
  region: string;
  selectedStates: string[];
  dueDate: string;
  customStart: string;
  customEnd: string;
  supplierName: string;
  contractNumber: string;
  contractCount: number;
  customFilterValues: Record<string, any>;
  customFilters: any[];
}

export interface Contract {
  id: string;
  number: string;
  supplier: string;
  type: string;
  value: number;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
  dueDate: string;
}

export const useContractFilters = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const applyFilters = async (filterParams: FilterParams) => {
    setIsLoading(true);
    
    try {
      // Use PostgrestBuilder with explicit any type to bypass TypeScript issues
      let query = (supabase as any).from('contratos').select('*');

      // Apply flow type filter
      if (filterParams.flowType.length > 0) {
        query = query.in('tipo_fluxo', filterParams.flowType);
      }

      // Apply supplier name filter
      if (filterParams.supplierName) {
        query = query.ilike('fornecedor', `%${filterParams.supplierName}%`);
      }

      // Apply contract number filter
      if (filterParams.contractNumber) {
        query = query.ilike('numero_contrato', `%${filterParams.contractNumber}%`);
      }

      // Apply contract value range
      query = query
        .gte('valor_contrato', filterParams.contractValue[0])
        .lte('valor_contrato', filterParams.contractValue[1]);

      // Apply payment value range (only if valor_pagamento is not null)
      query = query
        .gte('valor_pagamento', filterParams.paymentValue[0])
        .lte('valor_pagamento', filterParams.paymentValue[1]);

      // Apply region filter
      if (filterParams.region) {
        query = query.eq('regiao', filterParams.region);
      }

      // Apply states filter
      if (filterParams.selectedStates.length > 0) {
        query = query.in('estado', filterParams.selectedStates);
      }

      // Apply due date filter
      if (filterParams.dueDate) {
        const today = new Date();
        
        switch (filterParams.dueDate) {
          case "30":
            const date30 = new Date(today);
            date30.setDate(date30.getDate() + 30);
            query = query.lte('data_vencimento', date30.toISOString().split('T')[0]);
            break;
          case "30-60":
            const date30Start = new Date(today);
            date30Start.setDate(date30Start.getDate() + 30);
            const date60End = new Date(today);
            date60End.setDate(date60End.getDate() + 60);
            query = query
              .gte('data_vencimento', date30Start.toISOString().split('T')[0])
              .lte('data_vencimento', date60End.toISOString().split('T')[0]);
            break;
          case "60-90":
            const date60Start = new Date(today);
            date60Start.setDate(date60Start.getDate() + 60);
            const date90End = new Date(today);
            date90End.setDate(date90End.getDate() + 90);
            query = query
              .gte('data_vencimento', date60Start.toISOString().split('T')[0])
              .lte('data_vencimento', date90End.toISOString().split('T')[0]);
            break;
          case "custom":
            if (filterParams.customStart && filterParams.customEnd) {
              query = query
                .gte('data_vencimento', filterParams.customStart)
                .lte('data_vencimento', filterParams.customEnd);
            }
            break;
        }
      }

      // Apply custom filters
      filterParams.customFilters.forEach((filter) => {
        const value = filterParams.customFilterValues[filter.id];
        if (value !== undefined && value !== '' && value !== null) {
          switch (filter.type) {
            case 'Input':
              query = query.ilike(filter.campo_origem, `%${value}%`);
              break;
            case 'Dropdown':
            case 'Multi-select':
              if (Array.isArray(value) && value.length > 0) {
                query = query.in(filter.campo_origem, value);
              } else if (!Array.isArray(value) && value) {
                query = query.eq(filter.campo_origem, value);
              }
              break;
            case 'Range':
              if (Array.isArray(value) && value.length === 2) {
                query = query.gte(filter.campo_origem, value[0]).lte(filter.campo_origem, value[1]);
              }
              break;
            case 'Checkbox':
              if (value === true) {
                query = query.not(filter.campo_origem, 'is', null);
              }
              break;
            case 'Data':
              query = query.eq(filter.campo_origem, value);
              break;
            case 'Intervalo':
              if (Array.isArray(value) && value.length === 2) {
                query = query.gte(filter.campo_origem, value[0]).lte(filter.campo_origem, value[1]);
              }
              break;
          }
        }
      });

      // Apply limit
      query = query.limit(filterParams.contractCount);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform the data to match expected format
      const transformedContracts: Contract[] = (data || []).map((contract: any) => ({
        id: contract.id,
        number: contract.numero_contrato,
        supplier: contract.fornecedor || 'Não informado',
        type: contract.tipo_contrato || 'Não informado',
        value: Number(contract.valor_contrato),
        status: mapStatus(contract.status),
        dueDate: contract.data_vencimento,
      }));

      setContracts(transformedContracts);

      toast({
        title: "Filtros aplicados",
        description: `${transformedContracts.length} contratos encontrados.`
      });

    } catch (error) {
      console.error('Error applying filters:', error);
      toast({
        title: "Erro ao aplicar filtros",
        description: "Ocorreu um erro ao buscar os contratos. Tente novamente.",
        variant: "destructive"
      });
      setContracts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const mapStatus = (status: string | null): 'paid' | 'pending' | 'overdue' | 'processing' => {
    if (!status) return 'pending';
    
    const statusMap: Record<string, 'paid' | 'pending' | 'overdue' | 'processing'> = {
      'Pago': 'paid',
      'Pendente': 'pending',
      'Vencido': 'overdue',
      'Processando': 'processing'
    };
    
    return statusMap[status] || 'pending';
  };

  return {
    contracts,
    isLoading,
    applyFilters
  };
};