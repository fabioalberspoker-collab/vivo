Quero que você adicione uma nova funcionalidade ao botão "Exportar Relatório" do meu projeto. 
Requisitos:

1. Ao clicar no botão, deve ser feita uma chamada à API da IA Gemini.
2. A Gemini receberá como entrada todos os relatórios filtrados atualmente visíveis para o usuário.  
   - As URLs dos relatórios podem ser obtidas no Supabase do projeto.  
   - Busque essas URLs, recupere os documentos e passe-os para a Gemini.
3. A Gemini deve retornar um resumo consolidado desses documentos.
4. O resumo deve ser exibido automaticamente em uma **nova aba do navegador**, logo após o cliente clicar no botão "Exportar Relatório".
   - Nada de modal, nem interação extra.
   - A aba deve abrir já mostrando o texto do resumo em formato Markdown renderizado ou texto puro.
5. O fluxo inteiro deve ser automático após o clique.

Além disso, o prompt que a Gemini receberá deve ser exatamente este:
Prompt para a Gemini (incluso dentro do código gerado)
Você é uma IA especialista em análise de relatórios empresariais.  
Sua tarefa é ler os documentos fornecidos (em formato de texto extraído das URLs do Supabase) e produzir um resumo claro, objetivo e estruturado.  

Diretrizes:  
- Destaque os principais pontos de cada relatório.  
- Identifique tendências, problemas e oportunidades mencionadas.  
- Se houver métricas ou valores numéricos relevantes, inclua-os no resumo.  
- Organize a resposta em tópicos, priorizando clareza.  
- Evite repetir informações redundantes.  
- O resultado deve ser fácil de ler em uma página A4.  

Formato de saída:  
Resumo estruturado em Markdown, com títulos e subtítulos.

Instrução final: retorne o resumo de forma que seja possível renderizá-lo diretamente em uma nova aba do navegador.

Crie as aplicações de IA todas dentro de src/components/integrations/ai
Também quero que o prompt do Gemini fique em um arquivo .md separado. Assim como fizemos o prompt seletorFiltro.md