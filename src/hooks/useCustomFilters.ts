import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomFilter } from '@/components/CreateFilterModal';

export const useCustomFilters = () => {
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load filters from Supabase on component mount
  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('filtros_personalizados')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Error loading filters:', error);
        toast({
          title: "Erro ao carregar filtros",
          description: "Não foi possível carregar os filtros salvos.",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        const transformedFilters: CustomFilter[] = data.map((filter) => ({
          id: filter.id,
          name: filter.nome_filtro,
          type: filter.tipo as CustomFilter['type'],
          table: filter.tabela_origem,
          field: filter.campo_origem,
          options: filter.configuracoes ? 
            (filter.configuracoes as Record<string, unknown>).options as string[] || 
            (filter.configuracoes as Record<string, unknown>).opcoes as string[] || 
            [] : []
        }));
        
        console.log('📥 [SUPABASE] Filtros carregados do banco:', transformedFilters);
        setCustomFilters(transformedFilters);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
      toast({
        title: "Erro ao carregar filtros",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addFilter = async (filter: CustomFilter) => {
    try {
      setIsLoading(true);
      
      console.log('💾 [SUPABASE] Salvando filtro no banco:', filter);
      
      const dataToInsert = {
        nome_filtro: filter.name,
        tipo: filter.type,
        tabela_origem: filter.table,
        campo_origem: filter.field,
        configuracoes: {
          options: filter.options || [],
          type: filter.type,
          // Incluir outras configurações se existirem
          ...(filter.options && filter.options.length > 0 && { opcoes: filter.options })
        }
      };
      
      console.log('💾 [SUPABASE] Dados a serem inseridos:', dataToInsert);
      
      const { data, error } = await supabase
        .from('filtros_personalizados')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        console.error('❌ [SUPABASE] Error saving filter:', error);
        toast({
          title: "Erro ao salvar filtro",
          description: "Não foi possível salvar o filtro.",
          variant: "destructive"
        });
        return;
      }

      if (!data) {
        console.error('❌ [SUPABASE] No data returned from insert');
        return;
      }

      console.log('✅ [SUPABASE] Filtro salvo com sucesso:', data);

      // Add the new filter to the local state
      const newFilter: CustomFilter = {
        id: data.id,
        name: data.nome_filtro,
        type: data.tipo as CustomFilter['type'],
        table: data.tabela_origem,
        field: data.campo_origem,
        options: data.configuracoes ? 
          (data.configuracoes as Record<string, unknown>).options as string[] || 
          (data.configuracoes as Record<string, unknown>).opcoes as string[] || 
          [] : []
      };
      
      console.log('✅ [SUPABASE] Filtro convertido para estado local:', newFilter);
        
      setCustomFilters(prev => [newFilter, ...prev]);
      
      toast({
        title: "Filtro salvo",
        description: `O filtro "${filter.name}" foi salvo com sucesso.`
      });
    } catch (error) {
      console.error('Error saving filter:', error);
      toast({
        title: "Erro ao salvar filtro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFilter = async (filterId: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('filtros_personalizados')
        .delete()
        .eq('id', filterId);

      if (error) {
        console.error('Error deleting filter:', error);
        toast({
          title: "Erro ao excluir filtro",
          description: "Não foi possível excluir o filtro.",
          variant: "destructive"
        });
        return;
      }

      setCustomFilters(prev => prev.filter(f => f.id !== filterId));
      
      toast({
        title: "Filtro excluído",
        description: "O filtro foi excluído com sucesso."
      });
    } catch (error) {
      console.error('Error deleting filter:', error);
      toast({
        title: "Erro ao excluir filtro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    customFilters,
    addFilter,
    removeFilter,
    isLoading,
    loadFilters
  };
};