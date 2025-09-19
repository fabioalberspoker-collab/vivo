import { supabase } from "./client";

// Busca as tabelas do schema público via API do Postgres
export async function fetchSupabaseTableNames(): Promise<string[]> {
  const { data, error } = await supabase.rpc("pg_get_tables", { schema: "public" });
  if (error) {
    // fallback: consulta via information_schema
    const { data: infoData, error: infoError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");
    if (infoError || !infoData) return [];
    return infoData.map((row: any) => row.table_name);
  }
  return data || [];
}

// Busca os campos de uma tabela do schema público
export async function fetchSupabaseTableFields(table: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_schema", "public")
    .eq("table_name", table);
  if (error || !data) return [];
  return data.map((row: any) => row.column_name);
}
