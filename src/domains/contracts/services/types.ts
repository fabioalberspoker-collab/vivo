// Tipos para o serviço ContractReader
export interface ContractStorageFile {
  id: string;
  name: string;
  bucket: string;
  path: string;
  url: string;
  contentType: string;
}

export interface ContractParserResponse {
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