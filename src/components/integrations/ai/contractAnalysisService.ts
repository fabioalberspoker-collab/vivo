// Serviço principal para orquestrar análise completa de contratos
// Coordena extração de PDF, preprocessamento, análise por chunks e consolidação

import { SupabaseStorageService } from './supabaseStorageService';
import { PdfExtractionService } from './pdfExtractionService';
import { TextPreprocessingService, ProcessedText, TextChunk } from './textPreprocessingService';
import { GeminiService, ContractAnalysisResult } from './geminiService';

export interface ContractFile {
  contractId: string;
  fileName: string;
  filePath: string;
  bucketName?: string;
}

export interface AnalysisProgress {
  stage: 'downloading' | 'extracting' | 'preprocessing' | 'analyzing' | 'consolidating' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  currentFile?: string;
  currentChunk?: number;
  totalChunks?: number;
}

export interface ContractAnalysisOptions {
  maxChunksPerBatch?: number;
  enableParallelProcessing?: boolean;
  onProgress?: (progress: AnalysisProgress) => void;
}

export interface AnalysisResult {
  contractId: string;
  fileName: string;
  analysis: ContractAnalysisResult;
  processingTime: number;
  error?: string;
}

export interface BatchAnalysisResult {
  results: AnalysisResult[];
  totalProcessingTime: number;
  successCount: number;
  errorCount: number;
  summary: string;
}

export class ContractAnalysisService {
  private geminiService: GeminiService;

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
  }

  /**
   * Analisa um único contrato do início ao fim
   */
  async analyzeContract(
    contractFile: ContractFile,
    options: ContractAnalysisOptions = {}
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const { onProgress } = options;

    try {
      console.log(`🚀 Iniciando análise do contrato: ${contractFile.fileName}`);

      // 1. Download do arquivo
      onProgress?.({
        stage: 'downloading',
        progress: 10,
        message: `Baixando arquivo ${contractFile.fileName}...`,
        currentFile: contractFile.fileName
      });

      const fileBuffer = await SupabaseStorageService.downloadFile(
        contractFile.filePath,
        contractFile.bucketName
      );

      // 2. Extração de texto do PDF
      onProgress?.({
        stage: 'extracting',
        progress: 25,
        message: 'Extraindo texto do PDF...',
        currentFile: contractFile.fileName
      });

      const extractedResult = await PdfExtractionService.extractTextFromPdf(fileBuffer);
      
      if (extractedResult.error || !extractedResult.text) {
        throw new Error(extractedResult.error || 'Falha na extração de texto do PDF');
      }
      
      const extractedText = extractedResult.text;

      if (!extractedText || extractedText.length < 100) {
        throw new Error('Texto extraído é muito curto ou está vazio');
      }

      // 3. Pré-processamento e criação de chunks
      onProgress?.({
        stage: 'preprocessing',
        progress: 40,
        message: 'Processando e dividindo texto...',
        currentFile: contractFile.fileName
      });

      const processedText = TextPreprocessingService.processText(
        extractedText,
        contractFile.contractId
      );

      if (processedText.chunks.length === 0) {
        throw new Error('Nenhum chunk foi gerado do texto');
      }

      console.log(`📄 Texto processado: ${processedText.chunks.length} chunks gerados`);

      // 4. Análise por chunks ou análise direta
      onProgress?.({
        stage: 'analyzing',
        progress: 50,
        message: `Analisando conteúdo (${processedText.chunks.length} seções)...`,
        currentFile: contractFile.fileName,
        totalChunks: processedText.chunks.length
      });

      let finalAnalysis: string;

      if (processedText.chunks.length === 1) {
        // Se há apenas um chunk, fazer análise direta
        const result = await this.geminiService.analyzeContracts([processedText.chunks[0].content]);
        finalAnalysis = result.text;
      } else {
        // Múltiplos chunks: análise por partes + consolidação
        finalAnalysis = await this.analyzeByChunks(processedText.chunks, onProgress);
      }

      if (!finalAnalysis) {
        throw new Error('Análise retornou resultado vazio');
      }

      // 5. Parse do resultado JSON
      onProgress?.({
        stage: 'consolidating',
        progress: 90,
        message: 'Finalizando análise...',
        currentFile: contractFile.fileName
      });

      const analysis = this.parseAnalysisResult(finalAnalysis);
      const processingTime = Date.now() - startTime;

      onProgress?.({
        stage: 'completed',
        progress: 100,
        message: 'Análise concluída com sucesso!',
        currentFile: contractFile.fileName
      });

      console.log(`✅ Análise concluída em ${processingTime}ms`);

      return {
        contractId: contractFile.contractId,
        fileName: contractFile.fileName,
        analysis,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      console.error(`❌ Erro na análise de ${contractFile.fileName}:`, error);

      onProgress?.({
        stage: 'error',
        progress: 0,
        message: `Erro: ${errorMessage}`,
        currentFile: contractFile.fileName
      });

      return {
        contractId: contractFile.contractId,
        fileName: contractFile.fileName,
        analysis: this.createErrorAnalysis(errorMessage),
        processingTime,
        error: errorMessage
      };
    }
  }

  /**
   * Analisa múltiplos contratos em lote
   */
  async analyzeMultipleContracts(
    contractFiles: ContractFile[],
    options: ContractAnalysisOptions = {}
  ): Promise<BatchAnalysisResult> {
    const startTime = Date.now();
    const results: AnalysisResult[] = [];
    
    console.log(`📚 Iniciando análise em lote de ${contractFiles.length} contratos`);

    for (let i = 0; i < contractFiles.length; i++) {
      const file = contractFiles[i];
      
      try {
        const result = await this.analyzeContract(file, {
          ...options,
          onProgress: (progress) => {
            // Atualizar progresso global
            const globalProgress = {
              ...progress,
              progress: Math.round((i / contractFiles.length) * 100 + progress.progress / contractFiles.length),
              message: `[${i + 1}/${contractFiles.length}] ${progress.message}`
            };
            options.onProgress?.(globalProgress);
          }
        });
        
        results.push(result);
        
      } catch (error) {
        console.error(`❌ Erro na análise do arquivo ${file.fileName}:`, error);
        
        results.push({
          contractId: file.contractId,
          fileName: file.fileName,
          analysis: this.createErrorAnalysis(error instanceof Error ? error.message : 'Erro desconhecido'),
          processingTime: 0,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    const successCount = results.filter(r => !r.error).length;
    const errorCount = results.filter(r => r.error).length;

    console.log(`📊 Análise em lote concluída: ${successCount} sucessos, ${errorCount} erros`);

    return {
      results,
      totalProcessingTime,
      successCount,
      errorCount,
      summary: this.createBatchSummary(results)
    };
  }

  /**
   * Analisa texto por chunks quando há múltiplos chunks
   */
  private async analyzeByChunks(
    chunks: TextChunk[],
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<string> {
    const chunkAnalyses: string[] = [];

    // Analisar cada chunk individualmente
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      onProgress?.({
        stage: 'analyzing',
        progress: 50 + (i / chunks.length) * 30,
        message: `Analisando seção ${i + 1} de ${chunks.length}...`,
        currentChunk: i + 1,
        totalChunks: chunks.length
      });

      const result = await this.geminiService.analyzeContractChunk(
        chunk.content,
        i,
        chunks.length
      );

      if (result.text) {
        chunkAnalyses.push(result.text);
      } else {
        console.warn(`⚠️ Chunk ${i + 1} retornou resultado vazio`);
      }
    }

    // Consolidar análises dos chunks
    onProgress?.({
      stage: 'consolidating',
      progress: 85,
      message: 'Consolidando análises...'
    });

    const consolidationResult = await this.geminiService.consolidateChunkAnalyses(chunkAnalyses);
    
    return consolidationResult.text;
  }

  /**
   * Parse do resultado JSON da análise
   */
  private parseAnalysisResult(analysisText: string): ContractAnalysisResult {
    try {
      // Extrair JSON do texto (pode vir dentro de ```json```)
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       analysisText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Formato JSON não encontrado na resposta');
      }

      const jsonText = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonText);

      // Validar estrutura esperada
      return {
        summary: parsed.summary || 'Resumo não disponível',
        keyTerms: {
          parties: parsed.keyTerms?.parties || [],
          value: parsed.keyTerms?.value || 'Não especificado',
          startDate: parsed.keyTerms?.startDate || 'Não especificado',
          endDate: parsed.keyTerms?.endDate || 'Não especificado',
          duration: parsed.keyTerms?.duration || 'Não especificado'
        },
        riskAnalysis: {
          highRisk: parsed.riskAnalysis?.highRisk || [],
          mediumRisk: parsed.riskAnalysis?.mediumRisk || [],
          lowRisk: parsed.riskAnalysis?.lowRisk || []
        },
        clauses: {
          payment: parsed.clauses?.payment || [],
          termination: parsed.clauses?.termination || [],
          liability: parsed.clauses?.liability || [],
          other: parsed.clauses?.other || []
        },
        recommendations: parsed.recommendations || [],
        score: parsed.score || 0
      };

    } catch (error) {
      console.error('❌ Erro ao fazer parse da análise:', error);
      console.log('📋 Texto da análise:', analysisText);
      
      return this.createErrorAnalysis('Erro no parse do resultado da análise');
    }
  }

  /**
   * Cria análise de erro padrão
   */
  private createErrorAnalysis(errorMessage: string): ContractAnalysisResult {
    return {
      summary: `Erro na análise: ${errorMessage}`,
      keyTerms: {
        parties: [],
        value: 'Erro na análise',
        startDate: 'Erro na análise',
        endDate: 'Erro na análise',
        duration: 'Erro na análise'
      },
      riskAnalysis: {
        highRisk: [`Análise não pôde ser concluída: ${errorMessage}`],
        mediumRisk: [],
        lowRisk: []
      },
      clauses: {
        payment: [],
        termination: [],
        liability: [],
        other: []
      },
      recommendations: ['Revisar documento e tentar análise novamente'],
      score: 0
    };
  }

  /**
   * Cria resumo dos resultados do lote
   */
  private createBatchSummary(results: AnalysisResult[]): string {
    const successCount = results.filter(r => !r.error).length;
    const errorCount = results.filter(r => r.error).length;
    const averageScore = results
      .filter(r => !r.error)
      .reduce((sum, r) => sum + r.analysis.score, 0) / successCount || 0;

    return `Análise de ${results.length} contratos concluída. ` +
           `${successCount} analisados com sucesso, ${errorCount} com erro. ` +
           `Pontuação média: ${Math.round(averageScore)}/100.`;
  }
}