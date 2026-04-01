import bcrypt from "bcryptjs";
import prisma from "../prisma/client.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import type { CompleteRegistrationInput } from "../utils/schemas.js";
import type { User } from "../generated/prisma/client.js";

export interface CreateUserDTO {
  email: string;
  password: string;
  adminId: string;
}

const SALT_ROUNDS = 10;

export async function create(data: CreateUserDTO): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ConflictError("Email já cadastrado", "EMAIL_CONFLICT", { field: "email" });
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: "USER",
      registrationStatus: "PENDING",
      adminId: data.adminId,
    },
  });
}

export async function completeRegistration(
  userId: string,
  data: CompleteRegistrationInput
): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Usuário não encontrado");
  }

  // Check CPF uniqueness
  const cpfOwner = await prisma.user.findUnique({ where: { cpf: data.cpf } });
  if (cpfOwner && cpfOwner.id !== userId) {
    throw new ConflictError("CPF já cadastrado", "CPF_CONFLICT", { field: "cpf" });
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      fullName: data.fullName,
      cpf: data.cpf,
      birthDate: new Date(data.birthDate),
      email: data.email,
      phone: data.phone,
      zipCode: data.zipCode,
      state: data.state,
      city: data.city,
      street: data.street,
      number: data.number,
      complement: data.complement ?? null,
      neighborhood: data.neighborhood,
      registrationStatus: "COMPLETE",
    },
  });
}

export async function findById(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundError("Usuário não encontrado");
  }
  return user;
}

export async function findAll(adminId: string): Promise<User[]> {
  return prisma.user.findMany({ where: { adminId } });
}
