import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const flowTypes = ["RE", "Real State", "FI", "Proposta", "Engenharia", "RC"];

interface FlowTypeFilterProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const FlowTypeFilter = ({ value, onChange }: FlowTypeFilterProps) => {
  const handleToggle = (type: string) => {
    if (value.includes(type)) {
      onChange(value.filter(v => v !== type));
    } else {
      onChange([...value, type]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Tipo de Fluxo</Label>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {flowTypes.map((type) => (
          <div key={type} className="flex items-center space-x-2">
            <Checkbox
              id={`flow-type-${type}`}
              checked={value.includes(type)}
              onCheckedChange={() => handleToggle(type)}
            />
            <Label htmlFor={`flow-type-${type}`} className="text-sm">
              {type}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlowTypeFilter;