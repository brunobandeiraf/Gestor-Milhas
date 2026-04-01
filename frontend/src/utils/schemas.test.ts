import { describe, it, expect } from "vitest";
import { loginSchema, completeRegistrationSchema } from "./schemas";

describe("loginSchema", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "123456" });
    expect(result.success).toBe(true);
  });

  it("should reject empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email format", () => {
    const result = loginSchema.safeParse({ email: "notanemail", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("completeRegistrationSchema", () => {
  const validData = {
    fullName: "João Silva",
    cpf: "52998224725",
    birthDate: "1990-01-15",
    email: "joao@example.com",
    phone: "(11) 99999-9999",
    zipCode: "01001000",
    state: "SP",
    city: "São Paulo",
    street: "Praça da Sé",
    number: "100",
    neighborhood: "Sé",
  };

  it("should accept valid complete registration data", () => {
    const result = completeRegistrationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should accept data with optional complement", () => {
    const result = completeRegistrationSchema.safeParse({ ...validData, complement: "Apto 1" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid CPF", () => {
    const result = completeRegistrationSchema.safeParse({ ...validData, cpf: "11111111111" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = completeRegistrationSchema.safeParse({ ...validData, email: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should reject missing required fields", () => {
    const result = completeRegistrationSchema.safeParse({ fullName: "João" });
    expect(result.success).toBe(false);
  });
});
