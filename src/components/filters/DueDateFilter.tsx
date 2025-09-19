import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const predefinedOptions = [
  { value: "30", label: "Até 30 dias" },
  { value: "30-60", label: "30 a 60 dias" },
  { value: "60-90", label: "60 a 90 dias" },
  { value: "custom", label: "Período personalizado" }
];

interface DueDateFilterProps {
  value: string;
  customStart: string;
  customEnd: string;
  onChange: (value: string) => void;
  onCustomStartChange: (date: string) => void;
  onCustomEndChange: (date: string) => void;
}

const DueDateFilter = ({ 
  value, 
  customStart, 
  customEnd, 
  onChange, 
  onCustomStartChange, 
  onCustomEndChange 
}: DueDateFilterProps) => {
  return (
    <div className="space-y-3">
      <Label>Data de Vencimento</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {predefinedOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="custom-start" className="text-xs">Data inicial</Label>
            <Input
              id="custom-start"
              type="date"
              value={customStart}
              onChange={(e) => onCustomStartChange(e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <Label htmlFor="custom-end" className="text-xs">Data final</Label>
            <Input
              id="custom-end"
              type="date"
              value={customEnd}
              onChange={(e) => onCustomEndChange(e.target.value)}
              className="h-8"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DueDateFilter;