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
import { ContractFromDB } from "@/hooks/useContractFilters";

interface ContractsTableProps {
  contracts: ContractFromDB[];
  onViewContract: (contractNumber: string) => void;
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline'; className: string }> = {
      'Pago': { label: 'Pago', variant: 'default', className: 'bg-green-500 text-white' },
      'Pendente': { label: 'Pendente', variant: 'default', className: 'bg-yellow-500 text-white' },
      'Vencido': { label: 'Vencido', variant: 'destructive', className: 'bg-red-500 text-white' },
      'Processando': { label: 'Processando', variant: 'default', className: 'bg-blue-500 text-white' },
      'Em Análise': { label: 'Em Análise', variant: 'secondary', className: 'bg-gray-500 text-white' }
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' as const, className: 'bg-gray-200 text-gray-800' };
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
              <TableHead>Tipo de Fluxo</TableHead>
              <TableHead>Valor do Contrato</TableHead>
              <TableHead>Valor de Pagamento</TableHead>
              <TableHead>Região</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Vencimento</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract, index) => (
              <TableRow key={contract.numero_contrato || index}>
                <TableCell className="font-mono">{contract.numero_contrato}</TableCell>
                <TableCell>{contract.fornecedor}</TableCell>
                <TableCell>{contract.tipo_fluxo}</TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(contract.valor_contrato)}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(contract.valor_pagamento)}
                </TableCell>
                <TableCell>{contract.regiao}</TableCell>
                <TableCell>{contract.estado}</TableCell>
                <TableCell>{getStatusBadge(contract.status)}</TableCell>
                <TableCell>{formatDate(contract.data_vencimento)}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewContract(contract.numero_contrato)}
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