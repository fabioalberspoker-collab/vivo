import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface SupplierFilterProps {
  supplierName: string;
  contractNumber: string;
  onSupplierNameChange: (value: string) => void;
  onContractNumberChange: (value: string) => void;
}

const SupplierFilter = ({ 
  supplierName, 
  contractNumber, 
  onSupplierNameChange, 
  onContractNumberChange 
}: SupplierFilterProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="supplier-name">Nome do Fornecedor</Label>
        <Input
          id="supplier-name"
          value={supplierName}
          onChange={(e) => onSupplierNameChange(e.target.value)}
          placeholder="Digite o nome do fornecedor"
        />
      </div>
      <div>
        <Label htmlFor="contract-number">Número do Contrato</Label>
        <Input
          id="contract-number"
          value={contractNumber}
          onChange={(e) => onContractNumberChange(e.target.value)}
          placeholder="Digite o número do contrato"
        />
      </div>
    </div>
  );
};

export default SupplierFilter;
