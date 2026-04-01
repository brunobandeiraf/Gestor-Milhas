import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client.js";
import { AuthenticationError } from "../utils/errors.js";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  registrationStatus: string;
}

interface LoginResult {
  accessToken: string;
  refreshToken: string;
}

interface RefreshResult {
  accessToken: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  return secret;
};

const getJwtRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not defined");
  return secret;
};

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, getJwtRefreshSecret(), { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AuthenticationError("Email ou senha inválidos");
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    throw new AuthenticationError("Email ou senha inválidos");
  }

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    registrationStatus: user.registrationStatus,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(user.id);

  return { accessToken, refreshToken };
}

export async function refresh(refreshToken: string): Promise<RefreshResult> {
  try {
    const decoded = jwt.verify(refreshToken, getJwtRefreshSecret()) as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      throw new AuthenticationError("Token inválido ou expirado");
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      registrationStatus: user.registrationStatus,
    };

    const accessToken = generateAccessToken(payload);

    return { accessToken };
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError("Token inválido ou expirado");
  }
}
