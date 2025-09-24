import { ReactNode } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Trash2 } from "lucide-react";
interface FilterContainerProps {
  title: string;
  children: ReactNode;
  canDelete?: boolean;
  onDelete?: () => void;
}
const FilterContainer = ({
  title,
  children,
  canDelete = false,
  onDelete
}: FilterContainerProps) => {
  return (
    <Card className="p-4 h-full min-h-[200px] flex flex-col relative">
      {canDelete && (
        <Button
          size="icon"
          variant="destructive"
          onClick={onDelete}
          className="absolute top-2 right-2 w-8 h-8 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
          style={{ boxShadow: 'none' }}
          aria-label="Remover filtro"
        >
          <Trash2 size={18} color="white" />
        </Button>
      )}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </Card>
  );
};
export default FilterContainer;
