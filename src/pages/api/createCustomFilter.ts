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
  const samples = rows?.map((row: Record<string, unknown>) => row[coluna]).filter((v) => v !== null && v !== undefined);
  if (!samples || samples.length === 0) {
    return res.status(400).json({ error: 'Sem dados para análise' });
  }

  const filtroIA = await inferFilterTypeGemini(samples);

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
