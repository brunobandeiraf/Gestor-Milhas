# Plano de Implementação: Gestor Milhas

## Visão Geral

Implementação incremental do sistema Gestor Milhas, começando pela infraestrutura e modelos de dados, seguindo para autenticação, lógica de negócio core (preço médio, movimentações), e finalizando com frontend e dashboards. Cada etapa é validada antes de avançar.

## Tarefas

- [x] 1. Configuração do projeto e infraestrutura
  - [x] 1.1 Criar estrutura de pastas do monorepo e configurar Docker Compose
    - Criar `docker-compose.yml` com serviços `backend` e `db` (PostgreSQL)
    - Criar `backend/` com `package.json`, `tsconfig.json` (strict mode), e entry point Express
    - Criar `frontend/` com Vite + React + TypeScript + TailwindCSS
    - Configurar Vitest no backend e frontend
    - _Requisitos: Convenções do projeto_

  - [x] 1.2 Configurar Prisma e criar schema do banco de dados
    - Inicializar Prisma no backend (`npx prisma init`)
    - Criar o schema Prisma completo com todos os models, enums e relações conforme o design
    - Gerar migration inicial
    - Configurar seed básico (Admin padrão)
    - _Requisitos: 5.1, 7.1, 8.1, 9.1, 10.1, 11.1, 12.1_

  - [x] 1.3 Criar classes de erro customizadas e middleware de tratamento de erros
    - Implementar `ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ConflictError`, `BusinessRuleError`, `InternalError`
    - Implementar middleware Express centralizado de tratamento de erros com formato `ErrorResponse`
    - _Requisitos: 11.6, 11.7, 4.5, 16.4_

  - [x] 1.4 Criar schemas Zod compartilhados de validação
    - Implementar schemas: `loginSchema`, `completeRegistrationSchema`, `programSchema`, `cardSchema`, `clubSchema`, `transactionSchema`, `bonusPurchaseSchema`, `transferSchema`, `issuanceSchema`, `contactFormSchema`
    - Implementar funções de validação de CPF e email
    - Criar middleware de validação Zod para Express
    - _Requisitos: 3.5, 3.6, 2.5, 2.6_

  - [ ]* 1.5 Escrever testes de propriedade para validação de CPF
    - **Propriedade 6: Validação de CPF**
    - **Valida: Requisito 3.5**

  - [ ]* 1.6 Escrever testes de propriedade para validação de email
    - **Propriedade 7: Validação de email**
    - **Valida: Requisito 3.6**

- [x] 2. Checkpoint — Infraestrutura base
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Autenticação e controle de acesso
  - [x] 3.1 Implementar AuthService (login e refresh token)
    - Implementar `login(email, password)` com bcrypt e geração de JWT (access + refresh)
    - Implementar `refresh(refreshToken)` para renovação de token
    - _Requisitos: 1.1_

  - [x] 3.2 Implementar middleware de autenticação e autorização
    - Middleware `authenticate` que valida JWT e injeta `userId` e `role` no request
    - Middleware `authorize(roles)` para verificação de role
    - Middleware `requireCompleteRegistration` que bloqueia usuários PENDING
    - Middleware `ownerOrAdmin` que garante isolamento de dados entre usuários
    - _Requisitos: 1.4, 1.5, 1.6, 1.7_

  - [x] 3.3 Implementar rotas e controller de autenticação
    - `POST /api/auth/login` e `POST /api/auth/refresh`
    - _Requisitos: 1.1_

  - [ ]* 3.4 Escrever testes de propriedade para autenticação
    - **Propriedade 4: Autenticação por credenciais**
    - **Valida: Requisito 1.1**

  - [ ]* 3.5 Escrever testes de propriedade para rejeição de auto-cadastro
    - **Propriedade 3: Rejeição de auto-cadastro**
    - **Valida: Requisito 1.2**

  - [ ]* 3.6 Escrever testes de propriedade para isolamento de dados
    - **Propriedade 2: Isolamento de dados entre usuários**
    - **Valida: Requisitos 1.6, 1.7**

  - [ ]* 3.7 Escrever testes de propriedade para status PENDING
    - **Propriedade 1: Usuários criados por Admin iniciam com status PENDING**
    - **Valida: Requisitos 1.3, 1.4, 1.5**

- [x] 4. Gestão de usuários
  - [x] 4.1 Implementar UserService
    - `create(data)` — Admin cria usuário com status PENDING
    - `completeRegistration(userId, data)` — Usuário completa cadastro (dados pessoais + endereço)
    - `findById(id)` e `findAll(adminId)`
    - _Requisitos: 1.2, 1.3, 3.1, 3.2_

  - [x] 4.2 Implementar rotas e controller de usuários
    - `POST /api/users` (Admin), `GET /api/users` (Admin), `GET /api/users/:id` (Admin)
    - `PUT /api/users/:id/complete-registration` (Usuário)
    - _Requisitos: 1.2, 1.3, 3.1, 3.2_

- [ ] 5. Catálogos (Admin) — Companhias aéreas, bancos e programas
  - [ ] 5.1 Implementar services e CRUD de companhias aéreas e bancos
    - CRUD completo com soft delete (ativo/inativo)
    - Verificação de vínculos ativos ao desativar
    - Rotas: `CRUD /api/airlines`, `CRUD /api/banks`
    - _Requisitos: 16.1, 16.2, 16.3, 16.4_

  - [ ]* 5.2 Escrever testes de propriedade para CRUD de catálogos
    - **Propriedade 8: CRUD de catálogos — round trip**
    - **Valida: Requisitos 16.1, 16.2**

  - [ ] 5.3 Implementar service e CRUD de programas de fidelidade
    - Validação: tipo AIRLINE exige `airlineId`, tipo BANK ignora `airlineId`
    - Rotas: `CRUD /api/programs`
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.4 Escrever testes de propriedade para CRUD de programas
    - **Propriedade 9: CRUD de programas com validação de tipo**
    - **Valida: Requisitos 4.1, 4.2, 4.4**

- [ ] 6. Checkpoint — Autenticação e catálogos
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Contas de fidelidade e preço médio
  - [ ] 7.1 Implementar LoyaltyAccountService
    - `getByUser(userId)` — listar contas do usuário
    - `credit(accountId, miles, cost, tx)` — creditar milhas com custo
    - `debit(accountId, miles, tx)` — debitar milhas
    - `decrementCpf(accountId, tx)` — decrementar CPF disponível
    - Criação automática de conta na primeira operação de um programa
    - _Requisitos: 5.1, 5.4_

  - [ ] 7.2 Implementar AveragePriceService
    - `recalculate(loyaltyAccountId, tx)` — recalcular preço médio atomicamente
    - Fórmula: `totalCost / (miles / 1000)`, retorna 0 se miles === 0
    - _Requisitos: 5.2, 5.3_

  - [ ] 7.3 Implementar rotas e controller de contas de fidelidade
    - `GET /api/loyalty-accounts`, `GET /api/loyalty-accounts/:id`
    - _Requisitos: 5.1, 5.4_

  - [ ]* 7.4 Escrever testes de propriedade para invariante do preço médio
    - **Propriedade 10: Invariante do preço médio**
    - **Valida: Requisitos 5.2, 5.3, 7.4, 8.6, 9.5**

- [ ] 8. Cartões de crédito
  - [ ] 8.1 Implementar service, rotas e controller de cartões
    - CRUD completo com campos de Admin condicionais
    - Rotas: `CRUD /api/cards`
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 8.2 Escrever testes de propriedade para CRUD de cartões
    - **Propriedade 21: CRUD de cartões — round trip**
    - **Valida: Requisitos 6.1, 6.2, 6.3, 6.4**

- [ ] 9. Movimentações — Compra de pontos
  - [ ] 9.1 Implementar TransactionService
    - `create(userId, data)` — registrar movimentação com conversão VM ↔ VT
    - Creditar milhas na conta de fidelidade via `LoyaltyAccountService.credit`
    - Recalcular preço médio via `AveragePriceService.recalculate`
    - Criar registro de `Payment` associado
    - Tudo dentro de `prisma.$transaction()`
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ] 9.2 Implementar rotas e controller de movimentações
    - `POST /api/transactions`, `GET /api/transactions`
    - _Requisitos: 8.1_

  - [ ]* 9.3 Escrever testes de propriedade para conversão VM ↔ VT
    - **Propriedade 11: Conversão VM ↔ VT em movimentações**
    - **Valida: Requisitos 8.2, 8.3, 8.4**

  - [ ]* 9.4 Escrever testes de propriedade para movimentação atualiza saldo
    - **Propriedade 12: Movimentação atualiza saldo e cria pagamento**
    - **Valida: Requisitos 8.1, 8.5, 8.7**

- [ ] 10. Movimentações — Compra bonificada
  - [ ] 10.1 Implementar BonusPurchaseService
    - `create(userId, data)` — registrar compra bonificada
    - Calcular pontos: `pointsPerReal * totalValue`
    - Criar agendamento `BONUS_PURCHASE_CREDIT` com data = `pointsReceiveDate`
    - _Requisitos: 9.1, 9.2, 9.3_

  - [ ] 10.2 Implementar rotas e controller de compras bonificadas
    - `POST /api/bonus-purchases`, `GET /api/bonus-purchases`
    - _Requisitos: 9.1_

  - [ ]* 10.3 Escrever testes de propriedade para cálculo de pontos bonificados
    - **Propriedade 13: Cálculo de pontos de compra bonificada**
    - **Valida: Requisitos 9.1, 9.2, 9.3**

- [ ] 11. Checkpoint — Movimentações básicas
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Transferências
  - [ ] 12.1 Implementar TransferService
    - `create(userId, data)` — registrar transferência
    - Débito imediato no programa de origem via `LoyaltyAccountService.debit`
    - Criar agendamento `TRANSFER_CREDIT` com data = `receiveDate`
    - Calcular milhas bônus: `miles * (bonusPercentage / 100)` e criar agendamento `TRANSFER_BONUS_CREDIT`
    - Calcular custo proporcional: `(miles / 1000) * originAveragePrice` + `cartPurchaseCost` se aplicável
    - Se bumerangue habilitado, criar agendamento `BOOMERANG_RETURN`
    - Criar registro de `Payment` se houver custo
    - Tudo dentro de `prisma.$transaction()`
    - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ] 12.2 Implementar rotas e controller de transferências
    - `POST /api/transfers`, `GET /api/transfers`
    - _Requisitos: 10.1_

  - [ ]* 12.3 Escrever testes de propriedade para débito imediato e agendamento
    - **Propriedade 14: Transferência — débito imediato e agendamento de crédito**
    - **Valida: Requisitos 10.1, 10.2, 10.3**

  - [ ]* 12.4 Escrever testes de propriedade para milhas bônus
    - **Propriedade 15: Cálculo de milhas bônus em transferência**
    - **Valida: Requisitos 10.4, 10.5**

  - [ ]* 12.5 Escrever testes de propriedade para custo proporcional
    - **Propriedade 16: Custo proporcional na transferência**
    - **Valida: Requisitos 10.6, 10.7**

  - [ ]* 12.6 Escrever testes de propriedade para bumerangue
    - **Propriedade 17: Bumerangue cria agendamento de retorno**
    - **Valida: Requisito 10.8**

- [ ] 13. Emissão de passagens
  - [ ] 13.1 Implementar IssuanceService
    - `create(userId, data)` — registrar emissão
    - Calcular `totalCost = (milesUsed / 1000 * averagePrice) + cashPaid`
    - Calcular `savings = realTicketValue - totalCost`
    - Debitar milhas via `LoyaltyAccountService.debit`
    - Decrementar CPF se programa AIRLINE via `LoyaltyAccountService.decrementCpf`
    - Validar saldo suficiente e CPF disponível
    - Criar registro de `Payment`
    - Tudo dentro de `prisma.$transaction()`
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [ ] 13.2 Implementar rotas e controller de emissões
    - `POST /api/issuances`, `GET /api/issuances`
    - _Requisitos: 11.1_

  - [ ]* 13.3 Escrever testes de propriedade para cálculos de emissão
    - **Propriedade 18: Cálculos de emissão**
    - **Valida: Requisitos 11.1, 11.2, 11.3, 11.4, 11.5**

- [ ] 14. Clubes de milhas e sistema de agendamentos
  - [ ] 14.1 Implementar ClubService
    - `create(userId, data)` — registrar clube e gerar agendamentos mensais `CLUB_CHARGE`
    - `processMonthlyCharge(clubId, tx)` — creditar milhas e criar pagamento
    - Gerar agendamentos entre `startDate` e `endDate` baseados no `chargeDay`
    - _Requisitos: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7_

  - [ ] 14.2 Implementar ScheduleService
    - `getPending(userId)` — listar agendamentos pendentes
    - `processDaily()` — cron job que busca agendamentos com `executionDate <= hoje` e status PENDING
    - `execute(scheduleId, tx)` — executar operação conforme `ScheduleType` (club charge, bonus credit, transfer credit, transfer bonus credit, boomerang return)
    - Marcar como COMPLETED em caso de sucesso, registrar erro e manter PENDING em caso de falha
    - _Requisitos: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [ ] 14.3 Implementar rotas e controllers de clubes e agendamentos
    - `CRUD /api/clubs`, `GET /api/schedules`
    - _Requisitos: 7.1, 12.6_

  - [ ] 14.4 Configurar cron job diário (timezone America/Sao_Paulo)
    - Usar `node-cron` ou similar para executar `ScheduleService.processDaily()` diariamente
    - _Requisitos: 12.2_

  - [ ]* 14.5 Escrever testes de propriedade para execução de agendamentos
    - **Propriedade 19: Execução de agendamentos**
    - **Valida: Requisitos 12.3, 12.4**

  - [ ]* 14.6 Escrever testes de propriedade para agendamentos de clube
    - **Propriedade 20: Agendamentos de clube**
    - **Valida: Requisitos 7.1, 7.2, 7.3, 7.5, 7.6, 7.7**

- [ ] 15. Checkpoint — Backend completo
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Formulário de contato (página pública)
  - [ ] 16.1 Implementar service e rota de contato
    - `POST /api/contact` — persistir mensagem no banco (model `ContactMessage`)
    - Validação via `contactFormSchema`
    - _Requisitos: 2.5, 2.6_

  - [ ]* 16.2 Escrever testes de propriedade para formulário de contato
    - **Propriedade 5: Formulário de contato — persistência e validação**
    - **Valida: Requisitos 2.5, 2.6**

- [ ] 17. Dashboard e métricas
  - [ ] 17.1 Implementar DashboardService
    - `getUserDashboard(userId)` — total milhas por programa, preço médio, total investido, total economizado, próximos recebimentos
    - `getAdminDashboard(adminId)` — economia total dos gerenciados, economia global, lista de usuários com resumo
    - _Requisitos: 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3_

  - [ ] 17.2 Implementar rotas e controllers de dashboard e métricas
    - `GET /api/dashboard/user`, `GET /api/dashboard/admin`, `GET /api/metrics/user/:id`
    - _Requisitos: 13.1, 14.1, 15.1_

  - [ ]* 17.3 Escrever testes de propriedade para dashboard do usuário
    - **Propriedade 22: Consistência do dashboard do usuário**
    - **Valida: Requisitos 13.1, 13.3, 13.4**

  - [ ]* 17.4 Escrever testes de propriedade para dashboard do Admin
    - **Propriedade 23: Consistência do dashboard do Admin**
    - **Valida: Requisitos 14.1, 14.2**

- [ ] 18. Checkpoint — Backend + API completa
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Frontend — Setup e páginas públicas
  - [ ] 19.1 Configurar shadcn/ui, React Router, React Query provider e layout base
    - Instalar e configurar shadcn/ui
    - Configurar React Router com rotas públicas e protegidas
    - Criar layout base com header (botão login no canto superior direito) e footer
    - Configurar React Query client
    - _Requisitos: 2.4_

  - [ ] 19.2 Implementar páginas públicas (Landing, Funcionalidades, Contato)
    - `LandingPage` — apresentação do sistema e benefícios
    - `FeaturesPage` — explicação das funcionalidades
    - `ContactPage` — formulário de contato com React Hook Form + Zod (`contactFormSchema`)
    - Mensagens de UI em português BR
    - _Requisitos: 2.1, 2.2, 2.3, 2.5, 2.6_

- [ ] 20. Frontend — Autenticação e cadastro
  - [ ] 20.1 Implementar LoginPage e fluxo de autenticação
    - Formulário de login com React Hook Form + Zod
    - Armazenar tokens (access + refresh) e configurar interceptor para refresh automático
    - Redirect para complete-registration se status PENDING
    - _Requisitos: 1.1, 1.4_

  - [ ] 20.2 Implementar CompleteRegistrationPage
    - Wizard com dados pessoais (nome, CPF, nascimento, email, telefone) e endereço (CEP, estado, cidade, rua, número, complemento, bairro)
    - Componente `CepAutoComplete` — consulta ViaCEP e preenche campos automaticamente
    - Validação de CPF e email no frontend
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 1.5_

- [ ] 21. Frontend — Área do usuário
  - [ ] 21.1 Implementar DashboardPage do usuário
    - Total de milhas por programa, preço médio, total investido, total economizado, próximos recebimentos
    - Hooks: `useUserDashboardQuery`
    - _Requisitos: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 21.2 Implementar LoyaltyAccountsPage
    - Lista de contas de fidelidade com saldo, preço médio e CPFs disponíveis
    - Hooks: `useLoyaltyAccountsQuery`
    - _Requisitos: 5.1, 5.4_

  - [ ] 21.3 Implementar CardsPage
    - CRUD de cartões com formulário React Hook Form + Zod (`cardSchema`)
    - Hooks: `useCardsQuery`, `useCreateCardMutation`, `useUpdateCardMutation`
    - _Requisitos: 6.1, 6.3, 6.4_

  - [ ] 21.4 Implementar ClubsPage
    - CRUD de clubes com formulário React Hook Form + Zod (`clubSchema`)
    - Hooks: `useClubsQuery`, `useCreateClubMutation`
    - _Requisitos: 7.1_

  - [ ] 21.5 Implementar TransactionsPage
    - Registro de movimentação com toggle VM/VT e listagem
    - Hooks: `useTransactionsQuery`, `useCreateTransactionMutation`
    - _Requisitos: 8.1, 8.2, 8.3, 8.4_

  - [ ] 21.6 Implementar BonusPurchasesPage
    - Registro e listagem de compras bonificadas
    - Hooks: `useBonusPurchasesQuery`, `useCreateBonusPurchaseMutation`
    - _Requisitos: 9.1_

  - [ ] 21.7 Implementar TransfersPage
    - Registro de transferência com campos condicionais (bônus, carrinho, bumerangue) e listagem
    - Hooks: `useTransfersQuery`, `useCreateTransferMutation`
    - _Requisitos: 10.1, 10.4, 10.7, 10.8_

  - [ ] 21.8 Implementar IssuancesPage
    - Registro de emissão com cálculo de custo total e economia, e listagem
    - Hooks: `useIssuancesQuery`, `useCreateIssuanceMutation`
    - _Requisitos: 11.1, 11.4, 11.5_

  - [ ] 21.9 Implementar SchedulesPage
    - Listagem de agendamentos pendentes com data prevista e tipo
    - Hooks: `useSchedulesQuery`
    - _Requisitos: 12.6_

- [ ] 22. Frontend — Área do Admin
  - [ ] 22.1 Implementar AdminUsersPage
    - Criar usuário, listar usuários gerenciados, visualizar detalhes
    - Hooks: `useUsersQuery`, `useCreateUserMutation`
    - _Requisitos: 1.2, 1.3, 1.7_

  - [ ] 22.2 Implementar AdminCatalogsPage
    - CRUD de companhias aéreas e bancos com soft delete
    - Hooks: `useAirlinesQuery`, `useBanksQuery` e mutations correspondentes
    - _Requisitos: 16.1, 16.2, 16.3, 16.4_

  - [ ] 22.3 Implementar AdminProgramsPage
    - CRUD de programas com validação condicional por tipo
    - Hooks: `useProgramsQuery`, `useCreateProgramMutation`
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 22.4 Implementar AdminDashboardPage
    - Economia total, economia global, lista de usuários com resumo, drill-down por usuário
    - Hooks: `useAdminDashboardQuery`
    - _Requisitos: 14.1, 14.2, 14.3, 14.4, 15.2_

- [ ] 23. Checkpoint final — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam propriedades universais de corretude
- Código em inglês, UI em português BR, documentação em português BR
- Timezone padrão: America/Sao_Paulo
