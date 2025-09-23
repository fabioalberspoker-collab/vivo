import { Button } from "@/components/ui/button";
import { useContractAnalysis } from "@/hooks/useContractAnalysis";
import { ContractFromDB } from "@/hooks/useContractFilters";
import { Loader2, Brain } from "lucide-react";

interface HeaderProps {
  filteredContracts?: ContractFromDB[];
}

const Header = ({ filteredContracts = [] }: HeaderProps) => {
  const { analyzeContracts, isAnalyzing } = useContractAnalysis();

  const handleExportReport = async () => {
    try {
      // Convert ContractFromDB to Contract format
      const contractsToAnalyze = filteredContracts.map(contract => ({
        id: contract.numero_contrato || '',
        number: contract.numero_contrato || '',
        supplier: contract.fornecedor || '',
        type: contract.tipo_fluxo || '',
        value: contract.valor_contrato || 0,
        status: 'pending' as const,
        dueDate: contract.data_vencimento || '',
        flowType: contract.tipo_fluxo || '',
        region: contract.regiao || '',
        state: contract.estado || ''
      }));
      
      await analyzeContracts(contractsToAnalyze);
    } catch (error) {
      console.error('Erro durante a análise dos contratos:', error);
      
      // Verificar se é erro de API sobrecarregada
      if (error instanceof Error && error.message.includes('503')) {
        console.warn('⚠️ API Gemini temporariamente sobrecarregada. Alguns contratos podem ter análise limitada.');
      }
    }
  };

  const getButtonText = () => {
    if (!isAnalyzing) {
      return (
        <>
          <Brain className="mr-2 h-4 w-4" />
          Exportar Relatório
        </>
      );
    }

    return (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Analisando contratos...
      </>
    );
  };
  return (
    <header className="w-full bg-background border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src="/lovable-uploads/faf482cf-0e05-4306-ba2a-3839f9734cb2.png" 
            alt="Vivo Logo" 
            className="h-8"
          />
          <div>
            <h1 className="text-xl font-bold text-vivo-purple">
              Verificação Inteligente de Pagamentos
            </h1>
            <p className="text-sm text-muted-foreground">
              Sistema de análise e auditoria de contratos
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-vivo-purple border-vivo-purple hover:bg-vivo-purple hover:text-white"
            onClick={handleExportReport}
            disabled={isAnalyzing || filteredContracts.length === 0}
          >
            {getButtonText()}
          </Button>
          <Button size="sm">
            Configurações
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;