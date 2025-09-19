O usuário deve criar um filtro informando apenas três campos obrigatórios:

nome_do_filtro
tabela
coluna
Esses dados devem ser salvos na tabela filtros_personalizados no Supabase.

Após o usuário selecionar a tabela e a coluna, a aplicação deve chamar esta IA.

O papel da IA é:

Analisar os dados da coluna selecionada.
Determinar automaticamente o melhor tipo de filtro, sem intervenção do usuário (exemplos: range, numérico, texto, data, booleano, categoria, multiselect).
Definir as configurações e parâmetros apropriados para o filtro.
Retornar um objeto JSON no seguinte formato:
json
Copy
{
  "tipo_filtro": "texto", 
  "configuracoes": {
    "exemplo_de_parametro": "valor"
  }
}
Esse JSON deve ser salvo na mesma linha da tabela filtros_personalizados, junto com as informações básicas fornecidas pelo usuário (nome_do_filtro, tabela e coluna).

O usuário não deve escolher o tipo de filtro em nenhum momento — essa decisão cabe totalmente à IA.