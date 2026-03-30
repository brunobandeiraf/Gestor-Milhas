---
inclusion: always
---

# Gestor Milhas — Convenções do Projeto

## Stack Técnica

### Frontend
- React (com TypeScript)
- TailwindCSS para estilização
- shadcn/ui para componentes de UI
- React Query para gerenciamento de dados assíncronos
- React Hook Form + Zod para formulários e validação

### Backend
- Node.js com TypeScript
- Express para API REST
- Prisma ORM para acesso ao banco de dados

### Banco de Dados
- PostgreSQL

### Infraestrutura
- Docker para PostgreSQL
- Docker Compose para orquestração (backend + db)

## Idioma
- Código, variáveis e nomes de arquivos: inglês
- Documentação de specs e steering: português (BR)
- Comentários no código: inglês
- Mensagens de UI: português (BR)

## Estrutura de Pastas
```
gestor-milhas/
├── frontend/          # React app
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── utils/
├── backend/           # Express API
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── middlewares/
│       ├── utils/
│       └── prisma/
├── docker-compose.yml
└── README.md
```

## Convenções de Código
- Usar TypeScript strict mode
- Componentes React como funções (arrow functions)
- Nomes de componentes em PascalCase
- Nomes de arquivos de componentes em PascalCase
- Hooks customizados prefixados com `use`
- API endpoints em kebab-case
- Tabelas do banco em snake_case (Prisma convention)
- Timezone padrão: America/Sao_Paulo

## Regras de Negócio Críticas
- Preço médio SEMPRE recalculado após: compra, transferência, clube, bonificação
- Saldo só muda imediatamente OU quando agendamento executar
- CPF só afeta programas de companhia aérea
- Fórmula preço médio: `valor_total / (milhas / 1000)`
- Economia: `valor_real_passagem - custo_total`
- Custo total emissão: `(milhas/1000 * preço_médio) + valor_dinheiro`
