import { z } from "zod";
import { isValidCpf } from "./validators.js";

// --- Enums ---

export const PaymentMethodEnum = z.enum([
  "CREDIT_CARD",
  "PIX",
  "BANK_TRANSFER",
  "OTHER",
]);

export const ProgramTypeEnum = z.enum(["BANK", "AIRLINE"]);

export const TransactionTypeEnum = z.enum([
  "PURCHASE",
  "BONUS",
  "CARD_POINTS",
  "MANUAL_ADJUST",
]);

// --- Shared refinements ---

const cpfField = z
  .string({ required_error: "CPF é obrigatório" })
  .refine((val) => isValidCpf(val), { message: "CPF inválido" });

const emailField = z
  .string({ required_error: "Email é obrigatório" })
  .email({ message: "Email inválido" });

// --- Auth Schemas ---

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: "Senha é obrigatória" })
    .min(1, { message: "Senha é obrigatória" }),
});

// --- User Schemas ---

export const completeRegistrationSchema = z.object({
  fullName: z
    .string({ required_error: "Nome completo é obrigatório" })
    .min(1, { message: "Nome completo é obrigatório" }),
  cpf: cpfField,
  birthDate: z
    .string({ required_error: "Data de nascimento é obrigatória" })
    .datetime({ message: "Data de nascimento inválida" }),
  email: emailField,
  phone: z
    .string({ required_error: "Telefone é obrigatório" })
    .min(1, { message: "Telefone é obrigatório" }),
  zipCode: z
    .string({ required_error: "CEP é obrigatório" })
    .min(1, { message: "CEP é obrigatório" }),
  state: z
    .string({ required_error: "Estado é obrigatório" })
    .min(1, { message: "Estado é obrigatório" }),
  city: z
    .string({ required_error: "Cidade é obrigatória" })
    .min(1, { message: "Cidade é obrigatória" }),
  street: z
    .string({ required_error: "Rua é obrigatória" })
    .min(1, { message: "Rua é obrigatória" }),
  number: z
    .string({ required_error: "Número é obrigatório" })
    .min(1, { message: "Número é obrigatório" }),
  complement: z.string().optional(),
  neighborhood: z
    .string({ required_error: "Bairro é obrigatório" })
    .min(1, { message: "Bairro é obrigatório" }),
});


// --- Program Schema ---

export const programSchema = z
  .object({
    name: z
      .string({ required_error: "Nome é obrigatório" })
      .min(1, { message: "Nome é obrigatório" }),
    type: ProgramTypeEnum,
    airlineId: z.string().uuid({ message: "ID da companhia aérea inválido" }).optional().nullable(),
    cpfLimit: z.number().int().min(0, { message: "Limite de CPF deve ser >= 0" }).optional().nullable(),
    active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "AIRLINE") {
        return data.airlineId != null && data.airlineId.length > 0;
      }
      return true;
    },
    {
      message: "Companhia aérea é obrigatória para programas do tipo aéreo",
      path: ["airlineId"],
    }
  );

// --- Card Schema ---

export const cardSchema = z.object({
  bankId: z
    .string({ required_error: "Banco é obrigatório" })
    .uuid({ message: "ID do banco inválido" }),
  name: z
    .string({ required_error: "Nome do cartão é obrigatório" })
    .min(1, { message: "Nome do cartão é obrigatório" }),
  closingDay: z
    .number({ required_error: "Dia de fechamento é obrigatório" })
    .int()
    .min(1, { message: "Dia de fechamento deve ser entre 1 e 31" })
    .max(31, { message: "Dia de fechamento deve ser entre 1 e 31" }),
  dueDay: z
    .number({ required_error: "Dia de vencimento é obrigatório" })
    .int()
    .min(1, { message: "Dia de vencimento deve ser entre 1 e 31" })
    .max(31, { message: "Dia de vencimento deve ser entre 1 e 31" }),
  creditLimit: z
    .number({ required_error: "Limite de crédito é obrigatório" })
    .min(0, { message: "Limite de crédito deve ser >= 0" }),
  annualFee: z.number().min(0, { message: "Anuidade deve ser >= 0" }).optional(),
  active: z.boolean().optional(),
  // Admin-only fields
  minIncome: z.number().min(0, { message: "Renda mínima deve ser >= 0" }).optional().nullable(),
  scoring: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  vipLounge: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// --- Club Schema ---

export const clubSchema = z.object({
  programId: z
    .string({ required_error: "Programa é obrigatório" })
    .uuid({ message: "ID do programa inválido" }),
  plan: z
    .string({ required_error: "Plano é obrigatório" })
    .min(1, { message: "Plano é obrigatório" }),
  milesPerMonth: z
    .number({ required_error: "Milhas por mês é obrigatório" })
    .int()
    .min(1, { message: "Milhas por mês deve ser >= 1" }),
  monthlyFee: z
    .number({ required_error: "Valor mensal é obrigatório" })
    .min(0, { message: "Valor mensal deve ser >= 0" }),
  startDate: z
    .string({ required_error: "Data de início é obrigatória" })
    .datetime({ message: "Data de início inválida" }),
  endDate: z
    .string({ required_error: "Data de fim é obrigatória" })
    .datetime({ message: "Data de fim inválida" }),
  chargeDay: z
    .number({ required_error: "Dia de cobrança é obrigatório" })
    .int()
    .min(1, { message: "Dia de cobrança deve ser entre 1 e 31" })
    .max(31, { message: "Dia de cobrança deve ser entre 1 e 31" }),
  paymentMethod: PaymentMethodEnum,
});

// --- Transaction Schema ---

export const transactionSchema = z
  .object({
    programId: z
      .string({ required_error: "Programa é obrigatório" })
      .uuid({ message: "ID do programa inválido" }),
    type: TransactionTypeEnum,
    miles: z
      .number({ required_error: "Quantidade de milhas é obrigatória" })
      .int()
      .min(1, { message: "Quantidade de milhas deve ser >= 1" }),
    totalCost: z.number().min(0, { message: "Valor total deve ser >= 0" }).optional(),
    costPerK: z.number().min(0, { message: "Valor por milheiro deve ser >= 0" }).optional(),
    date: z
      .string({ required_error: "Data é obrigatória" })
      .datetime({ message: "Data inválida" }),
    paymentMethod: PaymentMethodEnum,
  })
  .refine(
    (data) => data.totalCost != null || data.costPerK != null,
    {
      message: "Informe o valor total ou o valor por milheiro",
      path: ["totalCost"],
    }
  );


// --- Bonus Purchase Schema ---

export const bonusPurchaseSchema = z.object({
  programId: z
    .string({ required_error: "Programa é obrigatório" })
    .uuid({ message: "ID do programa inválido" }),
  product: z
    .string({ required_error: "Produto é obrigatório" })
    .min(1, { message: "Produto é obrigatório" }),
  store: z
    .string({ required_error: "Loja é obrigatória" })
    .min(1, { message: "Loja é obrigatória" }),
  pointsPerReal: z
    .number({ required_error: "Pontos por real é obrigatório" })
    .min(0, { message: "Pontos por real deve ser >= 0" }),
  totalValue: z
    .number({ required_error: "Valor total é obrigatório" })
    .min(0, { message: "Valor total deve ser >= 0" }),
  purchaseDate: z
    .string({ required_error: "Data da compra é obrigatória" })
    .datetime({ message: "Data da compra inválida" }),
  productReceiveDate: z
    .string({ required_error: "Data de recebimento do produto é obrigatória" })
    .datetime({ message: "Data de recebimento do produto inválida" }),
  pointsReceiveDate: z
    .string({ required_error: "Data de recebimento dos pontos é obrigatória" })
    .datetime({ message: "Data de recebimento dos pontos inválida" }),
});

// --- Transfer Schema ---

export const transferSchema = z.object({
  originProgramId: z
    .string({ required_error: "Programa de origem é obrigatório" })
    .uuid({ message: "ID do programa de origem inválido" }),
  destinationProgramId: z
    .string({ required_error: "Programa de destino é obrigatório" })
    .uuid({ message: "ID do programa de destino inválido" }),
  miles: z
    .number({ required_error: "Quantidade de milhas é obrigatória" })
    .int()
    .min(1, { message: "Quantidade de milhas deve ser >= 1" }),
  bonusPercentage: z
    .number()
    .min(0, { message: "Percentual de bônus deve ser >= 0" })
    .optional()
    .default(0),
  transferDate: z
    .string({ required_error: "Data da transferência é obrigatória" })
    .datetime({ message: "Data da transferência inválida" }),
  receiveDate: z
    .string({ required_error: "Data de recebimento é obrigatória" })
    .datetime({ message: "Data de recebimento inválida" }),
  bonusReceiveDate: z
    .string()
    .datetime({ message: "Data de recebimento do bônus inválida" })
    .optional()
    .nullable(),
  cartPurchase: z.boolean().optional().default(false),
  cartPurchaseCost: z
    .number()
    .min(0, { message: "Custo da compra no carrinho deve ser >= 0" })
    .optional()
    .default(0),
  boomerang: z.boolean().optional().default(false),
  boomerangMiles: z.number().int().min(0).optional().nullable(),
  boomerangReturnDate: z
    .string()
    .datetime({ message: "Data de retorno do bumerangue inválida" })
    .optional()
    .nullable(),
});

// --- Issuance Schema ---

export const issuanceSchema = z.object({
  programId: z
    .string({ required_error: "Programa é obrigatório" })
    .uuid({ message: "ID do programa inválido" }),
  date: z
    .string({ required_error: "Data é obrigatória" })
    .datetime({ message: "Data inválida" }),
  cpfUsed: z
    .string({ required_error: "CPF utilizado é obrigatório" })
    .min(1, { message: "CPF utilizado é obrigatório" }),
  milesUsed: z
    .number({ required_error: "Milhas utilizadas é obrigatório" })
    .int()
    .min(1, { message: "Milhas utilizadas deve ser >= 1" }),
  cashPaid: z
    .number({ required_error: "Valor pago em dinheiro é obrigatório" })
    .min(0, { message: "Valor pago em dinheiro deve ser >= 0" }),
  locator: z.string().optional().nullable(),
  passenger: z
    .string({ required_error: "Passageiro é obrigatório" })
    .min(1, { message: "Passageiro é obrigatório" }),
  realTicketValue: z
    .number({ required_error: "Valor real da passagem é obrigatório" })
    .min(0, { message: "Valor real da passagem deve ser >= 0" }),
  notes: z.string().optional().nullable(),
  paymentMethod: PaymentMethodEnum,
});

// --- Contact Form Schema ---

export const contactFormSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .min(1, { message: "Nome é obrigatório" }),
  email: emailField,
  message: z
    .string({ required_error: "Mensagem é obrigatória" })
    .min(1, { message: "Mensagem é obrigatória" }),
});

// --- Type exports ---

export type LoginInput = z.infer<typeof loginSchema>;
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>;
export type ProgramInput = z.infer<typeof programSchema>;
export type CardInput = z.infer<typeof cardSchema>;
export type ClubInput = z.infer<typeof clubSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type BonusPurchaseInput = z.infer<typeof bonusPurchaseSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type IssuanceInput = z.infer<typeof issuanceSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
