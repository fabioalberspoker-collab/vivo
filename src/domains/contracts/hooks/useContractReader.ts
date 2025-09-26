import { useState } from 'react';
import { useToast } from '@/shared/hooks/use-toast';

// Definindo os tipos aqui mesmo, já que o arquivo types.ts não existe
interface ContractStorageFile {
  id: string;
  name: string;
  bucket: string;
  path: string;
  url: string;
  contentType: string;
}

interface ContractParserResponse {
  contratado: string;
  contratante: string;
  tipo_fluxo: string;
  valor_contrato: number;
  valor_pagamento: number;
  forma_pagamento: number;
  localizacao: {
    estado: string;
    cidade: string;
  };
  data_vencimento: string;
  area_responsavel: string;
  datas_vencimento_parcelas: string[];
  multa: number;
}

export const useContractReader = () => {
  const [isReading, setIsReading] = useState(false);
  const [readerStatus, setReaderStatus] = useState<string>('');
  const [readerResults, setReaderResults] = useState<ContractParserResponse[] | null>(null);
  const { toast } = useToast();

  const processContracts = async () => {
    setIsReading(true);
    setReaderStatus('Iniciando leitura de contratos...');
    
    try {
      // Importação dinâmica para evitar problemas de circular dependency
      const { ContractReaderService } = await import('@/domains/contracts/services/ContractReader');
      
      setReaderStatus('Conectando com o serviço de leitura...');
      const readerService = ContractReaderService.getInstance();
      
      setReaderStatus('Processando documentos...');
      const results = await readerService.processContracts();
      
      setReaderResults(results);
      setReaderStatus(`✅ Processamento concluído! ${results.length} contratos processados.`);
      
      toast({
        title: "Leitura de Contratos Concluída",
        description: `${results.length} contratos foram processados com sucesso.`,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao processar contratos:', errorMessage);
      
      setReaderStatus(`❌ Erro: ${errorMessage}`);
      
      toast({
        title: "Erro na Leitura de Contratos",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsReading(false);
    }
  };

  const clearResults = () => {
    setReaderResults(null);
    setReaderStatus('');
  };

  return {
    processContracts,
    clearResults,
    isReading,
    readerStatus,
    readerResults
  };
};