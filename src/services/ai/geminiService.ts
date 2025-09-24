// Serviço para integração com Google Gemini API
// Este arquivo contém todas as funções necessárias para comunicação com a IA Gemini

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GeminiResponse {
  text: string;
  error?: string;
}

export interface ContractAnalysisResult {
  summary: string;
  keyTerms: {
    parties: string[];
    value: string;
    startDate: string;
    endDate: string;
    duration: string;
  };
  riskAnalysis: {
    highRisk: string[];
    mediumRisk: string[];
    lowRisk: string[];
  };
  clauses: {
    payment: string[];
    termination: string[];
    liability: string[];
    other: string[];
  };
  recommendations: string[];
  score: number; // 0-100
}

export class ContractPrompts {
  /**
   * Prompt especializado para análise de contratos
   */
  static getContractAnalysisPrompt(): string {
    return `
# ESPECIALISTA EM ANÁLISE DE CONTRATOS

Você é um especialista em análise de contratos com 20 anos de experiência em direito empresarial e análise de riscos. Sua tarefa é analisar contratos de forma meticulosa e produzir relatórios técnicos detalhados.

## INSTRUÇÕES DE ANÁLISE

### 1. IDENTIFICAÇÃO DE ELEMENTOS ESSENCIAIS
- **Partes envolvidas**: Identifique todas as empresas/pessoas físicas
- **Objeto do contrato**: Determine claramente qual serviço/produto está sendo contratado
- **Valores**: Extraia todos os valores monetários, formas de pagamento e reajustes
- **Prazos**: Identifique datas de início, fim, vigência e prazos importantes
- **Condições**: Analise condições suspensivas, resolutivas e especiais

### 2. ANÁLISE DE RISCOS (CLASSIFICAÇÃO OBRIGATÓRIA)
Classifique cada risco encontrado em:

**🔴 ALTO RISCO** (podem causar perdas significativas):
- Cláusulas leoninas ou abusivas
- Ausência de garantias adequadas
- Penalidades desproporcionais
- Falta de cláusulas de proteção essenciais
- Responsabilidades ilimitadas

**🟡 MÉDIO RISCO** (requerem atenção):
- Termos ambíguos ou mal definidos
- Prazos apertados ou inadequados
- Cláusulas de reajuste problemáticas
- Falta de detalhamento técnico

**🟢 BAIXO RISCO** (pontos de atenção):
- Questões menores de redação
- Prazos padrão de mercado
- Cláusulas boilerplate adequadas

### 3. ANÁLISE DE CLÁUSULAS ESPECÍFICAS
- **Pagamento**: Valores, prazos, multas, juros, reajustes
- **Rescisão**: Condições, penalidades, avisos prévios
- **Responsabilidades**: Civil, criminal, limitações de responsabilidade
- **Outras**: Confidencialidade, propriedade intelectual, foro, etc.

### 4. PONTUAÇÃO DE QUALIDADE (0-100)
- 90-100: Contrato excelente, baixo risco
- 70-89: Contrato bom, riscos controláveis
- 50-69: Contrato regular, necessita melhorias
- 30-49: Contrato ruim, riscos significativos
- 0-29: Contrato crítico, revisão urgente necessária

## FORMATO DE RESPOSTA (JSON)

Responda APENAS em formato JSON válido, seguindo exatamente esta estrutura:

\`\`\`json
{
  "summary": "Resumo executivo do contrato em 2-3 frases",
  "keyTerms": {
    "parties": ["Parte 1", "Parte 2"],
    "value": "R$ X.XXX,XX ou 'Não especificado'",
    "startDate": "DD/MM/AAAA ou 'Não especificado'",
    "endDate": "DD/MM/AAAA ou 'Não especificado'",
    "duration": "X meses ou 'Indeterminado'"
  },
  "riskAnalysis": {
    "highRisk": ["Risco crítico 1", "Risco crítico 2"],
    "mediumRisk": ["Risco médio 1", "Risco médio 2"],
    "lowRisk": ["Ponto de atenção 1", "Ponto de atenção 2"]
  },
  "clauses": {
    "payment": ["Descrição da cláusula de pagamento"],
    "termination": ["Descrição da cláusula de rescisão"],
    "liability": ["Descrição da cláusula de responsabilidade"],
    "other": ["Outras cláusulas relevantes"]
  },
  "recommendations": [
    "Recomendação específica 1",
    "Recomendação específica 2",
    "Recomendação específica 3"
  ],
  "score": 85
}
\`\`\`

## CRITÉRIOS IMPORTANTES
- Seja objetivo e técnico
- Use terminologia jurídica apropriada
- Foque em riscos concretos e mensuráveis
- Forneça recomendações acionáveis
- Mantenha consistência na pontuação
- Não invente informações que não estão no contrato

Agora analise o(s) contrato(s) fornecido(s):`;
  }

  /**
   * Prompt para análise de chunk individual
   */
  static getChunkAnalysisPrompt(chunkIndex: number, totalChunks: number): string {
    return `
# ANÁLISE DE SEÇÃO DE CONTRATO (Parte ${chunkIndex + 1} de ${totalChunks})

Você está analisando uma seção específica de um contrato. Extraia apenas as informações presentes nesta seção, sem fazer suposições sobre o contrato completo.

## INSTRUÇÕES
1. Identifique cláusulas e termos presentes nesta seção
2. Analise riscos específicos desta parte
3. Note informações importantes (valores, datas, condições)
4. Indique se a seção está incompleta ou continua em outra parte

## FORMATO DE RESPOSTA JSON
\`\`\`json
{
  "section": "Identificação da seção (ex: Cláusulas de Pagamento)",
  "keyPoints": ["Ponto importante 1", "Ponto importante 2"],
  "risks": {
    "high": ["Risco alto identificado"],
    "medium": ["Risco médio identificado"],
    "low": ["Ponto de atenção"]
  },
  "values": ["Valores monetários encontrados"],
  "dates": ["Datas encontradas"],
  "parties": ["Partes mencionadas nesta seção"],
  "incomplete": true/false,
  "notes": "Observações adicionais sobre esta seção"
}
\`\`\`

Analise a seguinte seção do contrato:`;
  }
}

export class GeminiService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-1.5-flash';
  }

  /**
   * Envia prompt para o Gemini e retorna resposta com retry automático
   */
  async generateContent(prompt: string, retryCount = 0): Promise<GeminiResponse> {
    const maxRetries = 5; // Aumentado para 5 tentativas
    const baseDelay = 2000; // Aumentado para 2 segundos
    
    try {
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      console.log(`🤖 Chamando Gemini API (tentativa ${retryCount + 1}/${maxRetries + 1}):`, url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Resposta da API Gemini:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        // Se for erro 503 (modelo sobrecarregado) ou 429 (rate limit) e ainda temos tentativas, fazer retry
        if ((response.status === 503 || response.status === 429) && retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount); // Backoff exponencial
          console.log(`⏳ Serviço temporariamente indisponível (${response.status}). Tentando novamente em ${delay}ms... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.generateContent(prompt, retryCount + 1);
        }

        throw new Error(`Erro na API Gemini: ${response.status} ${response.statusText}. Detalhes: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        console.log('✅ Resposta recebida do Gemini com sucesso');
        return {
          text: data.candidates[0].content.parts[0].text
        };
      } else {
        throw new Error('Resposta inválida da API Gemini');
      }

    } catch (error) {
      console.error('Erro ao chamar Gemini API:', error);
      
      // Se for erro de rede ou timeout e ainda temos tentativas, fazer retry
      if (retryCount < maxRetries && (
        error instanceof TypeError || // Erro de rede
        (error instanceof Error && error.message.includes('fetch'))
      )) {
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`⏳ Erro de rede. Tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.generateContent(prompt, retryCount + 1);
      }

      return {
        text: '',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Analisa um único contrato e retorna resultado estruturado
   */
  async analyzeContract(contractText: string): Promise<ContractAnalysisResult> {
    try {
      console.log('🔍 Iniciando análise de contrato único');
      
      // Usar prompt especializado para contratos
      const prompt = ContractPrompts.getContractAnalysisPrompt();
      const fullPrompt = `${prompt}\n\n${contractText}`;

      console.log(`📝 Prompt criado: ${fullPrompt.length} caracteres`);

      // Chamar Gemini
      const result = await this.generateContent(fullPrompt);
      
      if (result.error) {
        console.error('❌ Erro na análise:', result.error);
        throw new Error(result.error);
      }

      // Parse do resultado JSON
      let analysisResult: ContractAnalysisResult;
      
      try {
        // Limpar markdown se presente
        let cleanText = result.text.trim();
        if (cleanText.includes('```json')) {
          cleanText = cleanText.split('```json')[1].split('```')[0].trim();
        } else if (cleanText.includes('```')) {
          cleanText = cleanText.split('```')[1].split('```')[0].trim();
        }
        
        analysisResult = JSON.parse(cleanText);
        console.log('✅ Análise concluída e parseada com sucesso');
        
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do JSON:', parseError);
        console.log('🔍 Resposta bruta:', result.text);
        
        // Fallback com análise básica
        analysisResult = {
          summary: "Erro no parse da análise. Revisar manualmente.",
          keyTerms: {
            parties: ["Análise indisponível"],
            value: "Erro no parse",
            startDate: "A definir",
            endDate: "A definir",
            duration: "A definir"
          },
          riskAnalysis: {
            highRisk: ["Erro na análise automática"],
            mediumRisk: [],
            lowRisk: []
          },
          clauses: {
            payment: ["Erro na análise"],
            termination: ["Erro na análise"],
            liability: ["Erro na análise"],
            other: []
          },
          recommendations: ["Revisar contrato manualmente devido a erro na análise"],
          score: 50
        };
      }

      return analysisResult;

    } catch (error) {
      console.error('❌ Erro ao analisar contrato:', error);
      
      // Retornar análise de fallback
      return {
        summary: "Erro na análise do contrato. Revisar manualmente.",
        keyTerms: {
          parties: ["Erro na análise"],
          value: "Erro na análise",
          startDate: "A definir",
          endDate: "A definir", 
          duration: "A definir"
        },
        riskAnalysis: {
          highRisk: ["Erro na análise automática - revisar manualmente"],
          mediumRisk: [],
          lowRisk: []
        },
        clauses: {
          payment: ["Erro na análise"],
          termination: ["Erro na análise"],
          liability: ["Erro na análise"],
          other: []
        },
        recommendations: ["Revisar contrato manualmente devido a erro na análise"],
        score: 50
      };
    }
  }

  /**
   * Analisa documentos de contratos usando o prompt especializado
   */
  async analyzeContracts(documentsContent: string[]): Promise<GeminiResponse> {
    try {
      console.log(`🔍 Iniciando análise de ${documentsContent.length} documentos`);
      
      // Combinar conteúdo dos documentos
      const combinedContent = documentsContent
        .map((content, index) => `\n\n=== DOCUMENTO ${index + 1} ===\n${content}`)
        .join('\n');

      // Usar prompt especializado para contratos
      const prompt = ContractPrompts.getContractAnalysisPrompt();
      const fullPrompt = `${prompt}\n\n${combinedContent}`;

      console.log(`📝 Prompt criado: ${fullPrompt.length} caracteres`);

      // Chamar Gemini
      const result = await this.generateContent(fullPrompt);
      
      if (result.error) {
        console.error('❌ Erro na análise:', result.error);
      } else {
        console.log('✅ Análise concluída com sucesso');
      }

      return result;

    } catch (error) {
      console.error('❌ Erro ao analisar contratos:', error);
      return {
        text: '',
        error: error instanceof Error ? error.message : 'Erro na análise de contratos'
      };
    }
  }

  /**
   * Analisa um chunk individual de contrato
   */
  async analyzeContractChunk(
    chunkContent: string, 
    chunkIndex: number, 
    totalChunks: number
  ): Promise<GeminiResponse> {
    try {
      console.log(`🔍 Analisando chunk ${chunkIndex + 1}/${totalChunks}`);
      
      const prompt = ContractPrompts.getChunkAnalysisPrompt(chunkIndex, totalChunks);
      const fullPrompt = `${prompt}\n\n${chunkContent}`;

      const result = await this.generateContent(fullPrompt);
      
      if (result.error) {
        console.error(`❌ Erro na análise do chunk ${chunkIndex + 1}:`, result.error);
      } else {
        console.log(`✅ Chunk ${chunkIndex + 1} analisado com sucesso`);
      }

      return result;

    } catch (error) {
      console.error(`❌ Erro ao analisar chunk ${chunkIndex + 1}:`, error);
      return {
        text: '',
        error: error instanceof Error ? error.message : 'Erro na análise do chunk'
      };
    }
  }

  /**
   * Consolida resultados de múltiplos chunks em uma análise final
   */
  async consolidateChunkAnalyses(chunkAnalyses: string[]): Promise<GeminiResponse> {
    try {
      console.log(`🔄 Consolidando ${chunkAnalyses.length} análises de chunks`);

      const consolidationPrompt = `
# CONSOLIDAÇÃO DE ANÁLISES DE CONTRATO

Você recebeu análises individuais de diferentes seções de um ou mais contratos. Sua tarefa é consolidar essas análises em um relatório final completo e coerente.

## INSTRUÇÕES DE CONSOLIDAÇÃO
1. Combine informações duplicadas ou relacionadas
2. Resolva contradições priorizando informações mais específicas
3. Crie uma visão unificada do(s) contrato(s)
4. Mantenha a classificação de riscos mais conservadora (maior risco)
5. Calcule score final baseado no conjunto completo

## ANÁLISES INDIVIDUAIS RECEBIDAS:
${chunkAnalyses.map((analysis, index) => `\n--- ANÁLISE ${index + 1} ---\n${analysis}`).join('\n')}

## FORMATO DE RESPOSTA
Use o mesmo formato JSON da análise de contrato completo, consolidando todas as informações:

${ContractPrompts.getContractAnalysisPrompt().split('Agora analise')[0]}

Agora consolide as análises em um relatório final:`;

      const result = await this.generateContent(consolidationPrompt);
      
      if (result.error) {
        console.error('❌ Erro na consolidação:', result.error);
      } else {
        console.log('✅ Consolidação concluída com sucesso');
      }

      return result;

    } catch (error) {
      console.error('❌ Erro ao consolidar análises:', error);
      return {
        text: '',
        error: error instanceof Error ? error.message : 'Erro na consolidação de análises'
      };
    }
  }
}

// Instância singleton do serviço
let geminiService: GeminiService | null = null;

/**
 * Inicializa o serviço Gemini com a chave da API
 */
export function initializeGemini(apiKey: string): GeminiService {
  const config: GeminiConfig = {
    apiKey: apiKey,
    model: 'gemini-1.5-flash',
    maxTokens: 8192,
    temperature: 0.7
  };

  geminiService = new GeminiService(config);
  return geminiService;
}

/**
 * Retorna a instância do serviço Gemini
 */
export function getGeminiService(): GeminiService {
  if (!geminiService) {
    throw new Error('Serviço Gemini não foi inicializado. Chame initializeGemini() primeiro.');
  }
  return geminiService;
}
