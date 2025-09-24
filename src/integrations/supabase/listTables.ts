import { supabase } from "./client";

// Busca as tabelas do schema público via função RPC
export async function getSupabaseTableNames(): Promise<string[]> {
  const { data, error } = await supabase.rpc("list_tables");
  if (error || !data) return [];
  return data.map((row: { table_name: string }) => row.table_name);
}

// Busca os campos de uma tabela do schema público via função RPC
export async function getSupabaseTableFields(table: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("list_columns", { tablename: table });
  if (error || !data) return [];
  return data.map((row: { column_name: string }) => row.column_name);
}
