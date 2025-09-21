import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { mockContracts, Contract } from "@/data/mockContracts";

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

export const useContractFilters = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const applyFilters = async (filterParams: FilterParams) => {
    setIsLoading(true);
    
    try {
      let filteredMock = [...mockContracts];
      
      if (filterParams.flowType.length > 0) {
        filteredMock = filteredMock.filter(contract => 
          filterParams.flowType.includes(contract.flowType)
        );
      }
      
      if (filterParams.supplierName) {
        filteredMock = filteredMock.filter(contract =>
          contract.supplier.toLowerCase().includes(filterParams.supplierName.toLowerCase())
        );
      }
      
      if (filterParams.contractNumber) {
        filteredMock = filteredMock.filter(contract =>
          contract.number.toLowerCase().includes(filterParams.contractNumber.toLowerCase())
        );
      }
      
      filteredMock = filteredMock.filter(contract =>
        contract.value >= filterParams.contractValue[0] &&
        contract.value <= filterParams.contractValue[1]
      );
      
      const finalMock = filteredMock.slice(0, filterParams.contractCount);
      setContracts(finalMock);
      
      toast({
        title: "Filtros aplicados",
        description: `${finalMock.length} contratos encontrados.`
      });

    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao aplicar filtros", 
        description: "Erro ao buscar contratos.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { contracts, isLoading, applyFilters };
};