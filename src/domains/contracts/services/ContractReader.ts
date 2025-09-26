import { supabase } from '@/integrations/supabase/client';
import { ContractParserResponse, ContractStorageFile, ContractDatabaseInsert } from './types';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class ContractReaderService {
  private static instance: ContractReaderService;
  private model;

  private constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY não encontrada nas variáveis de ambiente');
    }
    
    console.log('🔑 Inicializando Gemini API...');
    console.log('📝 API Key:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'não definida');
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-001",
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        }
      });
      console.log('✅ Gemini API inicializada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar Gemini API:', error);
      throw new Error(`Falha ao inicializar Gemini API: ${error.message}`);
    }
  }

  public static getInstance(): ContractReaderService {
    if (!ContractReaderService.instance) {
      ContractReaderService.instance = new ContractReaderService();
    }
    return ContractReaderService.instance;
  }

  private async listDocuments(): Promise<ContractStorageFile[]> {
    console.log('📄 Listing documents from Supabase storage...');
    console.log('🔗 Project URL:', 'https://supabase.com/dashboard/project/jstytygxbnapydwkvpzk');
    console.log('📦 Target bucket:', 'documentos');
    
    // Use the confirmed bucket name directly
    const targetBucket = 'documentos';
    
    // Check authentication and connection status
    try {
      console.log('🔐 Checking authentication...');
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('❌ Auth error:', authError.message);
        throw authError;
      }

      console.log('👤 Auth status:', {
        isAuthenticated: !!session,
        role: session?.user?.role || 'anon',
      });
      
      console.log('🔍 Checking Supabase connection and permissions...');
      
      // Check if bucket exists without trying to create it
      try {
        console.log('🔍 Checking if "documentos" bucket exists...');
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        
        if (bucketError) {
          console.warn('⚠️ Error listing buckets:', bucketError.message);
          console.log('📋 Continuing with assumption that "documentos" bucket exists...');
        } else {
          const documentosBucket = buckets.find(bucket => bucket.name === 'documentos' || bucket.id === 'documentos');
          
          if (documentosBucket) {
            console.log('✅ Found "documentos" bucket:', documentosBucket);
          } else {
            console.warn('⚠️ "documentos" bucket not found in bucket list');
            console.log('📋 Available buckets:', buckets.map(b => b.name || b.id));
            console.log('� Note: You may need to create the "documentos" bucket manually in Supabase Dashboard');
          }
        }
      } catch (e) {
        console.warn('⚠️ Could not check bucket existence:', e);
        console.log('� Continuing with assumption that "documentos" bucket exists...');
      }
        console.error('❌ Error listing buckets:', bucketError.message);
      
    } catch (e) {
      console.error('❌ Error during setup checks:', e);
      // Continue anyway - bucket might still work
    }
    
    // Try to list files from "documentos" bucket
    console.log('📂 Attempting to list files from "documentos" bucket...');
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from(targetBucket)
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (rootError) {
      console.error('❌ Error listing documents:', rootError);
      console.error('Error message:', rootError.message);
      
      // Add specific guidance for RLS problems
      if (rootError.message.includes('RLS') || rootError.message.includes('policy')) {
        console.error('🔒 This appears to be a Row Level Security (RLS) issue.');
        console.error('💡 Solutions:');
        console.error('1. Disable RLS for the storage.objects table');
        console.error('2. Create appropriate RLS policies for storage access');
        console.error('3. Make sure the bucket is public or you have the right permissions');
      }
      
      throw rootError;
    }

    // Log do resultado da listagem
    console.log('🔍 Supabase list response:', {
      rootFiles,
      bucketName: targetBucket,
      storageClient: supabase.storage,
    });

    if (!rootFiles) {
      console.warn('⚠️ No response from storage.list()');
      return [];
    }

    // Filtrar apenas arquivos (não pastas) e criar objetos ContractStorageFile
    const files = rootFiles
      .filter(file => !file.metadata?.isDir && file.name) // Ignorar pastas e arquivos sem nome
      .map(file => {
        const contractFile = {
          id: file.id,
          name: file.name,
          bucket: targetBucket,
          path: file.name,
          url: supabase.storage.from(targetBucket).getPublicUrl(file.name).data.publicUrl,
          contentType: file.metadata?.mimetype || 'text/plain'
        };
        console.log('📄 Found file:', contractFile);
        return contractFile;
      });

    // Log do resultado final
    console.log(`📊 Files found in bucket:
      Total files: ${files.length}
      Files: ${files.map(f => f.name).join(', ')}
    `);

    if (files.length === 0) {
      console.warn('⚠️ No documents found in the bucket. Please check:');
      console.warn('1. If the files were uploaded successfully');
      console.warn(`2. If you have the correct bucket name (currently using "${targetBucket}")`);
      console.warn('3. If the files are in the root of the bucket (not in a subfolder)');
      console.warn('4. If you have the correct permissions');
    }

    return files;
  }

  private async downloadDocument(file: ContractStorageFile): Promise<string> {
    console.log(`📥 Downloading document: ${file.name}`);
    console.log('File details:', {
      bucket: file.bucket,
      path: file.path,
      contentType: file.contentType,
      url: file.url
    });
    
    try {
      const { data, error } = await supabase.storage
        .from(file.bucket)
        .download(file.path);

      if (error) {
        console.error(`❌ Error downloading document ${file.name}:`, error);
        console.error('Request details:', {
          bucket: file.bucket,
          path: file.path,
          error: error.message
        });
        throw error;
      }

      if (!data) {
        console.error(`❌ No data received for document ${file.name}`);
        throw new Error('No data received from storage');
      }

      let text: string;

      // Se for um arquivo PDF, precisamos extrair o texto usando pdf.js
      if (file.contentType?.includes('pdf')) {
        console.log('📑 Processing PDF file...');
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
          
          const arrayBuffer = await data.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          console.log(`📄 PDF loaded successfully:
            - Number of pages: ${pdf.numPages}
            - Pages: ${pdf.numPages}
          `);
          
          const textContent: string[] = [];
          
          // Extrair texto de todas as páginas
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
              .map(item => 'str' in item ? item.str : '')
              .join(' ');
            textContent.push(pageText);
          }
          
          text = textContent.join('\\n');
          
          if (!text || text.length === 0) {
            console.error(`❌ No text extracted from PDF ${file.name}`);
            throw new Error('PDF is empty or could not be parsed');
          }
          
          console.log(`📄 Successfully extracted text from PDF:
            - Pages processed: ${pdf.numPages}
            - Content length: ${text.length} characters
          `);
        } catch (pdfError) {
          console.error(`❌ Error parsing PDF ${file.name}:`, pdfError);
          throw new Error(`Failed to parse PDF: ${pdfError.message}`);
        }
      } else {
        // Tentar ler o arquivo como texto
        try {
          text = await data.text();
          if (!text || text.length === 0) {
            console.error(`❌ Empty content in file ${file.name}`);
            throw new Error('File is empty');
          }
        } catch (textError) {
          console.error(`❌ Error reading text file ${file.name}:`, textError);
          throw new Error(`Failed to read text file: ${textError.message}`);
        }
      }

        console.log(`📝 Successfully read text from ${file.name}:
          - Content length: ${text.length} characters
          - Content type: ${file.contentType}
          - First 100 chars: ${text.substring(0, 100)}...
          - Last 100 chars: ...${text.substring(Math.max(0, text.length - 100))}
        `);

      console.log(`📝 Content preview:
        - First 100 chars: ${text.substring(0, 100)}...
        - Last 100 chars: ...${text.substring(Math.max(0, text.length - 100))}
      `);

      return text;
    } catch (error) {
      console.error(`❌ Fatal error processing file ${file.name}:`, error);
      throw error;
    }
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async parseContractWithRetry(
    content: string, 
    maxRetries: number = 3,
    initialDelay: number = 60000 // 60 segundos inicial
  ): Promise<ContractParserResponse> {
    let lastError: Error | null = null;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        console.log('🔄 Tentativa', retryCount + 1, 'de', maxRetries);
        
        const prompt = `Você é um assistente especializado em análise de contratos. Analise o texto do contrato fornecido e extraia as informações solicitadas no formato JSON especificado abaixo.

IMPORTANTE: Retorne APENAS o objeto JSON, sem nenhum texto adicional. TODOS os campos são obrigatórios.

{
  "area_responsavel": string (área responsável pelo contrato),
  "contratado": string (nome do fornecedor/contratada),
  "contratante": string (nome da empresa contratante),
  "data_vencimento": string (data final em formato YYYY-MM-DD, ex: "2025-12-31"),
  "datas_vencimento_parcelas": string[] (array de datas em formato YYYY-MM-DD das parcelas),
  "forma_pagamento": number (quantidade total de parcelas do contrato - MUITO IMPORTANTE: contar quantas parcelas existem),
  "localizacao_estado": string (estado de execução, apenas sigla ex: "SP"),
  "localizacao_cidade": string (cidade de execução),
  "multa": number (valor da multa em reais, apenas números),
  "tipo_fluxo": string (um dos valores: "RE", "FI", "Engenharia", "RC", "Infraestrutura", "Obras", "Serviços"),
  "valor_contrato": number (valor total do contrato em reais, apenas números),
  "valor_pagamento": number (valor de cada pagamento/parcela em reais, apenas números)
}

REGRAS IMPORTANTES:
- O campo "forma_pagamento" deve conter o NÚMERO DE PARCELAS do contrato (ex: se tem 12 parcelas mensais, retornar 12)
- Se o contrato menciona pagamento à vista, usar 1
- Se não especificar parcelas, analisar o contexto e inferir baseado nas datas de vencimento
- Para campos numéricos sem valor, use 0
- Para campos de texto sem valor, use "Não informado"
- Para arrays vazios, use []
- Para datas sem valor, use "2001-01-01"

TEXTO DO CONTRATO:
${content}`;

        console.log('📤 Enviando requisição para API do Gemini...');
        console.log('📝 Tamanho do prompt:', prompt.length, 'caracteres');
        
        const result = await this.model.generateContent(prompt);
        console.log('✅ Resposta recebida do Gemini');
        const response = await result.response;
        const text = response.text();
        
        console.log('📝 Resposta bruta:', text.substring(0, 200) + '...');
        
        try {
          // Tenta extrair apenas o JSON se houver texto adicional
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          const jsonText = jsonMatch ? jsonMatch[0] : text;
          
          const parsed = JSON.parse(jsonText);
          console.log('✅ Dados do contrato extraídos com sucesso:', parsed);
          return parsed;
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse da resposta JSON:', parseError);
          console.error('Texto que falhou o parse:', text);
          throw new Error('Falha ao converter resposta da API em JSON');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Verifica se é um erro de limite de requisições (429)
        if (lastError.message.includes('429') || lastError.message.includes('quota exceeded')) {
          retryCount++;
          const delayTime = initialDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          console.log(`⏳ Rate limit hit. Retry ${retryCount}/${maxRetries} in ${delayTime/1000} seconds...`);
          await this.delay(delayTime);
          continue;
        }
        
        // Se não for erro de limite, lança o erro imediatamente
        throw error;
      }
    }
    
    throw lastError;
  }

  private async parseContract(content: string): Promise<ContractParserResponse> {
    console.log('🤖 Analyzing contract with Gemini AI...');
    try {
      console.log('🔄 Sending request to Gemini with retry logic...');
      console.log('📝 Content preview:', content.substring(0, 100) + '...');
      
      return await this.parseContractWithRetry(content);
    } catch (error) {
      console.error('❌ Error calling Gemini API:', error);
      throw error;
    }
  }

  public async processContracts(): Promise<ContractParserResponse[]> {
    try {
      console.log('🚀 Starting contract processing...');
      
      const files = await this.listDocuments();
      console.log(`📂 Found ${files.length} files to process`);
      
      if (files.length === 0) {
        console.warn('⚠️ No files found in the documentos bucket. Please upload some contracts first.');
        return [];
      }

      const results: ContractParserResponse[] = [];
      let successCount = 0;
      let errorCount = 0;

      for (const file of files) {
        try {
          console.log(`\n📄 Processing file: ${file.name}`);
          
          const content = await this.downloadDocument(file);
          console.log(`📝 Downloaded content length: ${content.length} characters`);
          
          if (!content || content.length === 0) {
            console.warn(`⚠️ Empty content for file ${file.name}, skipping...`);
            errorCount++;
            continue;
          }

          const parsedContract = await this.parseContract(content);
          results.push(parsedContract);
          
          // Salvar o contrato processado na base de dados
          try {
            await this.saveToDatabase(parsedContract, file);
            console.log(`💾 Contract saved to database for file: ${file.name}`);
          } catch (saveError) {
            console.error(`⚠️ Failed to save contract to database for ${file.name}:`, saveError);
            // Não falha o processamento se o salvamento der erro, apenas registra
          }
          
          successCount++;
          
          console.log(`✅ Successfully processed ${file.name}`);
        } catch (error) {
          console.error(`❌ Error processing file ${file.name}:`, error);
          errorCount++;
          continue;
        }
      }

      console.log(`\n📊 Processing complete:
        - Total files: ${files.length}
        - Successful: ${successCount}
        - Failed: ${errorCount}
      `);

      return results;
    } catch (error) {
      console.error('❌ Fatal error processing contracts:', error);
      throw error;
    }
  }

  private generateContractNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CTR-${year}${month}${day}-${random}`;
  }

  private getDefaultValue(value: string | number | null | undefined, type: 'string' | 'number' | 'date'): string | number {
    if (value !== null && value !== undefined && value !== '' && value !== 0) {
      return value;
    }
    
    switch (type) {
      case 'string':
        return 'Não informado';
      case 'number':
        return 0;
      case 'date':
        return '2001-01-01';
      default:
        return 'Não informado';
    }
  }

  private getSmartDefaults(parsedData: ContractParserResponse, file: ContractStorageFile): ContractDatabaseInsert {
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extensão
    
    const result: ContractDatabaseInsert = {
      area_responsavel: this.getDefaultValue(parsedData.area_responsavel, 'string') as string || 'Área não definida',
      contratado: this.getDefaultValue(parsedData.contratado, 'string') as string || `Fornecedor - ${fileName}`,
      contratante: this.getDefaultValue(parsedData.contratante, 'string') as string || 'Empresa Contratante',
      data_vencimento: this.getDefaultValue(parsedData.data_vencimento, 'date') as string,
      datas_vencimento_parcelas: parsedData.datas_vencimento_parcelas || [],
      forma_pagamento: Math.max(1, Math.round(this.getDefaultValue(parsedData.forma_pagamento, 'number') as number || 1)), // Minimum 1 installment
      localizacao_estado: this.getDefaultValue(parsedData.localizacao_estado, 'string') as string || 'SP',
      localizacao_cidade: this.getDefaultValue(parsedData.localizacao_cidade, 'string') as string || 'São Paulo',
      multa: this.getDefaultValue(parsedData.multa, 'number') as number,
      tipo_fluxo: this.getDefaultValue(parsedData.tipo_fluxo, 'string') as string || 'Não classificado',
      valor_contrato: this.getDefaultValue(parsedData.valor_contrato, 'number') as number,
      valor_pagamento: this.getDefaultValue(parsedData.valor_pagamento, 'number') as number
    };

    // Log dos valores padrão aplicados
    const defaultsUsed = [];
    if (!parsedData.area_responsavel) defaultsUsed.push('area_responsavel');
    if (!parsedData.contratado) defaultsUsed.push('contratado');
    if (!parsedData.contratante) defaultsUsed.push('contratante');
    if (!parsedData.data_vencimento) defaultsUsed.push('data_vencimento');
    if (!parsedData.datas_vencimento_parcelas || parsedData.datas_vencimento_parcelas.length === 0) defaultsUsed.push('datas_vencimento_parcelas');
    if (!parsedData.forma_pagamento) defaultsUsed.push('forma_pagamento');
    if (!parsedData.localizacao_estado) defaultsUsed.push('localizacao_estado');
    if (!parsedData.localizacao_cidade) defaultsUsed.push('localizacao_cidade');
    if (!parsedData.multa) defaultsUsed.push('multa');
    if (!parsedData.tipo_fluxo) defaultsUsed.push('tipo_fluxo');
    if (!parsedData.valor_contrato) defaultsUsed.push('valor_contrato');
    if (!parsedData.valor_pagamento) defaultsUsed.push('valor_pagamento');
    
    if (defaultsUsed.length > 0) {
      console.log(`🔧 Applied default values for: ${defaultsUsed.join(', ')}`);
    }
    
    return result;
  }

  private mapToDatabase(parsedData: ContractParserResponse, file: ContractStorageFile): ContractDatabaseInsert {    
    return this.getSmartDefaults(parsedData, file);
  }

  private async saveToDatabase(parsedData: ContractParserResponse, file: ContractStorageFile): Promise<void> {
    console.log(`💾 Saving contract data to database for file: ${file.name}`);
    
    try {
      const contractData = this.mapToDatabase(parsedData, file);
      
      console.log('📝 Contract data to insert:', {
        area_responsavel: contractData.area_responsavel,
        contratado: contractData.contratado,
        contratante: contractData.contratante,
        data_vencimento: contractData.data_vencimento,
        datas_vencimento_parcelas: contractData.datas_vencimento_parcelas,
        forma_pagamento: contractData.forma_pagamento,
        localizacao_estado: contractData.localizacao_estado,
        localizacao_cidade: contractData.localizacao_cidade,
        multa: contractData.multa,
        tipo_fluxo: contractData.tipo_fluxo,
        valor_contrato: contractData.valor_contrato,
        valor_pagamento: contractData.valor_pagamento
      });

      const { error } = await supabase
        .from('reader')
        .insert([contractData]);

      if (error) {
        console.error('❌ Error inserting contract data:', error);
        
        // Se erro de coluna não encontrada, tenta com campos mínimos
        if (error.code === 'PGRST204' && error.message.includes('column')) {
          console.log('🔄 Trying to insert with minimal fields...');
          
          const minimalData = {
            area_responsavel: contractData.area_responsavel || 'Área não definida',
            contratado: contractData.contratado || `Fornecedor - ${file.name}`,
            contratante: contractData.contratante || 'Empresa Contratante',
            data_vencimento: contractData.data_vencimento || '2001-01-01',
            datas_vencimento_parcelas: contractData.datas_vencimento_parcelas || [],
            forma_pagamento: contractData.forma_pagamento || 1,
            localizacao_estado: contractData.localizacao_estado || 'SP',
            localizacao_cidade: contractData.localizacao_cidade || 'São Paulo',
            multa: contractData.multa || 0,
            tipo_fluxo: contractData.tipo_fluxo || 'Não classificado',
            valor_contrato: contractData.valor_contrato || 0,
            valor_pagamento: contractData.valor_pagamento || 0
          };
          
          const { error: minimalError } = await supabase
            .from('reader')
            .insert([minimalData]);
            
          if (minimalError) {
            console.error('❌ Error with minimal data:', minimalError);
            throw new Error(`Failed to save contract: ${minimalError.message}`);
          } else {
            console.log('✅ Successfully saved contract with minimal fields');
            return;
          }
        }
        
        // Verificar se é erro de RLS e fornecer orientação específica
        if (error.code === '42501' || error.message.includes('row-level security')) {
          console.error('🔒 RLS ERROR DETECTED!');
          console.error('💡 SOLUTION: Execute the following SQL in Supabase SQL Editor:');
          console.error(`
CREATE POLICY "Allow authenticated insert on reader" ON reader
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated select on reader" ON reader  
FOR SELECT USING (true);
          `);
          console.error('📋 SQL Editor: https://supabase.com/dashboard/project/jstytygxbnapydwkvpzk/sql');
        }
        
        throw new Error(`Failed to save contract: ${error.message}`);
      }

      console.log(`✅ Successfully saved contract for ${file.name} to database`);
    } catch (error) {
      console.error(`❌ Error saving contract data for ${file.name}:`, error);
      throw error;
    }
  }
}