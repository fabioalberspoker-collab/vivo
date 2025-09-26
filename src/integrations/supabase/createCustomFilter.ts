import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Configure your Supabase credentials
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);


// Integração com Gemini
async function callAIToInferFilterType(samples: any[]): Promise<{ tipo_filtro: string; configuracoes: any }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY não configurada');

  // Monta o prompt para o Gemini
  const prompt = `Você é um assistente para criação de filtros em sistemas de BI. Analise os seguintes exemplos de dados de uma coluna e retorne um JSON no formato:\n{\n  "tipo_filtro": "texto|range|numérico|data|booleano|categoria|multiselect",\n  "configuracoes": { /* parâmetros relevantes */ }\n}\nApenas o JSON, sem explicações.\nAmostras: ${JSON.stringify(samples.slice(0, 20))}`;

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  const data = await response.json();
  // Espera que a resposta venha em data.candidates[0].content.parts[0].text
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Resposta inválida da IA');
  // Extrai JSON da resposta
  let filtro;
  try {
    filtro = JSON.parse(text);
  } catch {
    // Tenta extrair JSON de resposta com texto extra
    const match = text.match(/\{[\s\S]*\}/);
    if (match) filtro = JSON.parse(match[0]);
    else throw new Error('Não foi possível extrair JSON da resposta da IA');
  }
  return filtro;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nome_do_filtro, tabela, coluna } = req.body;
  if (!nome_do_filtro || !tabela || !coluna) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  // Buscar amostras da coluna
  const { data: rows, error } = await supabase.from(tabela).select(coluna).limit(100);
  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar dados da tabela' });
  }
  const samples = rows?.map((row: any) => row[coluna]).filter((v: any) => v !== null && v !== undefined);
  if (!samples || samples.length === 0) {
    return res.status(400).json({ error: 'Sem dados para análise' });
  }

  // Chamar IA para inferir tipo/configuração
  const filtroIA = await callAIToInferFilterType(samples);

  // Salvar no Supabase
  const { error: insertError } = await supabase.from('filtros_personalizados').insert([
    {
      nome_do_filtro,
      tabela,
      coluna,
      filtro_json: filtroIA,
    },
  ]);
  if (insertError) {
    return res.status(500).json({ error: 'Erro ao salvar filtro' });
  }

  return res.status(200).json({ success: true, filtro: filtroIA });
}
