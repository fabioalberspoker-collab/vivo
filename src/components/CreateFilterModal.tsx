import { useState, useEffect } from "react";
import { getSupabaseTableNames, getSupabaseTableFields } from "@/integrations/supabase/listTables";
import { getApiEndpoint } from "@/config/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CreateFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filter: CustomFilter) => Promise<void>;
}

export interface CustomFilter {
  id: string;
  name: string;
  type: 'Range' | 'Dropdown' | 'Multi-select' | 'Input' | 'Checkbox' | 'Data' | 'Intervalo' | 'Date' | 'Number';
  table: string;
  field: string;
  options?: string[];
}



const CreateFilterModal = ({ isOpen, onClose, onSave }: CreateFilterModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    table: '',
    field: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug: log quando o modal é aberto/fechado
  useEffect(() => {
    console.log('🪟 [DEBUG] Modal CreateFilterModal - isOpen:', isOpen);
  }, [isOpen]);


  const handleSave = async () => {
    console.log('💾 [DEBUG] handleSave chamado - formData:', formData);
    
    if (!formData.name || !formData.table || !formData.field) {
      console.log('❌ [DEBUG] Campos obrigatórios faltando');
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
    // Chama a API backend para criar o filtro automaticamente
      const apiUrl = getApiEndpoint('CREATE_CUSTOM_FILTER');
      
      console.log('🌍 [DEBUG] URL da API:', apiUrl);
      
      const requestBody = {
        nome_do_filtro: formData.name,
        tabela: formData.table,
        coluna: formData.field
      };
      
      console.log('🔍 [DEBUG] Enviando dados para o backend:', requestBody);
      
      // Log do prompt que será enviado para o Gemini
      const expectedPrompt = `Analisando campo "${requestBody.coluna}" da tabela "${requestBody.tabela}" para criar filtro inteligente...`;
      
      console.log('🤖 [PROMPT] Dados que serão enviados para o Gemini:');
      console.log('==========================================');
      console.log(expectedPrompt);
      console.log('==========================================');
      
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📡 [DEBUG] Response status:', response.status);
      console.log('📡 [DEBUG] Response ok:', response.ok);
      const result = await response.json();
      console.log('📥 [DEBUG] Resposta recebida do backend:', result);
      
      // Exibir informações detalhadas do debug
      if (result.debug) {
        console.log('🤖 [GEMINI DEBUG] Prompt enviado:');
        console.log('==========================================');
        console.log(result.debug.promptSent);
        console.log('==========================================');
        console.log('🤖 [GEMINI DEBUG] Resposta bruta do Gemini:', result.debug.geminiRawResponse);
        console.log('🤖 [GEMINI DEBUG] Tipo processado:', result.debug.processedType);
      }
      
      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar filtro");
      }
      
      // Validate the response structure
      if (!result.success || !result.filter) {
        throw new Error("Resposta inválida do servidor");
      }
      
      console.log('✅ [DEBUG] Filtro criado com sucesso:', result.filter);
      
      toast({
        title: "Filtro criado",
        description: `O filtro foi criado automaticamente! Tipo: ${result.filter.type}`
      });
      setFormData({ name: '', table: '', field: '' });
      onClose();
      // Opcional: recarregar lista de filtros
      if (onSave) {
        // Convert the backend response to the expected frontend format
        const backendType = result.filter.type;
        let frontendType: 'Range' | 'Dropdown' | 'Select' | 'Multi-select' | 'Input' | 'Checkbox' | 'Data' | 'Intervalo' | 'Date' | 'Number';
        
        // Mapeamento detalhado com logs
        console.log('🔄 [MAPPING] Convertendo tipo do backend para frontend:');
        console.log('🔄 [MAPPING] Tipo do backend:', backendType);
        
        switch(backendType.toLowerCase().trim()) {
          case 'value-range':
          case 'range':
          case 'number':
          case 'numeric':
            frontendType = 'Range';
            break;
          case 'text':
          case 'string':
          case 'search':
            frontendType = 'Input';
            break;
          case 'date':
          case 'datetime':
          case 'time':
            frontendType = 'Data';
            break;
          case 'intervalo':
          case 'interval':
          case 'date-range':
            frontendType = 'Intervalo';
            break;
          case 'select':
          case 'dropdown':
          case 'categorical':
          case 'enum':
            frontendType = 'Dropdown';
            break;
          case 'boolean':
          case 'bool':
          case 'checkbox':
            frontendType = 'Checkbox';
            break;
          default:
            console.warn('⚠️ [MAPPING] Tipo desconhecido, usando Input como padrão:', backendType);
            frontendType = 'Input';
        }
        
        console.log('🔄 [MAPPING] Tipo do frontend:', frontendType);
        
        // Extract options from backend config
        let options: string[] = [];
        if (result.config && result.config.opcoes) {
          options = result.config.opcoes;
          console.log('📋 [OPTIONS] Opções extraídas do backend:', options);
        } else if (result.debug && result.debug.aiConfig && result.debug.aiConfig.configuracoes && result.debug.aiConfig.configuracoes.opcoes) {
          options = result.debug.aiConfig.configuracoes.opcoes;
          console.log('📋 [OPTIONS] Opções extraídas do debug AI:', options);
        }
        
        const customFilter: CustomFilter = {
          id: Date.now().toString(), // Generate a temporary ID
          name: result.filter.name,
          type: frontendType,
          table: formData.table,
          field: result.filter.columnName,
          options: options
        };
        
        console.log('✅ [DEBUG] Filtro final criado:', customFilter);
        await onSave(customFilter);
      }
    } catch (err: unknown) {
      console.error('❌ [DEBUG] Erro completo:', err);
      let errorMsg = "Erro desconhecido.";
      if (typeof err === "object" && err !== null && "message" in err && typeof (err as { message?: unknown }).message === "string") {
        errorMsg = (err as { message: string }).message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      console.error('❌ [DEBUG] Mensagem de erro:', errorMsg);
      toast({
        title: "Erro ao criar filtro",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', table: '', field: '' });
    onClose();
  };

  // Função de teste para debug
  const testApiConnection = async () => {
    console.log('🧪 [TEST] Testando conexão com a API...');
    try {
      const apiUrl = getApiEndpoint('HEALTH');
      const response = await fetch(apiUrl);
      const result = await response.json();
      console.log('🧪 [TEST] Resultado do teste:', result);
      toast({
        title: "Teste de API",
        description: `Status: ${result.status}`,
      });
    } catch (error) {
      console.error('🧪 [TEST] Erro no teste:', error);
      toast({
        title: "Erro no teste",
        description: "Falha na conexão com a API",
        variant: "destructive"
      });
    }
  };

  // Estado para tabelas e campos
  const [tableOptions, setTableOptions] = useState<string[]>([]);
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);

  // Buscar tabelas ao abrir modal
  useEffect(() => {
    if (!isOpen) return;
    setLoadingTables(true);
    getSupabaseTableNames().then((tables) => {
      setTableOptions(tables);
      setLoadingTables(false);
    });
  }, [isOpen]);

  // Buscar campos ao selecionar tabela
  useEffect(() => {
    if (!formData.table) {
      setFieldOptions([]);
      return;
    }
    setLoadingFields(true);
    getSupabaseTableFields(formData.table).then((fields) => {
      setFieldOptions(fields);
      setLoadingFields(false);
    });
  }, [formData.table]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-popover">
        <DialogHeader>
          <DialogTitle className="text-vivo-purple">Criar Novo Filtro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="filter-name">Nome do Filtro *</Label>
            <Input
              id="filter-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Prazo de Entrega"
            />
          </div>
          <div>
            <Label htmlFor="table">Tabela de Origem *</Label>
            <Select
              value={formData.table}
              onValueChange={(value) => setFormData(prev => ({ ...prev, table: value, field: '' }))}
              disabled={loadingTables}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTables ? "Carregando tabelas..." : "Selecione a tabela de origem"} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {tableOptions.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="field">Campo da Tabela *</Label>
            <Select
              value={formData.field}
              onValueChange={(value) => setFormData(prev => ({ ...prev, field: value }))}
              disabled={!formData.table || loadingFields}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !formData.table
                    ? "Selecione a tabela primeiro"
                    : loadingFields
                      ? "Carregando campos..."
                      : "Selecione o campo da tabela"
                } />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {fieldOptions.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar Filtro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFilterModal;