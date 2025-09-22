# Filtro de Data de Vencimento - Documentação

## Visão Geral
O filtro de Data de Vencimento permite filtrar contratos baseado em suas datas de vencimento, oferecendo opções predefinidas e personalizada.

## Funcionalidades

### Opções Predefinidas

1. **Vencidos (overdue)**
   - Filtra contratos com `data_vencimento < data_atual`
   - Identifica contratos que já passaram do prazo de vencimento

2. **Próximos 7 dias (next7days)**
   - Filtra contratos com `data_atual <= data_vencimento <= data_atual + 7 dias`
   - Útil para identificar contratos que vencem na próxima semana

3. **Próximos 30 dias (next30days)**
   - Filtra contratos com `data_atual <= data_vencimento <= data_atual + 30 dias`
   - Identifica contratos que vencem no próximo mês

4. **30-60 dias (30-60)**
   - Filtra contratos com `data_atual + 30 dias <= data_vencimento <= data_atual + 60 dias`
   - Contratos que vencem entre 30 e 60 dias

5. **60-90 dias (60-90)**
   - Filtra contratos com `data_atual + 60 dias <= data_vencimento <= data_atual + 90 dias`
   - Contratos que vencem entre 60 e 90 dias

6. **Personalizado (custom)**
   - Permite selecionar um intervalo específico de datas
   - Campos: Data Início e Data Fim
   - Filtra contratos com `data_inicio <= data_vencimento <= data_fim`

## Implementação Técnica

### Arquivos Principais

1. **src/components/filters/DueDateFilter.tsx**
   - Componente React para interface do filtro
   - Gerencia estado local dos valores selecionados
   - Campos para datas personalizadas

2. **src/hooks/useContractFilters.ts**
   - Hook que contém a lógica de filtragem
   - Constrói queries Supabase baseadas nos filtros
   - Função `applyFilters` processa os parâmetros de data

### Estrutura de Dados

#### Tabela: `contratos`
- Campo: `data_vencimento` (tipo: `date`)
- Índice: `idx_contratos_data_vencimento` para performance

#### Estados do Componente
```typescript
const [dueDate, setDueDate] = useState<string>("");       // Opção selecionada
const [customStart, setCustomStart] = useState<string>(""); // Data início personalizada
const [customEnd, setCustomEnd] = useState<string>("");     // Data fim personalizada
```

### Lógica de Filtragem

O filtro utiliza a seguinte lógica no hook `useContractFilters.ts`:

```typescript
if (filterParams.dueDate) {
  const today = new Date().toISOString().split('T')[0];
  
  switch (filterParams.dueDate) {
    case 'overdue':
      query = query.lt('data_vencimento', today);
      break;
    case 'next7days':
      const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte('data_vencimento', today).lte('data_vencimento', next7Days);
      break;
    // ... outros casos
  }
}
```

## Integração

### PaymentVerificationApp.tsx
O filtro está integrado no componente principal através de:

1. **Estados gerenciados**:
   ```typescript
   const [dueDate, setDueDate] = useState<string>("");
   const [customStart, setCustomStart] = useState<string>("");
   const [customEnd, setCustomEnd] = useState<string>("");
   ```

2. **Passagem de parâmetros**:
   ```typescript
   const filterParams = {
     // ... outros filtros
     dueDate,
     customStart,
     customEnd,
     // ...
   };
   await applyFilters(filterParams);
   ```

3. **Renderização do componente**:
   ```tsx
   <FilterContainer title="Data de Vencimento">
     <DueDateFilter
       value={dueDate}
       customStart={customStart}
       customEnd={customEnd}
       onChange={setDueDate}
       onCustomStartChange={setCustomStart}
       onCustomEndChange={setCustomEnd}
     />
   </FilterContainer>
   ```

## Casos de Uso

1. **Gestão de Contratos Vencidos**
   - Identificar rapidamente contratos que precisam de ação imediata
   - Acompanhar contratos em atraso

2. **Planejamento de Renovações**
   - Visualizar contratos que vencem em diferentes períodos
   - Organizar processo de renovação por prazo

3. **Relatórios Personalizados**
   - Criar relatórios para períodos específicos
   - Análise de vencimentos por trimestre/semestre

## Manutenção

### Validações
- As datas são validadas no formato ISO (YYYY-MM-DD)
- Campos de data personalizada são opcionais quando não é "custom"
- Query de banco é construída dinamicamente baseada na opção

### Performance
- Índice em `data_vencimento` garante consultas rápidas
- Filtros utilizam operadores Supabase otimizados (gte, lte, lt)

### Extensibilidade
Para adicionar novas opções predefinidas:
1. Adicionar nova opção no array `predefinedOptions` em DueDateFilter.tsx
2. Implementar novo case no switch statement em useContractFilters.ts
3. Testar a nova funcionalidade

## Status
✅ **Produção Ready** - Filtro implementado e testado, pronto para uso em produção.