import fs from 'fs';
import path from 'path';

/**
 * Função para chamar a API do Gemini e inferir o tipo/configuração do filtro.
 * @param samples Amostras de dados da coluna
 * @param table Nome da tabela
 * @param column Nome da coluna
 */
export async function inferFilterTypeGemini(samples: unknown[], table?: string, column?: string): Promise<{ tipo_filtro: string; configuracoes: Record<string, unknown> }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY não configurada');

  // Lê o prompt do arquivo seletorFiltro.md
  const promptPath = path.join(process.cwd(), 'src', 'integrations', 'ai', 'seletorFiltro.md');
  let promptTemplate: string;
  
  try {
    promptTemplate = fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('❌ Erro ao ler arquivo seletorFiltro.md:', error);
    throw new Error('Arquivo de prompt não encontrado');
  }

  // Substitui variáveis do template
  promptTemplate = promptTemplate.replace('${table}', table || 'contratos');
  promptTemplate = promptTemplate.replace('${column}', column || '');
  promptTemplate = promptTemplate.replace('${JSON.stringify(sample, null, 2)}', JSON.stringify(samples.slice(0, 20), null, 2));

  console.log('🤖 [GEMINI] Prompt final enviado:');
  console.log('==========================================');
  console.log(promptTemplate);
  console.log('==========================================');

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptTemplate }] }]
    })
  });

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  console.log('🤖 [GEMINI] Resposta bruta:', text);
  
  if (!text) throw new Error('Resposta inválida da IA');
  
  let geminiResponse;
  try {
    // Tenta fazer parse direto do JSON
    geminiResponse = JSON.parse(text);
  } catch {
    // Tenta extrair JSON de resposta com texto extra
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      geminiResponse = JSON.parse(match[0]);
    } else {
      throw new Error('Não foi possível extrair JSON da resposta da IA');
    }
  }

  console.log('🤖 [GEMINI] Resposta processada:', geminiResponse);
  
  return geminiResponse;
}
