// Serviço para pré-processamento de texto extraído de PDFs
// Limpa, divide em chunks e prepara texto para análise com IA

export interface TextChunk {
  id: string;
  content: string;
  tokens: number;
  startIndex: number;
  endIndex: number;
  contractId?: string;
}

export interface ProcessedText {
  originalText: string;
  cleanedText: string;
  chunks: TextChunk[];
  metadata: {
    originalLength: number;
    cleanedLength: number;
    totalChunks: number;
    averageChunkSize: number;
    estimatedTokens: number;
  };
}

export class TextPreprocessingService {
  // Configurações padrão
  private static readonly MAX_CHUNK_SIZE = 1800; // Tokens por chunk (deixando margem para o prompt)
  private static readonly MIN_CHUNK_SIZE = 200;
  private static readonly OVERLAP_SIZE = 100; // Sobreposição entre chunks
  
  /**
   * Limpa texto extraído de PDF removendo elementos desnecessários
   */
  static cleanExtractedText(rawText: string): string {
    let cleanedText = rawText;
    
    try {
      // 1. Normalizar quebras de linha
      cleanedText = cleanedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // 2. Remover múltiplas quebras de linha consecutivas
      cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
      
      // 3. Remover espaços extras
      cleanedText = cleanedText.replace(/[ \t]+/g, ' ');
      
      // 4. Remover cabeçalhos/rodapés comuns
      const headerFooterPatterns = [
        /página \d+ de \d+/gi,
        /page \d+ of \d+/gi,
        /\d+\/\d+/g,
        /^.*confidencial.*$/gim,
        /^.*proprietary.*$/gim,
        /^.*copyright.*$/gim,
        /^\s*\d+\s*$/gm // Linhas com apenas números (numeração de página)
      ];
      
      headerFooterPatterns.forEach(pattern => {
        cleanedText = cleanedText.replace(pattern, '');
      });
      
      // 5. Limpar espaços no início e fim de linhas
      cleanedText = cleanedText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
      
      // 6. Remover caracteres de controle e não imprimíveis
      cleanedText = cleanedText.replace(/[^\x20-\x7E\n\t\r\u00A0-\uFFFF]/g, '');
      
      console.log(`🧹 Texto limpo: ${rawText.length} → ${cleanedText.length} caracteres`);
      
      return cleanedText.trim();
      
    } catch (error) {
      console.error('❌ Erro na limpeza de texto:', error);
      return rawText; // Retornar texto original em caso de erro
    }
  }

  /**
   * Estima número de tokens aproximado (regra 4 caracteres = 1 token em português)
   */
  static estimateTokens(text: string): number {
    // Estimativa conservadora para português: ~4 caracteres por token
    return Math.ceil(text.length / 4);
  }

  /**
   * Divide texto em chunks respeitando limites de tokens
   */
  static createTextChunks(
    text: string, 
    maxChunkSize: number = this.MAX_CHUNK_SIZE,
    contractId?: string
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    
    if (!text || text.trim().length === 0) {
      return chunks;
    }
    
    try {
      // Dividir por parágrafos primeiro
      const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
      
      let currentChunk = '';
      let currentTokens = 0;
      let chunkIndex = 0;
      let startIndex = 0;
      
      for (const paragraph of paragraphs) {
        const paragraphTokens = this.estimateTokens(paragraph);
        
        // Se parágrafo sozinho excede limite, dividir por frases
        if (paragraphTokens > maxChunkSize) {
          // Salvar chunk atual se não estiver vazio
          if (currentChunk.trim().length > 0) {
            chunks.push(this.createChunk(currentChunk, chunkIndex++, startIndex, contractId));
            currentChunk = '';
            currentTokens = 0;
            startIndex = text.indexOf(currentChunk) + currentChunk.length;
          }
          
          // Dividir parágrafo grande por frases
          const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
          
          for (const sentence of sentences) {
            const sentenceTokens = this.estimateTokens(sentence);
            
            if (currentTokens + sentenceTokens > maxChunkSize && currentChunk.length > 0) {
              chunks.push(this.createChunk(currentChunk, chunkIndex++, startIndex, contractId));
              currentChunk = sentence + '.';
              currentTokens = sentenceTokens;
              startIndex = text.indexOf(currentChunk);
            } else {
              currentChunk += (currentChunk ? ' ' : '') + sentence + '.';
              currentTokens += sentenceTokens;
            }
          }
        } else {
          // Parágrafo normal
          if (currentTokens + paragraphTokens > maxChunkSize && currentChunk.length > 0) {
            chunks.push(this.createChunk(currentChunk, chunkIndex++, startIndex, contractId));
            currentChunk = paragraph;
            currentTokens = paragraphTokens;
            startIndex = text.indexOf(paragraph);
          } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            currentTokens += paragraphTokens;
          }
        }
      }
      
      // Adicionar último chunk se não estiver vazio
      if (currentChunk.trim().length > 0) {
        chunks.push(this.createChunk(currentChunk, chunkIndex, startIndex, contractId));
      }
      
      console.log(`✂️ Texto dividido em ${chunks.length} chunks`);
      
      return chunks;
      
    } catch (error) {
      console.error('❌ Erro ao criar chunks:', error);
      // Fallback: chunk único
      return [this.createChunk(text, 0, 0, contractId)];
    }
  }

  /**
   * Cria um objeto TextChunk
   */
  private static createChunk(
    content: string, 
    index: number, 
    startIndex: number, 
    contractId?: string
  ): TextChunk {
    const tokens = this.estimateTokens(content);
    
    return {
      id: `chunk_${index}_${Date.now()}`,
      content: content.trim(),
      tokens,
      startIndex,
      endIndex: startIndex + content.length,
      contractId
    };
  }

  /**
   * Processa texto completo: limpa e divide em chunks
   */
  static processText(rawText: string, contractId?: string): ProcessedText {
    try {
      console.log(`🔄 Processando texto: ${rawText.length} caracteres`);
      
      const cleanedText = this.cleanExtractedText(rawText);
      const chunks = this.createTextChunks(cleanedText, this.MAX_CHUNK_SIZE, contractId);
      
      const metadata = {
        originalLength: rawText.length,
        cleanedLength: cleanedText.length,
        totalChunks: chunks.length,
        averageChunkSize: chunks.length > 0 ? 
          Math.round(chunks.reduce((sum, chunk) => sum + chunk.tokens, 0) / chunks.length) : 0,
        estimatedTokens: this.estimateTokens(cleanedText)
      };
      
      console.log(`✅ Processamento concluído:`, metadata);
      
      return {
        originalText: rawText,
        cleanedText,
        chunks,
        metadata
      };
      
    } catch (error) {
      console.error('❌ Erro no processamento de texto:', error);
      
      // Fallback em caso de erro
      return {
        originalText: rawText,
        cleanedText: rawText,
        chunks: [this.createChunk(rawText, 0, 0, contractId)],
        metadata: {
          originalLength: rawText.length,
          cleanedLength: rawText.length,
          totalChunks: 1,
          averageChunkSize: this.estimateTokens(rawText),
          estimatedTokens: this.estimateTokens(rawText)
        }
      };
    }
  }

  /**
   * Processa múltiplos textos de contratos
   */
  static processMultipleTexts(
    textsByContract: { contractId: string; text: string; fileName?: string }[]
  ): { contractId: string; processedText: ProcessedText; fileName?: string }[] {
    console.log(`📚 Processando ${textsByContract.length} textos de contratos...`);
    
    return textsByContract.map(({ contractId, text, fileName }) => {
      const processedText = this.processText(text, contractId);
      return { contractId, processedText, fileName };
    });
  }

  /**
   * Valida se chunks estão dentro dos limites aceitáveis
   */
  static validateChunks(chunks: TextChunk[]): boolean {
    return chunks.every(chunk => 
      chunk.tokens >= this.MIN_CHUNK_SIZE && 
      chunk.tokens <= this.MAX_CHUNK_SIZE
    );
  }
}
