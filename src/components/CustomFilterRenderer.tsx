import { CustomFilter } from "./CreateFilterModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

interface CustomFilterRendererProps {
  filter: CustomFilter;
  value: unknown;
  onChange: (value: unknown) => void;
}

const CustomFilterRenderer = ({ filter, value, onChange }: CustomFilterRendererProps) => {
  const renderFilterInput = () => {
    switch (filter.type) {
      case 'Input':
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${filter.name.toLowerCase()}`}
          />
        );

      case 'Dropdown':
        return (
          <Select value={(value as string) || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${filter.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {filter.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'Multi-select': {
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {filter.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.id}-${option}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option]);
                    } else {
                      onChange(selectedValues.filter((v: string) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${filter.id}-${option}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );
      }

      case 'Checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={filter.id}
              checked={!!(value as boolean)}
              onCheckedChange={onChange}
            />
            <Label htmlFor={filter.id}>Ativo</Label>
          </div>
        );

      case 'Date':
      case 'Data':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'Number':
        return (
          <Input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={`Digite ${filter.name.toLowerCase()}`}
          />
        );

      case 'Intervalo': {
        const intervalValue = (value as { start?: string; end?: string }) || {};
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Data inicial</Label>
                <Input
                  type="date"
                  value={intervalValue.start || ''}
                  onChange={(e) => onChange({ ...intervalValue, start: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Data final</Label>
                <Input
                  type="date"
                  value={intervalValue.end || ''}
                  onChange={(e) => onChange({ ...intervalValue, end: e.target.value })}
                />
              </div>
            </div>
          </div>
        );
      }

      case 'Range': {
        const rangeValue = (value as number[]) || [0, 1000000];
        return (
          <div className="space-y-3">
            <Slider
              value={rangeValue}
              onValueChange={onChange}
              max={1000000}
              min={0}
              step={1000}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{rangeValue[0]?.toLocaleString('pt-BR')}</span>
              <span>{rangeValue[1]?.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        );
      }

      default:
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Valor do filtro"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label>{filter.name}</Label>
      {renderFilterInput()}
      <p className="text-xs text-muted-foreground">
        Campo: {filter.table}.{filter.field}
      </p>
    </div>
  );
};

export default CustomFilterRenderer;