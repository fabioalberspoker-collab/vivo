import { supabase } from '@/integrations/supabase/client';
import { ContractParserResponse, ContractStorageFile } from './types';
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
        model: "gemini-pro",
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
      
      // Try to get bucket info directly first
      try {
        const { data: bucketInfo, error: bucketError } = await supabase.storage
          .getBucket('documentos');
          
        if (bucketError) {
          console.log('⚠️ Bucket not found, attempting to create it...');
          
          // Try to create the bucket
          const { data: newBucket, error: createError } = await supabase.storage.createBucket('documentos', {
            public: true,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
          });
          
          if (createError) {
            console.error('❌ Failed to create bucket:', createError.message);
            if (createError.message.includes('Permission denied')) {
              console.error('⚠️ You need admin/service_role access to create buckets');
            }
          } else {
            console.log('✅ Bucket created successfully:', newBucket);
          }
        } else {
          console.log('📦 Bucket info:', bucketInfo);
        }
      } catch (e) {
        console.warn('⚠️ Could not get or create bucket:', e);
      }
      
      // Now try to list all buckets
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.error('❌ Error listing buckets:', bucketError.message);
        console.error('Details:', {
          error: bucketError,
          message: bucketError.message
        });
        throw bucketError;
      }
      
      console.log('📦 Available buckets:', buckets?.map(b => ({ 
        name: b.name, 
        id: b.id,
        public: b.public
      })));
      
      if (!buckets?.some(b => b.name === 'documentos')) {
        console.error('❌ The "documentos" bucket does not exist in this project!');
        return [];
      }
    } catch (e) {
      console.error('❌ Error checking buckets:', e);
      throw e;
    }
    
    // Tentar listar arquivos na raiz do bucket com mais informações de diagnóstico
    console.log('📂 Attempting to list files from "documentos" bucket...');
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('documentos')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (rootError) {
      console.error('❌ Error listing documents:', rootError);
      throw rootError;
    }

    // Log do resultado da listagem
    console.log('🔍 Supabase list response:', {
      rootFiles,
      bucketName: 'documentos',
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
          bucket: 'documentos',
          path: file.name,
          url: supabase.storage.from('documentos').getPublicUrl(file.name).data.publicUrl,
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
      console.warn('2. If you have the correct bucket name (should be "documentos")');
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

IMPORTANTE: Retorne APENAS o objeto JSON, sem nenhum texto adicional.

{
  "contratado": string (nome do fornecedor/contratada),
  "contratante": string (nome da empresa contratante),
  "tipo_fluxo": string (um dos valores: "RE", "real state", "FI", "proposta", "Engenharia", "RC"),
  "valor_contrato": number (valor total do contrato, apenas números),
  "valor_pagamento": number (valor de cada pagamento/parcela, apenas números),
  "forma_pagamento": number (número de parcelas, apenas números),
  "localizacao": {
    "estado": string (estado de execução),
    "cidade": string (cidade de execução)
  },
  "data_vencimento": string (data final em ISO, ex: "2025-12-31"),
  "area_responsavel": string (área responsável pelo contrato),
  "datas_vencimento_parcelas": string[] (array de datas ISO),
  "multa": number (valor da multa, apenas números)
}

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
}