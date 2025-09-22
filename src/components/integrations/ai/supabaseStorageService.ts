// Serviço para integração com Supabase Storage
// Responsável por acessar buckets de PDFs e gerar URLs assinadas

import { supabase } from '@/integrations/supabase/client';

export interface StorageFile {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, unknown>;
}

export interface SignedUrlResponse {
  data: {
    signedUrl: string;
  } | null;
  error: Error | null;
}

export class SupabaseStorageService {
  private static readonly DEFAULT_BUCKET = 'contratos'; // Nome do bucket padrão
  private static readonly URL_EXPIRY_SECONDS = 3600; // 1 hora

  /**
   * Lista arquivos em um bucket específico
   */
  static async listFiles(bucketName: string = this.DEFAULT_BUCKET, folder?: string): Promise<StorageFile[]> {
    try {
      console.log(`📁 Listando arquivos do bucket: ${bucketName}${folder ? `/${folder}` : ''}`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folder || '', {
          limit: 100,
          offset: 0,
        });

      if (error) {
        console.error('❌ Erro ao listar arquivos:', error);
        throw new Error(`Erro ao listar arquivos: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro na listagem de arquivos:', error);
      throw error;
    }
  }

  /**
   * Gera URL assinada para um arquivo específico
   */
  static async createSignedUrl(
    filePath: string, 
    bucketName: string = this.DEFAULT_BUCKET,
    expiresIn: number = this.URL_EXPIRY_SECONDS
  ): Promise<string> {
    try {
      console.log(`🔗 Gerando URL assinada para: ${bucketName}/${filePath}`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('❌ Erro ao gerar URL assinada:', error);
        throw new Error(`Erro ao gerar URL assinada: ${error.message}`);
      }

      if (!data?.signedUrl) {
        throw new Error('URL assinada não foi gerada');
      }

      console.log('✅ URL assinada gerada com sucesso');
      return data.signedUrl;
    } catch (error) {
      console.error('❌ Erro ao gerar URL assinada:', error);
      throw error;
    }
  }

  /**
   * Baixa um arquivo diretamente como ArrayBuffer
   */
  static async downloadFile(
    filePath: string, 
    bucketName: string = this.DEFAULT_BUCKET
  ): Promise<ArrayBuffer> {
    try {
      console.log(`⬇️ Tentando baixar arquivo: ${filePath}`);
      
      // Se filePath é uma URL completa, tentar extrair apenas o nome do arquivo
      let actualPath = filePath;
      let actualBucket = bucketName;
      
      if (filePath.includes('storage/v1/object/public/')) {
        console.log('🔗 Detectada URL pública, tentando download direto...');
        return await this.downloadFromPublicUrl(filePath);
      }
      
      if (filePath.includes('/')) {
        // Se contém barra, pode ser um caminho completo incluindo bucket
        const parts = filePath.split('/');
        if (parts.length > 1) {
          // Verificar se primeiro part é um bucket conhecido
          if (parts[0] === 'contratos' || parts[0] === 'contract-documents') {
            actualBucket = parts[0];
            actualPath = parts.slice(1).join('/');
            console.log(`📂 Bucket extraído: ${actualBucket}, Caminho: ${actualPath}`);
          }
        }
      }
      
      console.log(`⬇️ Baixando de bucket: ${actualBucket}/${actualPath}`);
      
      const { data, error } = await supabase.storage
        .from(actualBucket)
        .download(actualPath);

      if (error) {
        console.error('❌ Erro ao baixar do storage:', error);
        
        // Fallback: tentar com bucket 'contratos' se não funcionou
        if (actualBucket !== 'contratos') {
          console.log('🔄 Tentando com bucket "contratos"...');
          const { data: data2, error: error2 } = await supabase.storage
            .from('contratos')
            .download(actualPath);
            
          if (!error2 && data2) {
            const arrayBuffer = await data2.arrayBuffer();
            console.log(`✅ Arquivo baixado do bucket "contratos": ${arrayBuffer.byteLength} bytes`);
            return arrayBuffer;
          }
        }
        
        throw new Error(`Erro ao baixar arquivo: ${error.message || 'Arquivo não encontrado'}`);
      }

      if (!data) {
        throw new Error('Arquivo não encontrado');
      }

      // Converter Blob para ArrayBuffer
      const arrayBuffer = await data.arrayBuffer();
      console.log(`✅ Arquivo baixado: ${arrayBuffer.byteLength} bytes`);
      
      return arrayBuffer;
    } catch (error) {
      console.error('❌ Erro no download do arquivo:', error);
      throw error;
    }
  }

  /**
   * Download de arquivo via URL pública (fallback)
   */
  private static async downloadFromPublicUrl(url: string): Promise<ArrayBuffer> {
    try {
      console.log(`🌐 Baixando via URL pública: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf,*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log(`✅ Download via URL concluído: ${arrayBuffer.byteLength} bytes`);
      
      return arrayBuffer;
    } catch (error) {
      console.error('❌ Erro no download via URL:', error);
      throw error;
    }
  }

  /**
   * Verifica se um arquivo existe no storage
   */
  static async fileExists(
    filePath: string, 
    bucketName: string = this.DEFAULT_BUCKET
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list('', {
          search: filePath
        });

      if (error) {
        console.error('❌ Erro ao verificar arquivo:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('❌ Erro na verificação de arquivo:', error);
      return false;
    }
  }

  /**
   * Extrai informações do arquivo baseado no documento_url dos contratos
   */
  static extractFilePathFromUrl(documentUrl: string): {
    bucketName: string;
    filePath: string;
  } | null {
    try {
      // Assumindo URLs no formato: https://projeto.supabase.co/storage/v1/object/public/bucket/path/file.pdf
      // ou URLs assinadas: https://projeto.supabase.co/storage/v1/object/sign/bucket/path/file.pdf?token=...
      
      const url = new URL(documentUrl);
      const pathParts = url.pathname.split('/');
      
      // Procurar pelos padrões do Supabase Storage
      const objectIndex = pathParts.findIndex(part => part === 'object');
      
      if (objectIndex !== -1 && pathParts.length > objectIndex + 2) {
        const bucketName = pathParts[objectIndex + 2]; // Depois de /object/public/ ou /object/sign/
        const filePath = pathParts.slice(objectIndex + 3).join('/');
        
        return {
          bucketName,
          filePath
        };
      }
      
      // Fallback: assumir bucket padrão e usar path completo
      return {
        bucketName: this.DEFAULT_BUCKET,
        filePath: pathParts.slice(-1)[0] // Último segmento como nome do arquivo
      };
      
    } catch (error) {
      console.error('❌ Erro ao extrair path do arquivo:', error);
      return null;
    }
  }

  /**
   * Obtém URL pública ou gera URL assinada baseado no documento_url
   */
  static async getAccessibleUrl(documentUrl: string): Promise<string> {
    try {
      // Se já é uma URL válida e acessível, usar diretamente
      if (documentUrl.startsWith('http')) {
        return documentUrl;
      }
      
      // Extrair informações do arquivo
      const fileInfo = this.extractFilePathFromUrl(documentUrl);
      
      if (!fileInfo) {
        throw new Error('Não foi possível extrair informações do arquivo da URL');
      }
      
      // Verificar se arquivo existe
      const exists = await this.fileExists(fileInfo.filePath, fileInfo.bucketName);
      
      if (!exists) {
        throw new Error(`Arquivo não encontrado: ${fileInfo.bucketName}/${fileInfo.filePath}`);
      }
      
      // Gerar URL assinada
      return await this.createSignedUrl(fileInfo.filePath, fileInfo.bucketName);
      
    } catch (error) {
      console.error('❌ Erro ao obter URL acessível:', error);
      throw error;
    }
  }
}