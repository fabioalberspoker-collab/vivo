// Serviço para buscar e processar documentos dos contratos
import { supabase } from '@/integrations/supabase/client';
import { ContractFromDB } from '@/hooks/useContractFilters';

export interface DocumentContent {
  contractNumber: string;
  url: string;
  content: string;
  error?: string;
}

export class DocumentService {
  
  /**
   * Extrai URLs de documentos dos contratos filtrados
   */
  static getDocumentUrls(contracts: ContractFromDB[]): string[] {
    return contracts
      .map(contract => contract.documento_url)
      .filter((url): url is string => Boolean(url && url.trim()));
  }

  /**
   * Baixa o conteúdo de texto de uma URL
   */
  static async fetchDocumentContent(url: string): Promise<string> {
    try {
      // Configuração de timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain, text/html, application/pdf, */*',
          'User-Agent': 'Vivo Contract Analysis Tool'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Verificar tipo de conteúdo
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/pdf')) {
        // Para PDFs, retornar uma mensagem indicativa
        return `[DOCUMENTO PDF - URL: ${url}]\nEste documento é um PDF que necessita processamento especial para extração de texto.`;
      } else if (contentType.includes('text/') || contentType.includes('application/json')) {
        // Para texto simples, JSON, HTML, etc.
        const text = await response.text();
        return this.extractTextFromHTML(text);
      } else {
        return `[DOCUMENTO BINÁRIO - URL: ${url}]\nTipo de conteúdo: ${contentType}`;
      }

    } catch (error) {
      console.error(`Erro ao buscar documento ${url}:`, error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return `[ERRO: TIMEOUT - URL: ${url}]\nO documento demorou muito para carregar (>30s).`;
        }
        return `[ERRO: ${error.message} - URL: ${url}]`;
      }
      
      return `[ERRO DESCONHECIDO - URL: ${url}]`;
    }
  }

  /**
   * Extrai texto de conteúdo HTML
   */
  private static extractTextFromHTML(html: string): string {
    try {
      // Remove tags HTML básicas e extrai texto
      const text = html
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      return text || '[CONTEÚDO VAZIO]';
    } catch (error) {
      return `[ERRO NA EXTRAÇÃO DE TEXTO: ${error}]`;
    }
  }

  /**
   * Processa múltiplos documentos de contratos
   */
  static async processContractDocuments(contracts: ContractFromDB[]): Promise<DocumentContent[]> {
    const results: DocumentContent[] = [];
    
    for (const contract of contracts) {
      if (!contract.documento_url) {
        results.push({
          contractNumber: contract.numero_contrato,
          url: '',
          content: '[SEM URL DE DOCUMENTO]',
          error: 'URL de documento não fornecida'
        });
        continue;
      }

      try {
        const content = await this.fetchDocumentContent(contract.documento_url);
        
        results.push({
          contractNumber: contract.numero_contrato,
          url: contract.documento_url,
          content: content
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        
        results.push({
          contractNumber: contract.numero_contrato,
          url: contract.documento_url,
          content: `[ERRO AO PROCESSAR DOCUMENTO]\nContrato: ${contract.numero_contrato}\nURL: ${contract.documento_url}\nErro: ${errorMessage}`,
          error: errorMessage
        });
      }
    }

    return results;
  }

  /**
   * Combina conteúdo de documentos em texto único para análise
   */
  static combineDocumentContents(documents: DocumentContent[]): string[] {
    return documents.map(doc => {
      const header = `CONTRATO: ${doc.contractNumber}\nURL: ${doc.url}\n\n`;
      return header + doc.content;
    });
  }

  /**
   * Busca contratos filtrados com documentos válidos
   */
  static async getContractsWithDocuments(): Promise<ContractFromDB[]> {
    try {
      // Aqui você pode usar a mesma lógica de filtros da aplicação
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .not('documento_url', 'is', null)
        .neq('documento_url', '');

      if (error) {
        console.error('Erro ao buscar contratos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao conectar com Supabase:', error);
      return [];
    }
  }
}
