export interface Contract {
  id: string;
  number: string;
  supplier: string;
  type: string;
  value: number;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
  dueDate: string;
  flowType: string;
  region: string;
  state: string;
}

export const mockContracts: Contract[] = [
  {
    id: '1',
    number: 'CT-2024-001',
    supplier: 'Tech Solutions Ltda',
    type: 'Infraestrutura',
    value: 150000,
    status: 'paid',
    dueDate: '2024-03-15',
    flowType: 'RE',
    region: 'Sudeste',
    state: 'SP'
  },
  {
    id: '2',
    number: 'CT-2024-002',
    supplier: 'Telecom Services SA',
    type: 'Serviços',
    value: 85000,
    status: 'pending',
    dueDate: '2024-04-20',
    flowType: 'FI',
    region: 'Sul',
    state: 'RS'
  },
  {
    id: '3',
    number: 'CT-2024-003',
    supplier: 'Digital Networks Corp',
    type: 'Equipamentos',
    value: 320000,
    status: 'overdue',
    dueDate: '2024-02-28',
    flowType: 'Engenharia',
    region: 'Sudeste',
    state: 'RJ'
  },
  {
    id: '4',
    number: 'CT-2024-004',
    supplier: 'Fiber Optics Inc',
    type: 'Infraestrutura',
    value: 750000,
    status: 'processing',
    dueDate: '2024-05-10',
    flowType: 'Real State',
    region: 'Nordeste',
    state: 'BA'
  },
  {
    id: '5',
    number: 'CT-2024-005',
    supplier: 'Cloud Services Ltd',
    type: 'Software',
    value: 45000,
    status: 'paid',
    dueDate: '2024-03-25',
    flowType: 'FI',
    region: 'Centro-Oeste',
    state: 'GO'
  },
  {
    id: '6',
    number: 'CT-2024-006',
    supplier: 'Security Systems Pro',
    type: 'Segurança',
    value: 125000,
    status: 'pending',
    dueDate: '2024-04-15',
    flowType: 'RC',
    region: 'Norte',
    state: 'AM'
  },
  {
    id: '7',
    number: 'CT-2024-007',
    supplier: 'Mobile Network Co',
    type: 'Telecomunicações',
    value: 280000,
    status: 'processing',
    dueDate: '2024-06-01',
    flowType: 'Proposta',
    region: 'Sudeste',
    state: 'MG'
  },
  {
    id: '8',
    number: 'CT-2024-008',
    supplier: 'Data Center Solutions',
    type: 'Infraestrutura',
    value: 450000,
    status: 'paid',
    dueDate: '2024-03-30',
    flowType: 'RE',
    region: 'Sul',
    state: 'SC'
  },
  {
    id: '9',
    number: 'CT-2024-009',
    supplier: 'Network Maintenance SA',
    type: 'Manutenção',
    value: 90000,
    status: 'overdue',
    dueDate: '2024-02-15',
    flowType: 'FI',
    region: 'Nordeste',
    state: 'PE'
  },
  {
    id: '10',
    number: 'CT-2024-010',
    supplier: 'Installation Services Inc',
    type: 'Instalação',
    value: 180000,
    status: 'pending',
    dueDate: '2024-04-25',
    flowType: 'Engenharia',
    region: 'Sul',
    state: 'PR'
  }
];
