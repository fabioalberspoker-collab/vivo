import fs from 'fs';
import path from 'path';
// src/integrations/ai/inferFilterTypeGemini.ts

/**
 * Função para chamar a API do Gemini e inferir o tipo/configuração do filtro.
 * @param samples Amostras de dados da coluna
 */

export async function inferFilterTypeGemini(contractsText: string, options?: { length?: number }): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

  // Lê o prompt do arquivo seletorFiltro.md
  const promptPath = path.resolve(__dirname, 'seletorFiltro.md');
  let promptTemplate = fs.readFileSync(promptPath, 'utf-8');
  // Substitui variáveis do template
  promptTemplate = promptTemplate.replace('${options.length || 500}', String(options?.length || 500));
  promptTemplate = promptTemplate.replace('${text}', contractsText);
  const prompt = promptTemplate;

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Resposta inválida da IA');
  let relatorio;
  try {
    relatorio = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) relatorio = JSON.parse(match[0]);
    else throw new Error('Não foi possível extrair JSON da resposta da IA');
  }
  return relatorio;
}
