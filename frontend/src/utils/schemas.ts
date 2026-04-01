import { z } from "zod";
import { isValidCpf } from "./validators";

export const contactFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  message: z.string().min(1, "Mensagem é obrigatória"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// --- Auth ---

export const loginSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// --- Complete Registration ---

export const completeRegistrationSchema = z.object({
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine((val) => isValidCpf(val), { message: "CPF inválido" }),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  zipCode: z.string().min(1, "CEP é obrigatório"),
  state: z.string().min(1, "Estado é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
});

export type CompleteRegistrationFormData = z.infer<typeof completeRegistrationSchema>;

// --- Card ---

export const cardSchema = z.object({
  bankId: z.string().min(1, "Banco é obrigatório"),
  name: z.string().min(1, "Nome do cartão é obrigatório"),
  closingDay: z.coerce.number().min(1).max(31, "Dia inválido"),
  dueDay: z.coerce.number().min(1).max(31, "Dia inválido"),
  creditLimit: z.coerce.number().min(0, "Limite inválido"),
  annualFee: z.coerce.number().min(0).optional().default(0),
});

export type CardFormData = z.infer<typeof cardSchema>;

// --- Club ---

export const clubSchema = z.object({
  programId: z.string().min(1, "Programa é obrigatório"),
  plan: z.string().min(1, "Plano é obrigatório"),
  milesPerMonth: z.coerce.number().min(1, "Milhas por mês é obrigatório"),
  monthlyFee: z.coerce.number().min(0, "Valor mensal inválido"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de fim é obrigatória"),
  chargeDay: z.coerce.number().min(1).max(31, "Dia inválido"),
  paymentMethod: z.enum(["CREDIT_CARD", "PIX", "BANK_TRANSFER", "OTHER"]),
});

export type ClubFormData = z.infer<typeof clubSchema>;

// --- Transaction ---

export const transactionSchema = z.object({
  programId: z.string().min(1, "Programa é obrigatório"),
  type: z.enum(["PURCHASE", "BONUS", "CARD_POINTS", "MANUAL_ADJUST"]),
  miles: z.coerce.number().min(1, "Quantidade de milhas é obrigatória"),
  costValue: z.coerce.number().min(0, "Valor é obrigatório"),
  costMode: z.enum(["VM", "VT"]),
  date: z.string().min(1, "Data é obrigatória"),
  paymentMethod: z.enum(["CREDIT_CARD", "PIX", "BANK_TRANSFER", "OTHER"]),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

// --- Bonus Purchase ---

export const bonusPurchaseSchema = z.object({
  programId: z.string().min(1, "Programa é obrigatório"),
  product: z.string().min(1, "Produto é obrigatório"),
  store: z.string().min(1, "Loja é obrigatória"),
  pointsPerReal: z.coerce.number().min(0, "Pontos por real inválido"),
  totalValue: z.coerce.number().min(0, "Valor total inválido"),
  purchaseDate: z.string().min(1, "Data da compra é obrigatória"),
  productReceiveDate: z.string().min(1, "Data de recebimento do produto é obrigatória"),
  pointsReceiveDate: z.string().min(1, "Data de recebimento dos pontos é obrigatória"),
});

export type BonusPurchaseFormData = z.infer<typeof bonusPurchaseSchema>;

// --- Transfer ---

export const transferSchema = z.object({
  originProgramId: z.string().min(1, "Programa de origem é obrigatório"),
  destinationProgramId: z.string().min(1, "Programa de destino é obrigatório"),
  miles: z.coerce.number().min(1, "Quantidade de milhas é obrigatória"),
  bonusPercentage: z.coerce.number().min(0).optional().default(0),
  transferDate: z.string().min(1, "Data da transferência é obrigatória"),
  receiveDate: z.string().min(1, "Data de recebimento é obrigatória"),
  bonusReceiveDate: z.string().optional(),
  cartPurchase: z.boolean().optional().default(false),
  cartPurchaseCost: z.coerce.number().min(0).optional().default(0),
  boomerang: z.boolean().optional().default(false),
  boomerangMiles: z.coerce.number().min(0).optional(),
  boomerangReturnDate: z.string().optional(),
  paymentMethod: z.enum(["CREDIT_CARD", "PIX", "BANK_TRANSFER", "OTHER"]).optional(),
});

export type TransferFormData = z.infer<typeof transferSchema>;

// --- Issuance ---

export const issuanceSchema = z.object({
  programId: z.string().min(1, "Programa é obrigatório"),
  date: z.string().min(1, "Data é obrigatória"),
  cpfUsed: z.string().min(1, "CPF utilizado é obrigatório"),
  milesUsed: z.coerce.number().min(1, "Milhas usadas é obrigatório"),
  cashPaid: z.coerce.number().min(0, "Valor em dinheiro inválido"),
  locator: z.string().optional(),
  passenger: z.string().min(1, "Passageiro é obrigatório"),
  realTicketValue: z.coerce.number().min(0, "Valor real da passagem inválido"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["CREDIT_CARD", "PIX", "BANK_TRANSFER", "OTHER"]).optional(),
});


export type IssuanceFormData = z.infer<typeof issuanceSchema>;
