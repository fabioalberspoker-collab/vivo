import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Contract } from "@/hooks/useContractFilters";

interface ContractsTableProps {
  contracts: Contract[];
  onViewContract: (contractId: string) => void;
}

const ContractsTable = ({ contracts, onViewContract }: ContractsTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: Contract['status']) => {
    const statusConfig = {
      paid: { label: 'Pago', variant: 'default' as const, className: 'bg-status-paid text-white' },
      pending: { label: 'Pendente', variant: 'default' as const, className: 'bg-status-pending text-white' },
      overdue: { label: 'Vencido', variant: 'destructive' as const, className: 'bg-status-overdue text-white' },
      processing: { label: 'Processando', variant: 'default' as const, className: 'bg-status-processing text-white' }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (contracts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Nenhum contrato encontrado com os filtros aplicados.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número do Contrato</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Vencimento</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-mono">{contract.number}</TableCell>
                <TableCell>{contract.supplier}</TableCell>
                <TableCell>{contract.type}</TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(contract.value)}
                </TableCell>
                <TableCell>{getStatusBadge(contract.status)}</TableCell>
                <TableCell>{formatDate(contract.dueDate)}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewContract(contract.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default ContractsTable;