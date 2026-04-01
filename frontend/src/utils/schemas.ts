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
