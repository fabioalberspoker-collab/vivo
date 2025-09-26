// Tipos para o serviço ContractReader

export interface ContractStorageFile {
  id: string;
  name: string;
  bucket: string;
  path: string;
  url: string;
  contentType: string;
}

// Interface do que o Gemini deve retornar (campos exatos da tabela reader)
export interface ContractParserResponse {
  area_responsavel: string;
  contratado: string;
  contratante: string;
  data_vencimento: string;
  datas_vencimento_parcelas: string[];
  forma_pagamento: number;
  localizacao_estado: string;
  localizacao_cidade: string;
  multa: number;
  tipo_fluxo: string;
  valor_contrato: number;
  valor_pagamento: number;
}

// Interface para inserção na tabela reader do Supabase
// Mapeando campos exatos da estrutura da tabela
export interface ContractDatabaseInsert {
  area_responsavel: string;
  contratado: string;
  contratante: string;
  data_vencimento: string;
  datas_vencimento_parcelas: string[];
  forma_pagamento: number;
  localizacao_estado: string;
  localizacao_cidade: string;
  multa: number;
  tipo_fluxo: string;
  valor_contrato: number;
  valor_pagamento: number;
}