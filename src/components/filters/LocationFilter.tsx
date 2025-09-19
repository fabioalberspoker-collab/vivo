import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const regions = ["Sul", "Sudeste", "Centro-Oeste", "Nordeste", "Norte"];
const states = {
  "Sul": ["PR", "SC", "RS"],
  "Sudeste": ["SP", "RJ", "MG", "ES"],
  "Centro-Oeste": ["GO", "MT", "MS", "DF"],
  "Nordeste": ["BA", "PE", "CE", "MA", "PI", "RN", "PB", "SE", "AL"],
  "Norte": ["AM", "PA", "AC", "RO", "RR", "AP", "TO"]
};

interface LocationFilterProps {
  region: string;
  selectedStates: string[];
  onRegionChange: (value: string) => void;
  onStatesChange: (states: string[]) => void;
}

const LocationFilter = ({ region, selectedStates, onRegionChange, onStatesChange }: LocationFilterProps) => {
  const handleStateChange = (state: string, checked: boolean) => {
    if (checked) {
      onStatesChange([...selectedStates, state]);
    } else {
      onStatesChange(selectedStates.filter(s => s !== state));
    }
  };

  const availableStates = region ? states[region as keyof typeof states] || [] : [];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="region">Região</Label>
        <Select value={region} onValueChange={onRegionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a região" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {regions.map((reg) => (
              <SelectItem key={reg} value={reg}>
                {reg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {region && (
        <div>
          <Label>Estados ({selectedStates.length} selecionados)</Label>
          <div className="max-h-32 overflow-y-auto space-y-2 mt-2 border rounded-md p-2">
            {availableStates.map((state) => (
              <div key={state} className="flex items-center space-x-2">
                <Checkbox
                  id={state}
                  checked={selectedStates.includes(state)}
                  onCheckedChange={(checked) => handleStateChange(state, !!checked)}
                />
                <Label htmlFor={state} className="text-sm cursor-pointer">
                  {state}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationFilter;