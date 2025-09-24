# Prompt: Organização de Estrutura de Arquivos

Você é um **desenvolvedor especializado em arquitetura de software**.  
Preciso que você **organize meu projeto** da melhor forma possível, seguindo princípios de clareza, modularidade e boas práticas de organização de pastas.  

---

## Regras principais

1. **Não alterar nenhuma funcionalidade da aplicação.**  
   - O comportamento atual deve permanecer **100% inalterado**.  
   - Nenhuma lógica deve ser reescrita ou modificada.  

2. **Apenas organização estrutural.**  
   - Reestruture a organização dos **arquivos e pastas** para torná-la mais limpa e intuitiva.  
   - Se necessário, renomeie arquivos ou pastas para nomes mais claros e consistentes.  
   - Caso haja mudanças de nomes ou caminhos, ajuste todos os `imports`, `requires` e referências para refletir a nova estrutura.  

3. **Boas práticas desejadas:**
   - Separação por camadas (exemplo: `controllers/`, `services/`, `models/`, `routes/`, `utils/`, `tests/`).  
   - Código reutilizável deve ir para pastas auxiliares (`helpers/`, `utils/`).  
   - Componentes front-end devem ser organizados por **domínio** e/ou **componente** (ex: `components/Button/`, `pages/Dashboard/`).  
   - Testes devem acompanhar os módulos correspondentes ou ficar centralizados em `tests/`.  

4. **Consistência.**  
   - Manter nomenclaturas consistentes (camelCase, kebab-case, ou PascalCase, conforme contexto).  
   - Garantir padronização de extensões `.js`, `.jsx`, `.ts`, `.tsx`, etc.  

---

## Implementação esperada

- Exibir a **nova estrutura de arquivos proposta**.  
- Executar automaticamente as alterações necessárias para refletir essa nova estrutura.  
- Garantir que a aplicação rode exatamente como antes, sem nenhum impacto para o usuário final.  
- Explicar brevemente **as principais decisões de organização** tomadas.  

---

## Importante
- Reforce o princípio: **"Refatorar apenas a estrutura, nunca a lógica."**  
- Se alguma decisão estrutural for subjetiva, opte pela convenção mais comum no ecossistema da linguagem/ferramenta usada no projeto.