import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";

interface ContractCountFilterProps {
  value: number;
  onChange: (value: number) => void;
}

const ContractCountFilter = ({ value, onChange }: ContractCountFilterProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="contract-count">Quantidade de Contratos</Label>
      <Input
        id="contract-count"
        type="number"
        min="1"
        max="1000"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 1)}
        placeholder="Quantidade de contratos a sortear"
      />
      <p className="text-xs text-muted-foreground">
        Número de contratos que serão sorteados aleatoriamente com base nos filtros aplicados.
      </p>
    </div>
  );
};

export default ContractCountFilter;
