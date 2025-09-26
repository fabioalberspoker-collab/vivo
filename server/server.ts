import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import asyncHandler from 'express-async-handler';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');

console.log('Loading environment variables from:', envPath);
dotenv.config({ path: envPath });

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:8080', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`📊 [DEBUG] ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`📊 [DEBUG] Headers:`, req.headers);
  console.log(`📊 [DEBUG] Query:`, req.query);
  if (req.method === 'POST') {
    console.log('📊 [DEBUG] Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    success: false,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}
const genAI = new GoogleGenerativeAI(apiKey);

// Function to load and process prompt template
function 
loadPromptTemplate(columnName: string, description: string, table: string = 'contracts', sample: unknown[] = []): string {
  try {
    const templatePath = path.join(__dirname, '../src/integrations/ai/seletorFiltro.md');
    console.log('📄 [TEMPLATE] Carregando template do arquivo:', templatePath);
    
    let template = readFileSync(templatePath, 'utf-8');
    
    // Replace template variables
    template = template.replace(/\$\{column\}/g, columnName);
    template = template.replace(/\$\{table\}/g, table);
    template = template.replace(/\$\{JSON\.stringify\(sample, null, 2\)\}/g, 
      sample.length > 0 ? JSON.stringify(sample, null, 2) : 'Nenhuma amostra de dados disponível.');
    
    // Add specific context for the current request
    template += `\n\nColuna: ${columnName}\nDescrição: ${description}\n\nComo não temos uma amostra de dados real, infira o melhor filtro baseado no nome da coluna e descrição fornecidos.`;
    
    console.log('✅ [TEMPLATE] Template processado com sucesso');
    return template;
  } catch (error) {
    console.error('❌ [TEMPLATE] Erro ao carregar template:', error);
    throw new Error(`Erro ao carregar template do prompt: ${error}`);
  }
}

// Debug endpoint
app.all('/api/debug', (req: Request, res: Response) => {
  console.log('🐛 [DEBUG] Endpoint de debug chamado');
  res.json({
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query
  });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Add a GET endpoint for debugging
app.get('/api/createCustomFilter', (req: Request, res: Response) => {
  console.log('⚠️ [DEBUG] Recebida requisição GET para /api/createCustomFilter - método incorreto!');
  res.status(405).json({ 
    error: 'Method Not Allowed', 
    message: 'Este endpoint aceita apenas requisições POST',
    correctMethod: 'POST',
    body: 'Envie dados JSON no body: { name, description, columnName }'
  });
});

interface CustomFilterRequest {
  name: string;
  description: string;
  columnName: string;
}

// Custom filter creation endpoint
app.post('/api/createCustomFilter', asyncHandler(async (req: Request<Record<string, unknown>, unknown, CustomFilterRequest>, res: Response) => {
  console.log('Received createCustomFilter request');
  const { name, description, columnName } = req.body;
  
  console.log('🔍 [DEBUG] Dados recebidos do frontend:');
  console.log('  - Nome do filtro:', name);
  console.log('  - Descrição:', description);
  console.log('  - Nome da coluna:', columnName);
  
  if (!name || !description || !columnName) {
    throw new Error('Missing required fields: name, description, or columnName');
  }

  try {
    console.log('Creating Gemini model...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
    console.log('Created Gemini model');
    
    // Load prompt template from file
    const prompt = loadPromptTemplate(columnName, description);

    console.log('🤖 [DEBUG] Prompt enviado para o Gemini:');
    console.log('==========================================');
    console.log(prompt);
    console.log('==========================================');
    
    console.log('📤 [DEBUG] Enviando prompt para Gemini AI...');
    const result = await model.generateContent(prompt);
    console.log('📥 [DEBUG] Resposta recebida do Gemini AI');
    
    const geminiResponse = result.response.text().trim();
    console.log('🎯 [DEBUG] Resposta bruta do Gemini:', geminiResponse);
    
    // Remove marcadores de código se existirem
    let cleanResponse = geminiResponse;
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    console.log('🧹 [DEBUG] Resposta limpa:', cleanResponse);
    
    // Parse da resposta JSON do Gemini
    let filterConfig;
    try {
      filterConfig = JSON.parse(cleanResponse);
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao fazer parse do JSON:', error);
      // Fallback para o formato antigo
      const filterType = cleanResponse.toLowerCase();
      filterConfig = {
        tipo_filtro: filterType,
        configuracoes: {}
      };
    }
    
    console.log('🎯 [DEBUG] Configuração do filtro processada:', filterConfig);
    
    // Mapear tipo de filtro para formato esperado pelo frontend
    const typeMapping: Record<string, string> = {
      select: 'select',
      seletor: 'select',
      dropdown: 'Dropdown',
      'dropdown multiselect': 'Multi-select',
      'multi-select': 'Multi-select',
      multiselect: 'Multi-select',
      daterange: 'dateRange',
      'data-range': 'dateRange',
      'intervalo-datas': 'dateRange',
      'intervalo': 'Intervalo',
      number: 'number',
      numero: 'number',
      range: 'Range',
      numberrange: 'numberRange',
      'number-range': 'numberRange',
      'intervalo-numerico': 'numberRange',
      text: 'text',
      texto: 'text',
      input: 'Input',
      boolean: 'boolean',
      checkbox: 'Checkbox',
    };

    const mappedType = typeMapping[filterConfig.tipo_filtro] || filterConfig.tipo_filtro;
    console.log('🔄 [DEBUG] Mapeamento de tipo:', filterConfig.tipo_filtro, '->', mappedType);
    
    const responseData = {
      success: true,
      filter: {
        name,
        description,
        columnName,
        type: mappedType
      },
      config: filterConfig.configuracoes || {},
      debug: {
        promptSent: prompt,
        geminiRawResponse: geminiResponse,
        aiConfig: filterConfig,
        processedType: mappedType
      }
    };
    
    console.log('📤 [DEBUG] Enviando resposta para o frontend:', responseData);
    
    // Return the created filter configuration
    res.json(responseData);
  } catch (error) {
    console.error('Error in createCustomFilter:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create custom filter: ${error.message}`);
    }
    throw new Error('An unknown error occurred while creating the custom filter');
  }
}));

// Global error handler (must be after all routes)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    success: false,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Environment variables loaded:', {
    GEMINI_API_KEY: apiKey ? 'Set' : 'Not set'
  });
});