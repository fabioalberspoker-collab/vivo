import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Slider } from "@/shared/components/ui/slider";

interface ValueRangeFilterProps {
  title: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const ValueRangeFilter = ({ title, min, max, value, onChange }: ValueRangeFilterProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <Label>{title}</Label>
      <div className="px-2">
        <Slider
          value={value}
          onValueChange={onChange}
          max={max}
          min={min}
          step={1000}
          className="w-full"
        />
      </div>
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-muted-foreground">De:</span>
        <span className="font-medium">{formatCurrency(value[0])}</span>
        <span className="text-muted-foreground">Até:</span>
        <span className="font-medium">{formatCurrency(value[1])}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`${title}-min`} className="text-xs">Valor mínimo</Label>
          <Input
            id={`${title}-min`}
            type="number"
            value={value[0]}
            onChange={(e) => onChange([parseInt(e.target.value) || 0, value[1]])}
            className="h-8"
          />
        </div>
        <div>
          <Label htmlFor={`${title}-max`} className="text-xs">Valor máximo</Label>
          <Input
            id={`${title}-max`}
            type="number"
            value={value[1]}
            onChange={(e) => onChange([value[0], parseInt(e.target.value) || max])}
            className="h-8"
          />
        </div>
      </div>
    </div>
  );
};

export default ValueRangeFilter;
