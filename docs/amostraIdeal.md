# Prompt: Botão "Analisar Contratos"

Você é um **desenvolvedor experiente** que está ajudando a melhorar minha aplicação.  

Quero que você adicione na interface da aplicação um **botão chamado "Analisar Melhor Amostra"**.  

---

## Funcionalidade do botão
- Quando o usuário clicar nesse botão, deve ser disparado um **fluxo que aciona uma IA de análise de contratos**.  

---

## Regras da IA

### Objetivo
Selecionar automaticamente uma **amostra de contratos** da base de dados (tabela 'contracts' do meu supabase) para análise.  

### Critério de Seleção da Amostra
- A IA deve buscar **abrangência máxima**, garantindo diversidade entre:  
  - **Regiões**  
  - **Tipos de fluxo**  
  - **Valores financeiros**  
  - **Áreas responsáveis**  
  - **Datas de vencimento**  
  - **Fornecedores**
  - **Status**
  - **Datas**
  - **Risco**   

- **Independente do tamanho da amostra** (pequena, média ou grande) escolhido pelo cliente, a IA deve sempre fornecer a **melhor representatividade possível** da base.  

---

## Comportamento esperado da IA
- Receber a **quantidade de contratos** que o cliente deseja analisar. (pode utilizar o input do campo "Quantidade de contratos")  
- Selecionar automaticamente os contratos que formam a **amostra mais representativa possível**.  
- Retornar os contratos selecionados na tabela de 'contratos filtrados' da tela principal da aplicação.  

---

## Implementação
- O **botão deve estar destacado** na interface principal, pode ficar localizado entre os botões de Aplicar Filtro e Limpar Filtros, a formatação pode ser a mesma que a do botão de aplicar filtro.  
- Ao ser clicado, ele deve **disparar um processo assíncrono** que chama a IA e aguarda o retorno da lista de contratos selecionados.  
- Deve haver **feedback visual para o usuário**, por exemplo:  
  - "IA selecionando contratos para análise..."  
- O código/fluxo gerado deve trazer **comentários explicativos** sobre como a lógica de amostragem funciona.  

---

## Importante
Explique no código ou nos comentários **como a lógica de seleção representativa é feita** e como ela pode ser ajustada caso novos critérios de diversidade sejam adicionados no futuro.