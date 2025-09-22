// Serviço para extração de texto de arquivos PDF
// Utiliza pdfjs-dist para processar PDFs e extrair conteúdo textual no browser

import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker do PDF.js
if (typeof globalThis !== 'undefined' && globalThis.window) {
  // Usar worker do CDN que é compatível com a versão instalada
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

export interface PdfExtractionResult {
  text: string;
  info?: {
    Title?: string;
    Author?: string;
    Subject?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: Date;
    ModificationDate?: Date;
  };
  metadata?: {
    totalPages: number;
    textLength: number;
    hasText: boolean;
  };
  error?: string;
}

export class PdfExtractionService {

  /**
   * Valida se o buffer contém um PDF válido
   */
  static async validatePdfBuffer(buffer: ArrayBuffer): Promise<boolean> {
    try {
      const uint8Array = new Uint8Array(buffer);
      const header = new TextDecoder().decode(uint8Array.slice(0, 8));
      return header.startsWith('%PDF-');
    } catch (error) {
      console.error('❌ Erro na validação do PDF:', error);
      return false;
    }
  }

  /**
   * Extrai texto de um PDF usando pdfjs-dist
   */
  static async extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<PdfExtractionResult> {
    try {
      console.log(`📄 Iniciando extração de texto do PDF (${pdfBuffer.byteLength} bytes)`);
      
      if (!await this.validatePdfBuffer(pdfBuffer)) {
        throw new Error('Arquivo não é um PDF válido');
      }

      // Carregar documento PDF
      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
      const pdfDocument = await loadingTask.promise;
      
      const numPages = pdfDocument.numPages;
      let fullText = '';
      
      console.log(`📋 PDF carregado: ${numPages} páginas`);

      // Extrair texto de todas as páginas
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combinar todos os items de texto da página
          const pageText = textContent.items
            .map((item) => {
              if ('str' in item) {
                return item.str;
              }
              return '';
            })
            .join(' ');
          
          fullText += pageText + '\n\n';
          
          console.log(`📃 Página ${pageNum}/${numPages}: ${pageText.length} caracteres extraídos`);
          
        } catch (pageError) {
          console.warn(`⚠️ Erro ao extrair página ${pageNum}:`, pageError);
          fullText += `[Erro na página ${pageNum}]\n\n`;
        }
      }

      // Obter metadados do documento
      let info = {} as Record<string, unknown>;
      try {
        const metadata = await pdfDocument.getMetadata();
        info = (metadata.info as Record<string, unknown>) || {};
      } catch (metaError) {
        console.warn('⚠️ Erro ao obter metadados:', metaError);
      }

      const result: PdfExtractionResult = {
        text: fullText.trim(),
        info: {
          Title: info.Title as string,
          Author: info.Author as string,
          Subject: info.Subject as string,
          Creator: info.Creator as string,
          Producer: info.Producer as string,
          CreationDate: info.CreationDate as Date,
          ModificationDate: info.ModDate as Date
        },
        metadata: {
          totalPages: numPages,
          textLength: fullText.length,
          hasText: fullText.trim().length > 0
        }
      };

      console.log(`✅ Extração concluída: ${fullText.length} caracteres, ${numPages} páginas`);
      
      return result;

    } catch (error) {
      console.error('❌ Erro na extração de texto do PDF:', error);
      return {
        text: '',
        error: error instanceof Error ? error.message : 'Erro desconhecido na extração'
      };
    }
  }

  /**
   * Extrai texto de um PDF via URL
   */
  static async extractTextFromUrl(pdfUrl: string): Promise<PdfExtractionResult> {
    try {
      console.log(`🌐 Baixando PDF: ${pdfUrl}`);
      
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log(`📥 PDF baixado: ${arrayBuffer.byteLength} bytes`);
      
      return await this.extractTextFromPdf(arrayBuffer);

    } catch (error) {
      console.error('❌ Erro ao extrair texto de URL:', error);
      return {
        text: '',
        error: error instanceof Error ? error.message : 'Erro ao baixar PDF'
      };
    }
  }

  /**
   * Verifica se um buffer é um PDF válido sem extrair conteúdo
   */
  static async isPdfValid(buffer: ArrayBuffer): Promise<boolean> {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdfDocument = await loadingTask.promise;
      return pdfDocument.numPages > 0;
    } catch (error) {
      console.error('❌ Erro na validação do PDF:', error);
      return false;
    }
  }

  /**
   * Obtém informações básicas do PDF sem extrair todo o texto
   */
  static async getPdfInfo(buffer: ArrayBuffer): Promise<Partial<PdfExtractionResult>> {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdfDocument = await loadingTask.promise;
      
      let info = {} as Record<string, unknown>;
      try {
        const metadata = await pdfDocument.getMetadata();
        info = (metadata.info as Record<string, unknown>) || {};
      } catch (metaError) {
        console.warn('⚠️ Erro ao obter metadados:', metaError);
      }

      return {
        info: {
          Title: info.Title as string,
          Author: info.Author as string,
          Subject: info.Subject as string,
          Creator: info.Creator as string,
          Producer: info.Producer as string,
          CreationDate: info.CreationDate as Date,
          ModificationDate: info.ModDate as Date
        },
        metadata: {
          totalPages: pdfDocument.numPages,
          textLength: 0, // Não extraído ainda
          hasText: true // Assumindo que tem texto
        }
      };

    } catch (error) {
      console.error('❌ Erro ao obter informações do PDF:', error);
      return {
        error: error instanceof Error ? error.message : 'Erro ao analisar PDF'
      };
    }
  }

  /**
   * Extrai texto de múltiplos PDFs
   */
  static async extractTextFromMultiplePdfs(
    pdfBuffers: { buffer: ArrayBuffer; fileName: string }[]
  ): Promise<{ fileName: string; result: PdfExtractionResult }[]> {
    console.log(`📚 Extraindo texto de ${pdfBuffers.length} PDFs...`);
    
    const results = [];
    
    for (const { buffer, fileName } of pdfBuffers) {
      console.log(`🔄 Processando: ${fileName}`);
      const result = await this.extractTextFromPdf(buffer);
      results.push({ fileName, result });
    }
    
    console.log(`✅ Processamento concluído: ${results.length} arquivos`);
    return results;
  }
}