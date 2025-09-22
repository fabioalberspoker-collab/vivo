import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { inferFilterTypeGemini } from '@/integrations/ai/inferFilterTypeGemini';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nome_do_filtro, tabela, coluna } = req.body;
  if (!nome_do_filtro || !tabela || !coluna) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  const { data: rows, error } = await supabase.from(tabela).select(coluna).limit(100);
  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar dados da tabela' });
  }
  if (!rows || rows.length === 0) {
    return res.status(400).json({ error: 'Sem dados para análise' });
  }
  
  // Extract column values safely
  const samples: unknown[] = [];
  for (const row of rows) {
    const value = (row as unknown as Record<string, unknown>)[coluna];
    if (value !== null && value !== undefined) {
      samples.push(value);
    }
  }

  const filtroIA = await inferFilterTypeGemini(samples, tabela, coluna);

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

  // Format response for frontend
  const formattedResponse = {
    success: true,
    filter: {
      name: nome_do_filtro,
      type: filtroIA.tipo_filtro,
      columnName: coluna
    },
    config: filtroIA.configuracoes,
    debug: {
      aiConfig: filtroIA,
      geminiRawResponse: JSON.stringify(filtroIA),
      processedType: filtroIA.tipo_filtro
    }
  };

  console.log('✅ [API] Resposta formatada:', formattedResponse);

  return res.status(200).json(formattedResponse);
}
