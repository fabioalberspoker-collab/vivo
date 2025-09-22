import { Button } from "@/components/ui/button";
import { useContractAnalysis } from "@/hooks/useContractAnalysis";
import { ContractFromDB } from "@/hooks/useContractFilters";
import { Loader2, Brain } from "lucide-react";

interface HeaderProps {
  filteredContracts?: ContractFromDB[];
}

const Header = ({ filteredContracts = [] }: HeaderProps) => {
  // Usar a chave da API Gemini diretamente
  const GEMINI_API_KEY = "AIzaSyD918kJyTaAlXtxXrfoBMjdwnxWLk0yqaw";
  const { analyzeContracts, analysisState } = useContractAnalysis(GEMINI_API_KEY);

  const handleExportReport = async () => {
    await analyzeContracts(filteredContracts);
  };

  const getButtonText = () => {
    if (!analysisState.isAnalyzing) {
      return (
        <>
          <Brain className="mr-2 h-4 w-4" />
          Exportar Relatório
        </>
      );
    }

    const progress = analysisState.progress;
    if (!progress) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Preparando...
        </>
      );
    }

    return (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {progress.message} ({progress.progress}%)
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
            disabled={analysisState.isAnalyzing || filteredContracts.length === 0}
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