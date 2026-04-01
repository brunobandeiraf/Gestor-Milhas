import { describe, it, expect } from "vitest";
import {
  loginSchema,
  completeRegistrationSchema,
  programSchema,
  cardSchema,
  clubSchema,
  transactionSchema,
  bonusPurchaseSchema,
  transferSchema,
  issuanceSchema,
  contactFormSchema,
} from "./schemas.js";

describe("loginSchema", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-email",
      password: "secret123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("completeRegistrationSchema", () => {
  const validData = {
    fullName: "João Silva",
    cpf: "52998224725",
    birthDate: "1990-01-15T00:00:00.000Z",
    email: "joao@example.com",
    phone: "11999999999",
    zipCode: "01001000",
    state: "SP",
    city: "São Paulo",
    street: "Rua Exemplo",
    number: "123",
    neighborhood: "Centro",
  };

  it("should accept valid registration data", () => {
    const result = completeRegistrationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should accept with optional complement", () => {
    const result = completeRegistrationSchema.safeParse({
      ...validData,
      complement: "Apto 42",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid CPF", () => {
    const result = completeRegistrationSchema.safeParse({
      ...validData,
      cpf: "00000000000",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = completeRegistrationSchema.safeParse({
      ...validData,
      email: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("programSchema", () => {
  it("should accept valid BANK program", () => {
    const result = programSchema.safeParse({
      name: "Livelo",
      type: "BANK",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid AIRLINE program with airlineId", () => {
    const result = programSchema.safeParse({
      name: "Smiles",
      type: "AIRLINE",
      airlineId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("should reject AIRLINE program without airlineId", () => {
    const result = programSchema.safeParse({
      name: "Smiles",
      type: "AIRLINE",
    });
    expect(result.success).toBe(false);
  });
});

describe("cardSchema", () => {
  it("should accept valid card data", () => {
    const result = cardSchema.safeParse({
      bankId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      name: "Nubank Ultravioleta",
      closingDay: 10,
      dueDay: 17,
      creditLimit: 15000,
    });
    expect(result.success).toBe(true);
  });

  it("should reject closingDay > 31", () => {
    const result = cardSchema.safeParse({
      bankId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      name: "Card",
      closingDay: 32,
      dueDay: 17,
      creditLimit: 15000,
    });
    expect(result.success).toBe(false);
  });
});


describe("clubSchema", () => {
  it("should accept valid club data", () => {
    const result = clubSchema.safeParse({
      programId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      plan: "Gold",
      milesPerMonth: 10000,
      monthlyFee: 399.9,
      startDate: "2025-01-01T00:00:00.000Z",
      endDate: "2025-12-31T00:00:00.000Z",
      chargeDay: 5,
      paymentMethod: "CREDIT_CARD",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid paymentMethod", () => {
    const result = clubSchema.safeParse({
      programId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      plan: "Gold",
      milesPerMonth: 10000,
      monthlyFee: 399.9,
      startDate: "2025-01-01T00:00:00.000Z",
      endDate: "2025-12-31T00:00:00.000Z",
      chargeDay: 5,
      paymentMethod: "BITCOIN",
    });
    expect(result.success).toBe(false);
  });
});

describe("transactionSchema", () => {
  it("should accept transaction with totalCost", () => {
    const result = transactionSchema.safeParse({
      programId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      type: "PURCHASE",
      miles: 10000,
      totalCost: 200,
      date: "2025-06-01T00:00:00.000Z",
      paymentMethod: "PIX",
    });
    expect(result.success).toBe(true);
  });

  it("should accept transaction with costPerK", () => {
    const result = transactionSchema.safeParse({
      programId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      type: "PURCHASE",
      miles: 10000,
      costPerK: 20,
      date: "2025-06-01T00:00:00.000Z",
      paymentMethod: "PIX",
    });
    expect(result.success).toBe(true);
  });

  it("should reject transaction without totalCost or costPerK", () => {
    const result = transactionSchema.safeParse({
      programId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      type: "PURCHASE",
      miles: 10000,
      date: "2025-06-01T00:00:00.000Z",
      paymentMethod: "PIX",
    });
    expect(result.success).toBe(false);
  });
});

describe("bonusPurchaseSchema", () => {
  it("should accept valid bonus purchase data", () => {
    const result = bonusPurchaseSchema.safeParse({
      programId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      product: "iPhone 15",
      store: "Amazon",
      pointsPerReal: 10,
      totalValue: 5000,
      purchaseDate: "2025-06-01T00:00:00.000Z",
      productReceiveDate: "2025-06-10T00:00:00.000Z",
      pointsReceiveDate: "2025-07-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("transferSchema", () => {
  it("should accept valid transfer data", () => {
    const result = transferSchema.safeParse({
      originProgramId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      destinationProgramId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      miles: 10000,
      bonusPercentage: 50,
      transferDate: "2025-06-01T00:00:00.000Z",
      receiveDate: "2025-06-05T00:00:00.000Z",
      bonusReceiveDate: "2025-06-10T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("should accept minimal transfer data with defaults", () => {
    const result = transferSchema.safeParse({
      originProgramId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      destinationProgramId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      miles: 10000,
      transferDate: "2025-06-01T00:00:00.000Z",
      receiveDate: "2025-06-05T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bonusPercentage).toBe(0);
      expect(result.data.cartPurchase).toBe(false);
      expect(result.data.boomerang).toBe(false);
    }
  });
});

describe("issuanceSchema", () => {
  it("should accept valid issuance data", () => {
    const result = issuanceSchema.safeParse({
      programId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      date: "2025-06-01T00:00:00.000Z",
      cpfUsed: "52998224725",
      milesUsed: 30000,
      cashPaid: 150,
      passenger: "João Silva",
      realTicketValue: 2500,
      paymentMethod: "CREDIT_CARD",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing passenger", () => {
    const result = issuanceSchema.safeParse({
      programId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      date: "2025-06-01T00:00:00.000Z",
      cpfUsed: "52998224725",
      milesUsed: 30000,
      cashPaid: 150,
      realTicketValue: 2500,
      paymentMethod: "CREDIT_CARD",
    });
    expect(result.success).toBe(false);
  });
});

describe("contactFormSchema", () => {
  it("should accept valid contact form data", () => {
    const result = contactFormSchema.safeParse({
      name: "Maria",
      email: "maria@example.com",
      message: "Gostaria de mais informações.",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = contactFormSchema.safeParse({
      name: "",
      email: "maria@example.com",
      message: "Mensagem",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = contactFormSchema.safeParse({
      name: "Maria",
      email: "invalid",
      message: "Mensagem",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty message", () => {
    const result = contactFormSchema.safeParse({
      name: "Maria",
      email: "maria@example.com",
      message: "",
    });
    expect(result.success).toBe(false);
  });
});
