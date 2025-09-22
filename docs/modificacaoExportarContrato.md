A API de Exportar Relatório não estava funcionando corretamente porque o Gemini não consegue ler o PDF diretamente, então gostaria que a API passasse a seguir esse passo a passo

Siga as instruções abaixo passo a passo:

1. **Recuperação do arquivo PDF**  
   - Conecte-se ao Supabase.  
   - Busque os contratos em PDF a partir do bucket de storage.  
   - Gere uma URL assinada (createSignedUrl) ou faça o download do arquivo diretamente.

2. **Extração de texto**  
   - O Gemini não lê PDFs binários.  
   - Extraia o texto do arquivo PDF antes de enviar para a API.  
   - Use uma biblioteca apropriada dependendo da linguagem:  
     - Node.js → `pdf-parse`  
     - Python → `PyPDF2` ou `pdfplumber`.

3. **Pré-processamento do texto**  
   - Limpe cabeçalhos/rodapés repetidos.  
   - Se o contrato for muito extenso, divida-o em blocos menores (chunks de ~1000 a 2000 tokens).  

4. **Envio para Gemini**  
   - Monte um prompt para o Gemini no seguinte formato:

   Prompt a ser enviado ao Gemini:
   """
   Você é uma IA especialista em análise de contratos.  
   Sua tarefa é ler os documentos em texto e produzir um resumo claro e objetivo.  

   Diretrizes:  
   - Liste as obrigações principais de cada parte.  
   - Destaque prazos e condições relevantes.  
   - Identifique multas ou penalidades.  
   - Destaque cláusulas de risco ou pontos de atenção.  
   - Organize o resumo em tópicos, priorizando clareza.  

   Texto do contrato:
   {{CONTEUDO_EXTRAIDO_DOS_PDFS}}
   """

   - Se houver mais de um chunk, envie chamadas separadas e depois faça um prompt final de "consolidação de resumos".

5. **Exibição do resultado**  
   - Assim que o Gemini devolver a resposta, abra automaticamente uma nova aba no navegador.  
   - Renderize o resumo em texto simples ou Markdown (o mais direto possível).  
   - O cliente não deve precisar baixar o arquivo — tudo deve acontecer após um clique no botão "Exportar Relatório".

6. **Extra**  
   - Certifique-se de que os contratos só podem ser acessados via URL assinada (para garantir segurança).  
   - Garanta tratamento de erros (PDF inválido, contrato muito grande, falha no Gemini, etc.).

Implemente esse fluxo de ponta a ponta, integrando Supabase → Extração de PDF → Gemini → Nova aba com o resumo.