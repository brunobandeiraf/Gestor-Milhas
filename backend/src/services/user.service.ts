import bcrypt from "bcryptjs";
import prisma from "../prisma/client.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import type { CompleteRegistrationInput } from "../utils/schemas.js";
import type { User } from "../generated/prisma/client.js";
import { generateActivationToken, sendActivationEmail } from "./email.service.js";

export interface CreateUserDTO {
  email: string;
  password: string;
  fullName: string;
  adminId: string;
}

const SALT_ROUNDS = 10;
const ACTIVATION_TOKEN_EXPIRY_MINUTES = 30;

export async function create(data: CreateUserDTO): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ConflictError("Email já cadastrado", "EMAIL_CONFLICT", { field: "email" });
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: "USER",
      registrationStatus: "PENDING",
      adminId: data.adminId,
    },
  });

  // Generate activation token and send email
  const token = generateActivationToken();
  const expiresAt = new Date(Date.now() + ACTIVATION_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await prisma.activationToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  sendActivationEmail(user.email, data.fullName, token).catch((err) => {
    console.error("[User] Falha ao enviar email de ativação:", err);
  });

  return user;
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

export interface UpdateUserDTO {
  fullName?: string;
  email?: string;
  cpf?: string;
  birthDate?: string;
  phone?: string;
  zipCode?: string;
  state?: string;
  city?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
}

export async function update(userId: string, data: UpdateUserDTO): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Usuário não encontrado");
  }

  // Check CPF uniqueness if changing CPF
  if (data.cpf) {
    const cpfOwner = await prisma.user.findUnique({ where: { cpf: data.cpf } });
    if (cpfOwner && cpfOwner.id !== userId) {
      throw new ConflictError("CPF já cadastrado", "CPF_CONFLICT", { field: "cpf" });
    }
  }

  // Check email uniqueness if changing email
  if (data.email && data.email !== user.email) {
    const emailOwner = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailOwner) {
      throw new ConflictError("Email já cadastrado", "EMAIL_CONFLICT", { field: "email" });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.cpf !== undefined) updateData.cpf = data.cpf;
  if (data.birthDate !== undefined) updateData.birthDate = new Date(data.birthDate);
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.street !== undefined) updateData.street = data.street;
  if (data.number !== undefined) updateData.number = data.number;
  if (data.complement !== undefined) updateData.complement = data.complement || null;
  if (data.neighborhood !== undefined) updateData.neighborhood = data.neighborhood;

  return prisma.user.update({ where: { id: userId }, data: updateData });
}

export async function deleteUser(userId: string, adminId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Usuário não encontrado");
  }

  if (user.adminId !== adminId) {
    throw new NotFoundError("Usuário não encontrado");
  }

  if (user.registrationStatus !== "PENDING") {
    throw new ConflictError(
      "Apenas usuários com cadastro pendente podem ser excluídos",
      "DELETE_NOT_ALLOWED",
      { field: "registrationStatus" }
    );
  }

  await prisma.user.delete({ where: { id: userId } });
}

export async function resendActivationEmail(userId: string, adminId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Usuário não encontrado");
  }

  if (user.adminId !== adminId) {
    throw new NotFoundError("Usuário não encontrado");
  }

  if (user.registrationStatus !== "PENDING") {
    throw new ConflictError(
      "Usuário já ativou a conta",
      "ALREADY_ACTIVATED",
      { field: "registrationStatus" }
    );
  }

  // Invalidate previous unused tokens
  await prisma.activationToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  // Generate new token
  const token = generateActivationToken();
  const expiresAt = new Date(Date.now() + ACTIVATION_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await prisma.activationToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  await sendActivationEmail(user.email, user.fullName ?? user.email, token);
}

export async function verifyActivationToken(token: string): Promise<{ email: string }> {
  const activation = await prisma.activationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!activation) {
    throw new NotFoundError("Token de ativação não encontrado");
  }

  if (activation.usedAt) {
    throw new ConflictError("Este link já foi utilizado", "TOKEN_USED", {});
  }

  if (new Date() > activation.expiresAt) {
    throw new ConflictError("Este link expirou. Solicite um novo link", "TOKEN_EXPIRED", {});
  }

  return { email: activation.user.email };
}

export async function activateAccount(token: string, newPassword: string): Promise<User> {
  const activation = await prisma.activationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!activation) {
    throw new NotFoundError("Token de ativação não encontrado");
  }

  if (activation.usedAt) {
    throw new ConflictError("Este link já foi utilizado", "TOKEN_USED", {});
  }

  if (new Date() > activation.expiresAt) {
    throw new ConflictError("Este link expirou. Solicite um novo link", "TOKEN_EXPIRED", {});
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update user password and mark token as used
  const user = await prisma.user.update({
    where: { id: activation.userId },
    data: { passwordHash },
  });

  await prisma.activationToken.update({
    where: { id: activation.id },
    data: { usedAt: new Date() },
  });

  return user;
}

export async function adminValidate(userId: string, data: CompleteRegistrationInput): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Usuário não encontrado");
  }

  // Check CPF uniqueness
  if (data.cpf) {
    const cpfOwner = await prisma.user.findUnique({ where: { cpf: data.cpf } });
    if (cpfOwner && cpfOwner.id !== userId) {
      throw new ConflictError("CPF já cadastrado", "CPF_CONFLICT", { field: "cpf" });
    }
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
